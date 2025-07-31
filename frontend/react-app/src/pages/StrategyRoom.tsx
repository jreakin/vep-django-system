import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { Box, Typography, Alert, Container, Paper, Button } from '@mui/material'
import { OrbitControls } from '@react-three/drei'

// WebXR Scene Component
const StrategyRoomScene: React.FC = () => {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />
      
      {/* Directional light */}
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Room environment */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Sample 3D objects for collaboration */}
      <mesh position={[0, 1, -2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1976d2" />
      </mesh>
      
      <mesh position={[2, 1, -2]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="#dc004e" />
      </mesh>
      
      {/* Interactive elements for campaign data visualization */}
      <mesh position={[-2, 1, -2]}>
        <cylinderGeometry args={[0.5, 0.5, 1]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
      
      {/* OrbitControls for non-XR interaction */}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  )
}

// Main StrategyRoom Component
const StrategyRoom: React.FC = () => {
  const [isWebXRSupported, setIsWebXRSupported] = useState<boolean | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const webSocketRef = useRef<WebSocket | null>(null)
  const xrStore = createXRStore()

  // Check WebXR support
  useEffect(() => {
    const checkWebXRSupport = async () => {
      if ('xr' in navigator) {
        try {
          const isSupported = await navigator.xr?.isSessionSupported('immersive-vr')
          setIsWebXRSupported(isSupported || false)
        } catch (error) {
          console.warn('WebXR support check failed:', error)
          setIsWebXRSupported(false)
        }
      } else {
        setIsWebXRSupported(false)
      }
    }

    checkWebXRSupport()
  }, [])

  // WebSocket connection for real-time collaboration
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/strategy-room/`
    
    const connectWebSocket = () => {
      webSocketRef.current = new WebSocket(wsUrl)
      
      webSocketRef.current.onopen = () => {
        console.log('Strategy room WebSocket connected')
        setIsConnected(true)
      }
      
      webSocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Received strategy room data:', data)
          // Handle collaborative updates here
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      webSocketRef.current.onclose = () => {
        console.log('Strategy room WebSocket disconnected')
        setIsConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      webSocketRef.current.onerror = (error) => {
        console.error('Strategy room WebSocket error:', error)
      }
    }

    connectWebSocket()

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close()
      }
    }
  }, [])

  const enterVR = async () => {
    try {
      await xrStore.enterXR('immersive-vr')
    } catch (error) {
      console.error('Failed to enter VR:', error)
    }
  }

  if (isWebXRSupported === null) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Checking WebXR support...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Strategy Room - WebXR Collaborative Environment
      </Typography>
      
      {!isWebXRSupported && (
        <Alert severity="info" sx={{ mb: 2 }}>
          WebXR is not supported on this browser. This collaborative strategy room works best on 
          Apple Vision Pro with Safari or other WebXR-enabled browsers. You can still view the 3D 
          environment below with mouse/touch controls.
        </Alert>
      )}
      
      <Alert severity={isConnected ? "success" : "warning"} sx={{ mb: 2 }}>
        Real-time collaboration: {isConnected ? "Connected" : "Connecting..."}
      </Alert>

      <Paper elevation={3} sx={{ height: '70vh', position: 'relative' }}>
        {isWebXRSupported && (
          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
            <Button
              onClick={enterVR}
              variant="contained"
              color="primary"
              sx={{
                background: '#1976d2',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              Enter VR Strategy Room
            </Button>
          </Box>
        )}
        
        <Canvas style={{ width: '100%', height: '100%' }}>
          <XR store={xrStore}>
            <StrategyRoomScene />
          </XR>
        </Canvas>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        This WebXR strategy room allows multiple users to collaborate in real-time. 
        Move around the 3D space and interact with campaign data visualizations.
        {isWebXRSupported && " Click 'Enter VR Strategy Room' on Apple Vision Pro to start the immersive experience."}
      </Typography>
    </Container>
  )
}

export default StrategyRoom