from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import logging
import os
import sys
from datetime import datetime
import traceback
import joblib

# Add the parent directory to the path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.ensemble_model import FraudDetectionEnsemble
from models.random_forest_model import FraudDetectionRandomForest
from models.autoencoder_model import FraudDetectionAutoencoder
from models.kmeans_model import FraudDetectionKMeans
from data.synthetic_data_generator import HealthcareFraudDataGenerator

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models
ensemble_model = None
rf_model = None
ae_model = None
kmeans_model = None
model_metadata = {}

# Configuration
MODEL_DIR = "models"
DATA_DIR = "data"
SUPPORTED_MODELS = ['ensemble', 'random_forest', 'autoencoder', 'kmeans']

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'HIE Fraud Detection API',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': {
            'ensemble': ensemble_model is not None,
            'random_forest': rf_model is not None,
            'autoencoder': ae_model is not None,
            'kmeans': kmeans_model is not None
        }
    })

@app.route('/models/status', methods=['GET'])
def get_models_status():
    """Get status of all loaded models"""
    status = {
        'ensemble': {
            'loaded': ensemble_model is not None,
            'trained': ensemble_model.is_trained if ensemble_model else False,
            'metadata': model_metadata.get('ensemble', {})
        },
        'random_forest': {
            'loaded': rf_model is not None,
            'trained': rf_model.is_trained if rf_model else False,
            'metadata': model_metadata.get('random_forest', {})
        },
        'autoencoder': {
            'loaded': ae_model is not None,
            'trained': ae_model.is_trained if ae_model else False,
            'metadata': model_metadata.get('autoencoder', {})
        },
        'kmeans': {
            'loaded': kmeans_model is not None,
            'trained': kmeans_model.is_trained if kmeans_model else False,
            'metadata': model_metadata.get('kmeans', {})
        }
    }
    
    return jsonify(status)

