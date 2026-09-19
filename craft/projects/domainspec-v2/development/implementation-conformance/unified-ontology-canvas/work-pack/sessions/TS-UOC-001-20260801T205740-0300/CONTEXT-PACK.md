# Strict Context Pack — SWU-UOC-001

- Task Session: `TS-UOC-001-20260801T205740-0300`
- Mode: `standard`
- Strict coverage: `pass`
- Selected unit: `SWU-UOC-001`
- Resolution source: direct user choice recorded by Decision Gate
- Evidence ceiling: local candidate presentation projection only

## Execution Contract

- Material writes:
  - `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs`
  - `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs`
- Execution outputs:
  - `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-001-RESULT.md`
- Allowed writes: the two material writes plus the one execution output above.
- Validation commands:
  - `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs --mode projection`
  - `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`
- Lifecycle owner: `invoke:refresh:apply-approved`
- Authority class: `private`
- Publication class: `internal`
- Write profile: `material-bound`

Session evidence, admission receipts, closeout receipts, and continuity state are
owner evidence governed by their schemas; they are not product material writes.

## Obligation Coverage

| Obligation | Controlling selector | Execution consequence |
| --- | --- | --- |
| One complete immutable graph | `SPEC.md` portable invariants 1-3; `ARCHITECTURE.md#unified-graph-contract` | Normalize every declared family, stable ID, source reference, indexes, digest, and deep-freeze the result. |
| Exact bridges only | `SPEC.md` invariant 4; `MAPPINGS.md#bridge-derivation` | Derive only from named fields; matching labels create no edge. |
| Preserve gaps | `MAPPINGS.md` gap rule; `ARCHITECTURE.md#stable-identity-and-collisions` | Emit explicit mapping gaps; never repair them by inference. |
| Reciprocal alignment | `MAPPINGS.md` `candidate-aligns-to`; task independent acceptance | Reject disagreement between `architecture_type_id` and `canonical_meta_type_ref`. |
| Profile provenance | `MAPPINGS.md#evaluation-context-fields`; `ARCHITECTURE.md#profile-and-fixture-compatibility` | Keep facts and findings pinned to TypeScript; Python/Rust emphasis receives no supplied evaluation. |
| Evidence boundary | `SPEC.md` invariants 7-9 and non-goals | Preserve distinct statuses and `authority_effect: none`; do not imply adapters, admission, or release. |
| Pure candidate module | task done criteria; `ARCHITECTURE.md` ARC-R01/R02 | Dependency-free `.mjs`, no DOM/browser globals, no source mutation. |
| Fail closed | task failure posture and planned negative witnesses | Throw typed diagnostics for duplicate IDs, missing endpoints, invalid provenance, or malformed explicit bridges. |
| Exact acceptance | task exact validation | Run both declared Node commands and record exact exits/output plus digests. |

## Selected Sources

1. `work-pack/tasks/TASK-UOC-001-PROJECTION.md` — complete unit contract.
2. `WORK-PACK.md` — dependency chain, scope, gates, claim ceiling.
3. `work-pack/shared/closeout-contract.md` — owner and terminal receipt contract.
4. `SPEC.md` lines 12-81, 129-155 — ownership, invariants, scope, ceiling.
5. `ARCHITECTURE.md` lines 18-34, 62-176, 226-235, 282-315 — source ceiling, graph contract, provenance, witnesses, rules.
6. `MAPPINGS.md` — stable IDs, bridge rules, evaluation context.
7. `ontology-experiment/domain-meta-types.projection.json` — 25 meaning records and exact candidate mappings.
8. `ontology-experiment/ontology.json` — realization types, properties, relations, language projections.
9. `ontology-experiment/profiles/*.json` — four profiles and 24 owner constraints.
10. `ontology-experiment/examples/typescript-observed-facts.json` — three elements and two relations.
11. `ontology-experiment/examples/typescript-evaluation.expected.json` — eight expected findings.
12. `ontology-experiment/validate-ontology.mjs` — upstream consistency witness retained unchanged.

## Exclusions

- No source adapter, evaluator, ontology edit, layout, HTML, browser behavior,
  package dependency, Git action, publication, promotion, release, or deployment.
- Existing lens builders are reference context only; the new model does not call
  DOM code or mutate the current HTML in this SWU.
