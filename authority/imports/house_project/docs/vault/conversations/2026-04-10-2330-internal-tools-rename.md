---
tags: [refactoring, internal-tools, architecture, python-packaging]
node_type: spec
is_session: true
layer: architecture
nature: procedural
status: active
created: 2026-04-10
timestamp: 2026-04-10T23:30:00-03:00
expires: 2026-06-09
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Housekeeping rename with one durable signal: urls.py is a blind spot in package renames that must be explicitly audited."
---

# internal_tools Rename & Restructure

**Date:** 2026-04-10 23:30 (UTC-3)
**Tags:** #refactoring #internal-tools #architecture #python-packaging

## Summary

Renamed `tools/` to `internal_tools/` across the entire codebase. The underscore naming was chosen over hyphen because Python package identifiers don't support hyphens and all existing imports used `from tools.*`. `semantic_index` and `personal_assistant` remain siblings directly under `internal_tools/` — no extra nesting; the rename IS the grouping.

Deleted `.obsidian/` (accidentally created from an Obsidian vault session pointed at `tools/`) and `REFACTORING_NOTES.md` (historical note from a prior rename, superseded). Created `commits_productivity/` subfolder from a loose `commit_lines_chart.html`. Split root backlog into per-subfolder backlogs.

Updated all coupling points: Django settings (INSTALLED_APPS, MIGRATION_MODULES), `AppConfig.name` in `apps.py`, test mock `patch()` string paths (not caught by import analysis), GitHub Actions workflows (path triggers + python -m calls), `.pre-commit-config.yaml`, and `run_tests.py`. All 148 tests passing.

A follow-up found `house_project/urls.py` line 29 was missed — still had `include('tools.personal_assistant.backend.urls')`, causing `ModuleNotFoundError` at Django startup. `urls.py` was not in the grep scope of the original rename session. Fixed to `include('internal_tools.personal_assistant.backend.urls')`.

## Epistemic Impact

Python package naming constraint (underscore, not hyphen) is now encoded in practice as a precedent. `urls.py` is identified as a latent coupling point in package renames — import paths in URL routing are not covered by the same rename reflex that catches settings, AppConfig, and test mocks. Future renames must explicitly audit `urls.py`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `internal_tools/` | Renamed from `tools/` | Package rename across all imports |
| `house_project/settings.py` | Modified | INSTALLED_APPS + MIGRATION_MODULES paths |
| `internal_tools/personal_assistant/backend/apps.py` | Modified | AppConfig.name |
| `internal_tools/personal_assistant/backend/tests.py` | Modified | patch() string paths |
| `.github/workflows/ontology-*.yml` | Modified | Path triggers + python -m calls |
| `.pre-commit-config.yaml` | Modified | Entry + files regex |
| `run_tests.py` | Modified | TEST_DIRS list |
| `house_project/urls.py` | Modified (follow-up) | Missed in initial sweep |

## Connections

- contextualizes: `internal_tools/` directory structure
