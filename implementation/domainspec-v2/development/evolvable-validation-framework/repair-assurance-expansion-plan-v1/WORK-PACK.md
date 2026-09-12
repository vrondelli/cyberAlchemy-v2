---
module: repair-assurance-expansion
version: v1
status: planning-candidate
updatedAt: 2026-09-12
docType: work-pack
authority_effect: none
---

# WORK-PACK: Repair Assurance Expansion

## Control fields

| Field | Value |
| --- | --- |
| workPackGateStatus | executing |
| complexity | high |
| outputMode | split |
| executionPackRef | [execution-pack.md](execution-pack.md) |
| layeringArtifactRef | [implementation-layering.md](implementation-layering.md) |
| activeLayerWindow | L2 |
| readinessProfile | pilot |
| lastUpdatedAt | 2026-09-12 |

The planning gate passes. Task Session is excluded by owner direction and
SWU-T0-01 is the first selectable unit. This file is the planning control
panel, not implementation authorization or admitted execution state.

## Objective and success condition

Deliver a falsification-resistant 48-case CRABS assessment, independently replay
it, transfer the evidence contract to one owner-confirmed financial-settlement
property, and assemble a measured private service candidate.

Success requires nodes A-O to meet their exit criteria. L2 and L3 may conclude
with a counterexample, bounded no-counterexample, inconclusive or conflicting
result; scientific truthfulness is required. Promotion requires complete
evidence and reviewer agreement or explicit resolution of disagreement.

## Delivery slices and task board

| Task | Goal | Layer | Wave | Depends on | Gate | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [T0](work-pack/tasks/TASK-T0-RECONCILE.md) | Remove obsolete gate, audit current C3 state and freeze the L2 contract | L2 | [W0](work-pack/waves/W0.md) | completed reference case | passed | complete |
| [T1](work-pack/tasks/TASK-T1-HARDEN.md) | Complete and verify R00-R08 mechanism repairs | L2 | [W1](work-pack/waves/W1.md) | T0 | passed | complete |
| [T2](work-pack/tasks/TASK-T2-EXECUTE.md) | Freeze and execute the complete 48/48/2 attempt | L2 | [W2](work-pack/waves/W2.md) | T1 | passed | complete |
| [T3](work-pack/tasks/TASK-T3-FALSIFY.md) | Run negative controls and assess L2 evidence | L2 | [W2](work-pack/waves/W2.md) | T1; joins T2 | passed | complete |
| [T4](work-pack/tasks/TASK-T4-REVIEW.md) | Independently replay and decide L2 promotion | L2 | [W3](work-pack/waves/W3.md) | T2, T3 | reviewer executing | in-progress |
| [T5](work-pack/tasks/TASK-T5-TRANSFER.md) | Select, bind, evaluate and replay financial settlement | L3 | [W4](work-pack/waves/W4.md) | T4 promotion | blocked B-003 | not-started |
| [T6](work-pack/tasks/TASK-T6-PACKAGE.md) | Assemble measured service candidate and decide pilot readiness | L4 | [W5](work-pack/waves/W5.md) | T5 | blocked B-004 | not-started |

## Shared SWU manifest

