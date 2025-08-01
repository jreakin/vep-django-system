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
  FormControlLabel,
  Switch
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Map,
  People,
  LocationOn,
  Visibility,
  Assignment,
  Analytics,
  Route
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  getTerritories,
  createTerritory,
  updateTerritory,
  deleteTerritory,
  assignVotersToTerritory,
  getTerritoryAnalytics,
  type Territory
} from '../../services/territories'

interface TerritoryFormData {
  name: string
  description: string
  state: string
  territory_type: 'precinct' | 'district' | 'county' | 'custom'
  is_active: boolean
}

const TerritoryManager: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { control, handleSubmit, reset, setValue } = useForm<TerritoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      state: '',
      territory_type: 'custom',
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

  // Fetch territories
  const { data: territories = [], isLoading, error } = useQuery({
    queryKey: ['territories'],
    queryFn: getTerritories,
  })

  // Fetch analytics summary
  const { data: analytics = [] } = useQuery({
    queryKey: ['territory-analytics'],
    queryFn: () => getTerritoryAnalytics(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTerritory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] })
      setCreateDialogOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Territory> }) => 
      updateTerritory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] })
      setEditDialogOpen(false)
      setEditingTerritory(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTerritory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] })
    },
  })

  const getTerritoryTypeIcon = (type: string) => {
    switch (type) {
      case 'precinct':
        return <LocationOn color="primary" />
      case 'district':
        return <Map color="secondary" />
      case 'county':
        return <Assignment color="info" />
      default:
        return <LocationOn color="action" />
    }
  }

  const getTerritoryTypeColor = (type: string): "primary" | "secondary" | "info" | "default" => {
    switch (type) {
      case 'precinct':
        return 'primary'
      case 'district':
        return 'secondary'
      case 'county':
        return 'info'
      default:
        return 'default'
    }
  }

  const handleCreate = (data: TerritoryFormData) => {
    let geometry: GeoJSON.Polygon | null = null;

    if (process.env.REACT_APP_USE_MOCK_GEOMETRY === 'true') {
      // Use mock geometry if enabled via environment variable
      geometry = {
        type: 'Polygon',
        coordinates: [[
          [-74.006, 40.7128],
          [-74.005, 40.7128],
          [-74.005, 40.7138],
          [-74.006, 40.7138],
          [-74.006, 40.7128]
        ]]
      };
    } else {
      // TODO: Integrate with a boundary-drawing tool or accept user input
      console.error('Boundary drawing functionality is not implemented.');
      return;
    }

    createMutation.mutate({
      ...data,
      geometry: geometry,
      population: Math.floor(Math.random() * 10000) + 1000,
      voter_count: Math.floor(Math.random() * 5000) + 500
    });
  }

  const handleEdit = (territory: Territory) => {
    setEditingTerritory(territory)
    setValue('name', territory.name)
    setValue('description', territory.description)
    setValue('state', territory.state)
    setValue('territory_type', territory.territory_type)
    setValue('is_active', territory.is_active)
    setEditDialogOpen(true)
  }

  const handleUpdate = (data: TerritoryFormData) => {
    if (!editingTerritory) return
    updateMutation.mutate({
      id: editingTerritory.id,
      data
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this territory? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const handleDrawTerritory = (territory: Territory) => {
    navigate(`/territories/draw/${territory.id}`)
  }

  const handleViewAnalytics = (territory: Territory) => {
    navigate(`/territories/analytics/${territory.id}`)
  }

  const TerritoryForm = ({ onSubmit, title }: { onSubmit: (data: TerritoryFormData) => void; title: string }) => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Territory Name"
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

          <Grid xs={12} sm={6}>
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

          <Grid xs={12} sm={6}>
            <Controller
              name="territory_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Territory Type</InputLabel>
                  <Select {...field} label="Territory Type">
                    <MenuItem value="precinct">Precinct</MenuItem>
                    <MenuItem value="district">District</MenuItem>
                    <MenuItem value="county">County</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid xs={12}>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Active Territory"
                />
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
          Failed to load territories. Please try again later.
        </Alert>
      </Container>
    )
  }

  const totalVoters = territories.reduce((sum, t) => sum + t.voter_count, 0)
  const activeTerritories = territories.filter(t => t.is_active).length

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Territory Manager
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Map />}
            onClick={() => navigate('/territories/interactive-map')}
          >
            Interactive Map
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Territory
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
                    Total Territories
                  </Typography>
                  <Typography variant="h5">
                    {territories.length}
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
                <LocationOn color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Territories
                  </Typography>
                  <Typography variant="h5">
                    {activeTerritories}
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
                <People color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Voters
                  </Typography>
                  <Typography variant="h5">
                    {totalVoters.toLocaleString()}
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
                <Analytics color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg. Voters per Territory
                  </Typography>
                  <Typography variant="h5">
                    {territories.length > 0 ? Math.round(totalVoters / territories.length) : 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Territories Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Territories
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Territory Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Population</TableCell>
                  <TableCell>Voters</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {territories.map((territory) => (
                  <TableRow key={territory.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getTerritoryTypeIcon(territory.territory_type)}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {territory.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {territory.description || 'No description'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={territory.territory_type.toUpperCase()} 
                        color={getTerritoryTypeColor(territory.territory_type)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{territory.state}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {territory.population.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <People sx={{ mr: 0.5, fontSize: 16 }} />
                        {territory.voter_count.toLocaleString()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={territory.is_active ? 'Active' : 'Inactive'} 
                        color={territory.is_active ? 'success' : 'default'}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(territory.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View on Map">
                          <IconButton
                            size="small"
                            onClick={() => handleDrawTerritory(territory)}
                          >
                            <Map />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="View Analytics">
                          <IconButton
                            size="small"
                            onClick={() => handleViewAnalytics(territory)}
                          >
                            <Analytics />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit Territory">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(territory)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Territory">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(territory.id)}
                          >
                            <Delete />
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

      {/* Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <TerritoryForm onSubmit={handleCreate} title="Create Territory" />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <TerritoryForm onSubmit={handleUpdate} title="Edit Territory" />
      </Dialog>
    </Container>
  )
}

export default TerritoryManager