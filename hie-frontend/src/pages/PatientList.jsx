import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  Users,
  Search,
  Filter,
  Eye,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react'

export default function PatientList() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadPatients()
  }, [currentPage, searchTerm, genderFilter])

  const loadPatients = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock patient data with Kenyan context
      const mockPatients = [
        {
          id: '1',
          nhifId: 'NHIF-12345',
          firstName: 'Grace',
          lastName: 'Muthoni',
          dateOfBirth: '1985-03-15',
          gender: 'female',
          phone: '+254712345678',
          email: 'grace.muthoni@email.com',
          lastVisit: '2024-07-18T10:30:00Z',
          status: 'active'
        },
        {
          id: '2',
          nhifId: 'NHIF-67890',
          firstName: 'Peter',
          lastName: 'Ochieng',
          dateOfBirth: '1978-11-22',
          gender: 'male',
          phone: '+254723456789',
          email: 'peter.ochieng@email.com',
          lastVisit: '2024-07-17T14:15:00Z',
          status: 'active'
        },
        {
          id: '3',
          nhifId: 'NHIF-11111',
          firstName: 'Sarah',
          lastName: 'Wanjiku',
          dateOfBirth: '1992-07-08',
          gender: 'female',
          phone: '+254734567890',
          email: 'sarah.wanjiku@email.com',
          lastVisit: '2024-07-16T09:45:00Z',
          status: 'active'
        },
        {
          id: '4',
          nhifId: 'NHIF-22222',
          firstName: 'John',
          lastName: 'Kamau',
          dateOfBirth: '1965-12-03',
          gender: 'male',
          phone: '+254745678901',
          email: 'john.kamau@email.com',
          lastVisit: '2024-07-15T16:20:00Z',
          status: 'active'
        },
        {
          id: '5',
          nhifId: 'NHIF-33333',
          firstName: 'Mary',
          lastName: 'Akinyi',
          dateOfBirth: '1990-05-18',
          gender: 'female',
          phone: '+254756789012',
          email: 'mary.akinyi@email.com',
          lastVisit: '2024-07-14T11:10:00Z',
          status: 'active'
        }
      ]

      // Apply filters
      let filteredPatients = mockPatients
      
      if (searchTerm) {
        filteredPatients = filteredPatients.filter(patient =>
          patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.nhifId.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (genderFilter !== 'all') {
        filteredPatients = filteredPatients.filter(patient => patient.gender === genderFilter)
      }

      setPatients(filteredPatients)
      setTotalPages(Math.ceil(filteredPatients.length / 10))
    } catch (error) {
      console.error('Error loading patients:', error)
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

  const getGenderBadgeColor = (gender) => {
    switch (gender) {
      case 'male':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'female':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-gray-600 mt-1">
            Manage and view patient information across the HIE network
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {user?.role === 'doctor' && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Search & Filter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or NHIF ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadPatients} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Patient List</span>
          </CardTitle>
          <CardDescription>
            {patients.length} patients found • Page {currentPage} of {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading patients...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Info</TableHead>
                    <TableHead>NHIF ID</TableHead>
                    <TableHead>Age/Gender</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {patient.nhifId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{calculateAge(patient.dateOfBirth)} years</span>
                          <Badge className={`text-xs ${getGenderBadgeColor(patient.gender)}`}>
                            {patient.gender}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{patient.phone}</p>
                          <p className="text-gray-500">{patient.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(patient.lastVisit).toLocaleDateString()}</p>
                          <p className="text-gray-500">
                            {new Date(patient.lastVisit).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link to={`/patients/${patient.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && patients.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {patients.length} of {patients.length} patients
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

          {!loading && patients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600">
                {searchTerm || genderFilter !== 'all' 
                  ? 'Try adjusting your search criteria'
                  : 'No patients have been added to the system yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