| SWU | Parent | Dependencies | Write scope | Done criterion | Acceptance evidence | Validation | Owner recommendation | Handoff |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-T0-01 | T0 | none | successor audit/decision artifacts plus exact legacy-gate removal surface | Current R00-R09 state is mapped and Task Session coupling is removed from the successor. | Exact-state matrix, focused diff and technical preflight results. | Review current runner and construction validation outputs. | local assessment lead | ready for context pack |
| SWU-T0-02 | T0 | T0-01 | successor comparison contract and refreshed readiness candidate | Truthful technical readiness and frozen L2 denominator/control matrix exist. | Successor receipt plus hashes; no rewritten history. | Schema/link/digest checks. | candidate owner | blocked by T0-01 |
| SWU-T1-01 | T1 | T0-02 | Exact R00-R04 allowlist in existing implementation repair plan §12 | Evidence interpretation, identity closure and truthful readiness pass. | V01-V09/V17 subset with raw logs. | Commands defined by repaired candidate. | implementation agent | blocked by authorization |
| SWU-T1-02 | T1 | T1-01 | Exact R05-R08 allowlist in existing plan §12 | Supervision, recovery and observation tests pass. | V10-V16 plus integration evidence. | Failure-path and observation tests. | implementation agent | blocked by authorization |
| SWU-T2-01 | T2 | T1-02 | New frozen candidate epoch; no live evidence yet | Candidate, tools, source, commands and bounds freeze acyclically. | Freeze manifest and successful preflight. | Candidate identity and drift checks. | evidence producer | blocked by authorization |
| SWU-T2-02 | T2 | T2-01 | New immutable attempt directory and append-only run index | Exactly 48 native, 48 sanitizer and two CBMC records have typed outcomes. | Raw outputs, result summary, denominator audit and resource record. | Recompute from raw evidence. | evidence producer | blocked by authorization |
| SWU-T3-01 | T3 | T1-02 | Mutation adapters and isolated attempt directories only | Mutation matrix frozen across all five control classes. | Control manifest with expected non-pass outcomes. | Manifest completeness and isolation check. | verification engineer | blocked by authorization |
| SWU-T3-02 | T3 | T2-02, T3-01 | New mutation evidence and L2 assessment | Every control is non-pass and comparison is explained, or promotion blocks. | Raw mutation evidence and paired assessment. | Independent normalization from raw outputs. | verification engineer | blocked by authorization |
| SWU-T4-01 | T4 | T3-02 | Reviewer assignment record only | Reviewer/access/independence boundaries named. | Owner assignment. | Human review of scope. | product owner | unassigned |
| SWU-T4-02 | T4 | T4-01 | Fresh reviewer attempt and review report only | Reviewer reproduces L2 result and controls or records disagreement. | Reviewer raw evidence, corrections and timing. | Package verification plus independent probes. | separate technical reviewer | blocked |
| SWU-T4-03 | T4 | T4-02 | L2 promotion decision only | Promote, remediate, narrow or stop is attributable. | Completion decision linked to evidence. | Requirement-by-requirement audit. | assessment lead + reviewer | blocked |
| SWU-T5-01 | T5 | T4-03 | Financial property decision record only | Domain owner selects C3/P4/revision/stop. | Owner decision with provenance and exclusions. | Decision gate review. | financial domain owner | blocked B-003 |
| SWU-T5-02 | T5 | T5-01 | New transfer package and isolated evidence | Exact implementation binding yields typed result and eight-mutation calibration. | Property, manifests, raw results and core/adapter effort split. | Recompute cases/mutations from evidence. | transfer engineer | blocked |
| SWU-T5-03 | T5 | T5-02 | Fresh reviewer evidence and review only | Separate reviewer reproduces transfer outcome. | Reviewer result and corrections. | Fresh replay. | separate technical reviewer | blocked |
| SWU-T6-01 | T6 | T5-03 | New private service-candidate docs only | Offering, intake, report, data and acceptance templates trace to L2/L3. | Traceability and claim audit. | Link/claim/source validation. | product designer | blocked |
| SWU-T6-02 | T6 | T6-01 | Unit-economics and decision record only | Cost model uses measured hours/compute/retest; owner chooses pilot/revise/defer. | Measured ledger and owner decision. | Recompute totals; inspect claim ceiling. | product owner | blocked B-004 |

One SWU must be selected before mutation-capable work begins. T2-02 and T3-01
may run in parallel only after T1-02 and only with disjoint attempt/mutation
paths. T3-02 joins both results.

## Resolved execution decision

| ID | Decision | Basis | Effect |
| --- | --- | --- | --- |
| B-001-RESOLVED | Do not use Task Session; use exact owner-directed native execution like the completed reference case. | User direction on 2026-09-12 and the existing implementation repair plan §3.2/L1.4. | The hardcoded Task Session gate is a repair target. Technical preflight, frozen inputs, bounded resources, fresh evidence and independent replay remain mandatory. |

## Blockers and open questions

| ID | Scope | Blocker or decision | Owner | Resolution |
| --- | --- | --- | --- | --- |
| B-002-RESOLVED | T1-T4 | Owner authorized native execution of the existing plan on 2026-09-12. | Repository execution owner | Execute within the plan's exact write, command and evidence bounds; no Task Session, commit, push, publication or deployment. |
| B-003 | T5/K | Financial-settlement property meaning and domain owner are unconfirmed. | Financial-settlement domain owner | Select C3, P4, bounded revision or stop after reviewing current evidence and residue. |
| B-004 | T6/O | No measured service candidate exists for product review. | CyberAlchemy v2 product owner | Review T6 output and decide pilot, revise or defer. |
| OQ-001 | L2 | Which implementation repair-plan units already have current passing evidence? | T0 owner | Exact-state audit; do not infer from completion labels. |
| OQ-002 | L2 | Which subject-repair mutants best represent superficial repairs after T1? | Verification engineer | Freeze at least three, including placement, valid-merge and ordering behavior. |
| OQ-003 | L3 | Does the owner prefer pure C3, effectful P4, or both as separate assessments? | Domain owner | T5-01 decision. |
| OQ-004 | L4 | What reviewer qualification and data-handling terms will a real pilot require? | Product owner/customer, later | Research and agree before customer contact. |

Goals validation remains a repository-level planning/admission blocker. It does
not authorize or invalidate this candidate work-pack.

## Handoff

When T0 is selected, generate a strict Context Builder runtime pack for only
SWU-T0-01. Exact owner-directed native implementation owns execution. Preserve
task IDs, source selectors, write scopes and validation; do not route through
Task Session.

## Change log

| Date | Change | Author |
| --- | --- | --- |
| 2026-09-12 | Initial high-complexity successor work-pack | Invoke/Codex planning candidate |
| 2026-09-12 | Native execution authorized; W0 completed and T1 opened | Codex under owner direction |
