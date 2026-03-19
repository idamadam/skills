import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import type { Preset } from './types'

const ResetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
)

interface StateExplorerProps {
  presets: Preset[]
  active: string | null
  onSelect: (id: string) => void
  onReset?: () => void
  triggerClassName?: string
  triggerContent?: ReactNode
  children?: ReactNode
}

export function StateExplorer({ presets, active, onSelect, onReset, triggerClassName, triggerContent, children }: StateExplorerProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  const clampToViewport = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.left < 16) el.style.right = `${rect.left - 16}px`
  }, [])

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        className={triggerClassName}
        style={triggerContent ? { border: 'none', padding: 4 } : undefined}
        onClick={() => setOpen(o => !o)}
      >
        {triggerContent ?? 'states'}
      </button>
      {open && (
        <div ref={clampToViewport} className="nb-state-explorer" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 50 }}>
          <div className="nb-state-explorer-header">
            <span className="nb-state-explorer-title">State Explorer</span>
          </div>
          {presets.length === 0 ? (
            <div className="nb-state-explorer-empty">
              <span>No states yet</span>
              <span>States will show up here after you add a first iteration.</span>
            </div>
          ) : (
            <div className="nb-state-explorer-grid">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`nb-state-preset ${active === p.id ? 'nb-state-preset--active' : ''}`}
                >
                  <div className="nb-state-preset-label">{p.label}</div>
                  <div className="nb-state-preset-hint">{p.hint}</div>
                </button>
              ))}
            </div>
          )}
          {children}
          {onReset && presets.length > 0 && (
            <button
              onClick={onReset}
              className="nb-state-explorer-reset"
            >
              <ResetIcon />
              <span>Reset to default</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
