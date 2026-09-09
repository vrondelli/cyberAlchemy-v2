---
tags: [audit, domain-tagging, ontology, spec-yaml, edges, scanner]
node_type: audit
is_session: true
layer: architecture, domain
nature: technical, reference
status: active
created: 2026-04-12
timestamp: 2026-04-12T14:00:00-03:00
expires: 2026-06-11
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: [domains/spec.yaml]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Identified 120 symbol violations and ~33 missing edges in spec.yaml; root-caused 3 scanner gaps responsible for 70% of violations; restored invisible domain relationships in the filter chain."
---

# spec.yaml Symbol Audit + Edge Audit

**Date:** 2026-04-12 14:00-15:30 (UTC-3)
**Tags:** #audit #domain-tagging #ontology #spec-yaml #edges #scanner

## Summary

Two companion audits of `domains/spec.yaml` (349 concepts) run on the same day.

### Symbol Audit

Audited all 349 concepts against the domain-tagging heuristic: `@biz` = would someone mention this in a business conversation? `@sys` = would an architect put this in a system diagram? Found 120/349 violations across 10 categories:

| Category | Count |
|----------|-------|
| Example files (scanner has no path exclusions) | 22 |
| Private functions (no `_` prefix filter) | 43 |
| Celery tasks (duplicating use cases) | 19 |
| Concrete repository classes | 4 |
| Repository helper methods | 13 |
| SQL query builders | 3 |
| DataFrame validators | 3 |
| Infrastructure utilities | 6 |
| Logging infrastructure | 4 |
| Exception classes | 3 |

**Root causes:** Three scanner-level gaps account for 84/120 violations (70%): (1) no path exclusions for `internal_tools/`, `specs/`, `tasks/celery_tasks.py`; (2) no private symbol filter for `_`-prefixed functions; (3) no use-case/Celery deduplication. The heaviest offender was `extraction_steps.py` with 14 private step functions tagged.

### Edge Audit

Focused on edge quality for correctly-tagged symbols. Fixed 1 wrong edge type (`delete_field_mapping`: `transitions` → `queries`). User confirmed 5 others as intentional (including `enforces → entity` pattern, `transitions` for append-only semantic state change).

Added ~33 missing edges across 20 symbols: filter rules (`EligibilityFilter` → `enforces → ApproveRemessa*`), status enums (`RemessaStatus` → `governs`), workflow (`RunFiltersService` → `orchestrates → EligibilityFilter`), approve operations (`produces`, `transitions`), checklist domain (`produces`, `queries`, `calculates`), KitType operations, estoque/liquidacao domains, and entity containment edges (`contains`).

Key patterns: estoque and liquidacao domains were systematically under-edged. The filter chain had zero edges despite being the core execution path. Entity containment was missing everywhere.

## Epistemic Impact

The most important finding is not the 120 violations but the 3 structural scanner gaps that generate them mechanically. Any future audit will regenerate the same violations until the scanner is fixed. The signal-to-noise problem in spec.yaml is architectural, not editorial.

The filter chain having zero edges is particularly high-cost — filters are the system's core execution path, and any impact analysis or refactoring safety check traversing the graph would produce silent blind spots.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/spec.yaml` | Modified | ~33 edges added, 1 edge type fixed. No symbols removed (requires source code tag changes). |

## Connections

- contextualizes: `domains/spec.yaml`
- contextualizes: `internal_tools/semantic_index/extractors/tag_scanner.py` (scanner gaps)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Fix scanner: add path exclusions (tests/, examples/, migrations) | Symbol audit | High | open |
| Fix scanner: filter private symbols (`_`-prefixed) | Symbol audit | High | open |
| Fix scanner: deduplicate Celery task entries | Symbol audit | Medium | open |
| Remove 120 violating symbols — requires source code tag changes | Symbol audit | High | open |
| Re-audit estoque/liquidacao after scanner fix | Edge audit | Medium | open |
| Flag: `get_estoque_aggregation_sql` in domain layer tagged `@biz` — violates tagging rules | Edge audit | Low | open |
