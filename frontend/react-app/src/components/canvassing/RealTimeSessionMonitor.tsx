import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  Stop,
  Visibility,
  GpsFixed,
  People,
  CheckCircle,
  Schedule,
  TrendingUp,
  LocationOn
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import {
  getCanvassSessions,
  subscribeToSessionUpdates,
  type CanvassSession,
  type RealTimeSessionUpdate
} from '../../services/canvassing'

interface SessionWithProgress extends CanvassSession {
  progress?: RealTimeSessionUpdate['progress']
  current_location?: RealTimeSessionUpdate['current_location']
}

const RealTimeSessionMonitor: React.FC = () => {
  const [sessions, setSessions] = useState<SessionWithProgress[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionWithProgress | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')
  const websocketsRef = useRef<Map<string, WebSocket>>(new Map())

  // Fetch initial sessions
  const { data: initialSessions = [], isLoading, error } = useQuery({
    queryKey: ['canvass-sessions'],
    queryFn: getCanvassSessions,
    refetchInterval: 30000, // Fallback polling every 30 seconds
  })

  // Initialize WebSocket connections for active sessions
  useEffect(() => {
    const activeSessions = initialSessions.filter(session => session.status === 'active')
    setSessions(initialSessions)

    // Clean up existing connections
    websocketsRef.current.forEach((ws) => {
      ws.close()
    })
    websocketsRef.current.clear()

    // Create new connections for active sessions
    activeSessions.forEach((session) => {
      try {
        const socket = subscribeToSessionUpdates(
          session.id,
          (update: RealTimeSessionUpdate) => {
            setSessions(prev => prev.map(s => 
              s.id === update.session_id 
                ? { 
                    ...s, 
                    progress: update.progress,
                    current_location: update.current_location,
                    status: update.status as any
                  }
                : s
            ))
          }
        )

        socket.onopen = () => {
          setConnectionStatus('connected')
        }

        socket.onclose = () => {
          setConnectionStatus('disconnected')
        }

        socket.onerror = () => {
          setConnectionStatus('disconnected')
        }

        websocketsRef.current.set(session.id, socket)
        setConnectionStatus('connecting')
      } catch (error) {
        console.error(`Failed to connect to session ${session.id}:`, error)
      }
    })

    return () => {
      websocketsRef.current.forEach((ws) => {
        ws.close()
      })
      websocketsRef.current.clear()
    }
  }, [initialSessions])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayArrow color="success" />
      case 'paused':
        return <Pause color="warning" />
      case 'completed':
        return <CheckCircle color="success" />
      default:
        return <Schedule color="default" />
    }
  }

  const getStatusColor = (status: string): "success" | "warning" | "default" => {
    switch (status) {
      case 'active':
        return 'success'
      case 'paused':
        return 'warning'
      case 'completed':
        return 'success'
      default:
        return 'default'
    }
  }

  const handleViewDetails = (session: SessionWithProgress) => {
    setSelectedSession(session)
    setDetailDialogOpen(true)
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success'
      case 'connecting':
        return 'warning'
      case 'disconnected':
        return 'error'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load canvassing sessions. Please try again later.
      </Alert>
    )
  }

  const activeSessions = sessions.filter(s => s.status === 'active')
  const completedToday = sessions.filter(s => 
    s.status === 'completed' && 
    new Date(s.end_time || '').toDateString() === new Date().toDateString()
  )

  const totalProgress = activeSessions.reduce((total, session) => {
    return total + (session.progress?.percentage || 0)
  }, 0) / (activeSessions.length || 1)

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5">
          Real-Time Session Monitoring
        </Typography>
        <Chip
          icon={connectionStatus === 'connected' ? <GpsFixed /> : <CircularProgress size={16} />}
          label={getConnectionStatusText()}
          color={getConnectionStatusColor()}
          variant={connectionStatus === 'connected' ? 'filled' : 'outlined'}
        />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PlayArrow color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Sessions
                  </Typography>
                  <Typography variant="h5">
                    {activeSessions.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Today
                  </Typography>
                  <Typography variant="h5">
                    {completedToday.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg. Progress
                  </Typography>
                  <Typography variant="h5">
                    {Math.round(totalProgress)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Volunteers
                  </Typography>
                  <Typography variant="h5">
                    {new Set(activeSessions.map(s => s.volunteer.id)).size}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Session Details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Volunteer</TableCell>
                  <TableCell>Walk List</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Last Update</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          {session.volunteer.first_name?.[0]}{session.volunteer.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {session.volunteer.first_name} {session.volunteer.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.volunteer.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Walk List #{session.walk_list}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(session.status)}
                        <Chip
                          label={session.status.toUpperCase()}
                          color={getStatusColor(session.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {session.progress ? (
                        <Box sx={{ minWidth: 120 }}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption">
                              {session.progress.contacted}/{session.progress.total_voters}
                            </Typography>
                            <Typography variant="caption">
                              {session.progress.percentage}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={session.progress.percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No progress data
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(session.start_time), 'MMM dd, HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {session.current_location ? (
                        <Box display="flex" alignItems="center">
                          <LocationOn color="success" fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption">
                            {new Date().toLocaleTimeString()}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No location
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(session)}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {sessions.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No active canvassing sessions
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Session Details - {selectedSession?.volunteer.first_name} {selectedSession?.volunteer.last_name}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Session Information
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedSession.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Start Time:</strong> {format(new Date(selectedSession.start_time), 'PPpp')}
                </Typography>
                {selectedSession.end_time && (
                  <Typography variant="body2">
                    <strong>End Time:</strong> {format(new Date(selectedSession.end_time), 'PPpp')}
                  </Typography>
                )}
                <Typography variant="body2">
                  <strong>Total Responses:</strong> {selectedSession.total_responses}
                </Typography>
                <Typography variant="body2">
                  <strong>GPS Verified:</strong> {selectedSession.gps_verified_responses}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                {selectedSession.progress && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Progress Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Voters:</strong> {selectedSession.progress.total_voters}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Contacted:</strong> {selectedSession.progress.contacted}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Remaining:</strong> {selectedSession.progress.remaining}
                    </Typography>
                    <Box mt={2}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedSession.progress.percentage}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        {selectedSession.progress.percentage}% Complete
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Grid>

              {selectedSession.current_location && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Location
                  </Typography>
                  <Typography variant="body2">
                    <strong>Latitude:</strong> {selectedSession.current_location.latitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Longitude:</strong> {selectedSession.current_location.longitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Accuracy:</strong> ±{Math.round(selectedSession.current_location.accuracy || 0)}m
                  </Typography>
                  <Typography variant="body2">
                    <strong>Last Updated:</strong> {new Date(selectedSession.current_location.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
              )}

              {selectedSession.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">
                    {selectedSession.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default RealTimeSessionMonitor