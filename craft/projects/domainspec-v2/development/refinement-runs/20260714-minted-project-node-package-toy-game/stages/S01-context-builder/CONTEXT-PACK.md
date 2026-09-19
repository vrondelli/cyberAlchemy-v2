# Runtime Handoff Pack — Minted Project Node Package Refine

## Identity

- Task/SWU: `REFINE-MINTED-NODE-PACKAGE`
- Source task/work-pack: `REFINE-SEED-PROPOSAL.md`
- Session/run id: `20260714-minted-project-node-package-toy-game`
- Session evidence path: `projects/domainspec-v2/development/refinement-runs/20260714-minted-project-node-package-toy-game/`
- Runtime handoff: `runtime`
- Repository revision: `076be6582689b6a7815df7626cea64339104fe22`
- Evidence date: `2026-07-14`

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| O1 Factory/consumer authority split | covered | `projects/domainspec-v2/authority/AUTHORITY-MODEL.md#purpose-and-core-rule`; `REFINE-SEED-PROPOSAL.md#operator-intent` | DomainSpec may own language form and validation behavior; a minted project owns its domain declarations. A local fixture is only a workflow witness. |
| O2 Machine authority vs human view | covered | `projects/domainspec-v2/development/reformulate-batch1/DESIGN.md#05-spec-homing-decision`; `REFINE-SEED-PROPOSAL.md#toy-game` | Authored machine sources are canonical. `graph.json` and Markdown are reproducible, digest-bound projections, never independent authority. |
| O3 Modular node and edge source | covered | `projects/framework-unification/CONCEPT-MAP.md#the-object-that-unifies-both-axes-the-node-envelope`; `REFINE-SEED-PROPOSAL.md#toy-game` | Compare one-node-per-file, node-plus-edge-file, and aspect-bundle layouts without assuming a winner. |
| O4 Deterministic implementer traversal | covered | `REFINE-SEED-PROPOSAL.md#convergence-criteria`; `REFINE-DISPATCH.json#s06-invoke-design-toy-game` | The normalized graph must resolve every node to one machine source and support traversal without Markdown parsing. |
| O5 Identical layout comparison | covered | `REFINE-DISPATCH.json#toy_game_tournament_for_layout_falsification` | All three layouts receive the same four nodes, three edges, validators, and scoring criteria. |
| O6 Negative mutants | covered | `REFINE-SEED-PROPOSAL.md#required-failure-tests` | Run dangling target, duplicate ownership, invalid label/endpoint, stale graph, stale Markdown, Markdown dependency, and external authority collapse tests. |
| O7 FPR and production non-mutation | covered | `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md#outcome`; `REFINE-SEED-PROPOSAL.md#write-scope` | FPR-01 remains unresolved. The refinement run cannot select a release baseline, source home, production authority, or mutate production artifacts. |
| O8 Non-executed planning handoff | covered | `REFINE-SEED-PROPOSAL.md#done-criteria`; `REFINE-DISPATCH.json#s09-invoke-plan` | Invoke Plan may define future SWUs and gates but may not implement a minter, compiler, validator, or authority disposition. |

Strict coverage: `pass`

## Selected Sources

- `projects/domainspec-v2/development/refinement-runs/20260714-minted-project-node-package-toy-game/REFINE-SEED-PROPOSAL.md`
  - Selectors: `Operator Intent`, `Problem Being Refined`, `Toy Game`, `Required Failure Tests`, `Convergence Criteria`, `Write Scope`, `Done Criteria`
  - Obligations: O1–O8
  - Evidence excerpt: the approved run target, candidate layouts, mutants, convergence rules, and write boundary.
- `projects/domainspec-v2/development/refinement-runs/20260714-minted-project-node-package-toy-game/REFINE-DISPATCH.json`
  - Selectors: `intent`, `technique_overlays`, `steps.s01` through `steps.s10`
  - Obligations: O3–O8
  - Evidence excerpt: validated ten-stage route, dialectic, tournament, and native receipt expectations.
- `projects/framework-unification/CONCEPT-MAP.md`
  - Selectors: lines 79–125, 172–180, 210–214
  - Obligations: O2, O3
  - Evidence excerpt: proposed envelope fields, distinct provenance/domain edge catalogs, and explicit designed-not-built status.
