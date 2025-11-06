import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_curve
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib
import logging
from datetime import datetime
import os

class FraudDetectionRandomForest:
    """
    Random Forest model for healthcare fraud detection
    Focuses on detecting fraudulent claims, billing patterns, and suspicious activities
    """
    
    def __init__(self, model_name="healthcare_fraud_rf", random_state=42):
        self.model_name = model_name
        self.random_state = random_state
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        self.is_trained = False
        self.performance_metrics = {}
        
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def prepare_features(self, df):
        """
        Prepare and engineer features for fraud detection, using existing features when available
        """
        features = df.copy()
        
        # Log input columns for debugging
        self.logger.info(f"Input columns to prepare_features: {list(features.columns)}")
        
        # Temporal features (only add if not already present)
        if 'claim_date' in features.columns:
            features['claim_date'] = pd.to_datetime(features['claim_date'])
            if 'claim_hour' not in features.columns:
                features['claim_hour'] = features['claim_date'].dt.hour
            if 'claim_day_of_week' not in features.columns:
                features['claim_day_of_week'] = features['claim_date'].dt.dayofweek
            if 'claim_month' not in features.columns:
                features['claim_month'] = features['claim_date'].dt.month
            if 'is_weekend' not in features.columns:
                features['is_weekend'] = (features['claim_day_of_week'] >= 5).astype(int)
            if 'is_night_claim' not in features.columns:
                features['is_night_claim'] = ((features['claim_hour'] < 6) | (features['claim_hour'] > 22)).astype(int)
        
        # Financial features (only add if not already present)
        if 'claim_amount' in features.columns:
            if 'claim_amount_log' not in features.columns:
                features['claim_amount_log'] = np.log1p(features['claim_amount'])
            if 'is_high_amount' not in features.columns:
                features['is_high_amount'] = (features['claim_amount'] > features['claim_amount'].quantile(0.95)).astype(int)
        
        # Provider features (use existing features if available, otherwise compute)
        if 'provider_id' in features.columns:
            if 'provider_claim_count' not in features.columns or 'provider_unique_patients' not in features.columns:
                provider_stats = features.groupby('provider_id').agg({
                    'claim_amount': ['count', 'mean', 'std', 'sum'],
                    'patient_id': 'nunique'
                }).fillna(0)
                
                provider_stats.columns = ['provider_claim_count', 'provider_avg_amount', 
                                        'provider_amount_std', 'provider_total_amount', 
                                        'provider_unique_patients']
                
                features = features.merge(provider_stats, left_on='provider_id', right_index=True, how='left')
            
            # Provider risk indicators (only compute if not already present)
            if 'provider_claims_per_patient' not in features.columns:
                features['provider_claims_per_patient'] = features['provider_claim_count'] / (features['provider_unique_patients'] + 1)
            if 'provider_amount_variation' not in features.columns:
                features['provider_amount_variation'] = features['provider_amount_std'] / (features['provider_avg_amount'] + 1)
        
        # Patient features (use existing features if available, otherwise compute)
        if 'patient_id' in features.columns:
            if 'patient_claim_count' not in features.columns or 'patient_unique_providers' not in features.columns:
                patient_stats = features.groupby('patient_id').agg({
                    'claim_amount': ['count', 'mean', 'sum'],
                    'provider_id': 'nunique'
                }).fillna(0)
                
                patient_stats.columns = ['patient_claim_count', 'patient_avg_amount', 
                                       'patient_total_amount', 'patient_unique_providers']
                
                features = features.merge(patient_stats, left_on='patient_id', right_index=True, how='left')
            
            # Patient risk indicators
            if 'patient_provider_diversity' not in features.columns:
                features['patient_provider_diversity'] = features['patient_unique_providers'] / (features['patient_claim_count'] + 1)
        
        # Diagnosis and procedure features
        if 'diagnosis_code' in features.columns:
            # High-risk diagnosis codes (example patterns)
            high_risk_diagnoses = ['Z51', 'M79', 'R06', 'G89']  # Common in fraudulent claims
            if 'is_high_risk_diagnosis' not in features.columns:
                features['is_high_risk_diagnosis'] = features['diagnosis_code'].str[:3].isin(high_risk_diagnoses).astype(int)
        
        if 'procedure_code' in features.columns:
            # High-value procedure codes
            high_value_procedures = ['99213', '99214', '99215', '93000']  # Common high-value procedures
            if 'is_high_value_procedure' not in features.columns:
                features['is_high_value_procedure'] = features['procedure_code'].isin(high_value_procedures).astype(int)
        
        # Geographic features
        if 'provider_location' in features.columns and 'patient_location' in features.columns:
            if 'location_mismatch' not in features.columns:
                features['location_mismatch'] = (features['provider_location'] != features['patient_location']).astype(int)
        
        # Duplicate detection features
        duplicate_cols = ['patient_id', 'provider_id', 'diagnosis_code', 'procedure_code']
        available_cols = [col for col in duplicate_cols if col in features.columns]
        
        if len(available_cols) >= 2 and 'duplicate_claim_indicator' not in features.columns:
            features['duplicate_claim_indicator'] = features.duplicated(subset=available_cols, keep=False).astype(int)
        
        self.logger.info(f"Output columns from prepare_features: {list(features.columns)}")
        return features
    
    def encode_categorical_features(self, df, fit=True):
        """
        Encode categorical features using label encoding
        """
        categorical_columns = df.select_dtypes(include=['object']).columns
        categorical_columns = [col for col in categorical_columns if col not in ['claim_date']]
        
        for col in categorical_columns:
            if fit:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                df[col] = self.label_encoders[col].fit_transform(df[col].astype(str))
            else:
                if col in self.label_encoders:
                    # Handle unseen categories
                    unique_values = set(df[col].astype(str))
                    known_values = set(self.label_encoders[col].classes_)
                    unknown_values = unique_values - known_values
                    
                    if unknown_values:
                        # Add unknown values to the encoder
                        self.label_encoders[col].classes_ = np.append(
                            self.label_encoders[col].classes_, 
                            list(unknown_values)
                        )
                    
                    df[col] = self.label_encoders[col].transform(df[col].astype(str))
        
        return df
    
    def train(self, X, y, test_size=0.2, balance_data=True, optimize_hyperparameters=True):
        """
        Train the Random Forest model for fraud detection
        """
        self.logger.info("Starting Random Forest training...")
        
        # Prepare features
        X_processed = self.prepare_features(X)
        
        # Encode categorical features
        X_processed = self.encode_categorical_features(X_processed, fit=True)
        
        # Remove non-numeric columns
        numeric_columns = X_processed.select_dtypes(include=[np.number]).columns
        X_processed = X_processed[numeric_columns]
        
        # Store feature names
        self.feature_names = list(X_processed.columns)
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X_processed, y, test_size=test_size, random_state=self.random_state, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Handle class imbalance
        if balance_data:
            # Use SMOTE for oversampling minority class
            smote = SMOTE(random_state=self.random_state)
            X_train_balanced, y_train_balanced = smote.fit_resample(X_train_scaled, y_train)
        else:
            X_train_balanced, y_train_balanced = X_train_scaled, y_train
        
        # Hyperparameter optimization
        if optimize_hyperparameters:
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4],
                'max_features': ['sqrt', 'log2', None]
            }
            
            rf = RandomForestClassifier(random_state=self.random_state, class_weight='balanced')
            grid_search = GridSearchCV(
                rf, param_grid, cv=5, scoring='f1', n_jobs=-1, verbose=1
            )
            
            self.logger.info("Performing hyperparameter optimization...")
            grid_search.fit(X_train_balanced, y_train_balanced)
            self.model = grid_search.best_estimator_
            
            self.logger.info(f"Best parameters: {grid_search.best_params_}")
        else:
            # Use default parameters with class balancing
            self.model = RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features='sqrt',
                random_state=self.random_state,
                class_weight='balanced',
                n_jobs=-1
            )
            
            self.model.fit(X_train_balanced, y_train_balanced)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate metrics
        self.performance_metrics = {
            'accuracy': self.model.score(X_test_scaled, y_test),
            'precision': classification_report(y_test, y_pred, output_dict=True)['1']['precision'],
            'recall': classification_report(y_test, y_pred, output_dict=True)['1']['recall'],
            'f1_score': classification_report(y_test, y_pred, output_dict=True)['1']['f1-score'],
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
        }
        
        # Cross-validation scores
        cv_scores = cross_val_score(self.model, X_train_balanced, y_train_balanced, cv=5, scoring='f1')
        self.performance_metrics['cv_f1_mean'] = cv_scores.mean()
        self.performance_metrics['cv_f1_std'] = cv_scores.std()
        
        self.is_trained = True
        
        self.logger.info("Training completed!")
        self.logger.info(f"Accuracy: {self.performance_metrics['accuracy']:.4f}")
        self.logger.info(f"Precision: {self.performance_metrics['precision']:.4f}")
        self.logger.info(f"Recall: {self.performance_metrics['recall']:.4f}")
        self.logger.info(f"F1-Score: {self.performance_metrics['f1_score']:.4f}")
        self.logger.info(f"ROC-AUC: {self.performance_metrics['roc_auc']:.4f}")
        
        return self.performance_metrics
    
    def predict(self, X, return_probabilities=False):
        """
        Make predictions on new data
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        # Prepare features
        X_processed = self.prepare_features(X)
        
        # Encode categorical features
        X_processed = self.encode_categorical_features(X_processed, fit=False)
        
        # Select only the features used during training
        X_processed = X_processed[self.feature_names]
        
        # Scale features
        X_scaled = self.scaler.transform(X_processed)
        
        if return_probabilities:
            return self.model.predict_proba(X_scaled)
        else:
            return self.model.predict(X_scaled)
    
    def get_feature_importance(self, top_n=20):
        """
        Get feature importance from the trained model
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before getting feature importance")
        
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return importance_df.head(top_n)
    
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
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
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
        self.label_encoders = model_data['label_encoders']
        self.feature_names = model_data['feature_names']
        self.performance_metrics = model_data['performance_metrics']
        self.model_name = model_data['model_name']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")
        self.logger.info(f"Model performance - F1: {self.performance_metrics['f1_score']:.4f}, "
                        f"Precision: {self.performance_metrics['precision']:.4f}, "
                        f"Recall: {self.performance_metrics['recall']:.4f}")
        
        return self.performance_metrics