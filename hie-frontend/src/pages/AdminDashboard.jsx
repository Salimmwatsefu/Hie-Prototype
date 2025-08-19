import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  AlertTriangle,
  Activity,
  Shield,
  FileText,
  TrendingUp,
  Database,
  Server,
  Eye,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    fraudAlerts: 0,
    auditLogs: 0,
    systemUptime: 0,
    apiResponseTime: 0
  })
  const [fraudStats, setFraudStats] = useState({
    totalFlags: 0,
    accuracy: 0,
    precision: 0,
    f1Score: 0,
    falsePositives: 0
  })
  const [recentAuditLogs, setRecentAuditLogs] = useState([])
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    encryption: 'active',
    fhirCompliance: 100
  })

  useEffect(() => {
    // Simulate loading dashboard data
    setSystemStats({
      totalUsers: 156,
      totalPatients: 2847,
      fraudAlerts: 23,
      auditLogs: 1542,
      systemUptime: 99.8,
      apiResponseTime: 1.2
    })

    setFraudStats({
      totalFlags: 89,
      accuracy: 92.5,
      precision: 87.3,
      f1Score: 0.84,
      falsePositives: 12
    })

    setRecentAuditLogs([
      {
        id: 1,
        user: 'Dr. Sarah Mwangi',
        action: 'VIEW_PATIENT',
        resource: 'Patient NHIF-12345',
        timestamp: '2024-07-19T14:30:00Z',
        status: 'success'
      },
      {
        id: 2,
        user: 'Nurse John Kiprotich',
        action: 'UPDATE_VITALS',
        resource: 'Patient NHIF-67890',
        timestamp: '2024-07-19T14:25:00Z',
        status: 'success'
      },
      {
        id: 3,
        user: 'Dr. Peter Omondi',
        action: 'TRANSFER_PATIENT',
        resource: 'Transfer to Moi Hospital',
        timestamp: '2024-07-19T14:20:00Z',
        status: 'success'
      },
      {
        id: 4,
        user: 'Admin Mary Wanjiku',
        action: 'LOGIN_ATTEMPT',
        resource: 'System Login',
        timestamp: '2024-07-19T14:15:00Z',
        status: 'failed'
      }
    ])
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getHealthBadgeColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            System Administration
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            HIE System Overview • 
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Shield className="h-3 w-3 mr-1" />
            Admin Access
          </Badge>
        </div>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>System Health Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge className={getHealthBadgeColor(systemHealth.database)}>
                Database: {systemHealth.database}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">PostgreSQL</p>
            </div>
            <div className="text-center">
              <Badge className={getHealthBadgeColor(systemHealth.api)}>
                API: {systemHealth.api}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Response: {systemStats.apiResponseTime}s</p>
            </div>
            <div className="text-center">
              <Badge className={getHealthBadgeColor(systemHealth.encryption)}>
                Encryption: {systemHealth.encryption}
              </Badge>
              <p className="text-sm text-gray-600 mt-1">AES-256</p>
            </div>
            <div className="text-center">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                FHIR: {systemHealth.fhirCompliance}%
              </Badge>
              <p className="text-sm text-gray-600 mt-1">Compliant</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active system users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              In HIE database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{systemStats.fraudAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Detection Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Fraud Detection Analytics</span>
          </CardTitle>
          <CardDescription>
            Machine learning model performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm text-gray-600">{fraudStats.accuracy}%</span>
              </div>
              <Progress value={fraudStats.accuracy} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Target: ≥90%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Precision</span>
                <span className="text-sm text-gray-600">{fraudStats.precision}%</span>
              </div>
              <Progress value={fraudStats.precision} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Target: ≥85%</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">F1-Score</span>
                <span className="text-sm text-gray-600">{fraudStats.f1Score}</span>
              </div>
              <Progress value={fraudStats.f1Score * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Target: ≥0.80</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">False Positives</span>
                <span className="text-sm text-gray-600">{fraudStats.falsePositives}</span>
              </div>
              <Progress value={(fraudStats.falsePositives / fraudStats.totalFlags) * 100} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Reduced by 25%</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Total Fraud Flags: <strong>{fraudStats.totalFlags}</strong> • 
              Model Version: <strong>v2.1.0</strong> • 
              Last Updated: <strong>2 hours ago</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Actions</CardTitle>
          <CardDescription>
            System management and monitoring tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link to="/audit-logs">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <FileText className="h-6 w-6" />
                <span>Audit Logs</span>
              </Button>
            </Link>
            <Link to="/fraud-alerts">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <AlertTriangle className="h-6 w-6" />
                <span>Fraud Alerts</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span>User Management</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
              <Settings className="h-6 w-6" />
              <span>System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent System Activity</span>
          </CardTitle>
          <CardDescription>
            Latest user actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.user}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">{log.action}: {log.resource}</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs mt-1 ${log.status === 'success' ? 'border-green-200 text-green-800' : 'border-red-200 text-red-800'}`}
                  >
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/audit-logs">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View All Audit Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* System Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">API Response Time</span>
                  <span className="text-sm text-gray-600">{systemStats.apiResponseTime}s</span>
                </div>
                <Progress value={(2 - systemStats.apiResponseTime) / 2 * 100} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">Target: ≤1.5s</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">System Uptime</span>
                  <span className="text-sm text-gray-600">{systemStats.systemUptime}%</span>
                </div>
                <Progress value={systemStats.systemUptime} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Encryption:</strong> AES-256 encryption active for all data
                </AlertDescription>
              </Alert>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Authentication:</strong> OAuth 2.0 + MFA enabled for all users
                </AlertDescription>
              </Alert>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Audit Trail:</strong> All user actions logged and monitored
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

