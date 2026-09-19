# Strict Context Pack — SWU-UOC-002

- Task Session: `TS-UOC-002-20260801T211531-0300`
- Mode: `lean`
- Strict coverage: `pass`
- Selected unit: `SWU-UOC-002`
- Resolution source: joined 001 closeout plus fresh chain continuity cursor
- Evidence ceiling: deterministic node layout over the admitted candidate graph

## Execution Contract

- Material writes:
  - `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-layout.mjs`
  - `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs`
- Execution output:
  - `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-002-RESULT.md`
- Allowed writes: the two material paths plus the one result path.
- Validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode nodes`
- Lifecycle owner: `invoke:refresh:apply-approved`
- Authority class: `private`
- Publication class: `internal`
- Write profile: `material-bound`

## Obligation Coverage

| Obligation | Source | Consequence |
| --- | --- | --- |
| Closed predecessor | 001 Refresh receipt | Dependency is exact and digest-bound. |
| Five bands | `ARCHITECTURE.md#five-deterministic-bands` | Fixed left-to-right Meaning, Realization, Expectation, Observation, Explanation. |
| Exact ordering | same section | Family-specific stable sort keys are stored with every position. |
| Complete placement | task acceptance | Every graph node receives exactly one band, rectangle, and order. |
| No overlaps | task acceptance | Canonical rectangle intersection count must be zero. |
| Determinism | `QUERIES.md#ComputeDeterministicCanvasLayout` | Equal graph and options yield byte-identical layout digest and positions. |
| Scope split | task split analysis | No edge path/port routing and no DOM/browser behavior in this unit. |
| Fail closed | task failure posture | Unknown bands, bad dimensions, missing nodes, overlap, or nondeterminism reject. |

## Selected Sources

1. `TASK-UOC-002-NODE-LAYOUT.md` — exact unit contract.
2. `WORK-PACK.md` — current dependency and successor state.
3. `closeout/SWU-UOC-001-REFRESH-RECEIPT.json` — joined predecessor.
4. `ontology-experiment/unified-canvas-model.mjs` — admitted graph interface.
5. `ARCHITECTURE.md` lines 155-176 — stable identity and band ordering.
6. `QUERIES.md#ComputeDeterministicCanvasLayout` — calculation contract.
7. `UX-PLAN.md` responsive semantics — band order must remain stable.

## Exclusions

No edge routing, ports, canvas rendering, visibility/focus state, browser work,
source changes, external layout package, Git action, publication, or promotion.
