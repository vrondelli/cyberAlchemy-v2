# TASK-UOVA-04 — Navigation Surfaces

Goal: turn clusters, portals, Path, evidence, and the proven fallback into reversible views over one Scene Model.

Write scope: OEW overlay navigation, portal, Path, inspector components, styles, focused tests, and session evidence.

## SWU-UOVA-013 — Grouped Portal UI

Primary behavior: one destination card summarizes a cluster boundary and expands to all exact cut-relation constituents.

Algorithm: render destination category icon, cluster label, purpose, node/relation counts, and up to three predicate summaries from the compiled portal; expand in stable relation-ID order; each constituent says the exact predicate and traversal sentence; group activation chooses the declared cluster entry while constituent activation follows its outside endpoint; both capture the initiating Navigation Frame.

Acceptance: 2+ constituent mixed-direction fixture, complete expansion, correct intents, keyboard activation, no flattening, and no inferred destination. Dependencies: 004, 007, 011–012. Select 014.

## SWU-UOVA-014 — Path/graph/inspector identity synchronization

Primary behavior: selecting a Path hop highlights and inspects the same exact relation ID everywhere.

Algorithm: Path emits ordered relation-bearing hops; the controller selects the hop relation ID; renderer and inspector subscribe to the same selection; the inspector resolves source/evidence/authority/mapping from source binding, not presentation copy; Back restores the pre-Path frame.

Acceptance: all hops render `source —predicate→ target`, same-ID highlight/evidence assertions, parallel relations, no-path state, stale revision, and restoration. Dependencies: 005–007, 011–013. Select 015.

Each SWU validates focused component/navigation tests plus OEW regression and scoped whitespace. Closeout synchronizes its row, task, W2, and Work Pack. Expected result: UI/controller receipt with same-ID assertions, accessible-name snapshots, frame restoration outcomes, and next selection.
