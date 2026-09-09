# Reviewer round 1 — consolidated defects

All three independent reviewers returned bounded defects. This is reviewer evidence only and grants no authority.

## Precedent and ownership

1. Add claim-level provenance classes: `paper_position`, `paper_reported_product`, `local_owned_candidate`, `integration_inference`, `local_witness`. Record source selector, local owner, predecessor, simplification, evidence status, and disposition. All protocol fields and experiments currently have `local_witness=none`.
2. Do not select retained view identity plus per-turn receipt. Preserve two alternatives for `ARE-CONTEXT-OPEN-003`: retained view identity with reuse receipts, or per-turn successor views.
3. Closure/lock completeness is `not_evaluable` until OPEN-001 and OPEN-002 are owner-resolved. A predecision fixture may test plumbing only against a hand-authored declared dependency set.
4. Split ownership: ARE product owner owns projection taxonomy; source/Context owners own source-memory lifecycle; route owners own projection policy; governance owns authority/event vocabulary; experiment owner owns thresholds.

## Non-vacuity

1. Freeze exact requests, profile/registry/source bytes and digests, selected dependency sets, mutations, expected identities, invalidation reasons, repetition count, token accounting, and machine-readable oracles for cold, warm, unrelated-drift, and selected-drift cases.
2. Definition-closure oracle is undefined until OPEN-001. After resolution, use a finite typed graph with an explicitly missing bridge definition and collect-all `not_evaluable` output.
3. Add exact unique-route, route-tie, zero-route, unknown-effect, and stale-routing-dependency cases with expected reason codes and byte-identical repeated decisions.
4. Materialize a complete causal event log for multi-agent stale reads and semantic conflicts, including publication versus acceptance and deterministic conflict-set digest.
5. Add a two-scope leak fixture with forbidden same-topic record, excluded adjacent node, superseded record, permitted shared projection, leakage denominator, false exclusions, and missing-access-metadata behavior.
6. Freeze the 120-turn compaction corpus and define closure, fidelity, context-rot, leakage, invalidation precision/recall, and fail-closed metrics. Until measured, speed, savings, fidelity, consistency, and context-rot claims remain killed.

## Definitional and authority separation

1. Expand routing flow to `RequestContext -> PreflightDecision -> RouteDirective | DecisionGate | typed blocker`. Route, directive, gate, and owner decision are distinct.
2. Add operation boundaries: retrieval emits candidates; provenance binds source/transformation; dependency selection admits candidates; basis construction freezes a sufficient/current substrate; projection derives an artifact; view binding assigns consumer/purpose/window/epoch; reasoning emits a non-authorizing judgment or strategy candidate.
3. Define deterministic succession precedence: unknown/conflicting selected dependency gives `not_evaluable`; known selected change creates successor basis/view; unchanged valid bindings permit reuse under whichever OPEN-003 option is later selected. Cold regeneration is a construction method, not a semantic outcome.
4. State the complete ontology-runtime suspension: Python runtime output is diagnostic candidate evidence only and cannot admit, block, authorize, route, select architecture, or change continuation/effect authority. Only changed, missing, or ambiguous declared dependencies may fail selected work closed.

## Required repair outcome

The revised synthesis must preserve the design value of both papers while demoting all unresolved or unwitnessed claims. It must end with typed states: `candidate`, `not_evaluable`, `killed`, and `owner_decision_required`. It must not send closure-dependent experiments or Product Capability construction to the writer as ready.
