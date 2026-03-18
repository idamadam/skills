import type { IterationDefinitionEntry } from '../types'
import { baseline } from './baseline/definition'

export const PROJECT = {
  title: '',
  description: [] as string[],
}

export const ITERATIONS: IterationDefinitionEntry[] = [baseline]
