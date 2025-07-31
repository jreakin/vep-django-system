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
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
} from '@mui/material'
import {
  TrendingUp,
  People,
  Dashboard as DashboardIcon,
  Notifications,
  AttachMoney,
  ContactPhone,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material'
import dashboardService, { type DashboardStats } from '../services/dashboard'
import { isVisionOS } from '../utils/visionOS'
import SpatialMetricWidget from '../components/spatial/SpatialMetricWidget'
import {
  FundsRaisedWidget,
  VoterContactsWidget,
  TotalVotersWidget,
  ChartsCreatedWidget,
} from '../components/spatial/SpatialWidgets'
import '../components/spatial/SpatialWidgets.css'

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  showSpatialButton?: boolean
  onMakeSpatial?: () => void
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  showSpatialButton = false,
  onMakeSpatial 
}) => (
  <Card sx={{ height: '100%', position: 'relative' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        {showSpatialButton && onMakeSpatial && (
          <Tooltip title="Available for spatial placement">
            <Chip
              label="Spatial"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ ml: 'auto' }}
              onClick={onMakeSpatial}
            />
          </Tooltip>
        )}
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
)

const DashboardWithSpatial: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spatialMode, setSpatialMode] = useState(false)
  const [showSpatialWidgets, setShowSpatialWidgets] = useState(isVisionOS())
  
  // Mock additional data for spatial widgets
  const [mockData, setMockData] = useState({
    fundsRaised: 125000,
    fundsTarget: 200000,
    voterContacts: 15420,
    voterContactsThisWeek: 1240,
    registeredVoters: 45000,
    likelyVoters: 32000,
    chartsThisMonth: 8,
  })

  const visionOSAvailable = isVisionOS()

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

  const handleRefreshStats = async () => {
    try {
      const dashboardStats = await dashboardService.getStats()
      setStats(dashboardStats)
      
      // Also simulate updating mock data
      setMockData(prev => ({
        ...prev,
        fundsRaised: prev.fundsRaised + Math.floor(Math.random() * 1000),
        voterContacts: prev.voterContacts + Math.floor(Math.random() * 100),
        voterContactsThisWeek: prev.voterContactsThisWeek + Math.floor(Math.random() * 50),
      }))
    } catch (err) {
      console.error('Failed to refresh dashboard data:', err)
    }
  }

  const handleMakeSpatial = (metricType: string) => {
    console.log(`Making ${metricType} metric spatial`)
    // This would trigger the spatial widget to be created
    // The actual spatial functionality is handled by the SpatialMetricWidget components
  }

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

  const traditionalMetrics = [
    {
      title: 'Dashboards',
      value: stats.dashboards_count.toString(),
      icon: <DashboardIcon fontSize="large" />,
      color: '#1976d2',
      spatial: false,
    },
    {
      title: 'Total Voters',
      value: stats.total_voters ? stats.total_voters.toLocaleString() : 'N/A',
      icon: <People fontSize="large" />,
      color: '#2e7d32',
      spatial: true,
    },
    {
      title: 'Charts Created',
      value: stats.charts_count.toString(),
      icon: <TrendingUp fontSize="large" />,
      color: '#ed6c02',
      spatial: true,
    },
    {
      title: 'Notifications',
      value: stats.unread_notifications.toString(),
      icon: <Notifications fontSize="large" />,
      color: '#9c27b0',
      spatial: false,
    },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to your Political Campaign Management dashboard. Here's an overview of your current activities.
          </Typography>
        </Box>
        
        {visionOSAvailable && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip
              label="visionOS Ready"
              color="primary"
              size="small"
              icon={<Visibility />}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showSpatialWidgets}
                  onChange={(e) => setShowSpatialWidgets(e.target.checked)}
                />
              }
              label="Spatial Widgets"
            />
          </Box>
        )}
      </Box>

      {/* Spatial Widgets Section (visionOS only) */}
      {visionOSAvailable && showSpatialWidgets && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, backgroundColor: 'rgba(25, 118, 210, 0.05)' }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility />
            Spatial Widgets
            <Chip label="visionOS" size="small" color="primary" />
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            These widgets can be placed in your physical environment. Click the spatial icon to extract them from the browser.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <FundsRaisedWidget
                value={mockData.fundsRaised}
                target={mockData.fundsTarget}
                onRefresh={handleRefreshStats}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <VoterContactsWidget
                value={mockData.voterContacts}
                thisWeek={mockData.voterContactsThisWeek}
                onRefresh={handleRefreshStats}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TotalVotersWidget
                value={stats.total_voters || 0}
                registered={mockData.registeredVoters}
                likely={mockData.likelyVoters}
                onRefresh={handleRefreshStats}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <ChartsCreatedWidget
                value={stats.charts_count}
                thisMonth={mockData.chartsThisMonth}
                onRefresh={handleRefreshStats}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Traditional Metrics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {traditionalMetrics.map((metric) => (
          <MetricCard 
            key={metric.title} 
            {...metric} 
            showSpatialButton={visionOSAvailable && metric.spatial}
            onMakeSpatial={() => handleMakeSpatial(metric.title)}
          />
        ))}
      </Box>

      {/* Enhanced Fund Raising Widget as example */}
      {visionOSAvailable && (
        <Paper elevation={1} sx={{ p: 3, mb: 4, borderLeft: '4px solid #4caf50' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#4caf50' }}>
            <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
            Campaign Finance (Spatial Ready)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SpatialMetricWidget
                title="Funds Raised"
                value={mockData.fundsRaised}
                unit="$"
                icon={<AttachMoney fontSize="large" />}
                color="#4caf50"
                subtitle={`${Math.round((mockData.fundsRaised / mockData.fundsTarget) * 100)}% of goal`}
                data={[
                  { label: 'Target', value: `$${mockData.fundsTarget.toLocaleString()}` },
                  { label: 'Remaining', value: `$${(mockData.fundsTarget - mockData.fundsRaised).toLocaleString()}` },
                  { label: 'Monthly Avg', value: '$12,500' }
                ]}
                onRefresh={handleRefreshStats}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SpatialMetricWidget
                title="Donor Contacts"
                value={mockData.voterContacts}
                icon={<ContactPhone fontSize="large" />}
                color="#2196f3"
                subtitle={`${mockData.voterContactsThisWeek} this week`}
                data={[
                  { label: 'This Week', value: mockData.voterContactsThisWeek.toString() },
                  { label: 'Daily Avg', value: Math.round(mockData.voterContactsThisWeek / 7).toString() },
                  { label: 'Response Rate', value: '23%' }
                ]}
                onRefresh={handleRefreshStats}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Activity Overview */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recent uploads: {stats.recent_uploads} | Recent voters: {stats.recent_voters || 0}
            </Typography>
            {visionOSAvailable && (
              <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                💡 Tip: Use spatial widgets to monitor these metrics while working in other apps
              </Typography>
            )}
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

      {/* VisionOS Information Banner */}
      {!visionOSAvailable && (
        <Alert 
          severity="info" 
          sx={{ mt: 3 }}
          icon={<VisibilityOff />}
        >
          <Typography variant="body2">
            <strong>Spatial Features Available on visionOS:</strong> View this dashboard on Safari for visionOS to access spatial widgets that can be placed in your physical environment.
          </Typography>
        </Alert>
      )}
    </Box>
  )
}

export default DashboardWithSpatial