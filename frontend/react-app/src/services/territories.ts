import { api } from './api'

export interface Territory {
  id: string
  name: string
  description: string
  state: string
  territory_type: 'precinct' | 'district' | 'county' | 'custom'
  geometry: GeoJSON.Geometry
  population: number
  voter_count: number
  created_by: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface WalkListTerritory {
  id: string
  name: string
  campaign_id: string
  territory: string
  volunteer: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  voters_assigned: number
  status: 'active' | 'completed' | 'paused'
  created_at: string
  target_completion_date: string | null
}

export interface TerritoryAssignment {
  id: string
  territory: string
  voter_id: string
  assigned_at: string
  assigned_by: {
    id: string
    email: string
  }
  is_active: boolean
}

export interface CanvassRoute {
  id: string
  territory: string
  walk_list: string
  route_points: RoutePoint[]
  total_distance_km: number
  estimated_time_hours: number
  optimization_type: 'shortest' | 'fastest' | 'walking'
  created_at: string
  is_optimized: boolean
}

export interface RoutePoint {
  order: number
  voter_id: string
  address: string
  latitude: number
  longitude: number
  estimated_time_minutes: number
}

export interface TerritoryAnalytics {
  id: string
  territory: string
  total_voters: number
  registered_voters: number
  demographics: {
    age_groups: Record<string, number>
    party_affiliation: Record<string, number>
    voting_history: Record<string, number>
  }
  canvassing_stats: {
    total_contacts: number
    successful_contacts: number
    contact_rate: number
    completion_rate: number
  }
  performance_metrics: {
    average_time_per_voter: number
    best_contact_hours: string[]
    volunteer_efficiency: number
  }
  calculated_at: string
}

export interface VoterAssignmentRequest {
  territory_id: string
  voter_ids: string[]
  assignment_criteria?: {
    by_proximity: boolean
    max_distance_meters?: number
    respect_existing_assignments: boolean
  }
}

export interface SpatialQueryRequest {
  territory_id: string
  query_type: 'within' | 'intersects' | 'nearby'
  radius_meters?: number
  additional_filters?: {
    party?: string
    age_min?: number
    age_max?: number
    voting_history_min?: number
  }
}

// Territory Management
export const getTerritories = async (): Promise<Territory[]> => {
  const response = await api.get('/territories/territories/')
  return response.data
}

export const getTerritory = async (id: string): Promise<Territory> => {
  const response = await api.get(`/territories/territories/${id}/`)
  return response.data
}

export const createTerritory = async (data: Partial<Territory>): Promise<Territory> => {
  const response = await api.post('/territories/territories/', data)
  return response.data
}

export const updateTerritory = async (id: string, data: Partial<Territory>): Promise<Territory> => {
  const response = await api.patch(`/territories/territories/${id}/`, data)
  return response.data
}

export const deleteTerritory = async (id: string): Promise<void> => {
  await api.delete(`/territories/territories/${id}/`)
}

// Walk List Territories
export const getWalkListTerritories = async (): Promise<WalkListTerritory[]> => {
  const response = await api.get('/territories/walk-lists/')
  return response.data
}

export const createWalkListTerritory = async (data: Partial<WalkListTerritory>): Promise<WalkListTerritory> => {
  const response = await api.post('/territories/walk-lists/', data)
  return response.data
}

export const updateWalkListTerritory = async (id: string, data: Partial<WalkListTerritory>): Promise<WalkListTerritory> => {
  const response = await api.patch(`/territories/walk-lists/${id}/`, data)
  return response.data
}

// Territory Assignments
export const getTerritoryAssignments = async (territoryId?: string): Promise<TerritoryAssignment[]> => {
  const params = territoryId ? { territory: territoryId } : {}
  const response = await api.get('/territories/assignments/', { params })
  return response.data
}

export const assignVotersToTerritory = async (request: VoterAssignmentRequest): Promise<TerritoryAssignment[]> => {
  const response = await api.post(`/territories/territories/${request.territory_id}/assign-voters/`, request)
  return response.data
}

export const spatialQueryVoters = async (request: SpatialQueryRequest): Promise<any[]> => {
  const response = await api.post(`/territories/territories/${request.territory_id}/spatial-query/`, request)
  return response.data
}

// Canvass Routes
export const getCanvassRoutes = async (territoryId?: string): Promise<CanvassRoute[]> => {
  const params = territoryId ? { territory: territoryId } : {}
  const response = await api.get('/territories/routes/', { params })
  return response.data
}

export const generateCanvassRoute = async (walkListId: string): Promise<CanvassRoute> => {
  const response = await api.post(`/territories/walk-lists/${walkListId}/generate-route/`)
  return response.data
}

export const optimizeCanvassRoute = async (walkListId: string, optimizationType: string): Promise<CanvassRoute> => {
  const response = await api.post(`/territories/walk-lists/${walkListId}/optimize-route/`, {
    optimization_type: optimizationType
  })
  return response.data
}

// Territory Analytics
export const getTerritoryAnalytics = async (territoryId?: string): Promise<TerritoryAnalytics[]> => {
  const params = territoryId ? { territory: territoryId } : {}
  const response = await api.get('/territories/analytics/', { params })
  return response.data
}

// Boundary drawing utilities
export interface BoundaryDrawingTools {
  createPolygon: (coordinates: number[][]) => GeoJSON.Polygon
  createMultiPolygon: (coordinates: number[][][]) => GeoJSON.MultiPolygon
  validateGeometry: (geometry: GeoJSON.Geometry) => { valid: boolean; errors: string[] }
  calculateArea: (geometry: GeoJSON.Geometry) => number
  calculatePerimeter: (geometry: GeoJSON.Geometry) => number
}

export const boundaryUtils: BoundaryDrawingTools = {
  createPolygon: (coordinates: number[][]): GeoJSON.Polygon => ({
    type: 'Polygon',
    coordinates: [coordinates]
  }),

  createMultiPolygon: (coordinates: number[][][]): GeoJSON.MultiPolygon => ({
    type: 'MultiPolygon',
    coordinates: coordinates.map(poly => [poly])
  }),

  validateGeometry: (geometry: GeoJSON.Geometry): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!geometry) {
      errors.push('Geometry is required')
      return { valid: false, errors }
    }

    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0]
      if (coords.length < 4) {
        errors.push('Polygon must have at least 4 coordinates')
      }
      if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
        errors.push('Polygon must be closed (first and last coordinates must be the same)')
      }
    }

    return { valid: errors.length === 0, errors }
  },

  calculateArea: (geometry: GeoJSON.Geometry): number => {
    // Simplified area calculation - in a real app you'd use a proper library like turf.js
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0]
      let area = 0
      for (let i = 0; i < coords.length - 1; i++) {
        area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]
      }
      return Math.abs(area) / 2
    }
    return 0
  },

  calculatePerimeter: (geometry: GeoJSON.Geometry): number => {
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0]
      let perimeter = 0
      for (let i = 0; i < coords.length - 1; i++) {
        const dx = coords[i + 1][0] - coords[i][0]
        const dy = coords[i + 1][1] - coords[i][1]
        perimeter += Math.sqrt(dx * dx + dy * dy)
      }
      return perimeter
    }
    return 0
  }
}

// Geocoding utilities
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // In a real app, you'd use a geocoding service like Google Maps or Mapbox
    // For now, return a mock response
    return { lat: 40.7128, lng: -74.0060 } // NYC coordinates as example
  } catch (error) {
    console.error('Geocoding failed:', error)
    return null
  }
}

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    // In a real app, you'd use reverse geocoding
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}` // Mock address
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    return null
  }
}