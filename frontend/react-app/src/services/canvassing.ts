import { api } from './api'

export interface WalkList {
  id: string
  name: string
  campaign_id: string
  volunteer: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  created_by: {
    id: string
    email: string
  }
  voter_ids: string[]
  target_date: string | null
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  notes: string
  created_at: string
  updated_at: string
  require_gps_verification: boolean
  max_distance_meters: number
}

export interface Questionnaire {
  id: string
  name: string
  campaign_id: string
  created_by: {
    id: string
    email: string
  }
  questions: QuestionnaireQuestion[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QuestionnaireQuestion {
  id: string
  question_text: string
  question_type: 'text' | 'multiple_choice' | 'scale' | 'boolean' | 'date'
  options?: string[]
  required: boolean
  order: number
}

export interface CanvassSession {
  id: string
  walk_list: string
  volunteer: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  questionnaire: string
  start_time: string
  end_time: string | null
  status: 'active' | 'paused' | 'completed'
  total_responses: number
  gps_verified_responses: number
  notes: string
}

export interface CanvassResponse {
  id: string
  session: string
  voter_id: string
  questionnaire: string
  responses: Record<string, any>
  location: {
    latitude: number
    longitude: number
  } | null
  gps_verified: boolean
  timestamp: string
  notes: string
}

export interface GPSLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

// Walk List Management
export const getWalkLists = async (): Promise<WalkList[]> => {
  const response = await api.get('/canvassing/walklists/')
  return response.data
}

export const getWalkList = async (id: string): Promise<WalkList> => {
  const response = await api.get(`/canvassing/walklists/${id}/`)
  return response.data
}

export const createWalkList = async (data: Partial<WalkList>): Promise<WalkList> => {
  const response = await api.post('/canvassing/walklists/', data)
  return response.data
}

export const updateWalkList = async (id: string, data: Partial<WalkList>): Promise<WalkList> => {
  const response = await api.patch(`/canvassing/walklists/${id}/`, data)
  return response.data
}

export const deleteWalkList = async (id: string): Promise<void> => {
  await api.delete(`/canvassing/walklists/${id}/`)
}

// Questionnaire Management
export const getQuestionnaires = async (): Promise<Questionnaire[]> => {
  const response = await api.get('/canvassing/questionnaires/')
  return response.data
}

export const getQuestionnaire = async (id: string): Promise<Questionnaire> => {
  const response = await api.get(`/canvassing/questionnaires/${id}/`)
  return response.data
}

export const createQuestionnaire = async (data: Partial<Questionnaire>): Promise<Questionnaire> => {
  const response = await api.post('/canvassing/questionnaires/', data)
  return response.data
}

export const updateQuestionnaire = async (id: string, data: Partial<Questionnaire>): Promise<Questionnaire> => {
  const response = await api.patch(`/canvassing/questionnaires/${id}/`, data)
  return response.data
}

export const deleteQuestionnaire = async (id: string): Promise<void> => {
  await api.delete(`/canvassing/questionnaires/${id}/`)
}

// Session Management
export const getCanvassSessions = async (): Promise<CanvassSession[]> => {
  const response = await api.get('/canvassing/sessions/')
  return response.data
}

export const getCanvassSession = async (id: string): Promise<CanvassSession> => {
  const response = await api.get(`/canvassing/sessions/${id}/`)
  return response.data
}

export const createCanvassSession = async (data: Partial<CanvassSession>): Promise<CanvassSession> => {
  const response = await api.post('/canvassing/sessions/', data)
  return response.data
}

export const updateCanvassSession = async (id: string, data: Partial<CanvassSession>): Promise<CanvassSession> => {
  const response = await api.patch(`/canvassing/sessions/${id}/`, data)
  return response.data
}

export const endCanvassSession = async (id: string): Promise<CanvassSession> => {
  const response = await api.post(`/canvassing/sessions/${id}/end/`)
  return response.data
}

// Response Management
export const getCanvassResponses = async (sessionId?: string): Promise<CanvassResponse[]> => {
  const params = sessionId ? { session: sessionId } : {}
  const response = await api.get('/canvassing/responses/', { params })
  return response.data
}

export const createCanvassResponse = async (data: Partial<CanvassResponse>): Promise<CanvassResponse> => {
  const response = await api.post('/canvassing/responses/', data)
  return response.data
}

export const updateCanvassResponse = async (id: string, data: Partial<CanvassResponse>): Promise<CanvassResponse> => {
  const response = await api.patch(`/canvassing/responses/${id}/`, data)
  return response.data
}

// GPS Verification
export const verifyGPSLocation = async (
  location: GPSLocation, 
  voterAddress: string
): Promise<{ verified: boolean; distance: number }> => {
  const response = await api.post('/canvassing/verify-gps/', {
    location,
    voter_address: voterAddress
  })
  return response.data
}

// Get current GPS location
export const getCurrentLocation = (): Promise<GPSLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        reject(new Error(`GPS error: ${error.message}`))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

// Watch GPS location
export const watchLocation = (
  onLocationUpdate: (location: GPSLocation) => void,
  onError: (error: Error) => void
): number => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by this browser'))
    return -1
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      })
    },
    (error) => {
      onError(new Error(`GPS error: ${error.message}`))
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 5000
    }
  )
}

export const stopWatchingLocation = (watchId: number): void => {
  if (navigator.geolocation && watchId !== -1) {
    navigator.geolocation.clearWatch(watchId)
  }
}