@app.route('/models/train', methods=['POST'])
def train_models():
    """Train fraud detection models"""
    try:
        data = request.get_json()
        
        # Parameters
        model_type = data.get('model_type', 'ensemble')
        n_samples = data.get('n_samples', 5000)
        fraud_rate = data.get('fraud_rate', 0.15)
        use_synthetic_data = data.get('use_synthetic_data', True)
        
        if model_type not in SUPPORTED_MODELS:
            return jsonify({
                'error': f'Unsupported model type. Choose from: {SUPPORTED_MODELS}'
            }), 400
        
        logger.info(f"Starting training for {model_type} model...")
        
        # Generate or load training data
        if use_synthetic_data:
            logger.info("Generating synthetic training data...")
            generator = HealthcareFraudDataGenerator(random_state=42)
            dataset = generator.generate_dataset(
                n_total_claims=n_samples,
                fraud_rate=fraud_rate
            )
        else:
            # Load from provided dataset
            dataset_path = data.get('dataset_path')
            if not dataset_path or not os.path.exists(dataset_path):
                return jsonify({'error': 'Dataset path not provided or file not found'}), 400
            dataset = pd.read_csv(dataset_path)
        
        # Prepare features and target
        feature_columns = [col for col in dataset.columns if col not in ['claim_id', 'is_fraud']]
        X = dataset[feature_columns]
        y = dataset['is_fraud']
        
        logger.info(f"Training data shape: {X.shape}, Fraud rate: {y.mean():.2%}")
        
        # Train the specified model
        if model_type == 'ensemble':
            global ensemble_model
            ensemble_model = FraudDetectionEnsemble(random_state=42)
            metrics = ensemble_model.train(X, y)
            model_metadata['ensemble'] = {
                'trained_at': datetime.now().isoformat(),
                'training_samples': len(X),
                'fraud_rate': float(y.mean()),
                'performance': metrics['ensemble_metrics']
            }
            
        elif model_type == 'random_forest':
            global rf_model
            rf_model = FraudDetectionRandomForest(random_state=42)
            metrics = rf_model.train(X, y)
            model_metadata['random_forest'] = {
                'trained_at': datetime.now().isoformat(),
                'training_samples': len(X),
                'fraud_rate': float(y.mean()),
                'performance': metrics
            }
            
        elif model_type == 'autoencoder':
            global ae_model
            ae_model = FraudDetectionAutoencoder(random_state=42)
            # Train on normal data only
            normal_data = X[y == 0]
            ae_model.train(normal_data)
            metrics = ae_model.evaluate(X, y)
            model_metadata['autoencoder'] = {
                'trained_at': datetime.now().isoformat(),
                'training_samples': len(normal_data),
                'fraud_rate': float(y.mean()),
                'performance': metrics
            }
            
        elif model_type == 'kmeans':
            global kmeans_model
            kmeans_model = FraudDetectionKMeans(random_state=42)
            cluster_labels, cluster_metrics = kmeans_model.train(X)
            kmeans_model.identify_fraud_clusters(X, y)
            metrics = kmeans_model.evaluate(X, y)
            model_metadata['kmeans'] = {
                'trained_at': datetime.now().isoformat(),
                'training_samples': len(X),
                'fraud_rate': float(y.mean()),
                'performance': metrics
            }
        
        logger.info(f"{model_type} model training completed successfully!")
        
        return jsonify({
            'message': f'{model_type} model trained successfully',
            'model_type': model_type,
            'training_samples': len(X),
            'fraud_rate': float(y.mean()),
            'performance_metrics': metrics if model_type != 'ensemble' else metrics['ensemble_metrics'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict_fraud():
    """Predict fraud for new claims"""
    try:
        data = request.get_json()
        
        # Parameters
        model_type = data.get('model_type', 'ensemble')
        claims_data = data.get('claims', [])
        return_probabilities = data.get('return_probabilities', True)
        
        if not claims_data:
            return jsonify({'error': 'No claims data provided'}), 400
        
        if model_type not in SUPPORTED_MODELS:
            return jsonify({
                'error': f'Unsupported model type. Choose from: {SUPPORTED_MODELS}'
            }), 400
        
        # Convert claims to DataFrame
        claims_df = pd.DataFrame(claims_data)
        
        # Select the appropriate model
        model = None
        if model_type == 'ensemble' and ensemble_model:
            model = ensemble_model
        elif model_type == 'random_forest' and rf_model:
            model = rf_model
        elif model_type == 'autoencoder' and ae_model:
            model = ae_model
        elif model_type == 'kmeans' and kmeans_model:
            model = kmeans_model
        
        if model is None:
            return jsonify({
                'error': f'{model_type} model not loaded or trained'
            }), 400
        
        # Make predictions
        if model_type == 'ensemble':
            if return_probabilities:
                predictions, probabilities = model.predict(claims_df, return_probabilities=True)
            else:
                predictions = model.predict(claims_df)
                probabilities = None
                
        elif model_type == 'random_forest':
            if return_probabilities:
                prob_matrix = model.predict(claims_df, return_probabilities=True)
                predictions = (prob_matrix[:, 1] > 0.5).astype(int)
                probabilities = prob_matrix[:, 1]
            else:
                predictions = model.predict(claims_df)
                probabilities = None
                
        elif model_type == 'autoencoder':
            predictions, reconstruction_errors = model.predict(claims_df, return_reconstruction_error=True)
            if return_probabilities:
                # Convert reconstruction errors to probabilities
                probabilities = (reconstruction_errors - reconstruction_errors.min()) / (reconstruction_errors.max() - reconstruction_errors.min() + 1e-8)
            else:
                probabilities = None
                
        elif model_type == 'kmeans':
            predictions = (model.predict_fraud_probability(claims_df) > 0.5).astype(int)
            if return_probabilities:
                probabilities = model.predict_fraud_probability(claims_df)
            else:
                probabilities = None
        
        # Prepare response
        results = []
        for i, claim in enumerate(claims_data):
            result = {
                'claim_id': claim.get('claim_id', f'claim_{i}'),
                'is_fraud_predicted': int(predictions[i]),
                'fraud_risk_level': 'HIGH' if predictions[i] == 1 else 'LOW'
            }
            
            if return_probabilities and probabilities is not None:
                result['fraud_probability'] = float(probabilities[i])
                result['fraud_risk_percentage'] = f"{probabilities[i] * 100:.1f}%"
                
                # Risk categorization
                if probabilities[i] >= 0.8:
                    result['fraud_risk_level'] = 'CRITICAL'
                elif probabilities[i] >= 0.6:
                    result['fraud_risk_level'] = 'HIGH'
                elif probabilities[i] >= 0.4:
                    result['fraud_risk_level'] = 'MEDIUM'
                else:
                    result['fraud_risk_level'] = 'LOW'
            
            results.append(result)
        
        # Summary statistics
        fraud_count = sum(predictions)
        total_count = len(predictions)
        
        response = {
            'predictions': results,
            'summary': {
                'total_claims': total_count,
                'flagged_as_fraud': fraud_count,
                'fraud_rate': f"{(fraud_count / total_count) * 100:.1f}%",
                'model_used': model_type,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        if return_probabilities and probabilities is not None:
            response['summary']['average_fraud_probability'] = f"{np.mean(probabilities) * 100:.1f}%"
            response['summary']['max_fraud_probability'] = f"{np.max(probabilities) * 100:.1f}%"
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/analyze/batch', methods=['POST'])
def batch_analysis():
    """Perform batch analysis on multiple claims"""
    try:
        data = request.get_json()
        
        claims_data = data.get('claims', [])
        model_type = data.get('model_type', 'ensemble')
        
        if not claims_data:
            return jsonify({'error': 'No claims data provided'}), 400
        
        # Get predictions
        prediction_response = predict_fraud()
        if prediction_response[1] != 200:  # If there was an error
            return prediction_response
        
        prediction_data = prediction_response[0].get_json()
        
        # Additional analysis
        claims_df = pd.DataFrame(claims_data)
        
        # Provider analysis
        if 'provider_id' in claims_df.columns:
            provider_analysis = claims_df.groupby('provider_id').agg({
                'claim_amount': ['count', 'sum', 'mean'],
                'patient_id': 'nunique' if 'patient_id' in claims_df.columns else 'count'
            }).round(2)
            
            provider_analysis.columns = ['claim_count', 'total_amount', 'avg_amount', 'unique_patients']
            provider_analysis = provider_analysis.to_dict('index')
        else:
            provider_analysis = {}
        
        # Time pattern analysis
        if 'claim_date' in claims_df.columns:
            claims_df['claim_date'] = pd.to_datetime(claims_df['claim_date'])
            claims_df['hour'] = claims_df['claim_date'].dt.hour
            claims_df['day_of_week'] = claims_df['claim_date'].dt.dayofweek
            
            time_analysis = {
                'night_claims': int(((claims_df['hour'] < 6) | (claims_df['hour'] > 22)).sum()),
                'weekend_claims': int((claims_df['day_of_week'] >= 5).sum()),
                'peak_hour': int(claims_df['hour'].mode().iloc[0]) if not claims_df['hour'].mode().empty else None
            }
        else:
            time_analysis = {}
        
        # Amount analysis
        if 'claim_amount' in claims_df.columns:
            amount_analysis = {
                'total_amount': float(claims_df['claim_amount'].sum()),
                'average_amount': float(claims_df['claim_amount'].mean()),
                'median_amount': float(claims_df['claim_amount'].median()),
                'high_amount_claims': int((claims_df['claim_amount'] > claims_df['claim_amount'].quantile(0.95)).sum())
            }
        else:
            amount_analysis = {}
        
        # Combine with prediction results
        response = prediction_data
        response['detailed_analysis'] = {
            'provider_analysis': provider_analysis,
            'time_pattern_analysis': time_analysis,
            'amount_analysis': amount_analysis,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error during batch analysis: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/models/performance', methods=['GET'])
def get_model_performance():
    """Get performance metrics for all trained models"""
    try:
        performance_data = {}
        
        for model_name, metadata in model_metadata.items():
            if 'performance' in metadata:
                performance_data[model_name] = metadata['performance']
        
        return jsonify({
            'model_performance': performance_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting model performance: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/generate/demo-data', methods=['POST'])
def generate_demo_data():
    """Generate demo data for testing"""
    try:
        data = request.get_json() or {}
        
        n_claims = data.get('n_claims', 100)
        fraud_rate = data.get('fraud_rate', 0.15)
        
        generator = HealthcareFraudDataGenerator(random_state=42)
        dataset = generator.generate_dataset(
            n_total_claims=n_claims,
            fraud_rate=fraud_rate
        )
        
        # Convert to list of dictionaries for JSON response
        demo_claims = dataset.to_dict('records')
        
        # Convert datetime objects to strings
        for claim in demo_claims:
            if 'claim_date' in claim:
                claim['claim_date'] = claim['claim_date'].isoformat()
        
        return jsonify({
            'demo_claims': demo_claims,
            'summary': {
                'total_claims': len(demo_claims),
                'fraud_claims': int(dataset['is_fraud'].sum()),
                'fraud_rate': f"{dataset['is_fraud'].mean() * 100:.1f}%"
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error generating demo data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/alerts/high-risk', methods=['GET'])
def get_high_risk_alerts():
    """Get high-risk fraud alerts (mock endpoint for demo)"""
    try:
        # Generate some mock high-risk alerts
        alerts = [
            {
                'alert_id': 'ALERT_001',
                'claim_id': 'CLM_00123456',
                'patient_id': 'PAT_001234',
                'provider_id': 'PROV_0056',
                'hospital_name': 'Kenyatta National Hospital',
                'fraud_probability': 0.89,
                'risk_level': 'CRITICAL',
                'alert_type': 'Billing Inflation',
                'claim_amount': 2450.00,
                'expected_amount': 650.00,
                'timestamp': datetime.now().isoformat(),
                'status': 'PENDING_REVIEW'
            },
            {
                'alert_id': 'ALERT_002',
                'claim_id': 'CLM_00123457',
                'patient_id': 'PAT_001235',
                'provider_id': 'PROV_0078',
                'hospital_name': 'Moi Teaching and Referral Hospital',
                'fraud_probability': 0.76,
                'risk_level': 'HIGH',
                'alert_type': 'Duplicate Billing',
                'claim_amount': 890.00,
                'timestamp': datetime.now().isoformat(),
                'status': 'UNDER_INVESTIGATION'
            },
            {
                'alert_id': 'ALERT_003',
                'claim_id': 'CLM_00123458',
                'patient_id': 'PAT_001236',
                'provider_id': 'PROV_0034',
                'hospital_name': 'Aga Khan University Hospital',
                'fraud_probability': 0.84,
                'risk_level': 'CRITICAL',
                'alert_type': 'Phantom Billing',
                'claim_amount': 1750.00,
                'timestamp': datetime.now().isoformat(),
                'status': 'FLAGGED'
            }
        ]
        
        return jsonify({
            'high_risk_alerts': alerts,
            'summary': {
                'total_alerts': len(alerts),
                'critical_alerts': sum(1 for alert in alerts if alert['risk_level'] == 'CRITICAL'),
                'high_alerts': sum(1 for alert in alerts if alert['risk_level'] == 'HIGH'),
                'pending_review': sum(1 for alert in alerts if alert['status'] == 'PENDING_REVIEW')
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting high-risk alerts: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    
    logger.info("Starting HIE Fraud Detection API...")
    logger.info(f"Supported models: {SUPPORTED_MODELS}")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=True)

