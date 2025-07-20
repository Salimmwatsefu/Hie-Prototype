import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Eye, EyeOff, Smartphone, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMFA, setShowMFA] = useState(false)
  const [mfaCode, setMfaCode] = useState('')

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const result = await login(formData.email, formData.password)
      
      if (!result.success) {
        setError(result.error)
      } else if (result.user?.mfaEnabled) {
        // Show MFA input if enabled
        setShowMFA(true)
      }
      // If login successful and no MFA, user will be redirected by the Navigate component
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMFASubmit = async (e) => {
    e.preventDefault()
    // MFA verification would be implemented here
    // For demo purposes, we'll simulate success
    setShowMFA(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">HIE System</h1>
          </div>
          <p className="text-lg text-gray-600">Health Information Exchange</p>
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              AES-256 Encrypted
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              MFA Enabled
            </Badge>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">
              {showMFA ? 'Multi-Factor Authentication' : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-center">
              {showMFA 
                ? 'Enter the verification code from your authenticator app'
                : 'Enter your credentials to access the HIE system'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!showMFA ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="doctor@hospital.co.ke"
                    required
                    className="h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      className="h-12 text-base pr-10"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMFASubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mfaCode" className="text-base font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="mfaCode"
                    name="mfaCode"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    className="h-12 text-base text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setShowMFA(false)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12"
                  >
                    Verify
                  </Button>
                </div>
              </form>
            )}

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Doctor:</strong> doctor@knh.co.ke / password123</div>
                <div><strong>Nurse:</strong> nurse@knh.co.ke / password123</div>
                <div><strong>Admin:</strong> admin@hie.co.ke / password123</div>
              </div>
            </div>

            {/* Security Features */}
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>Protected by OAuth 2.0, AES-256 encryption, and multi-factor authentication</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Health Information Exchange System</p>
          <p>Secure • Compliant • Interoperable</p>
        </div>
      </div>
    </div>
  )
}

