import { type ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import type { Preset } from './types'

const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
)

const CheckIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ChevronDown = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

function PresetCard({ preset, isActive, onClick }: {
  preset: Preset
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`nb-state-preset ${isActive ? 'nb-state-preset--active' : ''}`}
    >
      <div className="nb-state-preset-content">
        <div className="nb-state-preset-label">{preset.label}</div>
        {preset.hint && (
          <div className="nb-state-preset-hint">{preset.hint}</div>
        )}
      </div>
      {isActive && (
        <span className="nb-state-preset-check">
          <CheckIcon size={12} />
        </span>
      )}
    </button>
  )
}

interface StateExplorerProps {
  presets: Preset[]
  active: string | null
  onSelect: (id: string) => void
  onReset?: () => void
  triggerClassName?: string
  triggerContent?: ReactNode
  children?: ReactNode
  direction?: 'up' | 'down'
}

export function StateExplorer({ presets, active, onSelect, onReset, triggerClassName, triggerContent, children, direction = 'down' }: StateExplorerProps) {
  const [open, setOpen] = useState(false)
  const [fineTuningOpen, setFineTuningOpen] = useState(true)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const hasFineTuning = !!children

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
        style={triggerContent ? { border: 'none', padding: 4, background: 'none', cursor: 'pointer' } : undefined}
        onClick={() => setOpen(o => !o)}
      >
        {triggerContent ?? 'states'}
      </button>
      {open && (
        <div ref={clampToViewport} className="nb-state-explorer" style={{ position: 'absolute', ...(direction === 'up' ? { bottom: '100%', marginBottom: 6 } : { top: '100%', marginTop: 6 }), right: 0, zIndex: 50 }}>
          {/* Presets section */}
          {presets.length > 0 ? (
            <div className="nb-state-explorer-section">
              <div className="nb-state-explorer-section-header">
                <span className="nb-state-explorer-section-title">Presets</span>
                {onReset && (
                  <button onClick={onReset} className="nb-state-explorer-reset">
                    <ResetIcon />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <div className="nb-state-explorer-presets">
                {presets.map((p) => (
                  <PresetCard
                    key={p.id}
                    preset={p}
                    isActive={active === p.id}
                    onClick={() => onSelect(p.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="nb-state-explorer-empty">
              <span>No states yet</span>
              <span>States will show up here after you add a first iteration.</span>
            </div>
          )}

          {/* Controls section */}
          {hasFineTuning && (
            <>
              <div className="nb-state-explorer-divider" />
              <div className="nb-state-explorer-section">
                <button
                  className="nb-state-explorer-controls-toggle"
                  onClick={() => setFineTuningOpen(o => !o)}
                >
                  <span className="nb-state-explorer-section-title">Controls</span>
                  <span className={`nb-state-explorer-controls-chevron ${!fineTuningOpen ? 'nb-state-explorer-controls-chevron--collapsed' : ''}`}>
                    <ChevronDown size={12} />
                  </span>
                </button>
                <div className={`nb-state-explorer-controls-body ${fineTuningOpen ? 'nb-state-explorer-controls-body--open' : 'nb-state-explorer-controls-body--closed'}`}>
                  {children}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
