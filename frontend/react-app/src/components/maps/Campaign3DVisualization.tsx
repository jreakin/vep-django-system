import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ThreeDRotation,
  Map as MapIcon,
  Refresh,
  Download,
  BarChart,
  PieChart,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';

interface Campaign3DVisualizationProps {
  campaignId: string;
  onToggle2D: () => void;
  show2DFallback?: boolean;
}

interface ModelState {
  loading: boolean;
  error: string | null;
  modelUrl: string | null;
  dataType: string;
  lastGenerated: Date | null;
}

// Browser support detection for <model> element
const supportsModelElement = (): boolean => {
  // Check if we're in Safari (which supports <model> on visionOS)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Check for visionOS specifically (this is a simplified check)
  const isVisionOS = /vision/i.test(navigator.userAgent) || 
                     /visionos/i.test(navigator.userAgent) ||
                     (isSafari && window.DeviceMotionEvent !== undefined);
  
  // Also check if <model> element is actually supported
  const supportsModel = 'model' in document.createElement('model');
  
  return (isSafari || isVisionOS) && supportsModel;
};

const Campaign3DVisualization: React.FC<Campaign3DVisualizationProps> = ({
  campaignId,
  onToggle2D,
  show2DFallback = false,
}) => {
  const [modelState, setModelState] = useState<ModelState>({
    loading: false,
    error: null,
    modelUrl: null,
    dataType: 'geographic',
    lastGenerated: null,
  });

  const [browserSupported, setBrowserSupported] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  const dataTypes = [
    { value: 'geographic', label: 'Geographic Data', icon: <MapIcon /> },
    { value: 'demographic', label: 'Demographics', icon: <BarChart /> },
    { value: 'turnout', label: 'Turnout Prediction', icon: <TrendingUp /> },
  ];

  useEffect(() => {
    // Check browser support on component mount
    const supported = supportsModelElement();
    setBrowserSupported(supported);
    
    if (!supported || show2DFallback) {
      setFallbackMode(true);
    }
  }, [show2DFallback]);

  const generateModel = async () => {
    setModelState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await axios.post('/api/analytics/3d-model/generate/', {
        campaign_id: campaignId,
        data_type: modelState.dataType,
        zip_codes: [], // Could be populated from user selection
      }, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      // Create a blob URL for the USDZ file
      const blob = new Blob([response.data], { type: 'model/vnd.usdz+zip' });
      const modelUrl = URL.createObjectURL(blob);

      setModelState(prev => ({
        ...prev,
        loading: false,
        modelUrl,
        lastGenerated: new Date(),
      }));

    } catch (error: any) {
      console.error('Failed to generate 3D model:', error);
      setModelState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || 'Failed to generate 3D model',
      }));
    }
  };

  const handleDataTypeChange = (newDataType: string) => {
    setModelState(prev => ({
      ...prev,
      dataType: newDataType,
      modelUrl: null, // Clear previous model when type changes
    }));
  };

  const downloadModel = () => {
    if (modelState.modelUrl) {
      const link = document.createElement('a');
      link.href = modelState.modelUrl;
      link.download = `campaign_${campaignId}_${modelState.dataType}_3d_model.usdz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const render3DModel = () => {
    if (!modelState.modelUrl) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
          }}
        >
          <ThreeDRotation sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No 3D Model Generated
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Click "Generate 3D Model" to create an interactive visualization of your campaign data.
          </Typography>
        </Box>
      );
    }

    if (browserSupported && !fallbackMode) {
      // Use HTML <model> element for visionOS/Safari
      return (
        <Box 
          sx={{ 
            height: '400px', 
            width: '100%', 
            borderRadius: 2, 
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'grey.300',
          }}
        >
          {/* @ts-ignore - model element is not in standard TS definitions */}
          <model
            src={modelState.modelUrl}
            interactive
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            onError={() => {
              setModelState(prev => ({ 
                ...prev, 
                error: 'Failed to load 3D model. Switching to fallback view.' 
              }));
              setFallbackMode(true);
            }}
          />
        </Box>
      );
    } else {
      // Fallback for unsupported browsers
      return render2DFallback();
    }
  };

  const render2DFallback = () => {
    return (
      <Box 
        sx={{ 
          height: '400px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.300',
        }}
      >
        <PieChart sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          2D Visualization Mode
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2, maxWidth: 300 }}>
          Your browser doesn't support 3D model viewing. Here's a simplified chart representation of your {modelState.dataType} data.
        </Typography>
        
        {/* Simple 2D representation based on data type */}
        <Box sx={{ width: '80%', height: '200px', backgroundColor: 'white', borderRadius: 1, p: 2 }}>
          {modelState.dataType === 'geographic' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>Geographic Distribution</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                {['North', 'South', 'East', 'West', 'Central'].map((region, index) => (
                  <Box key={region} sx={{ textAlign: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 80 - (index * 10), 
                        backgroundColor: 'primary.main', 
                        mx: 'auto', 
                        mb: 1 
                      }} 
                    />
                    <Typography variant="caption">{region}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {modelState.dataType === 'demographic' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>Age Demographics</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                {['18-25', '26-35', '36-50', '51-65', '65+'].map((age, index) => (
                  <Box key={age} sx={{ textAlign: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 60 + (index * 8), 
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`, 
                        mx: 'auto', 
                        mb: 1 
                      }} 
                    />
                    <Typography variant="caption">{age}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {modelState.dataType === 'turnout' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>Turnout Prediction</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                {['P1', 'P2', 'P3', 'P4', 'P5'].map((precinct, index) => {
                  const height = 40 + (index * 10);
                  const color = height > 60 ? 'success.main' : height > 45 ? 'warning.main' : 'error.main';
                  return (
                    <Box key={precinct} sx={{ textAlign: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 20, 
                          height, 
                          backgroundColor: color, 
                          mx: 'auto', 
                          mb: 1,
                          borderRadius: '50% 50% 0 0'
                        }} 
                      />
                      <Typography variant="caption">{precinct}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header with controls */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" component="div">
            3D Campaign Visualization
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={!fallbackMode && browserSupported}
                  onChange={(e) => setFallbackMode(!e.target.checked)}
                  disabled={!browserSupported}
                />
              }
              label="3D Mode"
              sx={{ mr: 1 }}
            />
            <Tooltip title="Switch to 2D Map">
              <IconButton onClick={onToggle2D} size="small">
                <MapIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Browser support warning */}
        {!browserSupported && (
          <Alert severity="info" sx={{ mb: 2 }}>
            3D model viewing requires Safari on visionOS. Showing 2D fallback visualization.
          </Alert>
        )}

        {/* Error display */}
        {modelState.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {modelState.error}
          </Alert>
        )}

        {/* Controls */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Data Type</InputLabel>
            <Select
              value={modelState.dataType}
              label="Data Type"
              onChange={(e) => handleDataTypeChange(e.target.value)}
            >
              {dataTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {type.icon}
                    <span>{type.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={generateModel}
            disabled={modelState.loading}
            startIcon={modelState.loading ? <CircularProgress size={16} /> : <Refresh />}
          >
            {modelState.loading ? 'Generating...' : 'Generate 3D Model'}
          </Button>

          {modelState.modelUrl && (
            <Button
              variant="outlined"
              onClick={downloadModel}
              startIcon={<Download />}
            >
              Download
            </Button>
          )}
        </Stack>

        {/* Last generated info */}
        {modelState.lastGenerated && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Last generated: {modelState.lastGenerated.toLocaleString()}
          </Typography>
        )}

        {/* 3D Model or Fallback */}
        {render3DModel()}

        {/* Instructions for visionOS */}
        {browserSupported && !fallbackMode && modelState.modelUrl && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>visionOS Controls:</strong> Use pinch gestures to zoom, drag to rotate, and tap to select data points.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default Campaign3DVisualization;