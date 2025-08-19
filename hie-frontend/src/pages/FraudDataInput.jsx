import React, { useState } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Brain,
  Activity,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  User
} from 'lucide-react'

import API_BASE_URL from '../../api_url'

export default function FraudDataInput() {
  const { user } = useAuth()
  const [procedures, setProcedures] = useState([{
    id: Date.now(),
    procedure: '',
    procedure_code: '',
    hospital: '',
    hospital_id: '',
    date: '',
    amount: '',
    insurance_provider: '',
    patient_name: ''
  }])
  const [patientId, setPatientId] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const procedureTypes = [
    { code: 'AMP001', name: 'Left leg amputation', category: 'amputation' },
    { code: 'AMP002', name: 'Right leg amputation', category: 'amputation' },
    { code: 'AMP003', name: 'Left arm amputation', category: 'amputation' },
    { code: 'AMP004', name: 'Right arm amputation', category: 'amputation' },
    { code: 'SUR001', name: 'Heart bypass surgery', category: 'surgery' },
    { code: 'SUR002', name: 'Brain tumor removal', category: 'surgery' },
    { code: 'SUR003', name: 'Kidney transplant', category: 'surgery' },
    { code: 'SUR004', name: 'Liver transplant', category: 'surgery' },
    { code: 'COM001', name: 'Appendectomy', category: 'common' },
    { code: 'COM002', name: 'Gallbladder removal', category: 'common' },
    { code: 'COM003', name: 'Hernia repair', category: 'common' },
    { code: 'COM004', name: 'Cataract surgery', category: 'common' }
  ]

  const hospitals = [
    { id: 'HOSP_A_001', name: 'Hospital A' },
    { id: 'HOSP_B_002', name: 'Hospital B' },
    { id: 'HOSP_C_003', name: 'Hospital C' },
    { id: 'HOSP_D_004', name: 'Hospital D' },
    { id: 'KNH_001', name: 'Kenyatta National Hospital' },
    { id: 'MOI_001', name: 'Moi Teaching Hospital' },
    { id: 'AGA_001', name: 'Aga Khan University Hospital' },
    { id: 'NAI_001', name: 'Nairobi Hospital' }
  ]

  const insuranceProviders = [
    'NHIF',
    'AAR Insurance',
    'CIC Insurance',
    'Jubilee Insurance',
    'Madison Insurance',
    'Heritage Insurance',
    'Britam Insurance'
  ]

  const addProcedure = () => {
    setProcedures([...procedures, {
      id: Date.now(),
      procedure: '',
      procedure_code: '',
      hospital: '',
      hospital_id: '',
      date: '',
      amount: '',
      insurance_provider: '',
      patient_name: ''
    }])
  }

  const removeProcedure = (id) => {
    if (procedures.length > 1) {
      setProcedures(procedures.filter(proc => proc.id !== id))
    }
  }

  const updateProcedure = (id, field, value) => {
  console.log('Updating proc id:', id, 'field:', field, 'value:', value);
  setProcedures(procs => procs.map(proc => 
    proc.id === id ? { ...proc, [field]: value } : proc
  ))
}


  const loadLegAmputationExample = () => {
    setPatientId('#123456')
    setProcedures([
      {
        id: 1,
        procedure: 'Left leg amputation',
        procedure_code: 'AMP001',
        hospital: 'Hospital A',
        hospital_id: 'HOSP_A_001',
        date: '2025-01-03',
        amount: '12000',
        insurance_provider: 'NHIF',
        patient_name: 'John Doe'
      },
      {
        id: 2,
        procedure: 'Right leg amputation',
        procedure_code: 'AMP002',
        hospital: 'Hospital B',
        hospital_id: 'HOSP_B_002',
        date: '2025-01-17',
        amount: '13500',
        insurance_provider: 'AAR Insurance',
        patient_name: 'Jonathan Doe'
      },
      {
        id: 3,
        procedure: 'Left leg amputation',
        procedure_code: 'AMP001',
        hospital: 'Hospital C',
        hospital_id: 'HOSP_C_003',
        date: '2025-02-10',
        amount: '12500',
        insurance_provider: 'CIC Insurance',
        patient_name: 'J. Doe'
      },
      {
        id: 4,
        procedure: 'Right leg amputation',
        procedure_code: 'AMP002',
        hospital: 'Hospital D',
        hospital_id: 'HOSP_D_004',
        date: '2025-02-28',
        amount: '13200',
        insurance_provider: 'Jubilee Insurance',
        patient_name: 'John D.'
      }
    ])
  }

  const analyzeProcedures = async () => {
    if (!patientId.trim()) {
      alert('Please enter a patient ID')
      return
    }

    console.log("Procedures validation check:", procedures.map(p => ({
  procedure: p.procedure,
  hospital: p.hospital,
  date: p.date,
  amount: p.amount
})))


    if (procedures.some(proc => !proc.procedure || !proc.hospital || !proc.date || !proc.amount)) {
      alert('Please fill in all required fields for each procedure')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
  `${API_BASE_URL}/enhanced-fraud/analyze-procedures`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('hie_access_token')}`,
      'ngrok-skip-browser-warning': 'true'
    },
        body: JSON.stringify({
          patient_id: patientId,
          procedures: procedures.map(proc => ({
            procedure: proc.procedure,
            procedure_code: proc.procedure_code,
            hospital: proc.hospital,
            hospital_id: proc.hospital_id,
            date: proc.date,
            amount: parseFloat(proc.amount),
            insurance_provider: proc.insurance_provider,
            patient_name: proc.patient_name
          }))
        })
      })

      const result = await response.json()
      setAnalysisResult(result)
      setShowResult(true)
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Failed to analyze procedures. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500 text-white'
      case 'HIGH': return 'bg-orange-500 text-white'
      case 'MEDIUM': return 'bg-yellow-500 text-black'
      case 'LOW': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Detection Testing</h1>
          <p className="text-gray-600 text-sm">Input procedure data to test fraud detection algorithms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadLegAmputationExample}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Load Example Case
          </Button>
          <Badge className="bg-blue-500 text-white">
            <Brain className="h-3 w-3 mr-1" />
            AI Testing
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
              <CardDescription>
                Enter patient ID and procedure details for fraud analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patientId">Patient ID *</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g., #123456"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Procedures ({procedures.length})
                  </CardTitle>
                  <CardDescription>
                    Add medical procedures for fraud detection analysis
                  </CardDescription>
                </div>
                <Button onClick={addProcedure} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Procedure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {procedures.map((procedure, index) => (
                <div key={procedure.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Procedure {index + 1}</h4>
                    {procedures.length > 1 && (
                      <Button
                        onClick={() => removeProcedure(procedure.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Procedure Type *</Label>
                      <Select
  value={procedure.procedure_code}   // use code here
  onValueChange={(code) => {
    console.log("Procedure selected:", code)
    const selectedProc = procedureTypes.find(p => p.code === code)
    if (selectedProc) {
      updateProcedure(procedure.id, 'procedure', selectedProc.name)
      updateProcedure(procedure.id, 'procedure_code', selectedProc.code)
    }
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Select procedure" />
  </SelectTrigger>
  <SelectContent>
    {procedureTypes.map((proc) => (
      <SelectItem key={proc.code} value={proc.code}>
        {proc.name} ({proc.code})
      </SelectItem>
    ))}
  </SelectContent>
</Select>

                    </div>

                    <div>
  <Label>Hospital *</Label>
  <Select
  value={procedure.hospital_id || ''}
  onValueChange={(value) => {
    const selectedHosp = hospitals.find(h => h.id === value)
    if (selectedHosp) {
    updateProcedure(procedure.id, 'hospital', selectedHosp.name)
    updateProcedure(procedure.id, 'hospital_id', selectedHosp.id)
  }
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Select hospital" />
  </SelectTrigger>
  <SelectContent>
    {hospitals.map((hospital) => (
      <SelectItem key={hospital.id} value={hospital.id}>
        {hospital.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

</div>


                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={procedure.date}
                        onChange={(e) => updateProcedure(procedure.id, 'date', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Amount (USD) *</Label>
                      <Input
                        type="number"
                        value={procedure.amount}
                        onChange={(e) => updateProcedure(procedure.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Insurance Provider</Label>
                      <Select
                        value={procedure.insurance_provider}
                        onValueChange={(value) => updateProcedure(procedure.id, 'insurance_provider', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {insuranceProviders.map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              {provider}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Patient Name</Label>
                      <Input
                        value={procedure.patient_name}
                        onChange={(e) => updateProcedure(procedure.id, 'patient_name', e.target.value)}
                        placeholder="Patient name"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={analyzeProcedures}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze for Fraud
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Result */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Detection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!analysisResult ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter procedure data and click "Analyze for Fraud" to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {(analysisResult.fraud_score * 100).toFixed(0)}%
                    </div>
                    <Badge className={getRiskBadgeColor(analysisResult.risk_level)}>
                      {analysisResult.risk_level} RISK
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{analysisResult.procedure_count}</div>
                      <div className="text-sm text-gray-600">Procedures</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">{analysisResult.hospital_count}</div>
                      <div className="text-sm text-gray-600">Hospitals</div>
                    </div>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(analysisResult.total_amount)}
                    </div>
                    <div className="text-sm text-gray-600">Total Amount</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {analysisResult && analysisResult.violations && analysisResult.violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Detected Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.violations.map((violation, index) => (
                    <Alert key={index} className="border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{violation.description}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Type: {violation.type.replace(/_/g, ' ')}
                            </div>
                          </div>
                          <Badge className={`${
                            violation.severity === 'CRITICAL' ? 'bg-red-500' :
                            violation.severity === 'HIGH' ? 'bg-orange-500' :
                            violation.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                          } text-white`}>
                            {violation.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysisResult && analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
