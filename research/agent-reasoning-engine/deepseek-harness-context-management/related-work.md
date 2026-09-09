# Related subsystem map

This is bounded related work inside the same pinned DSH repository, not an
independent literature survey.

| Concern | DSH source | Relationship to the core technique |
|---|---|---|
| Persistence | session-persistence-jsonl | Makes the append-only logical log durable |
| Projection | session-projection and cache | Turns prefixes into versioned disposable read models |
| Request identity | request-header and agent-loop invariant | Extends byte identity beyond conversation messages |
| Dynamic context | runtime-context, agent-instructions | Appends complete sourced snapshots only when changed |
| Retrieval | session-query and SQLite | Recalls exact history without enlarging every prompt |
| Context imports | session-reference | Captures bounded untrusted snapshots without live links |
| Pressure | token-meter, pruner, spill, compaction | Measures first and escalates from deterministic to generative reduction |
| Effects | session-checkpoint-policy, user-approval | Places durable and human boundaries outside context meaning |
| Branching | fork-in-process | Reuses a completed prefix but rebinds tools and authority |
| Testing | llm-replay | Reconstructs deterministic model behavior from the event corpus |

The architecture is compositional: no single subsystem owns truth, cache,
retrieval, effects, and model context. ARE should preserve that separation.

