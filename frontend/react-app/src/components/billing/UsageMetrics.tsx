import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider
} from '@mui/material'
import {
  Api,
  Storage,
  People,
  TrendingUp
} from '@mui/icons-material'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import type { UsageMetrics as UsageMetricsType } from '../../services/billing'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface UsageMetricsProps {
  metrics: UsageMetricsType
}

const UsageMetrics: React.FC<UsageMetricsProps> = ({ metrics }) => {
  // Chart data for usage breakdown
  const usageChartData = {
    labels: ['API Calls', 'Storage (GB)', 'Users'],
    datasets: [
      {
        label: 'Usage',
        data: [
          metrics.breakdown.api_calls,
          metrics.breakdown.storage,
          metrics.breakdown.users
        ],
        backgroundColor: [
          'rgba(25, 118, 210, 0.6)',
          'rgba(156, 39, 176, 0.6)',
          'rgba(76, 175, 80, 0.6)'
        ],
        borderColor: [
          'rgba(25, 118, 210, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(76, 175, 80, 1)'
        ],
        borderWidth: 1
      }
    ]
  }

  // Pie chart data for cost breakdown
  const costChartData = {
    labels: ['API Calls', 'Storage', 'Users'],
    datasets: [
      {
        data: [
          metrics.breakdown.api_calls,
          metrics.breakdown.storage,
          metrics.breakdown.users
        ],
        backgroundColor: [
          'rgba(25, 118, 210, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(76, 175, 80, 0.8)'
        ],
        borderWidth: 2
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Usage Breakdown'
      }
    }
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Cost Distribution'
      }
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Usage Metrics for {metrics.period}
      </Typography>

      {/* Usage Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Api color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">API Calls</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {metrics.total_api_calls.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total this period
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(metrics.total_api_calls / 10000 * 100, 100)} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Storage color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Storage</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {metrics.total_storage_gb.toFixed(1)} GB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data stored
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(metrics.total_storage_gb / 100 * 100, 100)} 
                color="secondary"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <People color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Users</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {metrics.total_users}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered users
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(metrics.total_users / 1000 * 100, 100)} 
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Cost</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                ${metrics.billing_amount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This billing period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Bar data={usageChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Pie data={costChartData} options={pieOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Breakdown */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Breakdown
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  API Usage
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Calls: {metrics.total_api_calls.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cost: ${metrics.breakdown.api_calls.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Storage Usage
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Storage: {metrics.total_storage_gb.toFixed(2)} GB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cost: ${metrics.breakdown.storage.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  User Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Users: {metrics.total_users}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cost: ${metrics.breakdown.users.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Total Billing Amount:
            </Typography>
            <Typography variant="h5" color="primary">
              ${metrics.billing_amount.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default UsageMetrics