import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_curve
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import logging
from datetime import datetime
import os

from .random_forest_model import FraudDetectionRandomForest
from .autoencoder_model import FraudDetectionAutoencoder
from .kmeans_model import FraudDetectionKMeans

class FraudDetectionEnsemble:
    """
    Ensemble model combining Random Forest, Autoencoder, and K-Means
    for comprehensive healthcare fraud detection
    """
    
    def __init__(self, model_name="healthcare_fraud_ensemble", random_state=42):
        self.model_name = model_name
        self.random_state = random_state
        
        # Initialize individual models
        self.rf_model = FraudDetectionRandomForest(
            model_name=f"{model_name}_rf", 
            random_state=random_state
        )
        self.ae_model = FraudDetectionAutoencoder(
            model_name=f"{model_name}_ae", 
            random_state=random_state
        )
        self.kmeans_model = FraudDetectionKMeans(
            model_name=f"{model_name}_kmeans", 
            random_state=random_state
        )
        
        # Ensemble parameters
        self.weights = {'rf': 0.5, 'ae': 0.3, 'kmeans': 0.2}  # Default weights
        self.voting_method = 'weighted'  # 'weighted', 'majority', 'unanimous'
        self.is_trained = False
        self.performance_metrics = {}
        
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def set_weights(self, rf_weight=0.5, ae_weight=0.3, kmeans_weight=0.2):
        """
        Set custom weights for ensemble voting
        """
        total_weight = rf_weight + ae_weight + kmeans_weight
        self.weights = {
            'rf': rf_weight / total_weight,
            'ae': ae_weight / total_weight,
            'kmeans': kmeans_weight / total_weight
        }
        self.logger.info(f"Updated ensemble weights: {self.weights}")
    
    def set_voting_method(self, method='weighted'):
        """
        Set voting method for ensemble predictions
        Options: 'weighted', 'majority', 'unanimous'
        """
        if method not in ['weighted', 'majority', 'unanimous']:
            raise ValueError("Voting method must be 'weighted', 'majority', or 'unanimous'")
        
        self.voting_method = method
        self.logger.info(f"Voting method set to: {method}")
    
    def train(self, X, y, test_size=0.2, optimize_weights=True):
        """
        Train all ensemble models
        """
        self.logger.info("Starting ensemble model training...")
        
        # Split data for training and validation
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state, stratify=y
        )
        
        # Train Random Forest
        self.logger.info("Training Random Forest model...")
        rf_metrics = self.rf_model.train(X_train, y_train, test_size=0.2)
        
        # Train Autoencoder (on normal data only for unsupervised learning)
        self.logger.info("Training Autoencoder model...")
        normal_data = X_train[y_train == 0]  # Only normal transactions
        ae_history = self.ae_model.train(normal_data)
        ae_metrics = self.ae_model.evaluate(X_val, y_val)
        
        # Train K-Means
        self.logger.info("Training K-Means model...")
        kmeans_labels, kmeans_metrics = self.kmeans_model.train(X_train)
        self.kmeans_model.identify_fraud_clusters(X_train, y_train)
        kmeans_eval_metrics = self.kmeans_model.evaluate(X_val, y_val)
        
        # Optimize ensemble weights if requested
        if optimize_weights:
            self.logger.info("Optimizing ensemble weights...")
            self._optimize_weights(X_val, y_val)
        
        # Evaluate ensemble performance
        ensemble_metrics = self.evaluate(X_val, y_val)
        
        # Store individual model metrics
        self.performance_metrics = {
            'rf_metrics': rf_metrics,
            'ae_metrics': ae_metrics,
            'kmeans_metrics': kmeans_eval_metrics,
            'ensemble_metrics': ensemble_metrics,
            'weights': self.weights,
            'voting_method': self.voting_method
        }
        
        self.is_trained = True
        
        self.logger.info("Ensemble training completed!")
        self.logger.info(f"Ensemble F1-Score: {ensemble_metrics['f1_score']:.4f}")
        self.logger.info(f"Ensemble Precision: {ensemble_metrics['precision']:.4f}")
        self.logger.info(f"Ensemble Recall: {ensemble_metrics['recall']:.4f}")
        
        return self.performance_metrics
    
    def _optimize_weights(self, X_val, y_val, n_trials=50):
        """
        Optimize ensemble weights using grid search
        """
        best_f1 = 0
        best_weights = self.weights.copy()
        
        # Generate weight combinations
        weight_combinations = []
        for rf_w in np.linspace(0.2, 0.8, 5):
            for ae_w in np.linspace(0.1, 0.6, 5):
                kmeans_w = 1.0 - rf_w - ae_w
                if kmeans_w >= 0.1 and kmeans_w <= 0.6:
                    weight_combinations.append({'rf': rf_w, 'ae': ae_w, 'kmeans': kmeans_w})
        
        for weights in weight_combinations[:n_trials]:
            self.weights = weights
            
            # Get predictions with current weights
            predictions = self.predict(X_val)
            
            # Calculate F1 score
            f1 = classification_report(y_val, predictions, output_dict=True)['1']['f1-score']
            
            if f1 > best_f1:
                best_f1 = f1
                best_weights = weights.copy()
        
        self.weights = best_weights
        self.logger.info(f"Optimized weights: {self.weights} (F1: {best_f1:.4f})")
    
    def predict(self, X, return_probabilities=False, return_individual_predictions=False):
        """
        Make ensemble predictions
        """
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before making predictions")
        
        # Get predictions from individual models
        rf_pred = self.rf_model.predict(X, return_probabilities=True)
        rf_proba = rf_pred[:, 1] if rf_pred.ndim > 1 else rf_pred
        
        ae_pred, ae_scores = self.ae_model.predict(X, return_reconstruction_error=True)
        # Convert reconstruction errors to probabilities (higher error = higher fraud probability)
        ae_proba = (ae_scores - ae_scores.min()) / (ae_scores.max() - ae_scores.min() + 1e-8)
        
        kmeans_proba = self.kmeans_model.predict_fraud_probability(X)
        
        # Combine predictions based on voting method
        if self.voting_method == 'weighted':
            # Weighted average of probabilities
            ensemble_proba = (
                self.weights['rf'] * rf_proba +
                self.weights['ae'] * ae_proba +
                self.weights['kmeans'] * kmeans_proba
            )
            ensemble_pred = (ensemble_proba > 0.5).astype(int)
            
        elif self.voting_method == 'majority':
            # Majority voting
            rf_binary = (rf_proba > 0.5).astype(int)
            ae_binary = ae_pred
            kmeans_binary = (kmeans_proba > 0.5).astype(int)
            
            votes = rf_binary + ae_binary + kmeans_binary
            ensemble_pred = (votes >= 2).astype(int)
            ensemble_proba = votes / 3.0
            
        elif self.voting_method == 'unanimous':
            # Unanimous voting (all models must agree)
            rf_binary = (rf_proba > 0.5).astype(int)
            ae_binary = ae_pred
            kmeans_binary = (kmeans_proba > 0.5).astype(int)
            
            ensemble_pred = (rf_binary & ae_binary & kmeans_binary).astype(int)
            ensemble_proba = np.minimum.reduce([rf_proba, ae_proba, kmeans_proba])
        
        # Prepare return values
        result = ensemble_pred
        
        if return_probabilities:
            result = (ensemble_pred, ensemble_proba)
        
        if return_individual_predictions:
            individual_preds = {
                'rf_proba': rf_proba,
                'ae_proba': ae_proba,
                'ae_pred': ae_pred,
                'kmeans_proba': kmeans_proba
            }
            
            if return_probabilities:
                result = (ensemble_pred, ensemble_proba, individual_preds)
            else:
                result = (ensemble_pred, individual_preds)
        
        return result
    
    def evaluate(self, X_test, y_test):
        """
        Evaluate ensemble performance
        """
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before evaluation")
        
        # Get ensemble predictions
        predictions, probabilities = self.predict(X_test, return_probabilities=True)
        
        # Calculate metrics
        metrics = {
            'accuracy': np.mean(predictions == y_test),
            'precision': classification_report(y_test, predictions, output_dict=True)['1']['precision'],
            'recall': classification_report(y_test, predictions, output_dict=True)['1']['recall'],
            'f1_score': classification_report(y_test, predictions, output_dict=True)['1']['f1-score'],
            'roc_auc': roc_auc_score(y_test, probabilities),
            'confusion_matrix': confusion_matrix(y_test, predictions).tolist()
        }
        
        return metrics
    
    def get_feature_importance(self, method='rf', top_n=20):
        """
        Get feature importance from the specified model
        """
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before getting feature importance")
        
        if method == 'rf':
            return self.rf_model.get_feature_importance(top_n)
        else:
            raise ValueError("Feature importance only available for Random Forest model")
    
    def analyze_predictions(self, X_test, y_test, save_plots=True, plot_dir="plots"):
        """
        Comprehensive analysis of ensemble predictions
        """
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before analysis")
        
        # Get predictions from all models
        ensemble_pred, ensemble_proba, individual_preds = self.predict(
            X_test, return_probabilities=True, return_individual_predictions=True
        )
        
        # Create plots directory
        if save_plots:
            os.makedirs(plot_dir, exist_ok=True)
        
        # 1. Model Agreement Analysis
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Individual model predictions vs actual
        models = ['RF', 'AE', 'K-Means', 'Ensemble']
        predictions_list = [
            (individual_preds['rf_proba'] > 0.5).astype(int),
            individual_preds['ae_pred'],
            (individual_preds['kmeans_proba'] > 0.5).astype(int),
            ensemble_pred
        ]
        
        for i, (model_name, pred) in enumerate(zip(models, predictions_list)):
            ax = axes[i//2, i%2]
            cm = confusion_matrix(y_test, pred)
            sns.heatmap(cm, annot=True, fmt='d', ax=ax, cmap='Blues')
            ax.set_title(f'{model_name} Confusion Matrix')
            ax.set_xlabel('Predicted')
            ax.set_ylabel('Actual')
        
        plt.tight_layout()
        if save_plots:
            plt.savefig(f"{plot_dir}/confusion_matrices.png", dpi=300, bbox_inches='tight')
        plt.show()
        
        # 2. Probability Distribution Analysis
        plt.figure(figsize=(15, 10))
        
        probabilities = [
            individual_preds['rf_proba'],
            individual_preds['ae_proba'],
            individual_preds['kmeans_proba'],
            ensemble_proba
        ]
        
        for i, (model_name, proba) in enumerate(zip(models, probabilities)):
            plt.subplot(2, 2, i+1)
            
            normal_proba = proba[y_test == 0]
            fraud_proba = proba[y_test == 1]
            
            plt.hist(normal_proba, bins=30, alpha=0.7, label='Normal', density=True)
            plt.hist(fraud_proba, bins=30, alpha=0.7, label='Fraud', density=True)
            plt.xlabel('Fraud Probability')
            plt.ylabel('Density')
            plt.title(f'{model_name} Probability Distribution')
            plt.legend()
            plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        if save_plots:
            plt.savefig(f"{plot_dir}/probability_distributions.png", dpi=300, bbox_inches='tight')
        plt.show()
        
        # 3. ROC Curves Comparison
        plt.figure(figsize=(10, 8))
        
        from sklearn.metrics import roc_curve
        
        for model_name, proba in zip(models, probabilities):
            fpr, tpr, _ = roc_curve(y_test, proba)
            auc = roc_auc_score(y_test, proba)
            plt.plot(fpr, tpr, label=f'{model_name} (AUC = {auc:.3f})')
        
        plt.plot([0, 1], [0, 1], 'k--', label='Random')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curves Comparison')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        if save_plots:
            plt.savefig(f"{plot_dir}/roc_curves.png", dpi=300, bbox_inches='tight')
        plt.show()
        
        # 4. Model Agreement Heatmap
        agreement_matrix = np.zeros((len(models), len(models)))
        
        for i, pred_i in enumerate(predictions_list):
            for j, pred_j in enumerate(predictions_list):
                agreement_matrix[i, j] = np.mean(pred_i == pred_j)
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(agreement_matrix, annot=True, fmt='.3f', 
                   xticklabels=models, yticklabels=models, cmap='YlOrRd')
        plt.title('Model Agreement Matrix')
        
        if save_plots:
            plt.savefig(f"{plot_dir}/model_agreement.png", dpi=300, bbox_inches='tight')
        plt.show()
        
        # 5. Performance Metrics Comparison
        metrics_comparison = {}
        for model_name, pred in zip(models, predictions_list):
            report = classification_report(y_test, pred, output_dict=True)
            metrics_comparison[model_name] = {
                'Precision': report['1']['precision'],
                'Recall': report['1']['recall'],
                'F1-Score': report['1']['f1-score']
            }
        
        metrics_df = pd.DataFrame(metrics_comparison).T
        
        plt.figure(figsize=(10, 6))
        metrics_df.plot(kind='bar', ax=plt.gca())
        plt.title('Performance Metrics Comparison')
        plt.ylabel('Score')
        plt.xticks(rotation=45)
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        if save_plots:
            plt.savefig(f"{plot_dir}/metrics_comparison.png", dpi=300, bbox_inches='tight')
        plt.show()
        
        return {
            'individual_predictions': individual_preds,
            'ensemble_predictions': ensemble_pred,
            'ensemble_probabilities': ensemble_proba,
            'metrics_comparison': metrics_comparison
        }
    
    def save_model(self, filepath=None):
        """
        Save the entire ensemble model
        """
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before saving")
        
        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"models/{self.model_name}_{timestamp}"
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save individual models
        rf_path = self.rf_model.save_model(f"{filepath}_rf.joblib")
        ae_path = self.ae_model.save_model(f"{filepath}_ae")
        kmeans_path = self.kmeans_model.save_model(f"{filepath}_kmeans.joblib")
        
        # Save ensemble metadata
        ensemble_data = {
            'weights': self.weights,
            'voting_method': self.voting_method,
            'performance_metrics': self.performance_metrics,
            'model_name': self.model_name,
            'rf_model_path': rf_path,
            'ae_model_path': ae_path,
            'kmeans_model_path': kmeans_path,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(ensemble_data, f"{filepath}_ensemble.joblib")
        
        self.logger.info(f"Ensemble model saved to {filepath}")
        
        return filepath
    
    def load_model(self, filepath):
        """
        Load a previously trained ensemble model
        """
        # Load ensemble metadata
        ensemble_data = joblib.load(f"{filepath}_ensemble.joblib")
        
        # Load individual models
        self.rf_model.load_model(ensemble_data['rf_model_path'])
        self.ae_model.load_model(ensemble_data['ae_model_path'])
        self.kmeans_model.load_model(ensemble_data['kmeans_model_path'])
        
        # Restore ensemble settings
        self.weights = ensemble_data['weights']
        self.voting_method = ensemble_data['voting_method']
        self.performance_metrics = ensemble_data['performance_metrics']
        self.model_name = ensemble_data['model_name']
        self.is_trained = True
        
        self.logger.info(f"Ensemble model loaded from {filepath}")
        if 'ensemble_metrics' in self.performance_metrics:
            metrics = self.performance_metrics['ensemble_metrics']
            self.logger.info(f"Ensemble performance - F1: {metrics['f1_score']:.4f}, "
                            f"Precision: {metrics['precision']:.4f}, "
                            f"Recall: {metrics['recall']:.4f}")
        
        return self.performance_metrics

