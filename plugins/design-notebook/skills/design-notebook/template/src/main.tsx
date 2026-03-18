import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import IterateApp from './IterateApp'

const Agentation = lazy(() =>
  import('agentation').then(m => ({ default: m.Agentation })).catch(() => ({ default: () => null }))
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IterateApp />
    <Suspense>
      <Agentation />
    </Suspense>
  </StrictMode>,
)
