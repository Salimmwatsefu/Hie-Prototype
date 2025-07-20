import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Activity,
  Clock,
  Eye,
  Shield,
  FileText,
  Heart,
  Thermometer,
  Stethoscope
} from 'lucide-react'

export default function NurseDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    assignedPatients: 0,
    todayVisits: 0,
    vitalSigns: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [assignedPatients, setAssignedPatients] = useState([])

  useEffect(() => {
    // Simulate loading dashboard data
    setStats({
      assignedPatients: 32,
      todayVisits: 12,
      vitalSigns: 8
    })

    setRecentActivities([
      {
        id: 1,
        type: 'vital_signs',
        description: 'Recorded vital signs for Grace Muthoni',
        time: '1 hour ago',
        patientId: 'NHIF-12345'
      },
      {
        id: 2,
        type: 'patient_view',
        description: 'Viewed medical history for Peter Ochieng',
        time: '2 hours ago',
        patientId: 'NHIF-67890'
      },
      {
        id: 3,
        type: 'medication',
        description: 'Administered medication to Sarah Wanjiku',
        time: '3 hours ago',
        patientId: 'NHIF-11111'
      }
    ])

    setAssignedPatients([
      {
        id: 1,
        name: 'Grace Muthoni',
        nhifId: 'NHIF-12345',
        room: 'Ward A-12',
        condition: 'Stable',
        lastVitals: '2 hours ago',
        priority: 'normal'
      },
      {
        id: 2,
        name: 'Peter Ochieng',
        nhifId: 'NHIF-67890',
        room: 'Ward B-05',
        condition: 'Monitoring',
        lastVitals: '4 hours ago',
        priority: 'high'
      },
      {
        id: 3,
        name: 'Sarah Wanjiku',
        nhifId: 'NHIF-11111',
        room: 'Ward A-08',
        condition: 'Recovering',
        lastVitals: '1 hour ago',
        priority: 'normal'
      }
    ])
  }, [])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'vital_signs':
        return <Heart className="h-4 w-4 text-red-600" />
      case 'patient_view':
        return <Eye className="h-4 w-4 text-blue-600" />
      case 'medication':
        return <Stethoscope className="h-4 w-4 text-green-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'normal':
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, Nurse {user?.lastName}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.hospitalId} • {new Date().toLocaleDateString('en-KE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            Read-Only Access
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedPatients}</div>
            <p className="text-xs text-muted-foreground">
              Under your care
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayVisits}</div>
            <p className="text-xs text-muted-foreground">
              Patient interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vital Signs Recorded</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vitalSigns}</div>
            <p className="text-xs text-muted-foreground">
              Today's measurements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Essential nursing tasks and patient care activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/patients">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span>View All Patients</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
              <Heart className="h-6 w-6" />
              <span>Record Vital Signs</span>
            </Button>
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
              Your latest patient care activities
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

        {/* Assigned Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Priority Patients</span>
            </CardTitle>
            <CardDescription>
              Patients requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedPatients.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-600">{patient.nhifId} • {patient.room}</p>
                    </div>
                    <Badge className={getPriorityBadgeColor(patient.priority)}>
                      {patient.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">Status: {patient.condition}</p>
                      <p className="text-xs text-gray-500">Last vitals: {patient.lastVitals}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/patients">
                <Button variant="outline" size="sm" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  View All Assigned Patients
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nursing Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Important Reminders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription>
                <strong>Medication Round:</strong> Next scheduled medication administration at 2:00 PM
              </AlertDescription>
            </Alert>
            <Alert>
              <Thermometer className="h-4 w-4" />
              <AlertDescription>
                <strong>Vital Signs:</strong> 3 patients due for vital sign monitoring in the next hour
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>System Status:</strong> All patient records are accessible. 
          View-only access active • Data encryption: AES-256 • Last sync: 2 minutes ago
        </AlertDescription>
      </Alert>
    </div>
  )
}

