---
tags: [ccb, architecture, pipeline]
node_type: spec
is_session: true
layer: domain, application
nature: technical, reference
status: active
created: 2026-05-05
timestamp: 2026-05-05T11:00:00-03:00
expires: 2026-07-04
conversation_id: 9c4e1d8a-3f72-4ab5-9e16-7c2d8e4b5a91
decisions_made: true
contradictions_found: true
specs_updated:
  - docs/features/ccb-matching/SPEC.md
  - docs/features/ccb-matching/DECISIONS.md
  - docs/features/ccb-matching/domain.md
  - docs/features/ccb-matching/operations.md
  - docs/features/ccb-matching/mappings.md
  - docs/features/ccb-matching/events.md
  - docs/features/ccb-matching/workflows.md
  - docs/features/ccb-matching/STORIES.md
  - docs/features/ccb-matching/AS-IS-MAP.md
  - docs/features/ccb-matching/ALIGNMENT-REPORT.md
  - docs/features/ccb-matching/LAYERING-ALIGNMENT-REPORT.md
  - docs/features/ccb-matching/LAYERING-ALIGNMENT-PLAN.md
promoted_candidates: []
expected_importance: 9
importance_rationale: "Locks 9 architectural decisions for the CCB matching pipeline, absorbs 4 prior discoveries into a single authoritative spec, and introduces extraction_provenance as a Deferred Obligation that downstream features must consume."
---

# CCB Matching Feature Spec — Audit-Driven v0.2 Rewrite

## Summary

Drafted CCB matching feature docs via `domainspec-pipeline ccb-matching --spec-only`. User pushback ("did you consider existing code?") triggered alignment + layering + discovery-reconciliation audits surfacing 18 findings and a maturation gap relative to two later discoveries. v0.2 absorbs the staged-matching architecture (pre-filter + verifier + data-table recall gate + 7-step canonicalization legal-text gate + `CCBVerificationAttempt` telemetry) and supersedes the staged-matching discovery's strict fail-closed stance with `extraction_provenance='unverified_fallback'` + `CCBUnverifiedEvent` + fund-manager review — preserving operational continuity without silent pollution. Records `extraction_provenance` consumption discipline as a Deferred Obligation for downstream cross-check, contract binding, and pending overview features.

## Contradictions

- validates [ccb-match-refactor.md](specs/002-ccb-validation-workflow/docs/ccb-template-matching/ccb-match-refactor.md) — two-stage matching shape preserved; decisive write semantics adopted
- validates [ccb-template-staged-matching-discovery.md](specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-template-staged-matching-discovery.md) — pre-filter + verifier + data-table gate architecture adopted
- contradicts [ccb-template-staged-matching-discovery.md §7](specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-template-staged-matching-discovery.md) — supersedes strict fail-closed "no row written" with fail-soft fallback via `extraction_provenance='unverified_fallback'` + `CCBUnverifiedEvent`
- validates [ccb-legal-text-gate-discovery.md](specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-legal-text-gate-discovery.md) — 7-step canonicalization pipeline adopted in full
- validates [ccb-template-persistence-discovery.md](specs/002-ccb-validation-workflow/docs/ccb-template-matching/matching-strategy/ccb-template-persistence-discovery.md) — `CCBTemplate` schema treated as upstream-owned; `lifecycle_status` enum values confirmed
- validates [2026-05-04-2144-ccb-tpl3-registered-and-match-refactor-discovery.md](docs/vault/conversations/2026-05-04-2144-ccb-tpl3-registered-and-match-refactor-discovery.md) — spec consumes its locked decisions (tpl3 real variant for 4 DVs)

## Files touched

- docs/features/ccb-matching/{SPEC,DECISIONS,domain,operations,mappings,events,workflows,STORIES,AS-IS-MAP,ALIGNMENT-REPORT,LAYERING-ALIGNMENT-REPORT,LAYERING-ALIGNMENT-PLAN}.md
- domainspec/ (submodule initialized)
