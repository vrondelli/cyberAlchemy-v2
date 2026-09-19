---
node_type: design
is_session: false
status: candidate
created: 2026-07-09
authored_by: invoke (mode: design)
define: ./DEFINE.md
work_pack: ./WORK-PACK.md
layering: ./implementation-layering.md
target_artifact: DomainSpec v2 R1 AXIOMS authority home and projection closeout
boundary: INTERNAL; governance prose only; no engine algorithm mutation
---

# Design - R1 AXIOMS Authority-Home Closeout

## Architecture Intent

Make the R1 AXIOMS authority explicit and closeable without collapsing
propositions into definitions, without losing Saturn-routed material, and
without leaving `impl/spec/AXIOMS.md` as a hand-authored authority projection.

## Source Contracts

| Contract ID | Source | Required | Notes |
| --- | --- | --- | --- |
| SC-R1-001 | `../WORK-PACK.md` | yes | R1 acceptance and Batch-1 order. |
| SC-R1-002 | `../DESIGN.md` | yes | R1 target result and spec-homing placement. |
| SC-R1-003 | `../../../.craft/ledger.yml` | yes | Resolved Saturn decision and active gap routing. |
| SC-R1-004 | `../../../impl/spec/AXIOMS.md` | yes | Current source text to migrate/reconcile. |
| SC-R1-005 | `../../../authority/constitutions/domainspec-v2-CONSTITUTION.md` | yes | C6 reference target for A2. |

## View 1: Context View

R1 sits inside `CTX-DSV2-REFORMULATE-BATCH1`. It precedes R2 closeout, R4/R5
reformulation, and R6a/R6b constitution work. The target audience is a future
`task-session` executor, not a public reader.

External neighbors:

- `authority/`: canonical governance owner home.
- `impl/spec/`: implementation/spec contract plane; no hand-authored authority
  projection after spec-homing.
- Saturn: future owner for observability/reflection-loop material.
- Craft ledger: status and residue memory; not execution evidence by itself.

## View 2: High-Level Structure View

R1 has three parts:

1. Canonical authority file: `authority/AXIOMS.md`.
2. Projection cleanup: `impl/spec/AXIOMS.md` becomes absent or a non-authority
   redirect stub.
3. Closeout synchronization: manifest, Craft ledger, and human view reflect
   R1 status after validation.

## View 3: Low-Level Components View

`authority/AXIOMS.md` should contain:

- A short status header naming it as the canonical DomainSpec v2 axiom home.
- A retained axiom table:
  - A1: semantic authority precedes implementation.
  - A2: decisions belong to the domain, not adapters; binds to C6.
  - A3: governance methods must be runnable/computable when they gate behavior.
- A routed-material table:
  - A4 -> Saturn observer/executor split.
  - A6 -> Saturn feedback budget.
  - A5 -> split: shift-left stays with DomainSpec C5; reflection routes to Saturn.
- Evidence links to the two governing decisions and the previous `impl/spec`
  source.

`impl/spec/AXIOMS.md` must not keep independent axiom text. Execution should
prefer deletion. If deletion breaks live validation links, replace it with a
minimal redirect stub that names `authority/AXIOMS.md` as authority and carries
no duplicate axiom definitions.

## View 4: Workflow Process View

1. Read the current `impl/spec/AXIOMS.md`, `DEC-B1-SATURN-AXIOM-SCOPE`, and
   `DEC-DSV2-SPEC-HOMING`.
2. Author `authority/AXIOMS.md`.
3. Repoint references from live authority/design surfaces toward
   `authority/AXIOMS.md`.
4. Delete or de-authorize `impl/spec/AXIOMS.md`.
5. Run validations.
6. Synchronize manifest and Craft state.

Failure paths:

- If link validation fails after deletion, use the redirect-stub fallback and
  record temporary projection residue.
- If A2 cannot bind cleanly to C6, block and route to decision-gate.
- If Saturn routing creates orphaned constitution references, record that under
  R6a; do not silently solve R6a inside R1.

## View 5: Decision Flow View

| Decision | Default | Rationale |
| --- | --- | --- |
| Authority file path | `authority/AXIOMS.md` | Keeps axioms under governance authority, not definitions, and avoids adding a new owner folder prematurely. |
| Projection fate | Delete if validation allows; otherwise non-authority redirect stub | Honors no-hand-authored-projection while preserving validation if live links still expect a path. |
| Saturn material | Pointer, not deletion | The Saturn spine does not exist yet; provenance must remain visible. |
| A2 binding | Bind to C6/layering adapter-line | Required by R1 acceptance and current constitution wording. |

## View 6: Dependency Interface View

| Dependency | Interface | Rule |
| --- | --- | --- |
| Craft ledger | `.craft/ledger.yml` row updates | Update only after validation evidence exists. |
| Import manifest | `IMPORT-MANIFEST.md` row status | Mark R1 reformulated only after authority home and projection cleanup. |
| Docs validator | `npm run validate:docs` via `npm run validate` | Must pass after link/path changes. |
| Code-tag validator | `npm run tags:test` | Must remain green even though R1 does not touch code tags. |
| Engine tests | `npm run engine:test` | Must remain green; R1 is governance prose only. |

## Risks

| Risk ID | Risk | Mitigation |
| --- | --- | --- |
| RISK-R1-001 | Duplicating axiom authority in `impl/spec` and `authority`. | Delete the projection or reduce it to a non-authority redirect stub. |
| RISK-R1-002 | Losing Saturn provenance for A4/A6/A5-reflection. | Carry routed-material table with explicit Saturn pointers. |
| RISK-R1-003 | Accidentally doing R6a crosswalk inside R1. | Keep constitution rule rewrites out of scope except A2/C6 link correction references. |

## Dispatch Technique Trace

| Technique ID | Applied To | Validation Expectation | Status |
| --- | --- | --- | --- |
| sequence | Define -> design -> plan -> task-session handoff | Each artifact consumes the prior one. | pass |
| owner_boundary_check | Authority file vs definitions vs impl/spec | Axioms are propositions under `authority/`, not terms under `definitions/`. | pass |
| authority_split_gate | DomainSpec vs Saturn material | DomainSpec retains A1/A2/A3; Saturn gets pointers for observer/feedback material. | pass |
| artifact_contract_bridge | R1 acceptance and validation commands | Work-pack acceptance maps to concrete files and commands. | pass |
| concrete_path_evidence | All evidence claims | Paths and row IDs are named rather than inferred. | pass |
| residue_ledger | R6a/R5/R2 non-goals | Non-R1 residue remains visible and owned elsewhere. | pass |

Full dispatch JSON is not required: the route is a single-owner Task Session
handoff with no protected context movement, subagent fan-out, or cross-capability
delegation beyond normal validation.

## Distill Validation

- Verdict: pass
- Smallest coherent unit: the R1 authority-home closeout.
- Recomposition proof: authority-home + projection cleanup + validation closes
  the parent Batch-1 R1 row and unblocks the R1 side of R2/R6a sequencing.
- Hidden gaps: none acceptance-critical inside R1. R2 UI-11, R5 drift home, and
  R6a/R6b constitution crosswalk are explicitly out of scope.

## Design Gate Result

- Status: pass
- Reason: The six views are covered, the owner boundary is explicit, and the
  downstream plan can be one bounded Task Session.
