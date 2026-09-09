---
tags: [ccb, pipeline, architecture, application]
node_type: audit
is_session: true
layer: domain, architecture
nature: technical
status: active
created: 2026-04-12
timestamp: 2026-04-12T21:37:30-03:00
expires: 2026-06-11
conversation_id: 2026-04-12-2137-extraction-tier1-hardening-tier2-discovery
decisions_made: true
contradictions_found: true
specs_updated: [specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier1-implementation-plan.md, specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier2-discovery.md]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Hardened the Tier 1 plan to one-shot-executable state and defined Tier 2 scope by absorbing former Tier 3 — shapes the implementation path for a product-critical subsystem."
---

# Extraction Pipeline — Tier 1 Hardening + Tier 2 Discovery

## Summary

Two robot-talks audits in sequence. The first hardened [extraction-tier1-implementation-plan.md](../../../specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier1-implementation-plan.md) to v0.2.0 — 13 fixes covering skills-contract compliance, one-shot executability stop-points, and explicit Shape A/B helper contracts. The second produced [extraction-tier2-discovery.md](../../../specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier2-discovery.md) v0.1.3, absorbing the original discovery's deferred Tier 3 scope (strategy registry, composite extractors, product-config surface) into Tier 2 because Victor confirmed extraction is a product and shipping narrow would create an unrecoverable audit-trail gap. Key design decisions: `ExtractionPolicy` keyed on `(tenant_id, empresa_geradora, doc_type)` with tenant-beats-empresa precedence; registry lists explicit (no hidden internal fallbacks; only CCB's `TemplateOrUniversalCascade` is composite because it does a merge, not first-wins); `applied_policy_version` persisted as indexed DV column for audit queries; D2 closed by Tier 1 deletion.

## Contradictions

- supersedes `extraction-refactor-discovery.md` — original recommended deferring Tier 3; this session merges Tier 3 scope into Tier 2 on product-framing grounds.

## Files touched

- specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier1-implementation-plan.md
- specs/002-ccb-validation-workflow/docs/extraction-refactor/extraction-tier2-discovery.md
