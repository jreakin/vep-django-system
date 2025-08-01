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
  Divider,
  Alert,
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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material'
import {
  Edit,
  Delete,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Layers,
  Info,
  Warning,
  CheckCircle,
  Map as MapIcon,
  Add,
  Remove,
  Settings,
  Palette,
  Timeline,
  Assessment
} from '@mui/icons-material'
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet'
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

interface District {
  id: string
  name: string
  population: number
  geometry: any
  demographics: {
    white: number
    black: number
    hispanic: number
    asian: number
    other: number
  }
  compactness: number
  contiguous: boolean
  vra_compliant: boolean
}

interface DistrictEditorProps {
  planId?: string
}

const DistrictEditor: React.FC<DistrictEditorProps> = ({ planId }) => {
  const [districts, setDistricts] = useState<District[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit' | 'view'>('view')
  const [activeTab, setActiveTab] = useState(0)
  const [showDemographics, setShowDemographics] = useState(true)
  const [showCompliance, setShowCompliance] = useState(true)
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newDistrictDialog, setNewDistrictDialog] = useState(false)
  const [newDistrictName, setNewDistrictName] = useState('')
  
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const mapRef = useRef<L.Map>(null)

  // Mock data for demonstration
  useEffect(() => {
    const mockDistricts: District[] = [
      {
        id: '1',
        name: 'District 1',
        population: 785432,
        geometry: null,
        demographics: { white: 45, black: 35, hispanic: 15, asian: 3, other: 2 },
        compactness: 0.72,
        contiguous: true,
        vra_compliant: true
      },
      {
        id: '2',
        name: 'District 2',
        population: 798765,
        geometry: null,
        demographics: { white: 55, black: 25, hispanic: 12, asian: 6, other: 2 },
        compactness: 0.68,
        contiguous: true,
        vra_compliant: false
      }
    ]
    setDistricts(mockDistricts)
  }, [planId])

  const handleEditStart = () => {
    setEditMode('edit')
    // Save current state to undo stack
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(districts))])
    setRedoStack([])
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here would be actual API call to save districts
      console.log('Saving districts:', districts)
      
      setEditMode('view')
    } catch (err) {
      setError('Failed to save districts. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1]
      setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(districts))])
      setDistricts(previousState)
      setUndoStack(prev => prev.slice(0, -1))
    }
  }

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]
      setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(districts))])
      setDistricts(nextState)
      setRedoStack(prev => prev.slice(0, -1))
    }
  }

  const handleDrawCreated = (e: any) => {
    const layer = e.layer
    const districtId = `district_${Date.now()}`
    
    // Create new district from drawn shape
    const newDistrict: District = {
      id: districtId,
      name: newDistrictName || `District ${districts.length + 1}`,
      population: 0, // Will be calculated
      geometry: layer.toGeoJSON(),
      demographics: { white: 0, black: 0, hispanic: 0, asian: 0, other: 0 },
      compactness: 0,
      contiguous: true,
      vra_compliant: false
    }
    
    setDistricts(prev => [...prev, newDistrict])
    setNewDistrictDialog(false)
    setNewDistrictName('')
  }

  const handleDrawEdited = (e: any) => {
    // Update edited districts
    console.log('Districts edited:', e.layers)
  }

  const handleDrawDeleted = (e: any) => {
    // Remove deleted districts
    console.log('Districts deleted:', e.layers)
  }

  const getComplianceColor = (district: District) => {
    if (!district.contiguous) return 'error'
    if (!district.vra_compliant) return 'warning'
    if (district.compactness < 0.5) return 'warning'
    return 'success'
  }

  const getComplianceIcon = (district: District) => {
    const color = getComplianceColor(district)
    switch (color) {
      case 'error': return <Warning color="error" />
      case 'warning': return <Warning color="warning" />
      case 'success': return <CheckCircle color="success" />
      default: return <Info />
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper elevation={1} sx={{ p: 1, mb: 2 }}>
        <Toolbar disableGutters>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            District Editor {planId && `- Plan ${planId}`}
          </Typography>
          
          <ButtonGroup variant="outlined" sx={{ mr: 2 }}>
            <Tooltip title="Start Editing">
              <Button
                onClick={handleEditStart}
                disabled={editMode === 'edit'}
                startIcon={<Edit />}
              >
                Edit
              </Button>
            </Tooltip>
            <Tooltip title="Save Changes">
              <Button
                onClick={handleSave}
                disabled={editMode !== 'edit' || saving}
                startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              >
                Save
              </Button>
            </Tooltip>
          </ButtonGroup>

          <ButtonGroup variant="outlined" sx={{ mr: 2 }}>
            <Tooltip title="Undo">
              <Button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                startIcon={<Undo />}
              >
                Undo
              </Button>
            </Tooltip>
            <Tooltip title="Redo">
              <Button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                startIcon={<Redo />}
              >
                Redo
              </Button>
            </Tooltip>
          </ButtonGroup>

          <ButtonGroup variant="outlined">
            <Tooltip title="Toggle Demographics">
              <IconButton
                onClick={() => setShowDemographics(!showDemographics)}
                color={showDemographics ? 'primary' : 'default'}
              >
                <Palette />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Compliance">
              <IconButton
                onClick={() => setShowCompliance(!showCompliance)}
                color={showCompliance ? 'primary' : 'default'}
              >
                <Assessment />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Toolbar>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Districts Panel */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Districts</Typography>
                <Button
                  startIcon={<Add />}
                  onClick={() => setNewDistrictDialog(true)}
                  disabled={editMode !== 'edit'}
                  size="small"
                >
                  Add
                </Button>
              </Box>
              
              <List dense>
                {districts.map((district) => (
                  <ListItem
                    key={district.id}
                    button
                    selected={selectedDistrict?.id === district.id}
                    onClick={() => setSelectedDistrict(district)}
                  >
                    <ListItemIcon>
                      {getComplianceIcon(district)}
                    </ListItemIcon>
                    <ListItemText
                      primary={district.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Pop: {district.population.toLocaleString()}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip
                              label={`${district.compactness.toFixed(2)}`}
                              size="small"
                              color={district.compactness > 0.6 ? 'success' : 'warning'}
                            />
                            {district.vra_compliant && (
                              <Chip label="VRA" size="small" color="primary" />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Map Area */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', p: 1 }}>
              <MapContainer
                center={[39.8283, -98.5795]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                
                {editMode === 'edit' && (
                  <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                      position="topright"
                      onCreated={handleDrawCreated}
                      onEdited={handleDrawEdited}
                      onDeleted={handleDrawDeleted}
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
                            message: '<strong>Error:</strong> Polygon cannot intersect!'
                          },
                          shapeOptions: {
                            color: '#1976d2',
                            fillOpacity: 0.3
                          }
                        }
                      }}
                    />
                  </FeatureGroup>
                )}
              </MapContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* District Details Panel */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              {selectedDistrict ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedDistrict.name}
                  </Typography>
                  
                  <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="Info" />
                    <Tab label="Demographics" />
                    <Tab label="Compliance" />
                  </Tabs>

                  {activeTab === 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Population: {selectedDistrict.population.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Compactness: {selectedDistrict.compactness.toFixed(3)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Contiguous: {selectedDistrict.contiguous ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        VRA Compliant: {selectedDistrict.vra_compliant ? 'Yes' : 'No'}
                      </Typography>
                    </Box>
                  )}

                  {activeTab === 1 && showDemographics && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Demographics (%)
                      </Typography>
                      {Object.entries(selectedDistrict.demographics).map(([group, percentage]) => (
                        <Box key={group} sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {group}: {percentage}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {activeTab === 2 && showCompliance && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Compliance Status
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getComplianceIcon(selectedDistrict)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Overall: {getComplianceColor(selectedDistrict)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a district to view details
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New District Dialog */}
      <Dialog open={newDistrictDialog} onClose={() => setNewDistrictDialog(false)}>
        <DialogTitle>Create New District</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="District Name"
            fullWidth
            variant="outlined"
            value={newDistrictName}
            onChange={(e) => setNewDistrictName(e.target.value)}
            placeholder={`District ${districts.length + 1}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewDistrictDialog(false)}>Cancel</Button>
          <Button onClick={() => setEditMode('create')} variant="contained">
            Start Drawing
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DistrictEditor