# IL-H04 Continuity-Provider Results

Status: provider variant validated and recommended  
Production activation: none

## Outcome

The wrapper and persistent gateway can now create the IL-H04 continuity binding
from a closed, digest-bound state snapshot. The exact thread selector overrides
the consumer default; unresolved consumers fail closed. Provider receipts bind
the snapshot, objective resolution, selector, transition, disposition, and
materialized binding without retaining conversation content.

| Check | Result |
| --- | --- |
| Closed snapshot integrity | verified |
| Exact selector precedence | verified |
| Unknown selector | fails closed |
| New transition | low-risk bypass |
| Continue transition | high-risk binding surfaced by host |
| Provider/model calls | 0 |
| Repository default | disabled |
| Focused tests | 28/28 passed |
| Full Codex wrapper tests | 219/219 passed |
| Full evolution-runtime tests | 128/128 passed |
| Coordinator settlement | 6/6 tasks completed |
| Restart / SQLite-loss recovery | verified / verified |

- Snapshot digest: `dd7881c349f3d4b97fddd5138ac0c69d8e255bc52e36e8ff864705a2cc9cc0a4`
- Gateway canary digest: `78a4b992c32eed1423ab3d84a1bcb816c0853b0847a4a7481168ade500c858c2`
- Validation digest: `2e2b4dcad1be459062e95be62042e274096d6c30ae5cbd433dc042868e6ffecb`
- Provider package digest: `1ee7240cbaa891e9a2911050995be4c19144c03e1abb06fcf4ff7afab203298f`
- Coordinator settlement digest: `25311174104d81f592921683cfd094dc19036cd1812e17e8d7cb3cf590daaa85`

## Decision

`recommend-provider-variant`. Construction and evidence are complete. A later
controlled-upgrade decision may consider activation only for the confirmed
shared RPC/headless scope and must provide an exact state snapshot.

## Claim boundary

This is a deterministic local gateway integration result. It is not a
real-user effectiveness result, Desktop UI proof, activation, deployment,
publication, or authority grant.

## Open Questions

Open questions are owned by [README.md](README.md#open-questions).
