import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Paper,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  PersonAdd,
  ExitToApp,
  Security,
  AccessTime,
  Visibility,
  VisibilityOff,
  Warning,
  Info,
  CheckCircle,
  Schedule,
  History,
  AdminPanelSettings,
  SupervisorAccount,
  Badge,
  ExpandMore,
  Search,
  FilterList,
  Refresh
} from '@mui/icons-material'

interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  last_login: string
  avatar?: string
}

interface ImpersonationSession {
  id: string
  admin_user: string
  target_user: string
  start_time: string
  end_time?: string
  duration?: number
  reason: string
  status: 'active' | 'ended'
  ip_address: string
  user_agent: string
}

interface ImpersonationLog {
  id: string
  admin_user: string
  target_user: string
  action: string
  timestamp: string
  ip_address: string
  reason: string
  session_duration: number
}

const ImpersonationPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [activeSessions, setActiveSessions] = useState<ImpersonationSession[]>([])
  const [impersonationLogs, setImpersonationLogs] = useState<ImpersonationLog[]>([])
  const [currentSession, setCurrentSession] = useState<ImpersonationSession | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [impersonationReason, setImpersonationReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState(false)
  const [endSessionDialog, setEndSessionDialog] = useState(false)
  const [sessionToEnd, setSessionToEnd] = useState<string | null>(null)
  const [showInactiveUsers, setShowInactiveUsers] = useState(false)

  // Mock current admin user
  const currentAdmin = {
    id: 'admin1',
    username: 'admin',
    role: 'Super Admin'
  }

  // Load data
  useEffect(() => {
    loadUsers()
    loadActiveSessions()
    loadImpersonationLogs()
  }, [])

  const loadUsers = async () => {
    // Mock API call
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'campaignmanager1',
        email: 'manager1@example.com',
        first_name: 'John',
        last_name: 'Smith',
        role: 'Campaign Manager',
        is_active: true,
        last_login: '2024-07-30T10:30:00Z'
      },
      {
        id: '2',
        username: 'volunteer1',
        email: 'volunteer1@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'Volunteer',
        is_active: true,
        last_login: '2024-07-29T15:45:00Z'
      },
      {
        id: '3',
        username: 'analyst1',
        email: 'analyst1@example.com',
        first_name: 'Mike',
        last_name: 'Johnson',
        role: 'Data Analyst',
        is_active: false,
        last_login: '2024-07-25T09:15:00Z'
      }
    ]
    setUsers(mockUsers)
  }

  const loadActiveSessions = async () => {
    // Mock API call
    const mockSessions: ImpersonationSession[] = [
      {
        id: '1',
        admin_user: 'admin',
        target_user: 'campaignmanager1',
        start_time: '2024-07-31T09:00:00Z',
        reason: 'Testing campaign functionality',
        status: 'active',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...'
      }
    ]
    setActiveSessions(mockSessions)
    
    // Check if current admin has an active session
    const currentSessionData = mockSessions.find(s => s.admin_user === currentAdmin.username && s.status === 'active')
    setCurrentSession(currentSessionData || null)
  }

  const loadImpersonationLogs = async () => {
    // Mock API call
    const mockLogs: ImpersonationLog[] = [
      {
        id: '1',
        admin_user: 'admin',
        target_user: 'campaignmanager1',
        action: 'Started impersonation',
        timestamp: '2024-07-31T09:00:00Z',
        ip_address: '192.168.1.100',
        reason: 'Testing campaign functionality',
        session_duration: 0
      },
      {
        id: '2',
        admin_user: 'admin',
        target_user: 'volunteer1',
        action: 'Ended impersonation',
        timestamp: '2024-07-30T14:30:00Z',
        ip_address: '192.168.1.100',
        reason: 'Support ticket resolution',
        session_duration: 1800 // 30 minutes
      }
    ]
    setImpersonationLogs(mockLogs)
  }

  const handleStartImpersonation = async () => {
    if (!selectedUser || !impersonationReason.trim()) {
      setError('Please select a user and provide a reason for impersonation')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const targetUser = users.find(u => u.id === selectedUser)
      if (!targetUser) {
        throw new Error('User not found')
      }
      
      const newSession: ImpersonationSession = {
        id: Date.now().toString(),
        admin_user: currentAdmin.username,
        target_user: targetUser.username,
        start_time: new Date().toISOString(),
        reason: impersonationReason,
        status: 'active',
        ip_address: '192.168.1.100',
        user_agent: navigator.userAgent
      }
      
      setCurrentSession(newSession)
      setActiveSessions(prev => [...prev, newSession])
      setSuccess(`Successfully started impersonating ${targetUser.first_name} ${targetUser.last_name}`)
      setSelectedUser('')
      setImpersonationReason('')
      setConfirmDialog(false)
      
      // In a real app, this would redirect to the user's view
      // Log impersonation action securely if required (e.g., using an audit logging system)
      
    } catch (err) {
      setError('Failed to start impersonation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEndImpersonation = async (sessionId?: string) => {
    const targetSessionId = sessionId || currentSession?.id
    if (!targetSessionId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const session = activeSessions.find(s => s.id === targetSessionId)
      if (session) {
        const endTime = new Date()
        const startTime = new Date(session.start_time)
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
        
        // Update session
        const updatedSession = {
          ...session,
          end_time: endTime.toISOString(),
          duration,
          status: 'ended' as const
        }
        
        // Remove from active sessions
        setActiveSessions(prev => prev.filter(s => s.id !== targetSessionId))
        
        // Add to logs
        const logEntry: ImpersonationLog = {
          id: Date.now().toString(),
          admin_user: session.admin_user,
          target_user: session.target_user,
          action: 'Ended impersonation',
          timestamp: endTime.toISOString(),
          ip_address: session.ip_address,
          reason: session.reason,
          session_duration: duration
        }
        setImpersonationLogs(prev => [logEntry, ...prev])
        
        if (session.id === currentSession?.id) {
          setCurrentSession(null)
        }
        
        setSuccess('Impersonation session ended successfully')
      }
      
      setEndSessionDialog(false)
      setSessionToEnd(null)
      
    } catch (err) {
      setError('Failed to end impersonation session')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === '' || user.role === roleFilter
      const matchesActive = showInactiveUsers || user.is_active
      
      return matchesSearch && matchesRole && matchesActive
    })
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super admin': return 'error'
      case 'admin': return 'warning'
      case 'campaign manager': return 'primary'
      case 'data analyst': return 'secondary'
      case 'volunteer': return 'success'
      default: return 'default'
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Impersonation Panel
      </Typography>
      
      {/* Current Session Alert */}
      {currentSession && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => setEndSessionDialog(true)}
              startIcon={<ExitToApp />}
            >
              End Session
            </Button>
          }
        >
          <Typography variant="body1">
            Currently impersonating: <strong>{currentSession.target_user}</strong>
          </Typography>
          <Typography variant="body2">
            Started at: {new Date(currentSession.start_time).toLocaleString()}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Start Impersonation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Start New Impersonation
              </Typography>
              
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Search Users"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Role Filter</InputLabel>
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      label="Role Filter"
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="Campaign Manager">Campaign Manager</MenuItem>
                      <MenuItem value="Data Analyst">Data Analyst</MenuItem>
                      <MenuItem value="Volunteer">Volunteer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showInactiveUsers}
                    onChange={(e) => setShowInactiveUsers(e.target.checked)}
                  />
                }
                label="Show inactive users"
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select User to Impersonate</InputLabel>
                <Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  label="Select User to Impersonate"
                  disabled={!!currentSession}
                >
                  {getFilteredUsers().map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Badge sx={{ mr: 1 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1">
                            {user.first_name} {user.last_name} ({user.username})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email} • {user.role}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 1 }}>
                          <Chip 
                            label={user.role} 
                            size="small" 
                            color={getRoleColor(user.role) as any}
                          />
                          {!user.is_active && (
                            <Chip 
                              label="Inactive" 
                              size="small" 
                              color="error" 
                              sx={{ ml: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason for Impersonation"
                value={impersonationReason}
                onChange={(e) => setImpersonationReason(e.target.value)}
                placeholder="Describe why you need to impersonate this user..."
                sx={{ mb: 2 }}
                disabled={!!currentSession}
              />
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setConfirmDialog(true)}
                disabled={!selectedUser || !impersonationReason.trim() || !!currentSession}
              >
                Start Impersonation
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Sessions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Active Sessions ({activeSessions.length})
                </Typography>
                <IconButton onClick={loadActiveSessions} size="small">
                  <Refresh />
                </IconButton>
              </Box>
              
              {activeSessions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No active impersonation sessions
                </Typography>
              ) : (
                <List>
                  {activeSessions.map((session) => (
                    <ListItem key={session.id} divider>
                      <ListItemIcon>
                        <SupervisorAccount color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${session.admin_user} → ${session.target_user}`}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Started: {new Date(session.start_time).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Reason: {session.reason}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setSessionToEnd(session.id)
                            setEndSessionDialog(true)
                          }}
                          color="error"
                          size="small"
                        >
                          <ExitToApp />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Impersonation Logs */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                Impersonation Audit Log ({impersonationLogs.length} entries)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Admin User</TableCell>
                      <TableCell>Target User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>IP Address</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {impersonationLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.admin_user}</TableCell>
                        <TableCell>{log.target_user}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color={log.action.includes('Started') ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          {log.session_duration > 0 ? formatDuration(log.session_duration) : '-'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={log.reason}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {log.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{log.ip_address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Impersonation</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  You are about to impersonate another user. This action will be logged and audited.
                </Typography>
              </Alert>
              
              <Typography variant="body1" gutterBottom>
                <strong>User:</strong> {users.find(u => u.id === selectedUser)?.first_name} {users.find(u => u.id === selectedUser)?.last_name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Username:</strong> {users.find(u => u.id === selectedUser)?.username}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Role:</strong> {users.find(u => u.id === selectedUser)?.role}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Reason:</strong> {impersonationReason}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartImpersonation} 
            variant="contained" 
            color="warning"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Security />}
          >
            Confirm Impersonation
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Session Dialog */}
      <Dialog open={endSessionDialog} onClose={() => setEndSessionDialog(false)}>
        <DialogTitle>End Impersonation Session</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to end the impersonation session?
          </Typography>
          {sessionToEnd && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will return you to your normal admin view and log the session end.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndSessionDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleEndImpersonation(sessionToEnd || undefined)} 
            variant="contained" 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <ExitToApp />}
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ImpersonationPanel