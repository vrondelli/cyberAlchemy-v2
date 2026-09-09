# Task Session context pack — SWU-INTENT-001

Status: session evidence; not a canonical planning artifact.

Mode: Context Builder `standard --max-files 24 --strict`

## Identity

- Task: `TASK-INTENT-POPULATION-001`
- Selected SWU: `SWU-INTENT-001`
- Run: `2026-07-22-intent-schema-01`
- Runtime: local Task Session fallback; no runtime adapter
- Subagents: none authorized for this SWU
- Write scope: this run directory and
  `receipts/intent-schema-live-run.json` only

## Obligation matrix

| ID | Obligation | Controlling evidence | Status |
|---|---|---|---|
| O1 | Execute exactly one selected SWU and one 12 population + 3 holdout corpus. | task contract § SWU-INTENT-001; experiment spec § Unit and corpus | covered |
| O2 | Freeze concrete paths, selectors, file hashes, excerpt hashes, strata, assignments, and inclusion reasons before population. | protocol § Frozen inputs / Sampling procedure | covered |
| O3 | Preserve raw text and use declared/inferred/unresolved without defaults. | candidate intent record § Population posture; protocol § Population algorithm | covered |
| O4 | Apply unchanged schemas, rules, observation kinds, and metrics to holdout. | protocol § Holdout rule | covered |
| O5 | Validate source locks, JSONL structure/invariants, cardinality, and metrics. | mechanics receipt; validator; metrics contract | covered |
| O6 | Keep writes private/scoped and all 15 selected sources read-only. | dispatch constraints IC-004; task write scope | covered |
| O7 | Bound findings to this corpus and leave owner decisions pending. | claim boundary; g6-schema-selection | covered |
| O8 | Return a terminal receipt with hashes, commands, blockers, residue, and next owner. | task contract § Reproducibility receipt | covered |

Coverage: 8/8 obligations. Strict runtime-handoff coverage is not applicable
because no runtime delegation is used.

## Controlling contracts

| Path | Selector | Obligations |
|---|---|---|
| `experiments/intent-schema/WORK-PACK.md` | Selected SWU and validation strategy | O1, O5, O8 |
| `experiments/intent-schema/work-pack/tasks/TASK-INTENT-POPULATION-001.md` | algorithm, scope, done criteria, split analysis | O1–O8 |
| `experiments/intent-schema/SPEC.md` | unit/corpus, success and stop rules | O1, O7 |
| `experiments/intent-schema/ARCHITECTURE.md` | workflow and decision boundaries | O4, O6, O7 |
| `experiments/intent-schema/PROTOCOL.md` | frozen inputs, population, holdout, validation | O2–O5 |
| `experiments/intent-schema/METRICS.md` | integrity, posture, pressure, holdout metrics | O5, O7 |
| `experiments/intent-schema/CLAIM-BOUNDARY.md` | allowed and prohibited claims | O7 |
| `spec/INTENT-RECORD.md` | seven fields and posture rules | O3 |
| `receipts/intent-evidence-mechanics.json` | passing L0 prerequisite | O5 |

## Frozen corpus selectors

Population:

| Sample | Stratum | Source | Selector |
|---|---|---|---|
| SAMPLE-DISPATCH-01 | dispatch | `projects/poker-agent-arena/development/dispatches/20260619-agent-arena-mechanics/poker-agent-arena-mechanics.dispatch.json` | JSON Pointer `/intent` |
| SAMPLE-DISPATCH-02 | dispatch | `cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json` | JSON Pointer `/intent` |
| SAMPLE-DISPATCH-03 | dispatch | `cyberAlchemy-v2/development/business-plan/2026-07-investor-bp/MUTATION-DISPATCH.json` | JSON Pointer `/intent` |
| SAMPLE-DISPATCH-04 | dispatch | `cyberAlchemy-v2/development/refinement-runs/20260629-cav2-row2-solver-trust-base/REFINE-DISPATCH.json` | JSON Pointer `/intent` |
| SAMPLE-CRAFT-01 | craft | `cyberAlchemy-v2/development/agent-reasoning-engine/.craft/ledger.yml` | `contexts[0]` / `CTX-ARE-ROOT` |
| SAMPLE-CRAFT-02 | craft | `projects/body-war/.craft/ledger.yml` | `contexts[0]` / `CTX-BODY-WAR-ROOT` |
| SAMPLE-CRAFT-03 | craft | `projects/domainspec-v2/.craft/ledger.yml` | `contexts[0]` / `CTX-DSV2-ROOT` |
| SAMPLE-CRAFT-04 | craft | `projects/ide-extension/.craft/ledger.yml` | `contexts[0]` / `CTX-IDEEXT-L0` |
| SAMPLE-WORKPACK-01 | invoke-work-pack | `cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/WORK-PACK.md` | heading `## Objective` |
| SAMPLE-WORKPACK-02 | invoke-work-pack | `cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md` | heading `## Objective` |
| SAMPLE-WORKPACK-03 | invoke-work-pack | `projects/body-war/docs/features/parque-taquaral-online-mvp/WORK-PACK.md` | heading `## Objective Summary` |
| SAMPLE-WORKPACK-04 | invoke-work-pack | `projects/ide-extension/development/manual-session-bridge-plan/WORK-PACK.md` | heading `## Objective Summary` |

Holdout:

| Sample | Stratum | Source | Selector |
|---|---|---|---|
| SAMPLE-DISPATCH-05 | dispatch | `projects/ide-extension/development/manual-session-bridge-plan/manual-session-bridge-plan.dispatch.json` | JSON Pointer `/intent` |
| SAMPLE-CRAFT-05 | craft | `projects/poker-agent-arena/.craft/ledger.yml` | `contexts[0]` / `CTX-PAA-ROOT` |
| SAMPLE-WORKPACK-05 | invoke-work-pack | `projects/poker-agent-arena/WORK-PACK.md` | heading `## Objective` |

## Hard constraints

- Do not modify schemas, validator, protocol, observation kinds, or metrics after
  this selection is frozen.
- Do not infer an intent actor merely from a file path; artifact provenance and
  intent source are separate observations.
- Do not turn the current output hypothesis into scope approval or purpose.
- Do not populate missing target pressure from a generic desire to improve.
- Do not treat unresolved fields as shape failure.
- Do not select fields or record owner approval in live rows.
- Do not write any selected source file.

## Decision pack

No blocker decision remains. The approved plan already chooses JSONL, one author,
fixed strata, unchanged holdout rules, and a local Task Session fallback. Source
selection uses the predeclared 4+4+4 plus 1+1+1 stratification and distinct
artifact families. Any source drift after manifest creation is a block, not a
choice to auto-repair.

## Validation surface

Run the project-local Node validator with the manifest and repository root, then
independently check 15 unique samples, 12+3 assignment counts, all frozen input
hashes, metric arithmetic, result claim wording, and the terminal receipt.

## Excluded context

- Canonical definition prose beyond the already approved D39/D56 source
  contracts: not required to populate this bounded corpus.
- Public Arcanum implementation sources: outside the private experiment and no
  live capability implementation is being tested.
- Conversation history: the dispatch intent record is the durable source; memory
  or recollection cannot fill missing fields.
- Any additional corpus file: would break the fixed 12+3 design.

## Next action

Create and validate the frozen corpus manifest. If it passes, populate the 12
rows, lock the unchanged rules, then expose and populate the three held-out rows.
