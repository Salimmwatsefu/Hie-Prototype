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
  ArrowRightLeft,
  AlertTriangle,
  Eye,
  Home,
  FileText,
  Menu,
  LogOut,
  Settings,
  ChevronRight
} from 'lucide-react'

const navigationItems = {
  doctor: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Transfer Patient', href: '/transfer', icon: ArrowRightLeft },
    { name: 'Enhanced Fraud Detection', href: '/enhanced-fraud', icon: Shield },
    { name: 'Fraud Data Input', href: '/fraud-input', icon: Eye },
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
    { name: 'Enhanced Fraud Detection', href: '/enhanced-fraud', icon: Shield },
    { name: 'Fraud Data Input', href: '/fraud-input', icon: Eye },
    { name: 'Fraud Alerts', href: '/fraud-alerts', icon: AlertTriangle },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  ]
}

const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'doctor':
      return 'bg-teal-100 text-teal-800 border-teal-200'
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
    <div className={`pb-6 ${className}`}>
      <div className="space-y-8 py-5">
        <div className="px-4">
          {/* Branding */}
          <div className="flex items-center  space-x-3 mb-8 ">
            <div className="bg-teal-600/10 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">HIE System</h2>
          </div>
          
          {/* User Info */}
          
          
          {/* Navigation */}
          <nav className="space-y-1 mt-12">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group relative flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all
                    ${isActive 
                      ? 'bg-teal-50 font-semibold text-teal-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <div className={`p-2 mr-3 rounded-lg ${isActive ? 'bg-teal-200' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                      <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-500'}`} />
                    </div>
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-teal-500" />}
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
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex flex-col">
                <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-teal-800 text-white text-xs">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName?.[0]}.
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-teal-800 text-white">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <span>Account Settings</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Eye className="h-4 w-4 text-gray-600" />
                      </div>
                      <span>Activity Log</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="px-4 py-3 text-red-600 focus:bg-red-50"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-red-100">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <span>Log out</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
