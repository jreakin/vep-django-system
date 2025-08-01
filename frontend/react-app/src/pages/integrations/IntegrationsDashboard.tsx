import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  LinearProgress,
  Divider
} from '@mui/material'
import {
  Add,
  Settings,
  PowerSettingsNew,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Sync,
  Edit,
  Delete,
  Refresh,
  Api,
  Cloud,
  Email,
  Phone,
  Message,
  Payment,
  Analytics,
  ExpandMore,
  Launch,
  Key,
  Shield,
  History,
  TrendingUp,
  Speed
} from '@mui/icons-material'

interface Integration {
  id: string
  name: string
  provider: string
  type: 'api' | 'webhook' | 'oauth' | 'database'
  status: 'active' | 'inactive' | 'error' | 'pending'
  description: string
  endpoint_url: string
  api_key_set: boolean
  last_sync: string
  sync_frequency: string
  total_requests: number
  success_rate: number
  error_count: number
  rate_limit: number
  rate_limit_remaining: number
  config: any
}

interface IntegrationLog {
  id: string
  integration_id: string
  timestamp: string
  action: string
  status: 'success' | 'error' | 'warning'
  message: string
  response_time: number
  data_size: number
}

interface IntegrationStats {
  total_integrations: number
  active_integrations: number
  total_requests_today: number
  average_response_time: number
  success_rate: number
  error_rate: number
}

