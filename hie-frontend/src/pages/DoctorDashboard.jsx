import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  AlertTriangle,
  Activity,
  Clock,
  TrendingUp,
  ArrowRightLeft,
  Shield,
  FileText,
  Plus,
  Eye
} from 'lucide-react'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentVisits: 0,
    pendingTransfers: 0,
    fraudAlerts: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [fraudAlerts, setFraudAlerts] = useState([])

  useEffect(() => {
    // Simulate loading dashboard data
    setStats({
      totalPatients: 247,
      recentVisits: 18,
      pendingTransfers: 3,
      fraudAlerts: 2
    })

    setRecentActivities([
      {
        id: 1,
        type: 'patient_visit',
        description: 'Updated medical record for Jane Wanjiku',
        time: '2 hours ago',
        patientId: 'NHIF-12345'
      },
      {
        id: 2,
        type: 'transfer',
        description: 'Patient transfer to Moi Teaching Hospital completed',
        time: '4 hours ago',
        patientId: 'NHIF-67890'
      },
      {
        id: 3,
        type: 'fraud_review',
        description: 'Reviewed fraud alert for suspicious claim',
        time: '6 hours ago',
        patientId: 'NHIF-11111'
      }
    ])

    setFraudAlerts([
      {
        id: 1,
        patientName: 'John Kamau',
        nhifId: 'NHIF-54321',
        riskScore: 0.84,
        riskLevel: 'high',
        detectedAt: '2024-07-19T10:30:00Z',
        flags: ['duplicate_billing', 'unusual_frequency']
      },
      {
        id: 2,
        patientName: 'Mary Akinyi',
        nhifId: 'NHIF-98765',
        riskScore: 0.67,
        riskLevel: 'medium',
        detectedAt: '2024-07-19T08:15:00Z',
        flags: ['high_cost_claim']
      }
    ])
  }, [])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'patient_visit':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-green-600" />
      case 'fraud_review':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
        
          <h1 className="text-2xl font-bold text-gray-900">
            Overview
          </h1>

            {/*

           
          <p className="text-gray-600 mt-1">
            {user?.hospitalId} • {new Date().toLocaleDateString('en-KE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          */}

        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Visits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentVisits}</div>
            <p className="text-xs text-muted-foreground">
              Today's appointments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTransfers}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraud Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.fraudAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Require review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts for efficient workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/patients">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span>View Patients</span>
              </Button>
            </Link>
            <Link to="/transfer">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <ArrowRightLeft className="h-6 w-6" />
                <span>Transfer Patient</span>
              </Button>
            </Link>
            <Link to="/fraud-alerts">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <AlertTriangle className="h-6 w-6" />
                <span>Review Alerts</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activities</span>
            </CardTitle>
            <CardDescription>
              Your latest actions in the HIE system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      {activity.patientId && (
                        <Badge variant="outline" className="text-xs">
                          {activity.patientId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View All Activities
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>High-Priority Fraud Alerts</span>
            </CardTitle>
            <CardDescription>
              Claims flagged for potential fraud requiring review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fraudAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{alert.patientName}</p>
                      <p className="text-sm text-gray-600">{alert.nhifId}</p>
                    </div>
                    <Badge className={getRiskBadgeColor(alert.riskLevel)}>
                      🔴 Fraud Risk: {Math.round(alert.riskScore * 100)}%
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {alert.flags.map((flag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {flag.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Detected: {new Date(alert.detectedAt).toLocaleString()}
                    </p>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/fraud-alerts">
                <Button variant="outline" size="sm" className="w-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View All Fraud Alerts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> All HIE services are operational. 
          FHIR compliance: 100% • API response time: &lt;1.5s • Encryption: AES-256 Active
        </AlertDescription>
      </Alert>
    </div>
  )
}

