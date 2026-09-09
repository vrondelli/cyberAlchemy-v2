# Design Decision, Risk, And Gap Ledger

## Decisions

| ID | Decision | Status | Consequence |
| --- | --- | --- | --- |
| DD-001 | One explicit configured registration; no discovery/catalog | accepted from research | startup config is outside HTTP |
| DD-002 | Adapter extracts; runtime owns envelope, identity, publication, receipts | accepted from research | adapter overreach fails |
| DD-003 | Immutable create-only snapshots and artifacts | accepted from research | no update/delete HTTP |
| DD-004 | v0 operations are native validation and same-adapter byte/local-ID diff | accepted from research | semantic/cross-adapter work unsupported |
| DD-005 | Draft proposal bytes only | accepted from research | owner review/delivery excluded |
| DD-006 | High-complexity split Plan with blocked execution gate | Invoke decision | planning can pass without claiming readiness |

## Risks

| ID | Risk | Guard | Residual owner |
| --- | --- | --- | --- |
| R-001 | Adapter invents identity or meaning | contract rejection + lossless round-trip fixtures | future runtime-contract owner |
| R-002 | Mixed snapshot under mutation | lock, double extraction, pre/post complete identity | future snapshot owner |
| R-003 | Native rejection becomes “runtime failure” or “valid” | separate fields and negative fixtures | future run owner |
| R-004 | Private path/bytes leak | logical IDs, redaction, containment, zero outbound | future security-risk owner |
| R-005 | Resource caps are decorative | missing measurement fails witness | future cap owner |
| R-006 | Plan is mistaken for execution approval | `selected_swu:none`, blocked work-pack gate | parent/decision-gate |

## Blocking Gaps

| ID | Gap | Required decision/evidence | Route |
| --- | --- | --- | --- |
| BG-001 | runtime-contract owner absent | name owner and accepted contract location | decision-gate |
| BG-002 | implementation owner/write scope absent | name owner and ratify candidate private root | decision-gate |
| BG-003 | five transition-owner families absent | bind registration, snapshot, run, retention/GC, service | decision-gate |
| BG-004 | caps unapproved/unmeasured | approve fixture hypotheses, later measure | decision-gate then Task Session |
| BG-005 | process isolation unselected | choose enforceable filesystem/outbound/memory/timeout mechanism | decision-gate |
| BG-006 | CAV2 profile/adapters absent | owner-authored later slices | deferred |
| BG-007 | Augmentor race residue open | controlled concurrent replay evidence | deferred |

