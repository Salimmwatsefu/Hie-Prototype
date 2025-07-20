import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('hie_token')
        if (token) {
          // Verify token and get user profile
          const userProfile = await authService.getProfile()
          setUser(userProfile)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Clear invalid token
        localStorage.removeItem('hie_token')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setIsLoading(true)
      const response = await authService.login(email, password)
      
      // Store token
      localStorage.setItem('hie_token', response.token)
      
      // Set user state
      setUser(response.user)
      setIsAuthenticated(true)
      
      return { success: true, user: response.user }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('hie_token')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData)
      setUser(updatedUser)
      return { success: true, user: updatedUser }
    } catch (error) {
      console.error('Profile update error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Profile update failed' 
      }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      return { success: true }
    } catch (error) {
      console.error('Password change error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Password change failed' 
      }
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

