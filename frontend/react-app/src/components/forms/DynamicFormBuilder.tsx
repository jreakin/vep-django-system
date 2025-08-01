import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Rating,
  Switch,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add,
  Delete,
  Edit,
  Preview,
  Save,
  ExpandMore,
} from '@mui/icons-material';

interface FormField {
  id: string;
  field_name: string;
  field_type: string;
  label: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  default_value?: string;
  options: Array<{ label: string; value: string }>;
  validation_rules: Record<string, any>;
  order: number;
  width: 'full' | 'half' | 'third';
  is_conditional: boolean;
  show_condition: Record<string, any>;
}

interface FormTemplate {
  id?: string;
  name: string;
  form_type: string;
  description?: string;
  fields: FormField[];
  validation_rules: Record<string, any>;
  styling: Record<string, any>;
  status: 'draft' | 'active' | 'inactive';
}

interface DynamicFormBuilderProps {
  initialTemplate?: FormTemplate;
  onSave: (template: FormTemplate) => void;
  onPreview: (template: FormTemplate) => void;
  mode: 'create' | 'edit' | 'view';
}

const fieldTypes = [
  { value: 'text', label: 'Text Input', category: 'Basic' },
  { value: 'textarea', label: 'Text Area', category: 'Basic' },
  { value: 'email', label: 'Email', category: 'Basic' },
  { value: 'phone', label: 'Phone Number', category: 'Basic' },
  { value: 'number', label: 'Number', category: 'Basic' },
  { value: 'date', label: 'Date', category: 'Date/Time' },
  { value: 'time', label: 'Time', category: 'Date/Time' },
  { value: 'datetime', label: 'Date & Time', category: 'Date/Time' },
  { value: 'select', label: 'Dropdown', category: 'Choice' },
  { value: 'radio', label: 'Radio Buttons', category: 'Choice' },
  { value: 'checkbox', label: 'Checkboxes', category: 'Choice' },
  { value: 'boolean', label: 'Yes/No', category: 'Choice' },
  { value: 'file', label: 'File Upload', category: 'Special' },
  { value: 'signature', label: 'Digital Signature', category: 'Special' },
  { value: 'rating', label: 'Rating Scale', category: 'Special' },
  { value: 'location', label: 'Location Picker', category: 'Special' },
  { value: 'hidden', label: 'Hidden Field', category: 'Special' },
];

const formTypes = [
  'survey',
  'registration',
  'petition',
  'volunteer_signup',
  'event_rsvp',
  'feedback',
  'custom',
];

