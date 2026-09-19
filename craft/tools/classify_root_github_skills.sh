#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
codex_home="${CODEX_HOME:-/mnt/c/Users/vlad_/.codex}"
out="${1:-$repo_root/ops/ROOT-GITHUB-SKILLS-CLASSIFICATION.md}"

normalize_name() {
  local name="$1"
  name="${name#arcanum-sigil-}"
  name="${name#arcanum-spell-}"
  name="${name#arcanum-}"
  name="${name#domainspec-}"
  printf '%s\n' "$name"
}

mtime_of() {
  stat -c '%Y' "$1"
}

has_skill_dir() {
  local root="$1"
  local rel="$2"
  [[ -f "$root/$rel/SKILL.md" ]]
}

find_personal_keeper() {
  local normalized="$1"
  local candidates=(
    "$codex_home/skills/$normalized/SKILL.md"
    "$codex_home/skills/arcanum-$normalized/SKILL.md"
  )
  local best=""
  local best_mtime=0
  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      local mt
      mt="$(mtime_of "$candidate")"
      if (( mt > best_mtime )); then
        best="$candidate"
        best_mtime="$mt"
      fi
    fi
  done
  printf '%s\n' "$best"
}

find_domainspec_keeper() {
  local root_name="$1"
  local normalized="$2"
  local candidates=(
    "$repo_root/implementation/domainspec/.agents/skills/$root_name/SKILL.md"
    "$repo_root/implementation/domainspec/.agents/skills/domainspec-$normalized/SKILL.md"
    "$repo_root/implementation/domainspec/.agents/skills/gsd-$normalized/SKILL.md"
  )
  local best=""
  local best_mtime=0
  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      local mt
      mt="$(mtime_of "$candidate")"
      if (( mt > best_mtime )); then
        best="$candidate"
        best_mtime="$mt"
      fi
    fi
  done
  printf '%s\n' "$best"
}

find_arcanum_keeper() {
  local normalized="$1"
  local candidates=(
    "$repo_root/arcanum/.agents/skills/$normalized/SKILL.md"
    "$repo_root/arcanum/arcana/$normalized/SKILL.md"
    "$repo_root/arcanum/spells/$normalized/README.md"
  )
  local best=""
  local best_mtime=0
  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      local mt
      mt="$(mtime_of "$candidate")"
      if (( mt > best_mtime )); then
        best="$candidate"
        best_mtime="$mt"
      fi
    fi
  done
  printf '%s\n' "$best"
}

classify_one() {
  local skill_file="$1"
  local dir name normalized root_mtime root_sha personal_keeper domainspec_keeper arcanum_keeper action class keeper evidence

  dir="$(basename "$(dirname "$skill_file")")"
  name="$dir"
  normalized="$(normalize_name "$name")"
  root_mtime="$(mtime_of "$skill_file")"
  root_sha="$(sha256sum "$skill_file" | awk '{print $1}')"
  personal_keeper="$(find_personal_keeper "$normalized")"
  domainspec_keeper="$(find_domainspec_keeper "$name" "$normalized")"
  arcanum_keeper="$(find_arcanum_keeper "$normalized")"

  class="root-owned"
  action="keep"
  keeper="$skill_file"
  evidence="unique root skill or root-owned package"

  if [[ "$name" == arcanum-* ]]; then
    class="distribution-adapter"
    action="keep"
    keeper="${arcanum_keeper:-$personal_keeper}"
    evidence="Arcanum root GitHub-skill adapter; not Codex install surface"
  elif [[ "$name" == domainspec-* && -n "$domainspec_keeper" ]]; then
    class="domainspec-duplicate"
    action="gate-delete"
    keeper="$domainspec_keeper"
    evidence="newer DomainSpec-owned skill exists"
    if [[ "$(sha256sum "$domainspec_keeper" | awk '{print $1}')" == "$root_sha" ]]; then
      evidence="exact duplicate of DomainSpec-owned skill"
    fi
  elif [[ "$name" == gsd-* && -n "$domainspec_keeper" ]]; then
    class="domainspec-duplicate"
    action="gate-delete"
    keeper="$domainspec_keeper"
    evidence="newer DomainSpec/GSD skill exists"
  elif [[ "$name" == mars-research-* ]]; then
    class="root-owned"
    action="keep"
    keeper="$skill_file"
    evidence="root research orchestration skill"
  elif [[ -n "$personal_keeper" ]]; then
    class="personal-codex-duplicate"
    action="keep-root-until-runtime-confirmed"
    keeper="$personal_keeper"
    evidence="personal Codex skill exists; root path may be non-Codex adapter"
  fi

  printf '| `%s` | `%s` | `%s` | `%s` | `%s` | %s |\n' "$name" "$class" "$action" "$keeper" "$skill_file" "$evidence"
}

{
  printf '# Root GitHub Skills Classification\n\n'
  printf 'Date: 2026-05-29\n'
  printf 'Task: TASK-DUP-002\n\n'
  printf 'This table classifies root `.github/skills/*/SKILL.md` packages for duplicate pruning. `gate-delete` means the row is a cleanup candidate, but deletion still needs owner/runtime confirmation.\n\n'
  printf '| Skill | Class | Action | Keeper | Root Path | Evidence |\n'
  printf '| --- | --- | --- | --- | --- | --- |\n'
  while IFS= read -r skill_file; do
    classify_one "$skill_file"
  done < <(find "$repo_root/.github/skills" -maxdepth 2 -name SKILL.md -type f | sort)
} > "$out"

printf '%s\n' "$out"
