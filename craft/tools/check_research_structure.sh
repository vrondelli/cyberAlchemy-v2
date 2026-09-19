#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

allow_compatibility="${ALLOW_RESEARCH_COMPATIBILITY:-0}"

mapfile -t projects < <(find research/projects -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)
required_files=(
  "README.md"
  "PROJECT.yaml"
  "claims/CLAIMS.md"
  "deps/DEPENDENCIES.yaml"
  "registry/ARTIFACT-INDEX.md"
  "registry/TRACEABILITY-MATRIX.md"
  "telemetry/SIGNAL-SCHEMA.md"
)

required_readme_sections=(
  "## What This Project Is About"
  "## Current Snapshot"
  "## Completeness Dashboard"
  "## What Is Missing Right Now"
  "## Canonical File Map"
)

legacy_compat_paths=(
  "research/experiments"
  "research/EXPERIMENTS-META.md"
  "research/EXPERIMENT-BOUNDARIES.md"
  "research/INVENTORY-READINESS-GATE.md"
  "research/MARS-AGENT-ROLLOUT.md"
  "research/MARS-EVIDENCE-STATUS.md"
  "research/MARS-PIPELINE.md"
  "research/MARS-PROTOCOL-CHECKLIST.md"
  "research/MULTI-SOURCE-CONTEXT-PATTERN.md"
  "research/projects/domainspec/EXPERIMENTS.md"
  "research/projects/domainspec/domainspec-paper.md"
  "research/projects/domainspec/research-ideas.md"
  "research/projects/meta-meta/EXPERIMENTS-META.md"
  "research/projects/mars/INVENTORY-READINESS-GATE.md"
  "research/projects/mars/MARS-AGENT-ROLLOUT.md"
  "research/projects/mars/MARS-EVIDENCE-STATUS.md"
  "research/projects/mars/MARS-PIPELINE.md"
  "research/projects/mars/MARS-PROTOCOL-CHECKLIST.md"
  "research/projects/mars/MULTI-SOURCE-CONTEXT-PATTERN.md"
)

violations=0

echo "== Research Structure Check =="

for project in "${projects[@]}"; do
  base="research/projects/$project"
  echo
  echo "[project] $project"

  if [[ ! -d "$base" ]]; then
    echo "[violation] missing project directory: $base"
    ((violations+=1))
    continue
  fi

  for rel in "${required_files[@]}"; do
    if [[ ! -f "$base/$rel" ]]; then
      echo "[violation] missing required file: $base/$rel"
      ((violations+=1))
    fi
  done

  project_manifest="$base/PROJECT.yaml"
  if [[ -f "$project_manifest" ]]; then
    while IFS= read -r line; do
      rel_path="${line#*: }"
      rel_path="${rel_path#\"}"
      rel_path="${rel_path%\"}"
      if [[ -n "$rel_path" && ! -f "$base/$rel_path" ]]; then
        echo "[violation] PROJECT.yaml references missing canonical file: $base/$rel_path"
        ((violations+=1))
      fi
    done < <(grep -E '^[[:space:]]+(domain_context|methodology_theory_baseline): ' "$project_manifest" || true)
  fi

  deps_file="$base/deps/DEPENDENCIES.yaml"
  if [[ -f "$deps_file" ]]; then
    for key in dependency_id type provider_project provider_artifact provider_version_or_commit consumer_project consumer_purpose validation_gate fallback_plan; do
      if ! grep -q "$key:" "$deps_file"; then
        echo "[violation] dependency manifest missing key '$key' in $deps_file"
        ((violations+=1))
      fi
    done
  fi

  if [[ ! -d "$base/exports" ]]; then
    echo "[violation] missing exports directory: $base/exports"
    ((violations+=1))
  fi

  readme_file="$base/README.md"
  if [[ -f "$readme_file" ]]; then
    for section in "${required_readme_sections[@]}"; do
      if ! grep -Fq "$section" "$readme_file"; then
        echo "[violation] README missing required section '$section' in $readme_file"
        ((violations+=1))
      fi
    done
  fi

done

if [[ ! -f "research/shared/templates/PROJECT-README.md" ]]; then
  echo "[violation] missing shared README pattern template: research/shared/templates/PROJECT-README.md"
  ((violations+=1))
fi

if [[ "$allow_compatibility" != "1" ]]; then
  for path in "${legacy_compat_paths[@]}"; do
    if [[ -e "$path" || -L "$path" ]]; then
      echo "[violation] compatibility alias present without explicit request: $path"
      ((violations+=1))
    fi
  done

  if find research -type l | grep -q .; then
    echo
    echo "[violation] symbolic links found under research/ (compatibility handling is disabled by default)"
    find research -type l
    ((violations+=1))
  fi
else
  echo
  echo "[info] compatibility handling explicitly enabled (ALLOW_RESEARCH_COMPATIBILITY=1)"
fi

if find research -xtype l | grep -q .; then
  echo
  echo "[violation] broken symbolic links found under research/"
  find research -xtype l
  ((violations+=1))
fi

if [[ "$violations" -gt 0 ]]; then
  echo
  echo "[result] FAIL ($violations violations found)"
  exit 1
fi

echo

echo "[result] PASS (research project structure is valid)"
