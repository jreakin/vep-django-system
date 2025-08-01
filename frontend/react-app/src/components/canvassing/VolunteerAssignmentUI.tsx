import React, { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  DragIndicator,
  Assignment,
  Person,
  CheckCircle,
  Cancel,
  Refresh,
  SwapHoriz
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWalkLists,
  getAvailableVolunteers,
  getVolunteerAssignments,
  assignVolunteerToWalkList,
  reassignWalkList,
  bulkAssignVolunteers,
  type WalkList,
  type VolunteerAssignment
} from '../../services/canvassing'

interface DraggedItem {
  type: 'volunteer' | 'assignment'
  data: any
}

const VolunteerAssignmentUI: React.FC = () => {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null)
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
  const [selectedWalkList, setSelectedWalkList] = useState<WalkList | null>(null)
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkSelections, setBulkSelections] = useState<Array<{walk_list_id: string, volunteer_id: string}>>([])
  
  const queryClient = useQueryClient()

  // Fetch data
  const { data: walkLists = [], isLoading: walkListsLoading } = useQuery({
    queryKey: ['walk-lists'],
    queryFn: getWalkLists,
  })

  const { data: volunteers = [], isLoading: volunteersLoading } = useQuery({
    queryKey: ['available-volunteers'],
    queryFn: getAvailableVolunteers,
  })

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['volunteer-assignments'],
    queryFn: getVolunteerAssignments,
  })

  // Mutations
  const assignMutation = useMutation({
    mutationFn: ({ walkListId, volunteerId }: { walkListId: string, volunteerId: string }) =>
      assignVolunteerToWalkList(walkListId, volunteerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['walk-lists'] })
      setAssignmentDialogOpen(false)
      setSelectedWalkList(null)
      setSelectedVolunteer('')
    },
  })

  const reassignMutation = useMutation({
    mutationFn: ({ assignmentId, newVolunteerId }: { assignmentId: string, newVolunteerId: string }) =>
      reassignWalkList(assignmentId, newVolunteerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-assignments'] })
    },
  })

  const bulkAssignMutation = useMutation({
    mutationFn: bulkAssignVolunteers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['walk-lists'] })
      setBulkSelections([])
      setBulkMode(false)
    },
  })

  // Get assignment for walk list
  const getAssignmentForWalkList = (walkListId: string) => {
    return assignments.find(assignment => assignment.walk_list === walkListId)
  }

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: DraggedItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetWalkList: WalkList) => {
    e.preventDefault()
    
    if (!draggedItem) return

    if (draggedItem.type === 'volunteer') {
      // Assign volunteer to walk list
      const volunteerId = draggedItem.data.id
      assignMutation.mutate({ walkListId: targetWalkList.id, volunteerId })
    } else if (draggedItem.type === 'assignment') {
      // Reassign from one walk list to another
      const assignment = draggedItem.data as VolunteerAssignment
      if (assignment.walk_list !== targetWalkList.id) {
        reassignMutation.mutate({ 
          assignmentId: assignment.id, 
          newVolunteerId: assignment.volunteer.id 
        })
      }
    }

    setDraggedItem(null)
  }, [draggedItem, assignMutation, reassignMutation])

  const handleAssignManually = (walkList: WalkList) => {
    setSelectedWalkList(walkList)
    setAssignmentDialogOpen(true)
  }

  const handleConfirmAssignment = () => {
    if (selectedWalkList && selectedVolunteer) {
      assignMutation.mutate({ 
        walkListId: selectedWalkList.id, 
        volunteerId: selectedVolunteer 
      })
    }
  }

  const handleBulkAssign = () => {
    if (bulkSelections.length > 0) {
      bulkAssignMutation.mutate(bulkSelections)
    }
  }

  const addToBulkSelection = (walkListId: string, volunteerId: string) => {
    setBulkSelections(prev => [
      ...prev.filter(item => item.walk_list_id !== walkListId),
      { walk_list_id: walkListId, volunteer_id: volunteerId }
    ])
  }

  const removeFromBulkSelection = (walkListId: string) => {
    setBulkSelections(prev => prev.filter(item => item.walk_list_id !== walkListId))
  }

  const getBulkSelectionForWalkList = (walkListId: string) => {
    return bulkSelections.find(item => item.walk_list_id === walkListId)
  }

  if (walkListsLoading || volunteersLoading || assignmentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5">
          Volunteer Assignment
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant={bulkMode ? "contained" : "outlined"}
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
          </Button>
          {bulkMode && bulkSelections.length > 0 && (
            <Button
              variant="contained"
              onClick={handleBulkAssign}
              disabled={bulkAssignMutation.isPending}
            >
              Assign {bulkSelections.length} Items
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Instructions:</strong><br />
          • Drag volunteers from the Available Volunteers panel to walk lists<br />
          • Click the assignment button on walk lists for manual selection<br />
          • Use bulk mode to assign multiple volunteers at once<br />
          • Drag assignments between walk lists to reassign volunteers
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Available Volunteers */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Volunteers ({volunteers.length})
              </Typography>
              <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                {volunteers.map((volunteer) => (
                  <Card
                    key={volunteer.id}
                    sx={{ 
                      mb: 2, 
                      cursor: 'grab',
                      '&:hover': { backgroundColor: 'action.hover' },
                      '&:active': { cursor: 'grabbing' }
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { type: 'volunteer', data: volunteer })}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <DragIndicator color="action" />
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {volunteer.first_name?.[0]}{volunteer.last_name?.[0]}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {volunteer.first_name} {volunteer.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {volunteer.email}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Walk Lists */}
        <Grid xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Walk Lists ({walkLists.length})
          </Typography>
          <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
            {walkLists.map((walkList) => {
              const assignment = getAssignmentForWalkList(walkList.id)
              const bulkSelection = getBulkSelectionForWalkList(walkList.id)
              
              return (
                <Card
                  key={walkList.id}
                  sx={{ 
                    mb: 2,
                    border: draggedItem ? '2px dashed #ccc' : 'none',
                    backgroundColor: assignment ? 'success.light' : 'background.paper'
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, walkList)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {walkList.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {walkList.voter_ids.length} voters • Target: {walkList.target_date || 'No date set'}
                        </Typography>
                        
                        {/* Current Assignment */}
                        {assignment ? (
                          <Box
                            draggable
                            onDragStart={(e) => handleDragStart(e, { type: 'assignment', data: assignment })}
                            sx={{ 
                              cursor: 'grab',
                              '&:active': { cursor: 'grabbing' }
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1} mt={1}>
                              <DragIndicator fontSize="small" />
                              <Avatar sx={{ width: 24, height: 24 }}>
                                {assignment.volunteer.first_name?.[0]}{assignment.volunteer.last_name?.[0]}
                              </Avatar>
                              <Typography variant="body2">
                                {assignment.volunteer.first_name} {assignment.volunteer.last_name}
                              </Typography>
                              <Chip
                                label={assignment.status}
                                color={assignment.status === 'completed' ? 'success' : 'default'}
                                size="small"
                              />
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No volunteer assigned
                          </Typography>
                        )}

                        {/* Bulk Mode Selection */}
                        {bulkMode && (
                          <Box mt={2}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                              <InputLabel>Select Volunteer</InputLabel>
                              <Select
                                value={bulkSelection?.volunteer_id || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    addToBulkSelection(walkList.id, e.target.value)
                                  } else {
                                    removeFromBulkSelection(walkList.id)
                                  }
                                }}
                                label="Select Volunteer"
                              >
                                <MenuItem value="">
                                  <em>None</em>
                                </MenuItem>
                                {volunteers.map((volunteer) => (
                                  <MenuItem key={volunteer.id} value={volunteer.id}>
                                    {volunteer.first_name} {volunteer.last_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        )}
                      </Box>

                      {/* Actions */}
                      {!bulkMode && (
                        <Box display="flex" gap={1}>
                          <Tooltip title="Assign Volunteer">
                            <IconButton
                              size="small"
                              onClick={() => handleAssignManually(walkList)}
                              disabled={assignMutation.isPending}
                            >
                              <Assignment />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Grid>
      </Grid>

      {/* Manual Assignment Dialog */}
      <Dialog
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Volunteer to {selectedWalkList?.name}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Volunteer</InputLabel>
            <Select
              value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)}
              label="Select Volunteer"
            >
              {volunteers.map((volunteer) => (
                <MenuItem key={volunteer.id} value={volunteer.id}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {volunteer.first_name?.[0]}{volunteer.last_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {volunteer.first_name} {volunteer.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {volunteer.email}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAssignment}
            variant="contained"
            disabled={!selectedVolunteer || assignMutation.isPending}
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VolunteerAssignmentUI