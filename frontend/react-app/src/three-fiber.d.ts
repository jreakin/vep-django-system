// React Three Fiber global types
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