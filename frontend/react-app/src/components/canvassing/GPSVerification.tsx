import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  GpsFixed,
  GpsOff,
  LocationOn,
  LocationOff,
  Refresh,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material'
import { getCurrentLocation, type GPSLocation } from '../../services/canvassing'

interface GPSVerificationProps {
  walkListId: string
  requiredAccuracy?: number // meters
  onVerified: (location: GPSLocation) => void
  onFailed: (error: string) => void
}

type VerificationState = 'checking' | 'waiting' | 'verified' | 'failed' | 'unavailable'

const GPSVerification: React.FC<GPSVerificationProps> = ({
  walkListId,
  requiredAccuracy = 10,
  onVerified,
  onFailed
}) => {
  const [state, setState] = useState<VerificationState>('checking')
  const [location, setLocation] = useState<GPSLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const maxRetries = 3

  useEffect(() => {
    startVerification()
  }, [])

  const startVerification = async () => {
    setState('checking')
    setError(null)
    setProgress(0)
    
    // Simulate progress during GPS acquisition
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 500)

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setState('unavailable')
        setError('GPS is not available on this device')
        clearInterval(progressInterval)
        return
      }

      // Get current location with high accuracy requirements
      const gpsLocation = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      })

      clearInterval(progressInterval)
      setProgress(100)
      setLocation(gpsLocation)

      // Check accuracy requirements
      if (gpsLocation.accuracy && gpsLocation.accuracy <= requiredAccuracy) {
        setState('verified')
        onVerified(gpsLocation)
      } else {
        setState('waiting')
        setError(`GPS accuracy (±${Math.round(gpsLocation.accuracy || 0)}m) does not meet requirements (±${requiredAccuracy}m)`)
      }

    } catch (err: any) {
      clearInterval(progressInterval)
      setProgress(0)
      
      let errorMessage = 'GPS verification failed'
      
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = 'GPS permission denied. Please enable location access in your browser settings.'
          setState('failed')
          break
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'GPS position unavailable. Please check your GPS signal.'
          setState('waiting')
          break
        case 3: // TIMEOUT
          errorMessage = 'GPS timeout. Unable to get location within time limit.'
          setState('waiting')
          break
        default:
          errorMessage = err.message || 'Unknown GPS error occurred'
          setState('waiting')
      }
      
      setError(errorMessage)
      
      if (state === 'failed') {
        onFailed(errorMessage)
      }
    }
  }

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      startVerification()
    } else {
      setState('failed')
      setShowErrorDialog(true)
    }
  }

  const handleErrorDialogClose = () => {
    setShowErrorDialog(false)
    onFailed(error || 'GPS verification failed after maximum retries')
  }

  const getStateIcon = () => {
    switch (state) {
      case 'checking':
        return <GpsFixed color="primary" sx={{ animation: 'pulse 1.5s infinite' }} />
      case 'waiting':
        return <LocationOn color="warning" />
      case 'verified':
        return <CheckCircle color="success" />
      case 'failed':
        return <GpsOff color="error" />
      case 'unavailable':
        return <LocationOff color="disabled" />
      default:
        return <GpsFixed />
    }
  }

  const getStateColor = () => {
    switch (state) {
      case 'checking':
        return 'primary'
      case 'waiting':
        return 'warning'
      case 'verified':
        return 'success'
      case 'failed':
      case 'unavailable':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStateMessage = () => {
    switch (state) {
      case 'checking':
        return 'Acquiring GPS signal...'
      case 'waiting':
        return 'Waiting for better GPS accuracy'
      case 'verified':
        return 'GPS verification successful'
      case 'failed':
        return 'GPS verification failed'
      case 'unavailable':
        return 'GPS unavailable on this device'
      default:
        return 'Checking GPS...'
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center">
              {getStateIcon()}
              <Typography variant="h6" sx={{ ml: 1 }}>
                GPS Verification
              </Typography>
            </Box>
            <Chip
              label={getStateMessage()}
              color={getStateColor()}
              variant={state === 'checking' ? 'outlined' : 'filled'}
            />
          </Box>

          {/* Progress Bar for checking state */}
          {state === 'checking' && (
            <Box mb={3}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {progress < 90 ? 'Searching for GPS signal...' : 'Processing location...'}
              </Typography>
            </Box>
          )}

          {/* Location Information */}
          {location && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Current Location:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latitude: {location.latitude.toFixed(6)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Longitude: {location.longitude.toFixed(6)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accuracy: ±{Math.round(location.accuracy || 0)} meters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Timestamp: {new Date(location.timestamp).toLocaleString()}
              </Typography>
            </Box>
          )}

          {/* Requirements */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Requirements:
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {navigator.geolocation ? (
                <CheckCircle color="success" fontSize="small" />
              ) : (
                <Error color="error" fontSize="small" />
              )}
              <Typography variant="body2">
                GPS Available: {navigator.geolocation ? 'Yes' : 'No'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {location && location.accuracy && location.accuracy <= requiredAccuracy ? (
                <CheckCircle color="success" fontSize="small" />
              ) : (
                <Warning color="warning" fontSize="small" />
              )}
              <Typography variant="body2">
                Required Accuracy: ±{requiredAccuracy} meters
              </Typography>
            </Box>
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              {retryCount > 0 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Attempt {retryCount + 1} of {maxRetries + 1}
                </Typography>
              )}
            </Alert>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="flex-end">
            {(state === 'waiting' || state === 'failed') && retryCount < maxRetries && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRetry}
              >
                Retry Verification
              </Button>
            )}
            
            {state === 'verified' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                disabled
              >
                Verification Complete
              </Button>
            )}
          </Box>

          {/* Instructions */}
          <Box mt={3}>
            <Typography variant="caption" color="text.secondary">
              <strong>Instructions:</strong><br />
              • Ensure GPS/Location services are enabled on your device<br />
              • Move to an area with clear sky view for better accuracy<br />
              • Wait for the GPS signal to stabilize<br />
              • Accuracy must be within ±{requiredAccuracy} meters to proceed
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Error Dialog */}
      <Dialog
        open={showErrorDialog}
        onClose={handleErrorDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Error color="error" sx={{ mr: 1 }} />
            GPS Verification Failed
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Unable to verify GPS location after {maxRetries + 1} attempts.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This may be due to:
          </Typography>
          <ul>
            <li>GPS permissions not granted</li>
            <li>Poor GPS signal quality</li>
            <li>Device GPS functionality issues</li>
            <li>Environmental factors (indoor location, buildings)</li>
          </ul>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Please check your device settings and try again from a location with better GPS reception.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleErrorDialogClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default GPSVerification