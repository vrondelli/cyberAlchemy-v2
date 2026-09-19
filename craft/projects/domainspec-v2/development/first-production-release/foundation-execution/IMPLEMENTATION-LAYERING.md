---
module: domainspec-v2-foundation-execution
version: current
status: planned
updatedAt: 2026-07-17
docType: implementation-layering
---

# Implementation Layering: Foundation Execution

## Purpose

Keep Layer 0 minimal and prevent the desired engine from inventing the authority, profile, or direction it is supposed to consume.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Included now | Deferred scope | Exit evidence | Promotion decision |
|---|---|---|---|---|---|---|
| L0 Guard trust | After this layer, we know whether current repository evidence still satisfies the retired-orchestration invariant. | Review four violating files, pin exact dispositions, restore the guard, kill seeded active and digest-drift fixtures. | SGRM-006/007 retry only. | Authority census and all semantic artifacts. | retry receipts and zero-violation report. | proceed to FPR-01 or stop on active reference. |
| L1 Authority and profile lanes | After this layer, we know whether one ratified source baseline can support an exact backend release profile while UI development advances independently. | FPR-01 baseline followed by W2B backend digest; W2U uses its own development receipts. | source census/dispositions, backend product/profile/pilot matrices, and an external UI work-pack projection. | B-to-Spec content, graph schema, UI release admission. | owner ratification, stable backend profile digest with red controls, and independently tracked UI receipts. | backend receipt opens direction/mapping; UI completion routes only to its authority owners. |
| L2 Governed meaning | After this layer, we know whether a bounded business plane has explicit precedence and a total mapping into authoritative Spec sources. | direction decision plus CT-1 and EC-3/EC-4 mapping witnesses. | BO, BK, B manifest, contradiction policy, total B-to-Spec map. | compiler IR, architecture/formal/verification planes. | accepted decision, mapping receipt, endpoint/orphan/collapse mutants. | proceed to projection or remediate direction. |
| L3 Semantic projection | After this layer, we know whether one exact Spec source can be projected and independently retracted without silent loss. | two nodes, one admitted edge, one explicit quotient, separate comparator. | required-source manifest, Sg/G artifacts, schemas, quotient registry, mutants. | broader type/edge coverage and FPR-05 onward. | totality report and independent retraction receipt. | admit read-only dogfood or reopen FPR-04. |

## Non-Regression Guardrails

- Later layers must rerun the live guard and preserve every earlier receipt input digest.
- A downstream artifact cannot replace its upstream authority source.
- A generated graph is a projection, not a second semantic authority.
- The FPR-04 comparator must not call the compiler/retraction function as its oracle.
- Deferred breadth stays deferred even if the current prototype can parse more types.
- A blocker or incomplete receipt in W2B or W2U cannot change the sibling lane's
  state. Only concrete failure of a named shared invariant may open a
  cross-lane coordination blocker.

## Nested L1 Remediation Boundary

`SWU-FPR01-003`, the nested W1R repair/replay route, and `SWU-FPR01-004` are
complete. The final receipt ratifies the exact baseline digest without mutating the
baseline artifact:

| Nested step | Decision question | Minimum working unit | Exit evidence | State |
|---|---|---|---|---|
| L1-R1 guard input | After this step, we know whether every current retired-name match is exact, reviewed, and non-active. | Exact content-pinned classifications without changing the frozen manifest. | zero violations, manifest digest equality, seeded active and digest-drift controls killed | completed |
| L1-R2 sample input | After this step, we know whether the normalized sample contract can be satisfied without invented domain semantics. | Required registry and graph table shapes preserving no declared relationships. | deterministic clean lint, focused parser tests, zero invented edges | completed |
| L1-R3 replay | After this step, we know whether the existing FPR01-003 package passes the complete current repository matrix. | Join both repair receipts; rerun canonical validator twice, mutants, and aggregate validation. | superseding FPR01-003 PASS receipt; 101/101 aggregate tests | completed |
| L1-R4 ratification | After this step, we know whether required owners and an independent verifier bind the same exact baseline package. | Digest-bind the package and its source/guard/replay evidence; reject one deliberate mutation. | verified FPR01-004 receipt with 19/19 bindings and `E_STATUS` mutation rejection | completed |

The two input repairs retained disjoint write scopes and joined only at L1-R3.
L1-R4 independently ratifies that unchanged package and closes W1. This does not
select the supported-profile successor.

## Recommended Next Layer

- Backend lane: resume `SWU-FPR02-001` at four remaining profile/pilot owner
  decisions; UI completion is not an input.
- UI lane: `SWU-UIP-001..004` are complete and `SWU-UIP-005` is independently ready in the existing required UI
  profile work-pack; backend provider/pilot decisions are not inputs.
- Evidence available: synchronized FPR-01 ratification, resolved lane contract,
  accepted product decision, and each lane's owned planning artifacts.
- Major deferred scope: backend profile implementation, UI authority admission,
  semantic-engine mutation, release entry, and production authority.
