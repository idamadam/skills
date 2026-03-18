---
name: states
description: Add an in-context control panel to a React interface that reveals its hidden variations — empty states, edge-case data, role differences, loading races, overflow, error conditions — without clicking through flows. Use when a user wants to explore the complexity inside a prototype or app.
---

# States

Add a control panel to any React interface so designers and developers can quickly explore every variation the UI can produce — without clicking through flows to reach each one.

## Core Principle

**The controls must feel like a natural extension of the UI — not dev tooling bolted on.**

Do NOT add a floating overlay, a drawer that slides in from nowhere, or anything that looks like a browser extension. Instead, look at the existing UI chrome and place the trigger where settings or admin tools would naturally live. The controls appear in a popover anchored to that trigger — compact, accessible, and non-blocking so the main UI stays visible.

## Step 1: Discover — Explore the Codebase, Propose a Plan

**Enter plan mode before writing any code.** Explore the codebase to understand the app's structure, data, and state — then produce a structured discovery document for user approval.

### 1a. Map the UI structure

Explore the source files to understand the app's layout and chrome. What navigation exists? Sidebars, headers, tab bars, menus? Where do users already go to change things? Decide where the trigger will go.

### 1b. Find the dimensions of variation

Search through the codebase for hardcoded data, state management, types, and conditional rendering. For each candidate dimension, cite the specific code evidence:

- **Who is using it** — roles, permissions, account age, plan tier
- **How much data exists** — empty, sparse, typical, overflowing
- **What state things are in** — loading, error, success, pending, stale
- **What the content looks like** — short text, long text, special characters, missing fields
- **What's selected or active** — filters, sort orders, selected items, active tabs
- **Time-sensitive states** — relative dates, expiring items, scheduled events, overdue tasks

### 1c. Classify each dimension

Present each candidate in a table:

| Dimension | Evidence in code | Control type | How it would be wired |
|-----------|-----------------|--------------|----------------------|

**Only propose dimensions that have direct evidence in the existing code.** Evidence means: a hardcoded value that could vary, an existing type/enum with unused variants, a UI element that implies other states (e.g., a "Last 7 days" button implies other time ranges), or data structures that could be empty/sparse/overflowing.

Do NOT propose dimensions that require inventing new UI the app doesn't have. If the app has no loading states, no error handling, and no network layer — do not add loading spinners and error banners. If the app has no role or permission concept — do not invent one. The goal is to **reveal what's already latent**, not to design new features.

### 1d. Propose presets

List 4–6 combo presets that compose the approved dimensions into meaningful scenarios.

### 1e. Get approval

Present the plan and wait for user approval before writing code. The user may add, remove, or adjust dimensions. **Max 5 fine-tuning controls** — if you found more candidates, propose the 5 most impactful and mention the rest as optional extras.

## Step 2: Place the Trigger and Popover

### Trigger placement

Find the most natural place for the trigger within the existing UI chrome. In priority order:

1. **A sidebar or navigation rail** — Add a nav item at the bottom (like how apps put "Developer settings" in their nav), or a small icon button near a settings gear.
2. **A user/account menu** — Add an "Explore states" item in an existing dropdown.
3. **A header or toolbar** — A subtle icon button (sliders or beaker icon) in the header, styled to match the existing header items.
4. **A tab bar** — Add a small icon tab alongside existing tabs.

The trigger should look like it belongs — same font, icon size, color, and spacing as the surrounding UI elements.

### Popover panel

Clicking the trigger opens an **anchored popover panel** near the trigger:

- **Size**: ~360 px wide, max ~60 vh tall, scrollable if content overflows.
- **Position**: Anchored to the trigger element. For sidebar triggers, anchor to the right of the sidebar. For top-bar triggers, anchor below the button. Use `position: fixed` or `position: absolute` as needed to stay near the trigger.
- **Appearance**: Styled to match the app — same card background, border radius, shadow, and font as the rest of the UI. Include a small header with the title "State Explorer" and an X close button.
- **Dismiss**: Click the X button or click outside the popover to close it.
- **Non-blocking**: The main UI stays visible and interactive behind the popover. Adjusting any control updates the UI **immediately** in real-time — this is the whole point. No "apply" button.

## Step 3: Build the Controls

The popover has two sections: **combo presets** (primary, always visible) and **fine-tuning controls** (secondary, in collapsible sections).

### Primary: Combo presets

A compact grid of preset buttons at the top of the popover — always visible, not collapsible. Each preset sets multiple state dimensions at once to create a meaningful scenario.

Every app has variations of these 6 archetypes. Choose 4–6 that fit the specific UI:

1. **Empty / New** — zero data, first-time user experience
2. **Normal** — typical active usage with realistic data
3. **Power user** — admin role, max data, advanced features visible
4. **Restricted** — limited permissions, read-only access
5. **Error / Degraded** — network errors, failed fetches
6. **Stress test** — overflowing data, long text, edge-case values

Only include presets whose dimensions were approved in Step 1. If the app has no role system, skip "Restricted". If there are no error states in the code, skip "Error / Degraded".

Name each preset concisely (2-3 words). Style as a 2-column grid of small buttons with the active preset highlighted.

### Secondary: Fine-tuning controls

Below the presets, add up to 5 individual controls organized into 2-3 collapsible sections. Each section has a single-word label and a chevron — collapsed by default so presets stay the hero. Users expand a section to fine-tune one axis at a time.

Group sections by domain, not by control type. Example section names for a dashboard: Account, Data, Layout. For a chat app: Identity, Messages, Data.

