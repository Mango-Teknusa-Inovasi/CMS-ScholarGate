import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { FeedbackProvider } from './components/ui/FeedbackProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </HelmetProvider>
  </StrictMode>,
)
