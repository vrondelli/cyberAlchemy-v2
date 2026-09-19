---
artifact_id: UIR-EXECUTION-PACK-v0.2
status: successor-plan-ready
complexity: high
output_mode: split
---

# Execution Pack

## Choreography

```text
Historical complete:
W0: 001 -> 003 -> 002
W1: 004 || 005 || 006 || 007
W2: 008 -> 009

Successor:
W2S-L0: 011
W2S-L1: 012 || 013 || 014   (012 requires 011)
W2S-L2: 015                 (requires 012-014)
W3:     010                 (requires 001-009 and 011-015)
```

Only Task Session may execute one selected SWU. Parallel execution of 012-014
requires a fresh `domainspec-subagents-strategy` gate and explicit user
authorization; otherwise execute locally one SWU at a time.

## Shared Receipt Contract

Every successor SWU returns:

- `run_id`, `dispatch_id`, `step_id`, and `swu_id`;
- capability reference and receipt kind;
- input digests and predecessor generation handles;
- files touched and generated artifacts;
- validation commands and results;
- blockers, residue, reroute, and handoff note;
- observability status.

The task-local contracts define additional acceptance evidence.

## Successor Stop Conditions

- Stop if an SWU would edit generation 001, accepted UIF evidence, candidates,
  DS-D1, or DS-D8.
- Stop if `observed-absent` can be built without a complete finite universe,
  pinned digests, enumerated selectors, zero parse/extract errors, and zero
  matches.
- Stop if portability evidence is pooled across candidates or reviewer
  independence is inferred.
- Stop if `missing` is rewritten as `fail`, absence, collapse, or kill.
- Stop if a relationship decision is embedded into the transport packet or
  treated as authority mutation.
- Stop if dossier/index v2 lacks predecessor handles or overwrites v1.
- Stop W3 until receipts for 011-015 are accepted.

## Runtime Handoff

At execution time, Context Builder must select the chosen task contract, this
execution pack, `WORK-PACK.md`, `IMPLEMENTATION-LAYERING.md`, the approved
refresh report, relevant decision/gap selectors, and only the implementation
files named by the SWU write scope. Persist the strict Markdown and JSON/index
handoff under that SWU's run directory.

## Subagent Strategy

- SWU-011, 015, and 010: local execution preferred because each touches shared
  contract or composition surfaces.
- SWU-012, 013, and 014: disjoint lanes eligible for authorized parallelism.
- Every delegated worker owns exactly one SWU and must be joined and closed
  before parent synthesis.
