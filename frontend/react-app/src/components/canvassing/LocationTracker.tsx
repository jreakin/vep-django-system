import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent
} from '@mui/material'
import { LocationOn, LocationOff, GpsFixed } from '@mui/icons-material'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  type GPSLocation
} from '../../services/canvassing'

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationTrackerProps {
  volunteerId: string
  showTrail?: boolean
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ 
  volunteerId, 
  showTrail = true 
}) => {
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null)
  const [locationHistory, setLocationHistory] = useState<GPSLocation[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const watchIdRef = useRef<number>(-1)

  useEffect(() => {
    startTracking()
    return () => stopTracking()
  }, [volunteerId])

  const startTracking = async () => {
    try {
      setError(null)
      setIsTracking(true)

      // Get initial location
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      setLocationHistory([location])
      setAccuracy(location.accuracy || null)

      // Start watching location
      watchIdRef.current = watchLocation(
        (newLocation) => {
          setCurrentLocation(newLocation)
          setAccuracy(newLocation.accuracy || null)
          
          if (showTrail) {
            setLocationHistory(prev => [...prev.slice(-50), newLocation]) // Keep last 50 points
          }
        },
        (err) => {
          setError(err.message)
          setIsTracking(false)
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location')
      setIsTracking(false)
    }
  }

  const stopTracking = () => {
    if (watchIdRef.current !== -1) {
      stopWatchingLocation(watchIdRef.current)
      watchIdRef.current = -1
    }
    setIsTracking(false)
  }

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'default'
    if (accuracy <= 10) return 'success'
    if (accuracy <= 50) return 'warning'
    return 'error'
  }

  const getAccuracyLabel = (accuracy: number | null) => {
    if (!accuracy) return 'Unknown'
    if (accuracy <= 10) return 'High'
    if (accuracy <= 50) return 'Medium'
    return 'Low'
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" icon={<LocationOff />}>
            GPS Error: {error}
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!currentLocation) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">
              Getting GPS location...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box>
      {/* Location Status */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {isTracking ? (
            <GpsFixed color="success" />
          ) : (
            <LocationOff color="error" />
          )}
          <Typography variant="body2">
            {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
          </Typography>
        </Box>
        
        {accuracy && (
          <Chip
            size="small"
            label={`${getAccuracyLabel(accuracy)} (±${Math.round(accuracy)}m)`}
            color={getAccuracyColor(accuracy)}
          />
        )}
      </Box>

      {/* Location Details */}
      <Box mb={2}>
        <Typography variant="caption" color="text.secondary">
          Current Position:
        </Typography>
        <Typography variant="body2">
          {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last Updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Map */}
      <Box sx={{ height: 300, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={[currentLocation.latitude, currentLocation.longitude]}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Current location marker */}
          <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
            <Popup>
              <div>
                <strong>Current Location</strong><br />
                Accuracy: ±{accuracy ? Math.round(accuracy) : 'unknown'} meters<br />
                Time: {new Date().toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>

          {/* Location trail */}
          {showTrail && locationHistory.length > 1 && (
            <Polyline
              positions={locationHistory.map(loc => [loc.latitude, loc.longitude])}
              color="blue"
              weight={3}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </Box>

      {/* Trail Statistics */}
      {showTrail && locationHistory.length > 1 && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Trail Points: {locationHistory.length} | 
            Distance: ~{calculateDistance(locationHistory).toFixed(2)} km
          </Typography>
        </Box>
      )}
    </Box>
  )
}

// Helper function to calculate rough distance traveled
const calculateDistance = (locations: GPSLocation[]): number => {
  if (locations.length < 2) return 0

  let totalDistance = 0
  for (let i = 1; i < locations.length; i++) {
    totalDistance += getDistanceBetweenPoints(
      locations[i - 1].latitude,
      locations[i - 1].longitude,
      locations[i].latitude,
      locations[i].longitude
    )
  }
  return totalDistance
}

// Haversine formula to calculate distance between two GPS points
const getDistanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRad = (value: number): number => {
  return value * Math.PI / 180
}

export default LocationTracker