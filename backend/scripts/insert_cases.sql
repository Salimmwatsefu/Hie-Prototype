INSERT INTO enhanced_fraud_alerts (
    id,
    patient_id,
    fraud_type,
    fraud_confidence,
    total_amount,
    procedure_count,
    hospital_count,
    insurance_provider_count,
    procedures,
    created_at,
    status
) VALUES
-- Case 1
(
    '5c5fb2d1-17f1-457d-84e2-febf82994ed8',
    '#123456',
    'multiple_impossible_procedures',
    0.98,
    51200,
    4,
    4,
    4,
    '[{"id":"04070ca8-715e-41ee-a64f-4fdf4bd929f0","hospital":"Hospital A","hospital_id":"HOSP_A_001","procedure_code":"AMP001","procedure":"Left leg amputation","date":"2025-01-03","amount":12000,"insurance_provider":"NHIF","patient_name":"John Doe"},{"id":"af939b08-4c2f-4e3a-98f2-6c8a58b3df40","hospital":"Hospital B","hospital_id":"HOSP_B_002","procedure_code":"AMP002","procedure":"Right leg amputation","date":"2025-01-17","amount":13500,"insurance_provider":"AAR Insurance","patient_name":"Jonathan Doe"}]',
    NOW(),
    'pending'
),
-- Case 2
(
    'a9282796-1f6d-45a0-a5fd-77dc81f18ee3',
    '#234567',
    'multiple_impossible_heart_surgeries',
    0.95,
    75000,
    3,
    2,
    1,
    '[{"id":"7acfe0de-4e6b-47f2-b3dc-b6db24b0af43","hospital":"Heart Center Nairobi","hospital_id":"HOSP_C_003","procedure_code":"HRT001","procedure":"Open heart surgery","date":"2025-02-10","amount":25000,"insurance_provider":"Jubilee Insurance","patient_name":"Jane Smith"},{"id":"43156b47-0a8e-44dc-a6a3-973208fef2de","hospital":"Heart Center Nairobi","hospital_id":"HOSP_C_003","procedure_code":"HRT002","procedure":"Coronary bypass surgery","date":"2025-02-20","amount":25000,"insurance_provider":"Jubilee Insurance","patient_name":"Jane Smith"},{"id":"edb617d0-b730-4d49-b36e-9cb8c7a142c4","hospital":"Cardio Clinic","hospital_id":"HOSP_D_004","procedure_code":"HRT003","procedure":"Heart valve replacement","date":"2025-02-25","amount":25000,"insurance_provider":"Jubilee Insurance","patient_name":"Jane Smith"}]',
    NOW(),
    'pending'
),
-- Case 3
(
    'a84c87e2-ff9b-4b41-8b6f-5e18c4a4e82d',
    '#345678',
    'multiple_impossible_arm_amputations',
    0.92,
    40000,
    3,
    3,
    2,
    '[{"id":"df38a9ad-a5cc-4a19-bab0-83abef6b73e4","hospital":"Surgery Point","hospital_id":"HOSP_E_005","procedure_code":"ARM001","procedure":"Left arm amputation","date":"2025-03-05","amount":13000,"insurance_provider":"NHIF","patient_name":"Samuel Kim"},{"id":"f550228f-d60b-48e3-a263-c9ecb196dcff","hospital":"Surgery Point","hospital_id":"HOSP_E_005","procedure_code":"ARM002","procedure":"Right arm amputation","date":"2025-03-12","amount":13500,"insurance_provider":"AAR Insurance","patient_name":"Samuel Kim"},{"id":"cdbe9d10-d75b-4a92-a030-43b0181ad1c7","hospital":"Ortho Specialists","hospital_id":"HOSP_F_006","procedure_code":"ARM003","procedure":"Right arm amputation (again)","date":"2025-03-20","amount":13500,"insurance_provider":"NHIF","patient_name":"Sam Kim"}]',
    NOW(),
    'pending'
),
-- Case 4
(
    'dddddddd-eeee-ffff-0000-111111111111',
    '#456789',
    'fake_kidney_transplant',
    0.85,
    60000,
    1,
    1,
    1,
    '[{"id":"p7","hospital":"City Hospital","hospital_id":"HOSP_G_007","procedure_code":"KDN001","procedure":"Kidney transplant","date":"2025-04-15","amount":60000,"insurance_provider":"Britam Insurance","patient_name":"Paul Otieno"}]',
    NOW(),
    'pending'
),
-- Case 5
(
    'eeeeeeee-ffff-0000-1111-222222222222',
    '#567890',
    'billing_inflation',
    0.7,
    90000,
    2,
    1,
    1,
    '[{"id":"p8","hospital":"Prime Care Hospital","hospital_id":"HOSP_H_008","procedure_code":"OP001","procedure":"Appendectomy","date":"2025-05-02","amount":45000,"insurance_provider":"NHIF","patient_name":"Lucy Wanjiku"},{"id":"p9","hospital":"Prime Care Hospital","hospital_id":"HOSP_H_008","procedure_code":"OP002","procedure":"Appendectomy follow-up","date":"2025-05-15","amount":45000,"insurance_provider":"NHIF","patient_name":"Lucy Wanjiku"}]',
    NOW(),
    'pending'
),
-- Case 6
(
    'ffffffff-0000-1111-2222-333333333333',
    '#678901',
    'ghost_procedure',
    0.65,
    30000,
    1,
    1,
    1,
    '[{"id":"p10","hospital":"Sunrise Clinic","hospital_id":"HOSP_I_009","procedure_code":"GP001","procedure":"Gallbladder removal","date":"2025-06-10","amount":30000,"insurance_provider":"AAR Insurance","patient_name":"Peter Mwangi"}]',
    NOW(),
    'pending'
);
