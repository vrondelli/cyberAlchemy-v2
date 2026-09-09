---
tags: [ontology, organization, specs, navigation, readme]
node_type: spec
is_session: true
layer: ontology
nature: procedural
status: active
created: 2026-04-10
timestamp: 2026-04-10T24:30:00-03:00
expires: 2026-06-09
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Established a consistent navigation pattern across all 13 specs folders and reduced ontology root clutter by 73%, directly improving agent and developer discoverability."
---

# Specs Folder Organization — Best Practices Rollout

**Date:** 2026-04-10 (UTC-3)
**Tags:** #ontology #organization #specs #navigation #readme

## Summary

Audited all 13 `/specs/` folders and identified `cloud_services/` as the gold standard organizational pattern: root README with "START HERE" Q&A table, `docs/README.md` as second-level navigation layer, organized subfolders with clear purpose. Applied this pattern across all folders using 4 parallel agents with non-overlapping scopes (robot-talks pattern).

Phase 1 created 11 new `docs/README.md` files across all specs folders. Every folder with subfolders now has navigable structure at both root and docs/ level.

Phase 2 reorganized `/specs/ontology/` root. 11 root-level markdown files were grouped into 3 new semantic folders: `dictionaries/` (canonical vocabularies — business, sys), `governance/` (strategy + metrics — day-0-strategy, graph-health-kpis), and `vault-processes/` (infrastructure discoveries — 5 discovery files). `graph-bridge-discovery.md` was archived (renamed to `.archived.md`), not deleted — preserving git history while signaling supersession.

Result: root-level files in ontology/ went from 11 to 3 (73% reduction). Specs folders with docs/README.md went from 1 to 12.

## Epistemic Impact

Zero new knowledge produced — all files created are navigation artifacts (READMEs). The contribution is purely structural: every specs folder now has a documented path-of-entry at both root and docs/ level. The 3 new ontology subfolders signal semantic grouping (dictionaries are lookup tables, governance is strategy+metrics, vault-processes is infrastructure) at a glance.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| 11 `docs/README.md` files across all specs/ | Created | Second-level navigation layer for every folder with subfolders |
| `specs/ontology/docs/dictionaries/README.md` | Created | Navigation for canonical vocabulary files |
| `specs/ontology/docs/governance/README.md` | Created | Navigation for strategy-metrics relationship |
| `specs/ontology/docs/vault-processes/README.md` | Created | Navigation for vault infrastructure layer |
| 9 files in specs/ontology/ root | Moved | Into dictionaries/, governance/, vault-processes/ |
| `graph-bridge-discovery.md` | Archived | Renamed to `.archived.md` — superseded by discovery-vault-code-bridge.md |

## Connections

- contextualizes: `/specs/` directory structure
- contextualizes: `cloud_services/` (gold standard pattern source)
