import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from faker import Faker
import logging

class HealthcareFraudDataGenerator:
    """
    Generate synthetic healthcare fraud data for testing and demonstration
    """
    
    def __init__(self, random_state=42):
        self.random_state = random_state
        np.random.seed(random_state)
        random.seed(random_state)
        
        self.fake = Faker()
        Faker.seed(random_state)
        
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Define healthcare-specific data
        self.diagnosis_codes = [
            'Z51.11', 'M79.3', 'R06.02', 'G89.29', 'I10', 'E11.9', 'F32.9',
            'M25.511', 'R50.9', 'N39.0', 'K59.00', 'R53.83', 'M54.5',
            'J44.1', 'F41.9', 'R51', 'K21.9', 'M17.11', 'N18.6', 'I25.10'
        ]
        
        self.procedure_codes = [
            '99213', '99214', '99215', '99212', '99211', '93000', '36415',
            '85025', '80053', '99396', '99397', '99385', '99386', '99395',
            '73721', '73722', '73723', '76700', '76705', '76770'
        ]
        
        self.hospitals = [
            'Kenyatta National Hospital',
            'Moi Teaching and Referral Hospital',
            'Aga Khan University Hospital',
            'Nairobi Hospital',
            'Gertrudes Children Hospital',
            'MP Shah Hospital',
            'Karen Hospital',
            'Coptic Hospital'
        ]
        
        self.locations = [
            'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
            'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'
        ]
        
        # Fraud patterns
        self.fraud_patterns = {
            'billing_inflation': 0.3,      # 30% of fraud cases
            'duplicate_billing': 0.25,     # 25% of fraud cases
            'phantom_billing': 0.2,        # 20% of fraud cases
            'upcoding': 0.15,             # 15% of fraud cases
            'unbundling': 0.1             # 10% of fraud cases
        }
    
    def generate_normal_claims(self, n_claims, start_date=None, end_date=None):
        """
        Generate normal (non-fraudulent) healthcare claims
        """
        if start_date is None:
            start_date = datetime.now() - timedelta(days=365)
        if end_date is None:
            end_date = datetime.now()
        
        claims = []
        
        # Generate unique patients and providers
        n_patients = min(n_claims // 3, 1000)  # Each patient has ~3 claims on average
        n_providers = min(n_claims // 20, 100)  # Each provider handles ~20 claims
        
        patients = [f"PAT_{i:06d}" for i in range(n_patients)]
        providers = [f"PROV_{i:04d}" for i in range(n_providers)]
        
        for i in range(n_claims):
            # Basic claim information
            claim_id = f"CLM_{i:08d}"
            patient_id = np.random.choice(patients)
            provider_id = np.random.choice(providers)
            
            # Random claim date
            claim_date = start_date + timedelta(
                days=np.random.randint(0, (end_date - start_date).days)
            )
            
            # Diagnosis and procedure
            diagnosis_code = np.random.choice(self.diagnosis_codes)
            procedure_code = np.random.choice(self.procedure_codes)
            
            # Location information
            patient_location = np.random.choice(self.locations)
            provider_location = patient_location if np.random.random() > 0.1 else np.random.choice(self.locations)
            hospital_name = np.random.choice(self.hospitals)
            
            # Claim amount based on procedure (with some variation)
            base_amounts = {
                '99213': 150, '99214': 200, '99215': 300, '99212': 100, '99211': 75,
                '93000': 50, '36415': 25, '85025': 30, '80053': 80, '99396': 180,
                '99397': 200, '99385': 160, '99386': 180, '99395': 190,
                '73721': 250, '73722': 280, '73723': 320, '76700': 200,
                '76705': 220, '76770': 180
            }
            
            base_amount = base_amounts.get(procedure_code, 150)
            # Add normal variation (±30%)
            claim_amount = base_amount * np.random.uniform(0.7, 1.3)
            
            # Patient demographics
            patient_age = np.random.randint(18, 85)
            patient_gender = np.random.choice(['M', 'F'])
            
            # NHIF ID (Kenyan health insurance)
            nhif_id = f"NHI{np.random.randint(100000, 999999)}"
            
            claim = {
                'claim_id': claim_id,
                'patient_id': patient_id,
                'provider_id': provider_id,
                'claim_date': claim_date,
                'diagnosis_code': diagnosis_code,
                'procedure_code': procedure_code,
                'claim_amount': round(claim_amount, 2),
                'patient_location': patient_location,
                'provider_location': provider_location,
                'hospital_name': hospital_name,
                'patient_age': patient_age,
                'patient_gender': patient_gender,
                'nhif_id': nhif_id,
                'is_fraud': 0
            }
            
            claims.append(claim)
        
        return pd.DataFrame(claims)
    
    def generate_fraudulent_claims(self, n_fraud_claims, normal_claims_df):
        """
        Generate fraudulent healthcare claims based on common fraud patterns
        """
        fraud_claims = []
        
        # Get existing patients and providers for realistic fraud patterns
        existing_patients = normal_claims_df['patient_id'].unique()
        existing_providers = normal_claims_df['provider_id'].unique()
        
        for i in range(n_fraud_claims):
            fraud_type = np.random.choice(
                list(self.fraud_patterns.keys()),
                p=list(self.fraud_patterns.values())
            )
            
            claim = self._generate_fraud_claim(
                fraud_type, i, existing_patients, existing_providers, normal_claims_df
            )
            fraud_claims.append(claim)
        
        return pd.DataFrame(fraud_claims)
    
    def _generate_fraud_claim(self, fraud_type, claim_index, patients, providers, normal_df):
        """
        Generate a specific type of fraudulent claim
        """
        claim_id = f"FRAUD_{claim_index:06d}"
        
        if fraud_type == 'billing_inflation':
            # Inflate billing amounts significantly
            base_claim = normal_df.sample(1).iloc[0].copy()
            base_claim['claim_id'] = claim_id
            base_claim['claim_amount'] *= np.random.uniform(2.0, 5.0)  # 2-5x inflation
            base_claim['is_fraud'] = 1
            
        elif fraud_type == 'duplicate_billing':
            # Create duplicate of existing claim with slight modifications
            base_claim = normal_df.sample(1).iloc[0].copy()
            base_claim['claim_id'] = claim_id
            # Same patient, provider, diagnosis, but different date (within 30 days)
            original_date = pd.to_datetime(base_claim['claim_date'])
            base_claim['claim_date'] = original_date + timedelta(days=np.random.randint(1, 30))
            base_claim['is_fraud'] = 1
            
        elif fraud_type == 'phantom_billing':
            # Bill for services never provided (unusual patterns)
            patient_id = np.random.choice(patients)
            provider_id = np.random.choice(providers)
            
            # Unusual combinations or high-cost procedures
            diagnosis_code = np.random.choice(['Z51.11', 'G89.29'])  # Common in phantom billing
            procedure_code = np.random.choice(['99215', '73723'])    # High-value procedures
            
            claim_date = datetime.now() - timedelta(days=np.random.randint(1, 365))
            
            # Unusually high amounts
            claim_amount = np.random.uniform(500, 2000)
            
            # Often at night or weekends (suspicious timing)
            if np.random.random() < 0.4:
                claim_date = claim_date.replace(hour=np.random.randint(22, 24))
            
            base_claim = {
                'claim_id': claim_id,
                'patient_id': patient_id,
                'provider_id': provider_id,
                'claim_date': claim_date,
                'diagnosis_code': diagnosis_code,
                'procedure_code': procedure_code,
                'claim_amount': round(claim_amount, 2),
                'patient_location': np.random.choice(self.locations),
                'provider_location': np.random.choice(self.locations),
                'hospital_name': np.random.choice(self.hospitals),
                'patient_age': np.random.randint(18, 85),
                'patient_gender': np.random.choice(['M', 'F']),
                'nhif_id': f"NHI{np.random.randint(100000, 999999)}",
                'is_fraud': 1
            }
            
        elif fraud_type == 'upcoding':
            # Bill for more expensive procedures than actually performed
            base_claim = normal_df.sample(1).iloc[0].copy()
            base_claim['claim_id'] = claim_id
            
            # Upgrade to more expensive procedure codes
            upgrade_map = {
                '99212': '99215',  # Upgrade office visit
                '99213': '99215',
                '99214': '99215',
                '73721': '73723',  # Upgrade imaging
                '76700': '76770'
            }
            
            if base_claim['procedure_code'] in upgrade_map:
                base_claim['procedure_code'] = upgrade_map[base_claim['procedure_code']]
                base_claim['claim_amount'] *= np.random.uniform(1.5, 2.5)
            
            base_claim['is_fraud'] = 1
            
        elif fraud_type == 'unbundling':
            # Split single procedures into multiple billable components
            base_claim = normal_df.sample(1).iloc[0].copy()
            base_claim['claim_id'] = claim_id
            
            # Create multiple related procedures on same date
            base_claim['claim_amount'] *= np.random.uniform(1.3, 2.0)
            base_claim['procedure_code'] = np.random.choice(['99213', '99214'])  # Common unbundled codes
            base_claim['is_fraud'] = 1
        
        return base_claim
    
    def add_fraud_indicators(self, df):
        """
        Add additional fraud indicator features to the dataset
        """
        df = df.copy()
        
        # Provider-level indicators
        provider_stats = df.groupby('provider_id').agg({
            'claim_amount': ['count', 'mean', 'std', 'sum'],
            'patient_id': 'nunique',
            'is_fraud': 'mean'
        })
        provider_stats.columns = ['provider_claim_count', 'provider_avg_amount', 
                                'provider_amount_std', 'provider_total_amount',
                                'provider_unique_patients', 'provider_fraud_rate']
        
        df = df.merge(provider_stats, left_on='provider_id', right_index=True, how='left')
        
        # Patient-level indicators
        patient_stats = df.groupby('patient_id').agg({
            'claim_amount': ['count', 'mean', 'sum'],
            'provider_id': 'nunique',
            'is_fraud': 'mean'
        })
        patient_stats.columns = ['patient_claim_count', 'patient_avg_amount',
                               'patient_total_amount', 'patient_unique_providers',
                               'patient_fraud_rate']
        
        df = df.merge(patient_stats, left_on='patient_id', right_index=True, how='left')
        
        # Time-based features
        df['claim_date'] = pd.to_datetime(df['claim_date'])
        df['claim_hour'] = df['claim_date'].dt.hour
        df['claim_day_of_week'] = df['claim_date'].dt.dayofweek
        df['is_weekend'] = (df['claim_day_of_week'] >= 5).astype(int)
        df['is_night_claim'] = ((df['claim_hour'] < 6) | (df['claim_hour'] > 22)).astype(int)
        
        # Amount-based features
        df['claim_amount_log'] = np.log1p(df['claim_amount'])
        df['amount_z_score'] = (df['claim_amount'] - df['claim_amount'].mean()) / df['claim_amount'].std()
        df['is_high_amount'] = (df['claim_amount'] > df['claim_amount'].quantile(0.95)).astype(int)
        
        # Location features
        df['location_mismatch'] = (df['provider_location'] != df['patient_location']).astype(int)
        
        # Diagnosis/procedure features
        diag_counts = df['diagnosis_code'].value_counts()
        proc_counts = df['procedure_code'].value_counts()
        
        df['diagnosis_frequency'] = df['diagnosis_code'].map(diag_counts)
        df['procedure_frequency'] = df['procedure_code'].map(proc_counts)
        df['is_rare_diagnosis'] = (df['diagnosis_frequency'] < diag_counts.quantile(0.1)).astype(int)
        df['is_rare_procedure'] = (df['procedure_frequency'] < proc_counts.quantile(0.1)).astype(int)
        
        return df
    
    def generate_dataset(self, n_total_claims=10000, fraud_rate=0.1, 
                        start_date=None, end_date=None, add_indicators=True):
        """
        Generate complete dataset with normal and fraudulent claims
        """
        self.logger.info(f"Generating healthcare fraud dataset with {n_total_claims} claims...")
        
        n_fraud_claims = int(n_total_claims * fraud_rate)
        n_normal_claims = n_total_claims - n_fraud_claims
        
        self.logger.info(f"Normal claims: {n_normal_claims}, Fraudulent claims: {n_fraud_claims}")
        
        # Generate normal claims
        normal_df = self.generate_normal_claims(n_normal_claims, start_date, end_date)
        
        # Generate fraudulent claims
        fraud_df = self.generate_fraudulent_claims(n_fraud_claims, normal_df)
        
        # Combine datasets
        combined_df = pd.concat([normal_df, fraud_df], ignore_index=True)
        
        # Shuffle the dataset
        combined_df = combined_df.sample(frac=1, random_state=self.random_state).reset_index(drop=True)
        
        # Add fraud indicators if requested
        if add_indicators:
            combined_df = self.add_fraud_indicators(combined_df)
        
        self.logger.info("Dataset generation completed!")
        self.logger.info(f"Final dataset shape: {combined_df.shape}")
        self.logger.info(f"Fraud rate: {combined_df['is_fraud'].mean():.2%}")
        
        return combined_df
    
    def save_dataset(self, df, filepath="data/healthcare_fraud_dataset.csv"):
        """
        Save the generated dataset to CSV
        """
        import os
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        df.to_csv(filepath, index=False)
        self.logger.info(f"Dataset saved to {filepath}")
        
        # Save dataset summary
        summary = {
            'total_claims': len(df),
            'fraud_claims': df['is_fraud'].sum(),
            'fraud_rate': df['is_fraud'].mean(),
            'date_range': f"{df['claim_date'].min()} to {df['claim_date'].max()}",
            'unique_patients': df['patient_id'].nunique(),
            'unique_providers': df['provider_id'].nunique(),
            'avg_claim_amount': df['claim_amount'].mean(),
            'total_claim_amount': df['claim_amount'].sum()
        }
        
        summary_df = pd.DataFrame([summary])
        summary_df.to_csv(filepath.replace('.csv', '_summary.csv'), index=False)
        
        return filepath

# Example usage and testing
if __name__ == "__main__":
    # Generate sample dataset
    generator = HealthcareFraudDataGenerator(random_state=42)
    
    # Generate dataset
    dataset = generator.generate_dataset(
        n_total_claims=5000,
        fraud_rate=0.15,
        start_date=datetime(2023, 1, 1),
        end_date=datetime(2024, 12, 31)
    )
    
    # Save dataset
    generator.save_dataset(dataset, "healthcare_fraud_demo.csv")
    
    # Display basic statistics
    print("\nDataset Summary:")
    print(f"Total claims: {len(dataset)}")
    print(f"Fraudulent claims: {dataset['is_fraud'].sum()}")
    print(f"Fraud rate: {dataset['is_fraud'].mean():.2%}")
    print(f"Date range: {dataset['claim_date'].min()} to {dataset['claim_date'].max()}")
    print(f"Average claim amount: ${dataset['claim_amount'].mean():.2f}")
    print(f"Unique patients: {dataset['patient_id'].nunique()}")
    print(f"Unique providers: {dataset['provider_id'].nunique()}")
    
    print("\nFraud by type (estimated):")
    fraud_claims = dataset[dataset['is_fraud'] == 1]
    print(f"High amount claims (>$500): {(fraud_claims['claim_amount'] > 500).sum()}")
    print(f"Night/weekend claims: {fraud_claims['is_night_claim'].sum() + fraud_claims['is_weekend'].sum()}")
    print(f"Location mismatches: {fraud_claims['location_mismatch'].sum()}")
    
    print("\nSample data:")
    print(dataset.head())