- `projects/domainspec-v2/authority/AUTHORITY-MODEL.md`
  - Selectors: lines 17–64
  - Obligations: O1, O7
  - Evidence excerpt: primary source, workflow witness, and external implementation authority are distinct; claims require witness and owner decision.
- `projects/domainspec-v2/development/reformulate-batch1/DESIGN.md`
  - Selectors: lines 33–62
  - Obligations: O2, O7
  - Evidence excerpt: sole authored authority plus generated-or-absent projection invariant; governance prose routes to its owner.
- `projects/domainspec-v2/development/first-production-release/evidence/authority-census.json`
  - Selectors: `disagreements[FPR01-D007]`, `owner_disposition_queue[OD-003]`
  - Obligations: O7
  - Evidence excerpt: feature-source home and compiled-input graph remain unresolved and owner-routed.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-001/TASK-SESSION-RESULT.md`
  - Selectors: lines 8–42, 53–62, 105–115
  - Obligations: O7, O8
  - Evidence excerpt: census is evidence-only; it selects no baseline, production authority, or source home.
- `projects/domainspec-v2/definitions/meta-types/meta-types.yml`
  - Selectors: `catalog`, `members[Entity|Operation|Rule|Event]`
  - Obligations: O3, O5
  - Evidence excerpt: the four toy node kinds exist as candidate machine-view entries with formation criteria and separate maturity status.
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
  - Selectors: `signatures[performs|enforces|produces]`
  - Obligations: O3–O6
  - Evidence excerpt: the three labels are active canonical signatures with exact endpoint types and unconstructible-edge obligations.

## Architecture Guidance

The run tests an authoring contract, not a new authority model. Keep these layers separate:

1. DomainSpec language authority supplies admitted kind and relationship registries plus compiler/validator behavior.
2. A minted consumer project supplies project-local manifests and canonical domain node/edge declarations.
3. A deterministic compiler resolves the source set into one normalized graph and source-manifest.
4. Implementer and human views consume generated artifacts; they do not write semantic truth back into them.

## Related Feature Context

The existing `financial-settlement` material is a DomainSpec-local validation fixture. It may demonstrate parser or validator behavior but cannot serve as the consumer-project authority model. The toy game is likewise a bounded workflow witness stored only as run evidence.

## Constraints And Non-Goals

- Do not resolve `OD-003`, FPR-01, or any production source-home disposition.
- Do not claim the proposed node envelope or project-mint compiler is built.
- Do not interpret Markdown as a machine traversal input.
- Do not collapse graph edges into prose references or create more than one canonical owner for an edge.
- Do not perform external research, subagent dispatch, production mutation, or continuation-state synchronization.

## Write Scope

- `projects/domainspec-v2/development/refinement-runs/20260714-minted-project-node-package-toy-game/`

## Validation Surface

- `python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py <run>/REFINE-DISPATCH.json --json`
- `jq empty <run>/stages/**/*.json`
- toy-game compiler and mutation harness under `stages/S06-invoke-design-toy-game/toy-game/`
- deterministic double-run digest comparison and generated-view drift checks

## Gaps And Blockers

- `GAP-MINT-SOURCE-HOME`: unresolved by FPR-01; isolated from this experiment by a run-local project manifest. Owner: FPR-01 Decision Gate. Status: deferred.
- `GAP-NODE-ENVELOPE-BUILT`: the envelope and validator are designed, not built. Owner: future DomainSpec design/implementation route. Status: deferred.
- No gap blocks the run-local experiment.

## Authority Precedence

1. Current DomainSpec v2 machine registries for admitted kind/relationship evidence.
2. DomainSpec v2 local authority and closed homing invariants.
3. FPR-01 census and receipt for unresolved production state.
4. Approved Refine seed and validated dispatch for this run's bounded experiment.
5. Generated toy-game graph, Markdown, and analysis as run evidence only.

## Fallback Exploration Rule

Broad repository exploration is allowed only for a newly named acceptance-critical gap. External research remains unauthorized and requires a separate operator decision.

## Provenance

- Repository SHA: `076be6582689b6a7815df7626cea64339104fe22`
- Source refs and SHA-256 digests: recorded in `context-pack.json`
- Builder mode: `standard-strict`

## Output Paths

- Markdown: `stages/S01-context-builder/CONTEXT-PACK.md`
- JSON/index: `stages/S01-context-builder/context-pack.json`

