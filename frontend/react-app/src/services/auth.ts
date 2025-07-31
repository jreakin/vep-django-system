import api from './api'

interface AuthResponse {
  user: {
    id: string  // UUID field
    phone_number: string
    role: 'owner' | 'state' | 'county' | 'campaign' | 'vendor'
    email?: string
    is_verified: boolean
    created_at: string
    updated_at: string
  }
  token: string
}

interface SendPinRequest {
  phone_number: string
}

interface VerifyPinRequest {
  phone_number: string
  pin: string
}

export const authService = {
  // Send PIN to phone number
  sendPin: async (data: SendPinRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/send-pin/', data)
    return response.data
  },

  // Verify PIN and login
  verifyPin: async (data: VerifyPinRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-pin/', data)
    // Store token in localStorage for axios interceptor
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout/')
  },

  // Get current user (simulated - in production this would be a real endpoint)
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    // For now, we'll extract user data from the token verification
    // In a real implementation, this would be a dedicated endpoint
    try {
      const response = await api.get('/dashboards/stats/')
      // If the stats endpoint works, the user is authenticated
      // Return basic user info (this is a temporary implementation)
      return {
        id: 'current-user',
        phone_number: 'authenticated-user',
        role: 'campaign',
        email: '',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error('User not authenticated')
    }
  },
}

export default authService