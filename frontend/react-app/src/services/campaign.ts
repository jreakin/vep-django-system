import api from './api'

export interface Campaign {
  id: string  // UUID
  name: string
  campaign_type: 'awareness' | 'persuasion' | 'gotv' | 'fundraising' | 'volunteer_recruitment'
  audience: string  // UUID reference
  audience_name?: string  // From serializer
  platform?: string  // From serializer
  message_template: string
  personalization_data: Record<string, any>
  scheduled_send?: string  // ISO date string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
  budget?: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  conversion_count: number
  created_at: string
  updated_at: string
}

export interface Audience {
  id: string  // UUID
  name: string
  platform: 'email' | 'sms' | 'facebook' | 'twitter' | 'tiktok' | 'snapchat' | 'direct_mail' | 'phone'
  filters: Record<string, any>
  status: 'draft' | 'active' | 'paused' | 'completed'
  estimated_size: number
  created_at: string
  updated_at: string
}

export interface CampaignMetrics {
  campaign_id: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  conversion_count: number
  engagement_rate: number
  conversion_rate: number
}

export const campaignService = {
  // Get campaigns list
  getCampaigns: async (): Promise<Campaign[]> => {
    const response = await api.get('/campaigns/')
    return response.data.results || response.data
  },

  // Get single campaign
  getCampaign: async (id: string): Promise<Campaign> => {
    const response = await api.get(`/campaigns/${id}/`)
    return response.data
  },

  // Create campaign
  createCampaign: async (campaignData: Partial<Campaign>): Promise<Campaign> => {
    const response = await api.post('/campaigns/', campaignData)
    return response.data
  },

  // Update campaign
  updateCampaign: async (id: string, campaignData: Partial<Campaign>): Promise<Campaign> => {
    const response = await api.patch(`/campaigns/${id}/`, campaignData)
    return response.data
  },

  // Delete campaign
  deleteCampaign: async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}/`)
  },

  // Start campaign
  startCampaign: async (id: string): Promise<Campaign> => {
    const response = await api.post(`/campaigns/${id}/start/`)
    return response.data
  },

  // Pause campaign
  pauseCampaign: async (id: string): Promise<Campaign> => {
    const response = await api.post(`/campaigns/${id}/pause/`)
    return response.data
  },

  // Get campaign metrics
  getCampaignMetrics: async (id: string): Promise<CampaignMetrics> => {
    const response = await api.get(`/campaigns/${id}/metrics/`)
    return response.data
  },

  // Get audiences
  getAudiences: async (): Promise<Audience[]> => {
    const response = await api.get('/audiences/')
    return response.data.results || response.data
  },

  // Create audience
  createAudience: async (audienceData: Partial<Audience>): Promise<Audience> => {
    const response = await api.post('/audiences/', audienceData)
    return response.data
  },
}

export default campaignService