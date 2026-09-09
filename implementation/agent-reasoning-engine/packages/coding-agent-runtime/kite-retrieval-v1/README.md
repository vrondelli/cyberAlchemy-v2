# Optional Kite retrieval bridge candidate

This is an isolated **contract prototype**, not an integrated Kite backend.
It adds a provenance-validation boundary suitable for the optional Kite arm
of the user-approved model-fitting DAG. It imports no Kite code, starts no
process, reads no credentials, and makes no network request. Scripted backend
fixtures exercise the boundary; their results are not retrieval-quality or
GLM performance evidence. Authority effect: none.

## Interface

`adapter.mjs` exports `createRetrievalAdapter({root, sources, backend, limits})`
and `sha256(bytes)`. `sources` is a caller-owned, pinned allowlist of
`{source_id, path, sha256}` objects. Paths are relative to an immutable task
snapshot; hashes cover entire file bytes. The constructor copies the manifest
and verifies each source. No directory scan or automatic source discovery occurs.

The returned adapter exposes `query({query, invocation_id})` and `stats()`.
The query shape is closed: task IDs, answer labels and scorer metadata are
rejected. The invocation ID must be opaque. This prevents accidental structured
label forwarding; it cannot detect an answer embedded in the query text or a
backend initialized with leaked evaluation data. Dataset separation remains a
caller requirement.

The injected trusted backend receives exactly the query envelope and a second
argument `{signal, max_rows}`. It returns only:

```json
{
  "rows": [{
    "source_id": "source-a",
    "sha256": "<64 lowercase hex digits from pinned manifest>",
    "start_byte": 0,
    "end_byte": 23
  }]
}
```

Offsets are zero-based, half-open UTF-8 byte spans. Backend-provided text,
paths, unknown fields, unknown sources, wrong hashes, duplicate spans and
invalid UTF-8 boundaries are rejected. ARE hydrates exact source bytes itself
and returns `{evidence, evidence_bytes, backend_calls,
full_request_admission, authority_effect}`. Each evidence row includes the
verified path and text and is explicitly marked as source evidence, not an
instruction. That label is metadata; downstream prompt construction must keep
untrusted evidence separate from instructions.

Every query verifies **all** indexed source hashes before calling the backend
and again before returning evidence. Any changed, missing, unsafe or oversized
source permanently invalidates that adapter instance. Rebuild the index and
construct a new instance explicitly; restoring an old file does not silently
reactivate an invalidated instance. Checking every source is intentionally
conservative and may be expensive for large indexes.

## Bounds and ownership

Defaults and maximum configurable values are 12 backend calls, one in-flight
query, 16 rows per result, 8,192 serialized evidence bytes, 64 files of at most
1 MiB each, 8,192 query bytes and a 30-second backend timeout. Limits may be
lowered. Evidence bytes include the serialized evidence array and its provenance
metadata; they exclude the outer result envelope. These are byte limits, not
token estimates. ARE must measure the **complete assembled provider request**,
including instructions, schemas, progress, evidence and output reserve, before
every model dispatch. No adapter return is a context-admission grant.

Failed backend calls consume the allowance and are not retried. A timeout sends
an abort signal and permanently invalidates the instance, since completion may
be unknown. The injected function is a trusted seam, not a sandbox: it must
honor cancellation and account for every internal extraction/planning/provider
call. JavaScript timeouts cannot preempt synchronous CPU work or terminate a
backend ignoring abort. Before a live backend is eligible, its process/transport
must enforce these requirements and use ARE's credential and provider boundaries.
The adapter counts invocations, not hidden provider calls.

The filesystem must remain immutable during each operation. Symlink and path
checks cover ordinary mistakes and stale snapshots; they are not a defense
against a hostile process racing directory replacement. This adapter is not
an OS filesystem sandbox. Source reads are bounded even if a file grows.

## Actual Kite integration frontier

Inspected upstream: [memoket/memoket-kite at
8745fedab8d10ea698066583dfc3ba4e0a32e294](https://github.com/memoket/memoket-kite/tree/8745fedab8d10ea698066583dfc3ba4e0a32e294).
Its code license is Apache-2.0; this prototype copies no upstream implementation
and adds no dependency. Dataset and asset licenses are separate. See the
[research and source register](../../../../../research/agent-reasoning-engine/glm-context-memory-reuse-2026-09-07/README.md).

Upstream `memory.py` imports provider functions directly, and its default
`providers/llm.py` uses environment credentials and retrying calls. A wrapper
around `Memory.recall` alone would therefore not establish ARE's provider
boundary. The remaining backend work is to pin dependencies, replace that
provider seam explicitly, map codebook source references to this manifest's
exact spans, and validate the mapping against genuine Kite output. Derived
facts must retain source identity and must not be presented as verbatim quotes.
No global monkeypatching of upstream credentials/transport is implemented.

The backend also needs an index manifest bound to every source revision,
build/extraction/planning accounting, and a separate full-request admission
gate on every GLM operation. Then paired tasks can compare actual Kite against
the frozen ARE-only baseline, including indexing and invalidation costs.
Until that join is tested, label any use of this module `retrieval-contract`
or `scripted-backend`, never `kite-integrated`.

## Validation

From the repository root:

```sh
node --test implementation/agent-reasoning-engine/packages/coding-agent-runtime/kite-retrieval-v1/test.mjs
```

Nine offline tests pass. They cover exact hydration, structured gold-field
rejection, stale indexes before/during retrieval, unsafe paths and symlinks,
tampered provenance, Unicode byte boundaries, evidence/source/row limits,
failure accounting, timeout invalidation, and concurrent query rejection.
Only original local tests and adapter code executed. No upstream package was
installed or executed, no paid call was made, and the main runtime is unchanged
by this package.

## Open Questions

- Which exact upstream provider seam should the real pinned bridge expose?
- How will source references for extracted facts map to original byte spans
  without promoting a derived paraphrase to source evidence?
- Does Kite improve held-out task completion enough to cover all build,
  retrieval, invalidation, token and latency costs?
- What isolated execution mechanism should terminate a backend that ignores
  cancellation before live operation?

Construction scope and operational residue are in [CONSTRUCTION.json](CONSTRUCTION.json).
