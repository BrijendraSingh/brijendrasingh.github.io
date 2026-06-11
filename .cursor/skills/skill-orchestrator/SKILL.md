---
name: skill-orchestrator
description: >-
  Workspace-local skill orchestrator for the mr-brij personal website repo.
  Matches queries to project skills in .cursor/skills/, detects gaps, logs usage,
  and delegates to skill-gap-detector. Use on every query in this workspace when
  routing skills, checking coverage, or managing the self-learning skill system
  for the Mr. Brij site build.
recommended_model_tier: fast
---

# Skill Orchestrator (mr-brij workspace)

Manages the **workspace-scoped** skill ecosystem for this repo only. User-level skills at `~/.cursor/skills/` may supplement but must not be modified.

## Registry

Full list: `.cursor/skills/skill-orchestrator/references/skill-registry.md`

## Matching (intent-based)

1. **Exact** — query fits one project skill (e.g., "migrate Jekyll posts" → `jekyll-to-astro-migration`)
2. **Multi** — use all relevant skills (e.g., "add blog post and check brand" → `mr-brij-blog-publisher` + `mr-brij-brand-guide`)
3. **No match** — invoke `skill-gap-detector` subagent; log to `skill-gaps.json`

## Gap Protocol

```json
{
  "detected_at": "ISO-8601",
  "query_summary": "...",
  "gap_type": "domain|scope|depth",
  "closest_skill": "...",
  "resolution": "created-new|expanded-existing",
  "created_skill": "...",
  "placement": "workspace",
  "notes": "..."
}
```

Append to `.cursor/skills/_learnings/skill-gaps.json`.

## Usage Log

After each session, append to `.cursor/skills/_learnings/skill-usage-log.json`:

```json
{
  "timestamp": "ISO-8601",
  "query_summary": "...",
  "skills_triggered": ["skill-name"],
  "match_confidence": "high|medium|low",
  "user_satisfaction_signals": "positive|negative|unknown"
}
```

## Constraints

- **Only** write skills to `.cursor/skills/` in this repo
- **Never** edit `~/.cursor/skills/`, `~/.cursor/agents/`, or `~/.cursor/rules/`
- Regenerate registry after adding skills: `bash .cursor/skills/skill-orchestrator/scripts/generate-skill-registry.sh`
