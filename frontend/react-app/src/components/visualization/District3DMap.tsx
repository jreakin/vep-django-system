import React, { Suspense, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Sphere, Html } from '@react-three/drei'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box as MuiBox, 
  Stack,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material'
import { Mesh, Vector3, Color } from 'three'

interface GeographicDataPoint {
  id: string
  name: string
  coordinates: [number, number] // [lat, lng]
  value: number
  type: 'voter_density' | 'fundraising' | 'canvassing_progress' | 'volunteer_activity'
  details: {
    total: number
    percentage?: number
    trend?: 'up' | 'down' | 'stable'
    description: string
  }
}

interface District3DMapProps {
  data: GeographicDataPoint[]
  districtBounds: {
    north: number
    south: number
    east: number
    west: number
    center: [number, number]
  }
  onDataPointClick?: (point: GeographicDataPoint) => void
}

// Convert lat/lng to 3D coordinates
const latLngTo3D = (lat: number, lng: number, bounds: any, scale = 10): [number, number, number] => {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west) - 0.5) * scale
  const z = ((lat - bounds.south) / (bounds.north - bounds.south) - 0.5) * scale
  return [x, 0, -z] // negative z to match typical map orientation
}

// Individual data point in 3D space
const DataPoint3D: React.FC<{
  point: GeographicDataPoint
  position: [number, number, number]
  scale: number
  color: string
  onClick?: () => void
}> = ({ point, position, scale, color, onClick }) => {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1
      
      // Pulse effect for hovered items
      if (hovered) {
        meshRef.current.scale.setScalar(scale * (1 + Math.sin(state.clock.elapsedTime * 8) * 0.1))
      }
    }
  })

  const height = Math.max(0.2, point.value * 3) // Scale height based on value

  return (
    <group position={position}>
      <Box
        ref={meshRef}
        args={[0.3, height, 0.3]}
        position={[0, height / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <meshStandardMaterial 
          color={hovered ? new Color(color).multiplyScalar(1.3) : color}
          transparent
          opacity={0.8}
        />
      </Box>
      
      {/* Base platform */}
      <Box args={[0.4, 0.05, 0.4]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#333" />
      </Box>
      
      {/* Hover tooltip */}
      {hovered && (
        <Html position={[0, height + 0.5, 0]} center>
          <div className="tw-bg-white tw-p-2 tw-rounded tw-shadow-lg tw-border tw-max-w-xs tw-text-sm">
            <div className="tw-font-semibold">{point.name}</div>
            <div className="tw-text-gray-600">{point.details.description}</div>
            <div className="tw-text-lg tw-font-bold tw-text-blue-600">
              {point.details.total.toLocaleString()}
              {point.details.percentage && ` (${point.details.percentage}%)`}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// District outline/boundary
const DistrictBoundary: React.FC<{ bounds: any }> = ({ bounds }) => {
  const points = useMemo(() => {
    const scale = 10
    return [
      latLngTo3D(bounds.north, bounds.west, bounds, scale),
      latLngTo3D(bounds.north, bounds.east, bounds, scale),
      latLngTo3D(bounds.south, bounds.east, bounds, scale),
      latLngTo3D(bounds.south, bounds.west, bounds, scale),
      latLngTo3D(bounds.north, bounds.west, bounds, scale), // Close the loop
    ]
  }, [bounds])

  return (
    <group>
      {points.slice(0, -1).map((point, index) => {
        const nextPoint = points[index + 1]
        const direction = new Vector3(nextPoint[0] - point[0], 0, nextPoint[2] - point[2])
        const length = direction.length()
        direction.normalize()
        
        return (
          <Box
            key={index}
            args={[0.05, 0.1, length]}
            position={[
              (point[0] + nextPoint[0]) / 2,
              0.05,
              (point[2] + nextPoint[2]) / 2
            ]}
            rotation={[0, Math.atan2(direction.x, direction.z), 0]}
          >
            <meshStandardMaterial color="#4A90E2" />
          </Box>
        )
      })}
    </group>
  )
}

// Ground grid
const Grid3D: React.FC = () => {
  const gridSize = 20
  const lines = []
  
  for (let i = -gridSize; i <= gridSize; i += 2) {
    lines.push(
      <Box key={`line-x-${i}`} args={[gridSize * 2, 0.01, 0.02]} position={[0, 0, i]}>
        <meshStandardMaterial color="#e0e0e0" transparent opacity={0.3} />
      </Box>
    )
    lines.push(
      <Box key={`line-z-${i}`} args={[0.02, 0.01, gridSize * 2]} position={[i, 0, 0]}>
        <meshStandardMaterial color="#e0e0e0" transparent opacity={0.3} />
      </Box>
    )
  }
  
  return <group>{lines}</group>
}

// Main 3D Scene
const Scene3D: React.FC<{
  data: GeographicDataPoint[]
  bounds: any
  dataType: string
  onDataPointClick?: (point: GeographicDataPoint) => void
}> = ({ data, bounds, dataType, onDataPointClick }) => {
  const getColorForType = (type: string) => {
    switch (type) {
      case 'voter_density': return '#4CAF50'
      case 'fundraising': return '#FF9800'
      case 'canvassing_progress': return '#2196F3'
      case 'volunteer_activity': return '#9C27B0'
      default: return '#757575'
    }
  }

  const filteredData = data.filter(point => point.type === dataType)

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      <Grid3D />
      <DistrictBoundary bounds={bounds} />
      
      {filteredData.map((point) => {
        const position = latLngTo3D(point.coordinates[0], point.coordinates[1], bounds)
        return (
          <DataPoint3D
            key={point.id}
            point={point}
            position={position}
            scale={1}
            color={getColorForType(point.type)}
            onClick={() => onDataPointClick?.(point)}
          />
        )
      })}
      
      {/* Legend */}
      <Text
        position={[-8, 4, -8]}
        fontSize={0.3}
        color="#333"
        anchorX="left"
        anchorY="top"
      >
        3D District Visualization
      </Text>
      
      <Text
        position={[-8, 3.5, -8]}
        fontSize={0.2}
        color="#666"
        anchorX="left"
        anchorY="top"
      >
        Height = Data Value
      </Text>
      
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={20}
      />
    </>
  )
}

const District3DMap: React.FC<District3DMapProps> = ({ 
  data, 
  districtBounds, 
  onDataPointClick 
}) => {
  const [selectedDataType, setSelectedDataType] = useState<string>('voter_density')
  const [showControls, setShowControls] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState<GeographicDataPoint | null>(null)

  const dataTypes = [
    { value: 'voter_density', label: 'Voter Density', color: '#4CAF50' },
    { value: 'fundraising', label: 'Fundraising', color: '#FF9800' },
    { value: 'canvassing_progress', label: 'Canvassing Progress', color: '#2196F3' },
    { value: 'volunteer_activity', label: 'Volunteer Activity', color: '#9C27B0' }
  ]

  const handleDataPointClick = (point: GeographicDataPoint) => {
    setSelectedPoint(point)
    onDataPointClick?.(point)
  }

  const currentTypeData = data.filter(d => d.type === selectedDataType)
  const maxValue = Math.max(...currentTypeData.map(d => d.value), 1)
  const minValue = Math.min(...currentTypeData.map(d => d.value), 0)

  return (
    <Card sx={{ height: '600px', position: 'relative' }}>
      <CardContent sx={{ p: 0, height: '100%' }}>
        {/* Controls Panel */}
        <MuiBox 
          sx={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 1000,
            bgcolor: 'background.paper',
            borderRadius: 1,
            p: 2,
            boxShadow: 2,
            maxWidth: '300px'
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6">
              3D District Analytics
            </Typography>
            
            <FormControl fullWidth size="small">
              <InputLabel>Data Type</InputLabel>
              <Select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                label="Data Type"
              >
                {dataTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <MuiBox 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          bgcolor: type.color, 
                          borderRadius: '50%' 
                        }} 
                      />
                      <span>{type.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <MuiBox>
              <Typography variant="body2" gutterBottom>
                Data Range: {minValue.toFixed(1)} - {maxValue.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentTypeData.length} data points
              </Typography>
            </MuiBox>

            <FormControlLabel
              control={
                <Switch 
                  checked={showControls} 
                  onChange={(e) => setShowControls(e.target.checked)}
                  size="small"
                />
              }
              label="Show Controls"
            />
          </Stack>
        </MuiBox>

        {/* Selected Point Details */}
        {selectedPoint && (
          <MuiBox 
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16, 
              zIndex: 1000,
              bgcolor: 'background.paper',
              borderRadius: 1,
              p: 2,
              boxShadow: 2,
              maxWidth: '250px'
            }}
          >
            <Typography variant="h6" gutterBottom>
              {selectedPoint.name}
            </Typography>
            <Chip 
              label={selectedPoint.type.replace('_', ' ')} 
              color="primary" 
              size="small" 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" gutterBottom>
              {selectedPoint.details.description}
            </Typography>
            <Typography variant="h5" color="primary">
              {selectedPoint.details.total.toLocaleString()}
              {selectedPoint.details.percentage && ` (${selectedPoint.details.percentage}%)`}
            </Typography>
            {selectedPoint.details.trend && (
              <Chip 
                label={`Trend: ${selectedPoint.details.trend}`}
                color={selectedPoint.details.trend === 'up' ? 'success' : 
                       selectedPoint.details.trend === 'down' ? 'error' : 'default'}
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </MuiBox>
        )}

        {/* Instructions */}
        {showControls && (
          <MuiBox 
            sx={{ 
              position: 'absolute', 
              bottom: 16, 
              left: 16, 
              zIndex: 1000,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              borderRadius: 1,
              p: 1.5,
              maxWidth: '200px'
            }}
          >
            <Typography variant="caption" component="div">
              🖱️ <strong>Mouse:</strong> Rotate view
            </Typography>
            <Typography variant="caption" component="div">
              🔍 <strong>Scroll:</strong> Zoom in/out
            </Typography>
            <Typography variant="caption" component="div">
              👆 <strong>Click:</strong> Select data point
            </Typography>
          </MuiBox>
        )}

        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 8, 12], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Suspense fallback={
            <Html center>
              <CircularProgress />
            </Html>
          }>
            <Scene3D
              data={data}
              bounds={districtBounds}
              dataType={selectedDataType}
              onDataPointClick={handleDataPointClick}
            />
          </Suspense>
        </Canvas>
      </CardContent>
    </Card>
  )
}

export default District3DMap