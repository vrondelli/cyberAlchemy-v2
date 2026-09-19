---
work_pack_id: DS-FORMALCLAIM-LEAN-EVF@20260824T165704Z
status: exact-plan-candidate-pending-rondelli-acceptance
authority_effect: none
admission_timing: selected-unit-at-task-session
execution_mode: finite-one-shot-until-first-blocker
---

# Work Pack — FormalClaim Lean/EVF Implementation

## Objective and exact acceptance state

Operationalize the accepted `dsv2-formalclaim-multiformalism-lean-extension@3`
Design in 14 single-behavior SWUs. Design semantics are fixed. The exact final
Plan bytes are not yet accepted: Rondelli must accept the candidate manifest
after final hashing. Until that response is recorded, no SWU may be selected or
mutated.

Victor Boscaro is not a Plan gate. C12 applies only to the exact frozen merge
candidate after implementation and validation.

## Source bindings

- Accepted Design candidate digest:
  `e7e6e24c088824b158df4b8604ea852dc8df0c02f4f21977b34fc1733d0534d0`.
- Design acceptance:
  `invoke-design/20260824T150641Z-formalclaim-lean-evf-integration/owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json`.
- Contract source: accepted successor `SPEC.md`, `ARCHITECTURE.md`,
  `SOURCE-CONTRACTS.md`, and `PLANNED-WITNESSES.json`.
- Merge gate: Constitution C12, its decision, schema, hardened validator, and
  tests under `projects/domainspec-v2/authority/pre-merge/`.

## Finite frontier

| Order | SWU | Task | Layer | One owned behavior | Dependency | Status |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | SWU-FCL-001 | TASK-FCL-01-SOURCE | L0 | logic-neutral source-envelope discrimination | none | planned |
| 2 | SWU-FCL-002 | TASK-FCL-02-PROFILES | L0 | exact Lean/DTT language-profile contract | 001 | planned |
| 3 | SWU-FCL-003 | TASK-FCL-03-BINDING | L0 | native-versus-translated Lean binding and mapping validation | 002 | planned |
| 4 | SWU-FCL-004 | TASK-FCL-04-CATEGORY | L0 | local category-model admission and collapse classification | 002 | planned |
| 5 | SWU-FCL-005 | TASK-FCL-05-PROVIDER-CONTRACTS | L0 | Lean provider-manifest admission contract | 002 | planned |
| 6 | SWU-FCL-006 | TASK-FCL-05-PROVIDER-CONTRACTS | L0 | total theorem request/receipt contract family | 003,005 | planned |
| 7 | SWU-FCL-007 | TASK-FCL-06-FIXTURES | L1 | complete 22-witness adversarial matrix | 004,006 | planned |
| 8 | SWU-FCL-008 | TASK-FCL-07-IDENTITY | L1 | deterministic environment-bound identity construction | 006,007 | planned |
| 9 | SWU-FCL-009 | TASK-FCL-08-LEAN-RUNTIME | L2 | exact Lean build/declaration/type/axiom safety inspection | 008 | planned |
| 10 | SWU-FCL-010 | TASK-FCL-09-EVF | L2 | distinct EVF Lean evidence-handle join | 009 | planned |
| 11 | SWU-FCL-011 | TASK-FCL-10-CONFORMANCE | L3 | separate runtime-conformance binding validation | 010 | planned |
| 12 | SWU-FCL-012 | TASK-FCL-11-MIGRATION | L3 | @2-to-@3 local candidate ontology/contract migration | 011 | planned |
| 13 | SWU-FCL-013 | TASK-FCL-12-INTEGRATION | L3 | integrated replay and non-inflation validation | 012 | planned |
| 14 | SWU-FCL-014 | TASK-FCL-13-PREMERGE | L3 | exact C12 freeze and merge-readiness preparation | 013 | planned |

## Atomic acceptance rules

Every unit:

1. owns only the behavior and exact paths listed in `SWU-MANIFEST.json`;
2. runs its structured validation contract without hiding an earlier failure;
3. emits a Task Session governance terminal receipt with exact input/output
   digests, command exits, rollback inventory, claim ceiling, and result;
4. stops if a dependency, identity, semantic choice, owner gate, destructive or
   external effect, credential, network effect, authority change, or
   acceptance-critical check is unresolved;
5. closes through `invoke:refresh` and records exact lifecycle delta and the
   canonical successor before another SWU is admitted.

## Execution control

- Route: one fresh `task-session` per selected SWU, in the exact order above.
- Budget: at most 14 Task Session requests, one per SWU.
- Retry: at most one fresh attempt after an explicitly classified repairable
  owner condition; never overwrite failed evidence.
- Maximum effect: repository-local reversible writes to the exact declared
  target inventory. No network, external system, Git, merge, promotion,
  publication, release, or deployment effect.
- Existing unrelated or pre-existing dirty bytes are preserved. A target with
  an undeclared baseline drift blocks before mutation.
- The Lean provider must use exact toolchain/project/dependency/source inputs;
  planning does not authorize downloading dependencies or modifying Lean proof
  sources.

## Closeout contract

After each Task Session, `invoke:refresh` may update only this Plan's declared
status/transport/gap targets and create
`closeout/<SWU>/INVOKE-REFRESH-RECEIPT.json`. It must rehash the task receipt,
target bytes, validation evidence, and successor. Allowed delta classes are
`evidence_added`, `status_changed`, `blocker_resolved`, and `route_changed`.
The refresh must never execute the successor.

## Final C12 gate

`SWU-FCL-014` prepares, but cannot satisfy by itself, the merge gate:

1. Rondelli assigns the required structural verification level.
2. The exact target branch, frozen base, head, complete repository diff
   inventory, validations, and fixed claim ceiling are bound.
3. The target branch still equals the frozen base and the base is an ancestor
   of the head.
4. Every validation evidence record is `pass` and binds the exact head.
5. Victor supplies a direct structural approval for the exact candidate.
6. The hardened C12 validator passes the exact receipt/candidate.
7. The merge owner independently confirms the response came directly from
   Victor because the validator does not authenticate the principal.
8. Any byte, branch, base, head, inventory, validation, claim-ceiling, response,
   or verification-level drift invalidates the gate.

## Completion ceiling

A fully passed Work Pack establishes an implemented and locally validated
FormalClaim-to-Lean-to-EVF evidence lane under exact fixtures and inputs. It
does not prove a new theorem; prove runtime conformance; establish business
truth; discharge an obligation; promote the ontology; admit a production
provider; merge; publish; release; deploy; or establish production readiness.
