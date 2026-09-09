---
tags: [ccb, template-matching, ccb-template, variant, pipeline-refactor]
node_type: discovery
is_session: true
layer: domain, application
nature: technical, explanatory
status: active
created: 2026-05-04
timestamp: 2026-05-04T21:44:00-03:00
expires: 2026-07-03
conversation_id: 7e5c2a4f-6d18-4b73-9c0a-3f2e8d7b1a45
decisions_made: true
contradictions_found: true
specs_updated: [specs/002-ccb-validation-workflow/docs/ccb-template-matching/ccb-match-refactor.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Settles a live variant hypothesis with apples-to-apples evidence and defines a two-stage matcher architecture that will directly drive the next CCB matching implementation."
---

# CCB tpl16 Variant Confirmed, ccb-consig-template3 Registered & Match-Refactor Discovery

## Summary

Settled the tpl16-variant question with apples-to-apples evidence (411-char post-mask delta = a removed endorsement clause across 4 DVs) and shipped Streamlit registration UX fixes including MinIO auto-fetch and several loader bugfixes. Registered `ccb-consig-template3` as `CCBTemplate id=3, version=1` (parent `document_template.id=19`) with `sections_extractor_ref=NULL` so the row stays dormant pending legal sign-off on the clause-removed variant. Produced the `ccb-match-refactor` discovery (v0.3.0) defining a two-stage top-N=5 pool-min matcher: stage 1 keeps today's pHash/containment but returns up to 5 candidates; stage 2 pools every populated `CCBTemplate` of those parents, runs `blind_split` once, picks `argmin abs(len(masked_canonical) − len(masked_candidate))` and writes `dv.matched_ccb_template` (no threshold). A mid-session false reversal — caused by mixing `propose_sections` raw extraction against `blind_split`-cropped `canonical_text` — was caught by a second agent's matcher trace; methodology rule already in memory.

## Contradictions

- validates [2026-05-03-1437-ccb-tpl16-variant-and-loader-mode.md](docs/vault/conversations/2026-05-03-1437-ccb-tpl16-variant-and-loader-mode.md) — apples-to-apples delta confirms 2026-05-03's variant framing after the mid-session false reversal was rejected.
- validates `memory/project_tpl16_baseline_suspect.md` — 411-char post-mask delta (not the 1,279 raw delta) confirmed as the variant signal; memory was rewritten in-session to invert its initial conclusion.

## Files touched

- internal_tools/ccb-registration-demo/app.py
- tmp/ccb_consig_template3_payload.json (gitignored)
- .gitignore
- specs/002-ccb-validation-workflow/docs/ccb-template-matching/ccb-match-refactor.md
- DB: ccb_template id=3, v=1, template_id=19
- memory/project_tpl16_baseline_suspect.md (rewritten)
- memory/feedback_ccb_template_variant_signals.md
