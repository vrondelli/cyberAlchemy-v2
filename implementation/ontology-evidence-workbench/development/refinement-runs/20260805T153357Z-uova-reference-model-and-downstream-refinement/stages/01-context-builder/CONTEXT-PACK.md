# Context Pack — UOVA Relation Reference Model

This is strict runtime handoff evidence for Refine run `20260805T153357Z-uova-reference-model-and-downstream-refinement`. It is not a replacement UOVA design, product schema, or ontology authority.

## Summary

- Task: determine whether the portal blocker reveals a local schema omission or a missing cross-component relation-reference law.
- Mode: `standard --strict --emit both --handoff runtime`.
- Files selected: 14.
- Obligations: 8/8 covered.
- Strict coverage: PASS.
- Blockers: 0 for define/review; product implementation remains forbidden.

## Obligations

| ID | Obligation | Evidence |
| --- | --- | --- |
| O1 | Identify the current canonical relation record and identity key. | Scene schema, source normalization code, and normalization tests. |
| O2 | Resolve the portal `exact_predicate` task/schema contradiction without preselecting the fix. | Scene schema, TASK-UOVA-01, and SWU-UOVA-004 receipt. |
| O3 | Compare denormalized, reference-first, and immutable-facet models. | Seed questions, architecture boundary, and UI/geometry contracts. |
| O4 | Keep predicate, direction, evidence, cues, geometry, and display fields under one explicit owner each. | Architecture, UI API, cue/geometry task, and scene geometry schema. |
| O5 | Propagate the choice through Path, navigation, renderer, index, static output, and Body War. | Navigation, Body War, and reusable-projection task contracts. |
| O6 | Preserve completed SWU-UOVA-001–003 behavior and parallel-relation identity. | Current source code and normalization tests. |
| O7 | Define stale/missing-reference and standalone-serialization behavior. | Scene/geometry revision contracts and downstream task acceptance. |
| O8 | Produce design/plan evidence only, with no product or authority mutation. | Seed scope and terminal blocker receipt. |

## Selected evidence

| Source | Selectors | Why it matters |
| --- | --- | --- |
| Current `REFINE-SEED-PROPOSAL.md` | candidate models; architecture questions; done criteria | Owns the three-way comparison and claim ceiling. |
| Prior `SCENE-MODEL.schema.json` | `sourceRelationBinding`; `portalConstituent`; `pathHop`; `navigationFrame` | Shows one full canonical relation and multiple ID-only downstream records. |
| Prior `ARCHITECTURE.md` | boundary object; low-level components; workflow; interface table | States `KnowledgeScene` is the semantic boundary and geometry/renderers do not infer semantics. |
| Prior `UI-API-CONTRACT.md` | ownership; source-binding-to-inspector mapping; component rules | Makes UI projection a consumer, not a semantic owner. |
| Prior `SCENE-GEOMETRY.schema.json` | relation geometry and scene digest fields | Separates geometry from relation meaning and binds geometry to a scene revision. |
| `TASK-UOVA-01-SCENE-CORE.md` | SWU-004 portal; SWU-005 Path; blocker note | Contains the direct contradiction and relation-bearing Path requirement. |
| `TASK-UOVA-02-CUES-GEOMETRY.md` | encoding registry; layout geometry | Requires exact-predicate encoding while retaining semantic/geometry separation. |
| `TASK-UOVA-04-NAVIGATION-SURFACES.md` | portal cards; Path synchronization | Requires exact constituent sentences and same-ID cross-surface selection. |
| `TASK-UOVA-06-BODY-WAR-ADAPTER-BUILD.md` | adapter/build acceptance | Keeps Body War downstream while preserving full relation/predicate denominators. |
| `TASK-UOVA-08-REUSABLE-PROJECTIONS.md` | deterministic SVG/print; second-project reuse | Makes standalone serialization and reusable ownership explicit. |
| SWU-UOVA-004 receipt | `BLK-UOVA-004-PORTAL-CONSTITUENT-SCHEMA` | Proves mutation stopped before choosing between schema expansion and reference resolution. |
| Current `sourceGraph.ts` | relation validation; relationById; canonical ordering | Establishes exact source relation ID as the current normalized lookup key. |
| Current `sceneQuery.ts` | relation cloning; partition; same-ID set operations | Shows current scene partitions preserve complete relation records, not only references. |
| Current normalization test | parallel relation identity and exact predicate assertions | Supplies the existing positive control that distinct relation IDs must not collapse. |

## Current contradiction

The canonical `sourceRelationBinding` stores `source_relation_id`, endpoints, `exact_predicate`, direction, cues, evidence, mapping loss, and authority effect. A `portalConstituent` stores only `source_relation_id` plus portal-local endpoints, traversal, and destination. The SWU text asks every constituent to record the exact predicate, while the closed schema rejects it. The blocker correctly stopped because both interpretations are plausible:

1. the schema is incomplete and each constituent must be self-contained; or
2. the task prose confused a resolved presentation requirement with physical field ownership.

## Architecture pressure

The same ambiguity recurs downstream. Path prose expects predicate-bearing hops, NavigationFrame stores selection identity, geometry stores relation identity plus spatial records, components are told not to infer semantics, and static output must remain meaningful without a live application session. A local portal-only field addition cannot establish a coherent law for all of them.

The Refine run therefore tests this provisional question: can one revision-bound relation owner plus exact references serve interactive consumers, while explicit validated snapshots exist only at detached serialization boundaries?

## Constraints

- Direct current schema, code, tests, tasks, and receipts outrank Inventory and memory.
- Inventory is lookup-ready but is a non-authority discovery model.
- Completed UOVA artifacts and product code are read-only.
- No external research unless a later stage identifies a named evidence gap and receives separate approval.
- No browser, runtime, accessibility-conformance, promotion, deployment, or release claim can be produced here.

## Gaps carried forward

- `PathHop` and `NavigationFrame` consumers are planned, not implemented; the design must mark them planned rather than observed.
- Static export self-containment is a requirement, but no current serializer witness proves which semantic fields it must materialize.
- Current implementation validates exact relation identity and scene partition only; it does not yet validate portals, Path, geometry, or renderer synchronization.

## Runtime handoff

Invoke Define may define relation identity, reference, facet, resolver, snapshot, projection, and revision laws. The analysts may expand to the named related task/code/test corpus only to verify an exact obligation, must cite path and line, and may not write.
