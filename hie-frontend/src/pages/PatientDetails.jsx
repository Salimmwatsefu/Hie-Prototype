import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Pill,
  FileText,
  ArrowLeft,
  Edit,
  Share,
  AlertCircle
} from 'lucide-react'

export default function PatientDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatientDetails()
  }, [id])

  const loadPatientDetails = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock patient data
      const mockPatient = {
        id: id,
        nhifId: 'NHIF-12345',
        firstName: 'Grace',
        lastName: 'Muthoni',
        dateOfBirth: '1985-03-15',
        gender: 'female',
        phone: '+254712345678',
        email: 'grace.muthoni@email.com',
        address: '123 Uhuru Highway, Nairobi, Kenya',
        emergencyContact: {
          name: 'John Muthoni',
          relationship: 'Husband',
          phone: '+254723456789'
        },
        medicalHistory: {
          conditions: ['Hypertension', 'Type 2 Diabetes'],
          surgeries: ['Appendectomy (2018)'],
          familyHistory: ['Diabetes (Mother)', 'Hypertension (Father)']
        },
        allergies: ['Penicillin', 'Shellfish'],
        currentMedications: [
          {
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            prescribedBy: 'Dr. Sarah Wanjiku'
          },
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            prescribedBy: 'Dr. Peter Omondi'
          }
        ],
        insuranceInfo: {
          provider: 'NHIF',
          policyNumber: 'NHIF-12345',
          coverage: 'Comprehensive',
          expiryDate: '2024-12-31'
        },
        medicalRecords: [
          {
            id: '1',
            date: '2024-07-18',
            hospital: 'Kenyatta National Hospital',
            doctor: 'Dr. Sarah Wanjiku',
            diagnosis: 'Routine diabetes check-up',
            treatment: 'Medication adjustment',
            vitalSigns: {
              bloodPressure: { systolic: 130, diastolic: 85 },
              temperature: 36.8,
              heartRate: 72,
              weight: 68
            },
            notes: 'Patient responding well to current medication regimen.'
          },
          {
            id: '2',
            date: '2024-07-10',
            hospital: 'Moi Teaching and Referral Hospital',
            doctor: 'Dr. Peter Omondi',
            diagnosis: 'Hypertension follow-up',
            treatment: 'Blood pressure monitoring',
            vitalSigns: {
              bloodPressure: { systolic: 135, diastolic: 88 },
              temperature: 36.5,
              heartRate: 75,
              weight: 67.5
            },
            notes: 'Blood pressure slightly elevated. Recommended lifestyle changes.'
          }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-07-18T14:20:00Z'
      }

      setPatient(mockPatient)
    } catch (error) {
      console.error('Error loading patient details:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Patient not found</h3>
        <p className="text-gray-600 mb-4">The requested patient could not be found.</p>
        <Link to="/patients">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patient List
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              {patient.nhifId} • {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {user?.role === 'doctor' && (
            <>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button>
                <Share className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Patient Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{patient.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{patient.emergencyContact.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relationship</p>
              <p className="font-medium">{patient.emergencyContact.relationship}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{patient.emergencyContact.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Provider</p>
              <p className="font-medium">{patient.insuranceInfo.provider}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Policy Number</p>
              <Badge variant="outline" className="font-mono">
                {patient.insuranceInfo.policyNumber}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Coverage</p>
              <p className="font-medium">{patient.insuranceInfo.coverage}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiry Date</p>
              <p className="font-medium">{new Date(patient.insuranceInfo.expiryDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="medical-history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medical-history">Medical History</TabsTrigger>
          <TabsTrigger value="medications">Current Medications</TabsTrigger>
          <TabsTrigger value="records">Medical Records</TabsTrigger>
          <TabsTrigger value="fhir">FHIR Data</TabsTrigger>
        </TabsList>

        <TabsContent value="medical-history" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.medicalHistory.conditions.map((condition, index) => (
                    <Badge key={index} variant="outline">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.allergies.map((allergy, index) => (
                    <Badge key={index} className="bg-red-100 text-red-800 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Family History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patient.medicalHistory.familyHistory.map((history, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {history}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5" />
                <span>Current Medications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patient.currentMedications.map((medication, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{medication.name}</h4>
                      <Badge variant="outline">{medication.dosage}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Frequency: {medication.frequency}
                    </p>
                    <p className="text-sm text-gray-600">
                      Prescribed by: {medication.prescribedBy}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Medical Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {patient.medicalRecords.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{record.diagnosis}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString()} • {record.hospital}
                        </p>
                      </div>
                      <Badge variant="outline">{record.doctor}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium mb-2">Vital Signs</h5>
                        <div className="space-y-1 text-sm">
                          <p>BP: {record.vitalSigns.bloodPressure.systolic}/{record.vitalSigns.bloodPressure.diastolic} mmHg</p>
                          <p>Temperature: {record.vitalSigns.temperature}°C</p>
                          <p>Heart Rate: {record.vitalSigns.heartRate} bpm</p>
                          <p>Weight: {record.vitalSigns.weight} kg</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Treatment</h5>
                        <p className="text-sm text-gray-600">{record.treatment}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Notes</h5>
                      <p className="text-sm text-gray-600">{record.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fhir" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>FHIR Patient Resource</CardTitle>
              <CardDescription>
                FHIR R4 compliant patient data representation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{JSON.stringify({
  resourceType: "Patient",
  id: patient.id,
  identifier: [{
    use: "official",
    system: "http://nhif.go.ke/identifier/nhif-id",
    value: patient.nhifId
  }],
  active: true,
  name: [{
    use: "official",
    family: patient.lastName,
    given: [patient.firstName]
  }],
  telecom: [
    { system: "phone", value: patient.phone },
    { system: "email", value: patient.email }
  ],
  gender: patient.gender,
  birthDate: patient.dateOfBirth,
  address: [{
    use: "home",
    text: patient.address
  }]
}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

