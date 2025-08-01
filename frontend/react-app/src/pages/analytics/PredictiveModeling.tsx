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
  LinearProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Slider,
  Divider
} from '@mui/material'
import {
  Add,
  PlayArrow,
  Stop,
  Visibility,
  Download,
  TrendingUp,
  Assessment,
  Timeline,
  ModelTraining,
  Psychology,
  ExpandMore,
  Edit,
  Delete,
  Refresh,
  Settings,
  DataUsage,
  BarChart,
  ShowChart,
  ScatterPlot
} from '@mui/icons-material'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js'
import { Line, Bar, Scatter } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface MLModel {
  id: string
  name: string
  type: 'classification' | 'regression' | 'clustering' | 'forecasting'
  algorithm: string
  status: 'training' | 'ready' | 'error' | 'deployed'
  accuracy: number
  training_data_size: number
  features: string[]
  target_variable: string
  created_date: string
  last_trained: string
  prediction_count: number
  performance_metrics: {
    precision: number
    recall: number
    f1_score: number
    mae?: number
    rmse?: number
  }
}

interface Prediction {
  id: string
  model_id: string
  input_data: any
  prediction: any
  confidence: number
  timestamp: string
  actual_outcome?: any
}

interface ModelMetrics {
  total_models: number
  active_models: number
  total_predictions: number
  average_accuracy: number
  models_by_type: { [key: string]: number }
}

