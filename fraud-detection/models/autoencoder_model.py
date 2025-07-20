import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import logging
from datetime import datetime
import os

class FraudDetectionAutoencoder:
    """
    Autoencoder model for healthcare fraud detection using unsupervised learning
    Detects anomalies in healthcare claims and billing patterns
    """
    
    def __init__(self, model_name="healthcare_fraud_autoencoder", random_state=42):
        self.model_name = model_name
        self.random_state = random_state
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.is_trained = False
        self.threshold = None
        self.performance_metrics = {}
        self.history = None
        
        # Set random seeds for reproducibility
        tf.random.set_seed(random_state)
        np.random.seed(random_state)
        
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def prepare_features(self, df):
        """
        Prepare and engineer features for anomaly detection
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
            features['claim_amount_normalized'] = (features['claim_amount'] - features['claim_amount'].mean()) / features['claim_amount'].std()
        
        # Provider aggregation features
        if 'provider_id' in features.columns:
            provider_stats = features.groupby('provider_id').agg({
                'claim_amount': ['count', 'mean', 'std', 'sum', 'median'],
                'patient_id': 'nunique' if 'patient_id' in features.columns else 'count'
            }).fillna(0)
            
            provider_stats.columns = ['provider_claim_count', 'provider_avg_amount', 
                                    'provider_amount_std', 'provider_total_amount',
                                    'provider_median_amount', 'provider_unique_patients']
            
            features = features.merge(provider_stats, left_on='provider_id', right_index=True, how='left')
            
            # Provider risk ratios
            features['provider_amount_cv'] = features['provider_amount_std'] / (features['provider_avg_amount'] + 1e-6)
            features['provider_claims_per_patient'] = features['provider_claim_count'] / (features['provider_unique_patients'] + 1)
            features['provider_amount_vs_median'] = features['claim_amount'] / (features['provider_median_amount'] + 1e-6)
        
        # Patient aggregation features
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
            features['patient_amount_consistency'] = 1 / (features['patient_amount_std'] + 1)
        
        # Time-based patterns
        if 'claim_date' in features.columns:
            # Claims frequency in time windows
            features['claims_same_day'] = features.groupby(['patient_id', features['claim_date'].dt.date])['claim_amount'].transform('count')
            features['claims_same_week'] = features.groupby(['patient_id', features['claim_date'].dt.isocalendar().week])['claim_amount'].transform('count')
            features['claims_same_month'] = features.groupby(['patient_id', features['claim_date'].dt.month])['claim_amount'].transform('count')
        
        # Diagnosis and procedure patterns
        if 'diagnosis_code' in features.columns:
            # Diagnosis frequency
            diag_counts = features['diagnosis_code'].value_counts()
            features['diagnosis_frequency'] = features['diagnosis_code'].map(diag_counts)
            features['is_rare_diagnosis'] = (features['diagnosis_frequency'] < diag_counts.quantile(0.1)).astype(int)
        
        if 'procedure_code' in features.columns:
            # Procedure frequency and cost patterns
            proc_counts = features['procedure_code'].value_counts()
            features['procedure_frequency'] = features['procedure_code'].map(proc_counts)
            
            if 'claim_amount' in features.columns:
                proc_avg_cost = features.groupby('procedure_code')['claim_amount'].mean()
                features['procedure_avg_cost'] = features['procedure_code'].map(proc_avg_cost)
                features['amount_vs_procedure_avg'] = features['claim_amount'] / (features['procedure_avg_cost'] + 1e-6)
        
        # Geographic and location features
        if 'provider_location' in features.columns and 'patient_location' in features.columns:
            features['location_mismatch'] = (features['provider_location'] != features['patient_location']).astype(int)
            
            # Distance proxy (simplified)
            location_combinations = features.groupby(['provider_location', 'patient_location']).size()
            features['location_combination_frequency'] = features.apply(
                lambda row: location_combinations.get((row['provider_location'], row['patient_location']), 0), 
                axis=1
            )
        
        # Duplicate and repetition patterns
        duplicate_cols = ['patient_id', 'provider_id', 'diagnosis_code', 'procedure_code']
        available_cols = [col for col in duplicate_cols if col in features.columns]
        
        if len(available_cols) >= 2:
            features['duplicate_claim_count'] = features.groupby(available_cols).cumcount() + 1
            features['is_duplicate_claim'] = (features['duplicate_claim_count'] > 1).astype(int)
        
        # Statistical outlier features
        numeric_cols = features.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if col != 'is_fraud' and features[col].std() > 0:  # Avoid division by zero
                z_score = np.abs((features[col] - features[col].mean()) / features[col].std())
                features[f'{col}_z_score'] = z_score
                features[f'{col}_is_outlier'] = (z_score > 3).astype(int)
        
        return features
    
    def build_autoencoder(self, input_dim, encoding_dim=None, hidden_layers=None):
        """
        Build the autoencoder architecture
        """
        if encoding_dim is None:
            encoding_dim = max(2, input_dim // 4)  # Compress to 1/4 of input size
        
        if hidden_layers is None:
            hidden_layers = [input_dim // 2, encoding_dim * 2]
        
        # Input layer
        input_layer = keras.Input(shape=(input_dim,))
        
        # Encoder
        encoded = input_layer
        for units in hidden_layers:
            encoded = layers.Dense(units, activation='relu')(encoded)
            encoded = layers.Dropout(0.2)(encoded)
        
        # Bottleneck layer
        encoded = layers.Dense(encoding_dim, activation='relu', name='bottleneck')(encoded)
        
        # Decoder
        decoded = encoded
        for units in reversed(hidden_layers):
            decoded = layers.Dense(units, activation='relu')(decoded)
            decoded = layers.Dropout(0.2)(decoded)
        
        # Output layer
        decoded = layers.Dense(input_dim, activation='linear')(decoded)
        
        # Create the autoencoder model
        autoencoder = keras.Model(input_layer, decoded)
        
        # Compile the model
        autoencoder.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return autoencoder
    
    def train(self, X, validation_split=0.2, epochs=100, batch_size=32, 
              early_stopping_patience=10, reduce_lr_patience=5):
        """
        Train the autoencoder on normal (non-fraudulent) data
        """
        self.logger.info("Starting Autoencoder training...")
        
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
        
        # Build the autoencoder
        input_dim = X_scaled.shape[1]
        self.model = self.build_autoencoder(input_dim)
        
        self.logger.info(f"Autoencoder architecture:")
        self.model.summary()
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=early_stopping_patience,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=reduce_lr_patience,
                min_lr=1e-6
            )
        ]
        
        # Train the model
        self.history = self.model.fit(
            X_scaled, X_scaled,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=callbacks,
            verbose=1
        )
        
        # Calculate reconstruction errors on training data
        X_pred = self.model.predict(X_scaled)
        reconstruction_errors = np.mean(np.square(X_scaled - X_pred), axis=1)
        
        # Set threshold as 95th percentile of reconstruction errors
        self.threshold = np.percentile(reconstruction_errors, 95)
        
        self.is_trained = True
        
        self.logger.info("Training completed!")
        self.logger.info(f"Reconstruction error threshold: {self.threshold:.6f}")
        
        return self.history
    
    def predict(self, X, return_reconstruction_error=False):
        """
        Predict anomalies in new data
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
        
        # Get reconstructions
        X_pred = self.model.predict(X_scaled)
        
        # Calculate reconstruction errors
        reconstruction_errors = np.mean(np.square(X_scaled - X_pred), axis=1)
        
        # Predict anomalies based on threshold
        predictions = (reconstruction_errors > self.threshold).astype(int)
        
        if return_reconstruction_error:
            return predictions, reconstruction_errors
        else:
            return predictions
    
    def evaluate(self, X_test, y_test):
        """
        Evaluate the model performance on test data with known labels
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation")
        
        predictions, reconstruction_errors = self.predict(X_test, return_reconstruction_error=True)
        
        # Calculate metrics
        self.performance_metrics = {
            'accuracy': np.mean(predictions == y_test),
            'precision': classification_report(y_test, predictions, output_dict=True)['1']['precision'],
            'recall': classification_report(y_test, predictions, output_dict=True)['1']['recall'],
            'f1_score': classification_report(y_test, predictions, output_dict=True)['1']['f1-score'],
            'roc_auc': roc_auc_score(y_test, reconstruction_errors),
            'confusion_matrix': confusion_matrix(y_test, predictions).tolist(),
            'threshold': self.threshold,
            'mean_reconstruction_error': np.mean(reconstruction_errors),
            'std_reconstruction_error': np.std(reconstruction_errors)
        }
        
        self.logger.info("Evaluation completed!")
        self.logger.info(f"Accuracy: {self.performance_metrics['accuracy']:.4f}")
        self.logger.info(f"Precision: {self.performance_metrics['precision']:.4f}")
        self.logger.info(f"Recall: {self.performance_metrics['recall']:.4f}")
        self.logger.info(f"F1-Score: {self.performance_metrics['f1_score']:.4f}")
        self.logger.info(f"ROC-AUC: {self.performance_metrics['roc_auc']:.4f}")
        
        return self.performance_metrics
    
    def plot_training_history(self, save_path=None):
        """
        Plot training history
        """
        if self.history is None:
            raise ValueError("Model must be trained before plotting history")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        # Loss plot
        ax1.plot(self.history.history['loss'], label='Training Loss')
        ax1.plot(self.history.history['val_loss'], label='Validation Loss')
        ax1.set_title('Model Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.legend()
        
        # MAE plot
        ax2.plot(self.history.history['mae'], label='Training MAE')
        ax2.plot(self.history.history['val_mae'], label='Validation MAE')
        ax2.set_title('Model MAE')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('MAE')
        ax2.legend()
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            self.logger.info(f"Training history plot saved to {save_path}")
        
        plt.show()
    
    def plot_reconstruction_errors(self, X_test, y_test, save_path=None):
        """
        Plot reconstruction error distribution
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before plotting")
        
        _, reconstruction_errors = self.predict(X_test, return_reconstruction_error=True)
        
        plt.figure(figsize=(10, 6))
        
        # Separate errors by class
        normal_errors = reconstruction_errors[y_test == 0]
        fraud_errors = reconstruction_errors[y_test == 1]
        
        plt.hist(normal_errors, bins=50, alpha=0.7, label='Normal', density=True)
        plt.hist(fraud_errors, bins=50, alpha=0.7, label='Fraud', density=True)
        plt.axvline(self.threshold, color='red', linestyle='--', label=f'Threshold ({self.threshold:.4f})')
        
        plt.xlabel('Reconstruction Error')
        plt.ylabel('Density')
        plt.title('Reconstruction Error Distribution')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            self.logger.info(f"Reconstruction error plot saved to {save_path}")
        
        plt.show()
    
    def save_model(self, filepath=None):
        """
        Save the trained model and preprocessing components
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"models/{self.model_name}_{timestamp}"
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save the Keras model
        self.model.save(f"{filepath}_model.h5")
        
        # Save other components
        model_data = {
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'threshold': self.threshold,
            'performance_metrics': self.performance_metrics,
            'model_name': self.model_name,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, f"{filepath}_components.joblib")
        
        self.logger.info(f"Model saved to {filepath}")
        
        return filepath
    
    def load_model(self, filepath):
        """
        Load a previously trained model
        """
        # Load the Keras model
        self.model = keras.models.load_model(f"{filepath}_model.h5")
        
        # Load other components
        model_data = joblib.load(f"{filepath}_components.joblib")
        
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.threshold = model_data['threshold']
        self.performance_metrics = model_data['performance_metrics']
        self.model_name = model_data['model_name']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")
        if self.performance_metrics:
            self.logger.info(f"Model performance - F1: {self.performance_metrics['f1_score']:.4f}, "
                            f"Precision: {self.performance_metrics['precision']:.4f}, "
                            f"Recall: {self.performance_metrics['recall']:.4f}")
        
        return self.performance_metrics

