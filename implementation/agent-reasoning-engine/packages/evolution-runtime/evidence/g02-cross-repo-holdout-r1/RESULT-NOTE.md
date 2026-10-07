# G02 cross-repository holdout r1 — result

## Decision

The three tasks in [PLAN.md](PLAN.md) were fixed before model dispatch (plan SHA-256 `16708f9d66cc459d2100264cfba89b9f4b57e8691ca27f9c8a90b0a522a5a294`). All three ARE/DSH pairs completed with valid selections, complete known-token accounting, frozen predictions, pre-score seals, and native scores. No task was substituted or excluded. Two of three tasks passed the strict individual four-gate test; the NodeBB socket migration task failed both quality gates and remains included.

| Predeclared aggregate metric | ARE | DSH | Gate |
| --- | ---: | ---: | --- |
| Mean native Span-F1 | 0.34532 | 0.27268 | Pass |
| Mean native File-F1 | 0.51563 | 0.37473 | Pass |
| Sum of known model tokens | 504,160 | 998,538 | Pass — 49.51% fewer |
| Sum of arm seconds | 685.381 | 884.472 | Pass — 22.51% less |

The predeclared aggregate gate **passes**: ARE gained 0.07264 mean Span-F1 and 0.14090 mean File-F1 while using fewer summed tokens and arm seconds. The result is descriptive evidence for this bounded two-repository, three-task holdout, not statistical proof over all ContextBench tasks or full campaign completion.

Per-task details and receipt roots:

| Task | Strict decision | ARE / DSH Span-F1 | ARE / DSH File-F1 | ARE / DSH tokens | ARE / DSH seconds | Receipt root |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| NodeBB maintenance access | Pass | 0.28537 / 0.13242 | 0.63636 / 0.23529 | 202,523 / 363,365 | 262.619 / 370.938 | `/opt/are-benchmark-runs/g02-cross-layer-holdout-nodebb-maintenance-r1/` |
| Flipt metadata config | Pass | 0.27705 / 0.18038 | 0.21053 / 0.11111 | 197,532 / 346,639 | 203.291 / 251.535 | `/opt/are-benchmark-runs/g02-cross-layer-holdout-flipt-metadata-r1/` |
| NodeBB socket migration | Fail — quality | 0.47355 / 0.50524 | 0.70000 / 0.77778 | 104,105 / 288,534 | 219.471 / 261.999 | `/opt/are-benchmark-runs/g02-cross-layer-holdout-nodebb-writeapi-r1/` |

Each root contains `FREEZE.json`, `PAIR-PRE-SCORE-SEAL.json`, `PAIR-DECISION.json`, both arm predictions and cost receipts, and native scores. The stable candidate ranker SHA-256 in all three decisions was `70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce`; a separately frozen one-line own-property guard prevented inherited `constructor` from crashing source ranking. Rejected history/packet/named-type diagnostics were not part of this holdout.

## Open Questions

- Does this advantage persist on a larger, independently sourced holdout with uncertainty intervals?
- Why did ARE trail on the socket-to-Write-API migration, and can its source selection improve without overfitting this now-exposed task?
- How should transport-failure overhead be incorporated into a separate operational reliability metric? No transport failure occurred in these three holdout pairs.
