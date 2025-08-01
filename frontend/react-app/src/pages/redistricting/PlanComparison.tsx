import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Compare,
  Assessment,
  Map as MapIcon,
  Timeline,
  BarChart,
  PieChart,
  TrendingUp,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  ExpandMore,
  Visibility,
  Download,
  Share,
  Refresh,
  SwapHoriz
} from '@mui/icons-material'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, ChartTooltip, Legend)

interface RedistrictingPlan {
  id: string
  name: string
  created_date: string
  author: string
  status: 'draft' | 'review' | 'approved' | 'rejected'
  total_districts: number
  population_deviation: number
  compactness_score: number
  vra_compliance: number
  efficiency_gap: number
  partisan_symmetry: number
  districts: District[]
}

interface District {
  id: string
  name: string
  population: number
  target_population: number
  deviation_percent: number
  compactness: number
  demographics: {
    white: number
    black: number
    hispanic: number
    asian: number
    other: number
  }
  voting_history: {
    dem_2020: number
    rep_2020: number
    dem_2018: number
    rep_2018: number
  }
  vra_compliant: boolean
}

interface ComparisonMetric {
  name: string
  plan1_value: number
  plan2_value: number
  difference: number
  better: 'plan1' | 'plan2' | 'equal'
  category: 'legal' | 'demographic' | 'political' | 'geographic'
}

