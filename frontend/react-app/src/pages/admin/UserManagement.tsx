import React, { useState } from 'react'
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  FormControlLabel,
  Switch,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem as MenuItemComponent
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
  SupervisorAccount,
  AdminPanelSettings,
  Download,
  MoreVert,
  VpnKey,
  Block,
  CheckCircle,
  Security
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import {
  getUsers,
  getUserGroups,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  resetUserPassword,
  getSystemStats,
  exportUsers,
  type User,
  type UserGroup,
  type CreateUserData,
  type SystemStats
} from '../../services/admin'

interface UserFormData {
  email: string
  first_name: string
  last_name: string
  username: string
  password?: string
  groups: string[]
  is_staff: boolean
  is_superuser: boolean
  profile?: {
    phone_number: string
    organization: string
    role: string
    timezone: string
  }
}

const UserManagement: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { control, handleSubmit, reset, setValue } = useForm<UserFormData>({
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      username: '',
      password: '',
      groups: [],
      is_staff: false,
      is_superuser: false,
      profile: {
        phone_number: '',
        organization: '',
        role: '',
        timezone: 'America/New_York'
      }
    }
  })

  // Available timezones
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Pacific/Honolulu'
  ]

  // Fetch data
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['user-groups'],
    queryFn: getUserGroups,
  })

  const { data: systemStats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: getSystemStats,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['system-stats'] })
      setCreateDialogOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditDialogOpen(false)
      setEditingUser(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['system-stats'] })
    },
  })

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: (result) => {
      alert(`Password reset successfully. Temporary password: ${result.temporary_password}`)
    },
  })

  const getUserRoleIcon = (user: User) => {
    if (user.is_superuser) return <AdminPanelSettings color="error" />
    if (user.is_staff) return <SupervisorAccount color="warning" />
    return <PersonAdd color="primary" />
  }

  const getUserRoleLabel = (user: User) => {
    if (user.is_superuser) return 'Superuser'
    if (user.is_staff) return 'Staff'
    return 'User'
  }

  const getUserRoleColor = (user: User): "error" | "warning" | "primary" => {
    if (user.is_superuser) return 'error'
    if (user.is_staff) return 'warning'
    return 'primary'
  }

  const handleCreate = (data: UserFormData) => {
    const createData: CreateUserData = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
      password: data.password || '',
      groups: data.groups,
      is_staff: data.is_staff,
      is_superuser: data.is_superuser,
      profile: data.profile
    }
    createMutation.mutate(createData)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setValue('email', user.email)
    setValue('first_name', user.first_name)
    setValue('last_name', user.last_name)
    setValue('username', user.username)
    setValue('groups', user.groups.map(g => g.id))
    setValue('is_staff', user.is_staff)
    setValue('is_superuser', user.is_superuser)
    if (user.profile) {
      setValue('profile.phone_number', user.profile.phone_number)
      setValue('profile.organization', user.profile.organization)
      setValue('profile.role', user.profile.role)
      setValue('profile.timezone', user.profile.timezone)
    }
    setEditDialogOpen(true)
  }

  const handleUpdate = (data: UserFormData) => {
    if (!editingUser) return
    
    const updateData = {
      ...data,
      groups: data.groups.map(groupId => ({ id: groupId }))
    }
    
    updateMutation.mutate({
      id: editingUser.id,
      data: updateData
    })
  }

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      deleteMutation.mutate(user.id)
    }
    handleMenuClose()
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedUser(null)
  }

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleExportUsers = async () => {
    try {
      const url = await exportUsers('csv')
      const a = document.createElement('a')
      a.href = url
      a.download = 'users.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const UserForm = ({ onSubmit, title, isEdit = false }: { 
    onSubmit: (data: UserFormData) => void; 
    title: string;
    isEdit?: boolean;
  }) => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="first_name"
              control={control}
              rules={{ required: 'First name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="First Name"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="last_name"
              control={control}
              rules={{ required: 'Last name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="username"
              control={control}
              rules={{ required: 'Username is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Username"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="email"
              control={control}
              rules={{ 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          {!isEdit && (
            <Grid item xs={12}>
              <Controller
                name="password"
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type="password"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Controller
              name="groups"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Groups</InputLabel>
                  <Select
                    {...field}
                    multiple
                    label="Groups"
                    renderValue={(selected) => 
                      groups
                        .filter(g => (selected as string[]).includes(g.id))
                        .map(g => g.name)
                        .join(', ')
                    }
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        <Checkbox checked={(field.value as string[]).includes(group.id)} />
                        <ListItemText primary={group.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="is_staff"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Staff User"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="is_superuser"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Superuser"
                />
              )}
            />
          </Grid>

          {/* Profile Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="profile.phone_number"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone Number"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="profile.organization"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Organization"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="profile.role"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Role"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="profile.timezone"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select {...field} label="Timezone">
                    {timezones.map((tz) => (
                      <MenuItem key={tz} value={tz}>
                        {tz}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          reset()
        }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </DialogActions>
    </form>
  )

  if (usersLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (usersError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load users. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          User Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportUsers}
          >
            Export Users
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create User
          </Button>
        </Box>
      </Box>

      {/* System Stats */}
      {systemStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <PersonAdd color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h5">
                      {systemStats.total_users}
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
                      Active Users
                    </Typography>
                    <Typography variant="h5">
                      {systemStats.active_users}
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
                  <SupervisorAccount color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Staff Users
                    </Typography>
                    <Typography variant="h5">
                      {systemStats.staff_users}
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
                  <AdminPanelSettings color="error" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Superusers
                    </Typography>
                    <Typography variant="h5">
                      {systemStats.superusers}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected.
          <Button sx={{ ml: 2 }}>Bulk Activate</Button>
          <Button sx={{ ml: 1 }}>Bulk Deactivate</Button>
          <Button sx={{ ml: 1 }}>Assign Group</Button>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Users
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.length === users.length}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      onChange={handleSelectAllUsers}
                    />
                  </TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Groups</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleToggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getUserRoleIcon(user)}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getUserRoleLabel(user)} 
                        color={getUserRoleColor(user)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {user.groups.length > 0 ? (
                        <Box>
                          {user.groups.slice(0, 2).map((group) => (
                            <Chip 
                              key={group.id}
                              label={group.name} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {user.groups.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{user.groups.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No groups
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.is_active ? 'Active' : 'Inactive'} 
                        color={user.is_active ? 'success' : 'default'}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_login 
                        ? format(new Date(user.last_login), 'MMM dd, yyyy')
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.date_joined), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, user)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => selectedUser && handleEdit(selectedUser)}>
          <Edit sx={{ mr: 1 }} /> Edit User
        </MenuItemComponent>
        
        {selectedUser?.is_active ? (
          <MenuItemComponent onClick={() => selectedUser && deactivateMutation.mutate(selectedUser.id)}>
            <Block sx={{ mr: 1 }} /> Deactivate
          </MenuItemComponent>
        ) : (
          <MenuItemComponent onClick={() => selectedUser && activateMutation.mutate(selectedUser.id)}>
            <CheckCircle sx={{ mr: 1 }} /> Activate
          </MenuItemComponent>
        )}

        <MenuItemComponent onClick={() => selectedUser && resetPasswordMutation.mutate(selectedUser.id)}>
          <VpnKey sx={{ mr: 1 }} /> Reset Password
        </MenuItemComponent>

        <MenuItemComponent onClick={() => selectedUser && handleDelete(selectedUser)}>
          <Delete sx={{ mr: 1 }} color="error" /> Delete User
        </MenuItemComponent>
      </Menu>

      {/* Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <UserForm onSubmit={handleCreate} title="Create New User" />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <UserForm onSubmit={handleUpdate} title="Edit User" isEdit />
      </Dialog>
    </Container>
  )
}

export default UserManagement