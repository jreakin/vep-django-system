import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Campaign as CampaignIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
} from '@mui/icons-material'
import campaignService, { type Campaign } from '../../services/campaign'

const CampaignList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        setError(null)
        const campaignData = await campaignService.getCampaigns()
        setCampaigns(campaignData)
      } catch (err: any) {
        console.error('Failed to fetch campaigns:', err)
        setError(err.response?.data?.error || 'Failed to load campaigns')
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const updatedCampaign = await campaignService.startCampaign(campaignId)
      setCampaigns(prev => 
        prev.map(c => c.id === campaignId ? updatedCampaign : c)
      )
    } catch (err: any) {
      console.error('Failed to start campaign:', err)
      setError('Failed to start campaign')
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const updatedCampaign = await campaignService.pauseCampaign(campaignId)
      setCampaigns(prev => 
        prev.map(c => c.id === campaignId ? updatedCampaign : c)
      )
    } catch (err: any) {
      console.error('Failed to pause campaign:', err)
      setError('Failed to pause campaign')
    }
  }

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'running':
        return 'success'
      case 'draft':
        return 'warning'
      case 'scheduled':
        return 'info'
      case 'paused':
        return 'warning'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading campaigns...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Campaigns
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Campaigns
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2 }}
        >
          Create Campaign
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your political campaigns, track performance, and optimize targeting.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 3,
        }}
      >
        {campaigns.map((campaign) => (
          <Card key={campaign.id} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <CampaignIcon sx={{ color: 'primary.main', mr: 1, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {campaign.name}
                  </Typography>
                  <Chip
                    label={campaign.status.toUpperCase()}
                    color={getStatusColor(campaign.status)}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                </Box>
              </Box>

              <Stack spacing={1} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Budget:
                  </Typography>
                  <Typography variant="body2">
                    {campaign.budget ? `$${campaign.budget.toLocaleString()}` : 'Not set'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Audience:
                  </Typography>
                  <Typography variant="body2">
                    {campaign.audience_name || 'Not set'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Platform:
                  </Typography>
                  <Typography variant="body2">
                    {campaign.platform || 'Not set'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Sent:
                  </Typography>
                  <Typography variant="body2">
                    {campaign.sent_count.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Created:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  sx={{ flex: 1 }}
                >
                  View
                </Button>
                {campaign.status === 'draft' || campaign.status === 'paused' ? (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<StartIcon />}
                    sx={{ flex: 1 }}
                    onClick={() => handleStartCampaign(campaign.id)}
                  >
                    Start
                  </Button>
                ) : campaign.status === 'running' ? (
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    startIcon={<PauseIcon />}
                    sx={{ flex: 1 }}
                    onClick={() => handlePauseCampaign(campaign.id)}
                  >
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EditIcon />}
                    sx={{ flex: 1 }}
                  >
                    Edit
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default CampaignList