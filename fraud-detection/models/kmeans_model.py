import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import logging
from datetime import datetime
import os

class FraudDetectionKMeans:
    """
    K-Means clustering model for healthcare fraud detection
    Uses unsupervised clustering to identify suspicious patterns and outliers
    """
    
    def __init__(self, model_name="healthcare_fraud_kmeans", random_state=42):
        self.model_name = model_name
        self.random_state = random_state
        self.model = None
        self.scaler = StandardScaler()
        self.pca = None
        self.feature_names = []
        self.is_trained = False
        self.cluster_profiles = {}
        self.fraud_clusters = []
        self.performance_metrics = {}
        
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def prepare_features(self, df):
        """
        Prepare and engineer features for clustering analysis
        """
        features = df.copy()
        
        # Temporal features
        if 'claim_date' in features.columns:
            features['claim_date'] = pd.to_datetime(features['claim_date'])
            features['claim_hour'] = features['claim_date'].dt.hour
            features['claim_day_of_week'] = features['claim_date'].dt.dayofweek
            features['claim_month'] = features['claim_date'].dt.month
            features['is_weekend'] = (features['claim_day_of_week'] >= 5).astype(int)
            features['is_night_claim'] = ((features['claim_hour'] < 6) | (features['claim_hour'] > 22)).astype(int)
        
        # Financial features
        if 'claim_amount' in features.columns:
            features['claim_amount_log'] = np.log1p(features['claim_amount'])
            features['claim_amount_percentile'] = features['claim_amount'].rank(pct=True)
        
        # Provider behavior features
        if 'provider_id' in features.columns:
            provider_stats = features.groupby('provider_id').agg({
                'claim_amount': ['count', 'mean', 'std', 'sum', 'min', 'max'],
                'patient_id': 'nunique' if 'patient_id' in features.columns else 'count'
            }).fillna(0)
            
            provider_stats.columns = ['provider_claim_count', 'provider_avg_amount', 
                                    'provider_amount_std', 'provider_total_amount',
                                    'provider_min_amount', 'provider_max_amount',
                                    'provider_unique_patients']
            
            features = features.merge(provider_stats, left_on='provider_id', right_index=True, how='left')
            
            # Provider risk indicators
            features['provider_amount_range'] = features['provider_max_amount'] - features['provider_min_amount']
            features['provider_amount_cv'] = features['provider_amount_std'] / (features['provider_avg_amount'] + 1e-6)
            features['provider_claims_per_patient'] = features['provider_claim_count'] / (features['provider_unique_patients'] + 1)
            features['provider_volume_percentile'] = features['provider_claim_count'].rank(pct=True)
        
        # Patient behavior features
        if 'patient_id' in features.columns:
            patient_stats = features.groupby('patient_id').agg({
                'claim_amount': ['count', 'mean', 'sum', 'std'],
                'provider_id': 'nunique'
            }).fillna(0)
            
            patient_stats.columns = ['patient_claim_count', 'patient_avg_amount', 
                                   'patient_total_amount', 'patient_amount_std',
                                   'patient_unique_providers']
            
            features = features.merge(patient_stats, left_on='patient_id', right_index=True, how='left')
            
            # Patient behavior patterns
            features['patient_provider_diversity'] = features['patient_unique_providers'] / (features['patient_claim_count'] + 1)
            features['patient_spending_consistency'] = 1 / (features['patient_amount_std'] + 1)
            features['patient_activity_level'] = features['patient_claim_count'].rank(pct=True)
        
        # Diagnosis and procedure patterns
        if 'diagnosis_code' in features.columns:
            diag_counts = features['diagnosis_code'].value_counts()
            features['diagnosis_frequency'] = features['diagnosis_code'].map(diag_counts)
            features['diagnosis_rarity'] = 1 / (features['diagnosis_frequency'] + 1)
        
        if 'procedure_code' in features.columns:
            proc_counts = features['procedure_code'].value_counts()
            features['procedure_frequency'] = features['procedure_code'].map(proc_counts)
            
            if 'claim_amount' in features.columns:
                proc_avg_cost = features.groupby('procedure_code')['claim_amount'].mean()
                features['procedure_avg_cost'] = features['procedure_code'].map(proc_avg_cost)
                features['amount_deviation_from_procedure_avg'] = np.abs(
                    features['claim_amount'] - features['procedure_avg_cost']
                ) / (features['procedure_avg_cost'] + 1e-6)
        
        # Time-based clustering features
        if 'claim_date' in features.columns:
            # Time since last claim for same patient
            features_sorted = features.sort_values(['patient_id', 'claim_date'])
            features_sorted['days_since_last_claim'] = features_sorted.groupby('patient_id')['claim_date'].diff().dt.days
            features = features.merge(
                features_sorted[['patient_id', 'claim_date', 'days_since_last_claim']], 
                on=['patient_id', 'claim_date'], 
                how='left'
            )
            features['days_since_last_claim'] = features['days_since_last_claim'].fillna(0)
            
            # Claim frequency patterns
            features['claims_same_day'] = features.groupby(['patient_id', features['claim_date'].dt.date])['claim_amount'].transform('count')
            features['claims_same_week'] = features.groupby(['patient_id', features['claim_date'].dt.isocalendar().week])['claim_amount'].transform('count')
        
        # Geographic patterns
        if 'provider_location' in features.columns and 'patient_location' in features.columns:
            features['location_mismatch'] = (features['provider_location'] != features['patient_location']).astype(int)
            
            # Location combination frequency
            location_combinations = features.groupby(['provider_location', 'patient_location']).size()
            features['location_combination_frequency'] = features.apply(
                lambda row: location_combinations.get((row['provider_location'], row['patient_location']), 0), 
                axis=1
            )
            features['location_combination_rarity'] = 1 / (features['location_combination_frequency'] + 1)
        
        # Network analysis features
        if 'provider_id' in features.columns and 'patient_id' in features.columns:
            # Provider-patient network density
            provider_patient_pairs = features.groupby(['provider_id', 'patient_id']).size()
            features['provider_patient_interaction_count'] = features.apply(
                lambda row: provider_patient_pairs.get((row['provider_id'], row['patient_id']), 0), 
                axis=1
            )
        
        # Statistical features for clustering
        numeric_cols = features.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if col != 'is_fraud' and features[col].std() > 0:
                # Z-score normalization
                features[f'{col}_zscore'] = (features[col] - features[col].mean()) / features[col].std()
                
                # Percentile ranking
                features[f'{col}_percentile'] = features[col].rank(pct=True)
        
        return features
    
    def find_optimal_clusters(self, X, max_clusters=10, method='elbow'):
        """
        Find optimal number of clusters using various methods
        """
        self.logger.info("Finding optimal number of clusters...")
        
        inertias = []
        silhouette_scores = []
        calinski_scores = []
        davies_bouldin_scores = []
        
        K_range = range(2, max_clusters + 1)
        
        for k in K_range:
            kmeans = KMeans(n_clusters=k, random_state=self.random_state, n_init=10)
            cluster_labels = kmeans.fit_predict(X)
            
            inertias.append(kmeans.inertia_)
            silhouette_scores.append(silhouette_score(X, cluster_labels))
            calinski_scores.append(calinski_harabasz_score(X, cluster_labels))
            davies_bouldin_scores.append(davies_bouldin_score(X, cluster_labels))
        
        # Find optimal k using different methods
        if method == 'elbow':
            # Elbow method - find the point of maximum curvature
            diffs = np.diff(inertias)
            diffs2 = np.diff(diffs)
            optimal_k = K_range[np.argmin(diffs2) + 1]
        elif method == 'silhouette':
            optimal_k = K_range[np.argmax(silhouette_scores)]
        elif method == 'calinski':
            optimal_k = K_range[np.argmax(calinski_scores)]
        elif method == 'davies_bouldin':
            optimal_k = K_range[np.argmin(davies_bouldin_scores)]
        else:
            # Default to silhouette method
            optimal_k = K_range[np.argmax(silhouette_scores)]
        
        self.logger.info(f"Optimal number of clusters ({method} method): {optimal_k}")
        
        # Plot the metrics
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        
        ax1.plot(K_range, inertias, 'bo-')
        ax1.set_xlabel('Number of Clusters (k)')
        ax1.set_ylabel('Inertia')
        ax1.set_title('Elbow Method')
        ax1.axvline(optimal_k if method == 'elbow' else K_range[np.argmin(np.diff(np.diff(inertias))) + 1], 
                   color='red', linestyle='--', alpha=0.7)
        
        ax2.plot(K_range, silhouette_scores, 'go-')
        ax2.set_xlabel('Number of Clusters (k)')
        ax2.set_ylabel('Silhouette Score')
        ax2.set_title('Silhouette Analysis')
        ax2.axvline(K_range[np.argmax(silhouette_scores)], color='red', linestyle='--', alpha=0.7)
        
        ax3.plot(K_range, calinski_scores, 'mo-')
        ax3.set_xlabel('Number of Clusters (k)')
        ax3.set_ylabel('Calinski-Harabasz Score')
        ax3.set_title('Calinski-Harabasz Index')
        ax3.axvline(K_range[np.argmax(calinski_scores)], color='red', linestyle='--', alpha=0.7)
        
        ax4.plot(K_range, davies_bouldin_scores, 'co-')
        ax4.set_xlabel('Number of Clusters (k)')
        ax4.set_ylabel('Davies-Bouldin Score')
        ax4.set_title('Davies-Bouldin Index')
        ax4.axvline(K_range[np.argmin(davies_bouldin_scores)], color='red', linestyle='--', alpha=0.7)
        
        plt.tight_layout()
        plt.show()
        
        return optimal_k, {
            'inertias': inertias,
            'silhouette_scores': silhouette_scores,
            'calinski_scores': calinski_scores,
            'davies_bouldin_scores': davies_bouldin_scores
        }
    
    def train(self, X, n_clusters=None, use_pca=True, pca_components=0.95):
        """
        Train the K-Means clustering model
        """
        self.logger.info("Starting K-Means clustering training...")
        
        # Prepare features
        X_processed = self.prepare_features(X)
        
        # Select only numeric features
        numeric_columns = X_processed.select_dtypes(include=[np.number]).columns
        X_processed = X_processed[numeric_columns]
        
        # Remove any remaining NaN values
        X_processed = X_processed.fillna(0)
        
        # Store feature names
        self.feature_names = list(X_processed.columns)
        
        # Scale the features
        X_scaled = self.scaler.fit_transform(X_processed)
        
        # Apply PCA for dimensionality reduction if requested
        if use_pca:
            self.pca = PCA(n_components=pca_components, random_state=self.random_state)
            X_scaled = self.pca.fit_transform(X_scaled)
            self.logger.info(f"PCA reduced dimensions from {len(self.feature_names)} to {X_scaled.shape[1]}")
            self.logger.info(f"Explained variance ratio: {self.pca.explained_variance_ratio_.sum():.4f}")
        
        # Find optimal number of clusters if not specified
        if n_clusters is None:
            n_clusters, cluster_metrics = self.find_optimal_clusters(X_scaled)
        
        # Train K-Means model
        self.model = KMeans(
            n_clusters=n_clusters,
            random_state=self.random_state,
            n_init=20,
            max_iter=300
        )
        
        cluster_labels = self.model.fit_predict(X_scaled)
        
        # Calculate cluster profiles
        self.cluster_profiles = self._calculate_cluster_profiles(X_processed, cluster_labels)
        
        # Calculate clustering metrics
        self.performance_metrics = {
            'n_clusters': n_clusters,
            'inertia': self.model.inertia_,
            'silhouette_score': silhouette_score(X_scaled, cluster_labels),
            'calinski_harabasz_score': calinski_harabasz_score(X_scaled, cluster_labels),
            'davies_bouldin_score': davies_bouldin_score(X_scaled, cluster_labels),
            'cluster_sizes': np.bincount(cluster_labels).tolist()
        }
        
        self.is_trained = True
        
        self.logger.info("Training completed!")
        self.logger.info(f"Number of clusters: {n_clusters}")
        self.logger.info(f"Silhouette score: {self.performance_metrics['silhouette_score']:.4f}")
        self.logger.info(f"Calinski-Harabasz score: {self.performance_metrics['calinski_harabasz_score']:.2f}")
        self.logger.info(f"Davies-Bouldin score: {self.performance_metrics['davies_bouldin_score']:.4f}")
        
        return cluster_labels, self.performance_metrics
    
    def _calculate_cluster_profiles(self, X, cluster_labels):
        """
        Calculate statistical profiles for each cluster
        """
        profiles = {}
        
        for cluster_id in np.unique(cluster_labels):
            cluster_data = X[cluster_labels == cluster_id]
            
            profile = {
                'size': len(cluster_data),
                'percentage': len(cluster_data) / len(X) * 100,
                'mean_values': cluster_data.mean().to_dict(),
                'std_values': cluster_data.std().to_dict(),
                'median_values': cluster_data.median().to_dict()
            }
            
            profiles[cluster_id] = profile
        
        return profiles
    
    def identify_fraud_clusters(self, X, y, threshold_percentile=90):
        """
        Identify clusters that are likely to contain fraudulent cases
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before identifying fraud clusters")
        
        cluster_labels = self.predict(X)
        
        # Calculate fraud rate for each cluster
        cluster_fraud_rates = {}
        for cluster_id in np.unique(cluster_labels):
            cluster_mask = cluster_labels == cluster_id
            fraud_rate = y[cluster_mask].mean() if cluster_mask.sum() > 0 else 0
            cluster_fraud_rates[cluster_id] = fraud_rate
        
        # Identify clusters with high fraud rates
        fraud_rate_threshold = np.percentile(list(cluster_fraud_rates.values()), threshold_percentile)
        self.fraud_clusters = [
            cluster_id for cluster_id, fraud_rate in cluster_fraud_rates.items()
            if fraud_rate >= fraud_rate_threshold
        ]
        
        self.logger.info(f"Identified {len(self.fraud_clusters)} high-risk clusters: {self.fraud_clusters}")
        self.logger.info(f"Fraud rate threshold: {fraud_rate_threshold:.4f}")
        
        # Update performance metrics
        self.performance_metrics['cluster_fraud_rates'] = cluster_fraud_rates
        self.performance_metrics['fraud_clusters'] = self.fraud_clusters
        self.performance_metrics['fraud_rate_threshold'] = fraud_rate_threshold
        
        return self.fraud_clusters, cluster_fraud_rates
    
    def predict(self, X, return_distances=False):
        """
        Predict cluster assignments for new data
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        # Prepare features
        X_processed = self.prepare_features(X)
        
        # Select only the features used during training
        X_processed = X_processed[self.feature_names]
        
        # Fill NaN values
        X_processed = X_processed.fillna(0)
        
        # Scale features
        X_scaled = self.scaler.transform(X_processed)
        
        # Apply PCA if used during training
        if self.pca is not None:
            X_scaled = self.pca.transform(X_scaled)
        
        # Predict clusters
        cluster_labels = self.model.predict(X_scaled)
        
        if return_distances:
            distances = self.model.transform(X_scaled)
            return cluster_labels, distances
        else:
            return cluster_labels
    
    def predict_fraud_probability(self, X):
        """
        Predict fraud probability based on cluster membership
        """
        if not self.fraud_clusters:
            raise ValueError("Fraud clusters must be identified before predicting fraud probability")
        
        cluster_labels = self.predict(X)
        
        # Calculate fraud probability based on cluster fraud rates
        fraud_probabilities = np.zeros(len(cluster_labels))
        
        for i, cluster_id in enumerate(cluster_labels):
            if cluster_id in self.performance_metrics['cluster_fraud_rates']:
                fraud_probabilities[i] = self.performance_metrics['cluster_fraud_rates'][cluster_id]
        
        return fraud_probabilities
    
    def evaluate(self, X_test, y_test):
        """
        Evaluate clustering performance for fraud detection
        """
        if not self.fraud_clusters:
            self.logger.warning("Fraud clusters not identified. Using all clusters as potential fraud indicators.")
            self.fraud_clusters = list(range(self.model.n_clusters))
        
        cluster_labels = self.predict(X_test)
        
        # Predict fraud based on cluster membership
        fraud_predictions = np.isin(cluster_labels, self.fraud_clusters).astype(int)
        
        # Calculate metrics
        self.performance_metrics.update({
            'test_accuracy': np.mean(fraud_predictions == y_test),
            'test_precision': classification_report(y_test, fraud_predictions, output_dict=True)['1']['precision'],
            'test_recall': classification_report(y_test, fraud_predictions, output_dict=True)['1']['recall'],
            'test_f1_score': classification_report(y_test, fraud_predictions, output_dict=True)['1']['f1-score'],
            'test_confusion_matrix': confusion_matrix(y_test, fraud_predictions).tolist()
        })
        
        # Calculate ROC-AUC using fraud probabilities
        fraud_probabilities = self.predict_fraud_probability(X_test)
        if len(np.unique(y_test)) > 1:  # Ensure both classes are present
            self.performance_metrics['test_roc_auc'] = roc_auc_score(y_test, fraud_probabilities)
        
        self.logger.info("Evaluation completed!")
        self.logger.info(f"Test Accuracy: {self.performance_metrics['test_accuracy']:.4f}")
        self.logger.info(f"Test Precision: {self.performance_metrics['test_precision']:.4f}")
        self.logger.info(f"Test Recall: {self.performance_metrics['test_recall']:.4f}")
        self.logger.info(f"Test F1-Score: {self.performance_metrics['test_f1_score']:.4f}")
        
        return self.performance_metrics
    
    def plot_clusters(self, X, y=None, save_path=None):
        """
        Visualize clusters using PCA
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before plotting")
        
        # Prepare and scale data
        X_processed = self.prepare_features(X)
        X_processed = X_processed[self.feature_names].fillna(0)
        X_scaled = self.scaler.transform(X_processed)
        
        # Apply PCA for visualization (2D)
        pca_viz = PCA(n_components=2, random_state=self.random_state)
        X_pca = pca_viz.fit_transform(X_scaled)
        
        # Get cluster labels
        cluster_labels = self.predict(X)
        
        # Create the plot
        plt.figure(figsize=(12, 8))
        
        # Plot clusters
        scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=cluster_labels, cmap='tab10', alpha=0.6)
        
        # Plot cluster centers (transform to PCA space)
        if self.pca is not None:
            centers_pca = pca_viz.transform(self.pca.inverse_transform(self.model.cluster_centers_))
        else:
            centers_pca = pca_viz.transform(self.model.cluster_centers_)
        
        plt.scatter(centers_pca[:, 0], centers_pca[:, 1], c='red', marker='x', s=200, linewidths=3)
        
        # Highlight fraud clusters
        if self.fraud_clusters:
            fraud_mask = np.isin(cluster_labels, self.fraud_clusters)
            plt.scatter(X_pca[fraud_mask, 0], X_pca[fraud_mask, 1], 
                       facecolors='none', edgecolors='red', s=50, linewidths=2, alpha=0.8)
        
        plt.xlabel(f'First Principal Component ({pca_viz.explained_variance_ratio_[0]:.2%} variance)')
        plt.ylabel(f'Second Principal Component ({pca_viz.explained_variance_ratio_[1]:.2%} variance)')
        plt.title('K-Means Clustering Results (PCA Visualization)')
        plt.colorbar(scatter, label='Cluster')
        plt.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            self.logger.info(f"Cluster plot saved to {save_path}")
        
        plt.show()
    
    def save_model(self, filepath=None):
        """
        Save the trained model and preprocessing components
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"models/{self.model_name}_{timestamp}.joblib"
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'pca': self.pca,
            'feature_names': self.feature_names,
            'cluster_profiles': self.cluster_profiles,
            'fraud_clusters': self.fraud_clusters,
            'performance_metrics': self.performance_metrics,
            'model_name': self.model_name,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")
        
        return filepath
    
    def load_model(self, filepath):
        """
        Load a previously trained model
        """
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.pca = model_data['pca']
        self.feature_names = model_data['feature_names']
        self.cluster_profiles = model_data['cluster_profiles']
        self.fraud_clusters = model_data['fraud_clusters']
        self.performance_metrics = model_data['performance_metrics']
        self.model_name = model_data['model_name']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")
        if 'test_f1_score' in self.performance_metrics:
            self.logger.info(f"Model performance - F1: {self.performance_metrics['test_f1_score']:.4f}, "
                            f"Precision: {self.performance_metrics['test_precision']:.4f}, "
                            f"Recall: {self.performance_metrics['test_recall']:.4f}")
        
        return self.performance_metrics

