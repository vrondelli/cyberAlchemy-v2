#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -d "implementation/domainspec" ]] || [[ ! -d "validation/poker-team" ]]; then
  echo "[error] expected submodules at implementation/domainspec and validation/poker-team" >&2
  echo "[hint] run: git submodule update --init --depth=1 implementation/domainspec validation/poker-team" >&2
  exit 2
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Inventory snapshots
find validation/poker-team/.github/agents -maxdepth 1 -type f -name '*.agent.md' -printf '%f\n' | sort > "$TMP_DIR/poker_agents.txt"
find implementation/domainspec/.github/agents -maxdepth 1 -type f -name '*.agent.md' -printf '%f\n' | sort > "$TMP_DIR/dom_agents.txt"
find implementation/domainspec/copilot/agents -maxdepth 1 -type f -name '*.agent.md' -printf '%f\n' | sort > "$TMP_DIR/copilot_agents.txt"

find validation/poker-team/.github/skills -mindepth 2 -maxdepth 2 -type f -name 'SKILL.md' | sed 's#^validation/poker-team/.github/skills/##' | sort > "$TMP_DIR/poker_skills.txt"
find implementation/domainspec/.github/skills -mindepth 2 -maxdepth 2 -type f -name 'SKILL.md' | sed 's#^implementation/domainspec/.github/skills/##' | sort > "$TMP_DIR/dom_skills.txt"
find implementation/domainspec/copilot/skills -mindepth 2 -maxdepth 2 -type f -name 'SKILL.md' | sed 's#^implementation/domainspec/copilot/skills/##' | sort > "$TMP_DIR/copilot_skills.txt"

comm -23 "$TMP_DIR/poker_agents.txt" "$TMP_DIR/dom_agents.txt" > "$TMP_DIR/agents_only_poker.txt"
comm -23 "$TMP_DIR/poker_skills.txt" "$TMP_DIR/dom_skills.txt" > "$TMP_DIR/skills_only_poker.txt"

# Policy-based classification helpers
is_type_b_agent() {
  [[ "$1" =~ ^mars-research-.*\.agent\.md$ ]]
}

is_type_b_skill() {
  [[ "$1" =~ ^mars-research-.*\/SKILL\.md$ ]]
}

# Explicit local overlays allowed to remain poker-team-only.
TYPE_C_ALLOWLIST_SKILLS=(
  "feature-workflow/SKILL.md"
)

is_allowlisted_type_c_skill() {
  local item="$1"
  local allowed
  for allowed in "${TYPE_C_ALLOWLIST_SKILLS[@]}"; do
    if [[ "$item" == "$allowed" ]]; then
      return 0
    fi
  done
  return 1
}

violations=0

echo "== Drift Check: poker-team-only agent assets =="
if [[ -s "$TMP_DIR/agents_only_poker.txt" ]]; then
  cat "$TMP_DIR/agents_only_poker.txt"
else
  echo "none"
fi

echo
echo "== Drift Check: poker-team-only skill assets =="
if [[ -s "$TMP_DIR/skills_only_poker.txt" ]]; then
  cat "$TMP_DIR/skills_only_poker.txt"
else
  echo "none"
fi

echo
echo "== Policy evaluation =="

while IFS= read -r agent; do
  [[ -z "$agent" ]] && continue

  if is_type_b_agent "$agent"; then
    if [[ -f ".github/agents/$agent" ]]; then
      echo "[ok] Type B research agent promoted to root ownership: $agent"
    else
      echo "[violation] Type B research agent not promoted to root ownership: $agent"
      ((violations+=1))
    fi
    continue
  fi

  if grep -Fxq "$agent" "$TMP_DIR/copilot_agents.txt"; then
    echo "[violation] Type A canonical agent missing in implementation .github install target: $agent"
    ((violations+=1))
  else
    echo "[warning] Unclassified agent drift: $agent"
    ((violations+=1))
  fi
done < "$TMP_DIR/agents_only_poker.txt"

while IFS= read -r skill; do
  [[ -z "$skill" ]] && continue

  if is_type_b_skill "$skill"; then
    if [[ -f ".github/skills/$skill" ]]; then
      echo "[ok] Type B research skill promoted to root ownership: $skill"
    else
      echo "[violation] Type B research skill not promoted to root ownership: $skill"
      ((violations+=1))
    fi
    continue
  fi

  if is_allowlisted_type_c_skill "$skill"; then
    echo "[ok] Type C local overlay allowed: $skill"
    continue
  fi

  if grep -Fxq "$skill" "$TMP_DIR/copilot_skills.txt"; then
    echo "[violation] Type A canonical skill missing in implementation .github install target: $skill"
    ((violations+=1))
  else
    echo "[warning] Unclassified skill drift: $skill"
    ((violations+=1))
  fi
done < "$TMP_DIR/skills_only_poker.txt"

if [[ "$violations" -gt 0 ]]; then
  echo
  echo "[result] FAIL ($violations policy violations found)"
  exit 1
fi

if [[ -x "tools/check_research_structure.sh" ]]; then
  echo
  tools/check_research_structure.sh
fi

echo
echo "[result] PASS (no policy drift detected)"
