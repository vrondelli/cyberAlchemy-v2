---
tags: [ontology, visualization]
node_type: spec
is_session: true
layer: ontology
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T11:55:30-03:00
expires: 2026-05-23
conversation_id: d968b67c-cb67-4c98-8f94-b29522a88f25
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 2
importance_rationale: "Routine parser fix adapting ontology visualization to new vault folder structure; low future reference value."
user_satisfaction:
  score: 7
  min: 6
  max: 8
  std: 0.5
---

# Ontology Visualization — Vault Restructure Fix

**Date:** 2026-03-24 11:55 (UTC-3)
**Tags:** #ontology #visualization

## Summary

This session fixed the Ontology Visualization Explorer after the `docs/vault/` directory was restructured into typed subfolders (`axiom/`, `constitution/`, `conceptual/`, `premise/`, `exploratory/`, `backlog/`). The parser script already scanned recursively so the nodes were being collected, but the frontmatter parser was not splitting comma-separated multi-value fields like `layer` and `nature` (e.g., `nature: procedural, technical`), causing concatenated filter values in the UI. Additionally, stale `localStorage` filter state from the old flat structure prevented new classification values from appearing. Two targeted fixes resolved both issues.

### Multi-Value Frontmatter Fields
- **Problem/Goal:** The `docs/vault/` restructure introduced documents with multi-value `layer` and `nature` fields (e.g., `layer: domain, application`). The parser's `parse_frontmatter` function only split `audience` and `tags` by commas, leaving `layer` and `nature` as concatenated strings like `"domain, application"` instead of proper lists.
- **Decision:** Extend the comma-split normalization to include `layer` and `nature` fields.
- **Changes:** Updated `explorer.py` line 92 to include `"layer"` and `"nature"` in the list of fields normalized by comma-splitting.

### Stale Frontend Filter State
- **Problem/Goal:** The browser's `localStorage` cached filter checkboxes from the old flat vault structure. New node type values and classification dimensions introduced by the restructure were invisible because the cached state didn't include them.
- **Decision:** Bump the `STATE_VERSION` constant to force a cache reset on next page load.
- **Changes:** Incremented `STATE_VERSION` from 12 to 13 in `explorer.template.html`.

Key outputs:
- `explorer.py` — parser now correctly handles multi-value `layer` and `nature`
- `explorer.template.html` — frontend cache invalidated via version bump
- `explorer.html` — regenerated with 432 nodes embedded

## Key Decisions
- **Multi-value field normalization:** Extended comma-splitting to `layer` and `nature` fields rather than adding special handling, keeping the approach consistent with existing `audience` and `tags` parsing.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.py` | `modified` | Added `layer` and `nature` to the list of comma-split frontmatter fields |
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Bumped `STATE_VERSION` from 12 to 13 to invalidate stale browser filter cache |
| `specs/ontology/ontology-visualization/explorer.html` | `modified` | Regenerated output with updated parser and template |
| `specs/ontology/ontology-visualization/graph_data.json` | `modified` | Regenerated graph data (432 nodes, 570 links) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[ontology-conventions]] | `derives-from` | The vault restructure followed the classification system defined in ontology-conventions |
| [[ontology/ontology-visualization/implementation-plan]] | `updates` | Minor maintenance update to the visualization tooling |
