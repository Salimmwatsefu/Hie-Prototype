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

  // Mock previous procedures for simulation (keyed by nhifId)
  const mockPreviousProcedures = {
  'NHIF-22222': [
    {
      procedure: 'Right kidney removal',
      procedure_code: 'SUR101',
      hospital: 'Nairobi Hospital',
      hospital_id: 'NAI_001',
      date: '2025-08-01',
      amount: 32000,
      insurance_provider: 'SHA',
      patient_name: 'Alice Wambui'
    },
    {
      procedure: 'Right kidney removal',
      procedure_code: 'SUR101',
      hospital: 'Aga Khan University Hospital',
      hospital_id: 'AGA_001',
      date: '2025-08-03',
      amount: 33000,
      insurance_provider: 'SHA',
      patient_name: 'Alice W.'
    },
    {
      procedure: 'Heart valve replacement',
      procedure_code: 'CAR101',
      hospital: 'MP Shah Hospital',
      hospital_id: 'MPS_001',
      date: '2025-08-10',
      amount: 45000,
      insurance_provider: 'SHA',
      patient_name: 'Alice Wambui'
    }
  ],
  'NHIF-33333': [
    {
      procedure: 'Left eye cataract surgery',
      procedure_code: 'EYE101',
      hospital: 'Kenyatta National Hospital',
      hospital_id: 'KNH_001',
      date: '2025-07-20',
      amount: 15000,
      insurance_provider: 'SHA',
      patient_name: 'James Kariuki'
    },
    {
      procedure: 'Left eye cataract surgery',
      procedure_code: 'EYE101',
      hospital: 'Mater Hospital',
      hospital_id: 'MAT_001',
      date: '2025-07-22',
      amount: 15500,
      insurance_provider: 'SHA',
      patient_name: 'James K.'
    },
    {
      procedure: 'Right eye cataract surgery',
      procedure_code: 'EYE102',
      hospital: 'Karen Hospital',
      hospital_id: 'KAR_001',
      date: '2025-07-25',
      amount: 16000,
      insurance_provider: 'SHA',
      patient_name: 'James Kariuki'
    }
  ],
  'NHIF-44444': [
    {
      procedure: 'Hip replacement surgery',
      procedure_code: 'ORT101',
      hospital: 'Moi Teaching and Referral Hospital',
      hospital_id: 'MOI_001',
      date: '2025-08-05',
      amount: 28000,
      insurance_provider: 'SHA',
      patient_name: 'Susan Njeri'
    },
    {
      procedure: 'Hip replacement surgery',
      procedure_code: 'ORT101',
      hospital: 'Nairobi Hospital',
      hospital_id: 'NAI_001',
      date: '2025-08-07',
      amount: 29000,
      insurance_provider: 'SHA',
      patient_name: 'Susan N.'
    },
    {
      procedure: 'Knee arthroscopy',
      procedure_code: 'ORT102',
      hospital: 'MP Shah Hospital',
      hospital_id: 'MPS_001',
      date: '2025-08-10',
      amount: 12000,
      insurance_provider: 'SHA',
      patient_name: 'Susan Njeri'
    },
    {
      procedure: 'Knee arthroscopy',
      procedure_code: 'ORT102',
      hospital: 'Karen Hospital',
      hospital_id: 'KAR_001',
      date: '2025-08-12',
      amount: 12500,
      insurance_provider: 'SHA',
      patient_name: 'Susan N.'
    }
  ],
  'NHIF-55555': []
}


  const loadSampleData = () => {
    setFormData({
      nhifId: 'NHIF-22222',
      firstName: 'Alice',
      lastName: 'Wambui',
      dateOfBirth: '2002-07-16',
      gender: 'male',
      phone: '0721277779',
      email: 'alice@gmail.com',
      address: 'Roysambu, Nairobi',
      emergencyContactName: 'Onyango Otieno',
      emergencyContactPhone: '0739876663',
      emergencyContactRelationship: 'Sister',
      medicalHistory: [
        { condition: 'Hypertension', diagnosisDate: '2021-03-15' },
        { condition: 'Asthma', diagnosisDate: '2019-07-22' }
      ],
      allergies: ['Peanuts', 'Latex'],
      currentMedications: [
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Daily' },
        { name: 'Ventolin', dosage: '2 puffs', frequency: 'As needed' }
      ],
      insuranceProvider: 'SHA',
      insurancePolicyNumber: 'POL456722'
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const updateMedicalHistory = (index, field, value) => {
    const newMedicalHistory = [...formData.medicalHistory]
    newMedicalHistory[index] = { ...newMedicalHistory[index], [field]: value }
    setFormData(prev => ({ ...prev, medicalHistory: newMedicalHistory }))
  }

  const addMedicalHistory = () => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: [...prev.medicalHistory, { condition: '', diagnosisDate: '' }]
    }))
  }

  const removeMedicalHistory = (index) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: prev.medicalHistory.filter((_, i) => i !== index)
    }))
  }

  const updateAllergy = (index, value) => {
    const newAllergies = [...formData.allergies]
    newAllergies[index] = value
    setFormData(prev => ({ ...prev, allergies: newAllergies }))
  }

  const addAllergy = () => {
    setFormData(prev => ({ ...prev, allergies: [...prev.allergies, ''] }))
  }

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const updateMedication = (index, field, value) => {
    const newMedications = [...formData.currentMedications]
    newMedications[index] = { ...newMedications[index], [field]: value }
    setFormData(prev => ({ ...prev, currentMedications: newMedications }))
  }

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      currentMedications: [...prev.currentMedications, { name: '', dosage: '', frequency: '' }]
    }))
  }

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate required fields
    if (!formData.nhifId.match(/^NHIF-\d+$/)) {
      setError('NHIF ID must follow format NHIF- followed by numbers')
      setLoading(false)
      return
    }
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
      setError('All required fields must be filled')
      setLoading(false)
      return
    }

    // Validate token
    const token = localStorage.getItem('hie_access_token')
    if (!token) {
      setError('Authentication token missing')
      setLoading(false)
      return
    }

    try {
      // Construct structured fields
      const emergencyContact = {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship
      }
      const insuranceInfo = {
        provider: formData.insuranceProvider,
        policyNumber: formData.insurancePolicyNumber
      }
      // Convert medicalHistory array to object
      const medicalHistoryObj = formData.medicalHistory
        .filter(item => item.condition || item.diagnosisDate)
        .reduce((acc, item, index) => ({
          ...acc,
          [`condition${index + 1}`]: item
        }), {})
      // Convert currentMedications array to object
      const currentMedicationsObj = formData.currentMedications
        .filter(item => item.name || item.dosage || item.frequency)
        .reduce((acc, item, index) => ({
          ...acc,
          [`med${index + 1}`]: item
        }), {})

      const submitData = {
        nhifId: formData.nhifId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergencyContact: Object.keys(emergencyContact).length > 0 ? emergencyContact : undefined,
        medicalHistory: Object.keys(medicalHistoryObj).length > 0 ? medicalHistoryObj : undefined,
        allergies: formData.allergies.filter(allergy => allergy).length > 0 ? formData.allergies.filter(allergy => allergy) : undefined,
        currentMedications: Object.keys(currentMedicationsObj).length > 0 ? currentMedicationsObj : undefined,
        insuranceInfo: Object.keys(insuranceInfo).length > 0 ? insuranceInfo : undefined
      }

      const response = await fetch(`${API_BASE_URL}/patients/patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errData = await response.json()
        console.error('Server error:', errData)
        throw new Error(errData.error || 'Failed to create patient')
      }

      const patientData = await response.json()
      const { patient } = patientData

      // Trigger fraud analysis asynchronously
      await triggerFraudAnalysis(patient.nhifId, patient.id)

      // Reset form, close modal, and notify parent
      setFormData({
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
      onPatientAdded()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

const triggerFraudAnalysis = async (nhifId, patientId) => {
  try {
    const procedures = mockPreviousProcedures[nhifId] || []
    console.log('[Fraud Analysis] Procedures:', procedures)

    // Call fraud analysis API
    const fraudResponse = await fetch(`${API_BASE_URL}/enhanced-fraud/analyze-procedures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hie_access_token')}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        patient_id: nhifId,
        procedures
      })
    })

    if (!fraudResponse.ok) {
      const errText = await fraudResponse.text()
      console.error('[Fraud Analysis] Failed:', errText)
      throw new Error('Fraud analysis failed')
    }

    const result = await fraudResponse.json()
    console.log('[Fraud Analysis] Result:', result)

    const riskUpper = result.risk_level.toUpperCase()
    console.log('[Fraud Analysis] Risk Level:', riskUpper)

    // Map risk level to what the alerts API accepts
    let riskLevelForAlert
    switch (riskUpper) {
      case 'LOW':
        riskLevelForAlert = 'low'
        break
      case 'MEDIUM':
        riskLevelForAlert = 'medium'
        break
      case 'HIGH':
      case 'CRITICAL': // map CRITICAL to HIGH
        riskLevelForAlert = 'high'
        break
      default:
        riskLevelForAlert = 'low'
    }

    // Convert violations to flags
    const flags = result.violations.reduce((acc, v) => {
      acc[v.type] = v.description
      return acc
    }, {})

    console.log('[Fraud Alert] Sending alert with riskLevel:', riskLevelForAlert)

    // Send fraud alert
    const alertResponse = await fetch(`${API_BASE_URL}/fraud/alerts`, {
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

    if (!alertResponse.ok) {
      const errText = await alertResponse.text()
      console.error('[Fraud Alert] Failed:', errText)
    } else {
      console.log('[Fraud Alert] Sent successfully')
    }

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

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="nhifId" className="text-sm font-medium text-gray-600">NHIF ID *</Label>
                <Input
                  id="nhifId"
                  name="nhifId"
                  value={formData.nhifId}
                  onChange={handleChange}
                  required
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-600">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-600">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-600">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-600">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-600">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-sm font-medium text-gray-600">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="emergencyContactName" className="text-sm font-medium text-gray-600">Name</Label>
                <Input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone" className="text-sm font-medium text-gray-600">Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactRelationship" className="text-sm font-medium text-gray-600">Relationship</Label>
                <Input
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Medical Information</h3>
            <div className="space-y-6">
              {/* Medical History */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Medical History</Label>
                {formData.medicalHistory.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-md">
                    <div>
                      <Label htmlFor={`condition-${index}`} className="text-sm font-medium text-gray-600">Condition</Label>
                      <Input
                        id={`condition-${index}`}
                        value={item.condition}
                        onChange={(e) => updateMedicalHistory(index, 'condition', e.target.value)}
                        placeholder="Enter condition"
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`diagnosisDate-${index}`} className="text-sm font-medium text-gray-600">Diagnosis Date</Label>
                      <Input
                        id={`diagnosisDate-${index}`}
                        type="date"
                        value={item.diagnosisDate}
                        onChange={(e) => updateMedicalHistory(index, 'diagnosisDate', e.target.value)}
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      />
                    </div>
                    {formData.medicalHistory.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeMedicalHistory(index)}
                        className="mt-6 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={addMedicalHistory}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Condition
                </Button>
              </div>

              {/* Allergies */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Allergies</Label>
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={allergy}
                      onChange={(e) => updateAllergy(index, e.target.value)}
                      placeholder="Enter allergy"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                    />
                    {formData.allergies.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeAllergy(index)}
                        className="mt-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={addAllergy}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Allergy
                </Button>
              </div>

              {/* Current Medications */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Current Medications</Label>
                {formData.currentMedications.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-md">
                    <div>
                      <Label htmlFor={`medName-${index}`} className="text-sm font-medium text-gray-600">Medication Name</Label>
                      <Input
                        id={`medName-${index}`}
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        placeholder="Enter medication name"
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`dosage-${index}`} className="text-sm font-medium text-gray-600">Dosage</Label>
                      <Input
                        id={`dosage-${index}`}
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="Enter dosage"
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`frequency-${index}`} className="text-sm font-medium text-gray-600">Frequency</Label>
                      <Input
                        id={`frequency-${index}`}
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="Enter frequency"
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                      />
                    </div>
                    {formData.currentMedications.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => removeMedication(index)}
                        className="mt-6 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={addMedication}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Medication
                </Button>
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Insurance Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="insuranceProvider" className="text-sm font-medium text-gray-600">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  name="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="insurancePolicyNumber" className="text-sm font-medium text-gray-600">Policy Number</Label>
                <Input
                  id="insurancePolicyNumber"
                  name="insurancePolicyNumber"
                  value={formData.insurancePolicyNumber}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={loadSampleData}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Load Sample
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              {loading ? 'Creating...' : 'Create Patient'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 font-medium py-2 px-4 rounded-md"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}