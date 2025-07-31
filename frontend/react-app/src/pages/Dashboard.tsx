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
  AttachMoney,
  Notifications,
} from '@mui/icons-material'
import dashboardService, { type DashboardStats } from '../services/dashboard'
import SpatialMetricWidget from '../components/SpatialMetricWidget'
import SpatialWidgetManager from '../components/SpatialWidgetManager'
import { SpatialWidgetConfig } from '../utils/visionOS'

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}

// Legacy MetricCard component (kept for compatibility but not used in spatial implementation)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars  
  const [poppedWidgets, setPoppedWidgets] = useState<Set<string>>(new Set());

  const handleWidgetPopped = (widgetId: string) => {
    setPoppedWidgets(prev => new Set([...prev, widgetId]));
    console.log(`Widget ${widgetId} popped out to spatial environment`);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const dashboardStats = await dashboardService.getStats()
        setStats(dashboardStats)
      } catch (err: unknown) {
        console.error('Failed to fetch dashboard data:', err)
        const errorMessage = err instanceof Error && 'response' in err 
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error 
          : 'Failed to load dashboard data'
        setError(errorMessage || 'Failed to load dashboard data')
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
      title: 'Funds Raised',
      value: stats.dashboards_count.toString(),
      icon: <AttachMoney fontSize="large" />,
      color: '#1976d2',
      canPopOut: true,
      id: 'funds-raised'
    },
    {
      title: 'Voter Contacts',
      value: stats.total_voters ? stats.total_voters.toLocaleString() : 'N/A',
      icon: <People fontSize="large" />,
      color: '#2e7d32',
      canPopOut: true,
      id: 'voter-contacts'
    },
    {
      title: 'Charts Created',
      value: stats.charts_count.toString(),
      icon: <TrendingUp fontSize="large" />,
      color: '#ed6c02',
      canPopOut: true,
      id: 'charts-created'
    },
    {
      title: 'Notifications',
      value: stats.unread_notifications.toString(),
      icon: <Notifications fontSize="large" />,
      color: '#9c27b0',
      canPopOut: true,
      id: 'notifications'
    },
  ]

  const spatialWidgetConfigs: SpatialWidgetConfig[] = metrics.map(metric => ({
    id: metric.id,
    title: metric.title,
    value: metric.value,
    icon: metric.icon,
    color: metric.color,
    canPopOut: metric.canPopOut
  }))

  return (
    <SpatialWidgetManager spatialWidgets={spatialWidgetConfigs}>
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
            <SpatialMetricWidget
              key={metric.id}
              config={metric}
              value={metric.value}
              subtitle={metric.title === 'Voter Contacts' ? 'Total registered voters' : undefined}
              onPopOut={() => handleWidgetPopped(metric.id)}
            />
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
    </SpatialWidgetManager>
  )
}

export default Dashboard