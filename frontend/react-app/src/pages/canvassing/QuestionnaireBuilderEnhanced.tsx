import React, { useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Switch,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab
} from '@mui/material'
import {
  Add,
  Delete,
  Edit,
  DragIndicator,
  Preview,
  Save,
  ExpandMore,
  ContentCopy,
  Visibility,
  Settings,
  QuestionAnswer
} from '@mui/icons-material'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getQuestionnaires,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  type Questionnaire,
  type QuestionnaireQuestion
} from '../../services/canvassing'

interface QuestionFormData {
  question_text: string
  question_type: 'text' | 'multiple_choice' | 'scale' | 'boolean' | 'date'
  options: string[]
  required: boolean
  order: number
  branch_logic?: {
    condition_value: string
    next_question_id?: string
    action: 'skip' | 'jump' | 'end'
  }
}

interface QuestionnaireFormData {
  name: string
  campaign_id: string
  questions: QuestionFormData[]
  is_active: boolean
}

const QuestionnaireBuilder: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null)
  const [previewQuestionnaire, setPreviewQuestionnaire] = useState<Questionnaire | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const queryClient = useQueryClient()

  const { control, handleSubmit, reset, watch, setValue } = useForm<QuestionnaireFormData>({
    defaultValues: {
      name: '',
      campaign_id: '',
      questions: [],
      is_active: true
    }
  })

  const { fields: questions, append, remove, move } = useFieldArray({
    control,
    name: 'questions'
  })

  // Fetch questionnaires
  const { data: questionnaires = [], isLoading, error } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: getQuestionnaires,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createQuestionnaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] })
      setCreateDialogOpen(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Questionnaire> }) =>
      updateQuestionnaire(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] })
      setEditDialogOpen(false)
      setEditingQuestionnaire(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteQuestionnaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] })
    },
  })

  const addQuestion = () => {
    append({
      question_text: '',
      question_type: 'text',
      options: [],
      required: false,
      order: questions.length
    })
  }

  const handleCreate = (data: QuestionnaireFormData) => {
    createMutation.mutate({
      ...data,
      questions: data.questions.map((q, index) => ({ ...q, order: index }))
    })
  }

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire)
    setValue('name', questionnaire.name)
    setValue('campaign_id', questionnaire.campaign_id)
    setValue('is_active', questionnaire.is_active)
    setValue('questions', questionnaire.questions.map(q => ({
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || [],
      required: q.required,
      order: q.order
    })))
    setEditDialogOpen(true)
  }

  const handleUpdate = (data: QuestionnaireFormData) => {
    if (!editingQuestionnaire) return
    updateMutation.mutate({
      id: editingQuestionnaire.id,
      data: {
        ...data,
        questions: data.questions.map((q, index) => ({ ...q, order: index }))
      }
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      deleteMutation.mutate(id)
    }
  }

  const handlePreview = (questionnaire: Questionnaire) => {
    setPreviewQuestionnaire(questionnaire)
    setPreviewDialogOpen(true)
  }

  const duplicateQuestionnaire = (questionnaire: Questionnaire) => {
    createMutation.mutate({
      ...questionnaire,
      name: `${questionnaire.name} (Copy)`,
      is_active: false
    })
  }

  const QuestionEditor = ({ index }: { index: number }) => {
    const questionType = watch(`questions.${index}.question_type`)
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">
              Question {index + 1}
            </Typography>
            <Box>
              <IconButton size="small" onClick={() => remove(index)}>
                <Delete />
              </IconButton>
              <DragIndicator sx={{ cursor: 'grab' }} />
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name={`questions.${index}.question_text`}
                control={control}
                rules={{ required: 'Question text is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Question Text"
                    fullWidth
                    multiline
                    rows={2}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name={`questions.${index}.question_type`}
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Question Type</InputLabel>
                    <Select {...field} label="Question Type">
                      <MenuItem value="text">Text Input</MenuItem>
                      <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                      <MenuItem value="scale">Rating Scale</MenuItem>
                      <MenuItem value="boolean">Yes/No</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name={`questions.${index}.required`}
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Required"
                  />
                )}
              />
            </Grid>

            {/* Options for multiple choice questions */}
            {questionType === 'multiple_choice' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Answer Options
                </Typography>
                <Controller
                  name={`questions.${index}.options`}
                  control={control}
                  render={({ field }) => (
                    <Box>
                      {field.value.map((option, optionIndex) => (
                        <Box key={optionIndex} display="flex" alignItems="center" mb={1}>
                          <TextField
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...field.value]
                              newOptions[optionIndex] = e.target.value
                              field.onChange(newOptions)
                            }}
                            label={`Option ${optionIndex + 1}`}
                            fullWidth
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              const newOptions = field.value.filter((_, i) => i !== optionIndex)
                              field.onChange(newOptions)
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => field.onChange([...field.value, ''])}
                      >
                        Add Option
                      </Button>
                    </Box>
                  )}
                />
              </Grid>
            )}

            {/* Scale configuration */}
            {questionType === 'scale' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Rating scale will be displayed as 1-5 stars or 1-10 numeric scale
                </Alert>
              </Grid>
            )}

            {/* Branch Logic */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">
                    Advanced: Branch Logic (Optional)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Set conditions to skip or jump to specific questions based on answers
                  </Typography>
                  {/* Branch logic implementation would go here */}
                  <Alert severity="info">
                    Branch logic configuration coming soon
                  </Alert>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  const QuestionnairePreview = ({ questionnaire }: { questionnaire: Questionnaire }) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {questionnaire.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Preview Mode - This is how the questionnaire will appear to volunteers
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {questionnaire.questions
        .sort((a, b) => a.order - b.order)
        .map((question, index) => (
          <Card key={question.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {index + 1}. {question.question_text}
                {question.required && (
                  <Chip label="Required" color="error" size="small" sx={{ ml: 1 }} />
                )}
              </Typography>
              
              {question.question_type === 'text' && (
                <TextField
                  placeholder="Text answer will appear here"
                  fullWidth
                  disabled
                  size="small"
                />
              )}
              
              {question.question_type === 'multiple_choice' && (
                <Box>
                  {question.options?.map((option, optionIndex) => (
                    <FormControlLabel
                      key={optionIndex}
                      control={<input type="radio" disabled />}
                      label={option}
                      sx={{ display: 'block' }}
                    />
                  ))}
                </Box>
              )}
              
              {question.question_type === 'boolean' && (
                <Box>
                  <FormControlLabel control={<input type="radio" disabled />} label="Yes" />
                  <FormControlLabel control={<input type="radio" disabled />} label="No" />
                </Box>
              )}
              
              {question.question_type === 'scale' && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Rating: 1 (Poor) to 5 (Excellent)
                  </Typography>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <FormControlLabel
                      key={rating}
                      control={<input type="radio" disabled />}
                      label={rating.toString()}
                    />
                  ))}
                </Box>
              )}
              
              {question.question_type === 'date' && (
                <TextField
                  type="date"
                  disabled
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </CardContent>
          </Card>
        ))}
    </Box>
  )

  const QuestionnaireForm = ({ onSubmit, title }: { onSubmit: (data: QuestionnaireFormData) => void; title: string }) => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ minWidth: 800, minHeight: 600 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab icon={<Settings />} label="Settings" />
          <Tab icon={<QuestionAnswer />} label="Questions" />
          <Tab icon={<Visibility />} label="Preview" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Questionnaire Name"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="campaign_id"
                  control={control}
                  rules={{ required: 'Campaign is required' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel>Campaign</InputLabel>
                      <Select {...field} label="Campaign">
                        <MenuItem value="1">City Council Race 2024</MenuItem>
                        <MenuItem value="2">Mayor Campaign</MenuItem>
                        <MenuItem value="3">School Board Election</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active (volunteers can use this questionnaire)"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Questions ({questions.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={addQuestion}
              >
                Add Question
              </Button>
            </Box>

            {questions.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No questions yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Add your first question to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={addQuestion}
                >
                  Add First Question
                </Button>
              </Paper>
            ) : (
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {questions.map((_, index) => (
                  <QuestionEditor key={index} index={index} />
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              This is how your questionnaire will appear to volunteers during canvassing
            </Alert>
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              <QuestionnairePreview 
                questionnaire={{
                  id: 'preview',
                  name: watch('name') || 'Untitled Questionnaire',
                  campaign_id: watch('campaign_id'),
                  created_by: { id: '1', email: 'user@example.com' },
                  questions: questions.map((q, index) => ({
                    id: `preview-${index}`,
                    question_text: q.question_text || `Question ${index + 1}`,
                    question_type: q.question_type,
                    options: q.options,
                    required: q.required,
                    order: index
                  })),
                  is_active: watch('is_active'),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }} 
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          reset()
        }}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained"
          disabled={questions.length === 0}
          startIcon={<Save />}
        >
          {title.includes('Create') ? 'Create' : 'Update'} Questionnaire
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
          Failed to load questionnaires. Please try again later.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Questionnaire Builder
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Questionnaire
        </Button>
      </Box>

      {/* Questionnaires List */}
      <Grid container spacing={3}>
        {questionnaires.map((questionnaire) => (
          <Grid item xs={12} md={6} lg={4} key={questionnaire.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">
                    {questionnaire.name}
                  </Typography>
                  <Chip
                    label={questionnaire.is_active ? 'Active' : 'Inactive'}
                    color={questionnaire.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {questionnaire.questions.length} questions
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(questionnaire.created_at).toLocaleDateString()}
                </Typography>

                <Box display="flex" gap={1} mt={2}>
                  <IconButton size="small" onClick={() => handlePreview(questionnaire)}>
                    <Visibility />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEdit(questionnaire)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => duplicateQuestionnaire(questionnaire)}>
                    <ContentCopy />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDelete(questionnaire.id)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {questionnaires.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <QuestionAnswer sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Questionnaires Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Create your first questionnaire to start collecting responses during canvassing
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Questionnaire
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <QuestionnaireForm onSubmit={handleCreate} title="Create Questionnaire" />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <QuestionnaireForm onSubmit={handleUpdate} title="Edit Questionnaire" />
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Questionnaire Preview
        </DialogTitle>
        <DialogContent>
          {previewQuestionnaire && (
            <QuestionnairePreview questionnaire={previewQuestionnaire} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default QuestionnaireBuilder