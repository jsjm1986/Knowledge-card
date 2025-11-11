import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 初始化主题：遵循系统偏好
try {
  const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
  document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
