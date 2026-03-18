import type { IterationDefinition } from '../../types'
import { Content } from './Content'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type BaselineState = Record<string, never>

export const baseline: IterationDefinition<BaselineState> = {
  config: {
    label: 'Get started',
  },
  defaultState: {} as BaselineState,
  // REPLACE: Define 4-6 presets for this iteration's meaningful states.
  // See AGENTS.md "Presets / State Explorer" section.
  presets: [],
  resolvePreset() {
    return {} as BaselineState
  },
  Content,
}
