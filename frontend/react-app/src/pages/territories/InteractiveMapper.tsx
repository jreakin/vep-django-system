import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Toolbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
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
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Slider,
  Badge
} from '@mui/material'
import {
  Map as MapIcon,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  ZoomIn,
  ZoomOut,
  Layers,
  People,
  LocationOn,
  Assignment,
  ExpandMore,
  Visibility,
  VisibilityOff,
  Download,
  Upload,
  Refresh,
  Settings,
  PinDrop,
  Timeline,
  Analytics
} from '@mui/icons-material'
import { MapContainer, TileLayer, FeatureGroup, Marker, Popup, useMap } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import L from 'leaflet'

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Territory {
  id: string
  name: string
  description: string
  geometry: any
  area_sqkm: number
  assigned_voters: number
  total_voters: number
  coverage_percent: number
  created_date: string
  last_modified: string
  color: string
  active: boolean
}

interface Voter {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  territory_id?: string
  registration_status: 'registered' | 'pending' | 'inactive'
  voting_history: number
}

interface TerritoryStats {
  total_territories: number
  active_territories: number
  total_assigned_voters: number
  total_unassigned_voters: number
  average_coverage: number
}

const InteractiveMapper: React.FC = () => {
  const [territories, setTerritories] = useState<Territory[]>([])
  const [voters, setVoters] = useState<Voter[]>([])
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null)
  const [editMode, setEditMode] = useState<'view' | 'create' | 'edit'>('view')
  const [showVoters, setShowVoters] = useState(true)
  const [showTerritoryLabels, setShowTerritoryLabels] = useState(true)
  const [voterFilter, setVoterFilter] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newTerritoryDialog, setNewTerritoryDialog] = useState(false)
  const [assignVotersDialog, setAssignVotersDialog] = useState(false)
  const [newTerritoryName, setNewTerritoryName] = useState('')
  const [newTerritoryDescription, setNewTerritoryDescription] = useState('')
  const [stats, setStats] = useState<TerritoryStats | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795])
  const [mapZoom, setMapZoom] = useState(6)
  const [voterOpacity, setVoterOpacity] = useState(0.8)
  
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const mapRef = useRef<L.Map>(null)

  // Load data
  useEffect(() => {
    loadTerritories()
    loadVoters()
    loadStats()
  }, [])

  const loadTerritories = async () => {
    // Mock API call
    const mockTerritories: Territory[] = [
      {
        id: '1',
        name: 'Downtown District',
        description: 'Central business district and residential areas',
        geometry: null,
        area_sqkm: 15.2,
        assigned_voters: 1247,
        total_voters: 1532,
        coverage_percent: 81.4,
        created_date: '2024-01-15',
        last_modified: '2024-07-20',
        color: '#1976d2',
        active: true
      },
      {
        id: '2',
        name: 'Suburban West',
        description: 'Western suburban neighborhoods',
        geometry: null,
        area_sqkm: 28.7,
        assigned_voters: 2156,
        total_voters: 2834,
        coverage_percent: 76.1,
        created_date: '2024-01-20',
        last_modified: '2024-07-15',
        color: '#dc004e',
        active: true
      },
      {
        id: '3',
        name: 'Industrial Zone',
        description: 'Manufacturing and warehouse district',
        geometry: null,
        area_sqkm: 8.9,
        assigned_voters: 342,
        total_voters: 456,
        coverage_percent: 75.0,
        created_date: '2024-02-01',
        last_modified: '2024-06-30',
        color: '#388e3c',
        active: false
      }
    ]
    setTerritories(mockTerritories)
  }

  const loadVoters = async () => {
    // Mock API call
    const mockVoters: Voter[] = [
      {
        id: '1',
        name: 'John Smith',
        address: '123 Main St',
        latitude: 39.8283,
        longitude: -98.5795,
        territory_id: '1',
        registration_status: 'registered',
        voting_history: 4
      },
      {
        id: '2',
        name: 'Jane Doe',
        address: '456 Oak Ave',
        latitude: 39.8383,
        longitude: -98.5695,
        territory_id: '2',
        registration_status: 'registered',
        voting_history: 2
      },
      {
        id: '3',
        name: 'Bob Johnson',
        address: '789 Pine St',
        latitude: 39.8183,
        longitude: -98.5895,
        territory_id: undefined,
        registration_status: 'pending',
        voting_history: 0
      }
    ]
    setVoters(mockVoters)
  }

  const loadStats = async () => {
    // Calculate stats from territories
    const mockStats: TerritoryStats = {
      total_territories: 3,
      active_territories: 2,
      total_assigned_voters: 3745,
      total_unassigned_voters: 578,
      average_coverage: 77.5
    }
    setStats(mockStats)
  }

  const handleCreateTerritory = () => {
    setEditMode('create')
    setNewTerritoryDialog(true)
  }

  const handleEditTerritory = (territory: Territory) => {
    setSelectedTerritory(territory)
    setEditMode('edit')
  }

  const handleDeleteTerritory = async (territoryId: string) => {
    if (window.confirm('Are you sure you want to delete this territory?')) {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Remove territory and unassign voters
        setTerritories(prev => prev.filter(t => t.id !== territoryId))
        setVoters(prev => prev.map(v => 
          v.territory_id === territoryId ? { ...v, territory_id: undefined } : v
        ))
        
        setSuccess('Territory deleted successfully')
        if (selectedTerritory?.id === territoryId) {
          setSelectedTerritory(null)
        }
      } catch (err) {
        setError('Failed to delete territory')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveTerritory = async () => {
    if (!newTerritoryName.trim()) {
      setError('Territory name is required')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (editMode === 'create') {
        const newTerritory: Territory = {
          id: Date.now().toString(),
          name: newTerritoryName,
          description: newTerritoryDescription,
          geometry: null,
          area_sqkm: 0,
          assigned_voters: 0,
          total_voters: 0,
          coverage_percent: 0,
          created_date: new Date().toISOString().split('T')[0],
          last_modified: new Date().toISOString().split('T')[0],
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          active: true
        }
        
        setTerritories(prev => [...prev, newTerritory])
        setSuccess('Territory created successfully')
      } else if (editMode === 'edit' && selectedTerritory) {
        const updatedTerritory = {
          ...selectedTerritory,
          name: newTerritoryName,
          description: newTerritoryDescription,
          last_modified: new Date().toISOString().split('T')[0]
        }
        
        setTerritories(prev => prev.map(t => 
          t.id === selectedTerritory.id ? updatedTerritory : t
        ))
        setSelectedTerritory(updatedTerritory)
        setSuccess('Territory updated successfully')
      }
      
      setNewTerritoryDialog(false)
      setNewTerritoryName('')
      setNewTerritoryDescription('')
      setEditMode('view')
      
    } catch (err) {
      setError('Failed to save territory')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAssignVoters = async () => {
    if (!selectedTerritory) return
    
    setLoading(true)
    try {
      // Simulate bulk assignment based on geographic proximity
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Find unassigned voters within territory bounds (mock logic)
      const unassignedVoters = voters.filter(v => !v.territory_id)
      const toAssign = unassignedVoters.slice(0, Math.floor(Math.random() * unassignedVoters.length))
      
      setVoters(prev => prev.map(v => 
        toAssign.some(ta => ta.id === v.id) 
          ? { ...v, territory_id: selectedTerritory.id }
          : v
      ))
      
      // Update territory stats
      setTerritories(prev => prev.map(t => 
        t.id === selectedTerritory.id 
          ? { ...t, assigned_voters: t.assigned_voters + toAssign.length }
          : t
      ))
      
      setSuccess(`Assigned ${toAssign.length} voters to ${selectedTerritory.name}`)
      setAssignVotersDialog(false)
      
    } catch (err) {
      setError('Failed to assign voters')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredVoters = () => {
    return voters.filter(voter => {
      switch (voterFilter) {
        case 'assigned':
          return voter.territory_id !== undefined
        case 'unassigned':
          return voter.territory_id === undefined
        default:
          return true
      }
    })
  }

  const getVoterMarkerColor = (voter: Voter) => {
    if (voter.territory_id) {
      const territory = territories.find(t => t.id === voter.territory_id)
      return territory?.color || '#666666'
    }
    return '#ff5722' // Unassigned voters in orange
  }

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'success'
      case 'pending': return 'warning'
      case 'inactive': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper elevation={1} sx={{ p: 1, mb: 2 }}>
        <Toolbar disableGutters>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Territory Interactive Mapper
          </Typography>
          
          <ButtonGroup variant="outlined" sx={{ mr: 2 }}>
            <Button
              startIcon={<Add />}
              onClick={handleCreateTerritory}
            >
              New Territory
            </Button>
            <Button
              startIcon={<Assignment />}
              onClick={() => setAssignVotersDialog(true)}
              disabled={!selectedTerritory}
            >
              Bulk Assign
            </Button>
            <Button
              startIcon={<Download />}
              onClick={() => console.log('Export territories')}
            >
              Export
            </Button>
          </ButtonGroup>

          <FormControlLabel
            control={
              <Switch
                checked={showVoters}
                onChange={(e) => setShowVoters(e.target.checked)}
                size="small"
              />
            }
            label="Show Voters"
            sx={{ mr: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showTerritoryLabels}
                onChange={(e) => setShowTerritoryLabels(e.target.checked)}
                size="small"
              />
            }
            label="Labels"
          />
        </Toolbar>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Control Panel */}
        <Grid xs={12} md={3}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {/* Stats Card */}
            {stats && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Statistics</Typography>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Territories:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.active_territories}/{stats.total_territories}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Assigned Voters:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.total_assigned_voters.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Unassigned:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        {stats.total_unassigned_voters.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Avg Coverage:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.average_coverage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Territories List */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Territories ({territories.length})
                </Typography>
                <List dense>
                  {territories.map((territory) => (
                    <ListItem
                      key={territory.id}
                      button
                      selected={selectedTerritory?.id === territory.id}
                      onClick={() => setSelectedTerritory(territory)}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: territory.color,
                            borderRadius: 1,
                            border: '1px solid #ccc'
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {territory.name}
                            {!territory.active && (
                              <Chip label="Inactive" size="small" color="error" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {territory.assigned_voters}/{territory.total_voters} voters
                            </Typography>
                            <Typography variant="caption" display="block">
                              {territory.area_sqkm} km² • {territory.coverage_percent.toFixed(1)}% coverage
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditTerritory(territory)
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTerritory(territory.id)
                          }}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Voter Controls */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Voter Controls</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Filter Voters</InputLabel>
                  <Select
                    value={voterFilter}
                    onChange={(e) => setVoterFilter(e.target.value as any)}
                    label="Filter Voters"
                  >
                    <MenuItem value="all">All Voters</MenuItem>
                    <MenuItem value="assigned">Assigned</MenuItem>
                    <MenuItem value="unassigned">Unassigned</MenuItem>
                  </Select>
                </FormControl>
                
                <Typography variant="body2" gutterBottom>
                  Voter Opacity
                </Typography>
                <Slider
                  value={voterOpacity}
                  onChange={(_, value) => setVoterOpacity(value as number)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  Showing {getFilteredVoters().length} voters
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Grid>

        {/* Map Area */}
        <Grid xs={12} md={9}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1 }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                
                {editMode !== 'view' && (
                  <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                      position="topright"
                      onCreated={(e) => console.log('Territory created:', e)}
                      onEdited={(e) => console.log('Territory edited:', e)}
                      onDeleted={(e) => console.log('Territory deleted:', e)}
                      draw={{
                        rectangle: false,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                        polygon: {
                          allowIntersection: false,
                          drawError: {
                            color: '#e1e100',
                            message: '<strong>Error:</strong> Territory cannot overlap!'
                          },
                          shapeOptions: {
                            color: selectedTerritory?.color || '#1976d2',
                            fillOpacity: 0.3
                          }
                        }
                      }}
                    />
                  </FeatureGroup>
                )}
                
                {/* Voter Markers */}
                {showVoters && getFilteredVoters().map((voter) => (
                  <Marker
                    key={voter.id}
                    position={[voter.latitude, voter.longitude]}
                    opacity={voterOpacity}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="subtitle2">{voter.name}</Typography>
                        <Typography variant="body2">{voter.address}</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={voter.registration_status}
                            size="small"
                            color={getRegistrationStatusColor(voter.registration_status) as any}
                          />
                          {voter.territory_id && (
                            <Chip
                              label={territories.find(t => t.id === voter.territory_id)?.name || 'Unknown'}
                              size="small"
                              sx={{ ml: 0.5 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          Voting History: {voter.voting_history} elections
                        </Typography>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Territory Dialog */}
      <Dialog open={newTerritoryDialog} onClose={() => setNewTerritoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode === 'create' ? 'Create New Territory' : 'Edit Territory'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Territory Name"
            fullWidth
            variant="outlined"
            value={newTerritoryName}
            onChange={(e) => setNewTerritoryName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTerritoryDescription}
            onChange={(e) => setNewTerritoryDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTerritoryDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveTerritory} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
          >
            {editMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={assignVotersDialog} onClose={() => setAssignVotersDialog(false)}>
        <DialogTitle>Bulk Assign Voters</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Assign unassigned voters to "{selectedTerritory?.name}" based on geographic proximity?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will automatically assign voters within the territory boundaries.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignVotersDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkAssignVoters} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Assignment />}
          >
            Assign Voters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InteractiveMapper