# Design Notebook — Getting Started

A skill for exploring UI concepts through rapid, intent-driven iteration. Each iteration lives on a vertical canvas showing what changed and why, with side-by-side comparisons and a decision trail.

## Claude Code

Run these in the Claude Code chat:

1. `/plugin marketplace add idamadam/skills`
2. `/plugin install design-notebook@idam-skills`
3. `/reload-plugins` to activate

Then ask:
- "Set up an iteration notebook for this project"
- `/design-notebook:design-notebook`

## Other agents (Cursor, Codex, etc.)

Run in your project directory:

```
npx skills add idamadam/skills --skill design-notebook
```

The agent will look for the best place to set it up in your project.

## Claude.ai webapp

1. Download the `design-notebook-*.zip` file from https://github.com/idamadam/skills/releases/latest
2. Go to https://claude.ai/customize/skills — click the + icon next to the search icon, upload the zip
3. Start a conversation and run `/design-notebook`
