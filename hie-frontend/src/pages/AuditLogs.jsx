import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar
} from 'lucide-react'

export default function AuditLogs() {
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadAuditLogs()
  }, [currentPage, searchTerm, actionFilter, statusFilter, dateFilter])

  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock audit logs data
      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userName: 'Dr. Sarah Mwangi',
          userRole: 'doctor',
          action: 'VIEW_PATIENT',
          resourceType: 'PATIENT',
          resourceId: 'NHIF-12345',
          details: {
            method: 'GET',
            url: '/api/patients/12345',
            patientName: 'Grace Muthoni'
          },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2024-07-19T14:30:00Z',
          status: 'success'
        },
        {
          id: '2',
          userId: 'user-2',
          userName: 'Nurse John Kiprotich',
          userRole: 'nurse',
          action: 'UPDATE_VITALS',
          resourceType: 'MEDICAL_RECORD',
          resourceId: 'record-456',
          details: {
            method: 'PUT',
            url: '/api/medical-records/456',
            changes: ['blood_pressure', 'temperature']
          },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          timestamp: '2024-07-19T14:25:00Z',
          status: 'success'
        },
        {
          id: '3',
          userId: 'user-3',
          userName: 'Dr. Peter Omondi',
          userRole: 'doctor',
          action: 'TRANSFER_PATIENT',
          resourceType: 'TRANSFER',
          resourceId: 'transfer-789',
          details: {
            method: 'POST',
            url: '/api/transfers',
            fromHospital: 'Kenyatta National Hospital',
            toHospital: 'Moi Teaching and Referral Hospital'
          },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2024-07-19T14:20:00Z',
          status: 'success'
        },
        {
          id: '4',
          userId: 'user-4',
          userName: 'Admin Mary Wanjiku',
          userRole: 'admin',
          action: 'LOGIN_ATTEMPT',
          resourceType: 'USER',
          resourceId: 'user-4',
          details: {
            method: 'POST',
            url: '/api/auth/login',
            reason: 'Invalid credentials'
          },
          ipAddress: '192.168.1.103',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
          timestamp: '2024-07-19T14:15:00Z',
          status: 'failed'
        },
        {
          id: '5',
          userId: 'user-5',
          userName: 'Dr. Grace Nyong\'o',
          userRole: 'doctor',
          action: 'CREATE_PATIENT',
          resourceType: 'PATIENT',
          resourceId: 'NHIF-99999',
          details: {
            method: 'POST',
            url: '/api/patients',
            patientName: 'New Patient Registration'
          },
          ipAddress: '192.168.1.104',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: '2024-07-19T14:10:00Z',
          status: 'success'
        },
        {
          id: '6',
          userId: 'user-6',
          userName: 'Nurse Alice Wambui',
          userRole: 'nurse',
          action: 'VIEW_FRAUD_ALERT',
          resourceType: 'FRAUD',
          resourceId: 'alert-123',
          details: {
            method: 'GET',
            url: '/api/fraud-alerts/123',
            alertType: 'high_risk'
          },
          ipAddress: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
          timestamp: '2024-07-19T14:05:00Z',
          status: 'success'
        }
      ]

      // Apply filters
      let filteredLogs = mockLogs
      
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log =>
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resourceId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (actionFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter)
      }
      
      if (statusFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.status === statusFilter)
      }

      setAuditLogs(filteredLogs)
      setTotalPages(Math.ceil(filteredLogs.length / 10))
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'nurse':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            System activity monitoring and security audit trail
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="VIEW_PATIENT">View Patient</SelectItem>
                  <SelectItem value="UPDATE_VITALS">Update Vitals</SelectItem>
                  <SelectItem value="TRANSFER_PATIENT">Transfer Patient</SelectItem>
                  <SelectItem value="LOGIN_ATTEMPT">Login Attempt</SelectItem>
                  <SelectItem value="CREATE_PATIENT">Create Patient</SelectItem>
                  <SelectItem value="VIEW_FRAUD_ALERT">View Fraud Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button variant="outline" onClick={loadAuditLogs} disabled={loading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>System Activity Log</span>
          </CardTitle>
          <CardDescription>
            {auditLogs.length} entries found • Page {currentPage} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading audit logs...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{log.userName}</p>
                            <Badge className={`text-xs ${getRoleBadgeColor(log.userRole)}`}>
                              {log.userRole}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.status)}
                          <span className="text-sm font-medium">
                            {formatAction(log.action)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.resourceType}</p>
                          <p className="text-xs text-gray-500">{log.resourceId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getStatusBadgeColor(log.status)}`}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <div className="text-xs">
                            <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                            <p className="text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-600">
                          {log.ipAddress}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && auditLogs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {auditLogs.length} of {auditLogs.length} entries
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {!loading && auditLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-600">
                {searchTerm || actionFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No audit logs have been recorded yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Data Retention</h4>
              <p className="text-gray-600">
                Audit logs are retained for 7 years in compliance with healthcare regulations.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Security</h4>
              <p className="text-gray-600">
                All logs are encrypted and tamper-proof. Unauthorized access attempts are automatically flagged.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Compliance</h4>
              <p className="text-gray-600">
                Audit trails meet HIPAA, GDPR, and local healthcare data protection requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

