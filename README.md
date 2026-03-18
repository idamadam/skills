# Skills (by idamadam)

Skills that help designers get more out of AI coding agents, distributed via [skills.sh](https://skills.sh).

## Available Skills

| Skill | Description |
|-------|-------------|
| `states` | Add an in-context control panel to a React interface that reveals its hidden variations — empty states, edge-case data, role differences, loading races, overflow, error conditions — without clicking through flows. |
| `design-notebook` | Scaffold a design iteration notebook for exploring UI concepts through rapid, intent-driven variation — side-by-side comparisons, semantic diffs, and a decision trail that records every step. |

## Install

```bash
npx skills add idamadam/skills
```

To install a specific skill:

```bash
npx skills add idamadam/skills --skill states
npx skills add idamadam/skills --skill design-notebook
```

## Manual Install

Download the latest zip from [GitHub Releases](https://github.com/idamadam/skills/releases), then unzip into your project's skills directory:

```bash
unzip design-notebook-v*.zip -d .claude/skills/
```

This places the skill at `.claude/skills/design-notebook/` — Claude Code will pick it up automatically.

## Learn More

Read more about States at [idamadam.com/states](https://idamadam.com/states).
