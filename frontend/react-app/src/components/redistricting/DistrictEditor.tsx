import React, { useState, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Tooltip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  CircularProgress
} from '@mui/material'
import {
  Map as MapIcon,
  Edit,
  Save,
  Cancel,
  Download,
  Upload,
  Delete,
  Add,
  MoreVert,
  Timeline,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo
} from '@mui/icons-material'
import { MapContainer, TileLayer, FeatureGroup, LayersControl } from 'react-leaflet'
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

interface District {
  id: string
  name: string
  geometry: any // GeoJSON geometry
  population: number
  demographics: {
    white: number
    black: number
    hispanic: number
    asian: number
    other: number
  }
  compliance_score: number
  is_valid: boolean
}

interface RedistrictingPlan {
  id: string
  name: string
  status: 'draft' | 'review' | 'approved' | 'rejected'
  districts: District[]
  total_population: number
  compactness_score: number
  vra_compliance: number
  created_at: string
  updated_at: string
}

interface DistrictEditorProps {
  plan: RedistrictingPlan
  onUpdatePlan: (plan: RedistrictingPlan) => void
  onSave: () => void
  onCancel: () => void
}

const DistrictEditor: React.FC<DistrictEditorProps> = ({ 
  plan, 
  onUpdatePlan, 
  onSave, 
  onCancel 
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showDemographics, setShowDemographics] = useState(true)
  const [showPopulation, setShowPopulation] = useState(true)
  const [undoStack, setUndoStack] = useState<RedistrictingPlan[]>([])
  const [redoStack, setRedoStack] = useState<RedistrictingPlan[]>([])
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'shapefile' | 'geojson' | 'kml' | 'csv'>('geojson')
  const [isExporting, setIsExporting] = useState(false)
  
  const mapRef = useRef<L.Map>(null)
  const featureGroupRef = useRef<L.FeatureGroup>(null)

  const saveToHistory = (newPlan: RedistrictingPlan) => {
    setUndoStack(prev => [...prev, plan])
    setRedoStack([]) // Clear redo stack when new change is made
    onUpdatePlan(newPlan)
  }

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousPlan = undoStack[undoStack.length - 1]
      setRedoStack(prev => [plan, ...prev])
      setUndoStack(prev => prev.slice(0, -1))
      onUpdatePlan(previousPlan)
    }
  }

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextPlan = redoStack[0]
      setUndoStack(prev => [...prev, plan])
      setRedoStack(prev => prev.slice(1))
      onUpdatePlan(nextPlan)
    }
  }

  const handleDistrictCreated = (e: any) => {
    const { layer } = e
    const geometry = layer.toGeoJSON().geometry
    
    const newDistrict: District = {
      id: `district_${Date.now()}`,
      name: `District ${plan.districts.length + 1}`,
      geometry,
      population: 0, // Would be calculated based on underlying data
      demographics: {
        white: 0,
        black: 0,
        hispanic: 0,
        asian: 0,
        other: 0
      },
      compliance_score: 0,
      is_valid: true
    }

    const updatedPlan = {
      ...plan,
      districts: [...plan.districts, newDistrict]
    }

    saveToHistory(updatedPlan)
  }

  const handleDistrictEdited = (e: any) => {
    const layers = e.layers
    const updatedDistricts = [...plan.districts]

    layers.eachLayer((layer: any) => {
      const geometry = layer.toGeoJSON().geometry
      const districtId = layer.options.districtId
      
      const districtIndex = updatedDistricts.findIndex(d => d.id === districtId)
      if (districtIndex !== -1) {
        updatedDistricts[districtIndex] = {
          ...updatedDistricts[districtIndex],
          geometry
        }
      }
    })

    const updatedPlan = {
      ...plan,
      districts: updatedDistricts
    }

    saveToHistory(updatedPlan)
  }

  const handleDistrictDeleted = (e: any) => {
    const layers = e.layers
    const deletedDistrictIds: string[] = []

    layers.eachLayer((layer: any) => {
      const districtId = layer.options.districtId
      if (districtId) {
        deletedDistrictIds.push(districtId)
      }
    })

    const updatedDistricts = plan.districts.filter(d => !deletedDistrictIds.includes(d.id))
    
    const updatedPlan = {
      ...plan,
      districts: updatedDistricts
    }

    saveToHistory(updatedPlan)
  }

  const splitDistrict = (district: District) => {
    // Implementation for splitting a district
    console.log('Split district:', district.name)
  }

  const mergeDistricts = (district1: District, district2: District) => {
    // Implementation for merging districts
    console.log('Merge districts:', district1.name, district2.name)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Implementation for exporting the plan
      const exportData = {
        plan,
        format: exportFormat,
        timestamp: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: exportFormat === 'geojson' ? 'application/geo+json' : 'application/json'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `redistricting_plan_${plan.name.replace(/\s+/g, '_')}.${exportFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setExportDialogOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getDistrictColor = (district: District) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ]
    const index = plan.districts.indexOf(district) % colors.length
    return colors[index]
  }

  const getComplianceColor = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  return (
    <Box>
      {/* Toolbar */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Editing: {plan.name}
            </Typography>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Undo">
                <IconButton 
                  onClick={handleUndo} 
                  disabled={undoStack.length === 0}
                  size="small"
                >
                  <Undo />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Redo">
                <IconButton 
                  onClick={handleRedo} 
                  disabled={redoStack.length === 0}
                  size="small"
                >
                  <Redo />
                </IconButton>
              </Tooltip>

              <Button
                size="small"
                startIcon={<Download />}
                onClick={() => setExportDialogOpen(true)}
              >
                Export
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Cancel />}
                onClick={onCancel}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<Save />}
                onClick={onSave}
              >
                Save
              </Button>
            </Box>
          </Box>

          {/* Layer Controls */}
          <Box mt={2} display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Base Layer</InputLabel>
              <Select defaultValue="streets" label="Base Layer">
                <MenuItem value="streets">Streets</MenuItem>
                <MenuItem value="satellite">Satellite</MenuItem>
                <MenuItem value="topographic">Topographic</MenuItem>
              </Select>
            </FormControl>

            <Chip
              label={`Demographics ${showDemographics ? 'ON' : 'OFF'}`}
              onClick={() => setShowDemographics(!showDemographics)}
              color={showDemographics ? 'primary' : 'default'}
              variant={showDemographics ? 'filled' : 'outlined'}
            />

            <Chip
              label={`Population ${showPopulation ? 'ON' : 'OFF'}`}
              onClick={() => setShowPopulation(!showPopulation)}
              color={showPopulation ? 'primary' : 'default'}
              variant={showPopulation ? 'filled' : 'outlined'}
            />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Map */}
        <Grid item xs={12} md={9}>
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
                    
                    <LayersControl.BaseLayer name="Satellite">
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                      />
                    </LayersControl.BaseLayer>
                  </LayersControl>

                  <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                      position="topleft"
                      onCreated={handleDistrictCreated}
                      onEdited={handleDistrictEdited}
                      onDeleted={handleDistrictDeleted}
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
                            message: '<strong>Error:</strong> District boundaries cannot intersect!'
                          },
                          shapeOptions: {
                            color: '#97009c'
                          }
                        }
                      }}
                    />
                  </FeatureGroup>

                  {/* Render existing districts */}
                  {plan.districts.map((district) => {
                    // This would render the district polygons on the map
                    // Implementation depends on the GeoJSON structure
                    return null
                  })}
                </MapContainer>

                {/* Map Controls */}
                <Box sx={{ position: 'absolute', top: 10, right: 60, zIndex: 1000 }}>
                  <Card sx={{ p: 1 }}>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton size="small">
                        <ZoomIn />
                      </IconButton>
                      <IconButton size="small">
                        <ZoomOut />
                      </IconButton>
                    </Box>
                  </Card>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* District List & Properties */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Districts ({plan.districts.length})
              </Typography>

              {plan.districts.map((district) => (
                <Card
                  key={district.id}
                  sx={{ 
                    mb: 1, 
                    cursor: 'pointer',
                    border: selectedDistrict?.id === district.id ? 2 : 1,
                    borderColor: selectedDistrict?.id === district.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setSelectedDistrict(district)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: getDistrictColor(district),
                            borderRadius: 1,
                            mr: 1
                          }}
                        />
                        <Typography variant="body2" fontWeight="medium">
                          {district.name}
                        </Typography>
                      </Box>
                      
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Pop: {district.population.toLocaleString()}
                    </Typography>

                    <Box mt={1}>
                      <Chip
                        label={`${district.compliance_score}%`}
                        color={getComplianceColor(district.compliance_score)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {plan.districts.length === 0 && (
                <Alert severity="info">
                  No districts created yet. Use the drawing tools on the map to create districts.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Selected District Details */}
          {selectedDistrict && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedDistrict.name}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Population: {selectedDistrict.population.toLocaleString()}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Compliance Score: {selectedDistrict.compliance_score}%
                </Typography>

                {showDemographics && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Demographics
                    </Typography>
                    {Object.entries(selectedDistrict.demographics).map(([key, value]) => (
                      <Box key={key} display="flex" justifyContent="space-between">
                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                          {key}:
                        </Typography>
                        <Typography variant="caption">
                          {value}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                <Box mt={2} display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Timeline />}
                    onClick={() => splitDistrict(selectedDistrict)}
                  >
                    Split
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Redistricting Plan</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              label="Export Format"
            >
              <MenuItem value="geojson">GeoJSON</MenuItem>
              <MenuItem value="shapefile">Shapefile</MenuItem>
              <MenuItem value="kml">KML</MenuItem>
              <MenuItem value="csv">CSV (Data Only)</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            {exportFormat === 'geojson' && 'GeoJSON format is ideal for web applications and GIS software.'}
            {exportFormat === 'shapefile' && 'Shapefile format is compatible with most GIS applications.'}
            {exportFormat === 'kml' && 'KML format can be opened in Google Earth and other mapping applications.'}
            {exportFormat === 'csv' && 'CSV format exports district data without geographic boundaries.'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isExporting}
            startIcon={isExporting ? <CircularProgress size={20} /> : <Download />}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DistrictEditor