#!/usr/bin/env bash
# Regenerate workspace skill registry from .cursor/skills/*/SKILL.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SKILLS_DIR="$ROOT/skills"
OUT="$ROOT/skills/skill-orchestrator/references/skill-registry.md"
DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

{
  echo "# Skill Registry (mr-brij workspace)"
  echo ""
  echo "> Auto-generated. Run: \`bash .cursor/skills/skill-orchestrator/scripts/generate-skill-registry.sh\`"
  echo "> Last updated: $DATE"
  echo ""
  echo "## Workspace Skills (\`.cursor/skills/\`)"
  echo ""
  echo "| Name | Description | Path |"
  echo "|------|-------------|------|"

  n=0
  for skill in "$SKILLS_DIR"/*/SKILL.md; do
    [[ -f "$skill" ]] || continue
    dir=$(dirname "$skill")
    name=$(basename "$dir")
    [[ "$name" == "skill-orchestrator" ]] && continue
    [[ "$name" == "_learnings" ]] && continue
  done

  for skill in "$SKILLS_DIR"/*/SKILL.md; do
    [[ -f "$skill" ]] || continue
    dir=$(dirname "$skill")
    name=$(basename "$dir")
    [[ "$name" == "_learnings" ]] && continue
    desc=$(grep -m1 '^description:' "$skill" | sed 's/^description: >-//' | sed 's/^description: //' | tr -d '\n' | head -c 120)
    [[ -z "$desc" ]] && desc=$(awk '/^description:/{getline; print; exit}' "$skill" | head -c 120)
    echo "| \`$name\` | ${desc}... | \`.cursor/skills/$name/SKILL.md\` |"
    n=$((n + 1))
  done

  echo ""
  echo "**Total: $n workspace skills**"
  echo ""
  echo "## Subagents (\`.cursor/agents/\`)"
  echo ""
  echo "| Agent | Path |"
  echo "|-------|------|"
  for agent in "$ROOT/agents"/*.md; do
    [[ -f "$agent" ]] || continue
    aname=$(basename "$agent" .md)
    echo "| \`$aname\` | \`.cursor/agents/$aname.md\` |"
  done
} > "$OUT"

echo "Wrote $OUT"
