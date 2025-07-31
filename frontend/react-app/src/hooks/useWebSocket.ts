import { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'

export interface WebSocketNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  created_at: string
  action_url?: string
  action_data?: any
}

interface UseWebSocketOptions {
  reconnectAttempts?: number
  reconnectInterval?: number
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { reconnectAttempts = 5, reconnectInterval = 3000 } = options
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth)
  
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const reconnectTimeoutRef = useRef<number | undefined>(undefined)
  const reconnectCount = useRef(0)

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      return
    }

    try {
      // Use environment variable for WebSocket URL or fallback
      const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
      const ws = new WebSocket(`${wsUrl}/ws/notifications/?token=${token}`)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
        reconnectCount.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'notification') {
            setNotifications(prev => [data.notification, ...prev])
          } else if (data.type === 'error') {
            console.error('WebSocket error:', data.message)
            setError(data.message)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        setSocket(null)

        // Attempt to reconnect if not intentionally closed
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++
          console.log(`Attempting to reconnect (${reconnectCount.current}/${reconnectAttempts})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else {
          setError('WebSocket connection failed after multiple attempts')
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
      }

      setSocket(ws)
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError('Failed to establish WebSocket connection')
    }
  }, [isAuthenticated, token, reconnectAttempts, reconnectInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (socket) {
      socket.close()
    }
  }, [socket])

  const markNotificationRead = useCallback((notificationId: string) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }))
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    }
  }, [socket, isConnected])

  const markAllNotificationsRead = useCallback(() => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'mark_all_read'
      }))
      
      // Clear local state
      setNotifications([])
    }
  }, [socket, isConnected])

  useEffect(() => {
    if (isAuthenticated && token) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, token, connect, disconnect])

  return {
    isConnected,
    notifications,
    error,
    markNotificationRead,
    markAllNotificationsRead,
    reconnect: connect,
  }
}