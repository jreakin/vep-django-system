import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  TrendingUp,
  People,
  Campaign,
  AttachMoney,
  Dashboard as DashboardIcon,
  Notifications,
} from '@mui/icons-material'
import dashboardService, { type DashboardStats } from '../services/dashboard'

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const dashboardStats = await dashboardService.getStats()
        setStats(dashboardStats)
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err.response?.data?.error || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (!stats) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="info">
          No dashboard data available.
        </Alert>
      </Box>
    )
  }

  const metrics = [
    {
      title: 'Dashboards',
      value: stats.dashboards_count.toString(),
      icon: <DashboardIcon fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Total Voters',
      value: stats.total_voters ? stats.total_voters.toLocaleString() : 'N/A',
      icon: <People fontSize="large" />,
      color: '#2e7d32',
    },
    {
      title: 'Charts Created',
      value: stats.charts_count.toString(),
      icon: <TrendingUp fontSize="large" />,
      color: '#ed6c02',
    },
    {
      title: 'Notifications',
      value: stats.unread_notifications.toString(),
      icon: <Notifications fontSize="large" />,
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
              Recent uploads: {stats.recent_uploads} | Recent voters: {stats.recent_voters || 0}
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