import api from './api'

export interface VoterRecord {
  id: string  // UUID
  voter_id: string
  name: string
  first_name: string
  last_name: string
  address: string
  city: string
  state: string
  zip_code: string
  email: string
  phone: string
  date_of_birth?: string
  party_affiliation: string
  social_media: Record<string, any>
  employment: Record<string, any>
  data_source: string
  latitude?: number
  longitude?: number
  voter_vuid: string
  voter_registration_date?: string
  voter_registration_status: string
  voter_registration_status_reason: string
  voter_precinct_number: string
  voter_precinct_name: string
  voter_absentee: boolean
  created_at: string
  updated_at: string
}

export interface FileUpload {
  id: string  // UUID
  filename: string
  file_size: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error_message?: string
  total_records?: number
  processed_records?: number
  duplicates_found?: number
  created_at: string
  updated_at: string
}

export interface UploadProgress {
  upload_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  current_step: string
  total_records: number
  processed_records: number
  duplicates_found: number
  errors: string[]
  warnings: string[]
}

export interface VoterEngagement {
  id: string
  voter: string  // UUID reference
  engagement_type: 'call' | 'text' | 'email' | 'door_knock' | 'event'
  campaign: string  // UUID reference
  contact_date: string
  outcome: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'invalid'
  notes: string
  created_at: string
}

export const voterDataService = {
  // Get voters list with filtering
  getVoters: async (params?: {
    search?: string
    state?: string
    county?: string
    party_affiliation?: string
    registration_status?: string
    page?: number
    page_size?: number
  }): Promise<{ results: VoterRecord[]; count: number; next?: string; previous?: string }> => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    const response = await api.get(`/voter-data/voters/?${queryParams.toString()}`)
    return response.data
  },

  // Get single voter
  getVoter: async (id: string): Promise<VoterRecord> => {
    const response = await api.get(`/voter-data/voters/${id}/`)
    return response.data
  },

  // Upload voter data file
  uploadVoterData: async (file: File, onProgress?: (progress: number) => void): Promise<FileUpload> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/voter-data/upload/voter-data/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  // Get upload status
  getUploadStatus: async (uploadId: string): Promise<UploadProgress> => {
    const response = await api.get(`/voter-data/upload/${uploadId}/status/`)
    return response.data
  },

  // Process uploaded file
  processUpload: async (uploadId: string, mapping?: Record<string, string>): Promise<UploadProgress> => {
    const response = await api.post(`/voter-data/upload/${uploadId}/process/`, { mapping })
    return response.data
  },

  // Run deduplication on existing data
  deduplicateExisting: async (): Promise<{ task_id: string; message: string }> => {
    const response = await api.post('/voter-data/deduplicate/')
    return response.data
  },

  // Get voter engagement history
  getVoterEngagements: async (voterId?: string): Promise<VoterEngagement[]> => {
    const params = voterId ? `?voter=${voterId}` : ''
    const response = await api.get(`/voter-data/engagement/${params}`)
    return response.data.results || response.data
  },

  // Create voter engagement record
  createVoterEngagement: async (engagement: Partial<VoterEngagement>): Promise<VoterEngagement> => {
    const response = await api.post('/voter-data/engagement/', engagement)
    return response.data
  },

  // Verify voter address
  verifyVoterAddress: async (voterId: string): Promise<{ success: boolean; message: string; updated_address?: any }> => {
    const response = await api.post(`/voter-data/voters/${voterId}/verify-address/`)
    return response.data
  },

  // Update voter addresses
  updateVoterAddresses: async (voterId: string, addresses: any): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/voter-data/voters/${voterId}/update-addresses/`, { addresses })
    return response.data
  },

  // Get voter history
  getVoterHistory: async (voterId: string): Promise<any[]> => {
    const response = await api.get(`/voter-data/voters/${voterId}/history/`)
    return response.data
  },
}

export default voterDataService