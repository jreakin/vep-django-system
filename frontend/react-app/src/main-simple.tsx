import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', background: 'lightblue', minHeight: '100vh' }}>
      <h1>Simple React App Test</h1>
      <p>If you can see this, React is working!</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SimpleApp />
  </StrictMode>,
)