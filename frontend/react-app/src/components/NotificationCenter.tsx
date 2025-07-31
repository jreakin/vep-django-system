import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Info,
  Warning,
  Error,
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';
import dashboardService from '../services/dashboard';

const NotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [persistentNotifications, setPersistentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    isConnected, 
    notifications: wsNotifications, 
    error: wsError,
    markNotificationRead,
    markAllNotificationsRead 
  } = useWebSocket();

  const open = Boolean(anchorEl);

  // Load initial notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const notifications = await dashboardService.getNotifications();
        setPersistentNotifications(notifications);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Combine WebSocket and persistent notifications
  const allNotifications = [...wsNotifications, ...persistentNotifications];
  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Mark read via WebSocket if it's a WebSocket notification
      const isWsNotification = wsNotifications.some(n => n.id === notificationId);
      
      if (isWsNotification) {
        markNotificationRead(notificationId);
      } else {
        // Mark read via API for persistent notifications
        await dashboardService.markNotificationsRead([notificationId]);
        setPersistentNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all WebSocket notifications as read
      markAllNotificationsRead();
      
      // Mark all persistent notifications as read
      const unreadPersistentIds = persistentNotifications
        .filter(n => !n.is_read)
        .map(n => n.id);
        
      if (unreadPersistentIds.length > 0) {
        await dashboardService.markNotificationsRead(unreadPersistentIds);
        setPersistentNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
      }
      
      handleClose();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 350,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {allNotifications.length > 0 && (
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <CheckCircle fontSize="small" />
              </IconButton>
            )}
          </Box>
          {!isConnected && (
            <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
              Real-time notifications disconnected
            </Alert>
          )}
          {(error || wsError) && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {error || wsError}
            </Alert>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : allNotifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          allNotifications.slice(0, 10).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              sx={{
                opacity: notification.is_read ? 0.6 : 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                <Box sx={{ mr: 1, mt: 0.5 }}>
                  {getNotificationIcon(notification.type)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {notification.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={notification.type}
                      size="small"
                      color={getNotificationColor(notification.type) as any}
                      variant="outlined"
                    />
                  </Box>
                </Box>
                {!notification.is_read && (
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      backgroundColor: 'primary.main', 
                      borderRadius: '50%',
                      ml: 1,
                      mt: 1
                    }} 
                  />
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;