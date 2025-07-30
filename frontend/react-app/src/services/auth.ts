import api from './api'

interface AuthResponse {
  user: {
    id: number
    phone_number: string
    user_type: 'state_party' | 'county_party' | 'campaign' | 'vendor'
    first_name?: string
    last_name?: string
    email?: string
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
    return response.data
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout/')
  },

  // Get current user
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const response = await api.get('/auth/user/')
    return response.data
  },
}

export default authService