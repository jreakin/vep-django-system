import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { 
  OrbitControls, 
  Text, 
  Box, 
  Sphere
} from '@react-three/drei'
import {
  Box as MuiBox,
  Typography,
  Alert,
  Card,
  CardContent,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Grid,
  IconButton,
  Chip
} from '@mui/material'
import {
  Chat,
  Upload,
  People,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material'
import * as THREE from 'three'

// Dynamically import XR components to handle missing dependencies gracefully
let XRComponents: any = null
try {
  XRComponents = require('@react-three/xr')
} catch (error) {
  console.warn('WebXR components not available:', error)
}

// WebSocket service for real-time collaboration
class StrategyRoomWebSocket {
  private ws: WebSocket | null = null
  private roomId: string
  private callbacks: Map<string, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(roomId: string) {
    this.roomId = roomId
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/strategy-room/${this.roomId}/`
    
    this.ws = new WebSocket(wsUrl)
    
    this.ws.onopen = () => {
      console.log('Connected to strategy room')
      this.reconnectAttempts = 0
      this.emit('connected', {})
    }
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.emit(data.type, data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    
    this.ws.onclose = () => {
      console.log('Disconnected from strategy room')
      this.emit('disconnected', {})
      this.handleReconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', { error })
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Reconnecting attempt ${this.reconnectAttempts}`)
        this.connect()
      }, 1000 * this.reconnectAttempts)
    }
  }

  send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }))
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Avatar component to represent other users
function UserAvatar({ 
  position, 
  rotation, 
  username, 
  color = '#4285f4' 
}: { 
  position: [number, number, number]
  rotation?: [number, number, number]
  username: string
  color?: string
}) {
  return (
    <group position={position} rotation={rotation}>
      <Sphere args={[0.1]} position={[0, 1.7, 0]}>
        <meshBasicMaterial color={color} />
      </Sphere>
      <Box args={[0.3, 0.5, 0.2]} position={[0, 1.2, 0]}>
        <meshBasicMaterial color={color} opacity={0.8} transparent />
      </Box>
      <Text
        position={[0, 2, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {username}
      </Text>
    </group>
  )
}

// USDZ Model Loader component
function USDZModelViewer({ 
  position = [0, 0, 0], 
  scale = 1 
}: { 
  modelUrl?: string
  position?: [number, number, number]
  scale?: number
}) {
  // For now, we'll use a placeholder since USDZ loading requires additional setup
  return (
    <group position={position} scale={scale}>
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color="#cccccc" />
      </Box>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        USDZ Model
      </Text>
    </group>
  )
}

// Main XR Scene component
function XRScene({ 
  users, 
  models, 
  onUserPosition 
}: { 
  users: Map<string, any>
  models: any[]
  onUserPosition: (position: [number, number, number], rotation: [number, number, number]) => void
}) {
  const lastPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const lastRotation = useRef<THREE.Euler>(new THREE.Euler())

  // For now, we'll use a simple interval to simulate position tracking
  // In a real implementation, this would be handled by XR session events
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate position updates - in real XR this would come from the headset
      const currentPosition = new THREE.Vector3(0, 1.6, 0)
      const currentRotation = new THREE.Euler(0, 0, 0)

      // Only send updates if position has changed significantly
      if (currentPosition.distanceTo(lastPosition.current) > 0.1 ||
          Math.abs(currentRotation.y - lastRotation.current.y) > 0.1) {
        
        onUserPosition(
          [currentPosition.x, currentPosition.y, currentPosition.z],
          [currentRotation.x, currentRotation.y, currentRotation.z]
        )
        
        lastPosition.current.copy(currentPosition)
        lastRotation.current.copy(currentRotation)
      }
    }, 1000) // Send position updates every second for demo

    return () => clearInterval(interval)
  }, [onUserPosition])

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Welcome text */}
      <Text
        position={[0, 3, -5]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        WebXR Strategy Room
      </Text>
      
      {/* Render other users as avatars */}
      {Array.from(users.entries()).map(([userId, userData]) => (
        <UserAvatar
          key={userId}
          position={userData.position || [0, 0, 0]}
          rotation={userData.rotation}
          username={userData.username}
        />
      ))}
      
      {/* Render loaded models */}
      {models.map((model, index) => (
        <USDZModelViewer
          key={index}
          position={model.position}
          scale={model.scale}
        />
      ))}
      
      {/* Sample interactive objects */}
      <Box args={[1, 1, 1]} position={[2, 1, -2]}>
        <meshStandardMaterial color="#ff6b6b" />
      </Box>
      <Sphere args={[0.5]} position={[-2, 1, -2]}>
        <meshStandardMaterial color="#4ecdc4" />
      </Sphere>
    </>
  )
}

