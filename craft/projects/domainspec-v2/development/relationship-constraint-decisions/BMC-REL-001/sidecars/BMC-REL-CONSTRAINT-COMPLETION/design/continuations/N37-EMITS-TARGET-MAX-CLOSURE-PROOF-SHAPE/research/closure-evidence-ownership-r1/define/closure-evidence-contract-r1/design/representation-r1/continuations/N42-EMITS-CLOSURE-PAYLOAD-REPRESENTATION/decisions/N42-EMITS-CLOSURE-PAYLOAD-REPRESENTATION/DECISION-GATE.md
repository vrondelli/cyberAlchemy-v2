# N42 — emits closure payload representation

Status: owner decision pending.

Question: how should the consumer-owned closure sidecar carry its exact source/target populations, placement evidence, and complete incoming canonical `emits` adjacency?

- A — inline every exact payload collection directly in the sidecar. Recommended.
- B — reference separate consumer-owned payload manifests by contained path and exact digest.
- C — use a closed per-payload tagged union supporting exactly one inline or reference form.
- D — defer.
- E — stop.
- Explain — show more context; decision effect none.

Rejected: implicit payload discovery, compiler-authored completeness, mixed snapshots, and copying attestations into request wrappers.

N41-A does not select N42.
