import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material'
import {
  TrendingUp,
  Campaign,
  People,
  LocationOn,
  HowToVote,
  Analytics,
  AccountBalance,
  Refresh,
  MoreVert,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const stats = [
    {
      title: 'Active Campaigns',
      value: '8',
      change: '+12%',
      changeType: 'positive' as const,
      icon: <Campaign />,
      color: '#0070f3',
    },
    {
      title: 'Total Voters',
      value: '45,238',
      change: '+3.2%',
      changeType: 'positive' as const,
      icon: <People />,
      color: '#7c3aed',
    },
    {
      title: 'Territories',
      value: '23',
      change: '+2',
      changeType: 'positive' as const,
      icon: <LocationOn />,
      color: '#059669',
    },
    {
      title: 'Canvass Sessions',
      value: '156',
      change: '+18%',
      changeType: 'positive' as const,
      icon: <HowToVote />,
      color: '#dc2626',
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'campaign',
      title: 'New campaign "City Council 2024" created',
      time: '2 hours ago',
      user: 'Sarah Johnson',
    },
    {
      id: 2,
      type: 'voter',
      title: 'Voter database updated with 1,200 new records',
      time: '4 hours ago',
      user: 'Mike Chen',
    },
    {
      id: 3,
      type: 'canvass',
      title: 'Canvass session completed in District 5',
      time: '6 hours ago',
      user: 'Lisa Rodriguez',
    },
    {
      id: 4,
      type: 'territory',
      title: 'Territory boundaries updated for precinct 12A',
      time: '1 day ago',
      user: 'John Smith',
    },
  ]

  const quickActions = [
    {
      title: 'Create Campaign',
      description: 'Start a new political campaign',
      icon: <Campaign />,
      path: '/campaigns/new',
      color: '#0070f3',
    },
    {
      title: 'Import Voters',
      description: 'Upload voter data files',
      icon: <People />,
      path: '/voter-data/import',
      color: '#7c3aed',
    },
    {
      title: 'Plan Canvass',
      description: 'Schedule canvassing sessions',
      icon: <HowToVote />,
      path: '/canvassing/plan',
      color: '#059669',
    },
    {
      title: 'View Analytics',
      description: 'Campaign performance insights',
      icon: <Analytics />,
      path: '/analytics',
      color: '#dc2626',
    },
  ]

  return (
    <Layout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Campaign Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your campaigns.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: stat.color,
                        width: 48,
                        height: 48,
                        mr: 2,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={stat.change}
                      size="small"
                      color={stat.changeType === 'positive' ? 'success' : 'error'}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      vs last month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Quick Actions
                  </Typography>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>
                <Grid container spacing={2}>
                  {quickActions.map((action, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                            borderColor: action.color,
                          },
                        }}
                        onClick={() => navigate(action.path)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 3 }}>
                          <Avatar
                            sx={{
                              bgcolor: action.color,
                              width: 40,
                              height: 40,
                              mx: 'auto',
                              mb: 2,
                            }}
                          >
                            {action.icon}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {action.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {action.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Activities
                  </Typography>
                  <IconButton size="small">
                    <Refresh />
                  </IconButton>
                </Box>
                <Box>
                  {recentActivities.map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        mb: 3,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: 'grey.100',
                          color: 'grey.600',
                          width: 32,
                          height: 32,
                          mr: 2,
                          mt: 0.5,
                        }}
                      >
                        {activity.user.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {activity.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time} • {activity.user}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/activities')}
                >
                  View All Activities
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Campaign Progress */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Active Campaign Progress
                </Typography>
                <Grid container spacing={3}>
                  {[
                    { name: 'City Council 2024', progress: 75, status: 'On Track', voters: '12,450' },
                    { name: 'School Board Initiative', progress: 45, status: 'Behind', voters: '8,230' },
                    { name: 'Mayor Election 2024', progress: 90, status: 'Ahead', voters: '24,558' },
                  ].map((campaign, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Box
                        sx={{
                          p: 3,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          borderRadius: 2,
                          height: '100%',
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {campaign.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {campaign.voters} registered voters
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption">Progress</Typography>
                            <Typography variant="caption">{campaign.progress}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={campaign.progress}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Chip
                          label={campaign.status}
                          size="small"
                          color={
                            campaign.status === 'On Track'
                              ? 'success'
                              : campaign.status === 'Ahead'
                              ? 'primary'
                              : 'warning'
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
}

export default Dashboard