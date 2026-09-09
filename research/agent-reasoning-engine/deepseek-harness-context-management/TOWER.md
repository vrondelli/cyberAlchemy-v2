# Research tower

## Question

How should ARE reuse DeepSeek Harness context-management techniques to gain
more deterministic context reuse and better provider-prefix cache affinity
without confusing cache state with truth, currentness, or authority?

## Scope

- DeepSeek Harness session events, JSONL persistence, projection caches,
  request reconstruction, compaction, and real provider cache measurement.
- Current ARE runtime journal, Context Envelope lifecycle, and Codex app-server
  context injection.
- A target pattern and experiments, not implementation.

## Levels

| Level | Purpose | Artifact | Status |
|---|---|---|---|
| L0 | Pin sources and extract observed mechanisms | [L0 corpus](levels/L0-corpus.md) | complete |
| L1 | Compare the mechanisms with ARE and expose residue | [L1 residue map](levels/L1-residue-map.md) | complete |
| L2 | Define a bounded closure and measurement plan | [L2 closure plan](levels/L2-closure-plan.md) | research-complete; execution open |

## Promotion boundary

The tower may support a later plan. It cannot by itself select the design,
change the runtime, assert cache savings, or promote any capability state.

