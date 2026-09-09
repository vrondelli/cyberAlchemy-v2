# Workspace research learning

Read-only candidate adapter from historical CC006 product-test evidence into
the existing ARE research-learning ontology, research DAG and work-state model.

Open `view.html` for the standalone derived view. It is not embedded in Tauri.
Its HTML has no script, model connection, dispatcher or effect controls.

From repository root:

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/research-learning/verify.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/research-learning/inspect.mjs
node --test cyberAlchemy-v2/workspace/experiments/control-center/research-learning/adapter.test.mjs
```

`inspect.mjs --html` emits HTML to stdout; `--registration` emits the research
registration. No command above writes source or evidence, starts Tauri, or calls
a model. `verify.mjs` compares selected source digests and exact regenerated
artifacts. The candidate is a selected inventory, not a transitive build closure.

## Model and evidence

`profile.json` pins the ontology and exact original source bytes. `input.json`
archives those bytes and both raw logs so historical verification survives
temporary-directory cleanup. Its material is private. `captureInput` is an
explicit read-only helper for reading the original sources; ordinary inspection
uses the archive. Current runtime conformance is not inferred from this archive.

The adapter supports only the exact CC006 epoch, and fails closed on any source
or log mismatch. A future epoch requires a separately bound adapter/profile,
not a refresh of these digests. It recomputes host rejection and smoke statistics
from raw data; these are not a campaign population p95 or independent process
attestation. CC006 remains a failed smoke on a rejected host, and its observation
is inconclusive about repair benefit. No retention or technique is created.

`registration.json` is a content-addressed retrospective record, not historical
preregistration. The six-node DAG uses ARE's existing materializer through an
explicit trusted verifier callback. Existing ARE callers retain their default
requirement-benchmark verifier. The callback is an implementation seam, not a
data-supplied authority bypass; verification is propagated through plan and
event replay.

`view.json` contains the separate plan and replayed work state. Evidence
inspection is completed only after exact evidence verification. `latency.inspect`
is ready; `host.qualify` is independently ready in operational support. A future
comparison depends on its selected protocol and qualified host. Future task
criteria are deliberately unsupported by this prototype's completion adapter.
No arbitrary report or caller-set status can complete those tasks.

## Construction and deferred operations

See `PLAN.md` for the ordered construction scope, D65 prototype boundary and
open questions. `EVIDENCE.json` records this prototype's tests, not a new
Workspace performance PASS. Browser rendering has not been visually validated;
HTML safety and derivation are covered by structural tests.

Next product construction: inspect timing boundaries, declare controlled causal
hypotheses, then implement exact criterion verifiers for subsequent work.
Host remediation/reruns belong to the test operator. App embedding, durable
progress storage, automatic dispatch, product approval, lab reconciliation,
commit, publication and deployment remain separate decisions/work.
