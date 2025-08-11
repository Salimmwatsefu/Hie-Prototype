#!/usr/bin/env python3
"""
Sample Fraud Data Generator for HIE System
Includes the leg amputation fraud case and other realistic fraud scenarios
"""

import json
import uuid
from datetime import datetime, timedelta
import random

class FraudDataGenerator:
    def __init__(self):
        self.hospitals = [
            "Hospital A", "Hospital B", "Hospital C", "Hospital D",
            "Kenyatta National Hospital", "Moi Teaching Hospital", 
            "Aga Khan University Hospital", "Nairobi Hospital",
            "Coast General Hospital", "Eldoret Hospital"
        ]
        
        self.insurance_providers = [
            "NHIF", "AAR Insurance", "CIC Insurance", "Jubilee Insurance",
            "Madison Insurance", "Heritage Insurance", "Britam Insurance"
        ]
        
        self.procedures = {
            "amputations": [
                {"code": "AMP001", "name": "Left leg amputation", "base_cost": 12000},
                {"code": "AMP002", "name": "Right leg amputation", "base_cost": 13000},
                {"code": "AMP003", "name": "Left arm amputation", "base_cost": 10000},
                {"code": "AMP004", "name": "Right arm amputation", "base_cost": 10500}
            ],
            "surgeries": [
                {"code": "SUR001", "name": "Heart bypass surgery", "base_cost": 50000},
                {"code": "SUR002", "name": "Brain tumor removal", "base_cost": 80000},
                {"code": "SUR003", "name": "Kidney transplant", "base_cost": 120000},
                {"code": "SUR004", "name": "Liver transplant", "base_cost": 150000}
            ],
            "common": [
                {"code": "COM001", "name": "Appendectomy", "base_cost": 5000},
                {"code": "COM002", "name": "Gallbladder removal", "base_cost": 8000},
                {"code": "COM003", "name": "Hernia repair", "base_cost": 6000},
                {"code": "COM004", "name": "Cataract surgery", "base_cost": 3000}
            ]
        }

    def generate_leg_amputation_fraud_case(self):
        """Generate the specific leg amputation fraud case from the requirements"""
        patient_id = "#123456"
        base_date = datetime(2025, 1, 3)
        
        procedures = [
            {
                "id": str(uuid.uuid4()),
                "hospital": "Hospital A",
                "hospital_id": "HOSP_A_001",
                "procedure_code": "AMP001",
                "procedure": "Left leg amputation",
                "date": "2025-01-03",
                "amount": 12000,
                "insurance_provider": "NHIF",
                "patient_name": "John Doe"
            },
            {
                "id": str(uuid.uuid4()),
                "hospital": "Hospital B", 
                "hospital_id": "HOSP_B_002",
                "procedure_code": "AMP002",
                "procedure": "Right leg amputation",
                "date": "2025-01-17",
                "amount": 13500,
                "insurance_provider": "AAR Insurance",
                "patient_name": "Jonathan Doe"
            },
            {
                "id": str(uuid.uuid4()),
                "hospital": "Hospital C",
                "hospital_id": "HOSP_C_003", 
                "procedure_code": "AMP001",
                "procedure": "Left leg amputation",
                "date": "2025-02-10",
                "amount": 12500,
                "insurance_provider": "CIC Insurance",
                "patient_name": "J. Doe"
            },
            {
                "id": str(uuid.uuid4()),
                "hospital": "Hospital D",
                "hospital_id": "HOSP_D_004",
                "procedure_code": "AMP002", 
                "procedure": "Right leg amputation",
                "date": "2025-02-28",
                "amount": 13200,
                "insurance_provider": "Jubilee Insurance",
                "patient_name": "John D."
            }
        ]
        
        anomalies = [
            {
                "type": "anatomical_violation",
                "description": "Human anatomy constraint violation: More than 2 leg amputations claimed",
                "severity": "CRITICAL",
                "rule": "max_leg_amputations <= 2"
            },
            {
                "type": "cross_provider_pattern", 
                "description": "Cross-provider pattern: Claims submitted to different hospitals",
                "severity": "HIGH",
                "rule": "multiple_hospitals_same_patient"
            },
            {
                "type": "identity_reuse",
                "description": "Identity reuse: Same patient ID with different name variations", 
                "severity": "HIGH",
                "rule": "name_variations_same_id"
            },
            {
                "type": "insurance_fraud",
                "description": "Insurance fraud: Claims submitted to different insurance providers",
                "severity": "HIGH", 
                "rule": "multiple_insurance_providers"
            }
        ]
        
        detection_rules = {
            "anatomical_constraints": {
                "max_leg_amputations": 2,
                "max_arm_amputations": 2,
                "max_heart_surgeries": 1,
                "max_brain_surgeries": 1
            },
            "temporal_patterns": {
                "max_major_surgeries_per_month": 1,
                "min_days_between_major_surgeries": 30
            },
            "geographic_patterns": {
                "max_hospitals_per_patient": 2,
                "max_distance_between_hospitals": 100
            }
        }
        
        fraud_case = {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "fraud_type": "multiple_impossible_procedures",
            "fraud_confidence": 0.98,
            "total_amount": sum(p["amount"] for p in procedures),
            "procedure_count": len(procedures),
            "hospital_count": len(set(p["hospital"] for p in procedures)),
            "insurance_provider_count": len(set(p["insurance_provider"] for p in procedures)),
            "procedures": procedures,
            "anomalies": anomalies,
            "detection_rules": detection_rules,
            "created_at": datetime.now().isoformat(),
            "status": "confirmed_fraud",
            "outcome": {
                "action_taken": "Patient blacklisted across all insurance providers",
                "funds_recovered": 25600,  # 50% recovery
                "hospitals_investigated": ["Hospital A", "Hospital B", "Hospital C", "Hospital D"],
                "verification_protocols_updated": True
            },
            "lessons_learned": [
                "Cross-provider record sharing is essential",
                "Anatomical constraint validation prevents impossible procedures",
                "Identity verification with biometrics recommended",
                "Centralized EHR system would have prevented this fraud"
            ]
        }
        
        return fraud_case

    def generate_additional_fraud_cases(self, count=5):
        """Generate additional realistic fraud cases"""
        cases = []
        
        for i in range(count):
            case_type = random.choice([
                "multiple_heart_surgeries",
                "impossible_arm_amputations", 
                "fake_kidney_transplants",
                "billing_inflation",
                "ghost_procedures"
            ])
            
            if case_type == "multiple_heart_surgeries":
                case = self._generate_heart_surgery_fraud()
            elif case_type == "impossible_arm_amputations":
                case = self._generate_arm_amputation_fraud()
            elif case_type == "fake_kidney_transplants":
                case = self._generate_kidney_fraud()
            elif case_type == "billing_inflation":
                case = self._generate_billing_inflation_fraud()
            else:
                case = self._generate_ghost_procedure_fraud()
                
            cases.append(case)
            
        return cases

    def _generate_heart_surgery_fraud(self):
        """Generate multiple heart surgery fraud case"""
        patient_id = f"#{random.randint(100000, 999999)}"
        
        procedures = []
        for i in range(3):  # 3 heart surgeries - impossible
            procedures.append({
                "id": str(uuid.uuid4()),
                "hospital": random.choice(self.hospitals),
                "hospital_id": f"HOSP_{random.randint(1000, 9999)}",
                "procedure_code": "SUR001",
                "procedure": "Heart bypass surgery",
                "date": (datetime.now() - timedelta(days=random.randint(10, 90))).strftime("%Y-%m-%d"),
                "amount": random.randint(45000, 55000),
                "insurance_provider": random.choice(self.insurance_providers),
                "patient_name": f"Patient {random.randint(1, 1000)}"
            })
        
        return {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "fraud_type": "multiple_impossible_heart_surgeries",
            "fraud_confidence": 0.95,
            "total_amount": sum(p["amount"] for p in procedures),
            "procedure_count": len(procedures),
            "hospital_count": len(set(p["hospital"] for p in procedures)),
            "procedures": procedures,
            "anomalies": [
                {
                    "type": "anatomical_violation",
                    "description": "Multiple heart surgeries exceed human anatomical limits",
                    "severity": "CRITICAL"
                }
            ],
            "created_at": datetime.now().isoformat(),
            "status": "under_investigation"
        }

    def _generate_arm_amputation_fraud(self):
        """Generate impossible arm amputation fraud case"""
        patient_id = f"#{random.randint(100000, 999999)}"
        
        procedures = []
        for i in range(4):  # 4 arm amputations - impossible
            arm_type = "Left arm" if i % 2 == 0 else "Right arm"
            procedures.append({
                "id": str(uuid.uuid4()),
                "hospital": random.choice(self.hospitals),
                "hospital_id": f"HOSP_{random.randint(1000, 9999)}",
                "procedure_code": f"AMP00{3 if 'Left' in arm_type else 4}",
                "procedure": f"{arm_type} amputation",
                "date": (datetime.now() - timedelta(days=random.randint(5, 60))).strftime("%Y-%m-%d"),
                "amount": random.randint(9500, 11000),
                "insurance_provider": random.choice(self.insurance_providers),
                "patient_name": f"Patient {random.randint(1, 1000)}"
            })
        
        return {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "fraud_type": "multiple_impossible_arm_amputations",
            "fraud_confidence": 0.97,
            "total_amount": sum(p["amount"] for p in procedures),
            "procedure_count": len(procedures),
            "hospital_count": len(set(p["hospital"] for p in procedures)),
            "procedures": procedures,
            "anomalies": [
                {
                    "type": "anatomical_violation",
                    "description": "More than 2 arm amputations claimed for single patient",
                    "severity": "CRITICAL"
                }
            ],
            "created_at": datetime.now().isoformat(),
            "status": "confirmed_fraud"
        }

    def _generate_kidney_fraud(self):
        """Generate fake kidney transplant fraud"""
        patient_id = f"#{random.randint(100000, 999999)}"
        
        procedures = [{
            "id": str(uuid.uuid4()),
            "hospital": random.choice(self.hospitals),
            "hospital_id": f"HOSP_{random.randint(1000, 9999)}",
            "procedure_code": "SUR003",
            "procedure": "Kidney transplant",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
            "amount": 120000,
            "insurance_provider": random.choice(self.insurance_providers),
            "patient_name": f"Patient {random.randint(1, 1000)}"
        }]
        
        return {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "fraud_type": "fake_kidney_transplant",
            "fraud_confidence": 0.85,
            "total_amount": 120000,
            "procedure_count": 1,
            "hospital_count": 1,
            "procedures": procedures,
            "anomalies": [
                {
                    "type": "documentation_fraud",
                    "description": "No matching donor records found",
                    "severity": "HIGH"
                },
                {
                    "type": "medical_history_mismatch",
                    "description": "No prior kidney disease history",
                    "severity": "MEDIUM"
                }
            ],
            "created_at": datetime.now().isoformat(),
            "status": "under_investigation"
        }

    def _generate_billing_inflation_fraud(self):
        """Generate billing inflation fraud case"""
        patient_id = f"#{random.randint(100000, 999999)}"
        
        procedures = [{
            "id": str(uuid.uuid4()),
            "hospital": random.choice(self.hospitals),
            "hospital_id": f"HOSP_{random.randint(1000, 9999)}",
            "procedure_code": "COM001",
            "procedure": "Appendectomy",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
            "amount": 25000,  # Inflated from normal 5000
            "insurance_provider": random.choice(self.insurance_providers),
            "patient_name": f"Patient {random.randint(1, 1000)}"
        }]
        
        return {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "fraud_type": "billing_inflation",
            "fraud_confidence": 0.78,
            "total_amount": 25000,
            "procedure_count": 1,
            "hospital_count": 1,
            "procedures": procedures,
            "anomalies": [
                {
                    "type": "cost_anomaly",
                    "description": "Procedure cost 5x higher than market average",
                    "severity": "HIGH"
                }
            ],
            "created_at": datetime.now().isoformat(),
            "status": "flagged"
        }

    def _generate_ghost_procedure_fraud(self):
        """Generate ghost procedure fraud case"""
        patient_id = f"#{random.randint(100000, 999999)}"
        
        procedures = [{
            "id": str(uuid.uuid4()),
            "hospital": random.choice(self.hospitals),
            "hospital_id": f"HOSP_{random.randint(1000, 9999)}",
            "procedure_code": "COM002",
            "procedure": "Gallbladder removal",
            "date": (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"),
            "amount": 8000,
            "insurance_provider": random.choice(self.insurance_providers),
            "patient_name": f"Patient {random.randint(1, 1000)}"
        }]
        
        return {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "fraud_type": "ghost_procedure",
            "fraud_confidence": 0.82,
            "total_amount": 8000,
            "procedure_count": 1,
            "hospital_count": 1,
            "procedures": procedures,
            "anomalies": [
                {
                    "type": "procedure_verification_failed",
                    "description": "No medical records found for claimed procedure",
                    "severity": "HIGH"
                }
            ],
            "created_at": datetime.now().isoformat(),
            "status": "under_investigation"
        }

    def generate_complete_dataset(self):
        """Generate complete fraud dataset including the leg amputation case"""
        dataset = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_cases": 6,
                "fraud_types": [
                    "multiple_impossible_procedures",
                    "multiple_impossible_heart_surgeries", 
                    "multiple_impossible_arm_amputations",
                    "fake_kidney_transplant",
                    "billing_inflation",
                    "ghost_procedure"
                ]
            },
            "cases": []
        }
        
        # Add the main leg amputation fraud case
        leg_amputation_case = self.generate_leg_amputation_fraud_case()
        dataset["cases"].append(leg_amputation_case)
        
        # Add additional fraud cases
        additional_cases = self.generate_additional_fraud_cases(5)
        dataset["cases"].extend(additional_cases)
        
        return dataset

if __name__ == "__main__":
    generator = FraudDataGenerator()
    dataset = generator.generate_complete_dataset()
    
    # Save to JSON file
    with open("fraud_cases_dataset.json", "w") as f:
        json.dump(dataset, f, indent=2)
    
    print(f"Generated {len(dataset['cases'])} fraud cases")
    print(f"Total fraudulent amount: ${sum(case['total_amount'] for case in dataset['cases']):,}")
    
    # Print summary of the leg amputation case
    leg_case = dataset["cases"][0]
    print(f"\nLeg Amputation Fraud Case Summary:")
    print(f"Patient ID: {leg_case['patient_id']}")
    print(f"Total Amount: ${leg_case['total_amount']:,}")
    print(f"Procedures: {leg_case['procedure_count']}")
    print(f"Hospitals: {leg_case['hospital_count']}")
    print(f"Fraud Confidence: {leg_case['fraud_confidence']*100}%")

