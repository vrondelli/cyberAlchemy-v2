---
tags: [ccb, recursive-pipeline, dashboard, deriver, self-validation, gate-parity, prototype, wave-10, results-tab, audit]
node_type: audit
is_session: true
layer: application, domain
nature: technical, procedural
status: active
created: 2026-05-13
timestamp: 2026-05-13T22:37:47-03:00
expires: 2026-07-12
conversation_id: b8db1eed-886b-47ad-af74-68a351411b3e
decisions_made: true
contradictions_found: true
specs_updated:
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/dashboard-results-v2.md
  - internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Empirical evidence of v0.3.6 self-validation gate-parity violation (8/12 derived templates match 0 CCBs) plus rules-first dashboard redesign sealed in spec."
veracidade: high
convicção: high
---

# Deriver probe findings + rules-first dashboard sealed

## Objective

Document the deferred deriver probe outcome (57/63 coverage, but 8/12 templates matched 0 CCBs and anchor_heavy contributed nothing), the rules-first dashboard redesign that emerged from prototyping, and the open implementation work.

## Summary

The deferred deriver probe (re-run after yesterday's pHash fix) completed cleanly: 57/63 = 90.5% coverage, +23 derived matches over iters 1–2, terminated by `no_new_matches` at iter 3. DB inspection surfaced two findings buried in JSON: **anchor_heavy strategy contributed 0 matches across all 4 of its templates**, and **8 of 12 derived templates failed even on their own training CCBs** — the v0.3.6 self-validation gate-parity invariant appears empirically violated. These findings drove a redesign of Wave 10 from CCB-centric to **rules-first** with a dual-section drawer (training set + matched set, both visible) and a PDF detail view that visually differentiates each `section_config` region (header, data_table, legal_text band, anchors, variable_zones, signature, footnote). Three HTML prototypes built in `/tmp`; Victor selected v3 (sidebar layout). Spec drift sealed in `dashboard-results-v2.md` v0.2.0 + `interfaces.md` v0.4.1. **Wave 10 implementation (T10.1, T10.2, T10.5) NOT done — spec is sealed, `dashboard/app.py` is unchanged.**

## Contradictions

- questions `governance.md` v0.3.6 *Deriver self-validation gate parity* invariant — 8 of 12 derived templates in the `2026-05-12T16-04-20+00-00_group_ab7f0b` probe matched 0 CCBs at runtime, including 0 of their own cluster-member training DVs. Either the invariant isn't enforced in code, the matcher-identical gate scoring drifted, or the `Levenshtein.distance == 0` strictness is too tight against real OCR noise. Needs Route 3 investigation.

## Next steps

- **(a) Commit v3 prototype to durable location** (`internal_tools/ccb-registration-demo/dashboard/prototypes/results_v3_sidebar.html`) with a short README pointing to the spec it implements. The `/tmp` files are ephemeral.
- **(b) Open backlog item for Wave 10 implementation** (T10.1 render-time branch, T10.2 RecursiveRunView build per wireframe, T10.5 manual visual acceptance). Spec is sealed; work is well-scoped; defer until scheduled.
- **(c) Investigate deriver gate-parity violation** (Route 3, 1–2 days) — root-cause why 8/12 templates fail self-validation. Higher leverage than building the dashboard now: fixing this means the next probe yields 12 working templates instead of 4, raising the dashboard's eventual value. Anchor_heavy may then be droppable from the default strategy mix as a secondary outcome.

## Files touched

- internal_tools/ccb-registration-demo/docs/validation-experiment/features/dashboard-results-v2.md
- internal_tools/ccb-registration-demo/docs/validation-experiment/features/interfaces.md
- /tmp/results_v1_dense.html (prototype, ephemeral)
- /tmp/results_v2_cards.html (prototype, ephemeral)
- /tmp/results_v3_sidebar.html (prototype, ephemeral — selected; pending commit per next-step (a))
