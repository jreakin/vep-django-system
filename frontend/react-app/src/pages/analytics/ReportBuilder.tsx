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
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Divider,
  Tooltip,
  Badge
} from '@mui/material'
import {
  Add,
  PlayArrow,
  Download,
  Edit,
  Delete,
  Visibility,
  Schedule,
  Assessment,
  BarChart,
  PieChart,
  Timeline,
  TableChart,
  Filter,
  DateRange,
  ExpandMore,
  Save,
  Share,
  Refresh,
  Settings,
  FileCopy,
  InsertChart
} from '@mui/icons-material'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, ChartTooltip, Legend)

interface Report {
  id: string
  name: string
  description: string
  type: 'dashboard' | 'chart' | 'table' | 'export'
  status: 'draft' | 'published' | 'scheduled'
  data_sources: string[]
  filters: ReportFilter[]
  visualizations: Visualization[]
  created_by: string
  created_date: string
  last_modified: string
  scheduled_frequency?: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  export_formats: string[]
}

interface ReportFilter {
  field: string
  operator: string
  value: any
  display_name: string
}

interface Visualization {
  id: string
  type: 'bar' | 'line' | 'pie' | 'table' | 'metric'
  title: string
  data_query: string
  config: any
}

interface DataSource {
  id: string
  name: string
  type: 'database' | 'api' | 'file'
  connection_status: 'connected' | 'error' | 'testing'
  tables: string[]
  last_sync: string
}

