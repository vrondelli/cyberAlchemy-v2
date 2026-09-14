# Orchestrator Operator Guide

Status: implementation candidate  
Authority effect: none

## User journey

1. Open **Templates** and choose a saved Strategy Template, or paste an exact
   `orchestrator-strategy/v1` document.
2. Supply parameters and selected adapter references. Creating the proposal
   validates and compiles the graph but starts no run.
3. Review the intended outcome, nodes, agent requirements, limits, and proposal
   digest.
4. Admit the exact proposal. The API persists a content-addressed Run Bundle and
   initializes accepted structural history.
5. Open the run page. Read **What is happening**, **Why**, **What happens next**,
   and **Decision boundary** before acting.
6. Workers poll the runtime and return receipts. The controller validates them;
   RWO computes structural progress; the controller atomically records the
   accepted event, cursor, and next command batch.
7. If a run needs attention, use Recovery. An unknown effect requires an owner
   resolution. The UI never turns a missing receipt into retry permission.
8. Structural completion leaves result acceptance, promotion, publication, and
   deployment as separate decisions.

## Local run

```bash
tools/toolchain/run cargo run --manifest-path orchestrator/api/Cargo.toml -- \
  /tmp/orchestrator-state orchestrator/frontend 127.0.0.1:8787
```

Open `http://127.0.0.1:8787/runs`.

## Open Questions

The first live Gateway transport, authentication policy, backup policy, and
template publication owner remain to be selected and admitted.
