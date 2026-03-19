---
name: design-notebook
description: Scaffold a design iteration notebook for exploring UI concepts
  through rapid, intent-driven variation. Use when a user wants to explore
  multiple directions for a UI, track design decisions, or compare variations
  side-by-side.
---

# Design Notebook

Scaffold and run a design iteration notebook — a vertical canvas where each
iteration shows what changed and why, with side-by-side comparisons for
divergent exploration and a decision trail that records every step.

## Step 1: Choose Scaffold Path

### Path A: Standalone project (no existing React framework)

Use this when the working directory is empty or has no React framework.

The template directory is at `template/` relative to this SKILL.md file.
Use `cp` commands to copy files — do NOT read and rewrite them.

```bash
# Copy project config files
cp template/package.json template/tsconfig.json template/vite.config.ts template/index.html .

# Copy all source files
cp -r template/src .

# Copy AGENTS.md and symlink CLAUDE.md
cp template/AGENTS.md .
ln -s AGENTS.md CLAUDE.md

# Install dependencies and start dev server
npm install && npm run dev
```

### Path B: Inject into existing React project

Each notebook gets a **slug** — a lowercase-kebab-case name derived from
the user's topic (e.g. "nav redesign" → `nav-redesign`). If the user
doesn't provide one, ask.

The harness (NotebookApp, chrome, state-explorer, etc.) is shared across
all notebooks. It lives in `src/design-notebooks/_harness/` and is copied
once. Each notebook only contains its own `iterations/`, `main.tsx`, and
`index.css`.

```
src/design-notebooks/
  _harness/          ← shared, copied once from template/src
    NotebookApp.tsx
    chrome.tsx
    state-explorer.tsx
    types.ts
    notebook.css
  CLAUDE.md          ← copied once
  <slug>/            ← per notebook
    main.tsx
    index.css
    types.ts         ← re-exports from _harness/types
    iterations/
      index.ts
      baseline/
```

The template directory is at `template/` relative to this SKILL.md file.
Use `cp` commands to copy files — do NOT read and rewrite them.

**First notebook** (sets up harness + first notebook):

```bash
# Copy shared harness files
mkdir -p src/design-notebooks/_harness
cp template/src/NotebookApp.tsx template/src/chrome.tsx template/src/state-explorer.tsx template/src/types.ts template/src/notebook.css src/design-notebooks/_harness/

# Copy CLAUDE.md
cp template/AGENTS.md src/design-notebooks/CLAUDE.md

# Create the notebook
mkdir -p src/design-notebooks/<slug>/iterations
cp -r template/src/iterations/* src/design-notebooks/<slug>/iterations/
cp template/inject/main.tsx template/inject/index.css template/inject/types.ts src/design-notebooks/<slug>/
```

**Additional notebooks** (harness already exists):

```bash
mkdir -p src/design-notebooks/<slug>/iterations
cp -r template/src/iterations/* src/design-notebooks/<slug>/iterations/
cp template/inject/main.tsx template/inject/index.css template/inject/types.ts src/design-notebooks/<slug>/
```

Then wire a framework-specific entry point using the slug (see table below).

**Framework-specific entry point wiring:**

| Framework | What to create | How to wire |
|-----------|---------------|-------------|
| **Vite** | `design-notebooks/<slug>.html` at project root | Copy `template/inject/entry.html`, replace `__SLUG__` with the notebook slug. Add to `build.rollupOptions.input` in `vite.config.*` |
| **Next.js App Router** | `app/design-notebooks/<slug>/page.tsx` that imports and renders NotebookApp from `_harness/` | No config changes needed — file-based routing |
| **Next.js Pages Router** | `pages/design-notebooks/<slug>.tsx` that imports and renders NotebookApp from `_harness/` | No config changes needed — file-based routing |
| **Remix** | `app/routes/design-notebooks.<slug>.tsx` that imports and renders NotebookApp from `_harness/` | No config changes needed — file-based routing |
| **Astro** | `src/pages/design-notebooks/<slug>.astro` with `<NotebookApp client:only="react" />` | No config changes needed |

For inject entry points (Next.js, Remix, Astro), create a page component that
imports `notebook.css` from `_harness/` and renders `NotebookApp` from `_harness/`,
passing `iterations={ITERATIONS}` and `project={PROJECT}` from the notebook's
own `iterations/index.ts`. For Next.js, add `'use client'` directive.

## Step 2: Set the Project Context

After scaffolding, ask the user what they're iterating on. Use their answer
to set the `PROJECT` metadata in `iterations/index.ts`.

### Populate the baseline (Path B only)

When injecting into an existing project, the baseline iteration MUST
render the project's actual components — do not rebuild or mock them.

1. **Import the real components** into `baseline/Content.tsx`. The
   project already has working UI; wrap it with any missing context
   providers (e.g. theme, auth) so it renders correctly in isolation.
2. **Define 4-6 presets** in `baseline/definition.ts` that represent
   the component's meaningful states (loading, error, empty, edge
   cases, highlight modes). Look at the component's props and internal
   state to identify what varies.
3. **Build fine-tuning controls** in `baseline/controls.tsx` for any
   continuous values (speeds, opacities, counts) or toggles.

The baseline must look identical to the live site. If it doesn't,
something is wrong.

Then begin the iteration workflow as described in AGENTS.md.

## The Iteration Workflow

Once the notebook is scaffolded, follow the workflow documented in AGENTS.md
(which was placed in the project root during scaffolding). The core loop:

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
Append to ITERATIONS, never delete. The notebook is a scrollable timeline.

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
no shared primitives between iterations. However, iterations CAN
and SHOULD import components from the host project (Path B) — the
"no shared primitives" rule applies between iteration folders, not
between iterations and the project.

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
root `<div>`. Save immediately — HMR shows an indigo shimmer so the user
knows which cell is being worked on. Remove when done.

## Decision Trail

Write summaries as past-tense outcomes:
- Single: `'Switched to dark palette, warm neutrals'`
- Group: `'Tried 3 nav patterns: tabs, sidebar, floating'`
- Converge: `'Picked sidebar nav, dropped tabs'`
