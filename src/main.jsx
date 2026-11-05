import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initLiveStream } from './services/live.js'

// Open the SSE realtime stream so the UI re-renders when data changes server-side.
initLiveStream()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