// Main Strategy Room component
export default function StrategyRoom() {
  const [isWebXRSupported, setIsWebXRSupported] = useState<boolean | null>(null)
  const [ws, setWs] = useState<StrategyRoomWebSocket | null>(null)
  const [users, setUsers] = useState<Map<string, any>>(new Map())
  const [models, setModels] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [xrAvailable, setXrAvailable] = useState(false)
  
  const roomId = 'default' // In a real app, this would come from URL params

  // Check if XR components are available
  useEffect(() => {
    setXrAvailable(!!XRComponents)
  }, [])

  // Check WebXR support
  useEffect(() => {
    if ('xr' in navigator && XRComponents) {
      navigator.xr!.isSessionSupported('immersive-vr').then((supported) => {
        setIsWebXRSupported(supported)
      }).catch(() => {
        setIsWebXRSupported(false)
      })
    } else {
      setIsWebXRSupported(false)
    }
  }, [xrAvailable])

  // Initialize WebSocket connection
  useEffect(() => {
    const websocket = new StrategyRoomWebSocket(roomId)
    setWs(websocket)

    // Set up event listeners
    websocket.on('connected', () => setIsConnected(true))
    websocket.on('disconnected', () => setIsConnected(false))
    
    websocket.on('user_joined', (data: any) => {
      setChatMessages(prev => [...prev, {
        type: 'system',
        message: data.message,
        timestamp: new Date()
      }])
    })
    
    websocket.on('user_left', (data: any) => {
      setUsers(prev => {
        const newUsers = new Map(prev)
        newUsers.delete(data.user_id)
        return newUsers
      })
      setChatMessages(prev => [...prev, {
        type: 'system',
        message: data.message,
        timestamp: new Date()
      }])
    })
    
    websocket.on('position_update', (data: any) => {
      setUsers(prev => {
        const newUsers = new Map(prev)
        newUsers.set(data.user_id, {
          username: data.username,
          position: data.position,
          rotation: data.rotation
        })
        return newUsers
      })
    })
    
    websocket.on('model_loaded', (data: any) => {
      setModels(prev => [...prev, {
        url: data.model_url,
        type: data.model_type,
        position: data.position,
        scale: data.scale
      }])
    })
    
    websocket.on('chat_message', (data: any) => {
      setChatMessages(prev => [...prev, {
        type: 'message',
        username: data.username,
        message: data.message,
        timestamp: new Date()
      }])
    })

    websocket.connect()

    return () => {
      websocket.disconnect()
    }
  }, [roomId])

  const handleUserPosition = useCallback((position: [number, number, number], rotation: [number, number, number]) => {
    if (ws && isConnected) {
      ws.send('user_position', { position, rotation })
    }
  }, [ws, isConnected])

  const handleSendMessage = () => {
    if (ws && isConnected && newMessage.trim()) {
      ws.send('chat_message', { message: newMessage.trim() })
      setNewMessage('')
    }
  }

  const handleLoadModel = (modelUrl: string) => {
    if (ws && isConnected) {
      ws.send('load_model', {
        model_url: modelUrl,
        model_type: 'usdz',
        position: [0, 1, -3],
        scale: 1
      })
    }
  }

  if (isWebXRSupported === null) {
    return (
      <MuiBox sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Strategy Room
        </Typography>
        <Typography>Checking WebXR support...</Typography>
      </MuiBox>
    )
  }

  // Render WebXR-enabled or fallback version
  const renderCanvas = () => {
    if (xrAvailable && isWebXRSupported && XRComponents) {
      const { XR, Controllers, Hands, VRButton, ARButton, createXRStore } = XRComponents
      const store = createXRStore()
      
      return (
        <>
          <Canvas camera={{ position: [0, 1.6, 5] }}>
            <XR store={store}>
              <XRScene 
                users={users} 
                models={models} 
                onUserPosition={handleUserPosition}
              />
              <Controllers />
              <Hands />
            </XR>
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>
          
          {/* XR Buttons */}
          <MuiBox sx={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 1 }}>
            <VRButton store={store} />
            <ARButton store={store} />
          </MuiBox>
        </>
      )
    } else {
      return (
        <Canvas camera={{ position: [0, 1.6, 5] }}>
          <XRScene 
            users={users} 
            models={models} 
            onUserPosition={handleUserPosition}
          />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      )
    }
  }

  if (!isWebXRSupported && !xrAvailable) {
    return (
      <MuiBox sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          WebXR Strategy Room
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6">WebXR Not Supported</Typography>
          <Typography>
            This browser does not support WebXR or you're not using a compatible device. 
            The WebXR Strategy Room is optimized for Apple Vision Pro and other WebXR-capable devices.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            <strong>To access the full experience:</strong>
          </Typography>
          <ul>
            <li>Use Safari on Apple Vision Pro</li>
            <li>Use a WebXR-compatible browser on a VR headset</li>
            <li>Enable WebXR flags in your browser settings</li>
          </ul>
        </Alert>
        
        <Typography variant="h6" gutterBottom>
          Desktop Preview
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          You can preview the 3D scene below, but WebXR features are not available.
        </Typography>
        
        <MuiBox sx={{ height: '60vh', border: '1px solid #ccc', borderRadius: 2 }}>
          {renderCanvas()}
        </MuiBox>
      </MuiBox>
    )
  }

  return (
    <MuiBox sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        WebXR Strategy Room
      </Typography>
      
      <Grid container spacing={3}>
        {/* WebXR Canvas */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  3D Collaborative Space
                </Typography>
                <MuiBox sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    icon={<People />} 
                    label={`${users.size + 1} users`} 
                    size="small" 
                    color={isConnected ? 'success' : 'default'}
                  />
                  <IconButton onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                </MuiBox>
              </MuiBox>
              
              <MuiBox sx={{ height: '60vh', border: '1px solid #ccc', borderRadius: 2, position: 'relative' }}>
                {renderCanvas()}
              </MuiBox>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Chat and Controls */}
        <Grid item xs={12} md={4}>
          {/* Chat */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Chat sx={{ mr: 1, verticalAlign: 'middle' }} />
                Room Chat
              </Typography>
              
              <MuiBox sx={{ height: '200px', overflowY: 'auto', mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <List dense>
                  {chatMessages.map((msg, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={msg.type === 'system' ? msg.message : `${msg.username}: ${msg.message}`}
                        secondary={msg.timestamp?.toLocaleTimeString()}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: msg.type === 'system' ? 'text.secondary' : 'text.primary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </MuiBox>
              
              <MuiBox sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  fullWidth
                />
                <Button onClick={handleSendMessage} variant="contained" size="small">
                  Send
                </Button>
              </MuiBox>
            </CardContent>
          </Card>
          
          {/* Model Controls */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Upload sx={{ mr: 1, verticalAlign: 'middle' }} />
                3D Models
              </Typography>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleLoadModel('/sample-model.usdz')}
                disabled={!isConnected}
                sx={{ mb: 1 }}
              >
                Load Sample Campaign Model
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                USDZ models from campaign data will appear here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MuiBox>
  )
}