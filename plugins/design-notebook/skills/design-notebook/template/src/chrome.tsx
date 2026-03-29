import { useRef, useState, useEffect, type ReactNode } from 'react'
import type { ChromeProps, Preset } from './types'
import { StateExplorer } from './state-explorer'

const DESIGN_WIDTH = 1440

/** Renders children at DESIGN_WIDTH then applies transform:scale to fit the column. */
export function ScaledContent({ scale, children }: { scale: number; children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!innerRef.current) return
    const ro = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize[0].blockSize))
    ro.observe(innerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div style={{ height: height * scale, overflow: 'hidden' }}>
      <div
        ref={innerRef}
        style={{
          width: DESIGN_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

interface IterationChromeProps {
  chrome: ChromeProps
  children: ReactNode
  index: number
  variant?: boolean
  contentZoom?: number
  presets?: Preset[]
  activePreset?: string | null
  onPreset?: (id: string) => void
  onReset?: () => void
  stateExplorerChildren?: ReactNode
}

const SlidersIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <circle cx="8" cy="6" r="2" fill="currentColor" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <circle cx="16" cy="12" r="2" fill="currentColor" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <circle cx="11" cy="18" r="2" fill="currentColor" />
  </svg>
)

function Changes({ changes }: { changes: string[] }) {
  const adds = changes.filter(c => c.startsWith('+ ')).map(c => c.slice(2))
  const removes = changes.filter(c => c.startsWith('− ')).map(c => c.slice(2))
  return (
    <div style={{ fontSize: 13, lineHeight: 1.4, display: 'flex', flexWrap: 'wrap', gap: 8, fontWeight: 450, letterSpacing: '-0.01em' }}>
      {adds.length > 0 && (
        <span style={{ color: 'rgb(21, 128, 61)' }}>+ {adds.join(', ')}</span>
      )}
      {removes.length > 0 && (
        <span style={{ color: 'rgb(185, 28, 28)' }}>− {removes.join(', ')}</span>
      )}
    </div>
  )
}

function StatesButton({ presets, activePreset, onPreset, onReset, stateExplorerChildren }: {
  presets?: Preset[]
  activePreset?: string | null
  onPreset?: (id: string) => void
  onReset?: () => void
  stateExplorerChildren?: ReactNode
}) {
  return (
    <StateExplorer
      presets={presets ?? []}
      active={activePreset ?? null}
      onSelect={onPreset ?? (() => {})}
      onReset={onReset}
      triggerClassName={`nb-btn ${activePreset ? 'nb-btn--active' : ''}`}
      triggerContent={<SlidersIcon size={20} />}
    >
      {stateExplorerChildren}
    </StateExplorer>
  )
}

export function IterationChrome({ chrome, children, index, variant, contentZoom, presets, activePreset, onPreset, onReset, stateExplorerChildren }: IterationChromeProps) {
  const summary = chrome.summary || chrome.label
  const hasChanges = (chrome.changes?.filter(c => c.startsWith('+ ') || c.startsWith('− ')).length ?? 0) > 0

  if (variant) {
    return (
      <div className="nb-iteration nb-iteration--variant">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 2px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--nb-text)', fontFamily: 'var(--nb-font-sans)', letterSpacing: '-0.01em' }}>
              {summary}
            </span>
            <StatesButton
              presets={presets}
              activePreset={activePreset}
              onPreset={onPreset}
              onReset={onReset}
              stateExplorerChildren={stateExplorerChildren}
            />
          </div>
          {hasChanges && <Changes changes={chrome.changes!} />}
        </div>
        {contentZoom != null ? (
          <ScaledContent scale={contentZoom}>
            <div className="nb-content-card">{children}</div>
          </ScaledContent>
        ) : (
          <div className="nb-content-card">{children}</div>
        )}
      </div>
    )
  }

  return (
    <div className="nb-iteration">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, fontFamily: 'var(--nb-font-sans)' }}>
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--nb-text-dim)',
          lineHeight: 1,
          fontFamily: 'var(--nb-font-sans)',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--nb-text)', letterSpacing: '-0.01em' }}>
            {summary}
          </span>
          <StatesButton
            presets={presets}
            activePreset={activePreset}
            onPreset={onPreset}
            onReset={onReset}
            stateExplorerChildren={stateExplorerChildren}
          />
        </div>
        {hasChanges && <Changes changes={chrome.changes!} />}
      </div>
      {contentZoom != null ? (
        <ScaledContent scale={contentZoom}>
          <div className="nb-content-card">{children}</div>
        </ScaledContent>
      ) : (
        <div className="nb-content-card">{children}</div>
      )}
    </div>
  )
}
