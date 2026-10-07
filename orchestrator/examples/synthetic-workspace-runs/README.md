# Synthetic Workspace runs

This seed uses the normal local Orchestrator API to create three clearly named
demonstration runs: completed, cancelled, and active awaiting a worker. The
completed run has a synthetic artifact, worker lease, receipt, and accepted
event. It performs no external work and must never be presented as real result
evidence or a product-acceptance test.

With the isolated Workspace demo service running on port 8787, run from the
repository root:

```bash
node orchestrator/examples/synthetic-workspace-runs/seed.mjs \
  http://127.0.0.1:8787 /tmp/cyberalchemy-workspace-orchestrator.YOUR_ID
```

Pass the exact state directory used to start that service. The script accepts
only a loopback origin and the Workspace demo's temporary-directory prefix. It
refuses to overwrite existing synthetic run IDs. Open the Workspace's Runs rail
or `http://127.0.0.1:8787/runs` to inspect the result.

For a more realistic twelve-node Work Graph with two parallel checks and two
joins, seed the separate synthetic journey in the same isolated service:

```bash
node orchestrator/examples/synthetic-workspace-runs/seed-dag.mjs \
  http://127.0.0.1:8787 /tmp/cyberalchemy-workspace-orchestrator.YOUR_ID
```

This run accepts six synthetic node events, then leaves the unit and policy
checks ready and the downstream integration, evidence, review, and handoff
nodes waiting. The graph, status, worker receipts, trace, and output previews
all come from the normal API. Its simulated outputs are **not** evidence that
those domain tasks were performed. The script is additive and refuses to
overwrite its run ID.

## Open Questions

This is a local visual fixture, not a general seed or cleanup protocol. A
future reusable fixture system would need an explicit lifecycle and retention
policy.