const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  initialTemplate,
  onSave,
  onPreview,
  mode,
}) => {
  const [template, setTemplate] = useState<FormTemplate>(
    initialTemplate || {
      name: '',
      form_type: 'custom',
      description: '',
      fields: [],
      validation_rules: {},
      styling: {
        theme: 'default',
        layout: 'vertical',
      },
      status: 'draft',
    }
  );

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { control, setValue, formState: { errors } } = useForm({
    defaultValues: template,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'fields',
  });

  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createNewField = (): FormField => ({
    id: generateFieldId(),
    field_name: `field_${template.fields.length + 1}`,
    field_type: 'text',
    label: 'New Field',
    placeholder: '',
    help_text: '',
    is_required: false,
    default_value: '',
    options: [],
    validation_rules: {},
    order: template.fields.length,
    width: 'full',
    is_conditional: false,
    show_condition: {},
  });

  const handleAddField = (fieldType?: string) => {
    const newField = createNewField();
    if (fieldType) {
      newField.field_type = fieldType;
      newField.label = fieldTypes.find(ft => ft.value === fieldType)?.label || 'New Field';
    }
    setSelectedField(newField);
    setFieldDialogOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setSelectedField({ ...field });
    setFieldDialogOpen(true);
  };

  const handleSaveField = (field: FormField) => {
    if (field.id && template.fields.find(f => f.id === field.id)) {
      // Update existing field
      setTemplate(prev => ({
        ...prev,
        fields: prev.fields.map(f => f.id === field.id ? field : f),
      }));
    } else {
      // Add new field
      setTemplate(prev => ({
        ...prev,
        fields: [...prev.fields, field],
      }));
    }
    setFieldDialogOpen(false);
    setSelectedField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }));
  };

  const validateTemplate = (): string[] => {
    const errors: string[] = [];

    if (!template.name.trim()) {
      errors.push('Form name is required');
    }

    if (template.fields.length === 0) {
      errors.push('At least one field is required');
    }

    // Check for duplicate field names
    const fieldNames = template.fields.map(f => f.field_name);
    const duplicateNames = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push(`Duplicate field names: ${duplicateNames.join(', ')}`);
    }

    // Validate field configurations
    template.fields.forEach((field, index) => {
      if (!field.field_name.trim()) {
        errors.push(`Field ${index + 1}: Field name is required`);
      }
      if (!field.label.trim()) {
        errors.push(`Field ${index + 1}: Label is required`);
      }
      if (['select', 'radio', 'checkbox'].includes(field.field_type) && field.options.length === 0) {
        errors.push(`Field ${index + 1}: Options are required for ${field.field_type} fields`);
      }
    });

    return errors;
  };

  const handleSaveTemplate = () => {
    const errors = validateTemplate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onSave(template);
  };

  const handlePreviewTemplate = () => {
    const errors = validateTemplate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onPreview(template);
    setPreviewMode(true);
  };

  const renderFieldPreview = (field: FormField) => {
    const baseProps = {
      label: field.label,
      required: field.is_required,
      fullWidth: field.width === 'full',
      helperText: field.help_text,
      placeholder: field.placeholder,
    };

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
        return <TextField {...baseProps} type={field.field_type} />;
      
      case 'textarea':
        return <TextField {...baseProps} multiline rows={4} />;
      
      case 'number':
        return <TextField {...baseProps} type="number" />;
      
      case 'select':
        return (
          <FormControl fullWidth={field.width === 'full'}>
            <InputLabel>{field.label}</InputLabel>
            <Select label={field.label}>
              {field.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'radio':
        return (
          <FormControl component="fieldset">
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.is_required && '*'}
            </Typography>
            <RadioGroup>
              {field.options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      
      case 'checkbox':
        return (
          <FormControl component="fieldset">
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.is_required && '*'}
            </Typography>
            {field.options.map((option) => (
              <FormControlLabel
                key={option.value}
                control={<Checkbox />}
                label={option.label}
              />
            ))}
          </FormControl>
        );
      
      case 'boolean':
        return (
          <FormControlLabel
            control={<Switch />}
            label={field.label}
          />
        );
      
      case 'rating':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.is_required && '*'}
            </Typography>
            <Rating />
          </Box>
        );
      
      case 'file':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.is_required && '*'}
            </Typography>
            <Button variant="outlined" component="label">
              Upload File
              <input type="file" hidden />
            </Button>
          </Box>
        );
      
      default:
        return <TextField {...baseProps} />;
    }
  };

  const groupedFieldTypes = fieldTypes.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof fieldTypes>);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" gutterBottom>
              {mode === 'create' ? 'Create Form' : mode === 'edit' ? 'Edit Form' : 'View Form'}
            </Typography>
            <TextField
              label="Form Name"
              value={template.name}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              disabled={mode === 'view'}
              sx={{ mr: 2, minWidth: 300 }}
            />
            <FormControl sx={{ mr: 2, minWidth: 150 }}>
              <InputLabel>Form Type</InputLabel>
              <Select
                value={template.form_type}
                label="Form Type"
                onChange={(e) => setTemplate(prev => ({ ...prev, form_type: e.target.value }))}
                disabled={mode === 'view'}
              >
                {formTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={handlePreviewTemplate}
              disabled={mode === 'view'}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveTemplate}
              disabled={mode === 'view'}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Please fix the following errors:</Typography>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        {/* Form Builder */}
        <Grid xs={8}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Form Fields</Typography>
              {mode !== 'view' && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleAddField()}
                >
                  Add Field
                </Button>
              )}
            </Stack>

            {/* Form Fields List */}
            <div>
              {template.fields.map((field, index) => (
                <Card sx={{ mb: 2 }} key={field.id}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="subtitle1">{field.label}</Typography>
                          <Chip label={field.field_type} size="small" />
                          {field.is_required && (
                            <Chip label="Required" size="small" color="error" />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Field Name: {field.field_name}
                        </Typography>
                        {field.help_text && (
                          <Typography variant="body2" color="text.secondary">
                            Help: {field.help_text}
                          </Typography>
                        )}
                      </Box>
                      {mode !== 'view' && (
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditField(field)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteField(field.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </div>

            {template.fields.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No fields added yet. Click "Add Field" to get started.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Field Types Panel */}
        <Grid xs={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Field Types
            </Typography>
            
            {Object.entries(groupedFieldTypes).map(([category, fields]) => (
              <Accordion key={category} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2">{category}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {fields.map((fieldType) => (
                      <Button
                        key={fieldType.value}
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddField(fieldType.value)}
                        disabled={mode === 'view'}
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {fieldType.label}
                      </Button>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Field Editor Dialog */}
      <FieldEditorDialog
        field={selectedField}
        open={fieldDialogOpen}
        onClose={() => setFieldDialogOpen(false)}
        onSave={handleSaveField}
      />

      {/* Form Preview Dialog */}
      <FormPreviewDialog
        template={template}
        open={previewMode}
        onClose={() => setPreviewMode(false)}
      />
    </Box>
  );
};

// Field Editor Dialog Component
const FieldEditorDialog: React.FC<{
  field: FormField | null;
  open: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
}> = ({ field, open, onClose, onSave }) => {
  const [editingField, setEditingField] = useState<FormField | null>(null);

  useEffect(() => {
    if (field) {
      setEditingField({ ...field });
    }
  }, [field]);

  if (!editingField) return null;

  const handleSave = () => {
    onSave(editingField);
    onClose();
  };

  const addOption = () => {
    setEditingField(prev => prev ? {
      ...prev,
      options: [...prev.options, { label: '', value: '' }],
    } : null);
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    setEditingField(prev => prev ? {
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [key]: value } : opt
      ),
    } : null);
  };

  const removeOption = (index: number) => {
    setEditingField(prev => prev ? {
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    } : null);
  };

  const needsOptions = ['select', 'radio', 'checkbox'].includes(editingField.field_type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {field?.id ? 'Edit Field' : 'Add Field'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <TextField
                label="Field Name"
                value={editingField.field_name}
                onChange={(e) => setEditingField(prev => prev ? { ...prev, field_name: e.target.value } : null)}
                fullWidth
                helperText="Unique identifier for this field"
              />
            </Grid>
            <Grid xs={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={editingField.field_type}
                  label="Field Type"
                  onChange={(e) => setEditingField(prev => prev ? { ...prev, field_type: e.target.value } : null)}
                >
                  {fieldTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            label="Label"
            value={editingField.label}
            onChange={(e) => setEditingField(prev => prev ? { ...prev, label: e.target.value } : null)}
            fullWidth
          />

          <TextField
            label="Placeholder"
            value={editingField.placeholder}
            onChange={(e) => setEditingField(prev => prev ? { ...prev, placeholder: e.target.value } : null)}
            fullWidth
          />

          <TextField
            label="Help Text"
            value={editingField.help_text}
            onChange={(e) => setEditingField(prev => prev ? { ...prev, help_text: e.target.value } : null)}
            fullWidth
            multiline
            rows={2}
          />

          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editingField.is_required}
                  onChange={(e) => setEditingField(prev => prev ? { ...prev, is_required: e.target.checked } : null)}
                />
              }
              label="Required Field"
            />
            
            <FormControl>
              <InputLabel>Width</InputLabel>
              <Select
                value={editingField.width}
                label="Width"
                onChange={(e) => setEditingField(prev => prev ? { ...prev, width: e.target.value as any } : null)}
              >
                <MenuItem value="full">Full Width</MenuItem>
                <MenuItem value="half">Half Width</MenuItem>
                <MenuItem value="third">Third Width</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {needsOptions && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Options</Typography>
                <Button startIcon={<Add />} onClick={addOption}>
                  Add Option
                </Button>
              </Stack>
              
              {editingField.options.map((option, index) => (
                <Stack key={index} direction="row" spacing={2} sx={{ mb: 1 }}>
                  <TextField
                    label="Label"
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                    size="small"
                  />
                  <TextField
                    label="Value"
                    value={option.value}
                    onChange={(e) => updateOption(index, 'value', e.target.value)}
                    size="small"
                  />
                  <IconButton
                    onClick={() => removeOption(index)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Stack>
              ))}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Field
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Form Preview Dialog Component
const FormPreviewDialog: React.FC<{
  template: FormTemplate;
  open: boolean;
  onClose: () => void;
}> = ({ template, open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Form Preview: {template.name}</DialogTitle>
      <DialogContent>
        <DynamicFormRenderer template={template} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Dynamic Form Renderer Component
const DynamicFormRenderer: React.FC<{ template: FormTemplate }> = ({ template }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field: FormField) => {
    const value = formData[field.field_name] || field.default_value || '';

    const baseProps = {
      label: field.label,
      required: field.is_required,
      helperText: field.help_text,
      value,
      onChange: (e: any) => handleFieldChange(field.field_name, e.target.value),
    };

    const gridWidth = field.width === 'full' ? 12 : field.width === 'half' ? 6 : 4;

    let component;

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
        component = <TextField {...baseProps} type={field.field_type} placeholder={field.placeholder} fullWidth />;
        break;
      
      case 'textarea':
        component = <TextField {...baseProps} multiline rows={4} placeholder={field.placeholder} fullWidth />;
        break;
      
      case 'number':
        component = <TextField {...baseProps} type="number" placeholder={field.placeholder} fullWidth />;
        break;
      
      case 'select':
        component = (
          <FormControl fullWidth>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            >
              {field.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        break;
      
      case 'radio':
        component = (
          <FormControl component="fieldset">
            <Typography variant="body2" sx={{ mb: 1 }}>
              {field.label} {field.is_required && '*'}
            </Typography>
            <RadioGroup
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            >
              {field.options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
        break;
      
      case 'boolean':
        component = (
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
              />
            }
            label={field.label}
          />
        );
        break;
      
      default:
        component = <TextField {...baseProps} placeholder={field.placeholder} fullWidth />;
    }

    return (
      <Grid xs={12} sm={gridWidth} key={field.id}>
        {component}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {template.name}
      </Typography>
      {template.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {template.description}
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {template.fields
          .sort((a, b) => a.order - b.order)
          .map(renderField)}
      </Grid>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="contained" size="large">
          Submit Form
        </Button>
      </Box>
    </Box>
  );
};

export default DynamicFormBuilder;