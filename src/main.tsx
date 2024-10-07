import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import Register from './pages/Register.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Register />
  </StrictMode>,
)
