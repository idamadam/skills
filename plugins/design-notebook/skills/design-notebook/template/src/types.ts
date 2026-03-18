import type { ComponentType } from 'react'

export interface ChromeProps {
  label: string
  tag?: string
  prompt?: string
  summary?: string
  changes?: string[]
}

export interface Preset {
  id: string
  label: string
  hint: string
}

export interface IterationDefinition<S = any> {
  config: {
    label: string
    tag?: string
    prompt?: string
    summary?: string
    changes?: string[]
  }
  defaultState: S
  presets: Preset[]
  resolvePreset: (id: string) => S
  Content: ComponentType<{ state: S }>
  FineTuning?: ComponentType<{ state: S; onChange: (patch: Partial<S>) => void }>
}

export type IterationDefinitionEntry =
  | IterationDefinition
  | { group: IterationDefinition[] }
