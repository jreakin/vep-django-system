import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
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
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Map as MapIcon,
  People,
  MoreVert,
  Save,
  Cancel,
  Visibility,
  LocationOn,
  Analytics,
  Download,
  Upload,
  ExpandMore,
  Assignment
} from '@mui/icons-material'
import { MapContainer, TileLayer, FeatureGroup, LayersControl, Marker, Popup } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Territory {
  id: string
  name: string
  type: 'precinct' | 'district' | 'county' | 'custom'
  geometry: any // GeoJSON geometry
  population: number
  registered_voters: number
  assigned_voters: string[]
  demographics: {
    white: number
    black: number
    hispanic: number
    asian: number
    other: number
  }
  created_at: string
  updated_at: string
  is_active: boolean
}

interface Voter {
  id: string
  first_name: string
  last_name: string
  email: string
  address: string
  latitude: number
  longitude: number
  territory_id: string | null
  registration_date: string
}

interface TerritoryManagerProps {
  territories: Territory[]
  voters: Voter[]
  onTerritoryCreate: (territory: Omit<Territory, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onTerritoryUpdate: (id: string, territory: Partial<Territory>) => Promise<void>
  onTerritoryDelete: (id: string) => Promise<void>
  onVoterAssignment: (voterIds: string[], territoryId: string) => Promise<void>
  onBulkVoterAssignment: (assignments: Array<{voter_id: string, territory_id: string}>) => Promise<void>
}

const TerritoryManager: React.FC<TerritoryManagerProps> = ({
  territories,
  voters,
  onTerritoryCreate,
  onTerritoryUpdate,
  onTerritoryDelete,
  onVoterAssignment,
  onBulkVoterAssignment
}) => {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [voterAssignmentOpen, setVoterAssignmentOpen] = useState(false)
  const [bulkAssignmentOpen, setBulkAssignmentOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showVoters, setShowVoters] = useState(true)
  const [selectedVoters, setSelectedVoters] = useState<string[]>([])
  const [targetTerritoryId, setTargetTerritoryId] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  
  const [newTerritory, setNewTerritory] = useState({
    name: '',
    type: 'custom' as Territory['type'],
    geometry: null,
    is_active: true
  })

  const mapRef = useRef<L.Map>(null)
  const featureGroupRef = useRef<L.FeatureGroup>(null)

  const unassignedVoters = voters.filter(voter => !voter.territory_id)
  const assignedVoters = voters.filter(voter => voter.territory_id)

  const handleTerritoryCreated = (e: any) => {
    const { layer } = e
    const geometry = layer.toGeoJSON().geometry
    
    setNewTerritory(prev => ({ ...prev, geometry }))
    setCreateDialogOpen(true)
  }

  const handleTerritoryEdited = (e: any) => {
    if (!selectedTerritory) return
    
    const layers = e.layers
    layers.eachLayer((layer: any) => {
      const geometry = layer.toGeoJSON().geometry
      onTerritoryUpdate(selectedTerritory.id, { geometry })
    })
  }

  const handleTerritoryDeleted = (e: any) => {
    if (!selectedTerritory) return
    
    if (window.confirm(`Are you sure you want to delete territory "${selectedTerritory.name}"?`)) {
      onTerritoryDelete(selectedTerritory.id)
      setSelectedTerritory(null)
    }
  }

  const handleCreateTerritory = async () => {
    if (!newTerritory.name || !newTerritory.geometry) return

    try {
      await onTerritoryCreate({
        ...newTerritory,
        population: 0,
        registered_voters: 0,
        assigned_voters: [],
        demographics: {
          white: 0,
          black: 0,
          hispanic: 0,
          asian: 0,
          other: 0
        }
      })
      
      setCreateDialogOpen(false)
      setNewTerritory({
        name: '',
        type: 'custom',
        geometry: null,
        is_active: true
      })
    } catch (error) {
      console.error('Failed to create territory:', error)
    }
  }

  const handleVoterSelection = (voterId: string, checked: boolean) => {
    if (checked) {
      setSelectedVoters(prev => [...prev, voterId])
    } else {
      setSelectedVoters(prev => prev.filter(id => id !== voterId))
    }
  }

  const handleSelectAllVoters = (checked: boolean) => {
    if (checked) {
      setSelectedVoters(unassignedVoters.map(v => v.id))
    } else {
      setSelectedVoters([])
    }
  }

  const handleBulkAssignment = async () => {
    if (selectedVoters.length === 0 || !targetTerritoryId) return

    try {
      await onVoterAssignment(selectedVoters, targetTerritoryId)
      setSelectedVoters([])
      setTargetTerritoryId('')
      setBulkAssignmentOpen(false)
    } catch (error) {
      console.error('Bulk assignment failed:', error)
    }
  }

  const handleAutoAssignment = async () => {
    // Auto-assign voters based on geographic proximity
    const assignments = unassignedVoters.map(voter => {
      // Find the closest territory (simplified implementation)
      const closestTerritory = territories.find(t => t.is_active)
      return {
        voter_id: voter.id,
        territory_id: closestTerritory?.id || ''
      }
    }).filter(a => a.territory_id)

    if (assignments.length > 0) {
      await onBulkVoterAssignment(assignments)
    }
  }

  const getTerritoryColor = (territory: Territory) => {
    const colors = {
      precinct: '#FF6B6B',
      district: '#4ECDC4',
      county: '#45B7D1',
      custom: '#FFA07A'
    }
    return colors[territory.type] || '#98D8C8'
  }

  const getTerritoryStats = (territory: Territory) => {
    const territoryVoters = voters.filter(v => v.territory_id === territory.id)
    return {
      totalVoters: territoryVoters.length,
      registeredVoters: territory.registered_voters,
      coverage: territory.registered_voters > 0 
        ? Math.round((territoryVoters.length / territory.registered_voters) * 100)
        : 0
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Territory Management
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Assignment />}
            onClick={() => setBulkAssignmentOpen(true)}
            disabled={unassignedVoters.length === 0}
          >
            Bulk Assign ({unassignedVoters.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={handleAutoAssignment}
            disabled={unassignedVoters.length === 0}
          >
            Auto Assign
          </Button>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItemComponent onClick={() => setMenuAnchor(null)}>
              <Download sx={{ mr: 1 }} />
              Export Territories
            </MenuItemComponent>
            <MenuItemComponent onClick={() => setMapAnchor(null)}>
              <Upload sx={{ mr: 1 }} />
              Import Territories
            </MenuItemComponent>
          </Menu>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Territories
              </Typography>
              <Typography variant="h5">
                {territories.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Voters
              </Typography>
              <Typography variant="h5">
                {voters.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Assigned Voters
              </Typography>
              <Typography variant="h5">
                {assignedVoters.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unassigned Voters
              </Typography>
              <Typography variant="h5" color="warning.main">
                {unassignedVoters.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Map */}
        <Grid xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ height: 600, position: 'relative' }}>
                <MapContainer
                  ref={mapRef}
                  center={[39.8283, -98.5795]} // Center of US
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="OpenStreetMap">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                    </LayersControl.BaseLayer>
                  </LayersControl>

                  <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                      position="topleft"
                      onCreated={handleTerritoryCreated}
                      onEdited={handleTerritoryEdited}
                      onDeleted={handleTerritoryDeleted}
                      draw={{
                        rectangle: true,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                        polygon: {
                          allowIntersection: false,
                          drawError: {
                            color: '#e1e100',
                            message: '<strong>Error:</strong> Territory boundaries cannot overlap!'
                          },
                          shapeOptions: {
                            color: '#97009c'
                          }
                        }
                      }}
                    />
                  </FeatureGroup>

                  {/* Show voters as markers */}
                  {showVoters && voters.map((voter) => (
                    <Marker
                      key={voter.id}
                      position={[voter.latitude, voter.longitude]}
                    >
                      <Popup>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {voter.first_name} {voter.last_name}
                          </Typography>
                          <Typography variant="caption">
                            {voter.address}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Territory: {voter.territory_id 
                              ? territories.find(t => t.id === voter.territory_id)?.name || 'Unknown'
                              : 'Unassigned'
                            }
                          </Typography>
                        </Box>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                {/* Map Controls */}
                <Box sx={{ position: 'absolute', top: 10, left: 60, zIndex: 1000 }}>
                  <Card sx={{ p: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showVoters}
                          onChange={(e) => setShowVoters(e.target.checked)}
                          size="small"
                        />
                      }
                      label="Show Voters"
                    />
                  </Card>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Territory List */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Territories ({territories.length})
              </Typography>

              <List>
                {territories.map((territory) => {
                  const stats = getTerritoryStats(territory)
                  return (
                    <ListItem
                      key={territory.id}
                      button
                      selected={selectedTerritory?.id === territory.id}
                      onClick={() => setSelectedTerritory(territory)}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: getTerritoryColor(territory),
                          borderRadius: 1,
                          mr: 2
                        }}
                      />
                      <ListItemText
                        primary={territory.name}
                        secondary={
                          <Box>
                            <Typography variant="caption">
                              Type: {territory.type}
                            </Typography>
                            <br />
                            <Typography variant="caption">
                              Voters: {stats.totalVoters} / {stats.registeredVoters}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={`${stats.coverage}%`}
                          color={stats.coverage >= 80 ? 'success' : stats.coverage >= 50 ? 'warning' : 'error'}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  )
                })}
              </List>

              {territories.length === 0 && (
                <Alert severity="info">
                  No territories created yet. Use the drawing tools on the map to create territories.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Selected Territory Details */}
          {selectedTerritory && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedTerritory.name}
                </Typography>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                      Statistics
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2">
                        Population: {selectedTerritory.population.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        Registered Voters: {selectedTerritory.registered_voters.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        Assigned Voters: {getTerritoryStats(selectedTerritory).totalVoters}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">
                      Demographics
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      {Object.entries(selectedTerritory.demographics).map(([key, value]) => (
                        <Typography key={key} variant="body2">
                          {key.charAt(0).toUpperCase() + key.slice(1)}: {value}%
                        </Typography>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Box mt={2} display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<People />}
                    onClick={() => setVoterAssignmentOpen(true)}
                  >
                    Assign Voters
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleTerritoryDeleted({ layers: [] })}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Create Territory Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Territory</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid xs={12}>
              <TextField
                label="Territory Name"
                value={newTerritory.name}
                onChange={(e) => setNewTerritory(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
              />
            </Grid>
            <Grid xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newTerritory.type}
                  onChange={(e) => setNewTerritory(prev => ({ ...prev, type: e.target.value as Territory['type'] }))}
                  label="Type"
                >
                  <MenuItem value="precinct">Precinct</MenuItem>
                  <MenuItem value="district">District</MenuItem>
                  <MenuItem value="county">County</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newTerritory.is_active}
                    onChange={(e) => setNewTerritory(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTerritory}
            variant="contained"
            disabled={!newTerritory.name}
          >
            Create Territory
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog
        open={bulkAssignmentOpen}
        onClose={() => setBulkAssignmentOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Bulk Voter Assignment ({unassignedVoters.length} unassigned voters)
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Target Territory</InputLabel>
              <Select
                value={targetTerritoryId}
                onChange={(e) => setTargetTerritoryId(e.target.value)}
                label="Target Territory"
              >
                {territories.filter(t => t.is_active).map((territory) => (
                  <MenuItem key={territory.id} value={territory.id}>
                    {territory.name} ({territory.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            <FormControlLabel
              control={
                <Checkbox
                  indeterminate={selectedVoters.length > 0 && selectedVoters.length < unassignedVoters.length}
                  checked={selectedVoters.length === unassignedVoters.length}
                  onChange={(e) => handleSelectAllVoters(e.target.checked)}
                />
              }
              label="Select All"
            />

            <List>
              {unassignedVoters.map((voter) => (
                <ListItem key={voter.id} dense>
                  <Checkbox
                    checked={selectedVoters.includes(voter.id)}
                    onChange={(e) => handleVoterSelection(voter.id, e.target.checked)}
                  />
                  <ListItemText
                    primary={`${voter.first_name} ${voter.last_name}`}
                    secondary={voter.address}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Selected {selectedVoters.length} voters for assignment
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkAssignmentOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkAssignment}
            variant="contained"
            disabled={selectedVoters.length === 0 || !targetTerritoryId}
          >
            Assign Selected Voters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TerritoryManager