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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const decodedToken: any = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      return {
        id: decodedToken.id,
        phone_number: decodedToken.phone_number,
        role: decodedToken.role,
        email: decodedToken.email || '',
        is_verified: decodedToken.is_verified,
        created_at: decodedToken.created_at,
        updated_at: decodedToken.updated_at,
      };
    } catch (error) {
      throw new Error('User not authenticated')
    }
  },
}

export default authService