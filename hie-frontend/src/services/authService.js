import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hie_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('hie_refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens
          
          localStorage.setItem('hie_access_token', accessToken)
          localStorage.setItem('hie_refresh_token', newRefreshToken)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('hie_access_token')
        localStorage.removeItem('hie_refresh_token')
        localStorage.removeItem('hie_user')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  // Login with email and password
  async login(email, password, mfaCode = null) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        mfaCode
      })

      const { user, tokens, requiresMFA, tempToken, message } = response.data

      if (requiresMFA) {
        return {
          success: true,
          requiresMFA: true,
          tempToken,
          message: message || 'MFA code required'
        }
      }

      // Store tokens and user data
      if (tokens) {
        localStorage.setItem('hie_access_token', tokens.accessToken)
        localStorage.setItem('hie_refresh_token', tokens.refreshToken)
        localStorage.setItem('hie_user', JSON.stringify(user))
      }

      return {
        success: true,
        user,
        tokens,
        message: message || 'Login successful'
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
        code: error.response?.data?.code
      }
    }
  },

  // Verify MFA code
  async verifyMFA(tempToken, mfaCode) {
    try {
      const response = await api.post('/auth/verify-mfa', {
        tempToken,
        mfaCode
      })

      const { user, tokens } = response.data

      // Store tokens and user data
      localStorage.setItem('hie_access_token', tokens.accessToken)
      localStorage.setItem('hie_refresh_token', tokens.refreshToken)
      localStorage.setItem('hie_user', JSON.stringify(user))

      return {
        success: true,
        user,
        tokens,
        message: 'MFA verification successful'
      }
    } catch (error) {
      console.error('MFA verification error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'MFA verification failed',
        code: error.response?.data?.code
      }
    }
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout')
      return { success: true, message: 'Logged out successfully' }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: 'Logout failed' }
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('hie_access_token')
      localStorage.removeItem('hie_refresh_token')
      localStorage.removeItem('hie_user')
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/profile')
      return response.data.user
    } catch (error) {
      console.error('Profile fetch error:', error)
      throw new Error(error.response?.data?.error || 'Failed to fetch profile')
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData)
      return response.data.user
    } catch (error) {
      console.error('Profile update error:', error)
      throw new Error(error.response?.data?.error || 'Failed to update profile')
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      console.error('Password change error:', error)
      throw new Error(error.response?.data?.error || 'Failed to change password')
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Registration error:', error)
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  },

  // Enable MFA
  async enableMFA() {
    try {
      const response = await api.post('/auth/enable-mfa')
      return {
        success: true,
        secret: response.data.secret,
        backupCodes: response.data.backupCodes
      }
    } catch (error) {
      console.error('MFA enable error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to enable MFA'
      }
    }
  },

  // Disable MFA
  async disableMFA(mfaCode) {
    try {
      const response = await api.post('/auth/disable-mfa', { mfaCode })
      return {
        success: true,
        message: response.data.message
      }
    } catch (error) {
      console.error('MFA disable error:', error)
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to disable MFA'
      }
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('hie_access_token')
    const user = localStorage.getItem('hie_user')
    return !!(token && user)
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('hie_user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Get access token
  getAccessToken() {
    return localStorage.getItem('hie_access_token')
  }
}

export default api

