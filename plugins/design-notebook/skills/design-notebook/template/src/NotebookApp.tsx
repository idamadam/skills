import { useState, useRef, useEffect } from 'react'
import { ScaledContent } from './chrome'
import { StateExplorer } from './state-explorer'
import type { IterationDefinition, IterationDefinitionEntry } from './types'

interface NotebookAppProps {
  iterations: IterationDefinitionEntry[]
  project: { title: string; description: string[] }
}

function isGroup(entry: IterationDefinitionEntry): entry is { group: IterationDefinition[] } {
  return 'group' in entry
}

const CONTENT_WIDTH = 1440
const GROUP_GAP = 12
const FILMSTRIP_CARD_WIDTH = 360
const FILMSTRIP_GAP = 16

function useContainerWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(CONTENT_WIDTH)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return width
}

/* -- Helpers -- */

function entrySummary(entry: IterationDefinitionEntry): string {
  if (isGroup(entry)) {
    const names = entry.group.map(d => (d.config.summary || d.config.label).split('—')[0].split('–')[0].trim())
    return `Exploring ${entry.group.length} directions: ${names.join(', ')}`
  }
  return (entry as IterationDefinition).config.summary || (entry as IterationDefinition).config.label
}

function entryLabel(entry: IterationDefinitionEntry): string {
  if (isGroup(entry)) return entry.group.map(d => d.config.label).join(' / ')
  return (entry as IterationDefinition).config.label
}

function entryChanges(entry: IterationDefinitionEntry): string[] | undefined {
  if (isGroup(entry)) {
    const picked = entry.group.find(d => d.config.tag === 'picked')
    return (picked ?? entry.group[0]).config.changes
  }
  return (entry as IterationDefinition).config.changes
}

/* -- Icons -- */

const SlidersIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" /><circle cx="8" cy="6" r="2" fill="currentColor" />
    <line x1="4" y1="12" x2="20" y2="12" /><circle cx="16" cy="12" r="2" fill="currentColor" />
    <line x1="4" y1="18" x2="20" y2="18" /><circle cx="11" cy="18" r="2" fill="currentColor" />
  </svg>
)

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

const FilmstripIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="5" height="14" rx="1" />
    <rect x="9.5" y="5" width="5" height="14" rx="1" />
    <rect x="17" y="5" width="5" height="14" rx="1" />
  </svg>
)

/* -- Diffstat -- */

function Diffstat({ changes }: { changes?: string[] }) {
  if (!changes || changes.length === 0) return null
  const adds = changes.filter(c => c.startsWith('+ ')).length
  const removes = changes.filter(c => c.startsWith('− ')).length
  if (adds === 0 && removes === 0) return null
  return (
    <span style={{ fontSize: 11, fontWeight: 400 }}>
      {adds > 0 && <span style={{ color: 'rgba(21, 128, 61, 0.7)' }}>+{adds}</span>}
      {adds > 0 && removes > 0 && <span style={{ color: 'var(--nb-text-dim)' }}>/</span>}
      {removes > 0 && <span style={{ color: 'rgba(185, 28, 28, 0.7)' }}>−{removes}</span>}
    </span>
  )
}

/* -- Change pills -- */

function ChangePills({ changes }: { changes?: string[] }) {
  if (!changes || changes.length === 0) return null
  const adds = changes.filter(c => c.startsWith('+ ')).map(c => c.slice(2))
  const removes = changes.filter(c => c.startsWith('− ')).map(c => c.slice(2))
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 13, fontWeight: 450 }}>
      {adds.length > 0 && (
        <span style={{ color: 'rgb(21,128,61)' }}>+ {adds.join(', ')}</span>
      )}
      {removes.length > 0 && (
        <span style={{ color: 'rgb(185,28,28)' }}>− {removes.join(', ')}</span>
      )}
    </div>
  )
}

/* -- Main app -- */

export default function NotebookApp({ iterations: ITERATIONS, project: PROJECT }: NotebookAppProps) {
  const [iterationStates, setIterationStates] = useState<Record<string, Record<string, unknown>>>({})
  const [activeIndex, setActiveIndex] = useState(ITERATIONS.length - 1)
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null)
  const [filmstripOpen, setFilmstripOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const filmstripRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)

  const activeEntry = ITERATIONS[activeIndex]

  // Scroll filmstrip to show active card
  const scrollToActive = (index: number, instant = false) => {
    if (!filmstripRef.current) return
    const card = filmstripRef.current.children[index] as HTMLElement | undefined
    if (card) card.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'nearest', inline: 'center' })
  }

  // Scroll filmstrip to active card when activeIndex changes while open
  useEffect(() => {
    if (filmstripOpen) scrollToActive(activeIndex)
  }, [activeIndex, filmstripOpen])


  const getState = (key: string, def: IterationDefinition) =>
    iterationStates[key] ?? def.defaultState

  const updateState = (key: string, def: IterationDefinition, patch: Record<string, unknown>) => {
    setIterationStates(prev => ({
      ...prev,
      [key]: { ...getState(key, def), ...patch, activePreset: null },
    }))
  }

  const handlePreset = (key: string, def: IterationDefinition, presetId: string) => {
    const resolved = def.resolvePreset(presetId)
    setIterationStates(prev => ({
      ...prev,
      [key]: { ...resolved, activePreset: presetId },
    }))
  }

  const handleReset = (key: string, def: IterationDefinition) => {
    setIterationStates(prev => ({
      ...prev,
      [key]: { ...def.defaultState, activePreset: null },
    }))
  }

  const goPrev = () => setActiveIndex(i => Math.max(0, i - 1))
  const goNext = () => setActiveIndex(i => Math.min(ITERATIONS.length - 1, i + 1))

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape') {
        setFilmstripOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  /* -- Render active content -- */

  const renderActiveContent = () => {
    const keyPrefix = `active-${activeIndex}`

    if (isGroup(activeEntry)) {
      const group = activeEntry.group
      const variantIdx = Math.min(activeVariantIndex, group.length - 1)
      const def = group[variantIdx]
      const stateKey = `${keyPrefix}-${variantIdx}`
      const state = getState(stateKey, def)

      return (
        <div className="nb-content-card">
          <def.Content state={state} />
        </div>
      )
    }

    // Single iteration
    const def = activeEntry as IterationDefinition
    const stateKey = `active-${activeIndex}`
    const state = getState(stateKey, def)

    return (
      <div className="nb-content-card">
        <def.Content state={state} />
      </div>
    )
  }

  /* -- Render filmstrip -- */

  const renderFilmstrip = () => {
    const scale = FILMSTRIP_CARD_WIDTH / CONTENT_WIDTH
    const VARIANT_CARD_WIDTH = 240

    const cards: React.ReactNode[] = []

    ITERATIONS.forEach((entry, i) => {
      const isActive = i === activeIndex
      const group = isGroup(entry)

      if (group) {
        // Group: always render variants inside a shared container
        cards.push(
          <div key={`group-${i}`} className={`nb-filmstrip-group ${isActive ? 'nb-filmstrip-group--active' : ''}`}>
            <div className="nb-filmstrip-group-label">
              <span className="nb-filmstrip-card-index">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{entrySummary(entry)}</span>
            </div>
            <div className="nb-filmstrip-group-variants">
              {entry.group.map((def, vi) => {
                const isVariantActive = isActive && vi === activeVariantIndex
                const state = getState(`filmstrip-${i}-${vi}`, def)
                const isPicked = def.config.tag === 'picked'
                const changes = def.config.changes
                return (
                  <div
                    key={vi}
                    className={`nb-filmstrip-card nb-filmstrip-card--variant ${isVariantActive ? 'nb-filmstrip-card--active' : ''}`}
                    onClick={() => { setActiveIndex(i); setActiveVariantIndex(vi) }}
                  >
                    <div className="nb-filmstrip-card-label">
                      <span>{def.config.summary || def.config.label}</span>
                      {isPicked && <span className="nb-picked-badge">Picked</span>}
                    </div>
                    <div className="nb-filmstrip-card-preview">
                      <ScaledContent scale={VARIANT_CARD_WIDTH / CONTENT_WIDTH}>
                        <div className="nb-content-card">
                          <def.Content state={state} />
                        </div>
                      </ScaledContent>
                    </div>
                    {changes && changes.length > 0 && (
                      <div className="nb-filmstrip-card-meta">
                        <ChangePills changes={changes} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      } else {
        // Single iteration
        const def = entry as IterationDefinition
        const stateKey = `filmstrip-${i}`
        const state = getState(stateKey, def)
        const changes = def.config.changes

        cards.push(
          <div
            key={i}
            className={`nb-filmstrip-card ${isActive ? 'nb-filmstrip-card--active' : ''}`}
            onClick={() => setActiveIndex(i)}
          >
            <div className="nb-filmstrip-card-label">
              <span className="nb-filmstrip-card-index">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{entrySummary(entry)}</span>
            </div>
            <div className="nb-filmstrip-card-preview">
              <ScaledContent scale={scale}>
                <div className="nb-content-card">
                  <def.Content state={state} />
                </div>
              </ScaledContent>
            </div>
            {changes && changes.length > 0 && (
              <div className="nb-filmstrip-card-meta">
                <ChangePills changes={changes} />
              </div>
            )}
          </div>
        )
      }
    })

    return (
      <div ref={filmstripRef} className="nb-filmstrip nb-scroll">
        {cards}
      </div>
    )
  }

  /* -- Get active state explorer props -- */

  const getActiveStateExplorerProps = () => {
    if (isGroup(activeEntry)) {
      const variantIdx = Math.min(activeVariantIndex, activeEntry.group.length - 1)
      const def = activeEntry.group[variantIdx]
      const stateKey = `active-${activeIndex}-${variantIdx}`
      const state = getState(stateKey, def)
      const activePreset = (state as any).activePreset ?? null
      return {
        def,
        stateKey,
        presets: def.presets,
        activePreset,
        hasFineTuning: !!def.FineTuning,
        state,
      }
    }

    const def = activeEntry as IterationDefinition
    const stateKey = `active-${activeIndex}`
    const state = getState(stateKey, def)
    const activePreset = (state as any).activePreset ?? null
    return {
      def,
      stateKey,
      presets: def.presets,
      activePreset,
      hasFineTuning: !!def.FineTuning,
      state,
    }
  }

  const stateProps = getActiveStateExplorerProps()
  const hasStateExplorer = stateProps.presets.length > 0 || stateProps.hasFineTuning

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div>
          {/* -- Chrome: header + filmstrip -- */}
          <div className="nb-chrome">
          <div className="nb-header-bar">
            <div className="nb-project-banner">
              <span>Design Notebook</span>
              <span className="nb-project-banner-title">{PROJECT.title || 'Untitled'}</span>
            </div>

            <div className="nb-iteration-nav">
              <button
                className="nb-iteration-nav-btn"
                onClick={goPrev}
                disabled={activeIndex === 0}
              >
                <ChevronLeft />
              </button>

              <span className="nb-iteration-nav-index">
                {activeIndex + 1} of {ITERATIONS.length}
              </span>

              <button
                className="nb-iteration-nav-btn"
                onClick={goNext}
                disabled={activeIndex === ITERATIONS.length - 1}
              >
                <ChevronRight />
              </button>

              {/* Filmstrip toggle */}
              <button
                className={`nb-iteration-nav-btn ${filmstripOpen ? 'nb-iteration-nav-btn--active' : ''}`}
                onClick={() => {
                  const next = !filmstripOpen
                  setFilmstripOpen(next)
                  if (next) {
                    requestAnimationFrame(() => scrollToActive(activeIndex, true))
                  }
                }}
                title="Overview"
              >
                <FilmstripIcon />
              </button>

              <div className="nb-iteration-nav-divider" />

              <span className="nb-iteration-nav-summary">
                {entrySummary(activeEntry)}
              </span>

              {hasStateExplorer && (
                <StateExplorer
                  presets={stateProps.presets}
                  active={stateProps.activePreset}
                  onSelect={(id) => handlePreset(stateProps.stateKey, stateProps.def, id)}
                  onReset={() => handleReset(stateProps.stateKey, stateProps.def)}
                  direction="down"
                  triggerClassName="nb-iteration-nav-btn"
                  triggerContent={<SlidersIcon size={14} />}
                >
                  {stateProps.hasFineTuning && stateProps.def.FineTuning && (
                    <stateProps.def.FineTuning
                      state={stateProps.state}
                      onChange={(patch) => updateState(stateProps.stateKey, stateProps.def, patch as Record<string, unknown>)}
                    />
                  )}
                </StateExplorer>
              )}
            </div>

            <a
              href="https://forms.gle/tgWrQPEvzAF2Z7rw9"
              target="_blank"
              rel="noopener noreferrer"
              className="nb-project-banner-feedback"
            >
              Share feedback
            </a>
          </div>

          {/* Filmstrip drawer */}
          <div className={`nb-filmstrip-drawer ${filmstripOpen ? 'nb-filmstrip-drawer--open' : ''}`}>
            {renderFilmstrip()}
          </div>
          </div>

          <div ref={containerRef}>
            {renderActiveContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