#### Picking the right control type

Match each state dimension to the control that fits its data shape:

| Data shape | Control | What it looks like |
|---|---|---|
| Boolean on/off | Toggle switch | Pill-shaped switch, label on left, toggle on right |
| 2-4 mutually exclusive options | Segmented control | Row of buttons in a rounded container, active option highlighted |
| 5+ mutually exclusive options | Dropdown | Native `<select>` styled to match the app |
| Numeric range (10+ possible values) | Slider | Track with filled portion, label + current value above |
| Small integer (8 values or fewer) | Stepper | Compact [-] value [+] with disabled states at bounds |

When every dimension becomes a row of buttons, the controls look identical and the panel feels monotonous. Matching control type to data shape creates visual variety and makes each control immediately understandable.

### Control UI guidelines

- **Match the app's existing color system.** If the app uses CSS variables, use those. If it uses Tailwind theme colors, use those. Never introduce a second color system — the controls should look like they were built by the same developer who built the rest of the app.
- **Keep it compact.** Presets + collapsed section headers should fit without scrolling. Expanded sections may scroll.
- **Show the current value** for every control.

## Step 4: Wire the Controls — Derive, Don't Fabricate

Controls must actually mutate state. Refactor hardcoded data into state where needed — the UI shouldn't change visually at first, just the data source.

### Data generation rule

**Never write out variant datasets by hand.** Write small generator functions that derive from the app's existing hardcoded data. The original data is the single source of truth.

| Variant | How to generate |
|---|---|
| **Empty** | `[]` or `{}` — return empty collections |
| **Sparse** | `.slice(0, 2)` — take the first 2 items from existing data |
| **Normal** | Return the existing data unchanged — this is the baseline |
| **Overflow** | `Array.from({ length: n }, (_, i) => ({ ...existing[i % existing.length], id: \`gen-${i}\` }))` — repeat existing data with new IDs |
| **Long text** | `.map(item => ({ ...item, name: item.name + ' Worthington-Blackwell III' }))` — extend existing strings |
| **Missing fields** | `.map(item => ({ ...item, email: '', avatar: null }))` — null out fields on existing data |

This keeps variant code to ~10-20 lines instead of hundreds, stays grounded in real data, and avoids streaming large volumes of fabricated content.

### Wiring guidelines

- When a user adjusts an individual control, clear the active preset indicator. Presets show "which scenario am I in" — individual tweaks show "I've customized."
- If something is difficult to wire without major refactoring, skip it and leave a comment noting why.
- **Do not add new UI elements to existing components** beyond what is needed to display the data variants. If the app has no loading spinner, don't add one. If it has no error banner, don't add one. The explorer reveals existing UI paths — it does not build new ones.
- **Preserve the baseline.** The default state must render the app identically to the original. If you changed any hardcoded data, the "Normal" preset must restore the original appearance exactly.

## Step 5: Verify

1. **Popover positioning** — The popover appears near the trigger, does not cover the entire UI, and is dismissable by clicking outside or pressing the X button.
2. **Real-time updates** — Adjusting any control or clicking any preset updates the visible UI immediately while the popover stays open.
3. **Presets work** — Each combo preset visibly changes the UI to a distinct state.
4. **Fine-tuning works** — Expanding a section and adjusting a control produces a visible change and clears the active preset.
5. **Control variety** — The panel uses at least 2 different control types. If every control is a row of buttons, reconsider — some dimensions are better served by a toggle, slider, or dropdown.
6. **Dismissal** — Closing the popover leaves the UI in the last adjusted state.
7. **Baseline intact** — The app still works normally when the explorer is never opened. The default state is visually identical to the original app.

## Examples

### Example A: Interface with a sidebar nav

Dashboard app with a left sidebar: "Home", "Projects", "Reports".

**Good**: A small control panel icon button at the bottom of the sidebar. Clicking it opens a popover to the right of the sidebar showing a grid of presets ("Empty state", "Full data", "New user", "Stress test") and a data count slider + time range segmented control. The dashboard content updates behind the popover as you click presets.

**Bad**: A full-page replacement that hides the dashboard. A floating overlay that covers the whole screen. Adding loading spinners and error banners that the original app didn't have.

### Example B: Interface with a top nav and user avatar

Top navigation bar with logo, links, and user avatar dropdown.

**Good**: A subtle sliders icon in the top-right header area. Clicking it opens a popover anchored below the icon with presets and key controls. The page content updates in real-time while the popover is open.

**Bad**: Clicking an item that navigates to a separate settings page. A drawer that slides in and pushes content. Inventing a role system that doesn't exist in the original code.

### Example C: Simple single-page interface with minimal chrome

A single card or form with no navigation.

**Good**: A small control panel icon in the top-right corner of the card. Clicking it opens a popover with presets ("Empty form", "Validation errors", "Pre-filled") and a form state toggle. The card updates live behind the popover.

**Bad**: A separate tab that swaps the whole view. A floating draggable panel. Adding submitting/error states that the form doesn't implement.

## What This Skill is NOT

- Not a demo/presentation tool (no timelines, scenes, or scripted walkthroughs)
- Not a storybook replacement (no story files, no separate build process)
- Not a design system tool (it uses whatever the app already uses)
- Not a feature development tool — do not invent new states, UI elements, or behaviors that don't exist in the original code

It's a fast way to reveal and traverse every variation an interface can already produce, so you can check that designs hold up when the data gets weird.
