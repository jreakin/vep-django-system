import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import {
  PersonAdd,
  Edit,
  Delete,
  MoreVert,
  Download,
  Upload,
  Security,
  Group,
  Email,
  Lock,
  LockOpen,
  AdminPanelSettings,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'
import { format } from 'date-fns'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string | null
  groups: string[]
  permissions: string[]
}

interface Group {
  id: string
  name: string
  permissions: string[]
  user_count: number
}

interface BulkAction {
  type: 'activate' | 'deactivate' | 'delete' | 'add_group' | 'remove_group' | 'change_role'
  target_value?: string
}

interface UserBulkOperationsProps {
  users: User[]
  groups: Group[]
  onUsersUpdate: (users: User[]) => void
  onBulkAction: (userIds: string[], action: BulkAction) => Promise<void>
}

const UserBulkOperations: React.FC<UserBulkOperationsProps> = ({
  users,
  groups,
  onUsersUpdate,
  onBulkAction
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<BulkAction['type']>('activate')
  const [targetValue, setTargetValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0) return

    setIsProcessing(true)
    try {
      await onBulkAction(selectedUsers, {
        type: selectedAction,
        target_value: targetValue
      })
      
      setSelectedUsers([])
      setBulkActionDialogOpen(false)
      setTargetValue('')
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportUsers = () => {
    const csvContent = [
      'Email,First Name,Last Name,Active,Staff,Superuser,Date Joined,Last Login,Groups',
      ...users.map(user => [
        user.email,
        user.first_name,
        user.last_name,
        user.is_active,
        user.is_staff,
        user.is_superuser,
        user.date_joined,
        user.last_login || '',
        user.groups.join(';')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setExportDialogOpen(false)
  }

  const getActionDescription = (action: BulkAction['type']) => {
    switch (action) {
      case 'activate':
        return 'Activate selected users'
      case 'deactivate':
        return 'Deactivate selected users'
      case 'delete':
        return 'Delete selected users (cannot be undone)'
      case 'add_group':
        return 'Add selected users to group'
      case 'remove_group':
        return 'Remove selected users from group'
      case 'change_role':
        return 'Change role for selected users'
      default:
        return ''
    }
  }

  const requiresTargetValue = (action: BulkAction['type']) => {
    return ['add_group', 'remove_group', 'change_role'].includes(action)
  }

  const getStatusChip = (user: User) => {
    if (user.is_superuser) {
      return <Chip label="Superuser" color="error" size="small" />
    }
    if (user.is_staff) {
      return <Chip label="Staff" color="warning" size="small" />
    }
    if (user.is_active) {
      return <Chip label="Active" color="success" size="small" />
    }
    return <Chip label="Inactive" color="default" size="small" />
  }

  const isAllSelected = selectedUsers.length === users.length && users.length > 0
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length

  return (
    <Box>
      {/* Bulk Actions Toolbar */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6">
                User Management
              </Typography>
              {selectedUsers.length > 0 && (
                <Chip
                  label={`${selectedUsers.length} selected`}
                  color="primary"
                  size="small"
                />
              )}
            </Box>

            <Box display="flex" gap={1}>
              {selectedUsers.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setBulkActionDialogOpen(true)}
                >
                  Bulk Actions
                </Button>
              )}
              
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
              >
                <MoreVert />
              </IconButton>
              
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                <MenuItemComponent
                  onClick={() => {
                    setExportDialogOpen(true)
                    setMenuAnchor(null)
                  }}
                >
                  <Download sx={{ mr: 1 }} />
                  Export Users
                </MenuItemComponent>
                <MenuItemComponent
                  onClick={() => {
                    setImportDialogOpen(true)
                    setMenuAnchor(null)
                  }}
                >
                  <Upload sx={{ mr: 1 }} />
                  Import Users
                </MenuItemComponent>
              </Menu>
            </Box>
          </Box>

          {selectedUsers.length > 0 && (
            <Box mt={2}>
              <Alert severity="info">
                {selectedUsers.length} user(s) selected. Use bulk actions to manage multiple users at once.
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Groups</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    selected={selectedUsers.includes(user.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.first_name} {user.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(user)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {user.groups.slice(0, 3).map((group) => (
                          <Chip
                            key={group}
                            label={group}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {user.groups.length > 3 && (
                          <Chip
                            label={`+${user.groups.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.last_login 
                          ? format(new Date(user.last_login), 'MMM dd, yyyy')
                          : 'Never'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk Actions ({selectedUsers.length} users)
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as BulkAction['type'])}
              label="Action"
            >
              <MenuItem value="activate">
                <Box display="flex" alignItems="center">
                  <LockOpen sx={{ mr: 1 }} />
                  Activate Users
                </Box>
              </MenuItem>
              <MenuItem value="deactivate">
                <Box display="flex" alignItems="center">
                  <Lock sx={{ mr: 1 }} />
                  Deactivate Users
                </Box>
              </MenuItem>
              <MenuItem value="add_group">
                <Box display="flex" alignItems="center">
                  <Group sx={{ mr: 1 }} />
                  Add to Group
                </Box>
              </MenuItem>
              <MenuItem value="remove_group">
                <Box display="flex" alignItems="center">
                  <Group sx={{ mr: 1 }} />
                  Remove from Group
                </Box>
              </MenuItem>
              <MenuItem value="change_role">
                <Box display="flex" alignItems="center">
                  <Security sx={{ mr: 1 }} />
                  Change Role
                </Box>
              </MenuItem>
              <MenuItem value="delete">
                <Box display="flex" alignItems="center">
                  <Delete sx={{ mr: 1 }} />
                  Delete Users
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {requiresTargetValue(selectedAction) && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>
                {selectedAction === 'add_group' || selectedAction === 'remove_group' 
                  ? 'Group' 
                  : 'Role'
                }
              </InputLabel>
              <Select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                label={selectedAction === 'add_group' || selectedAction === 'remove_group' 
                  ? 'Group' 
                  : 'Role'
                }
              >
                {(selectedAction === 'add_group' || selectedAction === 'remove_group') 
                  ? groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))
                  : [
                      <MenuItem key="user" value="user">User</MenuItem>,
                      <MenuItem key="staff" value="staff">Staff</MenuItem>,
                      <MenuItem key="admin" value="admin">Admin</MenuItem>
                    ]
                }
              </Select>
            </FormControl>
          )}

          <Alert severity={selectedAction === 'delete' ? 'error' : 'info'}>
            {getActionDescription(selectedAction)}
            {selectedAction === 'delete' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                This action cannot be undone. Deleted users will lose all access immediately.
              </Typography>
            )}
          </Alert>

          {selectedUsers.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Affected Users:
              </Typography>
              <List dense>
                {users
                  .filter(user => selectedUsers.includes(user.id))
                  .slice(0, 5)
                  .map((user) => (
                    <ListItem key={user.id}>
                      <ListItemText
                        primary={`${user.first_name} ${user.last_name}`}
                        secondary={user.email}
                      />
                    </ListItem>
                  ))
                }
                {selectedUsers.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${selectedUsers.length - 5} more users`}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkAction}
            variant="contained"
            color={selectedAction === 'delete' ? 'error' : 'primary'}
            disabled={isProcessing || (requiresTargetValue(selectedAction) && !targetValue)}
            startIcon={isProcessing && <CircularProgress size={20} />}
          >
            {isProcessing ? 'Processing...' : 'Apply Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Users</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Export user data to CSV format for analysis or backup purposes.
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            The export will include user details, roles, and group memberships.
            Sensitive data like passwords are not included.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExportUsers}
            variant="contained"
            startIcon={<Download />}
          >
            Export CSV
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Users</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            User import functionality coming soon. Please contact support for bulk user creation.
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            CSV format should include: Email, First Name, Last Name, Groups (semicolon separated)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserBulkOperations