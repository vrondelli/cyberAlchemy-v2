---
node_type: refresh-report
is_session: true
status: complete
created: 2026-07-02
spell: invoke
mode: refresh
phase_status: pass
mutation_mode: proposal-only
target_artifact: DomainSpec v2 R3 one-pass implementation readiness
supersedes: ../2026-07-02-r3-edge-law-artifact-refresh/REFRESH-REPORT.md
source_decision_record: ../../governance/edge-signature-authority-decisions.md
---

# Invoke Refresh Report - R3 One-Pass Implementation Readiness

## Verdict

Refresh input is valid and the R3 task surface is ready to route as one bounded implementation pass.

This refresh supersedes the earlier proposal-only R3 edge-law refresh. The earlier package correctly found
artifact drift, but it still carried unresolved options for root authority, Entity-to-Entity association,
and Saga connectability. Those decisions are now resolved in
`../../governance/edge-signature-authority-decisions.md`:

- Root owns DomainSpec language authority; implementation owns only necessary views.
- Relationship authority lives in root `definitions/relationships/`.
- Validators read root machine authority directly.
- Entity-to-Entity semantic relations are first-class.
- Saga gets first-class signatures.

Mutation mode remains `proposal-only` because `invoke refresh` does not execute the target lifecycle. The
next owner is `task-session`, applying the one-pass manifest in
`ONE-PASS-TASK-MANIFEST.md`.

## Scope

Refresh scope: R3 edge-signature authority and its immediate planning, projection, validator, fixture, and
definition-routing artifacts.

Evidence date: 2026-07-02.

Primary source context:

- `../../governance/edge-signature-authority-decisions.md`
- `../../../../research/2026-07-02-first-class-category-boundary/findings.md`
- `../../reviews/2026-07-02-r3-edge-law-formalization/findings.md`
- `../../HANDOFF-novice-test-edge-findings.md`
- `../../../../research/2026-07-01-composability-edges-taxonomy-synthesis.md`
- `../2026-07-02-r3-edge-law-artifact-refresh/REFRESH-REPORT.md`
- `../2026-07-02-r3-edge-law-artifact-refresh/REFRESH-PATCH-PROPOSAL.md`

Target artifacts for the next pass:

- `projects/domainspec-v2/development/reformulate-batch1/DESIGN.md`
- `projects/domainspec-v2/development/reformulate-batch1/WORK-PACK.md`
- `projects/domainspec-v2/development/reformulate-batch1/implementation-layering.md`
- `projects/domainspec-v2/development/meta-type-formalization/DESIGN.md`
- `projects/domainspec-v2/development/meta-type-formalization/WORK-PACK.md`
- `projects/domainspec-v2/development/meta-type-definitions/WORK-PACK.md`
- `projects/domainspec-v2/development/meta-type-definitions/CANDIDATES.md`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/definitions/relationships/relationships.md`
- `projects/domainspec-v2/impl/spec/RELATIONSHIPS.md`
- `projects/domainspec-v2/impl/spec/meta-types/**/*.schema.yml`
- `projects/domainspec-v2/impl/tools/validate-relationships.ts`
- `projects/domainspec-v2/impl/tools/validate-content.ts`
- `projects/domainspec-v2/impl/tools/tests/*`
- `projects/domainspec-v2/impl/spec/__fixtures__/*` or equivalent fixtures
- `projects/domainspec-v2/impl/package.json`

## Refresh Signals

| id | type | evidence | target artifacts | claim | safety |
| --- | --- | --- | --- | --- | --- |
| R3R-S1 | blocker_resolved | `edge-signature-authority-decisions.md` now has `result: PASS` and blockers remaining 0. | all R3 pass artifacts | R3 authority/signature blocker is resolved. | safe |
| R3R-S2 | blocker_resolved | AUTH-1..4 select all-language root authority, `definitions/relationships/`, direct root read, and C1 amendment. | root relationship files, validators, projection docs | Authority surface is no longer an option fork. | safe |
| R3R-S3 | blocker_resolved | EDGE-1 selects first-class semantic Entity relation family. | relationships authority and fixtures | Entity-to-Entity association is first-class R3 work. | safe |
| R3R-S4 | blocker_resolved | EDGE-2 selects first-class Saga signatures. | relationships authority, Saga fixtures | Saga connectability is no longer open. | safe |
| R3R-S5 | evidence_added | First-class category findings define the promotion rubric and Entity/Saga implications. | relationships authority | First-class relation promotion requires stable contrast, typed signature, inverse policy, downstream obligation, and witness. | safe |
| R3R-S6 | status_changed | Earlier refresh blockers for Entity and Saga are now resolved. | old refresh residue, work-pack | The next route changes from decision-gate to task-session. | safe |
| R3R-S7 | artifact_drift | `DESIGN.md` and `WORK-PACK.md` still say `>29` and implementation-local relationships. | batch-1 planning docs | Planning docs must stop encoding stale count-led acceptance. | needs_review |
| R3R-S8 | artifact_drift | `RELATIONSHIPS.md` is still a 29-label human table; validator parses labels only. | root authority, projection, validator | R3 still lacks machine-enforceable endpoint signatures. | needs_review |
| R3R-S9 | artifact_drift | `operation.schema.yml` says Operation is source of `performs` and `emits`, while the relationship table makes Entity the source. | schemas, consistency check, tests | Schema edge participation must be checked against root signatures. | needs_review |
| R3R-S10 | route_changed | Composability synthesis says R3-P1 is source-widening, R3-P2 is likely a signature property, and R3-P3 is Event composite split. | relationship normalization | These are in-pass reconciliation rules, not separate pre-gate blockers. | safe |
| R3R-S11 | route_changed | Review attacks demote Event payload/publisher as nonblocking endpoint work and merge Operation -> ValueObject into F2. | one-pass manifest | The next implementation pass can enforce unambiguous endpoints while recording Event composite residue. | safe |
| R3R-S12 | artifact_drift | R7 routing still has stale `impl/spec/DEFINITIONS.md` references in planning surfaces. | R7 planning, definitions package | R7 must point to root `definitions/` and delay DS-D2/DS-D8 promotion until R3 lands. | safe |

## Delta Summary

| delta class | count | summary |
| --- | ---: | --- |
| blocker_resolved | 4 | R3 gate pass; authority surface, Entity family, and Saga signature decisions resolved. |
| evidence_added | 1 | First-class category boundary rubric governs promotion and inverse policy. |
| status_changed | 1 | R3 moves from decision-gate to task-session readiness. |
| route_changed | 2 | R3-P1/P2/P3 are in-pass reconciliation rules; next route is SWU-R3A. |
| artifact_drift | 4 | Planning docs, relationship authority, validator behavior, schema participation, and R7 routing remain stale until applied. |

## One-Pass Scope

The next pass should be one bounded SWU:

```text
SWU-R3A: root relationship authority and endpoint validation
```

The pass is allowed to touch planning docs, root relationship authority, implementation projection, validators,
fixtures, schema participation evidence, and package validation scripts only where they are required to make
R3 executable.

It must not promote DS-D2 or DS-D8 definition rows until the root relationship authority exists and the
post-reconciliation count is known.

## Ready Decisions

The implementation pass should treat these as locked:

- Authority path: `definitions/relationships/relationships.yml` and `definitions/relationships/relationships.md`.
- Projection path: `impl/spec/RELATIONSHIPS.md`.
- Validator path: `validate-relationships.ts` reads root machine authority directly.
- Notation: `Source --[verb]--> Target` is display only.
- Category wording: "typed composable graph fragment"; full category laws are future work.
- Entity family: first-class, with `owns` and `belongs-to` refined now.
- Inverse policy: generated inverse of `owns` is `owned-by`; `belongs-to` is a distinct candidate, not `owns^-1`.
- `depends-on`: defer unless a witness proves distinct validation behavior.
- Saga: first-class `Saga --[orchestrates]--> Operation[]` with cross-feature/participant/compensation obligations.
- Event endpoint split: `Operation --[produces]--> Event`; `Entity --[emits]--> Event`; reject `Operation --[emits]--> Event`.
- R3-P1: widen `queries` to the accepted Behavioral-to-Entity source shape or its normalized finite signatures.
- R3-P2: treat Operation-to-ValueObject returns as a signature property unless implementation evidence proves a distinct edge.
- R3-P3: record Event payload/publisher composite as residue; do not block endpoint enforcement for unambiguous edges.

## Proposed Changes

The executable patch proposal is in `REFRESH-PATCH-PROPOSAL.md`.

The task-session handoff is in `ONE-PASS-TASK-MANIFEST.md`.

## Skipped Changes

- No target artifact mutation was applied by this refresh.
- No canonical edge count was chosen by Invoke; the count belongs to the implementation pass after normalization.
- No DS-D2 or DS-D8 promotion was applied.
- Full category laws were not added to R3.

## Remaining Gaps

No blocker-level human decision remains for R3A.

Target-artifact gaps to close during the implementation pass:

- Encode the exact finite signature list and final count.
- Decide whether each normalized source set is represented as one multi-source signature or several concrete rows.
- Add or reuse fixtures that exercise Concept Registry type lookup.
- Add schema edge-participation consistency checks after the root signature loader exists.
- Keep Event payload/publisher as named residue unless the pass can express it without destabilizing endpoint enforcement.

## Dispatch Technique Trace

- `sequence`: decision evidence -> refresh signal model -> one-pass manifest -> task-session route.
- `handle_handoff`: prior refresh and novice-use handoff are referenced by path and folded into a single SWU.
- `owner_boundary_check`: Invoke refresh authors readiness only; `task-session` owns mutation.
- `artifact_contract_bridge`: each target artifact maps to a validation or authority contract.
- `concrete_path_evidence`: every signal names source and target paths.
- `residue_ledger`: final count, DS-D2/DS-D8 promotion, and Event composite remain named.
- `authority_split_gate`: root definitions own relationship authority; implementation is projection and consumer.
- `validation_loop`: next pass must prove JSON/YAML parse, endpoint rejection, schema consistency, and aggregate validation.

Full dispatch JSON was not required: this refresh does not delegate subagents, move protected context, or
create a reusable cross-capability route beyond the local task-session handoff.

## Distill Validation

Verdict: `pass`.

Smallest coherent unit: SWU-R3A is one authority/validator unit. Splitting root authority from validator
implementation would leave either unconsumed authority or a validator without a trustworthy source. Expanding
to DS-D2/DS-D8 promotion would overreach beyond R3A.

## Validation

Refresh package validation performed:

- `refresh-report.json` parse: pass.
- Refresh package whitespace scan: pass.
- Source relative path check: pass.
- Existing decision record gate: pass.
- Old blocker scan in new package: pass.
- Target validation remains next-route work, not refresh completion.

## Next Route

Run `task-session` on `ONE-PASS-TASK-MANIFEST.md`.
