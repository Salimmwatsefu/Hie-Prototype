import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet'
import {
  Shield,
  Users,
  UserCheck,
  AlertTriangle,
  FileText,
  Activity,
  Settings,
  LogOut,
  Menu,
  Home,
  ArrowRightLeft,
  Lock,
  Eye
} from 'lucide-react'

const navigationItems = {
  doctor: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Transfer Patient', href: '/transfer', icon: ArrowRightLeft },
    { name: 'Fraud Alerts', href: '/fraud-alerts', icon: AlertTriangle },
  ],
  nurse: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Transfer Patient', href: '/transfer', icon: ArrowRightLeft },
    { name: 'Fraud Alerts', href: '/fraud-alerts', icon: AlertTriangle },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  ]
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

function Sidebar({ className = '' }) {
  const { user } = useAuth()
  const location = useLocation()
  
  const navItems = navigationItems[user?.role] || []
  
  return (
    <div className={`pb-12 ${className}`}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold">HIE System</h2>
          </div>
          
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`text-xs ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role?.toUpperCase()}
                  </Badge>
                  {user?.nhifId && (
                    <Badge variant="outline" className="text-xs">
                      {user.nhifId}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Security Status */}
          <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>AES-256 Active</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Secure
            </Badge>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              
              <div className="ml-4 md:ml-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  Health Information Exchange
                </h1>
                <p className="text-sm text-gray-500">
                  {user?.hospitalId && `${user.hospitalId} • `}
                  Real-time patient data sharing
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
              </div>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={`text-xs ${getRoleBadgeColor(user?.role)}`}>
                          {user?.role?.toUpperCase()}
                        </Badge>
                        {user?.nhifId && (
                          <Badge variant="outline" className="text-xs">
                            {user.nhifId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Activity Log</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

