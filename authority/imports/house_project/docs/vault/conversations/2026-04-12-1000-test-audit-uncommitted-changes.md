---
tags: [testing, semantic-index, batch-api, remessa, annotation, gap-analysis]
node_type: audit
is_session: true
layer: cross-cutting
nature: validation
status: active
created: 2026-04-12
timestamp: 2026-04-12T10:00:00-03:00
expires: 2026-06-11
conversation_id: t8k3q
decisions_made: false
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Surfaces 2 critical gaps (Literal type rejection, malformed YAML) that could silently corrupt domain behavior, plus 4 important gaps and untracked test files — actionable findings with real defect risk."
---

# Test Audit — Domain Tagging + Semantic Index v2 + Batch API Hardening

## Summary

Audited ~85 production files and ~20 test files across three workstreams: mass @biz/@sys/@edge annotation (annotation-only, no behavioral change), semantic_index v2 refactoring, and batch API + remessa lifecycle hardening. Batch/remessa hardening tests are strong. Found 2 CRITICAL gaps (Literal type rejection in CodeAnchor models; malformed YAML crash path in `_load_terms()`), 4 IMPORTANT gaps (mixed valid/orphan anchors in builder, CLI→views.py round-trip, Liq/Estoque delete error mapping, `_task_exists` normal paths), 3 nice-to-have, and 5 untracked test files needing `git add`. CancelBatchAPI broker failure is a documented known bug.

## Files touched

- (none — audit only, no code or docs changed)
