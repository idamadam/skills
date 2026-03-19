import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import NotebookApp from './NotebookApp'
import { ITERATIONS, PROJECT } from './iterations'

const Agentation = lazy(() =>
  import('agentation').then(m => ({ default: m.Agentation })).catch(() => ({ default: () => null }))
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotebookApp iterations={ITERATIONS} project={PROJECT} />
    <Suspense>
      <Agentation />
    </Suspense>
  </StrictMode>,
)
