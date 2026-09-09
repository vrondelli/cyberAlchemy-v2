# WLC-011: host-aware paired capture

Product construction adds prelaunch and during-run host evidence to WLC-010's
diagnostic pair. No previous source, binary, budget or registration is changed.
bindings.json freezes this adapter, the sampler, owned qualifier and protocol,
and predecessor registration. The runner verifies these before launching.

The owned benchmark protocol is reused without threshold changes: five prelaunch
observations; normalized load <=0.5; available memory fraction >=0.2; CPU pressure
avg10 <=5; memory pressure avg10 <=1; observation gaps <=2000 ms. Prelaunch samples
are one second apart. During-run sampling is every 500 ms, with explicit first
and final observations, using one process-monotonic clock.

Prelaunch rejection prevents the desktop launch. During-run rejection retains
native results but excludes the arm and stops the pair. host.json retains raw
observations, protocol/host hashes, coverage window, errors and reasons. Its hash
is included in successful pair members. Native errors are retained even when the
host also fails. Completed native receipt capture alone does not qualify the host;
the separate host.json is evaluated after capture. Pair-level campaign/inference
status remains not_evaluable, even for a clean diagnostic pair.

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-011/host.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-011/run.mjs AB
```

Exit 2 means host rejection; exit 1 means another failure. Failed/rejected attempts
are retained and never implicitly retried. The sampler reads Linux procfs; these
thresholds describe the visible Linux host, not independent Windows host, thermal,
CPU-affinity or cgroup qualification. Missing procfs pressure data fails closed.
Sampler overhead has not yet been quantified. No qualified campaign claim follows.

## Construction and operational lanes

Current frontier: host evidence and rejection integration. Four synthetic tests
pass for clean coverage, threshold failures, missing/stale coverage and invalid
or unavailable samples. Native attempt outcome is retained in EVIDENCE.json.
Research-evidence-harness keeps these synthetic checks separate from live evidence.

Next runnable construction: persistent alternating campaign order, attempt limits,
exact budget/fixture bindings and population evaluation. The existing 40 qualified
sessions, 60 attempts and 1 ms overhead threshold remain unchanged. No p95 is
computed here. Selected ontology scaffolds remain the inherited D01/D03/D08;
no ontology changes or admission occur.

Operational support: Workspace test operator owns an uncontended-host window for
qualified collection. Host rejection blocks that run, not remaining harness work.
Full frozen-candidate tests, product-owner approval, lab reconciliation, commit,
publication and release remain separately deferred decisions.
