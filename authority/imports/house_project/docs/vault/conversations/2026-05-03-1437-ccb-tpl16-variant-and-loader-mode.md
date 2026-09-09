---
tags: [ccb, domain, architecture]
node_type: discovery
is_session: true
layer: domain
nature: technical
status: active
created: 2026-05-03
timestamp: 2026-05-03T14:37:00-03:00
expires: 2026-07-02
conversation_id: 6cffea24-2e88-47ca-ae4e-dc3c8d413cf0
decisions_made: true
contradictions_found: true
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Reverses a prior session's conclusion with PDF-level structural evidence, reframes the template-variant problem space, and sets the exact remaining diagnostics needed before any registration decision can be made."
---

# CCB tpl16 Variant Discovery & Registration Demo Loader Mode

## Summary

Investigated the 4 unmatched CCB documents (DV 16105, 16123, 16224, 16228) from yesterday's empirical validation session to settle whether they were OCR noise on tpl16 or a new template. Two waves of subagent investigation reversed yesterday's tentative "OCR noise" conclusion: the 4 docs are structurally a tpl16 variant with a 534-char endorsement clause (section 13.7) deliberately removed, and they split into two sub-pairs by PDF generator (LibreOffice 24.2 vs 6.4) and font subset — leaving open whether to register one or two new templates pending a pairwise data-table jaccard between the sub-pairs and legal/compliance confirmation that the clause-removed variant is sanctioned. Separately, extended the registration demo with a "Load Existing Template" mode: sidebar selector pre-fills widgets from a CCBTemplate's `section_config` so registered templates can be inspected and edited, with saves routed through the existing version-bumping `register_ccb_template` flow.

## Contradictions

- contradicts docs/vault/conversations/2026-05-02-1530-ccb-matching-empirical-validation.md — that session tentatively concluded the unmatched cluster (DV 16105, 16123, 16224, 16228) was OCR noise on tpl16; this session's structural and PDF-generator evidence shows it is a deliberate variant with a removed endorsement clause.

## Files touched

- internal_tools/ccb-registration-demo/app.py
