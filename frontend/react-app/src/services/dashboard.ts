import api from './api'

export interface DashboardStats {
  dashboards_count: number
  charts_count: number
  unread_notifications: number
  recent_uploads: number
  total_voters?: number
  recent_voters?: number
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  created_at: string
}

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboards/stats/')
    return response.data
  },

  // Get notifications
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/dashboards/notifications/')
    return response.data.results || response.data
  },

  // Get notification count
  getNotificationCount: async (): Promise<{ count: number; unread: number }> => {
    const response = await api.get('/dashboards/notifications/count/')
    return response.data
  },

  // Mark notifications as read
  markNotificationsRead: async (notificationIds: string[]): Promise<void> => {
    await api.post('/dashboards/notifications/mark-read/', {
      notification_ids: notificationIds
    })
  },
}

export default dashboardService