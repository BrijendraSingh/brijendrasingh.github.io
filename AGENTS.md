# Mr. Brij — Agent & Skill Guide

Personal website for **Brijendra Singh** (Mr. Brij) — software quality practitioner, 14+ years.

**Live site (target):** https://brijendrasingh.github.io/

## Quick Start for Agents

1. Read `docs/PLAN.md` or `.cursor/plans/mr_brij_astro_site_e42034d2.plan.md`
2. Follow `.cursor/rules/plan-execution.mdc` — maps each plan todo to skill + subagent
3. Check `.cursor/skills/skill-orchestrator/references/skill-registry.md`
4. Follow `mr-brij-orchestrator` skill for routing
5. Never modify `~/.cursor/` — workspace scope only

## Execute the Plan (user copy-paste)

```
Execute @.cursor/plans/mr_brij_astro_site_e42034d2.plan.md phase by phase.
Follow @.cursor/rules/plan-execution.mdc — read workspace skills and delegate
to subagents per the routing table. Start with todo: scaffold.
```

## Specialists

| Agent | Use for |
|-------|---------|
| `mr-brij-orchestrator` | Coordinate multi-phase site work |
| `astro-site-builder` | Astro scaffold, layouts, pages |
| `blog-migrator` | Jekyll → Astro post migration |
| `seo-deploy-agent` | GitHub Pages, SEO, launch |
| `brand-alignment-reviewer` | Copy and design brand check |
| `skill-gap-detector` | Auto-create missing workspace skills |

## Locked Config

- LinkedIn: https://www.linkedin.com/in/brijendrapsingh/
- Contact source: `src/config/site.ts` (template: `references/site-config.ts`)

## Self-Learning

| File | Purpose |
|------|---------|
| `.cursor/skills/_learnings/skill-gaps.json` | Detected skill gaps |
| `.cursor/skills/_learnings/skill-usage-log.json` | Per-session skill usage |
| `.cursor/skills/_learnings/skill-performance.json` | Aggregate metrics |

Regenerate registry after adding skills:

```bash
bash .cursor/skills/skill-orchestrator/scripts/generate-skill-registry.sh
```
