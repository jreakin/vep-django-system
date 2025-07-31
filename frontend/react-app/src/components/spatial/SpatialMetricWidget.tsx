import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Fade,
} from '@mui/material';
import {
  Launch as LaunchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { 
  isVisionOS, 
  makeSpatial, 
  removeSpatial, 
  SpatialWidget,
  type LevelOfDetailConfig 
} from '../../utils/visionOS';

export interface SpatialMetricWidgetProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  data?: any;
  onRefresh?: () => Promise<void>;
  className?: string;
  levelOfDetailConfig?: LevelOfDetailConfig;
}

export const SpatialMetricWidget: React.FC<SpatialMetricWidgetProps> = ({
  title,
  value,
  unit = '',
  icon,
  color = '#1976d2',
  subtitle,
  data,
  onRefresh,
  className = '',
  levelOfDetailConfig = { near: 1, mid: 3, far: 10 }
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const spatialInstanceRef = useRef<SpatialWidget | null>(null);
  const [isSpatialMode, setIsSpatialMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [levelOfDetail, setLevelOfDetail] = useState<'near' | 'mid' | 'far'>('mid');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const visionOSAvailable = isVisionOS();

  // Initialize level of detail observer
  useEffect(() => {
    if (!widgetRef.current || !visionOSAvailable) return;

    spatialInstanceRef.current = new SpatialWidget(widgetRef.current, levelOfDetailConfig);

    const handleLevelChange = (event: CustomEvent) => {
      setLevelOfDetail(event.detail.level);
    };

    widgetRef.current.addEventListener('levelOfDetailChanged', handleLevelChange as EventListener);

    return () => {
      if (spatialInstanceRef.current) {
        spatialInstanceRef.current.destroy();
      }
      if (widgetRef.current) {
        widgetRef.current.removeEventListener('levelOfDetailChanged', handleLevelChange as EventListener);
      }
    };
  }, [visionOSAvailable, levelOfDetailConfig]);

  // Handle making widget spatial
  const handleMakeSpatial = useCallback(async () => {
    if (!widgetRef.current || !visionOSAvailable) return;

    try {
      const success = await makeSpatial(widgetRef.current, {
        title: `${title} - Spatial Widget`,
        initialPosition: { x: 0, y: 0, z: -2 },
        size: { width: 400, height: 300 }
      });

      if (success) {
        setIsSpatialMode(true);
        widgetRef.current.classList.add('spatial-active');
      }
    } catch (error) {
      console.error('Failed to make widget spatial:', error);
    }
  }, [title, visionOSAvailable]);

  // Handle removing spatial mode
  const handleRemoveSpatial = useCallback(() => {
    if (!widgetRef.current || !visionOSAvailable) return;

    const success = removeSpatial(widgetRef.current);
    if (success) {
      setIsSpatialMode(false);
      widgetRef.current.classList.remove('spatial-active');
    }
  }, [visionOSAvailable]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh widget:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Format value for display
  const formatValue = useCallback((val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return String(val);
  }, []);

  // Get content based on level of detail
  const getContentForLevel = (level: 'near' | 'mid' | 'far') => {
    switch (level) {
      case 'far':
        return {
          showIcon: false,
          showSubtitle: false,
          showUnit: false,
          showActions: false,
          valueSize: 'h3' as const,
          showTitle: false
        };
      case 'mid':
        return {
          showIcon: true,
          showSubtitle: false,
          showUnit: true,
          showActions: false,
          valueSize: 'h2' as const,
          showTitle: true
        };
      case 'near':
        return {
          showIcon: true,
          showSubtitle: true,
          showUnit: true,
          showActions: true,
          valueSize: 'h1' as const,
          showTitle: true
        };
      default:
        return {
          showIcon: true,
          showSubtitle: true,
          showUnit: true,
          showActions: true,
          valueSize: 'h2' as const,
          showTitle: true
        };
    }
  };

  const content = getContentForLevel(levelOfDetail);
  const formattedValue = formatValue(value);

  return (
    <Card
      ref={widgetRef}
      className={`spatial-metric-widget ${className} lod-${levelOfDetail}`}
      sx={{
        height: '100%',
        position: 'relative',
        transition: 'all 0.3s ease',
        border: isSpatialMode ? `2px solid ${color}` : 'none',
        boxShadow: isSpatialMode ? 4 : 1,
        '&.lod-far': {
          minHeight: '120px',
          '& .MuiCardContent-root': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }
        },
        '&.lod-mid': {
          minHeight: '200px'
        },
        '&.lod-near': {
          minHeight: '300px'
        }
      }}
    >
      <CardContent sx={{ height: '100%', pb: 2 }}>
        {/* VisionOS Controls */}
        {visionOSAvailable && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 1,
              opacity: content.showActions ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            {onRefresh && (
              <Tooltip title="Refresh data">
                <IconButton
                  size="small"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title={isSpatialMode ? "Remove from space" : "Place in space"}>
              <IconButton
                size="small"
                onClick={isSpatialMode ? handleRemoveSpatial : handleMakeSpatial}
                sx={{ 
                  opacity: 0.8, 
                  '&:hover': { opacity: 1 },
                  color: isSpatialMode ? color : 'inherit'
                }}
              >
                {isSpatialMode ? <CloseIcon /> : <LaunchIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Main Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: content.showTitle ? 'flex-start' : 'center',
            justifyContent: content.showTitle ? 'flex-start' : 'center',
            height: '100%',
            textAlign: content.showTitle ? 'left' : 'center'
          }}
        >
          {/* Header */}
          {content.showTitle && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {content.showIcon && (
                <Box sx={{ color, mr: 2 }}>
                  {icon}
                </Box>
              )}
              <Typography variant="h6" component="div">
                {title}
              </Typography>
            </Box>
          )}

          {/* Value */}
          <Typography
            variant={content.valueSize}
            component="div"
            sx={{
              fontWeight: 'bold',
              color: color,
              mb: content.showUnit || content.showSubtitle ? 1 : 0,
              lineHeight: 1.1
            }}
          >
            {formattedValue}
            {content.showUnit && unit && (
              <Typography
                component="span"
                variant="body1"
                sx={{ ml: 1, fontWeight: 'normal', opacity: 0.8 }}
              >
                {unit}
              </Typography>
            )}
          </Typography>

          {/* Subtitle */}
          {content.showSubtitle && subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {subtitle}
            </Typography>
          )}

          {/* Additional Data for Near View */}
          {content.showActions && data && (
            <Fade in={levelOfDetail === 'near'}>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                {Array.isArray(data) ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {data.slice(0, 3).map((item, index) => (
                      <Chip
                        key={index}
                        label={`${item.label}: ${item.value}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Typography>
                )}
              </Box>
            </Fade>
          )}
        </Box>

        {/* Spatial Mode Indicator */}
        {isSpatialMode && (
          <Chip
            label="Spatial"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              backgroundColor: color,
              color: 'white',
              opacity: content.showActions ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SpatialMetricWidget;