import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  Assessment,
  Gavel,
  People,
  Map,
  ExpandMore,
  HelpOutline
} from '@mui/icons-material'

interface ComplianceMetric {
  name: string
  value: number
  threshold: number
  status: 'pass' | 'warning' | 'fail'
  description: string
  weight: number
}

interface VRACompliance {
  minority_representation: number
  effectiveness_test: number
  compactness_requirement: number
  equal_population: number
  status: 'compliant' | 'warning' | 'non_compliant'
  issues: string[]
  recommendations: string[]
}

interface ComplianceAnalysis {
  overall_score: number
  compactness_score: number
  population_deviation: number
  contiguity_score: number
  vra_compliance: VRACompliance
  metrics: ComplianceMetric[]
  last_updated: string
}

interface District {
  id: string
  name: string
  population: number
  demographics: {
    white: number
    black: number
    hispanic: number
    asian: number
    other: number
  }
  compliance_score: number
  issues: string[]
}

interface ComplianceAnalyzerProps {
  districts: District[]
  onAnalysisUpdate?: (analysis: ComplianceAnalysis) => void
  autoUpdate?: boolean
}

const ComplianceAnalyzer: React.FC<ComplianceAnalyzerProps> = ({
  districts,
  onAnalysisUpdate,
  autoUpdate = true
}) => {
  const [analysis, setAnalysis] = useState<ComplianceAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<ComplianceMetric | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  useEffect(() => {
    if (autoUpdate && districts.length > 0) {
      runAnalysis()
    }
  }, [districts, autoUpdate])

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    try {
      // Calculate compliance metrics
      const totalPopulation = districts.reduce((sum, d) => sum + d.population, 0)
      const avgPopulation = totalPopulation / districts.length
      const maxDeviation = Math.max(...districts.map(d => 
        Math.abs(d.population - avgPopulation) / avgPopulation * 100
      ))

      // VRA Compliance Analysis
      const vraCompliance: VRACompliance = {
        minority_representation: calculateMinorityRepresentation(),
        effectiveness_test: calculateEffectivenessTest(),
        compactness_requirement: calculateCompactness(),
        equal_population: Math.max(0, 100 - maxDeviation),
        status: maxDeviation <= 5 ? 'compliant' : maxDeviation <= 10 ? 'warning' : 'non_compliant',
        issues: getVRAIssues(maxDeviation),
        recommendations: getVRARecommendations(maxDeviation)
      }

      const metrics: ComplianceMetric[] = [
        {
          name: 'Population Equality',
          value: Math.max(0, 100 - maxDeviation),
          threshold: 95,
          status: maxDeviation <= 5 ? 'pass' : maxDeviation <= 10 ? 'warning' : 'fail',
          description: 'Districts must have approximately equal population',
          weight: 30
        },
        {
          name: 'Compactness',
          value: calculateCompactness(),
          threshold: 70,
          status: calculateCompactness() >= 70 ? 'pass' : calculateCompactness() >= 50 ? 'warning' : 'fail',
          description: 'Districts should be reasonably compact and not gerrymandered',
          weight: 25
        },
        {
          name: 'Contiguity',
          value: calculateContiguity(),
          threshold: 100,
          status: calculateContiguity() === 100 ? 'pass' : 'fail',
          description: 'All parts of a district must be connected',
          weight: 20
        },
        {
          name: 'Minority Representation',
          value: calculateMinorityRepresentation(),
          threshold: 60,
          status: calculateMinorityRepresentation() >= 60 ? 'pass' : calculateMinorityRepresentation() >= 40 ? 'warning' : 'fail',
          description: 'Adequate representation for minority communities',
          weight: 15
        },
        {
          name: 'Community Integrity',
          value: calculateCommunityIntegrity(),
          threshold: 75,
          status: calculateCommunityIntegrity() >= 75 ? 'pass' : calculateCommunityIntegrity() >= 50 ? 'warning' : 'fail',
          description: 'Preservation of communities of interest',
          weight: 10
        }
      ]

      const overallScore = metrics.reduce((sum, metric) => 
        sum + (metric.value * metric.weight / 100), 0
      )

      const newAnalysis: ComplianceAnalysis = {
        overall_score: Math.round(overallScore),
        compactness_score: calculateCompactness(),
        population_deviation: maxDeviation,
        contiguity_score: calculateContiguity(),
        vra_compliance: vraCompliance,
        metrics,
        last_updated: new Date().toISOString()
      }

      setAnalysis(newAnalysis)
      onAnalysisUpdate?.(newAnalysis)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper functions for calculations
  const calculateCompactness = (): number => {
    // Simplified compactness calculation
    // In reality, this would use the Polsby-Popper or similar metric
    return Math.round(65 + Math.random() * 25) // Mock calculation
  }

  const calculateContiguity = (): number => {
    // Check if all districts are contiguous
    // Mock implementation - in reality would check actual geometry
    return 100
  }

  const calculateMinorityRepresentation = (): number => {
    if (districts.length === 0) return 0
    
    const minorityMajorityDistricts = districts.filter(district => {
      const minorityPopulation = 
        district.demographics.black + 
        district.demographics.hispanic + 
        district.demographics.asian
      return minorityPopulation > 50
    })

    return Math.round((minorityMajorityDistricts.length / districts.length) * 100)
  }

  const calculateEffectivenessTest = (): number => {
    // VRA Section 2 effectiveness test
    return Math.round(70 + Math.random() * 20) // Mock calculation
  }

  const calculateCommunityIntegrity = (): number => {
    // Mock calculation for community of interest preservation
    return Math.round(60 + Math.random() * 30)
  }

  const getVRAIssues = (deviation: number): string[] => {
    const issues: string[] = []
    
    if (deviation > 10) {
      issues.push('Population deviation exceeds acceptable limits')
    }
    
    if (calculateMinorityRepresentation() < 40) {
      issues.push('Insufficient minority representation')
    }
    
    if (calculateCompactness() < 50) {
      issues.push('Districts lack adequate compactness')
    }
    
    return issues
  }

  const getVRARecommendations = (deviation: number): string[] => {
    const recommendations: string[] = []
    
    if (deviation > 5) {
      recommendations.push('Adjust district boundaries to equalize population')
    }
    
    recommendations.push('Review minority community boundaries')
    recommendations.push('Consider community of interest feedback')
    
    return recommendations
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
      case 'compliant':
        return <CheckCircle color="success" />
      case 'warning':
        return <Warning color="warning" />
      case 'fail':
      case 'non_compliant':
        return <ErrorIcon color="error" />
      default:
        return <Info color="info" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
      case 'compliant':
        return 'success'
      case 'warning':
        return 'warning'
      case 'fail':
      case 'non_compliant':
        return 'error'
      default:
        return 'info'
    }
  }

  const handleMetricClick = (metric: ComplianceMetric) => {
    setSelectedMetric(metric)
    setDetailDialogOpen(true)
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Assessment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing Compliance...
            </Typography>
            <LinearProgress sx={{ width: '100%', mt: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Checking VRA compliance, population equality, and compactness
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <Assessment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Compliance Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Run analysis to check VRA compliance and redistricting requirements
            </Typography>
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={runAnalysis}
              disabled={districts.length === 0}
            >
              Run Analysis
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      {/* Overall Score */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" gutterBottom>
                Compliance Score: {analysis.overall_score}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date(analysis.last_updated).toLocaleString()}
              </Typography>
            </Box>
            
            <Box display="flex" gap={1}>
              <Button
                size="small"
                startIcon={<HelpOutline />}
                onClick={() => setHelpDialogOpen(true)}
              >
                Help
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Assessment />}
                onClick={runAnalysis}
              >
                Re-analyze
              </Button>
            </Box>
          </Box>

          <Box mt={2}>
            <LinearProgress
              variant="determinate"
              value={analysis.overall_score}
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: analysis.overall_score >= 80 ? 'success.main' : 
                                 analysis.overall_score >= 60 ? 'warning.main' : 'error.main'
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Metrics */}
        <Grid xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Metrics
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Weight</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.metrics.map((metric) => (
                      <TableRow key={metric.name}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {metric.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {metric.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {metric.value}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={metric.value}
                              sx={{ 
                                width: 60, 
                                height: 4,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: metric.status === 'pass' ? 'success.main' : 
                                                 metric.status === 'warning' ? 'warning.main' : 'error.main'
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getStatusIcon(metric.status)}
                            label={metric.status.toUpperCase()}
                            color={getStatusColor(metric.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {metric.weight}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleMetricClick(metric)}
                          >
                            <Info />
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

        {/* VRA Compliance */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Gavel sx={{ mr: 1 }} />
                <Typography variant="h6">
                  VRA Compliance
                </Typography>
              </Box>

              <Box mb={3}>
                <Box display="flex" alignItems="center" mb={1}>
                  {getStatusIcon(analysis.vra_compliance.status)}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {analysis.vra_compliance.status.replace('_', ' ').toUpperCase()}
                  </Typography>
                </Box>
              </Box>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">
                    Detailed Metrics
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Minority Representation
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.vra_compliance.minority_representation}
                        sx={{ mt: 0.5 }}
                      />
                      <Typography variant="caption">
                        {analysis.vra_compliance.minority_representation}%
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Effectiveness Test
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.vra_compliance.effectiveness_test}
                        sx={{ mt: 0.5 }}
                      />
                      <Typography variant="caption">
                        {analysis.vra_compliance.effectiveness_test}%
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        Equal Population
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.vra_compliance.equal_population}
                        sx={{ mt: 0.5 }}
                      />
                      <Typography variant="caption">
                        {analysis.vra_compliance.equal_population}%
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Issues */}
              {analysis.vra_compliance.issues.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Issues
                  </Typography>
                  <List dense>
                    {analysis.vra_compliance.issues.map((issue, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={issue}
                          primaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Recommendations */}
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <List dense>
                  {analysis.vra_compliance.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Info color="info" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={rec}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Metric Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedMetric?.name} Details
        </DialogTitle>
        <DialogContent>
          {selectedMetric && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedMetric.description}
              </Typography>
              
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Score: {selectedMetric.value}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={selectedMetric.value}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Threshold: {selectedMetric.threshold}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Weight in overall score: {selectedMetric.weight}%
                </Typography>
              </Box>

              <Box mt={2}>
                <Alert severity={selectedMetric.status === 'pass' ? 'success' : selectedMetric.status === 'warning' ? 'warning' : 'error'}>
                  Status: {selectedMetric.status.toUpperCase()}
                </Alert>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Compliance Analysis Help
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Understanding Compliance Metrics
          </Typography>
          
          <Typography variant="body2" paragraph>
            The compliance analyzer evaluates your redistricting plan against legal requirements
            and best practices, including the Voting Rights Act (VRA) and constitutional principles.
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            Key Metrics:
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Population Equality"
                secondary="Districts must have approximately equal population (within 5-10% deviation)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Compactness"
                secondary="Districts should be reasonably compact and not oddly shaped"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Contiguity"
                secondary="All parts of a district must be physically connected"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Minority Representation"
                secondary="Adequate representation for protected minority groups under VRA"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ComplianceAnalyzer