const IntegrationsDashboard: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [stats, setStats] = useState<IntegrationStats | null>(null)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [configDialog, setConfigDialog] = useState(false)
  const [addIntegrationDialog, setAddIntegrationDialog] = useState(false)
  const [newIntegrationName, setNewIntegrationName] = useState('')
  const [newIntegrationType, setNewIntegrationType] = useState('')
  const [newIntegrationProvider, setNewIntegrationProvider] = useState('')

  // Available integration providers
  const providers = [
    { id: 'stripe', name: 'Stripe', type: 'api', category: 'Payment' },
    { id: 'mailchimp', name: 'Mailchimp', type: 'api', category: 'Email Marketing' },
    { id: 'twilio', name: 'Twilio', type: 'api', category: 'SMS/Voice' },
    { id: 'salesforce', name: 'Salesforce', type: 'oauth', category: 'CRM' },
    { id: 'google_analytics', name: 'Google Analytics', type: 'oauth', category: 'Analytics' },
    { id: 'facebook', name: 'Facebook API', type: 'oauth', category: 'Social Media' },
    { id: 'ngpvan', name: 'NGP VAN', type: 'api', category: 'Political' },
    { id: 'targetsmartapi', name: 'TargetSmart', type: 'api', category: 'Data' },
    { id: 'webhook_generic', name: 'Generic Webhook', type: 'webhook', category: 'Custom' }
  ]

  useEffect(() => {
    loadIntegrations()
    loadLogs()
    loadStats()
  }, [])

  const loadIntegrations = async () => {
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Stripe Payment Processing',
          provider: 'stripe',
          type: 'api',
          status: 'active',
          description: 'Process campaign donations and subscription payments',
          endpoint_url: 'https://api.stripe.com/v1',
          api_key_set: true,
          last_sync: '2024-07-31T10:30:00Z',
          sync_frequency: 'real-time',
          total_requests: 15642,
          success_rate: 99.2,
          error_count: 127,
          rate_limit: 100,
          rate_limit_remaining: 87,
          config: {
            webhook_secret: '***configured***',
            test_mode: false
          }
        },
        {
          id: '2',
          name: 'Mailchimp Email Campaigns',
          provider: 'mailchimp',
          type: 'api',
          status: 'active',
          description: 'Sync voter lists and send email campaigns',
          endpoint_url: 'https://us1.api.mailchimp.com/3.0',
          api_key_set: true,
          last_sync: '2024-07-31T09:15:00Z',
          sync_frequency: 'hourly',
          total_requests: 8934,
          success_rate: 97.8,
          error_count: 196,
          rate_limit: 10000,
          rate_limit_remaining: 8456,
          config: {
            audience_id: 'abc123def456',
            sync_tags: true
          }
        },
        {
          id: '3',
          name: 'Twilio SMS Notifications',
          provider: 'twilio',
          type: 'api',
          status: 'error',
          description: 'Send SMS notifications and updates to volunteers',
          endpoint_url: 'https://api.twilio.com/2010-04-01',
          api_key_set: false,
          last_sync: '2024-07-30T14:22:00Z',
          sync_frequency: 'on-demand',
          total_requests: 2156,
          success_rate: 45.2,
          error_count: 1181,
          rate_limit: 1000,
          rate_limit_remaining: 0,
          config: {
            phone_number: '+1234567890',
            webhook_url: ''
          }
        }
      ]
      
      setIntegrations(mockIntegrations)
    } catch (err) {
      setError('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    // Mock API call
    const mockLogs: IntegrationLog[] = [
      {
        id: '1',
        integration_id: '1',
        timestamp: '2024-07-31T10:30:00Z',
        action: 'process_payment',
        status: 'success',
        message: 'Payment processed successfully',
        response_time: 245,
        data_size: 1024
      },
      {
        id: '2',
        integration_id: '2',
        timestamp: '2024-07-31T09:15:00Z',
        action: 'sync_audience',
        status: 'success',
        message: 'Synced 1,247 contacts',
        response_time: 3200,
        data_size: 51200
      },
      {
        id: '3',
        integration_id: '3',
        timestamp: '2024-07-30T14:22:00Z',
        action: 'send_sms',
        status: 'error',
        message: 'Authentication failed - invalid API key',
        response_time: 1200,
        data_size: 0
      }
    ]
    setLogs(mockLogs)
  }

  const loadStats = async () => {
    // Mock API call
    const mockStats: IntegrationStats = {
      total_integrations: 3,
      active_integrations: 2,
      total_requests_today: 342,
      average_response_time: 1562,
      success_rate: 94.8,
      error_rate: 5.2
    }
    setStats(mockStats)
  }

  const handleToggleIntegration = async (integration: Integration) => {
    setLoading(true)
    try {
      const newStatus = integration.status === 'active' ? 'inactive' : 'active'
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? { ...i, status: newStatus } : i
      ))
      
      setSuccess(`Integration ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
    } catch (err) {
      setError('Failed to toggle integration')
    } finally {
      setLoading(false)
    }
  }

  const handleTestIntegration = async (integration: Integration) => {
    setLoading(true)
    try {
      // Simulate API test call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate random success/failure
      const success = Math.random() > 0.3
      
      if (success) {
        setSuccess(`Integration test successful for ${integration.name}`)
      } else {
        setError(`Integration test failed for ${integration.name} - Check configuration`)
      }
    } catch (err) {
      setError('Test failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAddIntegration = async () => {
    if (!newIntegrationName || !newIntegrationType || !newIntegrationProvider) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const provider = providers.find(p => p.id === newIntegrationProvider)
      const newIntegration: Integration = {
        id: Date.now().toString(),
        name: newIntegrationName,
        provider: newIntegrationProvider,
        type: newIntegrationType as any,
        status: 'pending',
        description: `${provider?.category} integration`,
        endpoint_url: '',
        api_key_set: false,
        last_sync: '',
        sync_frequency: 'manual',
        total_requests: 0,
        success_rate: 0,
        error_count: 0,
        rate_limit: 0,
        rate_limit_remaining: 0,
        config: {}
      }
      
      setIntegrations(prev => [...prev, newIntegration])
      setSuccess('Integration added successfully')
      setAddIntegrationDialog(false)
      setNewIntegrationName('')
      setNewIntegrationType('')
      setNewIntegrationProvider('')
    } catch (err) {
      setError('Failed to add integration')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'error': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle color="success" />
      case 'inactive': return <PowerSettingsNew color="disabled" />
      case 'error': return <ErrorIcon color="error" />
      case 'pending': return <Warning color="warning" />
      default: return <PowerSettingsNew />
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'stripe': return <Payment />
      case 'mailchimp': return <Email />
      case 'twilio': return <Phone />
      case 'salesforce': return <Cloud />
      case 'google_analytics': return <Analytics />
      case 'facebook': return <Message />
      default: return <Api />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Integrations Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAddIntegrationDialog(true)}
        >
          Add Integration
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Api color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{stats.total_integrations}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Integrations
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{stats.active_integrations}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{stats.total_requests_today}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requests Today
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Speed color="secondary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{stats.success_rate.toFixed(1)}%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Integrations List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Active Integrations</Typography>
                <IconButton onClick={loadIntegrations} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Integration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Success Rate</TableCell>
                      <TableCell>Last Sync</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {integrations.map((integration) => (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getProviderIcon(integration.provider)}
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {integration.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {integration.provider} • {integration.type}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(integration.status)}
                            <Chip
                              label={integration.status}
                              color={getStatusColor(integration.status) as any}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {integration.success_rate.toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={integration.success_rate}
                              sx={{ mt: 0.5, height: 4 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {integration.last_sync 
                              ? new Date(integration.last_sync).toLocaleString()
                              : 'Never'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedIntegration(integration)
                              setConfigDialog(true)
                            }}
                          >
                            <Settings />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleTestIntegration(integration)}
                            disabled={loading}
                          >
                            <Sync />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleIntegration(integration)}
                            disabled={loading}
                            color={integration.status === 'active' ? 'error' : 'success'}
                          >
                            <PowerSettingsNew />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List dense>
                {logs.slice(0, 10).map((log) => (
                  <ListItem key={log.id}>
                    <ListItemIcon>
                      {log.status === 'success' ? (
                        <CheckCircle color="success" fontSize="small" />
                      ) : log.status === 'error' ? (
                        <ErrorIcon color="error" fontSize="small" />
                      ) : (
                        <Warning color="warning" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={log.message}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {integrations.find(i => i.id === log.integration_id)?.name}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Integration Dialog */}
      <Dialog open={addIntegrationDialog} onClose={() => setAddIntegrationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Integration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Integration Name"
            fullWidth
            variant="outlined"
            value={newIntegrationName}
            onChange={(e) => setNewIntegrationName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Provider</InputLabel>
            <Select
              value={newIntegrationProvider}
              onChange={(e) => setNewIntegrationProvider(e.target.value)}
              label="Provider"
            >
              {providers.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getProviderIcon(provider.id)}
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2">{provider.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {provider.category}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={newIntegrationType}
              onChange={(e) => setNewIntegrationType(e.target.value)}
              label="Type"
            >
              <MenuItem value="api">API Integration</MenuItem>
              <MenuItem value="webhook">Webhook</MenuItem>
              <MenuItem value="oauth">OAuth</MenuItem>
              <MenuItem value="database">Database</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddIntegrationDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddIntegration} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Add />}
          >
            Add Integration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Configure {selectedIntegration?.name}
        </DialogTitle>
        <DialogContent>
          {selectedIntegration && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Provider: {selectedIntegration.provider}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedIntegration.description}
              </Typography>
              
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Connection Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    label="Endpoint URL"
                    value={selectedIntegration.endpoint_url}
                    margin="normal"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedIntegration.api_key_set}
                        disabled
                      />
                    }
                    label="API Key Configured"
                  />
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Rate Limits</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" gutterBottom>
                    Rate Limit: {selectedIntegration.rate_limit} requests/hour
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Remaining: {selectedIntegration.rate_limit_remaining}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(selectedIntegration.rate_limit_remaining / selectedIntegration.rate_limit) * 100}
                    sx={{ mt: 1 }}
                  />
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Statistics</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Total Requests:</Typography>
                      <Typography variant="h6">{selectedIntegration.total_requests.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Error Count:</Typography>
                      <Typography variant="h6" color="error.main">{selectedIntegration.error_count}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Settings />}>
            Update Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default IntegrationsDashboard