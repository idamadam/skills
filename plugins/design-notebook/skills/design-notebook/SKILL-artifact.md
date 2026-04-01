---
name: design-notebook
description: Scaffold a design iteration notebook for exploring UI concepts
  through rapid, intent-driven variation. Use when a user wants to explore
  multiple directions for a UI, track design decisions, or compare variations
  side-by-side.
---

# Design Notebook

Scaffold and run a design iteration notebook — a focused canvas that shows
one iteration at a time, with prev/next navigation, side-by-side comparisons
for divergent exploration, and a collapsible filmstrip drawer for visual
overview of every step.

This notebook renders as a single artifact file. No dev server needed.

## Step 1: Scaffold

The template directory is at `template/` relative to this SKILL.md file.
Use `cp` commands to copy files — do NOT read and rewrite them.

```bash
# Copy project config and build script
cp template/package.json template/tsconfig.json template/build-artifact.js .

# Copy all source files
cp -r template/src .
```

No `npm install` needed — the artifact renderer provides React, and the
build script uses `npx esbuild` which downloads on demand.

## Step 2: Set the Project Context

Ask the user what they're iterating on. Use their answer to set the
`PROJECT` metadata in `iterations/index.ts`:

```ts
export const PROJECT = {
  title: 'Navigation redesign',
  description: ['Exploring header patterns for the dashboard'],
}
```

## Step 3: Build and Present

1. Edit iteration files under `src/iterations/`
2. Run `npm run build:artifact` (or `node build-artifact.js`) to bundle
   everything into a single `design-notebook.jsx` file
3. Present the generated file via the `present_files` tool

**Important:** Iteration content must use **inline styles only** — there is
no Tailwind compiler in artifact mode. The notebook chrome CSS (from
`notebook.css`) is embedded automatically by the build script.

## The Iteration Workflow

After creating or editing iterations:
1. Run `npm run build:artifact` to rebuild the single-file artifact
2. Use `present_files` tool to show the generated `design-notebook.jsx`
3. Same conventions apply: append-only ITERATIONS, presets, semantic diffs

### Refine or Diverge?
When the user requests a change, ask whether to **refine** the current iteration in-place or **diverge** into a new one. Small fixes (copy, spacing, colours) usually refine; new concepts or structural changes usually diverge.

### Sharpen
Ask 2-3 clarifying questions before generating. Target: scope, tone,
constraints, reference points.

### Diverge
Generate 3-4 variations as a `{ group: [...] }` entry in ITERATIONS.
Each gets its own folder under `iterations/` with `definition.ts`,
`Content.tsx`, and `controls.tsx`.

### Converge
User picks a direction. Mark with `tag: 'picked'`, then generate next
iteration as a single entry building on the pick.

### Repeat
Append to ITERATIONS, never delete. The notebook tracks all iterations
via filmstrip navigation.

## Iteration Convention

Each iteration is a 3-file folder under `iterations/`:

```
iterations/
  baseline/
    definition.ts   # config, state shape, presets, resolvePreset
    Content.tsx      # the full mockup
    controls.tsx     # fine-tuning controls (FineTuning component)
  v2/
    definition.ts
    Content.tsx
    controls.tsx
```

When creating a new iteration, **copy the previous iteration's folder**
(`cp -r iterations/baseline/ iterations/v2/`) and edit the copy.
Do not rewrite files from scratch — start from the last iteration and
modify what changed.

Each folder is a **complete copy** — duplicate components freely,
no shared primitives between iterations.

Register each iteration in `iterations/index.ts`:
```ts
import { baseline } from './baseline/definition'
import { v2 } from './v2/definition'

export const ITERATIONS: IterationDefinitionEntry[] = [baseline, v2]
```

## Semantic Diffs

The `changes` array describes **design** shifts, not code changes.
Prefix with `+` (additions) and `−` (removals) for green/red coloring.

```ts
changes: ['+ source citations', '+ favicon pills']
changes: ['+ guided questions from v4b', '− separate approaches']
```

Keep chips to 2-5 words. Name concepts, not implementation details.

## Presets & State Explorer

Each iteration MUST define 4-6 presets as combo snapshots. This includes
the baseline — never ship an iteration with empty presets:
- Default / happy path
- Loading / in-progress
- Edge case (overflow, multi-turn)
- Error / degraded
- Empty / new

Build fine-tuning controls in `controls.tsx` with a `FineTuning` component
that takes `{ state, onChange }` props.

## Working State

Before editing any `Content.tsx`, add `className="nb-working"` to its
root `<div>`. Save immediately — HMR shows a shimmer overlay so the user
knows which iteration is being worked on. Remove when done.

## Filmstrip & History

The filmstrip is a collapsible drawer toggled via the "History" button.
It shows scaled thumbnails of all iterations with change summaries on
each card. Write summaries as past-tense outcomes:
- Single: `'Switched to dark palette, warm neutrals'`
- Group: `'Tried 3 nav patterns: tabs, sidebar, floating'`
- Converge: `'Picked sidebar nav, dropped tabs'`
