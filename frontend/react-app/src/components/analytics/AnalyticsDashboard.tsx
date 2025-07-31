import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  Autocomplete,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Send,
  TrendingUp,
  BarChart,
  PieChart,
  Map as MapIcon,
  TableChart,
  Refresh,
  Add,
  Edit,
  Delete,
  Share,
  Download,
  Lightbulb,
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

interface AnalyticsQuery {
  id?: string;
  natural_language_query: string;
  query_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_data: any;
  chart_config: any;
  insights: string[];
  execution_time_ms?: number;
  created_at: string;
}

interface AnalyticsWidget {
  id: string;
  title: string;
  widget_type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  data_source: string;
  chart_config: any;
  cached_data: any;
  last_updated?: string;
}

interface AnalyticsDashboard {
  id: string;
  name: string;
  dashboard_type: string;
  widgets: AnalyticsWidget[];
  filters: Record<string, any>;
  is_public: boolean;
}

interface AnalyticsDashboardProps {
  dashboard: AnalyticsDashboard;
  onUpdateDashboard: (dashboard: AnalyticsDashboard) => void;
  onProcessQuery: (query: string) => Promise<AnalyticsQuery>;
  isEditing: boolean;
  onToggleEdit: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const queryTypes = [
  { value: 'voter_analysis', label: 'Voter Analysis' },
  { value: 'campaign_performance', label: 'Campaign Performance' },
  { value: 'geographic_analysis', label: 'Geographic Analysis' },
  { value: 'demographic_analysis', label: 'Demographic Analysis' },
  { value: 'turnout_prediction', label: 'Turnout Prediction' },
  { value: 'custom', label: 'Custom Query' },
];

const widgetTypes = [
  { value: 'bar_chart', label: 'Bar Chart', icon: <BarChart /> },
  { value: 'line_chart', label: 'Line Chart', icon: <TrendingUp /> },
  { value: 'pie_chart', label: 'Pie Chart', icon: <PieChart /> },
  { value: 'scatter_plot', label: 'Scatter Plot', icon: <BarChart /> },
  { value: 'map', label: 'Map Visualization', icon: <MapIcon /> },
  { value: 'table', label: 'Data Table', icon: <TableChart /> },
  { value: 'metric', label: 'Single Metric', icon: <TrendingUp /> },
];

const AnalyticsDashboardComponent: React.FC<AnalyticsDashboardProps> = ({
  dashboard,
  onUpdateDashboard,
  onProcessQuery,
  isEditing,
  onToggleEdit,
}) => {
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [selectedQueryType, setSelectedQueryType] = useState('custom');
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [queryResults, setQueryResults] = useState<AnalyticsQuery[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<AnalyticsWidget | null>(null);
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState<string[]>([]);

  // Sample queries for autocomplete
  const sampleQueries = [
    "Show me voter turnout by precinct",
    "What's the demographic breakdown of registered voters?",
    "How many voters have been contacted this month?",
    "Show campaign performance metrics",
    "Which areas have the highest Democratic registration?",
    "What's the age distribution of likely voters?",
    "Show volunteer activity over time",
    "Compare turnout between urban and rural areas",
  ];

  const handleProcessQuery = async () => {
    if (!currentQuery.trim()) return;

    setIsProcessingQuery(true);
    try {
      const result = await onProcessQuery(currentQuery);
      setQueryResults(prev => [result, ...prev]);
      
      // If query completed successfully, show option to add as widget
      if (result.status === 'completed' && result.chart_config) {
        const newWidget: AnalyticsWidget = {
          id: `widget_${Date.now()}`,
          title: currentQuery.slice(0, 50) + (currentQuery.length > 50 ? '...' : ''),
          widget_type: result.chart_config.type || 'bar_chart',
          position_x: 0,
          position_y: dashboard.widgets.length * 4,
          width: 6,
          height: 4,
          data_source: 'nlp_query',
          chart_config: result.chart_config,
          cached_data: result.result_data,
          last_updated: new Date().toISOString(),
        };
        
        onUpdateDashboard({
          ...dashboard,
          widgets: [...dashboard.widgets, newWidget],
        });
      }
    } catch (error) {
      console.error('Query processing failed:', error);
    } finally {
      setIsProcessingQuery(false);
      setCurrentQuery('');
      setQueryDialogOpen(false);
    }
  };

  const handleRefreshWidget = async (widgetId: string) => {
    setRefreshing(prev => [...prev, widgetId]);
    
    // Simulate API call to refresh widget data
    setTimeout(() => {
      setRefreshing(prev => prev.filter(id => id !== widgetId));
      
      // Update widget's last_updated timestamp
      const updatedWidgets = dashboard.widgets.map(widget => 
        widget.id === widgetId
          ? { ...widget, last_updated: new Date().toISOString() }
          : widget
      );
      
      onUpdateDashboard({
        ...dashboard,
        widgets: updatedWidgets,
      });
    }, 2000);
  };

  const handleDeleteWidget = (widgetId: string) => {
    const updatedWidgets = dashboard.widgets.filter(widget => widget.id !== widgetId);
    onUpdateDashboard({
      ...dashboard,
      widgets: updatedWidgets,
    });
  };

  const handleEditWidget = (widget: AnalyticsWidget) => {
    setSelectedWidget({ ...widget });
    setWidgetDialogOpen(true);
  };

  const handleSaveWidget = (widget: AnalyticsWidget) => {
    const updatedWidgets = dashboard.widgets.map(w => 
      w.id === widget.id ? widget : w
    );
    
    onUpdateDashboard({
      ...dashboard,
      widgets: updatedWidgets,
    });
    
    setWidgetDialogOpen(false);
    setSelectedWidget(null);
  };

  const renderChart = (widget: AnalyticsWidget) => {
    const { widget_type, cached_data, chart_config } = widget;
    
    if (!cached_data || !Array.isArray(cached_data)) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            No data available
          </Typography>
        </Box>
      );
    }

    switch (widget_type) {
      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={cached_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart_config?.xKey || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={chart_config?.yKey || 'value'} fill="#8884d8" />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cached_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart_config?.xKey || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={chart_config?.yKey || 'value'} 
                stroke="#8884d8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie_chart':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={cached_data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={chart_config?.valueKey || 'value'}
              >
                {cached_data.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'scatter_plot':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={cached_data}>
              <CartesianGrid />
              <XAxis dataKey={chart_config?.xKey || 'x'} />
              <YAxis dataKey={chart_config?.yKey || 'y'} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter dataKey={chart_config?.valueKey || 'value'} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'metric':
        const metricValue = cached_data[0]?.[chart_config?.valueKey || 'value'] || 0;
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold' }}>
              {typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {chart_config?.unit || ''}
            </Typography>
          </Box>
        );

      case 'table':
        return (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {Object.keys(cached_data[0] || {}).map(key => (
                    <th key={key} style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cached_data.slice(0, 10).map((row: any, index: number) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, cellIndex: number) => (
                      <td key={cellIndex} style={{ borderBottom: '1px solid #eee', padding: '8px' }}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        );

      default:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              Unsupported chart type: {widget_type}
            </Typography>
          </Box>
        );
    }
  };

  const renderWidget = (widget: AnalyticsWidget) => {
    const isRefreshing = refreshing.includes(widget.id);
    
    return (
      <Grid item xs={12} md={widget.width} key={widget.id}>
        <Card sx={{ height: widget.height * 100, position: 'relative' }}>
          <CardContent sx={{ height: '100%', pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" component="div" noWrap>
                {widget.title}
              </Typography>
              <Stack direction="row" spacing={1}>
                {widget.last_updated && (
                  <Typography variant="caption" color="text.secondary">
                    Updated: {new Date(widget.last_updated).toLocaleTimeString()}
                  </Typography>
                )}
                <IconButton
                  size="small"
                  onClick={() => handleRefreshWidget(widget.id)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
                </IconButton>
                {isEditing && (
                  <>
                    <IconButton size="small" onClick={() => handleEditWidget(widget)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteWidget(widget.id)} color="error">
                      <Delete />
                    </IconButton>
                  </>
                )}
              </Stack>
            </Stack>
            
            <Box sx={{ height: 'calc(100% - 60px)' }}>
              {renderChart(widget)}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      {/* Dashboard Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              {dashboard.name}
            </Typography>
            <Chip label={dashboard.dashboard_type} />
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Lightbulb />}
              onClick={() => setQueryDialogOpen(true)}
            >
              Ask Analytics AI
            </Button>
            <FormControlLabel
              control={<Switch checked={isEditing} onChange={onToggleEdit} />}
              label="Edit Mode"
            />
            <Button variant="outlined" startIcon={<Share />}>
              Share
            </Button>
            <Button variant="outlined" startIcon={<Download />}>
              Export
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Widgets Grid */}
      <Grid container spacing={3}>
        {dashboard.widgets.map(renderWidget)}
        
        {isEditing && (
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: 400, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'grey.300',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                }
              }}
              onClick={() => setWidgetDialogOpen(true)}
            >
              <Stack alignItems="center" spacing={2}>
                <Add sx={{ fontSize: 48, color: 'grey.400' }} />
                <Typography variant="h6" color="text.secondary">
                  Add Widget
                </Typography>
              </Stack>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Recent Query Results */}
      {queryResults.length > 0 && (
        <Paper elevation={2} sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Query Results
          </Typography>
          <Stack spacing={2}>
            {queryResults.slice(0, 3).map((query) => (
              <Card key={query.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {query.natural_language_query}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip label={query.query_type} size="small" />
                        <Chip 
                          label={query.status} 
                          size="small" 
                          color={query.status === 'completed' ? 'success' : query.status === 'failed' ? 'error' : 'default'}
                        />
                        {query.execution_time_ms && (
                          <Chip label={`${query.execution_time_ms}ms`} size="small" variant="outlined" />
                        )}
                      </Stack>
                      {query.insights.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Key Insights:
                          </Typography>
                          {query.insights.slice(0, 2).map((insight, index) => (
                            <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                              • {insight}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                    {query.status === 'completed' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          // Add query result as widget
                          const newWidget: AnalyticsWidget = {
                            id: `widget_${Date.now()}`,
                            title: query.natural_language_query.slice(0, 50),
                            widget_type: query.chart_config?.type || 'bar_chart',
                            position_x: 0,
                            position_y: dashboard.widgets.length * 4,
                            width: 6,
                            height: 4,
                            data_source: 'nlp_query',
                            chart_config: query.chart_config,
                            cached_data: query.result_data,
                            last_updated: new Date().toISOString(),
                          };
                          
                          onUpdateDashboard({
                            ...dashboard,
                            widgets: [...dashboard.widgets, newWidget],
                          });
                        }}
                      >
                        Add to Dashboard
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Query Dialog */}
      <Dialog open={queryDialogOpen} onClose={() => setQueryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ask Analytics AI</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Ask questions about your campaign data in natural language. The AI will generate visualizations and insights automatically.
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Query Type</InputLabel>
              <Select
                value={selectedQueryType}
                label="Query Type"
                onChange={(e) => setSelectedQueryType(e.target.value)}
              >
                {queryTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Autocomplete
              freeSolo
              options={sampleQueries}
              value={currentQuery}
              onChange={(_event, newValue) => setCurrentQuery(newValue || '')}
              onInputChange={(_event, newInputValue) => setCurrentQuery(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Your Question"
                  multiline
                  rows={3}
                  placeholder="e.g., Show me voter turnout by precinct for the last election"
                  helperText="Try asking about voter demographics, campaign performance, geographic trends, or any other data insights you need."
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQueryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleProcessQuery}
            variant="contained"
            disabled={!currentQuery.trim() || isProcessingQuery}
            startIcon={isProcessingQuery ? <CircularProgress size={16} /> : <Send />}
          >
            {isProcessingQuery ? 'Processing...' : 'Ask AI'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Widget Editor Dialog */}
      <WidgetEditorDialog
        widget={selectedWidget}
        open={widgetDialogOpen}
        onClose={() => setWidgetDialogOpen(false)}
        onSave={handleSaveWidget}
      />
    </Box>
  );
};

// Widget Editor Dialog Component
const WidgetEditorDialog: React.FC<{
  widget: AnalyticsWidget | null;
  open: boolean;
  onClose: () => void;
  onSave: (widget: AnalyticsWidget) => void;
}> = ({ widget, open, onClose, onSave }) => {
  const [editingWidget, setEditingWidget] = useState<AnalyticsWidget | null>(null);

  useEffect(() => {
    if (widget) {
      setEditingWidget({ ...widget });
    } else {
      setEditingWidget({
        id: `widget_${Date.now()}`,
        title: 'New Widget',
        widget_type: 'bar_chart',
        position_x: 0,
        position_y: 0,
        width: 6,
        height: 4,
        data_source: 'custom',
        chart_config: {},
        cached_data: [],
      });
    }
  }, [widget]);

  if (!editingWidget) return null;

  const handleSave = () => {
    onSave(editingWidget);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {widget ? 'Edit Widget' : 'Add Widget'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Widget Title"
            value={editingWidget.title}
            onChange={(e) => setEditingWidget(prev => prev ? { ...prev, title: e.target.value } : null)}
            fullWidth
          />
          
          <FormControl fullWidth>
            <InputLabel>Widget Type</InputLabel>
            <Select
              value={editingWidget.widget_type}
              label="Widget Type"
              onChange={(e) => setEditingWidget(prev => prev ? { ...prev, widget_type: e.target.value } : null)}
            >
              {widgetTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {type.icon}
                    <span>{type.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Width (Grid Units)"
                type="number"
                value={editingWidget.width}
                onChange={(e) => setEditingWidget(prev => prev ? { ...prev, width: parseInt(e.target.value) } : null)}
                fullWidth
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Height (Grid Units)"
                type="number"
                value={editingWidget.height}
                onChange={(e) => setEditingWidget(prev => prev ? { ...prev, height: parseInt(e.target.value) } : null)}
                fullWidth
                inputProps={{ min: 1, max: 12 }}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Widget
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalyticsDashboardComponent;