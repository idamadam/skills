import { useState, useRef, useEffect, useCallback } from 'react'
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
const FILMSTRIP_CARD_WIDTH = 360

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
    return `Exploring ${entry.group.length} directions`
  }
  return (entry as IterationDefinition).config.summary || (entry as IterationDefinition).config.label
}

/* -- Icons -- */

const SlidersIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
  </svg>
)

const ClockIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

const FeedbackIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
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

/* -- Change pills -- */

function ChangePills({ changes }: { changes?: string[] }) {
  if (!changes || changes.length === 0) return null
  const adds = changes.filter(c => c.startsWith('+ ')).map(c => c.slice(2))
  const removes = changes.filter(c => c.startsWith('− ')).map(c => c.slice(2))
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 13, fontWeight: 450 }}>
      {adds.length > 0 && (
        <span style={{ color: 'var(--nb-diff-add)' }}>+ {adds.join(', ')}</span>
      )}
      {removes.length > 0 && (
        <span style={{ color: 'var(--nb-diff-remove)' }}>− {removes.join(', ')}</span>
      )}
    </div>
  )
}

/* -- Filmstrip cards with staggered entrance -- */

function FilmstripCard({ isActive, onClick, children, animDelay }: {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
  animDelay: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay)
    return () => clearTimeout(t)
  }, [animDelay])

  return (
    <div
      className={`nb-filmstrip-card ${isActive ? 'nb-filmstrip-card--active' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease-out, transform 0.2s ease-out',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function FilmstripVariantCard({ isActive, onClick, children, animDelay }: {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
  animDelay: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay)
    return () => clearTimeout(t)
  }, [animDelay])

  return (
    <div
      className={`nb-filmstrip-card nb-filmstrip-card--variant ${isActive ? 'nb-filmstrip-card--active' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease-out, transform 0.2s ease-out',
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/* -- Main app -- */

export default function NotebookApp({ iterations: ITERATIONS, project: PROJECT }: NotebookAppProps) {
  const [iterationStates, setIterationStates] = useState<Record<string, Record<string, unknown>>>({})
  const [activeIndex, setActiveIndex] = useState(ITERATIONS.length - 1)
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)
  const [filmstripOpen, setFilmstripOpen] = useState(false)
  const [filmstripKey, setFilmstripKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const filmstripRef = useRef<HTMLDivElement>(null)
  useContainerWidth(containerRef)

  // Clamp activeIndex if ITERATIONS shrinks
  useEffect(() => {
    if (activeIndex >= ITERATIONS.length) {
      setActiveIndex(Math.max(0, ITERATIONS.length - 1))
    }
  }, [ITERATIONS.length, activeIndex])

  const safeIndex = Math.min(activeIndex, ITERATIONS.length - 1)
  const activeEntry = ITERATIONS[safeIndex]

  // Scroll filmstrip to show active card
  const scrollToActive = (index: number, instant = false) => {
    if (!filmstripRef.current) return
    const card = filmstripRef.current.children[index] as HTMLElement | undefined
    if (card) card.scrollIntoView({ behavior: instant ? 'instant' : 'smooth', block: 'nearest', inline: 'center' })
  }

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
    setIterationStates(prev => ({ ...prev, [key]: { ...resolved, activePreset: presetId } }))
  }

  const handleReset = (key: string, def: IterationDefinition) => {
    setIterationStates(prev => ({ ...prev, [key]: { ...def.defaultState, activePreset: null } }))
  }

  // Variant-aware navigation
  const goPrev = useCallback(() => {
    if (isGroup(activeEntry) && activeVariantIndex > 0) {
      setActiveVariantIndex(v => v - 1)
    } else if (activeIndex > 0) {
      const prevEntry = ITERATIONS[activeIndex - 1]
      setActiveIndex(activeIndex - 1)
      if (isGroup(prevEntry)) {
        setActiveVariantIndex(prevEntry.group.length - 1)
      } else {
        setActiveVariantIndex(0)
      }
    }
  }, [activeEntry, activeVariantIndex, activeIndex, ITERATIONS])

  const goNext = useCallback(() => {
    if (isGroup(activeEntry) && activeVariantIndex < activeEntry.group.length - 1) {
      setActiveVariantIndex(v => v + 1)
    } else if (activeIndex < ITERATIONS.length - 1) {
      setActiveIndex(activeIndex + 1)
      setActiveVariantIndex(0)
    }
  }, [activeEntry, activeVariantIndex, activeIndex, ITERATIONS])

  const isAtStart = activeIndex === 0 && (!isGroup(activeEntry) || activeVariantIndex === 0)
  const isAtEnd = activeIndex === ITERATIONS.length - 1 && (!isGroup(activeEntry) || activeVariantIndex === activeEntry.group.length - 1)

  const variantSuffix = isGroup(activeEntry)
    ? String.fromCharCode(97 + Math.min(activeVariantIndex, activeEntry.group.length - 1))
    : ''
  const pageLabel = `${activeIndex + 1}${variantSuffix}`

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Escape') setFilmstripOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goPrev, goNext])

  /* -- Render active content -- */

  const renderActiveContent = () => {
    if (isGroup(activeEntry)) {
      const variantIdx = Math.min(activeVariantIndex, activeEntry.group.length - 1)
      const def = activeEntry.group[variantIdx]
      const state = getState(`active-${activeIndex}-${variantIdx}`, def)
      return <div className="nb-content-card"><def.Content state={state} /></div>
    }
    const def = activeEntry as IterationDefinition
    const state = getState(`active-${activeIndex}`, def)
    return <div className="nb-content-card"><def.Content state={state} /></div>
  }

  /* -- Render filmstrip -- */

  const renderFilmstrip = () => {
    const scale = FILMSTRIP_CARD_WIDTH / CONTENT_WIDTH
    const VARIANT_CARD_WIDTH = 240
    let cardIndex = 0

    return (
      <div ref={filmstripRef} className="nb-filmstrip nb-scroll" key={filmstripKey}>
        {ITERATIONS.map((entry, i) => {
          const isActive = i === activeIndex

          if (isGroup(entry)) {
            const groupDelay = cardIndex * 40
            cardIndex++
            return (
              <div
                key={`group-${i}`}
                className={`nb-filmstrip-group ${isActive ? 'nb-filmstrip-group--active' : ''}`}
                style={{
                  opacity: 0,
                  animation: `nb-stagger-in 0.2s ease-out ${groupDelay}ms forwards`,
                }}
              >
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
                      <FilmstripVariantCard
                        key={vi}
                        isActive={isVariantActive}
                        onClick={() => { setActiveIndex(i); setActiveVariantIndex(vi) }}
                        animDelay={groupDelay + (vi + 1) * 30}
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
                      </FilmstripVariantCard>
                    )
                  })}
                </div>
              </div>
            )
          }

          const def = entry as IterationDefinition
          const state = getState(`filmstrip-${i}`, def)
          const delay = cardIndex * 40
          cardIndex++
          return (
            <FilmstripCard
              key={i}
              isActive={isActive}
              onClick={() => setActiveIndex(i)}
              animDelay={delay}
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
              {def.config.changes && def.config.changes.length > 0 && (
                <div className="nb-filmstrip-card-meta">
                  <ChangePills changes={def.config.changes} />
                </div>
              )}
            </FilmstripCard>
          )
        })}
      </div>
    )
  }

  /* -- State explorer props -- */

  const getActiveStateExplorerProps = () => {
    if (isGroup(activeEntry)) {
      const variantIdx = Math.min(activeVariantIndex, activeEntry.group.length - 1)
      const def = activeEntry.group[variantIdx]
      const stateKey = `active-${activeIndex}-${variantIdx}`
      const state = getState(stateKey, def)
      return { def, stateKey, presets: def.presets, activePreset: (state as any).activePreset ?? null, hasFineTuning: !!def.FineTuning, state }
    }
    const def = activeEntry as IterationDefinition
    const stateKey = `active-${activeIndex}`
    const state = getState(stateKey, def)
    return { def, stateKey, presets: def.presets, activePreset: (state as any).activePreset ?? null, hasFineTuning: !!def.FineTuning, state }
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
              {/* Left: identity */}
              <div className="nb-project-banner">
                <span>Design Notebook</span>
                <span className="nb-project-banner-title">{PROJECT.title || 'Untitled'}</span>
              </div>

              {/* Center: pagination + summary */}
              <div className="nb-header-center">
                <button
                  className="nb-iteration-nav-btn"
                  onClick={goPrev}
                  disabled={isAtStart}
                >
                  <ChevronLeft />
                </button>

                <span className="nb-iteration-nav-summary">
                  {entrySummary(activeEntry)}
                </span>

                <span className="nb-iteration-nav-index">
                  {pageLabel} / {ITERATIONS.length}
                </span>

                <button
                  className="nb-iteration-nav-btn"
                  onClick={goNext}
                  disabled={isAtEnd}
                >
                  <ChevronRight />
                </button>
              </div>

              {/* Right: History + States + Feedback */}
              <div className="nb-header-right">
                <button
                  className={`nb-chrome-btn ${filmstripOpen ? 'nb-chrome-btn--active' : ''}`}
                  onClick={() => {
                    const next = !filmstripOpen
                    setFilmstripOpen(next)
                    if (next) {
                      setFilmstripKey(k => k + 1)
                      requestAnimationFrame(() => scrollToActive(activeIndex, true))
                    }
                  }}
                >
                  <ClockIcon size={14} />
                  <span>History</span>
                </button>

                {hasStateExplorer && (
                  <StateExplorer
                    presets={stateProps.presets}
                    active={stateProps.activePreset}
                    onSelect={(id) => handlePreset(stateProps.stateKey, stateProps.def, id)}
                    onReset={() => handleReset(stateProps.stateKey, stateProps.def)}
                    direction="down"
                    triggerContent={
                      <span className="nb-chrome-btn">
                        <SlidersIcon size={14} />
                        <span>States</span>
                      </span>
                    }
                  >
                    {stateProps.hasFineTuning && stateProps.def.FineTuning && (
                      <stateProps.def.FineTuning
                        state={stateProps.state}
                        onChange={(patch) => updateState(stateProps.stateKey, stateProps.def, patch as Record<string, unknown>)}
                      />
                    )}
                  </StateExplorer>
                )}

                <a
                  href="https://forms.gle/tgWrQPEvzAF2Z7rw9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nb-chrome-btn"
                >
                  <FeedbackIcon size={14} />
                  <span>Feedback</span>
                </a>
              </div>
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
