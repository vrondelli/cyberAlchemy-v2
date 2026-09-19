---
work_pack_id: WP-UIP-001
status: complete-with-external-residue
next_owner: authority-packet owners
next_swu: null
mutation_authority: none
complexity: high
output_mode: split
active_layer_window: closed
distill_validation: pass
dispatch_validation: pass
---

# Required UI Profile Work Pack

## Objective

Build and audit a required-by-design development UI profile on the existing
DomainSpec graph engine, then hand exact placement and authority deltas to their
owners. This work-pack is the lifecycle owner for `FPR-02U`. Real-corpus
confidence and `FPR-02B` backend state do not block this work-pack.

## Task Board

| Task | Layer | State | SWUs |
| --- | --- | --- | --- |
| [TASK-UIP-CONTRACT](work-pack/tasks/TASK-UIP-CONTRACT.md) | L0 | complete | 001 |
| [TASK-UIP-MECHANICS](work-pack/tasks/TASK-UIP-MECHANICS.md) | L1 | complete | 002-003 |
| [TASK-UIP-GRAPH](work-pack/tasks/TASK-UIP-GRAPH.md) | L2 | complete | 004-005 |
| [TASK-UIP-AUTHORITY](work-pack/tasks/TASK-UIP-AUTHORITY.md) | L3 | complete | 006 |
| [TASK-UIP-VERIFY](work-pack/tasks/TASK-UIP-VERIFY.md) | L3 | complete-with-external-residue | 007 |

## SWU Manifest

| SWU | Parent | Layer | Dependencies | State |
| --- | --- | --- | --- | --- |
| SWU-UIP-001 | [contract](work-pack/tasks/TASK-UIP-CONTRACT.md) | L0 | none | complete |
| SWU-UIP-002 | [mechanics](work-pack/tasks/TASK-UIP-MECHANICS.md) | L1 | 001 | complete |
| SWU-UIP-003 | [mechanics](work-pack/tasks/TASK-UIP-MECHANICS.md) | L1 | 002 | complete |
| SWU-UIP-004 | [graph](work-pack/tasks/TASK-UIP-GRAPH.md) | L2 | 001-003 | complete |
| SWU-UIP-005 | [graph](work-pack/tasks/TASK-UIP-GRAPH.md) | L2 | 004 | complete-with-external-residue |
| SWU-UIP-006 | [authority](work-pack/tasks/TASK-UIP-AUTHORITY.md) | L3 | 005 | complete |
| SWU-UIP-007 | [verify](work-pack/tasks/TASK-UIP-VERIFY.md) | L3 | 001-006 | complete-with-external-residue |

Each non-exempt SWU has one parent, a closed write scope, implementation
algorithm, done criteria, acceptance evidence, validation command, execution
owner, and Context Builder anchors in its task contract.

## Waves

- [W0](work-pack/waves/W0.md): concept and representation contract.
- [W1](work-pack/waves/W1.md): formation schemas and synthetic calibration.
- [W2](work-pack/waves/W2.md): existing-engine graph compilation and traversal.
- [W3](work-pack/waves/W3.md): authority packet and integrated audit.

## Gates

| Gate | Condition | Current state |
| --- | --- | --- |
| G0 representation | exactly eleven required concepts; no unknown or implicit placement | pass |
| G1 mechanics | all contracts reject empty/whitespace and six fixture classes close | pass |
| G2 engine | explicit dev profile compiles through existing engine with stable views/digest | pass |
| G3 owner firewall | packet contains proposed deltas but canonical files remain unchanged | pass |
| G4 audit | all owned gates and the repository aggregate validation pass | pass |

## Active Gaps

- `GAP-UIP-ENDPOINTS`: Adapter alias and State Indicator split require explicit
  `shapes`/`reflects` endpoint reconciliation by the DS-D8 owner. This blocks
  canonical application, not development implementation.
- `GAP-UIP-AUTHORITY`: DS-D1 and supported-profile owners have not activated the
  development result. The work-pack ends with their decision packet.
- `GAP-UIP-CONFIDENCE`: real-corpus breadth and independent review remain
  unmeasured for several concepts. This is non-blocking confidence residue.
- `GAP-UIP-AGGREGATE-GUARD` is resolved. The exact post-manifest backend
  evidence references are classified by path, match count, and content digest;
  repository aggregate validation passes.

## Validation Strategy

Run focused tests per SWU. The final audit runs from
`projects/domainspec-v2/impl`:

```bash
npm run tools:test
npm run engine:test
npm run validate
npm run typecheck
```

## Stop Conditions

- Stop any SWU that edits DS-D1, DS-D8, or supported-profile authority outside
  its declared owner-approved scope.
- Stop if a concept disappears because its representation is not a node.
- Stop if synthetic evidence is labeled real, independent, or universal.
- Stop if the implementation creates a second graph/compiler path instead of
  extending the existing explicit-profile input.
- Stop if Adapter or State Indicator residue is silently normalized into an
  unapproved canonical endpoint.

## Next Route

The development work-pack is closed. Route the exact packet to DS-D1, DS-D8,
supported-profile, and R2 owners. No corpus-B, backend-profile, or subagent
decision is required for this closeout.
