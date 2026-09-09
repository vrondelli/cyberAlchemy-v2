# TASK-READINESS-OWNERS

## Objective

Resolve the acceptance-critical decisions that Invoke cannot infer: runtime
contract/implementation owners, five transition owner families, admitted
implementation root, fixture caps, isolation mechanism, retention posture, and
fixture proposal compatibility.

## Layer And Slice

Pre-L0, S-000, W0.

## Inputs And Outputs

Inputs: [DESIGN-LEDGER.md](../../DESIGN-LEDGER.md) BG-001–007 and
[cross-task-decisions.md](../shared/cross-task-decisions.md).  
Outputs: exact decision records owned by `decision-gate`; no implementation
files.

## Ordered Decision Rules

1. Name, do not infer, the runtime-contract and implementation owners.
2. Bind each transition family separately.
3. Ratify or replace the candidate private implementation root.
4. Approve/revise every fixture cap and name measurement ownership.
5. Select an enforceable local isolation mechanism.
6. Keep retention/GC unavailable until its owner accepts a policy.
7. Decide whether the fixture draft type is PromotionRequest-compatible.
8. Record rejected alternatives and scope ceiling.

## Smallest Working Unit Exemption

Allowed because the task ID contains `READINESS` and it is decision/closure
only. It performs no source mutation.

## Done Criteria

Every W0 blocker has an owner-held decision receipt, or the plan remains
blocked with no SWU selected.

