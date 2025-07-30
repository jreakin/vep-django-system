import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  Campaign as CampaignIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from '@mui/icons-material'

interface Campaign {
  id: number
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
  budget: number
  target_audience_size: number
}

const CampaignList: React.FC = () => {
  // Mock data - in real app this would come from API
  const campaigns: Campaign[] = [
    {
      id: 1,
      name: 'State Senate Campaign 2024',
      status: 'active',
      created_at: '2024-01-15',
      budget: 50000,
      target_audience_size: 15000,
    },
    {
      id: 2,
      name: 'County Commissioner Outreach',
      status: 'draft',
      created_at: '2024-01-20',
      budget: 25000,
      target_audience_size: 8500,
    },
    {
      id: 3,
      name: 'Municipal Election Campaign',
      status: 'completed',
      created_at: '2023-11-01',
      budget: 30000,
      target_audience_size: 12000,
    },
  ]

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'draft':
        return 'warning'
      case 'paused':
        return 'info'
      case 'completed':
        return 'default'
      default:
        return 'default'
    }
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
                    ${campaign.budget.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Target Audience:
                  </Typography>
                  <Typography variant="body2">
                    {campaign.target_audience_size.toLocaleString()}
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
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{ flex: 1 }}
                >
                  Edit
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default CampaignList