const ReportBuilder: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createReportDialog, setCreateReportDialog] = useState(false)
  const [filterDialog, setFilterDialog] = useState(false)
  const [newReportName, setNewReportName] = useState('')
  const [newReportType, setNewReportType] = useState('')
  const [newReportDescription, setNewReportDescription] = useState('')
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([])

  // Available data sources and tables
  const availableDataSources = [
    'voter_data',
    'campaigns',
    'canvassing_sessions',
    'territories',
    'billing_data',
    'user_activity'
  ]

  const availableFields = {
    voter_data: ['age', 'registration_date', 'voting_history', 'state', 'party_affiliation'],
    campaigns: ['campaign_name', 'start_date', 'budget', 'status', 'manager'],
    canvassing_sessions: ['session_date', 'volunteer_count', 'contacts_made', 'territory'],
    territories: ['territory_name', 'voter_count', 'area_size', 'coverage_percent'],
    billing_data: ['invoice_date', 'amount', 'payment_status', 'client_type'],
    user_activity: ['login_date', 'action_type', 'user_role', 'session_duration']
  }

  useEffect(() => {
    loadReports()
    loadDataSources()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Monthly Voter Registration Report',
          description: 'Track new voter registrations by month and demographics',
          type: 'dashboard',
          status: 'published',
          data_sources: ['voter_data'],
          filters: [
            {
              field: 'registration_date',
              operator: 'last_30_days',
              value: null,
              display_name: 'Last 30 Days'
            }
          ],
          visualizations: [
            {
              id: '1',
              type: 'bar',
              title: 'Registrations by State',
              data_query: 'SELECT state, COUNT(*) FROM voter_data WHERE registration_date >= ?',
              config: { x_axis: 'state', y_axis: 'count' }
            }
          ],
          created_by: 'admin',
          created_date: '2024-06-15',
          last_modified: '2024-07-20',
          scheduled_frequency: 'monthly',
          recipients: ['manager@example.com', 'analyst@example.com'],
          export_formats: ['pdf', 'excel']
        },
        {
          id: '2',
          name: 'Campaign Performance Dashboard',
          description: 'Real-time campaign metrics and KPIs',
          type: 'dashboard',
          status: 'published',
          data_sources: ['campaigns', 'canvassing_sessions'],
          filters: [],
          visualizations: [
            {
              id: '2',
              type: 'line',
              title: 'Campaign Progress Over Time',
              data_query: 'SELECT date, progress FROM campaigns',
              config: { x_axis: 'date', y_axis: 'progress' }
            }
          ],
          created_by: 'campaign_manager',
          created_date: '2024-07-01',
          last_modified: '2024-07-25',
          recipients: [],
          export_formats: ['pdf']
        },
        {
          id: '3',
          name: 'Territory Coverage Analysis',
          description: 'Analyze voter coverage across territories',
          type: 'chart',
          status: 'draft',
          data_sources: ['territories', 'voter_data'],
          filters: [],
          visualizations: [
            {
              id: '3',
              type: 'pie',
              title: 'Coverage Distribution',
              data_query: 'SELECT territory, coverage_percent FROM territories',
              config: { label_field: 'territory', value_field: 'coverage_percent' }
            }
          ],
          created_by: 'analyst',
          created_date: '2024-07-25',
          last_modified: '2024-07-25',
          recipients: [],
          export_formats: []
        }
      ]
      
      setReports(mockReports)
    } catch (err) {
      setError('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const loadDataSources = async () => {
    // Mock API call
    const mockDataSources: DataSource[] = [
      {
        id: '1',
        name: 'Voter Database',
        type: 'database',
        connection_status: 'connected',
        tables: ['voter_data', 'registrations', 'voting_history'],
        last_sync: '2024-07-31T10:30:00Z'
      },
      {
        id: '2',
        name: 'Campaign Management',
        type: 'database',
        connection_status: 'connected',
        tables: ['campaigns', 'canvassing_sessions', 'territories'],
        last_sync: '2024-07-31T09:15:00Z'
      },
      {
        id: '3',
        name: 'Billing System',
        type: 'api',
        connection_status: 'connected',
        tables: ['invoices', 'payments', 'subscriptions'],
        last_sync: '2024-07-31T08:45:00Z'
      }
    ]
    setDataSources(mockDataSources)
  }

  const handleCreateReport = async () => {
    if (!newReportName || !newReportType) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newReport: Report = {
        id: Date.now().toString(),
        name: newReportName,
        description: newReportDescription,
        type: newReportType as any,
        status: 'draft',
        data_sources: selectedDataSources,
        filters: [],
        visualizations: [],
        created_by: 'current_user',
        created_date: new Date().toISOString().split('T')[0],
        last_modified: new Date().toISOString().split('T')[0],
        recipients: [],
        export_formats: []
      }
      
      setReports(prev => [...prev, newReport])
      setSuccess('Report created successfully')
      setCreateReportDialog(false)
      setNewReportName('')
      setNewReportType('')
      setNewReportDescription('')
      setSelectedDataSources([])
    } catch (err) {
      setError('Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  const handleRunReport = async (reportId: string) => {
    setLoading(true)
    try {
      // Simulate report execution
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setSuccess('Report executed successfully')
    } catch (err) {
      setError('Failed to run report')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleReport = async (reportId: string, frequency: string) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, scheduled_frequency: frequency as any, status: 'scheduled' as any }
          : r
      ))
      
      setSuccess(`Report scheduled to run ${frequency}`)
    } catch (err) {
      setError('Failed to schedule report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (reportId: string, format: string) => {
    setLoading(true)
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a mock download
      const blob = new Blob(['Mock report data'], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${reportId}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setSuccess(`Report exported as ${format}`)
    } catch (err) {
      setError('Failed to export report')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'draft': return 'warning'
      case 'scheduled': return 'info'
      default: return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dashboard': return <Assessment />
      case 'chart': return <BarChart />
      case 'table': return <TableChart />
      case 'export': return <Download />
      default: return <InsertChart />
    }
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success'
      case 'error': return 'error'
      case 'testing': return 'warning'
      default: return 'default'
    }
  }

  // Mock chart data for preview
  const getMockChartData = (visualization: Visualization) => {
    switch (visualization.type) {
      case 'bar':
        return {
          labels: ['CA', 'TX', 'FL', 'NY', 'PA'],
          datasets: [{
            label: 'Registrations',
            data: [1200, 980, 850, 760, 680],
            backgroundColor: 'rgba(25, 118, 210, 0.8)'
          }]
        }
      case 'line':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Progress',
            data: [65, 72, 78, 81, 85, 88],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        }
      case 'pie':
        return {
          labels: ['High Coverage', 'Medium Coverage', 'Low Coverage'],
          datasets: [{
            data: [45, 35, 20],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(255, 99, 132, 0.8)'
            ]
          }]
        }
      default:
        return null
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Report Builder
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateReportDialog(true)}
          >
            Create Report
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

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Reports" icon={<Assessment />} />
          <Tab label="Data Sources" icon={<TableChart />} />
          <Tab label="Scheduled" icon={<Schedule />} />
        </Tabs>

        {/* Reports Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Reports</Typography>
                    <IconButton onClick={loadReports} disabled={loading}>
                      <Refresh />
                    </IconButton>
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Report</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Last Modified</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getTypeIcon(report.type)}
                                <Box sx={{ ml: 2 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {report.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {report.description}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={report.type}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={report.status}
                                color={getStatusColor(report.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(report.last_modified).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleRunReport(report.id)}
                                disabled={loading}
                                color="primary"
                              >
                                <PlayArrow />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleExportReport(report.id, 'pdf')}
                                disabled={loading}
                              >
                                <Download />
                              </IconButton>
                              <IconButton size="small">
                                <Edit />
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

            {/* Report Preview */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  {selectedReport ? (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {selectedReport.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedReport.description}
                      </Typography>
                      
                      <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle1">Report Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" gutterBottom>
                            <strong>Type:</strong> {selectedReport.type}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Created by:</strong> {selectedReport.created_by}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Data Sources:</strong> {selectedReport.data_sources.join(', ')}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Visualizations:</strong> {selectedReport.visualizations.length}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                      
                      {selectedReport.visualizations.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle1">Chart Preview</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {selectedReport.visualizations.map((viz) => {
                              const chartData = getMockChartData(viz)
                              if (!chartData) return null
                              
                              return (
                                <Box key={viz.id} sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    {viz.title}
                                  </Typography>
                                  {viz.type === 'bar' && (
                                    <Bar
                                      data={chartData}
                                      options={{
                                        responsive: true,
                                        plugins: { legend: { display: false } },
                                        scales: { y: { beginAtZero: true } }
                                      }}
                                      height={200}
                                    />
                                  )}
                                  {viz.type === 'line' && (
                                    <Line
                                      data={chartData}
                                      options={{
                                        responsive: true,
                                        plugins: { legend: { display: false } }
                                      }}
                                      height={200}
                                    />
                                  )}
                                  {viz.type === 'pie' && (
                                    <Pie
                                      data={chartData}
                                      options={{
                                        responsive: true,
                                        plugins: { legend: { position: 'bottom' } }
                                      }}
                                      height={200}
                                    />
                                  )}
                                </Box>
                              )
                            })}
                          </AccordionDetails>
                        </Accordion>
                      )}
                      
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle1">Actions</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              startIcon={<PlayArrow />}
                              onClick={() => handleRunReport(selectedReport.id)}
                              disabled={loading}
                            >
                              Run
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Schedule />}
                              onClick={() => handleScheduleReport(selectedReport.id, 'weekly')}
                              disabled={loading}
                            >
                              Schedule
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Download />}
                              onClick={() => handleExportReport(selectedReport.id, 'excel')}
                              disabled={loading}
                            >
                              Export
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Share />}
                            >
                              Share
                            </Button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Select a report to view details and preview
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Data Sources Tab */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Connected Data Sources
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data Source</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tables</TableCell>
                      <TableCell>Last Sync</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dataSources.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {source.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={source.type}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={source.connection_status}
                            color={getConnectionStatusColor(source.connection_status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {source.tables.length} tables
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(source.last_sync).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <Refresh />
                          </IconButton>
                          <IconButton size="small">
                            <Settings />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scheduled Reports
              </Typography>
              
              <List>
                {reports.filter(r => r.scheduled_frequency).map((report) => (
                  <ListItem key={report.id} divider>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary={report.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Frequency: {report.scheduled_frequency}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Recipients: {report.recipients.length || 'None'}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<PlayArrow />}>
                        Run Now
                      </Button>
                      <Button size="small" startIcon={<Edit />}>
                        Edit
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Create Report Dialog */}
        <Dialog open={createReportDialog} onClose={() => setCreateReportDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Report Name"
              fullWidth
              variant="outlined"
              value={newReportName}
              onChange={(e) => setNewReportName(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newReportDescription}
              onChange={(e) => setNewReportDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={newReportType}
                onChange={(e) => setNewReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="dashboard">Dashboard</MenuItem>
                <MenuItem value="chart">Chart</MenuItem>
                <MenuItem value="table">Table</MenuItem>
                <MenuItem value="export">Export</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="subtitle2" gutterBottom>
              Select Data Sources
            </Typography>
            <Box sx={{ mb: 2 }}>
              {availableDataSources.map((source) => (
                <FormControlLabel
                  key={source}
                  control={
                    <Checkbox
                      checked={selectedDataSources.includes(source)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDataSources(prev => [...prev, source])
                        } else {
                          setSelectedDataSources(prev => prev.filter(s => s !== source))
                        }
                      }}
                    />
                  }
                  label={source.replace('_', ' ')}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateReportDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateReport} 
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Add />}
            >
              Create Report
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default ReportBuilder