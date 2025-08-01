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
  FormControlLabel,
  Switch
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  People,
  Assignment,
  CheckCircle,
  Schedule,
  Cancel,
  PlayArrow
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import {
  getWalkLists,
  createWalkList,
  updateWalkList,
  deleteWalkList,
  type WalkList
} from '../../services/canvassing'

interface WalkListFormData {
  name: string
  campaign_id: string
  volunteer_id: string
  voter_ids: string[]
  target_date: string
  notes: string
  require_gps_verification: boolean
  max_distance_meters: number
}

const WalkListManager: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingWalkList, setEditingWalkList] = useState<WalkList | null>(null)
  const queryClient = useQueryClient()

  const { control, handleSubmit, reset, setValue, watch } = useForm<WalkListFormData>({
    defaultValues: {
      name: '',
      campaign_id: '',
      volunteer_id: '',
      voter_ids: [],
      target_date: '',
      notes: '',
      require_gps_verification: true,
      max_distance_meters: 1609 // 1 mile in meters
    }
  })

  // Fetch data
  const { data: walkLists = [], isLoading, error } = useQuery({
    queryKey: ['walk-lists'],
    queryFn: getWalkLists,
  })

  // Mock data for volunteers and campaigns (you would fetch this from API)
  const volunteers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }
  ]

  const campaigns = [
    { id: '1', name: 'City Council Race 2024' },
    { id: '2', name: 'Mayor Campaign' },
    { id: '3', name: 'School Board Election' }
  ]

  // Mutations
  const createMutation = useMutation({
    mutationFn: createWalkList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk-lists'] })
      setCreateDialogOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WalkList> }) => 
      updateWalkList(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk-lists'] })
      setEditDialogOpen(false)
      setEditingWalkList(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWalkList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk-lists'] })
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />
      case 'in_progress':
        return <PlayArrow color="info" />
      case 'assigned':
        return <Schedule color="warning" />
      case 'cancelled':
        return <Cancel color="error" />
      default:
        return <Assignment />
    }
  }

  const getStatusColor = (status: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'info'
      case 'assigned':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const handleCreate = (data: WalkListFormData) => {
    createMutation.mutate({
      ...data,
      target_date: data.target_date || null,
    })
  }

  const handleEdit = (walkList: WalkList) => {
    setEditingWalkList(walkList)
    setValue('name', walkList.name)
    setValue('campaign_id', walkList.campaign_id)
    setValue('volunteer_id', walkList.volunteer.id)
    setValue('target_date', walkList.target_date || '')
    setValue('notes', walkList.notes)
    setValue('require_gps_verification', walkList.require_gps_verification)
    setValue('max_distance_meters', walkList.max_distance_meters)
    setEditDialogOpen(true)
  }

  const handleUpdate = (data: WalkListFormData) => {
    if (!editingWalkList) return
    
    updateMutation.mutate({
      id: editingWalkList.id,
      data: {
        ...data,
        target_date: data.target_date || null,
      }
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this walk list?')) {
      deleteMutation.mutate(id)
    }
  }

  const WalkListForm = ({ onSubmit, title }: { onSubmit: (data: WalkListFormData) => void; title: string }) => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Walk List Name"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="campaign_id"
              control={control}
              rules={{ required: 'Campaign is required' }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel>Campaign</InputLabel>
                  <Select {...field} label="Campaign">
                    {campaigns.map((campaign) => (
                      <MenuItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="volunteer_id"
              control={control}
              rules={{ required: 'Volunteer is required' }}
              render={({ field, fieldState }) => (
                <FormControl fullWidth error={!!fieldState.error}>
                  <InputLabel>Volunteer</InputLabel>
                  <Select {...field} label="Volunteer">
                    {volunteers.map((volunteer) => (
                      <MenuItem key={volunteer.id} value={volunteer.id}>
                        {volunteer.name} ({volunteer.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="target_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Target Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="max_distance_meters"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Max GPS Distance (meters)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="require_gps_verification"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Require GPS Verification"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                />
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
          {title.includes('Create') ? 'Create' : 'Update'}
        </Button>
      </DialogActions>
    </form>
  )

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
          Failed to load walk lists. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Walk List Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Walk List
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Walk Lists
                  </Typography>
                  <Typography variant="h5">
                    {walkLists.length}
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
                <Schedule color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Assigned
                  </Typography>
                  <Typography variant="h5">
                    {walkLists.filter(w => w.status === 'assigned').length}
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
                <PlayArrow color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    In Progress
                  </Typography>
                  <Typography variant="h5">
                    {walkLists.filter(w => w.status === 'in_progress').length}
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
                    Completed
                  </Typography>
                  <Typography variant="h5">
                    {walkLists.filter(w => w.status === 'completed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Walk Lists Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Walk Lists
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Volunteer</TableCell>
                  <TableCell>Target Date</TableCell>
                  <TableCell>Voters</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>GPS Required</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {walkLists.map((walkList) => (
                  <TableRow key={walkList.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(walkList.status)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {walkList.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {walkList.volunteer.first_name} {walkList.volunteer.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {walkList.volunteer.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {walkList.target_date 
                        ? format(new Date(walkList.target_date), 'MMM dd, yyyy')
                        : 'No date set'
                      }
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <People sx={{ mr: 0.5, fontSize: 16 }} />
                        {walkList.voter_ids.length}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={walkList.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(walkList.status)}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={walkList.require_gps_verification ? 'Required' : 'Optional'} 
                        color={walkList.require_gps_verification ? 'primary' : 'default'}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(walkList)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(walkList.id)}
                      >
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

      {/* Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <WalkListForm onSubmit={handleCreate} title="Create Walk List" />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <WalkListForm onSubmit={handleUpdate} title="Edit Walk List" />
      </Dialog>
    </Container>
  )
}

export default WalkListManager