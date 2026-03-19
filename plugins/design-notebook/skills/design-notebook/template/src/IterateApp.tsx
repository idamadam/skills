import { useState } from 'react'
import { IterationChrome } from './chrome'
import { StateExplorer } from './state-explorer'
import type { ChromeProps, Preset, IterationDefinition, IterationDefinitionEntry } from './types'
import { ITERATIONS, PROJECT } from './iterations'

function isGroup(entry: IterationDefinitionEntry): entry is { group: IterationDefinition[] } {
  return 'group' in entry
}

const CONTENT_WIDTH = 1440
const GROUP_GAP = 12

function chromeFromDef(def: IterationDefinition): ChromeProps {
  return {
    label: def.config.label,
    tag: def.config.tag,
    prompt: def.config.prompt,
    summary: def.config.summary,
    changes: def.config.changes,
  }
}

/* -- Change pills (shown when a trail step is expanded) -- */

function ChangePills({ changes }: { changes?: string[] }) {
  if (!changes || changes.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {changes.map((change, i) => {
        const isAdd = change.startsWith('+ ')
        const isRemove = change.startsWith('− ')
        return (
          <span key={i} style={{
            fontSize: 11, padding: '1px 7px', borderRadius: 10,
            background: isAdd ? 'rgba(21,128,61,0.06)' : isRemove ? 'rgba(185,28,28,0.06)' : 'rgba(0,0,0,0.03)',
            color: isAdd ? 'rgb(21,128,61)' : isRemove ? 'rgb(160,50,50)' : 'var(--nb-text-dim)',
            fontWeight: 450,
          }}>
            {change}
          </span>
        )
      })}
    </div>
  )
}

/* -- Diffstat counters -- */

function Diffstat({ changes }: { changes?: string[] }) {
  if (!changes || changes.length === 0) return null
  const adds = changes.filter(c => c.startsWith('+ ')).length
  const removes = changes.filter(c => c.startsWith('− ')).length
  if (adds === 0 && removes === 0) return null
  return (
    <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 400 }}>
      {adds > 0 && <span style={{ color: 'rgba(21, 128, 61, 0.7)' }}>+{adds}</span>}
      {adds > 0 && removes > 0 && <span style={{ color: 'var(--nb-text-dim)' }}>/</span>}
      {removes > 0 && <span style={{ color: 'rgba(185, 28, 28, 0.7)' }}>−{removes}</span>}
    </span>
  )
}

/* -- Decision trail step summary -- */

function shortName(summary: string): string {
  return summary.split('—')[0].split('–')[0].trim()
}

function trailSummary(entry: IterationDefinitionEntry): string {
  if (isGroup(entry)) {
    const picked = entry.group.find(d => d.config.tag === 'picked')
    const names = entry.group.map(d => shortName(d.config.summary || d.config.label)).join(', ')
    if (picked) {
      return `Tried ${entry.group.length} directions: ${names}`
    }
    return `Exploring ${entry.group.length} directions: ${names}`
  }
  const def = entry as IterationDefinition
  return def.config.summary || def.config.label
}

function trailChanges(entry: IterationDefinitionEntry): string[] | undefined {
  if (isGroup(entry)) {
    const picked = entry.group.find(d => d.config.tag === 'picked')
    return (picked ?? entry.group[0]).config.changes
  }
  return (entry as IterationDefinition).config.changes
}


/* -- Main app -- */

