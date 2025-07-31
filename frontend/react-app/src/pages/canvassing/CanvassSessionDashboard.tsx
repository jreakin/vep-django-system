import React, { useState, useEffect } from 'react'
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
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  Stop,
  Visibility,
  LocationOn,
  CheckCircle,
  Schedule,
  People,
  Assignment
} from '@mui/icons-material'
import { format, formatDistance } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCanvassSessions,
  createCanvassSession,
  updateCanvassSession,
  endCanvassSession,
  getCanvassResponses,
  type CanvassSession,
  type CanvassResponse
} from '../../services/canvassing'
import LocationTracker from '../../components/canvassing/LocationTracker'

const CanvassSessionDashboard: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<CanvassSession | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [responses, setResponses] = useState<CanvassResponse[]>([])
  const queryClient = useQueryClient()

  // Fetch sessions
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['canvass-sessions'],
    queryFn: getCanvassSessions,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  })

  // Mutations
  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CanvassSession> }) => 
      updateCanvassSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvass-sessions'] })
    },
  })

  const endSessionMutation = useMutation({
    mutationFn: endCanvassSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvass-sessions'] })
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayArrow color="success" />
      case 'paused':
        return <Pause color="warning" />
      case 'completed':
        return <CheckCircle color="info" />
      default:
        return <Schedule />
    }
  }

  const getStatusColor = (status: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (status) {
      case 'active':
        return 'success'
      case 'paused':
        return 'warning'
      case 'completed':
        return 'info'
      default:
        return 'default'
    }
  }

  const calculateProgress = (session: CanvassSession) => {
    if (session.total_responses === 0) return 0
    // This is a simplified calculation - you might want to calculate based on total voters in walk list
    return Math.min((session.total_responses / 100) * 100, 100) // Assuming 100 voters max for demo
  }

  const getSessionDuration = (session: CanvassSession) => {
    const start = new Date(session.start_time)
    const end = session.end_time ? new Date(session.end_time) : new Date()
    return formatDistance(start, end)
  }

  const handlePauseResume = (session: CanvassSession) => {
    const newStatus = session.status === 'active' ? 'paused' : 'active'
    updateSessionMutation.mutate({
      id: session.id,
      data: { status: newStatus }
    })
  }

  const handleEndSession = (session: CanvassSession) => {
    if (window.confirm('Are you sure you want to end this canvassing session?')) {
      endSessionMutation.mutate(session.id)
    }
  }

  const handleViewDetails = async (session: CanvassSession) => {
    setSelectedSession(session)
    try {
      const sessionResponses = await getCanvassResponses(session.id)
      setResponses(sessionResponses)
    } catch (error) {
      console.error('Failed to fetch responses:', error)
      setResponses([])
    }
    setDetailsDialogOpen(true)
  }

  const getGPSVerificationRate = (session: CanvassSession) => {
    if (session.total_responses === 0) return 0
    return (session.gps_verified_responses / session.total_responses) * 100
  }

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
          Failed to load canvassing sessions. Please try again later.
        </Alert>
      </Container>
    )
  }

  const activeSessions = sessions.filter(s => s.status === 'active')
  const pausedSessions = sessions.filter(s => s.status === 'paused')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Canvassing Session Dashboard
      </Typography>

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
                <Pause color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Paused Sessions
                  </Typography>
                  <Typography variant="h5">
                    {pausedSessions.length}
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
                <CheckCircle color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Today
                  </Typography>
                  <Typography variant="h5">
                    {completedSessions.filter(s => 
                      new Date(s.start_time).toDateString() === new Date().toDateString()
                    ).length}
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
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Responses
                  </Typography>
                  <Typography variant="h5">
                    {sessions.reduce((sum, s) => sum + s.total_responses, 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Sessions Alert */}
      {activeSessions.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {activeSessions.length} volunteer{activeSessions.length > 1 ? 's are' : ' is'} currently canvassing. 
          Monitor their progress below.
        </Alert>
      )}

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Canvassing Sessions
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Volunteer</TableCell>
                  <TableCell>Walk List</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>GPS Verified</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(session.status)}
                        <Box sx={{ ml: 1 }}>
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
                      <Chip 
                        label={session.status.toUpperCase()} 
                        color={getStatusColor(session.status)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption">
                            {session.total_responses} responses
                          </Typography>
                          <Typography variant="caption">
                            {calculateProgress(session).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={calculateProgress(session)} 
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getSessionDuration(session)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Started {format(new Date(session.start_time), 'HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn 
                          sx={{ 
                            mr: 0.5, 
                            fontSize: 16,
                            color: getGPSVerificationRate(session) > 80 ? 'success.main' : 'warning.main'
                          }} 
                        />
                        <Typography variant="body2">
                          {getGPSVerificationRate(session).toFixed(0)}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {session.gps_verified_responses}/{session.total_responses}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(session)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {session.status !== 'completed' && (
                          <Tooltip title={session.status === 'active' ? 'Pause' : 'Resume'}>
                            <IconButton
                              size="small"
                              onClick={() => handlePauseResume(session)}
                              color={session.status === 'active' ? 'warning' : 'success'}
                            >
                              {session.status === 'active' ? <Pause /> : <PlayArrow />}
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {session.status !== 'completed' && (
                          <Tooltip title="End Session">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleEndSession(session)}
                            >
                              <Stop />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Session Details - {selectedSession?.volunteer.first_name} {selectedSession?.volunteer.last_name}
        </DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Session Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {selectedSession.status}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Started:</strong> {format(new Date(selectedSession.start_time), 'PPp')}
                    </Typography>
                    {selectedSession.end_time && (
                      <Typography variant="body2">
                        <strong>Ended:</strong> {format(new Date(selectedSession.end_time), 'PPp')}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Duration:</strong> {getSessionDuration(selectedSession)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Responses:</strong> {selectedSession.total_responses}
                    </Typography>
                    <Typography variant="body2">
                      <strong>GPS Verified:</strong> {selectedSession.gps_verified_responses} 
                      ({getGPSVerificationRate(selectedSession).toFixed(0)}%)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Real-time Location
                    </Typography>
                    <LocationTracker volunteerId={selectedSession.volunteer.id} />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Responses ({responses.length})
                    </Typography>
                    {responses.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Time</TableCell>
                              <TableCell>Voter ID</TableCell>
                              <TableCell>GPS Verified</TableCell>
                              <TableCell>Notes</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {responses.slice(0, 10).map((response) => (
                              <TableRow key={response.id}>
                                <TableCell>
                                  {format(new Date(response.timestamp), 'HH:mm:ss')}
                                </TableCell>
                                <TableCell>{response.voter_id}</TableCell>
                                <TableCell>
                                  {response.gps_verified ? (
                                    <CheckCircle color="success" fontSize="small" />
                                  ) : (
                                    <Alert color="warning" fontSize="small" />
                                  )}
                                </TableCell>
                                <TableCell>{response.notes || 'No notes'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No responses recorded yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CanvassSessionDashboard