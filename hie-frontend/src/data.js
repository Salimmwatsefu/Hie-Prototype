// src/data.js

export const mockPreviousProcedures = {
  'NHIF-12345': [
    {
      procedure: 'Left leg amputation',
      procedure_code: 'AMP001',
      hospital: 'Kenyatta National Hospital',
      hospital_id: 'KNH_001',
      date: '2025-08-01',
      amount: 12000,
      insurance_provider: 'SHA',
      patient_name: 'Grace Muthoni'
    },
    {
      procedure: 'Left leg amputation',
      procedure_code: 'AMP001',
      hospital: 'Aga Khan University Hospital',
      hospital_id: 'AGA_001',
      date: '2025-08-05',
      amount: 13500,
      insurance_provider: 'SHA',
      patient_name: 'Grace M.'
    },
    {
      procedure: 'Heart bypass surgery',
      procedure_code: 'SUR001',
      hospital: 'Nairobi Hospital',
      hospital_id: 'NAI_001',
      date: '2025-08-10',
      amount: 25000,
      insurance_provider: 'SHA',
      patient_name: 'Grace Muthoni'
    }
  ],
  'NHIF-67890': [
    {
      procedure: 'Appendectomy',
      procedure_code: 'COM001',
      hospital: 'Moi Teaching and Referral Hospital',
      hospital_id: 'MOI_001',
      date: '2025-07-15',
      amount: 8000,
      insurance_provider: 'SHA',
      patient_name: 'Peter Ochieng'
    },
    {
      procedure: 'Gallbladder removal',
      procedure_code: 'COM002',
      hospital: 'Kenyatta National Hospital',
      hospital_id: 'KNH_001',
      date: '2025-07-20',
      amount: 9500,
      insurance_provider: 'SHA',
      patient_name: 'Peter O.'
    }
  ],
  'NHIF-11111': [
    {
      procedure: 'Left arm amputation',
      procedure_code: 'AMP003',
      hospital: 'Moi Teaching and Referral Hospital',
      hospital_id: 'MOI_001',
      date: '2025-08-02',
      amount: 14000,
      insurance_provider: 'SHA',
      patient_name: 'Sarah Wanjiku'
    },
    {
      procedure: 'Left arm amputation',
      procedure_code: 'AMP003',
      hospital: 'Aga Khan University Hospital',
      hospital_id: 'AGA_001',
      date: '2025-08-03',
      amount: 14500,
      insurance_provider: 'SHA',
      patient_name: 'Sarah W.'
    },
    {
      procedure: 'Kidney transplant',
      procedure_code: 'SUR003',
      hospital: 'Nairobi Hospital',
      hospital_id: 'NAI_001',
      date: '2025-08-12',
      amount: 30000,
      insurance_provider: 'SHA',
      patient_name: 'Sarah Wanjiku'
    },
    {
      procedure: 'Hernia repair',
      procedure_code: 'COM003',
      hospital: 'Kenyatta University Teaching, Referral & Research Hospital',
      hospital_id: 'KUTRRH_001',
      date: '2025-08-15',
      amount: 7000,
      insurance_provider: 'SHA',
      patient_name: 'Sarah Wanjiku'
    }
  ],
  'NHIF-22222': [
    // Sure fraud case 1: Same procedure billed twice at different hospitals in <48 hrs
    {
      procedure: 'Heart transplant',
      procedure_code: 'SUR999',
      hospital: 'Nairobi Hospital',
      hospital_id: 'NAI_001',
      date: '2025-08-18',
      amount: 150000,
      insurance_provider: 'SHA',
      patient_name: 'John Kamau'
    },
    {
      procedure: 'Heart transplant',
      procedure_code: 'SUR999',
      hospital: 'Aga Khan University Hospital',
      hospital_id: 'AGA_001',
      date: '2025-08-19',
      amount: 155000,
      insurance_provider: 'SHA',
      patient_name: 'J. Kamau'
    }
  ],
  'NHIF-33333': [
    // Sure fraud case 2: Duplicate kidney transplant within days
    {
      procedure: 'Kidney transplant',
      procedure_code: 'SUR003',
      hospital: 'Moi Teaching and Referral Hospital',
      hospital_id: 'MOI_001',
      date: '2025-08-14',
      amount: 31000,
      insurance_provider: 'SHA',
      patient_name: 'Mary Atieno'
    },
    {
      procedure: 'Kidney transplant',
      procedure_code: 'SUR003',
      hospital: 'Kenyatta National Hospital',
      hospital_id: 'KNH_001',
      date: '2025-08-16',
      amount: 32000,
      insurance_provider: 'SHA',
      patient_name: 'M. Atieno'
    }
  ],
  'NHIF-99999': []
}
