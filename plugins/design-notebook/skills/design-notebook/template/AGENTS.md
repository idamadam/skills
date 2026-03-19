# Design Notebook — Iteration Workflow

A design iteration harness for exploring UI concepts through rapid,
intent-driven variation. Each iteration lives on a vertical canvas
with lightweight chrome showing what changed and why.

## Workspace Structure

Key files: `NotebookApp.tsx` (app shell), `chrome.tsx` (iteration wrapper),
`state-explorer.tsx` (preset popover), `types.ts` (shared interfaces),
`iterations/index.ts` (iteration registry + `PROJECT` metadata).

## Artifact Mode (Path C)

When building for artifact output (single `.jsx` file for Claude web app):

- **All iteration content must use inline styles** — no Tailwind utility
  classes. The notebook chrome CSS (design tokens, `.nb-*` classes) is embedded
  automatically by the build script, so harness components work as-is.
- CSS design tokens from `notebook.css` are available as CSS variables
  (e.g. `var(--nb-font-sans)`, `var(--nb-accent)`) in the artifact.
- After creating or editing iterations, rebuild: `npm run build:artifact`
- The output `design-notebook.jsx` is presented via `present_files`.
- All other conventions (append-only ITERATIONS, presets, semantic diffs,
  working state) apply identically.

## Iterations

Each iteration is a folder (`baseline/`, `v2/`, `v3/`, etc.) under
`iterations/` with three files:

```
baseline/
  definition.ts   # config, state, presets
  Content.tsx      # the full mockup
  controls.tsx     # fine-tuning controls for the state explorer
v2/                # copy of baseline/, modified freely
  definition.ts
  Content.tsx
  controls.tsx
```

Each folder is a **complete copy** — components are duplicated per
folder, no shared primitives between iterations. However, iterations
CAN and SHOULD import components from the host project — the "no
shared primitives" rule applies between iteration folders, not between
iterations and the project. To add a new iteration: copy the previous
folder, modify freely, add it to `iterations/index.ts`.

`iterations/index.ts` also exports `PROJECT` with `title` (string)
and `description` (string array) fields, displayed in the app header.
Set these when the design subject is known.

## Stack

- Vite + React 19 + TypeScript, Tailwind CSS, Base UI (popovers)
- Agentation (optional, recommended) — lets the agent mark up changes
  in the UI. Needs `agentation` installed and `<Agentation />` in `main.tsx`.

## The Intent-Driven Workflow

This is the core protocol for using the notebook.

### 1. Sharpen

When the user gives a vague design prompt, ask 2-3 clarifying questions
before generating anything. The goal is to narrow the design space so
variations are meaningfully different, not randomly different.

Good questions target: scope (what's in/out), tone (playful vs serious),
constraints (mobile-first? dark mode?), and reference points (like X but...).

### 2. Diverge

Generate 3-4 variations as a `{ group: [...] }` entry in
`ITERATIONS`. Each variation gets its own `IterationDefinition` with
a distinct `label`, `summary`, and `changes` array. Groups render
side-by-side (up to 4 columns).

```ts
{
  group: [
    { label: 'v3a', summary: 'Compact header', changes: ['+ collapsed nav', '− sidebar'] },
    { label: 'v3b', summary: 'Wide header', changes: ['+ full-width nav', '+ breadcrumbs'] },
    { label: 'v3c', summary: 'No header', changes: ['− header', '+ floating menu'] },
  ]
}
```

### 3. Converge

User picks a direction. Mark the chosen variant with `tag: 'picked'`
in its definition, then generate the next iteration as a single
entry (not a group). The summary should reference what was picked.

### 4. Repeat

The `ITERATIONS` array IS the history. Earlier entries stay
visible above — the notebook is a scrollable timeline of decisions.
Never delete previous entries; append new ones.

## Semantic Diffs

The `changes` array on each iteration describes what shifted in the
**design**, not what lines of code changed. Prefix with `+` for
additions and `−` for removals (drives green/red coloring).

Keep each chip short (2-5 words). Name the concept, not the
implementation detail:

```ts
changes: ['+ source citations', '+ favicon pills']
changes: ['+ guided questions from v4b', '+ itemized costs from v4a', '− separate approaches']
changes: ['+ "set this up for me" action', '− static cost-only cards']
```

## Single Iterations vs Groups

- **Single**: one `IterationDefinition` → full-width, centered
- **Group**: `{ group: [...] }` → columns side-by-side
- Groups for divergent exploration, singles for convergent refinement

## Presets / State Explorer

Each iteration owns its own state shape. Look at your Content.tsx and
identify the **latent variations** — things that change how the UI
looks or behaves:

- **Data states**: loading, empty, populated, error, partial failure
- **Content volume**: short response, long response, multi-turn
- **User context**: new user, power user, restricted permissions
- **Interaction states**: searching, idle, submitting

Every iteration MUST define 4-6 **presets** as combo snapshots that set
all dimensions at once for a meaningful scenario. This includes the
baseline — never ship an iteration with empty presets:

- **Default / happy path** — what most users see
- **Loading / in-progress** — things are still happening
- **Edge case** — lots of content, multiple turns, etc.
- **Error / degraded** — something went wrong
- **Empty / new** — first-time or no-data state

Build **fine-tuning controls** in `controls.tsx` — export a
`FineTuning` component with `{ state, onChange }` props, then wire it
into the iteration's `definition.ts` as the `FineTuning` field on
`IterationDefinition`. Read the latest iteration's files for the
exact pattern.

## Decision Trail

The decision trail is auto-generated from `config.summary` and
`config.changes`. Write summaries as past-tense outcomes, not tasks:

- **Single**: `'Switched to dark palette, warm neutrals'` (not `'Added dark mode'`)
- **Group**: `'Tried 3 nav patterns: tabs, sidebar, floating'`
- **Converge**: `'Picked sidebar nav, dropped tabs'`

## Working State

**Any time you are about to edit a Content.tsx**, add `className="nb-working"`
to that file's root `<div>` as your very first edit. This applies whether
you are creating a new iteration or modifying an existing one. Save the
file immediately — HMR will fire and show an indigo glow + dim so the
user knows which cell is being worked on.

When **generating a new iteration**:

1. Add `className="nb-working"` to the current latest iteration's
   root `<div>` in Content.tsx. Save.
2. Write the new iteration files.
3. Remove `className="nb-working"` from the old Content.tsx.
4. Update `iterations/index.ts` to add the new iteration.

When **editing an existing iteration**:

1. Add `className="nb-working"` to that iteration's root `<div>`.
2. Make your changes.
3. Remove `className="nb-working"` when done.

The class is defined in `notebook.css` — no inline styles needed.
