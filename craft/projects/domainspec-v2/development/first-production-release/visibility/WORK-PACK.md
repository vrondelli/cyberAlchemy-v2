# Work pack — FPR visibility and generated roadmap

Status: completed and verified (2026-07-13)

## Outcome

A deterministic, graph-like HTML roadmap and machine JSON projection that makes the
DomainSpec-v2 first-production-release path visible while preserving Craft as the sole
continuation authority and the current production block.

## Definition of done

- `DISPATCH.json` passes the dispatch validator.
- Every SWU has inputs, outputs, boundaries, negative controls, and a receipt.
- The builder reads only the declared Craft ledger and FPR manifest.
- JSON contains 16 nodes, 38 edges, 5 frontiers, and 14 ordered critical steps.
- Every edge endpoint and every frontier-to-node reference resolves.
- Every projected frontier is joined to the matching Craft gap; missing joins block.
- HTML is self-contained, responsive, keyboard-usable, and exposes search/filter/detail.
- `--check` passes immediately after generation and fails on stale generated content.
- Craft records the feature without advancing the parent FPR gate or next move.
- Browser verification produces an explicit receipt.

## Work decomposition

| SWU | Owner capability | Output | Depends on | Result |
|---|---|---|---|---|
| SWU-VIS-001 | Invoke / implementation-layering | validated normalization contract | planning context | pass |
| SWU-VIS-002 | task-session | deterministic builder, JSON, tests | SWU-VIS-001 | pass |
| SWU-VIS-003 | Whisper / task-session | template and generated HTML | SWU-VIS-002 | pass |
| SWU-VIS-004 | Craft / task-session | child context and artifact indexes | SWU-VIS-002, SWU-VIS-003 | pass |
| SWU-VIS-005 | task-session | validation and recomposition receipt | all prior SWUs | pass |

## Waves

- W0 Contract: SWU-VIS-001.
- W1 Read model: SWU-VIS-002.
- W2 Composition: SWU-VIS-003.
- W3 Integration and proof: SWU-VIS-004 then SWU-VIS-005.

The sequence is intentional. Parallel HTML and data implementation would let the view
invent fields before the authority join contract is fixed.

## Shared gates

1. Authority gate: generated state cannot outrank Craft or the accepted decision.
2. Production gate: `production_authorized` must remain false; true is a hard error.
3. Source gate: no private material moves into public Arcanum paths.
4. Recomposition gate: all five SWUs must recompose into one refreshable feature.
5. Claim gate: browser polish is not evidence of release readiness.

## Stop conditions

- Stop if source disagreement cannot be represented without selecting an authority.
- Stop if the implementation needs to write Craft state.
- Stop if a missing node/frontier is silently discarded.
- Stop if the view implies that seeded or planned work is complete.
- Stop if production authorization would be required to finish the visualization.

## Residue accepted for a later route

- CI wiring of `--check` is enabled but not required in this slice.
- Layout may be refined after real use; visual refinement cannot change state semantics.
- New FPR nodes require a manifest change and normal refresh, not generator code changes.
- New research dispatches still require the existing human-confirmed persistent protocol.

## Navigation

- Execution contract: `EXECUTION-PACK.md`
- Layer model: `IMPLEMENTATION-LAYERING.md`
- Machine route: `DISPATCH.json`
- Shared context: `work-pack/shared/context.md`
- Traceability: `work-pack/shared/traceability.md`
- Task definitions: `work-pack/tasks/`
- Wave ordering: `work-pack/waves/`
- Distill proof: `DISTILL-VALIDATION.md`
- Whisper contract: `WHISPER-COMPOSITION.md`
- Continuation handoff: `PLAN-TRANSPORT.md`
