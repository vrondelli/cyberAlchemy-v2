# Context pack — SWU-ARE-001 run 001

## Resolution

- Task: `TASK-ARE-EVALUATOR-001 / SWU-ARE-001`
- Mode: `standard`, strict obligation mapping
- Resolution source: explicit current-session authorization plus synchronized
  Work Pack and task contract
- Runtime: local Node `v22.12.0`, ESM, standard library only
- Strict coverage: `pass`
- Handoff pack: none; this is a local Task Session

## Obligation matrix

| ID | Obligation | Controlling evidence | Status |
|---|---|---|---|
| `OB-SWU1-01` | Candidate is selected, incomplete, dependency-ready, and explicitly authorized. | Work Pack task/SWU rows; synchronized evaluator task header; current user request. | covered |
| `OB-SWU1-02` | Keep implementation inside evaluator package, fixture family, and generated run paths. | Evaluator task future write scope. | covered |
| `OB-SWU1-03` | Return exactly one finite outcome under frozen inputs. | Component contract ordered reducer; SPEC outcome algebra. | covered |
| `OB-SWU1-04` | Reproduce applicability, precedence, exceptions, conflicts, support, defeaters, and challenge closure. | Component contract; applicability and challenge policies. | covered |
| `OB-SWU1-05` | Canonical UTF-8 JSON and exact SHA-256 binding. | Evaluator task record contract. | covered |
| `OB-SWU1-06` | Persist entry before evaluation and receipt before effect decision; persistence failure yields zero effect calls. | Decision/effect flow; component receipt contract. | covered |
| `OB-SWU1-07` | Historical replay is byte-identical and performs zero provider/effect calls. | Component replay contract and task done criteria. | covered |
| `OB-SWU1-08` | Only positive outcome plus exact gate pass produces one test marker; repeat is idempotent and changed-content reuse conflicts. | Test-effect policy. | covered |
| `OB-SWU1-09` | Same private entrypoint handles all counterfactuals and two independently owned rule families. | W0 evidence contract and task fixture list. | covered |
| `OB-SWU1-10` | No actor runtime, mutable provider, real effect, AntiBiasVector, authority definition, public Arcanum, or general engine claim. | Task forbidden list and first-witness stop boundary. | covered |
| `OB-SWU1-11` | Acceptance-critical Node test command passes and evidence reports are emitted. | Evaluator task verification; W0 evidence artifacts; execution-pack result shape. | covered |

## Selected context

| Source | Selector | Obligations |
|---|---|---|
| `planning/WORK-PACK.md` | task board, SWU manifest, G-ARE-L0, validation, current state | 01, 09, 11 |
| `planning/work-pack/tasks/TASK-ARE-EVALUATOR-001.md` | complete SWU contract | 01–11 |
| `planning/work-pack/waves/W0-L0.md` | evidence and promotion stop | 09, 11 |
| `planning/IMPLEMENTATION-LAYERING.md` | L0 boundary and invariants | 02, 06, 10 |
| `planning/EXECUTION-PACK.md` | synchronization and expected result | 11 |
| `design/COMPONENT-CONTRACTS.md` | records, reducer, receipt, effect double, replay | 03–08 |
| `design/DECISION-AND-EFFECT-FLOW.md` | order, routing, counterfactuals, stop boundary | 03, 06–10 |
| `spec/SPEC.md` | witness invariant, algebra, acceptance family | 03, 08–10 |
| `decisions/implementation-readiness/APPLICABILITY-POLICY-v1.md` | finite applicability/time/authority rules | 04 |
| `decisions/implementation-readiness/CHALLENGE-CLOSURE-POLICY-v1.md` | finite challenge/timeout rules | 04 |
| `decisions/implementation-readiness/TEST-EFFECT-POLICY-v1.md` | exact synthetic envelope and idempotency | 08 |
| `decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json` | policy gate and controlling digests | 01, 04 |
| `cyberAlchemy-v2/implementation/README.md` | implementation waits for a bounded authorized route | 01, 02 |
| `cyberAlchemy-v2/AGENTS.md` | private/public boundary and durable open-question rule | 02, 10 |

Files selected: 14. All selected evidence closes at least one obligation.

## Implementation decisions

No blocker-level choice remains.

1. Canonical record digest: compute `content_digest` over the canonical record
   with that field omitted; separately compute SHA-256 over the final exact
   serialized bytes when the record is persisted. Classification:
   nonconsequential and reversible; this avoids impossible self-hashing while
   preserving exact-byte evidence.
2. Persistence: use an injectable Node standard-library atomic file store with
   temp-write, file sync, rename, and directory sync plus deterministic failure
   injection. Classification: contract-prescribed, reversible L0
   infrastructure.
3. Fixture representation: two owner-distinct JSON family records drive one
   generic evaluator entrypoint; counterfactual cases vary one declared field
   at a time. Classification: contract-prescribed and reversible.
4. No subagent: local execution keeps one write owner and avoids a join for one
   tightly coupled SWU. Subagent closeout will be `n/a`.

## Validation criticality

Every done criterion, fixture, replay check, persisted-order check, effect
boundary check, digest check, and declared Node test command is
acceptance-critical. No substitute is pre-authorized.

## Open Questions

This SWU opens no implementation-blocking question. Downstream durability,
incident, rollout, intent-evidence, and anti-bias questions remain owned by
[`../../../../../spec/SPEC.md#open-blockers-and-residue`](../../../../../spec/SPEC.md#open-blockers-and-residue).
