import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
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
  Tooltip,
  LinearProgress,
  Menu,
  MenuItem as MenuItemComponent
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Compare,
  Download,
  Upload,
  Assessment,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  MoreVert,
  Map
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  getRedistrictingPlans,
  createRedistrictingPlan,
  updateRedistrictingPlan,
  deleteRedistrictingPlan,
  validatePlan,
  calculatePlanMetrics,
  exportPlan,
  uploadShapefile,
  type RedistrictingPlan
} from '../../services/redistricting'

interface PlanFormData {
  name: string
  description: string
  state: string
  is_active: boolean
}

const PlanManager: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<RedistrictingPlan | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<RedistrictingPlan | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { control, handleSubmit, reset, setValue } = useForm<PlanFormData>({
    defaultValues: {
      name: '',
      description: '',
      state: '',
      is_active: true
    }
  })

  // US States for dropdown
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ]

  // Fetch plans
  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ['redistricting-plans'],
    queryFn: getRedistrictingPlans,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createRedistrictingPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redistricting-plans'] })
      setCreateDialogOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RedistrictingPlan> }) => 
      updateRedistrictingPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redistricting-plans'] })
      setEditDialogOpen(false)
      setEditingPlan(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRedistrictingPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redistricting-plans'] })
    },
  })

  const validateMutation = useMutation({
    mutationFn: validatePlan,
    onSuccess: (result, planId) => {
      const message = result.valid 
        ? 'Plan validation passed!' 
        : `Validation failed: ${result.errors.join(', ')}`
      // You could show a toast notification here
      console.log(message)
    },
  })

  const calculateMetricsMutation = useMutation({
    mutationFn: calculatePlanMetrics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redistricting-plans'] })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: uploadShapefile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redistricting-plans'] })
      setUploadDialogOpen(false)
      setUploadFile(null)
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle color="success" />
      case 'in_review':
        return <Assessment color="info" />
      case 'rejected':
        return <ErrorIcon color="error" />
      default:
        return <Edit color="warning" />
    }
  }

  const getStatusColor = (status: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'in_review':
        return 'info'
      case 'rejected':
        return 'error'
      case 'draft':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getComplianceColor = (score: number): "success" | "warning" | "error" => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  const handleCreate = (data: PlanFormData) => {
    createMutation.mutate(data)
  }

  const handleEdit = (plan: RedistrictingPlan) => {
    setEditingPlan(plan)
    setValue('name', plan.name)
    setValue('description', plan.description)
    setValue('state', plan.state)
    setValue('is_active', plan.is_active)
    setEditDialogOpen(true)
  }

  const handleUpdate = (data: PlanFormData) => {
    if (!editingPlan) return
    updateMutation.mutate({
      id: editingPlan.id,
      data
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this redistricting plan? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, plan: RedistrictingPlan) => {
    setMenuAnchor(event.currentTarget)
    setSelectedPlan(plan)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedPlan(null)
  }

  const handleViewPlan = (plan: RedistrictingPlan) => {
    navigate(`/redistricting/plans/${plan.id}`)
    handleMenuClose()
  }

  const handleValidatePlan = (plan: RedistrictingPlan) => {
    validateMutation.mutate(plan.id)
    handleMenuClose()
  }

  const handleCalculateMetrics = (plan: RedistrictingPlan) => {
    calculateMetricsMutation.mutate(plan.id)
    handleMenuClose()
  }

  const handleExport = async (plan: RedistrictingPlan, format: string) => {
    try {
      const exportResult = await exportPlan(plan.id, format)
      // Open download URL
      window.open(exportResult.file_url, '_blank')
    } catch (error) {
      console.error('Export failed:', error)
    }
    handleMenuClose()
  }

  const handleFileUpload = () => {
    if (uploadFile) {
      uploadMutation.mutate(uploadFile)
    }
  }

  const PlanForm = ({ onSubmit, title }: { onSubmit: (data: PlanFormData) => void; title: string }) => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid xs={12}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Plan Name"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid xs={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                />
              )}
            />
          </Grid>

          <Grid xs={12}>
            <Controller
              name="state"
              control={control}
              rules={{ required: 'State is required' }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel>State</InputLabel>
                  <Select {...field} label="State">
                    {states.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          reset()
        }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          {title.includes('Create') ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </form>
  )

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load redistricting plans. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Redistricting Plan Manager
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Import Plan
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create New Plan
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Map color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Plans
                  </Typography>
                  <Typography variant="h5">
                    {plans.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Edit color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Draft Plans
                  </Typography>
                  <Typography variant="h5">
                    {plans.filter(p => p.status === 'draft').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Approved Plans
                  </Typography>
                  <Typography variant="h5">
                    {plans.filter(p => p.status === 'approved').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Under Review
                  </Typography>
                  <Typography variant="h5">
                    {plans.filter(p => p.status === 'in_review').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Plans Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Redistricting Plans
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plan Name</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Districts</TableCell>
                  <TableCell>Compliance Score</TableCell>
                  <TableCell>Population Deviation</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(plan.status)}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {plan.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {plan.created_by.first_name} {plan.created_by.last_name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{plan.state}</TableCell>
                    <TableCell>
                      <Chip 
                        label={plan.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(plan.status)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {plan.districts.length} districts
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption">
                            {plan.compliance_score.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={plan.compliance_score} 
                          color={getComplianceColor(plan.compliance_score)}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2"
                        color={plan.population_deviation <= 10 ? 'success.main' : 'error.main'}
                      >
                        ±{plan.population_deviation.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(plan.updated_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Plan">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/redistricting/plans/${plan.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Plan">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, plan)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => selectedPlan && handleViewPlan(selectedPlan)}>
          <Visibility sx={{ mr: 1 }} /> View Plan
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedPlan && handleValidatePlan(selectedPlan)}>
          <CheckCircle sx={{ mr: 1 }} /> Validate Plan
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedPlan && handleCalculateMetrics(selectedPlan)}>
          <Assessment sx={{ mr: 1 }} /> Calculate Metrics
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedPlan && navigate(`/redistricting/compare?plan=${selectedPlan.id}`)}>
          <Compare sx={{ mr: 1 }} /> Compare Plans
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedPlan && handleExport(selectedPlan, 'shapefile')}>
          <Download sx={{ mr: 1 }} /> Export Shapefile
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedPlan && handleExport(selectedPlan, 'geojson')}>
          <Download sx={{ mr: 1 }} /> Export GeoJSON
        </MenuItemComponent>
        <MenuItemComponent onClick={() => selectedPlan && handleDelete(selectedPlan.id)}>
          <Delete sx={{ mr: 1 }} color="error" /> Delete Plan
        </MenuItemComponent>
      </Menu>

      {/* Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <PlanForm onSubmit={handleCreate} title="Create Redistricting Plan" />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <PlanForm onSubmit={handleUpdate} title="Edit Redistricting Plan" />
      </Dialog>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Redistricting Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload a shapefile (.zip) containing district boundaries
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2 }}
            >
              Choose Shapefile
              <input
                type="file"
                hidden
                accept=".zip"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </Button>
            {uploadFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {uploadFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleFileUpload}
            variant="contained"
            disabled={!uploadFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PlanManager