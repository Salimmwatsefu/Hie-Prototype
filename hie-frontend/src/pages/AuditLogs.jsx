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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
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
import API_BASE_URL from '../../api_url'

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
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    loadAuditLogs()
  }, [currentPage, searchTerm, actionFilter, statusFilter, dateFilter])

  const loadAuditLogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('hie_access_token')
      const queryParams = new URLSearchParams({
        search: searchTerm,
        action: actionFilter !== 'all' ? actionFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
        date: dateFilter,
        page: currentPage
      }).toString()

      const res = await fetch(`${API_BASE_URL}/audit?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const data = await res.json()

      setAuditLogs(data.auditLogs || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setAuditLogs([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default: return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'doctor': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'nurse': return 'bg-green-100 text-green-800 border-green-200'
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatAction = (action) =>
    action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">System activity monitoring and security audit trail</p>
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
                          <span className="text-sm font-medium">{formatAction(log.action)}</span>
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
                            <p className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>
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
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-2 mt-2 text-sm">
              <p><strong>User:</strong> {selectedLog.userName} ({selectedLog.userRole})</p>
              <p><strong>Action:</strong> {formatAction(selectedLog.action)}</p>
              <p><strong>Resource:</strong> {selectedLog.resourceType} - {selectedLog.resourceId}</p>
              <p><strong>Status:</strong> {selectedLog.status}</p>
              <p><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</p>
              <p><strong>Details:</strong></p>
              <pre className="bg-gray-50 p-2 rounded text-xs">{JSON.stringify(selectedLog.details, null, 2)}</pre>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
