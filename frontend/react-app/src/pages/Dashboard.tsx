import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Stack,
} from '@mui/material'
import {
  TrendingUp,
  People,
  Campaign,
  AttachMoney,
} from '@mui/icons-material'

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
)

const Dashboard: React.FC = () => {
  const metrics = [
    {
      title: 'Active Campaigns',
      value: '12',
      icon: <Campaign fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Total Voters',
      value: '156,789',
      icon: <People fontSize="large" />,
      color: '#2e7d32',
    },
    {
      title: 'Engagement Rate',
      value: '67.3%',
      icon: <TrendingUp fontSize="large" />,
      color: '#ed6c02',
    },
    {
      title: 'Monthly Revenue',
      value: '$12,450',
      icon: <AttachMoney fontSize="large" />,
      color: '#9c27b0',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to your Political Campaign Management dashboard. Here's an overview of your current activities.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Campaign analytics and voter engagement charts will be displayed here.
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create campaign, upload voter data, and other quick actions will be available here.
            </Typography>
          </Paper>
        </Box>
      </Stack>
    </Box>
  )
}

export default Dashboard