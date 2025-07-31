import { api } from './api'

export interface RedistrictingPlan {
  id: string
  name: string
  description: string
  state: string
  created_by: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
  is_active: boolean
  districts: District[]
  status: 'draft' | 'in_review' | 'approved' | 'rejected'
  compliance_score: number
  population_deviation: number
}

export interface District {
  id: string
  plan: string
  district_number: number
  name: string
  geometry: GeoJSON.Geometry
  population: number
  voting_age_population: number
  minority_population: number
  demographics: DistrictDemographics
  created_at: string
  updated_at: string
}

export interface DistrictDemographics {
  total_population: number
  white_population: number
  black_population: number
  hispanic_population: number
  asian_population: number
  other_population: number
  median_age: number
  median_income: number
  voters_registered: number
}

export interface PlanComparison {
  id: string
  plan_a: string
  plan_b: string
  created_by: string
  comparison_metrics: ComparisonMetrics
  created_at: string
}

export interface ComparisonMetrics {
  population_deviation_diff: number
  compactness_diff: number
  minority_representation_diff: number
  competitiveness_diff: number
  vra_compliance_diff: number
}

export interface PlanMetrics {
  id: string
  plan: string
  total_population: number
  population_deviation: number
  compactness_score: number
  minority_majority_districts: number
  competitive_districts: number
  vra_compliance_score: number
  equal_population_score: number
  contiguity_score: number
  calculated_at: string
}

export interface PlanExport {
  id: string
  plan: string
  format: 'shapefile' | 'geojson' | 'kml' | 'csv'
  file_url: string
  created_at: string
  expires_at: string
}

// Plan Management
export const getRedistrictingPlans = async (): Promise<RedistrictingPlan[]> => {
  const response = await api.get('/redistricting/plans/')
  return response.data
}

export const getRedistrictingPlan = async (id: string): Promise<RedistrictingPlan> => {
  const response = await api.get(`/redistricting/plans/${id}/`)
  return response.data
}

export const createRedistrictingPlan = async (data: Partial<RedistrictingPlan>): Promise<RedistrictingPlan> => {
  const response = await api.post('/redistricting/plans/', data)
  return response.data
}

export const updateRedistrictingPlan = async (id: string, data: Partial<RedistrictingPlan>): Promise<RedistrictingPlan> => {
  const response = await api.patch(`/redistricting/plans/${id}/`, data)
  return response.data
}

export const deleteRedistrictingPlan = async (id: string): Promise<void> => {
  await api.delete(`/redistricting/plans/${id}/`)
}

export const validatePlan = async (planId: string): Promise<{ valid: boolean; errors: string[] }> => {
  const response = await api.post(`/redistricting/plans/${planId}/validate/`)
  return response.data
}

// District Management
export const getDistricts = async (planId?: string): Promise<District[]> => {
  const params = planId ? { plan: planId } : {}
  const response = await api.get('/redistricting/districts/', { params })
  return response.data
}

export const getDistrict = async (id: string): Promise<District> => {
  const response = await api.get(`/redistricting/districts/${id}/`)
  return response.data
}

export const createDistrict = async (data: Partial<District>): Promise<District> => {
  const response = await api.post('/redistricting/districts/', data)
  return response.data
}

export const updateDistrict = async (id: string, data: Partial<District>): Promise<District> => {
  const response = await api.patch(`/redistricting/districts/${id}/`, data)
  return response.data
}

export const deleteDistrict = async (id: string): Promise<void> => {
  await api.delete(`/redistricting/districts/${id}/`)
}

export const getDistrictDemographics = async (districtId: string): Promise<DistrictDemographics> => {
  const response = await api.get(`/redistricting/districts/${districtId}/demographics/`)
  return response.data
}

// Plan Comparison
export const getPlanComparisons = async (): Promise<PlanComparison[]> => {
  const response = await api.get('/redistricting/comparisons/')
  return response.data
}

export const createPlanComparison = async (planAId: string, planBId: string): Promise<PlanComparison> => {
  const response = await api.post('/redistricting/comparisons/', {
    plan_a: planAId,
    plan_b: planBId
  })
  return response.data
}

export const comparePlans = async (planId: string, compareToId: string): Promise<ComparisonMetrics> => {
  const response = await api.post(`/redistricting/plans/${planId}/compare/`, {
    compare_to: compareToId
  })
  return response.data
}

// Plan Metrics
export const getPlanMetrics = async (planId?: string): Promise<PlanMetrics[]> => {
  const params = planId ? { plan: planId } : {}
  const response = await api.get('/redistricting/metrics/', { params })
  return response.data
}

export const calculatePlanMetrics = async (planId: string): Promise<PlanMetrics> => {
  const response = await api.post(`/redistricting/plans/${planId}/calculate-metrics/`)
  return response.data
}

// Export functionality
export const getPlanExports = async (planId?: string): Promise<PlanExport[]> => {
  const params = planId ? { plan: planId } : {}
  const response = await api.get('/redistricting/exports/', { params })
  return response.data
}

export const exportPlan = async (planId: string, format: string): Promise<PlanExport> => {
  const response = await api.post(`/redistricting/plans/${planId}/export/${format}/`)
  return response.data
}

// File uploads
export const uploadShapefile = async (file: File): Promise<{ plan_id: string; message: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/redistricting/upload/shapefile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const importPlan = async (file: File, name: string): Promise<RedistrictingPlan> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)
  
  const response = await api.post('/redistricting/import/plan/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// VRA Compliance Analysis
export interface VRACompliance {
  overall_score: number
  minority_opportunity_districts: number
  required_minority_districts: number
  population_deviation_compliant: boolean
  contiguity_compliant: boolean
  compactness_score: number
  recommendations: string[]
  violations: string[]
}

export const analyzeVRACompliance = async (planId: string): Promise<VRACompliance> => {
  const response = await api.get(`/redistricting/plans/${planId}/vra-compliance/`)
  return response.data
}

// Boundary editing utilities
export interface BoundaryEditOperation {
  type: 'add_block' | 'remove_block' | 'transfer_block'
  from_district?: string
  to_district: string
  census_block_id: string
}

export const editDistrictBoundary = async (
  districtId: string, 
  operations: BoundaryEditOperation[]
): Promise<District> => {
  const response = await api.post(`/redistricting/districts/${districtId}/edit-boundary/`, {
    operations
  })
  return response.data
}

export const getCensusBlocks = async (bounds: {
  north: number
  south: number
  east: number
  west: number
}): Promise<any[]> => {
  const response = await api.get('/redistricting/census-blocks/', {
    params: bounds
  })
  return response.data
}