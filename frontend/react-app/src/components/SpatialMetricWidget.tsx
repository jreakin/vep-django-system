import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Fade,
} from '@mui/material';
import { Launch as PopOutIcon } from '@mui/icons-material';
import {
  isVisionOS,
  LevelOfDetail,
  type SpatialWidgetConfig,
  createSpatialWidget,
  setupLevelOfDetailListener,
  getCurrentLevelOfDetail,
} from '../utils/visionOS';

interface SpatialMetricWidgetProps {
  config: SpatialWidgetConfig;
  value: string | number;
  subtitle?: string;
  onPopOut?: () => void;
}

export const SpatialMetricWidget: React.FC<SpatialMetricWidgetProps> = ({
  config,
  value,
  subtitle,
  onPopOut,
}) => {
  const [levelOfDetail, setLevelOfDetail] = useState<LevelOfDetail>(getCurrentLevelOfDetail());
  const [isPopping, setIsPopping] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const showVisionOSFeatures = isVisionOS();

  useEffect(() => {
    const cleanup = setupLevelOfDetailListener(setLevelOfDetail);
    return cleanup;
  }, []);

  const handlePopOut = async () => {
    if (!widgetRef.current || !config.canPopOut) return;
    
    setIsPopping(true);
    
    try {
      const success = await createSpatialWidget(widgetRef.current, config);
      if (success && onPopOut) {
        onPopOut();
      }
    } catch (error) {
      console.error('Failed to pop out widget:', error);
    } finally {
      setIsPopping(false);
    }
  };

  // Render based on level of detail
  const renderContent = () => {
    switch (levelOfDetail) {
      case LevelOfDetail.FAR:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
            <Box sx={{ color: config.color, mr: 1 }}>
              {config.icon}
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
        );
      
      case LevelOfDetail.MEDIUM:
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ color: config.color, mr: 1 }}>
                {config.icon}
              </Box>
              <Typography variant="h6" component="div">
                {config.title}
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
        );
      
      case LevelOfDetail.CLOSE:
      default:
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ color: config.color, mr: 2 }}>
                  {config.icon}
                </Box>
                <Typography variant="h6" component="div">
                  {config.title}
                </Typography>
              </Box>
              {showVisionOSFeatures && config.canPopOut && (
                <Fade in={!isPopping}>
                  <IconButton
                    size="small"
                    onClick={handlePopOut}
                    disabled={isPopping}
                    sx={{ 
                      opacity: 0.7,
                      '&:hover': { opacity: 1 },
                      color: config.color 
                    }}
                    title="Pop out to spatial environment"
                  >
                    <PopOutIcon fontSize="small" />
                  </IconButton>
                </Fade>
              )}
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {showVisionOSFeatures && (
              <Chip 
                label="Spatial Ready" 
                size="small" 
                sx={{ 
                  mt: 1, 
                  bgcolor: `${config.color}20`,
                  color: config.color,
                  fontSize: '0.7rem'
                }} 
              />
            )}
          </Box>
        );
    }
  };

  return (
    <Card 
      ref={widgetRef}
      sx={{ 
        height: '100%',
        position: 'relative',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': showVisionOSFeatures && config.canPopOut ? { 
          transform: 'translateY(-2px)',
          boxShadow: 3 
        } : {},
        ...(isPopping && {
          transform: 'scale(0.95)',
          opacity: 0.8
        })
      }}
      data-spatial-widget={config.id}
    >
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default SpatialMetricWidget;