#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="${1:-sync}"

CANONICAL_DEFINITIONS_DIR="implementation/mars/definitions"
CANONICAL_TEMPLATES_DIR="implementation/mars/templates"
PROJECTION_DEFINITIONS_DIR="research/projects/mars/definitions"
PROJECTION_TEMPLATES_DIR="research/projects/mars/templates"
CANONICAL_COPILOT_SKILLS_DIR="implementation/mars/copilot/skills"
RUNTIME_COPILOT_SKILLS_DIR=".github/skills"

usage() {
  echo "Usage: $0 [sync|--check]"
}

require_dir() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    echo "[error] missing directory: $dir" >&2
    exit 1
  fi
}

sync_dir() {
  local src="$1"
  local dst="$2"

  mkdir -p "$dst"

  while IFS= read -r dst_file; do
    local base
    base="$(basename "$dst_file")"
    if [[ ! -f "$src/$base" ]]; then
      rm -f "$dst_file"
      echo "[ok] removed stale file: $dst/$base"
    fi
  done < <(find "$dst" -maxdepth 1 -type f | sort)

  while IFS= read -r src_file; do
    local base
    base="$(basename "$src_file")"
    cp -f "$src_file" "$dst/$base"
    echo "[ok] synced: $dst/$base"
  done < <(find "$src" -maxdepth 1 -type f | sort)
}

check_dir() {
  local src="$1"
  local dst="$2"

  if ! diff -qr "$src" "$dst" >/dev/null 2>&1; then
    echo "[drift] $dst is out of sync with $src"
    diff -qr "$src" "$dst" || true
    return 1
  fi

  echo "[ok] no drift: $dst"
  return 0
}

sync_skill_dirs() {
  local src_root="$1"
  local dst_root="$2"

  mkdir -p "$dst_root"

  while IFS= read -r skill_dir; do
    local skill_name
    local src_file
    local dst_dir

    skill_name="$(basename "$skill_dir")"
    src_file="$skill_dir/SKILL.md"
    dst_dir="$dst_root/$skill_name"

    if [[ ! -f "$src_file" ]]; then
      echo "[error] missing canonical skill file: $src_file" >&2
      exit 1
    fi

    mkdir -p "$dst_dir"
    cp -f "$src_file" "$dst_dir/SKILL.md"
    echo "[ok] synced: $dst_dir/SKILL.md"
  done < <(find "$src_root" -mindepth 1 -maxdepth 1 -type d | sort)
}

check_skill_dirs() {
  local src_root="$1"
  local dst_root="$2"

  local drift=0

  while IFS= read -r skill_dir; do
    local skill_name
    local src_file
    local dst_file

    skill_name="$(basename "$skill_dir")"
    src_file="$skill_dir/SKILL.md"
    dst_file="$dst_root/$skill_name/SKILL.md"

    if [[ ! -f "$src_file" ]]; then
      echo "[drift] missing canonical skill file: $src_file"
      drift=1
      continue
    fi

    if [[ ! -f "$dst_file" ]]; then
      echo "[drift] missing runtime skill copy: $dst_file"
      drift=1
      continue
    fi

    if ! diff -q "$src_file" "$dst_file" >/dev/null 2>&1; then
      echo "[drift] runtime skill out of sync: $dst_file"
      drift=1
    else
      echo "[ok] no drift: $dst_file"
    fi
  done < <(find "$src_root" -mindepth 1 -maxdepth 1 -type d | sort)

  return "$drift"
}

require_dir "$CANONICAL_DEFINITIONS_DIR"
require_dir "$CANONICAL_TEMPLATES_DIR"
require_dir "$CANONICAL_COPILOT_SKILLS_DIR"

case "$MODE" in
  sync)
    sync_dir "$CANONICAL_DEFINITIONS_DIR" "$PROJECTION_DEFINITIONS_DIR"
    sync_dir "$CANONICAL_TEMPLATES_DIR" "$PROJECTION_TEMPLATES_DIR"
    sync_skill_dirs "$CANONICAL_COPILOT_SKILLS_DIR" "$RUNTIME_COPILOT_SKILLS_DIR"
    echo "[ok] sync complete"
    ;;
  --check)
    require_dir "$PROJECTION_DEFINITIONS_DIR"
    require_dir "$PROJECTION_TEMPLATES_DIR"
    require_dir "$RUNTIME_COPILOT_SKILLS_DIR"

    drift=0
    check_dir "$CANONICAL_DEFINITIONS_DIR" "$PROJECTION_DEFINITIONS_DIR" || drift=1
    check_dir "$CANONICAL_TEMPLATES_DIR" "$PROJECTION_TEMPLATES_DIR" || drift=1
    check_skill_dirs "$CANONICAL_COPILOT_SKILLS_DIR" "$RUNTIME_COPILOT_SKILLS_DIR" || drift=1

    if (( drift != 0 )); then
      exit 2
    fi

    echo "[ok] canonical/projection assets are in sync"
    ;;
  *)
    usage
    exit 1
    ;;
esac