const PlanComparison: React.FC = () => {
  const [plans, setPlans] = useState<RedistrictingPlan[]>([])
  const [selectedPlan1, setSelectedPlan1] = useState<string>('')
  const [selectedPlan2, setSelectedPlan2] = useState<string>('')
  const [plan1Data, setPlan1Data] = useState<RedistrictingPlan | null>(null)
  const [plan2Data, setPlan2Data] = useState<RedistrictingPlan | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportDialog, setExportDialog] = useState(false)

  // Mock data
  useEffect(() => {
    const mockPlans: RedistrictingPlan[] = [
      {
        id: '1',
        name: 'Current Districts 2022',
        created_date: '2022-01-15',
        author: 'State Legislature',
        status: 'approved',
        total_districts: 8,
        population_deviation: 2.1,
        compactness_score: 0.68,
        vra_compliance: 87.5,
        efficiency_gap: 0.12,
        partisan_symmetry: 0.82,
        districts: []
      },
      {
        id: '2',
        name: 'Proposed Reform Plan A',
        created_date: '2024-03-20',
        author: 'Reform Commission',
        status: 'review',
        total_districts: 8,
        population_deviation: 1.8,
        compactness_score: 0.74,
        vra_compliance: 92.3,
        efficiency_gap: 0.08,
        partisan_symmetry: 0.89,
        districts: []
      },
      {
        id: '3',
        name: 'Community-Based Plan',
        created_date: '2024-02-10',
        author: 'Citizens Committee',
        status: 'draft',
        total_districts: 8,
        population_deviation: 3.2,
        compactness_score: 0.71,
        vra_compliance: 90.1,
        efficiency_gap: 0.06,
        partisan_symmetry: 0.91,
        districts: []
      }
    ]
    setPlans(mockPlans)
  }, [])

  useEffect(() => {
    if (selectedPlan1 && selectedPlan2) {
      loadComparisonData()
    }
  }, [selectedPlan1, selectedPlan2])

  const loadComparisonData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const plan1 = plans.find(p => p.id === selectedPlan1)
      const plan2 = plans.find(p => p.id === selectedPlan2)
      
      if (!plan1 || !plan2) return
      
      setPlan1Data(plan1)
      setPlan2Data(plan2)
      
      // Calculate comparison metrics
      const metrics: ComparisonMetric[] = [
        {
          name: 'Population Deviation',
          plan1_value: plan1.population_deviation,
          plan2_value: plan2.population_deviation,
          difference: plan2.population_deviation - plan1.population_deviation,
          better: plan1.population_deviation < plan2.population_deviation ? 'plan1' : 'plan2',
          category: 'legal'
        },
        {
          name: 'Compactness Score',
          plan1_value: plan1.compactness_score,
          plan2_value: plan2.compactness_score,
          difference: plan2.compactness_score - plan1.compactness_score,
          better: plan1.compactness_score > plan2.compactness_score ? 'plan1' : 'plan2',
          category: 'geographic'
        },
        {
          name: 'VRA Compliance',
          plan1_value: plan1.vra_compliance,
          plan2_value: plan2.vra_compliance,
          difference: plan2.vra_compliance - plan1.vra_compliance,
          better: plan1.vra_compliance > plan2.vra_compliance ? 'plan1' : 'plan2',
          category: 'legal'
        },
        {
          name: 'Efficiency Gap',
          plan1_value: plan1.efficiency_gap,
          plan2_value: plan2.efficiency_gap,
          difference: plan2.efficiency_gap - plan1.efficiency_gap,
          better: plan1.efficiency_gap < plan2.efficiency_gap ? 'plan1' : 'plan2',
          category: 'political'
        },
        {
          name: 'Partisan Symmetry',
          plan1_value: plan1.partisan_symmetry,
          plan2_value: plan2.partisan_symmetry,
          difference: plan2.partisan_symmetry - plan1.partisan_symmetry,
          better: plan1.partisan_symmetry > plan2.partisan_symmetry ? 'plan1' : 'plan2',
          category: 'political'
        }
      ]
      
      setComparisonMetrics(metrics)
    } catch (err) {
      setError('Failed to load comparison data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'review': return 'warning'
      case 'draft': return 'info'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getMetricColor = (metric: ComparisonMetric, plan: 'plan1' | 'plan2') => {
    if (metric.better === 'equal') return 'default'
    return metric.better === plan ? 'success' : 'error'
  }

  const getComparisonChartData = () => {
    if (!comparisonMetrics.length) return null
    
    return {
      labels: comparisonMetrics.map(m => m.name),
      datasets: [
        {
          label: plan1Data?.name || 'Plan 1',
          data: comparisonMetrics.map(m => m.plan1_value),
          backgroundColor: 'rgba(25, 118, 210, 0.7)',
          borderColor: 'rgba(25, 118, 210, 1)',
          borderWidth: 1
        },
        {
          label: plan2Data?.name || 'Plan 2',
          data: comparisonMetrics.map(m => m.plan2_value),
          backgroundColor: 'rgba(220, 0, 78, 0.7)',
          borderColor: 'rgba(220, 0, 78, 1)',
          borderWidth: 1
        }
      ]
    }
  }

  const handleSwapPlans = () => {
    const temp = selectedPlan1
    setSelectedPlan1(selectedPlan2)
    setSelectedPlan2(temp)
  }

  const handleExportComparison = () => {
    // Simulate export functionality
    const comparisonData = {
      plan1: plan1Data,
      plan2: plan2Data,
      metrics: comparisonMetrics,
      export_date: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(comparisonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan_comparison_${selectedPlan1}_vs_${selectedPlan2}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setExportDialog(false)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Plan Comparison
      </Typography>
      
      {/* Plan Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Select Plan 1</InputLabel>
                <Select
                  value={selectedPlan1}
                  onChange={(e) => setSelectedPlan1(e.target.value)}
                  label="Select Plan 1"
                >
                  {plans.filter(p => p.id !== selectedPlan2).map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      <Box>
                        <Typography variant="body1">{plan.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {plan.author} • {new Date(plan.created_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid xs={12} md={2} sx={{ textAlign: 'center' }}>
              <IconButton
                onClick={handleSwapPlans}
                disabled={!selectedPlan1 || !selectedPlan2}
                size="large"
              >
                <SwapHoriz />
              </IconButton>
            </Grid>
            
            <Grid xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Select Plan 2</InputLabel>
                <Select
                  value={selectedPlan2}
                  onChange={(e) => setSelectedPlan2(e.target.value)}
                  label="Select Plan 2"
                >
                  {plans.filter(p => p.id !== selectedPlan1).map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      <Box>
                        <Typography variant="body1">{plan.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {plan.author} • {new Date(plan.created_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {selectedPlan1 && selectedPlan2 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                startIcon={<Refresh />}
                onClick={loadComparisonData}
                disabled={loading}
              >
                Refresh Comparison
              </Button>
              <Button
                startIcon={<Download />}
                onClick={() => setExportDialog(true)}
                disabled={!comparisonMetrics.length}
              >
                Export Results
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Loading comparison data...
          </Typography>
        </Box>
      )}

      {plan1Data && plan2Data && !loading && (
        <Box>
          {/* Plan Overview */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{plan1Data.name}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={plan1Data.status}
                      color={getStatusColor(plan1Data.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created by {plan1Data.author} on {new Date(plan1Data.created_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    {plan1Data.total_districts} districts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{plan2Data.name}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={plan2Data.status}
                      color={getStatusColor(plan2Data.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created by {plan2Data.author} on {new Date(plan2Data.created_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    {plan2Data.total_districts} districts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Comparison Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Metrics Comparison" icon={<Assessment />} />
              <Tab label="Visual Charts" icon={<BarChart />} />
              <Tab label="Detailed Analysis" icon={<Timeline />} />
            </Tabs>
          </Paper>

          {/* Metrics Comparison Tab */}
          {activeTab === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Metrics Comparison</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="center">{plan1Data.name}</TableCell>
                        <TableCell align="center">{plan2Data.name}</TableCell>
                        <TableCell align="center">Difference</TableCell>
                        <TableCell align="center">Category</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparisonMetrics.map((metric) => (
                        <TableRow key={metric.name}>
                          <TableCell component="th" scope="row">
                            {metric.name}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={metric.plan1_value.toFixed(2)}
                              color={getMetricColor(metric, 'plan1') as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={metric.plan2_value.toFixed(2)}
                              color={getMetricColor(metric, 'plan2') as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color={metric.difference > 0 ? 'success.main' : metric.difference < 0 ? 'error.main' : 'text.primary'}
                            >
                              {metric.difference > 0 ? '+' : ''}{metric.difference.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={metric.category}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Visual Charts Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Metrics Comparison Chart</Typography>
                    {getComparisonChartData() && (
                      <Bar
                        data={getComparisonChartData()!}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            title: {
                              display: true,
                              text: 'Plan Metrics Side-by-Side'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <List dense>
                      {comparisonMetrics.map((metric) => (
                        <ListItem key={metric.name}>
                          <ListItemIcon>
                            {metric.better === 'plan1' ? (
                              <CheckCircle color="success" />
                            ) : metric.better === 'plan2' ? (
                              <ErrorIcon color="error" />
                            ) : (
                              <Info color="info" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={metric.name}
                            secondary={
                              metric.better === 'plan1' 
                                ? `${plan1Data.name} is better`
                                : metric.better === 'plan2'
                                ? `${plan2Data.name} is better`
                                : 'Equal performance'
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Detailed Analysis Tab */}
          {activeTab === 2 && (
            <Box>
              {['legal', 'demographic', 'political', 'geographic'].map((category) => (
                <Accordion key={category} defaultExpanded={category === 'legal'}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {category} Analysis
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {comparisonMetrics.filter(m => m.category === category).map((metric) => (
                        <Grid xs={12} md={6} key={metric.name}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom>
                                {metric.name}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">{plan1Data.name}:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {metric.plan1_value.toFixed(2)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">{plan2Data.name}:</Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {metric.plan2_value.toFixed(2)}
                                </Typography>
                              </Box>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                Difference: {metric.difference > 0 ? '+' : ''}{metric.difference.toFixed(2)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Comparison</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Export the comparison results between "{plan1Data?.name}" and "{plan2Data?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will download a JSON file containing all metrics and analysis data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button onClick={handleExportComparison} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PlanComparison