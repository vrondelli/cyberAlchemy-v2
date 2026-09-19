---
artifact: bte-execution-pack
status: validated-gated
updatedAt: 2026-07-23
semanticAuthority: none
---

# Execution Pack — Backend Graph To Proof

## Planning Control

| Field | Value |
| --- | --- |
| planning gate | `pass` |
| execution handoff | `gated` |
| selected SWU | `none` |
| candidate | `SWU-BTE-L0A-REPAIR-001` |
| gate residue | explicit repair selection; current L0A verifier must pass before validation-owner red manifest/freeze work; both gates precede L0B |
| active plan | `WORK-PACK.md` |
| layering | `IMPLEMENTATION-LAYERING.md` |
| dispatch | `EXECUTION-DISPATCH.json` |
| historical route | `work-pack/HISTORICAL-MAP.md` |

## Wave Board

| Wave | Layer | Question | Task | Entry | Exit | State |
| --- | --- | --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0-REFRESH-HANDOFF.md) | gate | Was the bootstrap package valid and one candidate explicitly selectable? | Historical plan validation | accepted decision/refresh | original dispatch/Distill/digests passed | completed-historical |
| [W1](work-pack/waves/W1-L0-PROOF-PRIMITIVES.md) | L0A | Do current published bytes reproduce the immutable historical L0A receipt? | L0A exact-byte repair | applied reconciliation plus historical receipt | passing existing publication verifier with unchanged receipt evidence | repair-candidate-unselected |
| [W1B](work-pack/waves/W1B-L0-VALIDATION-EXECUTION.md) | L0B | Do unchanged contracts reject independently frozen red cases? | L0B semantic validation | current L0A verification plus matching owner freeze | non-admitting ValidationReceipt | predecessor/owner-gated |
| [W2](work-pack/waves/W2-L1-FORMATION-V2.md) | L1 | Does formation-v2 replace current JSON constraints without losing compatibility? | L1 formation-v2 | L0B ValidationReceipt | retirement/migration/compatibility receipt | predecessor-gated |
| [W3](work-pack/waves/W3-L2-SUCCESSOR-SOURCES.md) | L2 | Can versioned independent node/edge sources resolve without fallback? | L2 successor sources | L1 receipt | resolver/source-set receipt | predecessor-gated |
| [W4](work-pack/waves/W4-L3-COMPILER-GRAPH.md) | L3 | Does the successor compile to one deterministic graph/build handle? | L3 compiler/graph | L2 receipt | BuildReceipt plus build ReplayResult | predecessor-gated |
| [W5](work-pack/waves/W5-L4-CATALOGUES.md) | L4 | Are all six denominators and causal selections independently exact? | L4 catalogues | L3 handles | freezes/admissions or typed gate residue | predecessor/owner-gated |
| [W6](work-pack/waves/W6-L5-PROOF-UNIT.md) | L5 | Can one obligation traverse the full proof chain? | L5 proof unit | one eligible L4 member | one complete ReplayResult | predecessor-gated |
| [W7](work-pack/waves/W7-L6-CORE.md) | L6 | Do six exact catalogue scopes recompose into core? | L6 core | L5 plus all freezes/admissions | `verify:bte:core` AggregateResult | predecessor/owner-gated |
| [W8](work-pack/waves/W8-L7-CONSUMERS.md) | L7A/L7B | Do both consumers independently preserve one core handle? | IOLM and Body War | exact green core | two consumer ReplayResults | parallel-after-core |
| [W9](work-pack/waves/W9-L8-AGGREGATES.md) | L8 | Do exact core and consumer handles compose fail-closed? | L8 aggregates | both L7 replays | consumer and terminal AggregateResults | predecessor-gated |

## Ordering And Parallelism

- The current route begins at W1 exact-byte repair. W1–W7 are sequential
  evidence gates, with current L0A verification and the validation-owner freeze
  between W1/L0A and W1B/L0B.
- W8 contains exactly two parallel lanes with disjoint consumer write scopes.
- W9 joins both W8 ReplayResults and the unchanged exact W7 core handle.
- A wave is never an execution unit. Task Session receives exactly one selected
  SWU and one strict context pack.
- Later task SWUs are created only after their predecessor receipts exist.

## Closure Obligations

1. Current v1 and completed 001/003 evidence remain byte-identical.
2. Formation-v2 maps every retired JSON constraint to a YAML-owned replacement
   or an explicit compatible/deferred disposition.
3. Exact project/feature/node/edge/source-set contracts and resolver roots are
   version-hard and provenance complete.
4. All six nonempty catalogues close by stable coverage key and compatible
   governing handle, never count.
5. Every required key has exactly one TestCase, ExecutionResult, and primary
   MutationResult projection.
6. Receipt/replay scope partitions are explicit, non-overlapping, and exactly
   recompose each catalogue.
7. Zero skip, todo, orphan, unrunnable, unsupported-required, surviving-mutant,
   or unreplayed residue remains.
8. IOLM includes graph/hierarchy/table parity and Body War proves exact redaction
   through consumer-owned runs.
9. `verify:bte:core`, `verify:bte:consumers`, and terminal `verify:bte` reject
   missing, empty, extra, duplicate, stale, self-authored, or literal-pass input.
10. All outputs remain non-admitting and UI-independent.

## Stop And Reroute

Stop at the first failed entry gate or write-boundary violation. Route source or
architecture changes to Invoke Design; planning/handle drift to Invoke Refresh;
missing admission/freeze to its owner; bounded implementation to Task Session;
consumer work to the corresponding consumer owner. Never repair a failed gate
inside a downstream SWU.