const PredictiveModeling: React.FC = () => {
  const [models, setModels] = useState<MLModel[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [createModelDialog, setCreateModelDialog] = useState(false)
  const [predictDialog, setPredictDialog] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [newModelType, setNewModelType] = useState('')
  const [newModelAlgorithm, setNewModelAlgorithm] = useState('')
  const [predictionInput, setPredictionInput] = useState('')

  // Available algorithms by type
  const algorithms = {
    classification: ['Random Forest', 'Logistic Regression', 'SVM', 'Neural Network', 'XGBoost'],
    regression: ['Linear Regression', 'Random Forest', 'Ridge Regression', 'Neural Network', 'XGBoost'],
    clustering: ['K-Means', 'DBSCAN', 'Hierarchical Clustering', 'Gaussian Mixture'],
    forecasting: ['ARIMA', 'LSTM', 'Prophet', 'Exponential Smoothing']
  }

  useEffect(() => {
    loadModels()
    loadPredictions()
    loadMetrics()
  }, [])

  const loadModels = async () => {
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockModels: MLModel[] = [
        {
          id: '1',
          name: 'Voter Turnout Predictor',
          type: 'classification',
          algorithm: 'Random Forest',
          status: 'ready',
          accuracy: 87.3,
          training_data_size: 45000,
          features: ['age', 'income', 'education', 'voting_history', 'registration_date'],
          target_variable: 'will_vote',
          created_date: '2024-06-15',
          last_trained: '2024-07-20',
          prediction_count: 15642,
          performance_metrics: {
            precision: 0.85,
            recall: 0.89,
            f1_score: 0.87
          }
        },
        {
          id: '2',
          name: 'Donation Amount Forecaster',
          type: 'regression',
          algorithm: 'XGBoost',
          status: 'ready',
          accuracy: 72.8,
          training_data_size: 28000,
          features: ['donor_age', 'income_bracket', 'past_donations', 'engagement_score'],
          target_variable: 'donation_amount',
          created_date: '2024-05-20',
          last_trained: '2024-07-18',
          prediction_count: 8934,
          performance_metrics: {
            precision: 0.73,
            recall: 0.71,
            f1_score: 0.72,
            mae: 45.2,
            rmse: 68.7
          }
        },
        {
          id: '3',
          name: 'Voter Segmentation Model',
          type: 'clustering',
          algorithm: 'K-Means',
          status: 'training',
          accuracy: 0,
          training_data_size: 62000,
          features: ['demographics', 'voting_patterns', 'issue_preferences'],
          target_variable: 'voter_segment',
          created_date: '2024-07-25',
          last_trained: '2024-07-25',
          prediction_count: 0,
          performance_metrics: {
            precision: 0,
            recall: 0,
            f1_score: 0
          }
        }
      ]
      
      setModels(mockModels)
    } catch (err) {
      setError('Failed to load models')
    } finally {
      setLoading(false)
    }
  }

  const loadPredictions = async () => {
    // Mock API call
    const mockPredictions: Prediction[] = [
      {
        id: '1',
        model_id: '1',
        input_data: { age: 45, income: 75000, education: 'college', voting_history: 4 },
        prediction: 'will_vote',
        confidence: 0.92,
        timestamp: '2024-07-31T10:30:00Z',
        actual_outcome: 'did_vote'
      },
      {
        id: '2',
        model_id: '2',
        input_data: { donor_age: 52, income_bracket: 'high', past_donations: 3 },
        prediction: 125.50,
        confidence: 0.78,
        timestamp: '2024-07-31T09:15:00Z'
      },
      {
        id: '3',
        model_id: '1',
        input_data: { age: 23, income: 35000, education: 'high_school', voting_history: 1 },
        prediction: 'wont_vote',
        confidence: 0.84,
        timestamp: '2024-07-30T16:45:00Z'
      }
    ]
    setPredictions(mockPredictions)
  }

  const loadMetrics = async () => {
    // Mock metrics calculation
    const mockMetrics: ModelMetrics = {
      total_models: 3,
      active_models: 2,
      total_predictions: 24576,
      average_accuracy: 80.05,
      models_by_type: {
        classification: 1,
        regression: 1,
        clustering: 1,
        forecasting: 0
      }
    }
    setMetrics(mockMetrics)
  }

  const handleCreateModel = async () => {
    if (!newModelName || !newModelType || !newModelAlgorithm) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const newModel: MLModel = {
        id: Date.now().toString(),
        name: newModelName,
        type: newModelType as any,
        algorithm: newModelAlgorithm,
        status: 'training',
        accuracy: 0,
        training_data_size: 0,
        features: [],
        target_variable: '',
        created_date: new Date().toISOString().split('T')[0],
        last_trained: new Date().toISOString().split('T')[0],
        prediction_count: 0,
        performance_metrics: {
          precision: 0,
          recall: 0,
          f1_score: 0
        }
      }
      
      setModels(prev => [...prev, newModel])
      setSuccess('Model created and training started')
      setCreateModelDialog(false)
      setNewModelName('')
      setNewModelType('')
      setNewModelAlgorithm('')
    } catch (err) {
      setError('Failed to create model')
    } finally {
      setLoading(false)
    }
  }

  const handleMakePrediction = async () => {
    if (!selectedModel || !predictionInput) {
      setError('Please select a model and provide input data')
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Validate predictionInput
      let inputData;
      try {
        inputData = JSON.parse(predictionInput);
        if (typeof inputData !== 'object' || Array.isArray(inputData)) {
          throw new Error('Input data must be a valid JSON object');
        }
      } catch (validationError) {
        setError('Invalid input format - please provide a valid JSON object');
        return;
      }
      
      const newPrediction: Prediction = {
        id: Date.now().toString(),
        model_id: selectedModel.id,
        input_data: inputData,
        prediction: selectedModel.type === 'classification' ? 'predicted_class' : Math.random() * 100,
        confidence: 0.75 + Math.random() * 0.2,
        timestamp: new Date().toISOString()
      }
      
      setPredictions(prev => [newPrediction, ...prev])
      setSuccess('Prediction completed successfully')
      setPredictDialog(false)
      setPredictionInput('')
    } catch (err) {
      setError('Failed to make prediction - check input format')
    } finally {
      setLoading(false)
    }
  }

  const handleTrainModel = async (modelId: string) => {
    setLoading(true)
    try {
      // Simulate training
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      setModels(prev => prev.map(m => 
        m.id === modelId 
          ? { 
              ...m, 
              status: 'ready', 
              accuracy: 70 + Math.random() * 25,
              last_trained: new Date().toISOString().split('T')[0]
            }
          : m
      ))
      
      setSuccess('Model training completed')
    } catch (err) {
      setError('Training failed')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success'
      case 'training': return 'warning'
      case 'deployed': return 'primary'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'classification': return <Assessment />
      case 'regression': return <TrendingUp />
      case 'clustering': return <ScatterPlot />
      case 'forecasting': return <Timeline />
      default: return <ModelTraining />
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'success'
    if (accuracy >= 70) return 'warning'
    return 'error'
  }

  const getPerformanceChartData = () => {
    if (!selectedModel) return null
    
    const performanceHistory = Array.from({ length: 10 }, (_, i) => ({
      x: i + 1,
      y: selectedModel.accuracy + (Math.random() - 0.5) * 10
    }))
    
    return {
      datasets: [{
        label: 'Model Accuracy Over Time',
        data: performanceHistory,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true
      }]
    }
  }

  const getPredictionsChartData = () => {
    if (!metrics) return null
    
    return {
      labels: Object.keys(metrics.models_by_type),
      datasets: [{
        label: 'Models by Type',
        data: Object.values(metrics.models_by_type),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ]
      }]
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Predictive Modeling
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateModelDialog(true)}
        >
          Create Model
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

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ModelTraining color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{metrics.total_models}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Models
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PlayArrow color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{metrics.active_models}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Models
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Timeline color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{metrics.total_predictions.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Predictions
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assessment color="secondary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{metrics.average_accuracy.toFixed(1)}%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Accuracy
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Models" icon={<ModelTraining />} />
        <Tab label="Predictions" icon={<Timeline />} />
        <Tab label="Analytics" icon={<BarChart />} />
      </Tabs>

      {/* Models Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Machine Learning Models</Typography>
                  <IconButton onClick={loadModels} disabled={loading}>
                    <Refresh />
                  </IconButton>
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Model</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Accuracy</TableCell>
                        <TableCell>Predictions</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {models.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getTypeIcon(model.type)}
                              <Box sx={{ ml: 2 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {model.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {model.algorithm}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={model.type}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={model.status}
                              color={getStatusColor(model.status) as any}
                              size="small"
                            />
                            {model.status === 'training' && (
                              <LinearProgress sx={{ mt: 1, width: 80 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {model.accuracy.toFixed(1)}%
                              </Typography>
                              {model.accuracy > 0 && (
                                <LinearProgress
                                  variant="determinate"
                                  value={model.accuracy}
                                  color={getAccuracyColor(model.accuracy) as any}
                                  sx={{ mt: 0.5, height: 4 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{model.prediction_count.toLocaleString()}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => setSelectedModel(model)}
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedModel(model)
                                setPredictDialog(true)
                              }}
                              disabled={model.status !== 'ready'}
                            >
                              <Timeline />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleTrainModel(model.id)}
                              disabled={loading || model.status === 'training'}
                              color="primary"
                            >
                              <ModelTraining />
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

          {/* Model Details */}
          <Grid xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                {selectedModel ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {selectedModel.name}
                    </Typography>
                    
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">Model Info</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" gutterBottom>
                          <strong>Algorithm:</strong> {selectedModel.algorithm}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Training Data:</strong> {selectedModel.training_data_size.toLocaleString()} samples
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Features:</strong> {selectedModel.features.length}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Last Trained:</strong> {new Date(selectedModel.last_trained).toLocaleDateString()}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">Performance</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" gutterBottom>
                          <strong>Accuracy:</strong> {selectedModel.accuracy.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Precision:</strong> {selectedModel.performance_metrics.precision.toFixed(3)}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Recall:</strong> {selectedModel.performance_metrics.recall.toFixed(3)}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>F1 Score:</strong> {selectedModel.performance_metrics.f1_score.toFixed(3)}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                    
                    {getPerformanceChartData() && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle1">Performance Trend</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Line
                            data={getPerformanceChartData()!}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: {
                                  display: false
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100
                                }
                              }
                            }}
                          />
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Select a model to view details
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Predictions Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Predictions</Typography>
              <Button
                variant="contained"
                startIcon={<Timeline />}
                onClick={() => setPredictDialog(true)}
                disabled={!selectedModel || selectedModel.status !== 'ready'}
              >
                Make Prediction
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>Input</TableCell>
                    <TableCell>Prediction</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actual</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictions.map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell>
                        {models.find(m => m.id === prediction.model_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" component="pre">
                          {JSON.stringify(prediction.input_data, null, 1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <strong>
                          {typeof prediction.prediction === 'number' 
                            ? prediction.prediction.toFixed(2)
                            : prediction.prediction
                          }
                        </strong>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {(prediction.confidence * 100).toFixed(1)}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={prediction.confidence * 100}
                            sx={{ mt: 0.5, height: 4 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(prediction.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {prediction.actual_outcome ? (
                          <Chip
                            label={prediction.actual_outcome}
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Pending
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Models by Type
                </Typography>
                {getPredictionsChartData() && (
                  <Bar
                    data={getPredictionsChartData()!}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Overview
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <DataUsage />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Training Data"
                      secondary={`${models.reduce((sum, m) => sum + m.training_data_size, 0).toLocaleString()} samples`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment />
                    </ListItemIcon>
                    <ListItemText
                      primary="Best Performing Model"
                      secondary={models.reduce((best, current) => 
                        current.accuracy > best.accuracy ? current : best, models[0]
                      )?.name || 'None'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Timeline />
                    </ListItemIcon>
                    <ListItemText
                      primary="Most Used Model"
                      secondary={models.reduce((most, current) => 
                        current.prediction_count > most.prediction_count ? current : most, models[0]
                      )?.name || 'None'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Create Model Dialog */}
      <Dialog open={createModelDialog} onClose={() => setCreateModelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New ML Model</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Model Name"
            fullWidth
            variant="outlined"
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Model Type</InputLabel>
            <Select
              value={newModelType}
              onChange={(e) => {
                setNewModelType(e.target.value)
                setNewModelAlgorithm('')
              }}
              label="Model Type"
            >
              <MenuItem value="classification">Classification</MenuItem>
              <MenuItem value="regression">Regression</MenuItem>
              <MenuItem value="clustering">Clustering</MenuItem>
              <MenuItem value="forecasting">Forecasting</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel>Algorithm</InputLabel>
            <Select
              value={newModelAlgorithm}
              onChange={(e) => setNewModelAlgorithm(e.target.value)}
              label="Algorithm"
              disabled={!newModelType}
            >
              {newModelType && algorithms[newModelType as keyof typeof algorithms]?.map((algo) => (
                <MenuItem key={algo} value={algo}>
                  {algo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModelDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateModel} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Add />}
          >
            Create & Train
          </Button>
        </DialogActions>
      </Dialog>

      {/* Make Prediction Dialog */}
      <Dialog open={predictDialog} onClose={() => setPredictDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Make Prediction - {selectedModel?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter input data as JSON format matching the model's expected features.
          </Typography>
          
          {selectedModel && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Expected features:</strong> {selectedModel.features.join(', ')}
            </Typography>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Input Data (JSON)"
            value={predictionInput}
            onChange={(e) => setPredictionInput(e.target.value)}
            placeholder='{"age": 35, "income": 50000, "education": "college", "voting_history": 2}'
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPredictDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleMakePrediction} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Timeline />}
          >
            Predict
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PredictiveModeling