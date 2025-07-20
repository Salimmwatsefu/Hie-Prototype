import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRightLeft,
  Search,
  User,
  Building,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function TransferPatient() {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [transferData, setTransferData] = useState({
    toHospital: '',
    reason: '',
    notes: '',
    urgency: 'normal'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transferSuccess, setTransferSuccess] = useState(false)

  // Mock patient search results
  const searchResults = searchTerm ? [
    {
      id: '1',
      nhifId: 'NHIF-12345',
      name: 'Grace Muthoni',
      age: 39,
      gender: 'female',
      currentHospital: 'Kenyatta National Hospital'
    },
    {
      id: '2',
      nhifId: 'NHIF-67890',
      name: 'Peter Ochieng',
      age: 46,
      gender: 'male',
      currentHospital: 'Kenyatta National Hospital'
    }
  ].filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.nhifId.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  // Mock hospital list
  const hospitals = [
    'Moi Teaching and Referral Hospital',
    'Kenyatta National Hospital',
    'Aga Khan University Hospital',
    'Nairobi Hospital',
    'MP Shah Hospital',
    'Gertrude\'s Children\'s Hospital'
  ]

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setSearchTerm('')
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTransferSuccess(true)
      
      // Reset form after success
      setTimeout(() => {
        setSelectedPatient(null)
        setTransferData({
          toHospital: '',
          reason: '',
          notes: '',
          urgency: 'normal'
        })
        setTransferSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Transfer error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (transferSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Request Submitted</h2>
            <p className="text-gray-600 mb-4">
              Patient transfer request has been successfully submitted and is pending approval.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span>Patient:</span>
                <span className="font-medium">{selectedPatient?.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>From:</span>
                <span className="font-medium">{selectedPatient?.currentHospital}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>To:</span>
                <span className="font-medium">{transferData.toHospital}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              You will be notified once the transfer is approved and completed.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Transfer</h1>
        <p className="text-gray-600 mt-1">
          Transfer patients between hospitals in the HIE network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Select Patient</span>
            </CardTitle>
            <CardDescription>
              Search and select the patient to transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPatient ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or NHIF ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-gray-600">
                              {patient.nhifId} • {patient.age} years • {patient.gender}
                            </p>
                          </div>
                          <Badge variant="outline">{patient.currentHospital}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && (
                  <div className="text-center py-4">
                    <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No patients found</p>
                  </div>
                )}
              </>
            ) : (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-900">Selected Patient</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Change
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{selectedPatient.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.nhifId} • {selectedPatient.age} years • {selectedPatient.gender}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Currently at: {selectedPatient.currentHospital}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowRightLeft className="h-5 w-5" />
              <span>Transfer Details</span>
            </CardTitle>
            <CardDescription>
              Specify transfer destination and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="toHospital">Destination Hospital</Label>
                  <Select
                    value={transferData.toHospital}
                    onValueChange={(value) => setTransferData(prev => ({ ...prev, toHospital: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals
                        .filter(hospital => hospital !== selectedPatient.currentHospital)
                        .map((hospital) => (
                          <SelectItem key={hospital} value={hospital}>
                            {hospital}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="urgency">Transfer Urgency</Label>
                  <Select
                    value={transferData.urgency}
                    onValueChange={(value) => setTransferData(prev => ({ ...prev, urgency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Transfer Reason</Label>
                  <Input
                    id="reason"
                    value={transferData.reason}
                    onChange={(e) => setTransferData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Specialized treatment required"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={transferData.notes}
                    onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information for the receiving hospital..."
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Transfer Request...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Submit Transfer Request
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Please select a patient first</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Preview */}
      {selectedPatient && transferData.toHospital && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Transfer Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Patient Information</h4>
                  <p>{selectedPatient.name}</p>
                  <p className="text-gray-600">{selectedPatient.nhifId}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Transfer Route</h4>
                  <p className="text-gray-600">From: {selectedPatient.currentHospital}</p>
                  <p className="text-gray-600">To: {transferData.toHospital}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Transfer Details</h4>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-600">Priority:</span>
                    <Badge className={getUrgencyBadgeColor(transferData.urgency)}>
                      {transferData.urgency}
                    </Badge>
                  </div>
                  <p className="text-gray-600">Reason: {transferData.reason}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Transfer Process:</strong> Patient transfers require approval from both sending and receiving hospitals. 
          The patient's complete medical history and current treatment plan will be securely shared via FHIR-compliant data exchange.
        </AlertDescription>
      </Alert>
    </div>
  )
}

