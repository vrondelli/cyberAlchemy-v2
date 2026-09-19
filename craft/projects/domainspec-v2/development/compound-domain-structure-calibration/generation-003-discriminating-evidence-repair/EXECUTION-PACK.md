---
artifact_id: CDSC3-EXECUTION-PACK-v0.1
status: ready
complexity: high
baseline_wave: W0
active_plan_ref: WORK-PACK.md
active_layer_window: L0
---

# Generation 3 Execution Pack

## Choreography

```text
W0: 001 -> 002(runtime decision)
                 |
                 v
W1:             003
              /  |  \
             v   v   v
W2:         004 005 006
              \  |  /
                 v
W3:             007 -> 008
                         |
                         v
W4:                     009
```

Local execution defaults to the serial order shown. Any parallel execution of
004/005/006 requires explicit authorization, strict Context Builder handoff
packs, disjoint write scopes, and joined/closed subagent receipts.

## Wave Gates

| Wave | Entry | Exit | Stop Condition |
| --- | --- | --- | --- |
| W0 | approved Invoke package | target/import contracts pass and browser runtime approved/bound | target provenance failure or unresolved runtime decision |
| W1 | accepted runtime contract | all baseline browser vectors equivalent | source drift, mount failure, or mismatch |
| W2 | accepted baseline | three immutable evidence receipts | edit leak, nondeterminism, or hidden missing evidence |
| W3 | all evidence accepted | overlay/projection/result/generation accepted | coordinate, replay, predecessor, or authority failure |
| W4 | generation 3 immutable | fresh audit and Inventory read model pass | any byte/handle/route drift |

## Task Session Rule

Each invocation selects exactly one SWU from [WORK-PACK.md](WORK-PACK.md).
Task-local files own algorithms, write scopes, done criteria, validation, and
handoff. This execution pack schedules them but does not redefine them.

## Runtime Boundary

SWU002 is the sole owner of browser runtime binding. If no approved runtime is
present, it must invoke Decision Gate before installing packages or downloading
a browser. Browser evidence tasks cannot choose a fallback renderer.

## Completion Route

After SWU009, route only the bounded suite outcome. No execution receipt can
change authority or candidate state.
