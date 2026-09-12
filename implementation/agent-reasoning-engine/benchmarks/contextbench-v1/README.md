# ARE ContextBench integration

Status: live development in progress; native benchmark clearance unproven. Authority effect none.
Research owner: [ContextBench research](../../../../agent-reasoning-engine/research/contextbench-v1/README.md).

The first live baseline failed terminal envelope parsing after 22 calls and 45,264
model tokens; no native score was produced. The frozen successor adds bounded
whole-schema terminal feedback, with one correction at most inside unchanged
token/call caps. Round-one changed sources are preserved in `round1-preserved/`;
its original outcome is not rescored. The current package has 63 passing Node
controls. See the research owner's progress record for live state and limitations.

`export.mjs` converts a strict source-pinned delivery ledger into upstream generic
trajectory JSON. It rejects invented/undelivered final context, altered source
bytes, path traversal, symlink escape and gold-bearing input fields. Final context
is an explicit selection, never the union of archived reads. The adapter validates
ledger claims against source bytes; actual delivery must still be bound to the
live request receipts by the future runner integration. It currently accepts
whole-line read events; search excerpts/partial lines need exact delivery mapping
before inclusion. No inference of semantic use from text presence.

Run `node --test implementation/agent-reasoning-engine/benchmarks/contextbench-v1/export.test.mjs`
from the repository root. Ten controls pass. `verify_native.py` calls the unchanged
upstream `evaluate_instance` against a temporary Python repository; the results
in [native-controls.json](native-controls.json) show exact final matches, retained
cumulative coverage despite displaced final evidence, and missing-final error.
These are synthetic instrumentation controls, not live benchmark success.

Upstream: https://github.com/EuniAI/ContextBench at
`1436c28a8eb95496da4ea69ad458b9f8a8eb7d61`, currently checked out at
`/tmp/are-contextbench-upstream-117`. Temporary paths are environment references;
[source manifest](source-manifest.json) binds stable source identities.
Python environment `/tmp/are-contextbench-venv-117` uses the exact packages in
[requirements.lock.txt](requirements.lock.txt). The upstream source supports the
language-pack parser fallback; its older requirements pin is not used on Python
3.14. No upstream source was modified.

Native verification command:

```sh
/tmp/are-contextbench-venv-117/bin/python implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify_native.py --upstream /tmp/are-contextbench-upstream-117 --out implementation/agent-reasoning-engine/benchmarks/contextbench-v1/native-controls.json
```

`score_native.py` verifies pinned upstream/data bytes and exact instance/repository/
commit alignment, rejects missing final selections, and removes reference patches
from the evaluator-only Gold copy to disable gold-patch fallback. Seven adversarial
wrapper tests pass. Retrieval metrics use unchanged upstream implementation.
[dataset-preflight.json](dataset-preflight.json) records metadata and parser checks.

## Open Questions

`orchestrate.mjs` creates separate base and editable checkouts from an identity-
verified repository cache, invokes the matched episode loop, saves source snapshots,
and exports final context against the untouched base. It journals prompt captures
before dispatch and receipts on return, rejects existing run directories and
gold-bearing task fields, and leaves incomplete/error evidence visible. Its
offline integration test reaches native prediction JSON using a real Git checkout
and simulated model. It is not a live result or a patch-correctness oracle.

`live-client.mjs` binds the existing GLM client to the run cell and uses a separately
capped tokenizer-only measurer for the index. The index measurement includes a
message envelope; the full model prompt is independently measured by the existing
transport. Index-tokenizer receipts are separate from model token costs. Three
controls pass for caching/caps, invalid counts and credential failure. Creating
the module/factory is not a provider dispatch. Exact profile values, dependencies,
repository cache acquisition, experiment verification and freeze remain required.

`prepare_tasks.py` projects only identity, repository revision and public issue
fields from the pinned parquet. Four controls pass. All 903 development inputs
are materialized in `development-tasks/`, with per-file hashes in its manifest.
Gold, reference patches and private-test fields are excluded by a column allowlist.
No confirmation inputs or provider calls were generated. Reproduction command:

```sh
/tmp/are-contextbench-venv-117/bin/python implementation/agent-reasoning-engine/benchmarks/contextbench-v1/prepare_tasks.py --upstream /tmp/are-contextbench-upstream-117 --acceptance agent-reasoning-engine/research/contextbench-v1/acceptance.json --out /tmp/contextbench-development-inputs-new
```

`repository-tools.mjs` provides schema-validated tracked-source listing, paged
whole-line search, base/current reads, exact edit batches and patch extraction
for an isolated checkout. Five controls pass, including all-defect feedback,
unchanged base observations after edits and no writes on invalid batches. It uses
the existing Ajv installation; freeze must bind that dependency. No repository
code is executed by these tools. A live shell/test executor is still unbound.
Search observations now receive stable per-excerpt IDs through the same helper
used by delivery verification and the episode loop. Two focused controls pass.
The source callback records full snapshots outside model prompts only when an
observation is returned, not for every file scanned by search.

`source-map.mjs` projects confirmed observations onto exact unchanged base lines
using a checked zero-context diff. Four controls pass, including insertions,
deletions, replacements, forged snapshots and altered bodies. Pass recorded
`source_snapshots` to the exporter alongside an immutable base checkout. Selected
changed lines cause an explicit unscorable outcome; silently dropping them would
inflate precision. `trajectory_projection_complete: false` marks omissions in
nonfinal trajectory evidence, preventing complete-trajectory claims. These are
adapter semantics around the unchanged native scorer, not upstream guarantees.
No live readiness or benchmark success follows from these controls.

`episode.mjs` now connects the existing recycler/transport interface to matched
baseline/index presentation, prospective cumulative-token admission, tool feedback,
stable read IDs and terminal response capture. Four offline integration controls
pass using the real recycler and a simulated transport: complete read/selection,
no dispatch after budget denial, actual history displacement with retained index,
and malformed-call correction. The core recycler's optional `admit_dispatch`
callback can restrict a measured request before dispatch; it cannot relax context
admission. Existing callers are unchanged when the callback is omitted.

The loop accepts an exact prepared task, client, recycler, tools and executor.
It does not yet prepare task containers or instantiate live credentials. That
orchestration, validated shared tool execution and native export/scoring remain
required before any live experiment. Return status is episode evidence, not a
benchmark pass. Callbacks must durably save evidence for a live run.

`evidence-index.mjs` derives a bounded, recency-ordered index from confirmed request
receipts. It measures the complete serialized index and evicts oldest entries.
Recovery returns exact historical observed bytes, not current disk bytes under an
old source hash. Its six focused tests pass. The runner must provide the selected
model tokenizer; character counts in tests are a deterministic test substitute.

`final-selection.mjs` captures public transport response fields and binds explicit
terminal `context_read_ids` to confirmed observations. Six controls pass, covering
capture/receipt mutation, invented IDs, nonterminal captures, empty selection and
failed responses. Call `capturePublicResponse` immediately after the transport
returns, with the actual receipt index; then use `exportModelSelectedContext`.
These are local integrity bindings, not provider-signed attestations. The episode
loop uses these components; live orchestration is still outstanding.

Integrate task preparation without exposing gold; consistently expose stable read
IDs in both arms, capture actual responses and preserve base-source coordinates
after edits. Search and paging formats still require delivery mapping. Native edit-location
gold-patch fallback is guarded in the scoring wrapper; retain that path in live integration. Verify all language parsers and
native dataset/repository alignment. Missing gold/symbol extraction must not become
a vacuous high score. No claim of completed CB/G tasks yet.
