import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useWebSocket } from './hooks/useWebSocket'

function AppWithWS() {
  useWebSocket()
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithWS />
  </StrictMode>,
)
