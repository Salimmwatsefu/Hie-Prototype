import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import API_BASE_URL from '../../api_url'

export default function AddPatient({ isOpen, onClose, onPatientAdded }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    nhifId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalHistory: [{ condition: '', diagnosisDate: '' }],
    allergies: [''],
    currentMedications: [{ name: '', dosage: '', frequency: '' }],
    insuranceProvider: '',
    insurancePolicyNumber: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const mockPreviousProcedures = {
    'NHIF-90001': [
      { procedure: 'Appendectomy', procedure_code: 'SUR201', hospital: 'Nairobi Hospital', hospital_id: 'NAI_001', date: '2025-08-01', amount: 25000, insurance_provider: 'SHA', patient_name: 'Miriam Otieno' },
      { procedure: 'Appendectomy', procedure_code: 'SUR201', hospital: 'Aga Khan University Hospital', hospital_id: 'AGA_001', date: '2025-08-03', amount: 26000, insurance_provider: 'SHA', patient_name: 'Miriam O.' },
      { procedure: 'Gallbladder Checkup', procedure_code: 'SUR202', hospital: 'MP Shah Hospital', hospital_id: 'MPS_001', date: '2025-08-05', amount: 15000, insurance_provider: 'SHA', patient_name: 'Miriam Otieno' }
    ],
    'NHIF-90002': [
      { procedure: 'Tonsillectomy', procedure_code: 'ENT101', hospital: 'MP Shah Hospital', hospital_id: 'MPS_001', date: '2025-07-15', amount: 12000, insurance_provider: 'NHIF', patient_name: 'Daniel Mwangi' },
      { procedure: 'Tonsil Checkup', procedure_code: 'ENT102', hospital: 'Karen Hospital', hospital_id: 'KAR_001', date: '2025-07-18', amount: 8000, insurance_provider: 'NHIF', patient_name: 'Daniel M.' },
      { procedure: 'Sinus Surgery', procedure_code: 'ENT103', hospital: 'Nairobi Hospital', hospital_id: 'NAI_001', date: '2025-07-20', amount: 18000, insurance_provider: 'NHIF', patient_name: 'Daniel Mwangi' }
    ],
    'NHIF-90003': [
      { procedure: 'Gallbladder Removal', procedure_code: 'SUR301', hospital: 'Karen Hospital', hospital_id: 'KAR_001', date: '2025-06-20', amount: 35000, insurance_provider: 'AAR', patient_name: 'Faith Kamau' },
      { procedure: 'Gallbladder Removal', procedure_code: 'SUR301', hospital: 'Mater Hospital', hospital_id: 'MAT_001', date: '2025-06-22', amount: 36000, insurance_provider: 'AAR', patient_name: 'Faith K.' },
      { procedure: 'Liver Scan', procedure_code: 'SUR302', hospital: 'MP Shah Hospital', hospital_id: 'MPS_001', date: '2025-06-25', amount: 10000, insurance_provider: 'AAR', patient_name: 'Faith Kamau' }
    ],
    'NHIF-90004': [
      { procedure: 'Knee Replacement', procedure_code: 'ORT201', hospital: 'Moi Teaching and Referral Hospital', hospital_id: 'MOI_001', date: '2025-05-10', amount: 40000, insurance_provider: 'NHIF', patient_name: 'Kevin Omondi' },
      { procedure: 'Knee X-Ray', procedure_code: 'ORT202', hospital: 'Karen Hospital', hospital_id: 'KAR_001', date: '2025-05-12', amount: 12000, insurance_provider: 'NHIF', patient_name: 'Kevin O.' },
      { procedure: 'Physical Therapy', procedure_code: 'ORT203', hospital: 'MP Shah Hospital', hospital_id: 'MPS_001', date: '2025-05-15', amount: 8000, insurance_provider: 'NHIF', patient_name: 'Kevin Omondi' }
    ],
    'NHIF-90005': [
      { procedure: 'Hip Replacement', procedure_code: 'ORT301', hospital: 'Nairobi Hospital', hospital_id: 'NAI_001', date: '2025-04-12', amount: 42000, insurance_provider: 'APA', patient_name: 'Linda Wanjiku' },
      { procedure: 'Hip Replacement', procedure_code: 'ORT301', hospital: 'Karen Hospital', hospital_id: 'KAR_001', date: '2025-04-15', amount: 43000, insurance_provider: 'APA', patient_name: 'Linda W.' },
      { procedure: 'Post-Op Checkup', procedure_code: 'ORT302', hospital: 'MP Shah Hospital', hospital_id: 'MPS_001', date: '2025-04-18', amount: 10000, insurance_provider: 'APA', patient_name: 'Linda Wanjiku' }
    ]
  }

  const samplePatients = [
    { nhifId: 'NHIF-90001', firstName: 'Miriam', lastName: 'Otieno', dateOfBirth: '1990-01-15', gender: 'female', phone: '0723456789', email: 'miriam@example.com', address: 'Westlands, Nairobi', emergencyContactName: 'James Otieno', emergencyContactPhone: '0712345678', emergencyContactRelationship: 'Brother', medicalHistory: [{ condition: 'Diabetes', diagnosisDate: '2018-03-12' }], allergies: ['Penicillin'], currentMedications: [{ name: 'Metformin', dosage: '500mg', frequency: 'Daily' }], insuranceProvider: 'SHA', insurancePolicyNumber: 'POL90001' },
    { nhifId: 'NHIF-90002', firstName: 'Daniel', lastName: 'Mwangi', dateOfBirth: '1985-07-20', gender: 'male', phone: '0734567890', email: 'daniel@example.com', address: 'Kilimani, Nairobi', emergencyContactName: 'Grace Mwangi', emergencyContactPhone: '0723456789', emergencyContactRelationship: 'Wife', medicalHistory: [{ condition: 'Asthma', diagnosisDate: '2015-05-10' }], allergies: ['Dust'], currentMedications: [{ name: 'Ventolin', dosage: '2 puffs', frequency: 'As needed' }], insuranceProvider: 'NHIF', insurancePolicyNumber: 'POL90002' },
    { nhifId: 'NHIF-90003', firstName: 'Faith', lastName: 'Kamau', dateOfBirth: '1992-03-25', gender: 'female', phone: '0745678901', email: 'faith@example.com', address: 'Karen, Nairobi', emergencyContactName: 'John Kamau', emergencyContactPhone: '0734567890', emergencyContactRelationship: 'Husband', medicalHistory: [{ condition: 'Hypertension', diagnosisDate: '2017-09-12' }], allergies: ['Peanuts'], currentMedications: [{ name: 'Amlodipine', dosage: '5mg', frequency: 'Daily' }], insuranceProvider: 'AAR', insurancePolicyNumber: 'POL90003' },
    { nhifId: 'NHIF-90004', firstName: 'Kevin', lastName: 'Omondi', dateOfBirth: '1988-11-05', gender: 'male', phone: '0712345678', email: 'kevin@example.com', address: 'Roysambu, Nairobi', emergencyContactName: 'Alice Omondi', emergencyContactPhone: '0723456789', emergencyContactRelationship: 'Sister', medicalHistory: [{ condition: 'Arthritis', diagnosisDate: '2019-02-20' }], allergies: ['Latex'], currentMedications: [{ name: 'Ibuprofen', dosage: '400mg', frequency: 'Daily' }], insuranceProvider: 'NHIF', insurancePolicyNumber: 'POL90004' },
    { nhifId: 'NHIF-90005', firstName: 'Linda', lastName: 'Wanjiku', dateOfBirth: '1995-06-15', gender: 'female', phone: '0723456789', email: 'linda@example.com', address: 'Langata, Nairobi', emergencyContactName: 'Peter Wanjiku', emergencyContactPhone: '0712345678', emergencyContactRelationship: 'Brother', medicalHistory: [{ condition: 'Migraine', diagnosisDate: '2020-01-10' }], allergies: ['Shellfish'], currentMedications: [{ name: 'Sumatriptan', dosage: '50mg', frequency: 'As needed' }], insuranceProvider: 'APA', insurancePolicyNumber: 'POL90005' }
  ]

  const loadSampleData = (index) => {
    if (samplePatients[index]) setFormData(samplePatients[index])
  }

  // -------------------- HANDLERS --------------------
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const updateMedicalHistory = (index, field, value) => {
    const newMedicalHistory = [...formData.medicalHistory]
    newMedicalHistory[index] = { ...newMedicalHistory[index], [field]: value }
    setFormData(prev => ({ ...prev, medicalHistory: newMedicalHistory }))
  }

  const addMedicalHistory = () => setFormData(prev => ({ ...prev, medicalHistory: [...prev.medicalHistory, { condition: '', diagnosisDate: '' }] }))
  const removeMedicalHistory = (index) => setFormData(prev => ({ ...prev, medicalHistory: prev.medicalHistory.filter((_, i) => i !== index) }))

  const updateAllergy = (index, value) => { const newAllergies = [...formData.allergies]; newAllergies[index] = value; setFormData(prev => ({ ...prev, allergies: newAllergies })) }
  const addAllergy = () => setFormData(prev => ({ ...prev, allergies: [...prev.allergies, ''] }))
  const removeAllergy = (index) => setFormData(prev => ({ ...prev, allergies: prev.allergies.filter((_, i) => i !== index) }))

  const updateMedication = (index, field, value) => { const newMedications = [...formData.currentMedications]; newMedications[index] = { ...newMedications[index], [field]: value }; setFormData(prev => ({ ...prev, currentMedications: newMedications })) }
  const addMedication = () => setFormData(prev => ({ ...prev, currentMedications: [...prev.currentMedications, { name: '', dosage: '', frequency: '' }] }))
  const removeMedication = (index) => setFormData(prev => ({ ...prev, currentMedications: prev.currentMedications.filter((_, i) => i !== index) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)

    if (!formData.nhifId.match(/^NHIF-\d+$/)) { setError('NHIF ID must follow format NHIF- followed by numbers'); setLoading(false); return }
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) { setError('All required fields must be filled'); setLoading(false); return }

    const token = localStorage.getItem('hie_access_token')
    if (!token) { setError('Authentication token missing'); setLoading(false); return }

    try {
      const emergencyContact = { name: formData.emergencyContactName, phone: formData.emergencyContactPhone, relationship: formData.emergencyContactRelationship }
      const insuranceInfo = { provider: formData.insuranceProvider, policyNumber: formData.insurancePolicyNumber }
      const medicalHistoryObj = formData.medicalHistory.filter(item => item.condition || item.diagnosisDate).reduce((acc, item, index) => ({ ...acc, [`condition${index+1}`]: item }), {})
      const currentMedicationsObj = formData.currentMedications.filter(item => item.name || item.dosage || item.frequency).reduce((acc, item, index) => ({ ...acc, [`med${index+1}`]: item }), {})

      const submitData = {
        nhifId: formData.nhifId, firstName: formData.firstName, lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth, gender: formData.gender, phone: formData.phone, email: formData.email, address: formData.address,
        emergencyContact: Object.keys(emergencyContact).length>0?emergencyContact:undefined,
        medicalHistory: Object.keys(medicalHistoryObj).length>0?medicalHistoryObj:undefined,
        allergies: formData.allergies.filter(a=>a).length>0?formData.allergies.filter(a=>a):undefined,
        currentMedications: Object.keys(currentMedicationsObj).length>0?currentMedicationsObj:undefined,
        insurance: Object.keys(insuranceInfo).length>0?insuranceInfo:undefined
      }

      const res = await fetch(`${API_BASE_URL}/patients/patient`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` }, body:JSON.stringify(submitData) })
      if (!res.ok) throw new Error('Failed to create patient')
      const newPatient = await res.json()
      triggerFraudAnalysis(newPatient.nhifId)
      onPatientAdded(newPatient); onClose(); setFormData({ nhifId:'', firstName:'', lastName:'', dateOfBirth:'', gender:'', phone:'', email:'', address:'', emergencyContactName:'', emergencyContactPhone:'', emergencyContactRelationship:'', medicalHistory:[{ condition:'', diagnosisDate:'' }], allergies:[''], currentMedications:[{ name:'', dosage:'', frequency:'' }], insuranceProvider:'', insurancePolicyNumber:'' })
    } catch(err){ setError(err.message) } finally{ setLoading(false) }
  }

const triggerFraudAnalysis = async (nhifId, patientId) => {
    try {
      const procedures = mockPreviousProcedures[nhifId] || []

      const fraudResponse = await fetch(`${API_BASE_URL}/enhanced-fraud/analyze-procedures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hie_access_token')}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ patient_id: nhifId, procedures })
      })

      if (!fraudResponse.ok) throw new Error('Fraud analysis failed')

      const result = await fraudResponse.json()
      console.log('Fraud Analysis Result:', result)

      // Map risk level
      const riskLevelForAlert = ['LOW','low','Low'].includes(result.risk_level) ? 'low'
        : ['MEDIUM','medium','Medium'].includes(result.risk_level) ? 'medium' : 'high'

      const flags = result.violations.reduce((acc,v)=> { acc[v.type]=v.description; return acc }, {})

      // Send alert
      await fetch(`${API_BASE_URL}/fraud/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hie_access_token')}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          patientId,
          claimId: null,
          hospitalId: user.hospital_id || 'DEFAULT_HOSPITAL',
          fraudScore: result.fraud_score,
          riskLevel: riskLevelForAlert,
          flags,
          modelVersion: 'v1.0'
        })
      })
    } catch (err) {
      console.error('[Fraud Analysis Error]', err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-800">Add New Patient</DialogTitle>
        </DialogHeader>

        {error && (<Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">{error}</Alert>)}

        <form onSubmit={handleSubmit} className="space-y-8">

  {/* Personal Information */}
  <div className="border-b pb-4">
    <h3 className="text-lg font-medium text-gray-700 mb-4">Personal Information</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <Label htmlFor="nhifId">NHIF ID *</Label>
        <Input id="nhifId" name="nhifId" value={formData.nhifId} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="firstName">First Name *</Label>
        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="lastName">Last Name *</Label>
        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
        <Input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
      </div>
      <div>
        <Label>Gender *</Label>
        <Select value={formData.gender} onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" value={formData.address} onChange={handleChange} />
      </div>
    </div>
  </div>

  {/* Emergency Contact */}
  <div className="border-b pb-4">
    <h3 className="text-lg font-medium text-gray-700 mb-4">Emergency Contact</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <Label htmlFor="emergencyContactName">Name</Label>
        <Input id="emergencyContactName" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="emergencyContactPhone">Phone</Label>
        <Input id="emergencyContactPhone" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="emergencyContactRelationship">Relationship</Label>
        <Input id="emergencyContactRelationship" name="emergencyContactRelationship" value={formData.emergencyContactRelationship} onChange={handleChange} />
      </div>
    </div>
  </div>

  {/* Medical History */}
  <div>
    <Label>Medical History</Label>
    {formData.medicalHistory.map((item, idx) => (
      <div key={idx} className="flex gap-2 mb-2">
        <Input placeholder="Condition" value={item.condition} onChange={e => updateMedicalHistory(idx, 'condition', e.target.value)} />
        <Input type="date" value={item.diagnosisDate} onChange={e => updateMedicalHistory(idx, 'diagnosisDate', e.target.value)} />
        {formData.medicalHistory.length > 1 && (
          <Button type="button" variant="destructive" onClick={() => removeMedicalHistory(idx)}>Remove</Button>
        )}
      </div>
    ))}
    <Button type="button" onClick={addMedicalHistory}>Add Condition</Button>
  </div>

  {/* Allergies */}
  <div>
    <Label>Allergies</Label>
    {formData.allergies.map((al, idx) => (
      <div key={idx} className="flex gap-2 mb-2">
        <Input placeholder="Allergy" value={al} onChange={e => updateAllergy(idx, e.target.value)} />
        {formData.allergies.length > 1 && (
          <Button type="button" variant="destructive" onClick={() => removeAllergy(idx)}>Remove</Button>
        )}
      </div>
    ))}
    <Button type="button" onClick={addAllergy}>Add Allergy</Button>
  </div>

  {/* Current Medications */}
  <div>
    <Label>Current Medications</Label>
    {formData.currentMedications.map((med, idx) => (
      <div key={idx} className="flex gap-2 mb-2">
        <Input placeholder="Name" value={med.name} onChange={e => updateMedication(idx, 'name', e.target.value)} />
        <Input placeholder="Dosage" value={med.dosage} onChange={e => updateMedication(idx, 'dosage', e.target.value)} />
        <Input placeholder="Frequency" value={med.frequency} onChange={e => updateMedication(idx, 'frequency', e.target.value)} />
        {formData.currentMedications.length > 1 && (
          <Button type="button" variant="destructive" onClick={() => removeMedication(idx)}>Remove</Button>
        )}
      </div>
    ))}
    <Button type="button" onClick={addMedication}>Add Medication</Button>
  </div>

  {/* Insurance */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div>
      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
      <Input id="insuranceProvider" name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} />
    </div>
    <div>
      <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
      <Input id="insurancePolicyNumber" name="insurancePolicyNumber" value={formData.insurancePolicyNumber} onChange={handleChange} />
    </div>
  </div>

  {/* Load Sample + Actions */}
  <div className="flex justify-end gap-3 pt-4">
    <Select value="" onValueChange={(val) => loadSampleData(Number(val))}>
      <SelectTrigger className="bg-green-600 hover:bg-green-700 text-white rounded-md py-2 px-4">
        <SelectValue placeholder="Load Sample Patient" />
      </SelectTrigger>
      <SelectContent>
        {samplePatients.map((p, i) => (
          <SelectItem key={p.nhifId} value={i.toString()}>{p.firstName} {p.lastName}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
      {loading ? 'Creating...' : 'Create Patient'}
    </Button>
    <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-100 font-medium py-2 px-4 rounded-md">
      Cancel
    </Button>
  </div>
</form>

      </DialogContent>
    </Dialog>
  )
}
