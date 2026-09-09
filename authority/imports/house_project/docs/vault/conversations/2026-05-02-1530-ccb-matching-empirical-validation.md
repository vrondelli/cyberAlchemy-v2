---
tags: [ccb, architecture, domain, pipeline]
node_type: discovery
is_session: true
layer: domain, application
nature: technical, explanatory
status: active
created: 2026-05-02
timestamp: 2026-05-02T15:30:00-03:00
expires: 2026-07-01
conversation_id: 7c8a2f91-4d63-4e85-b6a1-1f9d8c5a3e72
decisions_made: true
contradictions_found: true
specs_updated:
  - specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-template-staged-matching-discovery.md
  - specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-legal-text-gate-discovery.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "Moves the legal-text gate from 0% to 87.8% pass rate by establishing that canonical_text must equal blind_split() output by construction — a constraint that shapes every future CCB template registration workflow."
---

# CCB Matching — Empirical Validation, 0% → 87.8%

## Summary

Validated the per-template CCB matching strategy against the local DB. Diagnosed the 0% legal-text gate pass rate as canonical/runtime divergence plus three extraction issues (Unico signature residue, missing geometric clipping, page-number leak). Decided `canonical_text` must equal `blind_split()` output by construction — implemented symmetric clipping in `blind_split`, re-derived canonical for both registered templates, and fixed an experiment-script bug where runtime called `blind_split` without `section_config`. Combined gate now passes 36/41 (87.8%) v0.6.0-matched pairs; also corrected a misread (Cluster C is tpl11 with a redesigned cover, not a third template — pHash captures layout, not identity).

## Contradictions

- validates `docs/vault/conversations/2026-05-01-1100-ccb-template-extractors-architecture.md` — empirical run confirms the per-template extractor architecture is sound.
- validates `specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-legal-text-gate-discovery.md` — Q1 (canonical = blind_split output) confirmed by 36/41 pass rate.
- contradicts in-session "Cluster C requires a third template" hypothesis — pHash-based clustering misled the analysis; Cluster C matches tpl11 exactly on legal-text and data-table.

## Files touched

- domains/documents_validation/extractors/ccb/_blind_split.py
- domains/documents_validation/extractors/ccb/_engine.py
- internal_tools/ccb-registration-demo/scripts/staged_matching_experiment.py
- specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-template-staged-matching-discovery.md
- specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-legal-text-gate-discovery.md
- .claude/skills/custom/discovery-writing.md
- DB: CCBTemplate id=1, id=2 — section_config.legal_text.canonical_text re-derived
