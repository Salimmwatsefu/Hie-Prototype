import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  Flag
} from 'lucide-react'

export default function FraudAlerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [riskFilter, setRiskFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    reviewed: 0,
    pending: 0
  })

  useEffect(() => {
    loadFraudAlerts()
  }, [riskFilter, statusFilter])

  const loadFraudAlerts = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock fraud alerts data
      const mockAlerts = [
        {
          id: '1',
          patientName: 'John Kamau',
          nhifId: 'NHIF-54321',
          claimId: 'CLM-2024-001',
          hospitalId: 'Kenyatta National Hospital',
          fraudScore: 0.84,
          riskLevel: 'high',
          flags: ['duplicate_billing', 'unusual_frequency', 'high_cost_claim'],
          detectedAt: '2024-07-19T10:30:00Z',
          reviewed: false,
          reviewerId: null,
          reviewNotes: null,
          modelVersion: 'v2.1.0'
        },
        {
          id: '2',
          patientName: 'Mary Akinyi',
          nhifId: 'NHIF-98765',
          claimId: 'CLM-2024-002',
          hospitalId: 'Moi Teaching and Referral Hospital',
          fraudScore: 0.67,
          riskLevel: 'medium',
          flags: ['high_cost_claim', 'unusual_timing'],
          detectedAt: '2024-07-19T08:15:00Z',
          reviewed: true,
          reviewerId: user?.id,
          reviewNotes: 'Reviewed and approved - legitimate emergency procedure',
          modelVersion: 'v2.1.0'
        },
        {
          id: '3',
          patientName: 'Peter Ochieng',
          nhifId: 'NHIF-13579',
          claimId: 'CLM-2024-003',
          hospitalId: 'Kenyatta National Hospital',
          fraudScore: 0.92,
          riskLevel: 'high',
          flags: ['duplicate_billing', 'phantom_billing', 'unusual_frequency'],
          detectedAt: '2024-07-19T06:45:00Z',
          reviewed: false,
          reviewerId: null,
          reviewNotes: null,
          modelVersion: 'v2.1.0'
        },
        {
          id: '4',
          patientName: 'Grace Wanjiku',
          nhifId: 'NHIF-24680',
          claimId: 'CLM-2024-004',
          hospitalId: 'Moi Teaching and Referral Hospital',
          fraudScore: 0.45,
          riskLevel: 'low',
          flags: ['unusual_timing'],
          detectedAt: '2024-07-18T16:20:00Z',
          reviewed: true,
          reviewerId: user?.id,
          reviewNotes: 'False positive - patient had emergency visit',
          modelVersion: 'v2.1.0'
        }
      ]

      // Apply filters
      let filteredAlerts = mockAlerts
      
      if (riskFilter !== 'all') {
        filteredAlerts = filteredAlerts.filter(alert => alert.riskLevel === riskFilter)
      }
      
      if (statusFilter !== 'all') {
        const isReviewed = statusFilter === 'reviewed'
        filteredAlerts = filteredAlerts.filter(alert => alert.reviewed === isReviewed)
      }

      setAlerts(filteredAlerts)

      // Calculate stats
      setStats({
        total: mockAlerts.length,
        high: mockAlerts.filter(a => a.riskLevel === 'high').length,
        medium: mockAlerts.filter(a => a.riskLevel === 'medium').length,
        low: mockAlerts.filter(a => a.riskLevel === 'low').length,
        reviewed: mockAlerts.filter(a => a.reviewed).length,
        pending: mockAlerts.filter(a => !a.reviewed).length
      })
    } catch (error) {
      console.error('Error loading fraud alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleReviewAlert = async (alertId, action) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update alert status
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, reviewed: true, reviewerId: user?.id, reviewNotes }
          : alert
      ))
      
      setSelectedAlert(null)
      setReviewNotes('')
      
      // Reload stats
      loadFraudAlerts()
    } catch (error) {
      console.error('Error reviewing alert:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fraud Detection Alerts</h1>
          <p className="text-gray-600 mt-1">
            Machine learning-powered fraud detection and review system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Model v2.1.0
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Medium Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.low}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadFraudAlerts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading fraud alerts...</span>
            </CardContent>
          </Card>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.riskLevel === 'high' ? 'border-l-red-500' :
              alert.riskLevel === 'medium' ? 'border-l-yellow-500' :
              'border-l-green-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.riskLevel === 'high' ? 'text-red-600' :
                        alert.riskLevel === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                      <span>{alert.patientName}</span>
                      <Badge className={getRiskBadgeColor(alert.riskLevel)}>
                        🔴 Fraud Risk: {Math.round(alert.fraudScore * 100)}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {alert.nhifId} • {alert.claimId} • {alert.hospitalId}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {alert.reviewed ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Reviewed
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Fraud Flags */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Issues:</h4>
                    <div className="flex flex-wrap gap-2">
                      {alert.flags.map((flag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Flag className="h-3 w-3 mr-1" />
                          {flag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Detection Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Detected:</span>
                      <span className="ml-2 font-medium">
                        {new Date(alert.detectedAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Model Version:</span>
                      <span className="ml-2 font-medium">{alert.modelVersion}</span>
                    </div>
                  </div>

                  {/* Review Notes */}
                  {alert.reviewed && alert.reviewNotes && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Review Notes:</strong> {alert.reviewNotes}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Fraud Alert Details</DialogTitle>
                          <DialogDescription>
                            Review and take action on this fraud alert
                          </DialogDescription>
                        </DialogHeader>
                        {selectedAlert && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium">Patient Information</h4>
                                <p className="text-sm text-gray-600">
                                  {selectedAlert.patientName}<br />
                                  {selectedAlert.nhifId}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Claim Information</h4>
                                <p className="text-sm text-gray-600">
                                  {selectedAlert.claimId}<br />
                                  {selectedAlert.hospitalId}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Fraud Score Analysis</h4>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span>Risk Score:</span>
                                  <span className="font-bold text-red-600">
                                    {Math.round(selectedAlert.fraudScore * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-red-600 h-2 rounded-full" 
                                    style={{ width: `${selectedAlert.fraudScore * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {!selectedAlert.reviewed && (
                              <div>
                                <h4 className="font-medium mb-2">Review Notes</h4>
                                <Textarea
                                  placeholder="Add your review notes..."
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex items-center space-x-2 mt-4">
                                  <Button 
                                    onClick={() => handleReviewAlert(selectedAlert.id, 'approve')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve Claim
                                  </Button>
                                  <Button 
                                    onClick={() => handleReviewAlert(selectedAlert.id, 'flag')}
                                    variant="destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Flag as Fraud
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {!alert.reviewed && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedAlert(alert)
                          // Open dialog programmatically
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No fraud alerts found</h3>
              <p className="text-gray-600">
                {riskFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filter criteria'
                  : 'No fraud alerts have been detected recently'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

