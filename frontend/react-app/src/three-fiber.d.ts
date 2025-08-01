// React Three Fiber global types
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Extend fiber with Three.js objects
extend(THREE)

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any
      mesh: any
      meshStandardMaterial: any
      boxGeometry: any
      sphereGeometry: any
      planeGeometry: any
      ambientLight: any
      pointLight: any
      directionalLight: any
    }
  }
}

export {}