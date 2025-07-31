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
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  DragIndicator,
  Preview,
  Save,
  QuestionAnswer
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import {
  getQuestionnaires,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  type Questionnaire,
  type QuestionnaireQuestion
} from '../../services/canvassing'

interface QuestionnaireFormData {
  name: string
  campaign_id: string
  questions: QuestionnaireQuestion[]
  is_active: boolean
}

interface QuestionFormData {
  question_text: string
  question_type: 'text' | 'multiple_choice' | 'scale' | 'boolean' | 'date'
  options: string[]
  required: boolean
}

const QuestionnaireBuilder: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null)
  const [previewQuestionnaire, setPreviewQuestionnaire] = useState<Questionnaire | null>(null)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number>(-1)
  const queryClient = useQueryClient()

  const { control, handleSubmit, reset, setValue, watch } = useForm<QuestionnaireFormData>({
    defaultValues: {
      name: '',
      campaign_id: '',
      questions: [],
      is_active: true
    }
  })

  const { fields: questions, append: addQuestion, remove: removeQuestion, update: updateQuestion } = useFieldArray({
    control,
    name: 'questions'
  })

  const { control: questionControl, handleSubmit: handleQuestionSubmit, reset: resetQuestion } = useForm<QuestionFormData>({
    defaultValues: {
      question_text: '',
      question_type: 'text',
      options: [],
      required: false
    }
  })

  // Mock data for campaigns
  const campaigns = [
    { id: '1', name: 'City Council Race 2024' },
    { id: '2', name: 'Mayor Campaign' },
    { id: '3', name: 'School Board Election' }
  ]

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

  const handleCreate = (data: QuestionnaireFormData) => {
    createMutation.mutate(data)
  }

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire)
    setValue('name', questionnaire.name)
    setValue('campaign_id', questionnaire.campaign_id)
    setValue('questions', questionnaire.questions)
    setValue('is_active', questionnaire.is_active)
    setEditDialogOpen(true)
  }

  const handleUpdate = (data: QuestionnaireFormData) => {
    if (!editingQuestionnaire) return
    updateMutation.mutate({
      id: editingQuestionnaire.id,
      data
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleAddQuestion = () => {
    resetQuestion()
    setEditingQuestionIndex(-1)
    setQuestionDialogOpen(true)
  }

  const handleEditQuestion = (index: number) => {
    const question = questions[index]
    resetQuestion({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [],
      required: question.required
    })
    setEditingQuestionIndex(index)
    setQuestionDialogOpen(true)
  }

  const handleSaveQuestion = (data: QuestionFormData) => {
    const question: QuestionnaireQuestion = {
      id: editingQuestionIndex >= 0 ? questions[editingQuestionIndex].id : `q_${Date.now()}`,
      question_text: data.question_text,
      question_type: data.question_type,
      options: data.question_type === 'multiple_choice' ? data.options : undefined,
      required: data.required,
      order: editingQuestionIndex >= 0 ? questions[editingQuestionIndex].order : questions.length
    }

    if (editingQuestionIndex >= 0) {
      updateQuestion(editingQuestionIndex, question)
    } else {
      addQuestion(question)
    }

    setQuestionDialogOpen(false)
    resetQuestion()
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝'
      case 'multiple_choice':
        return '📋'
      case 'scale':
        return '📊'
      case 'boolean':
        return '✓/✗'
      case 'date':
        return '📅'
      default:
        return '❓'
    }
  }

  const QuestionForm = () => (
    <form onSubmit={handleQuestionSubmit(handleSaveQuestion)}>
      <DialogTitle>
        {editingQuestionIndex >= 0 ? 'Edit Question' : 'Add Question'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Controller
              name="question_text"
              control={questionControl}
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
              name="question_type"
              control={questionControl}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Question Type</InputLabel>
                  <Select {...field} label="Question Type">
                    <MenuItem value="text">Text Input</MenuItem>
                    <MenuItem value="multiple_choice">Multiple Choice</MenuItem>
                    <MenuItem value="scale">Scale (1-10)</MenuItem>
                    <MenuItem value="boolean">Yes/No</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="required"
              control={questionControl}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Required"
                />
              )}
            />
          </Grid>

          {watch('question_type') === 'multiple_choice' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Answer Options (one per line)
              </Typography>
              <Controller
                name="options"
                control={questionControl}
                render={({ field }) => (
                  <TextField
                    value={field.value.join('\n')}
                    onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                    label="Options"
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                )}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setQuestionDialogOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          {editingQuestionIndex >= 0 ? 'Update' : 'Add'} Question
        </Button>
      </DialogActions>
    </form>
  )

  const QuestionnairePreview = ({ questionnaire }: { questionnaire: Questionnaire }) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {questionnaire.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Preview how this questionnaire will appear to volunteers
      </Typography>
      
      <Divider sx={{ my: 2 }} />

      {questionnaire.questions.map((question, index) => (
        <Box key={question.id} mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            {index + 1}. {question.question_text}
            {question.required && <Typography component="span" color="error"> *</Typography>}
          </Typography>

          {question.question_type === 'text' && (
            <TextField
              fullWidth
              disabled
              placeholder="Text input field"
              variant="outlined"
              size="small"
            />
          )}

          {question.question_type === 'multiple_choice' && (
            <Box>
              {question.options?.map((option, optIndex) => (
                <Box key={optIndex} display="flex" alignItems="center" mb={1}>
                  <input type="radio" disabled style={{ marginRight: 8 }} />
                  <Typography variant="body2">{option}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {question.question_type === 'boolean' && (
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <input type="radio" disabled style={{ marginRight: 8 }} />
                <Typography variant="body2">Yes</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <input type="radio" disabled style={{ marginRight: 8 }} />
                <Typography variant="body2">No</Typography>
              </Box>
            </Box>
          )}

          {question.question_type === 'scale' && (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">1</Typography>
              <input type="range" min="1" max="10" disabled style={{ flex: 1 }} />
              <Typography variant="body2">10</Typography>
            </Box>
          )}

          {question.question_type === 'date' && (
            <TextField
              type="date"
              disabled
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          )}
        </Box>
      ))}
    </Box>
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

      {/* Questionnaires Grid */}
      <Grid container spacing={3}>
        {questionnaires.map((questionnaire) => (
          <Grid item xs={12} md={6} lg={4} key={questionnaire.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" gutterBottom>
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

                <Box display="flex" gap={1} mt={2}>
                  <Button
                    size="small"
                    startIcon={<Preview />}
                    onClick={() => {
                      setPreviewQuestionnaire(questionnaire)
                      setPreviewDialogOpen(true)
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(questionnaire)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(questionnaire.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialogOpen || editDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          reset()
        }}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(createDialogOpen ? handleCreate : handleUpdate)}>
          <DialogTitle>
            {createDialogOpen ? 'Create Questionnaire' : 'Edit Questionnaire'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Questions ({questions.length})
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddQuestion}
                  >
                    Add Question
                  </Button>
                </Box>

                <List>
                  {questions.map((question, index) => (
                    <React.Fragment key={question.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <span>{getQuestionTypeIcon(question.question_type)}</span>
                              <Typography variant="body1">
                                {question.question_text}
                              </Typography>
                              {question.required && (
                                <Chip label="Required" size="small" color="primary" />
                              )}
                            </Box>
                          }
                          secondary={`Type: ${question.question_type.replace('_', ' ')}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleEditQuestion(index)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeQuestion(index)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < questions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
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
            <Button type="submit" variant="contained" startIcon={<Save />}>
              {createDialogOpen ? 'Create' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Question Dialog */}
      <Dialog 
        open={questionDialogOpen} 
        onClose={() => setQuestionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <QuestionForm />
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Questionnaire Preview</DialogTitle>
        <DialogContent>
          {previewQuestionnaire && <QuestionnairePreview questionnaire={previewQuestionnaire} />}
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