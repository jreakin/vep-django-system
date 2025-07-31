import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
} from '@mui/material'
import {
  TrendingUp,
  People,
  AttachMoney,
  Notifications,
} from '@mui/icons-material'
import SpatialMetricWidget from '../components/SpatialMetricWidget'
import SpatialWidgetManager from '../components/SpatialWidgetManager'
import { type SpatialWidgetConfig } from '../utils/visionOS'

const SpatialDemo: React.FC = () => {
  // Mock dashboard stats for demo
  const mockStats = {
    dashboards_count: 12,
    total_voters: 15847,
    charts_count: 8,
    unread_notifications: 3,
    recent_uploads: 2,
    recent_voters: 145
  }

  const metrics = [
    {
      title: 'Funds Raised',
      value: '$' + (mockStats.dashboards_count * 1000).toLocaleString(),
      icon: <AttachMoney fontSize="large" />,
      color: '#1976d2',
      canPopOut: true,
      id: 'funds-raised'
    },
    {
      title: 'Voter Contacts',
      value: mockStats.total_voters.toLocaleString(),
      icon: <People fontSize="large" />,
      color: '#2e7d32',
      canPopOut: true,
      id: 'voter-contacts'
    },
    {
      title: 'Charts Created',
      value: mockStats.charts_count.toString(),
      icon: <TrendingUp fontSize="large" />,
      color: '#ed6c02',
      canPopOut: true,
      id: 'charts-created'
    },
    {
      title: 'Notifications',
      value: mockStats.unread_notifications.toString(),
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

  const handleWidgetPopped = (widgetId: string) => {
    console.log(`Widget ${widgetId} popped out to spatial environment`);
  }

  return (
    <SpatialWidgetManager spatialWidgets={spatialWidgetConfigs}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          visionOS Spatial Dashboard Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This demo shows spatial dashboard widgets for Apple Vision Pro. On visionOS, you'll see pop-out icons that allow widgets to be placed in your spatial environment.
        </Typography>

        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom>
            🥽 visionOS Features
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Pop-out icons appear only on Apple Vision Pro<br/>
            • Level-of-detail rendering based on distance<br/>
            • Spatial environment indicator in bottom-right<br/>
            • Real-time widget updates in spatial mode
          </Typography>
        </Paper>

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
                Implementation Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Automatic visionOS detection via user agent<br/>
                • Mock spatial APIs for development testing<br/>
                • Graceful fallback for non-visionOS platforms<br/>
                • TypeScript-safe implementation
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Level of Detail
              </Typography>
              <Typography variant="body2" color="text.secondary">
                FAR: Icon + number only<br/>
                MEDIUM: Title + value<br/>
                CLOSE: Full details + controls
              </Typography>
            </Paper>
          </Box>
        </Stack>
      </Box>
    </SpatialWidgetManager>
  )
}

export default SpatialDemo