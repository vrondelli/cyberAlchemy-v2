#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
codex_home="${CODEX_HOME:-/mnt/c/Users/vlad_/.codex}"
personal_skills="$codex_home/skills"

count_skill_files() {
  local path="$1"
  if [[ -d "$path" ]]; then
    find -L "$path" -maxdepth 2 -name SKILL.md -type f | wc -l
  else
    printf '0\n'
  fi
}

printf 'Codex skill surface audit\n'
printf 'repo=%s\n' "$repo_root"
printf 'codex_home=%s\n' "$codex_home"
printf '\n'

printf 'personal_codex_skills=%s\n' "$(count_skill_files "$personal_skills")"
printf 'root_github_skills=%s\n' "$(count_skill_files "$repo_root/.github/skills")"
printf 'arcanum_agent_facades=%s\n' "$(count_skill_files "$repo_root/arcanum/.agents/skills")"
printf 'domainspec_agent_skills=%s\n' "$(count_skill_files "$repo_root/implementation/domainspec/.agents/skills")"
printf 'root_codex_command_files=%s\n' "$(find "$repo_root/.codex/commands" "$repo_root/.arcanum/runtimes/codex/commands" -maxdepth 1 -type f -name '*.md' 2>/dev/null | wc -l)"
printf '\n'

printf 'personal_alias_candidates:\n'
if [[ -d "$personal_skills" ]]; then
  find "$personal_skills" -maxdepth 2 -name SKILL.md -type f -print0 |
    xargs -0 rg -l 'origin: alias wrapper|thin alias|This is a thin alias' 2>/dev/null |
    while IFS= read -r file; do
      file="${file#"$personal_skills"/}"
      file="${file%/SKILL.md}"
      printf '%s\n' "$file"
    done | sort
fi
printf '\n'

printf 'personal_arcanum_short_name_collisions:\n'
if [[ -d "$personal_skills" ]]; then
  comm -12 \
    <(find "$personal_skills" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sed -n 's/^arcanum-//p' | sort) \
    <(find "$personal_skills" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | sort)
fi
