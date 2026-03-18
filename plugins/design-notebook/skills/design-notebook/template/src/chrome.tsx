import type { ReactNode } from 'react'
import type { ChromeProps, Preset } from './types'
import { StateExplorer } from './state-explorer'

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
  return (
    <div style={{ fontSize: 13, lineHeight: 1.4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {changes.map((change, i) => {
        const isAdd = change.startsWith('+ ')
        const isRemove = change.startsWith('− ')
        return (
          <span
            key={i}
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              background: isAdd
                ? 'rgba(21, 128, 61, 0.06)'
                : isRemove
                  ? 'rgba(185, 28, 28, 0.06)'
                  : 'rgba(0,0,0,0.03)',
              color: isAdd
                ? 'rgb(21, 128, 61)'
                : isRemove
                  ? 'rgb(160, 50, 50)'
                  : 'var(--nb-text-dim)',
              fontWeight: 450,
              letterSpacing: '-0.01em',
            }}
          >
            {change}
          </span>
        )
      })}
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
        <div className="nb-content-card" style={contentZoom != null ? { zoom: contentZoom } : undefined}>
          {children}
        </div>
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
      <div className="nb-content-card" style={contentZoom != null ? { zoom: contentZoom } : undefined}>
        {children}
      </div>
    </div>
  )
}
