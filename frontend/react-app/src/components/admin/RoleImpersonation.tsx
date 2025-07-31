import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Autocomplete,
  Snackbar
} from '@mui/material'
import {
  PersonAdd,
  ExitToApp,
  Security,
  AdminPanelSettings,
  Person,
  SupervisorAccount,
  Visibility,
  VisibilityOff,
  Warning,
  Info,
  Check
} from '@mui/icons-material'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  groups: string[]
}

interface ImpersonationSession {
  original_user: User
  impersonated_user: User
  started_at: string
  reason: string
}

interface RoleImpersonationProps {
  currentUser: User
  availableUsers: User[]
  impersonationSession: ImpersonationSession | null
  onStartImpersonation: (userId: string, reason: string) => Promise<void>
  onEndImpersonation: () => Promise<void>
  onRoleSwitch: (roleType: 'user' | 'staff' | 'admin') => Promise<void>
}

const RoleImpersonation: React.FC<RoleImpersonationProps> = ({
  currentUser,
  availableUsers,
  impersonationSession,
  onStartImpersonation,
  onEndImpersonation,
  onRoleSwitch
}) => {
  const [impersonationDialogOpen, setImpersonationDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [impersonationReason, setImpersonationReason] = useState('')
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'user' | 'staff' | 'admin'>('user')
  const [isProcessing, setIsProcessing] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const getCurrentRoleType = (user: User): 'user' | 'staff' | 'admin' => {
    if (user.is_superuser) return 'admin'
    if (user.is_staff) return 'staff'
    return 'user'
  }

  const getRoleIcon = (roleType: 'user' | 'staff' | 'admin') => {
    switch (roleType) {
      case 'admin':
        return <AdminPanelSettings color="error" />
      case 'staff':
        return <SupervisorAccount color="warning" />
      case 'user':
        return <Person color="primary" />
    }
  }

  const getRoleColor = (roleType: 'user' | 'staff' | 'admin') => {
    switch (roleType) {
      case 'admin':
        return 'error'
      case 'staff':
        return 'warning'
      case 'user':
        return 'primary'
    }
  }

  const handleStartImpersonation = async () => {
    if (!selectedUser || !impersonationReason.trim()) return

    setIsProcessing(true)
    try {
      await onStartImpersonation(selectedUser.id, impersonationReason)
      setImpersonationDialogOpen(false)
      setSelectedUser(null)
      setImpersonationReason('')
      setSnackbarMessage(`Now impersonating ${selectedUser.first_name} ${selectedUser.last_name}`)
      setSnackbarOpen(true)
    } catch (error) {
      console.error('Impersonation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEndImpersonation = async () => {
    setIsProcessing(true)
    try {
      await onEndImpersonation()
      setSnackbarMessage('Impersonation ended successfully')
      setSnackbarOpen(true)
    } catch (error) {
      console.error('End impersonation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRoleSwitch = async () => {
    setIsProcessing(true)
    try {
      await onRoleSwitch(selectedRole)
      setRoleDialogOpen(false)
      setSnackbarMessage(`Role switched to ${selectedRole}`)
      setSnackbarOpen(true)
    } catch (error) {
      console.error('Role switch failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const canImpersonate = currentUser.is_superuser || currentUser.is_staff
  const currentRole = getCurrentRoleType(currentUser)

  return (
    <Box>
      {/* Impersonation Status Banner */}
      {impersonationSession && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleEndImpersonation}
              disabled={isProcessing}
              startIcon={<ExitToApp />}
            >
              Exit Impersonation
            </Button>
          }
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Currently impersonating: {impersonationSession.impersonated_user.first_name} {impersonationSession.impersonated_user.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Original user: {impersonationSession.original_user.first_name} {impersonationSession.original_user.last_name} • 
              Started: {new Date(impersonationSession.started_at).toLocaleString()}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Current User & Role */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2 }}>
                {currentUser.first_name[0]}{currentUser.last_name[0]}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {currentUser.first_name} {currentUser.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser.email}
                </Typography>
                <Box mt={1} display="flex" gap={1}>
                  <Chip
                    icon={getRoleIcon(currentRole)}
                    label={currentRole.toUpperCase()}
                    color={getRoleColor(currentRole) as any}
                    size="small"
                  />
                  {currentUser.groups.map((group) => (
                    <Chip
                      key={group}
                      label={group}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            <Box display="flex" gap={1}>
              {canImpersonate && !impersonationSession && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonAdd />}
                  onClick={() => setImpersonationDialogOpen(true)}
                >
                  Impersonate User
                </Button>
              )}
              
              {(currentUser.is_superuser || currentUser.is_staff) && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Security />}
                  onClick={() => setRoleDialogOpen(true)}
                >
                  Switch Role
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Permissions & Capabilities */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Permissions
          </Typography>
          
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  {currentUser.is_active ? <Check color="success" /> : <Warning color="error" />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Account Status"
                secondary={currentUser.is_active ? 'Active' : 'Inactive'}
              />
            </ListItem>

            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  {currentUser.is_staff ? <Check color="success" /> : <Info color="info" />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Staff Access"
                secondary={currentUser.is_staff ? 'Can access admin functions' : 'Standard user access'}
              />
            </ListItem>

            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  {currentUser.is_superuser ? <Check color="success" /> : <Info color="info" />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Superuser Access"
                secondary={currentUser.is_superuser ? 'Full system access' : 'Limited by role permissions'}
              />
            </ListItem>

            {canImpersonate && (
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <PersonAdd color="primary" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Impersonation"
                  secondary="Can impersonate other users for support purposes"
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Impersonation Dialog */}
      <Dialog
        open={impersonationDialogOpen}
        onClose={() => setImpersonationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Impersonate User
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Security Notice:</strong> User impersonation is logged and monitored.
              Only use this feature for legitimate support purposes.
            </Typography>
          </Alert>

          <Autocomplete
            options={availableUsers}
            getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select User to Impersonate"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />

          <TextField
            label="Reason for Impersonation"
            value={impersonationReason}
            onChange={(e) => setImpersonationReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="e.g., Troubleshooting user account issue, Assisting with technical problem..."
            required
          />

          {selectedUser && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Target User Details:
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <Avatar sx={{ mr: 2 }}>
                  {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedUser.email}
                  </Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={getCurrentRoleType(selectedUser).toUpperCase()}
                      color={getRoleColor(getCurrentRoleType(selectedUser)) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImpersonationDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStartImpersonation}
            variant="contained"
            disabled={!selectedUser || !impersonationReason.trim() || isProcessing}
          >
            {isProcessing ? 'Starting...' : 'Start Impersonation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Switch Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Switch Role
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Temporarily switch to a different role to test permissions or access levels.
              You can switch back at any time.
            </Typography>
          </Alert>

          <FormControl fullWidth>
            <InputLabel>Select Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'user' | 'staff' | 'admin')}
              label="Select Role"
            >
              <MenuItem value="user">
                <Box display="flex" alignItems="center">
                  <Person sx={{ mr: 1 }} />
                  User (Standard Access)
                </Box>
              </MenuItem>
              <MenuItem value="staff" disabled={!currentUser.is_staff}>
                <Box display="flex" alignItems="center">
                  <SupervisorAccount sx={{ mr: 1 }} />
                  Staff (Admin Functions)
                </Box>
              </MenuItem>
              <MenuItem value="admin" disabled={!currentUser.is_superuser}>
                <Box display="flex" alignItems="center">
                  <AdminPanelSettings sx={{ mr: 1 }} />
                  Admin (Full Access)
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Current Role: {currentRole.toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Switching to: {selectedRole.toUpperCase()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRoleSwitch}
            variant="contained"
            disabled={selectedRole === currentRole || isProcessing}
          >
            {isProcessing ? 'Switching...' : 'Switch Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  )
}

export default RoleImpersonation