export default function IterateApp() {
  const [iterationStates, setIterationStates] = useState<Record<string, Record<string, unknown>>>({})
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null)

  const latest = ITERATIONS[ITERATIONS.length - 1]
  const history = ITERATIONS.slice(0, -1)

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

  const renderIteration = (def: IterationDefinition, stateKey: string, index: number, variant?: boolean, contentZoom?: number) => {
    const state = getState(stateKey, def)
    const activePreset = (state as any).activePreset ?? null

    return (
      <IterationChrome
        key={stateKey}
        chrome={chromeFromDef(def)}
        index={index}
        variant={variant}
        contentZoom={contentZoom}
        presets={def.presets}
        activePreset={activePreset}
        onPreset={(id) => handlePreset(stateKey, def, id)}
        onReset={() => handleReset(stateKey, def)}
        stateExplorerChildren={
          def.FineTuning ? (
            <def.FineTuning
              state={state}
              onChange={(patch) => updateState(stateKey, def, patch as Record<string, unknown>)}
            />
          ) : undefined
        }
      >
        <def.Content state={state} />
      </IterationChrome>
    )
  }

  const renderEntry = (entry: IterationDefinitionEntry, keyPrefix: string, editorialIndex: number) => {
    if (isGroup(entry)) {
      const n = entry.group.length
      const availableContent = CONTENT_WIDTH - GROUP_GAP * (n - 1)
      const columnWidth = availableContent / n
      const cardZoom = columnWidth / CONTENT_WIDTH
      return (
        <div>
          <div style={{ marginBottom: 8, fontFamily: 'var(--nb-font-sans)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--nb-text-dim)', lineHeight: 1 }}>
              {String(editorialIndex + 1).padStart(2, '0')}
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gap: GROUP_GAP,
          }}>
            {entry.group.map((def, colIndex) => (
              <div key={colIndex} style={{ minWidth: 0, overflow: 'hidden' }}>
                {renderIteration(def, `${keyPrefix}-${colIndex}`, editorialIndex, true, cardZoom)}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return renderIteration(entry, keyPrefix, editorialIndex)
  }

  const SlidersIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><circle cx="8" cy="6" r="2" fill="currentColor" />
      <line x1="4" y1="12" x2="20" y2="12" /><circle cx="16" cy="12" r="2" fill="currentColor" />
      <line x1="4" y1="18" x2="20" y2="18" /><circle cx="11" cy="18" r="2" fill="currentColor" />
    </svg>
  )

  const renderContentWithStates = (def: IterationDefinition, stateKey: string, label?: string) => {
    const state = getState(stateKey, def)
    const activePreset = (state as any).activePreset ?? null

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px 6px' }}>
          {label && (
            <span style={{ fontSize: 12, fontWeight: 450, color: 'var(--nb-text-muted)', fontFamily: 'var(--nb-font-sans)' }}>
              {label}
            </span>
          )}
          {def.presets.length > 0 && (
            <StateExplorer
              presets={def.presets}
              active={activePreset}
              onSelect={(id) => handlePreset(stateKey, def, id)}
              onReset={() => handleReset(stateKey, def)}
              triggerClassName={`nb-btn ${activePreset ? 'nb-btn--active' : ''}`}
              triggerContent={<SlidersIcon />}
            >
              {def.FineTuning && (
                <def.FineTuning
                  state={state}
                  onChange={(patch) => updateState(stateKey, def, patch as Record<string, unknown>)}
                />
              )}
            </StateExplorer>
          )}
        </div>
        <div className="nb-content-card">
          <def.Content state={state} />
        </div>
      </div>
    )
  }

  const renderHistoryContent = (entry: IterationDefinitionEntry, keyPrefix: string) => {
    if (isGroup(entry)) {
      const n = entry.group.length
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${n}, 1fr)`,
          gap: GROUP_GAP,
        }}>
          {entry.group.map((def, colIndex) => (
            <div key={colIndex} style={{ minWidth: 0, overflow: 'hidden' }}>
              {renderContentWithStates(def, `${keyPrefix}-${colIndex}`, def.config.label)}
            </div>
          ))}
        </div>
      )
    }

    return renderContentWithStates(entry as IterationDefinition, keyPrefix)
  }

  // Compute editorial indices for each entry
  const entryIndices = ITERATIONS.map((_, i) => i)
  const latestIndex = entryIndices.length - 1

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '36px 44px' }}>
          {/* -- Latest iteration (prominent) -- */}
          <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto', marginBottom: 48 }}>
            {/* Project context */}
            <div style={{
              marginBottom: 24,
              fontFamily: 'var(--nb-font-sans)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--nb-text-dim)',
                  lineHeight: 1,
                  fontFamily: 'var(--nb-font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  Design Notebook
                  <a href="https://www.linkedin.com/in/idamadam/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 400, opacity: 0.5, marginLeft: 6, color: 'inherit', textDecoration: 'none' }}>by Idam Adam</a>
                </span>
                <h1 style={{
                  fontSize: 32,
                  fontWeight: 400,
                  color: PROJECT.title ? 'var(--nb-text)' : 'var(--nb-text-dim)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1.2,
                  fontFamily: "'Instrument Serif', serif",
                }}>
                  {PROJECT.title || 'Untitled project'}
                </h1>
              </div>
              <a
                href="https://google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="nb-feedback-link"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--nb-text)',
                  fontFamily: 'var(--nb-font-sans)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  border: '1px solid var(--nb-border)',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  marginTop: 2,
                }}
              >
                Share feedback
              </a>
            </div>

            {renderEntry(latest, 'latest', latestIndex)}
          </div>

          {/* -- Decision trail -- */}
            <div style={{ maxWidth: CONTENT_WIDTH, margin: '0 auto' }}>
              <div style={{ maxWidth: 560, margin: '0 auto' }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--nb-text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                  fontFamily: 'var(--nb-font-sans)',
                }}>
                  Decision trail
                </div>
              </div>
              {history.length === 0 ? (
                <div style={{ maxWidth: 560, margin: '0 auto' }}>
                  <span style={{
                    fontSize: 13,
                    color: 'var(--nb-text-dim)',
                    fontFamily: 'var(--nb-font-sans)',
                    }}>
                    No decisions yet — iterations will appear here as you explore.
                  </span>
                </div>
              ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[...history].reverse().map((entry, i) => {
                  const originalIndex = history.length - 1 - i
                  const isExpanded = expandedHistoryIndex === originalIndex
                  const changes = trailChanges(entry)

                  return (
                    <div key={originalIndex}>
                      <div style={{ maxWidth: 560, margin: '0 auto' }}>
                        <div
                          onClick={() => setExpandedHistoryIndex(isExpanded ? null : originalIndex)}
                          style={{
                            fontSize: 14,
                            color: 'var(--nb-text)',
                            fontFamily: 'var(--nb-font-sans)',
                            lineHeight: 1.7,
                            cursor: 'pointer',
                            padding: '3px 6px',
                            margin: '0 -6px',
                            borderRadius: 6,
                            transition: 'background 0.15s ease',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 6,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <span style={{
                            fontSize: 8,
                            color: 'var(--nb-border)',
                            transition: 'transform 0.15s ease',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}>
                            ▶
                          </span>
                          <span>
                            <span style={{ color: 'var(--nb-text-dim)', marginRight: 8, fontSize: 12 }}>
                              {String(originalIndex + 1).padStart(2, '0')}
                            </span>
                            {trailSummary(entry)}
                            <Diffstat changes={changes} />
                          </span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '8px 0 24px' }}>
                          <div style={{ maxWidth: 560, margin: '0 auto 8px' }}>
                            <ChangePills changes={changes} />
                          </div>
                          {renderHistoryContent(entry, `history-${originalIndex}`)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}
