# Workspace-owned research runtime

This is the Workspace-owned fork of the ARE research/evolution runtime used by
the control-center research prototype. Evolve this directory independently.
There are no symlinks or automatic updates from ARE. `PROVENANCE.json` records
the copied origins and their captured source hashes; those hashes are historical
provenance, not a requirement that upstream remain unchanged.

The copy contains the 25 statically imported modules of the evolution entrypoint,
research DAG and research-work state machinery, plus the research ontology and
local benchmark-analysis helpers. `runtime/` preserves package-relative imports.
Schema IDs remain ARE-compatible; this does not transfer semantic authority or
claim that the fork is the upstream ARE product.

The Workspace adapter, evidence archive and read-only views are local as well.
The active inspected path is tested with a resolver that rejects every module
outside this directory except Node builtins. The copied library also contains
broader variant/upgrade APIs; these are not activated or certified by this
research-view test. The production chat, Codex wrapper and serving engine have
not been copied or changed.

## Use

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/research-learning-owned/verify.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/research-learning-owned/inspect.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/research-learning-owned/latency-inspect-001/inspect.mjs --check-saved
node --test cyberAlchemy-v2/workspace/experiments/control-center/research-learning-owned/*.test.mjs cyberAlchemy-v2/workspace/experiments/control-center/research-learning-owned/latency-inspect-001/*.test.mjs
```

The latest work-state view is `latency-inspect-001/view.html`; the root view is
the initial state. Both are standalone HTML, not embedded in Tauri or visually
validated in a browser. The original `research-learning/` candidate remains
historical and retains its shared-dependency drift. No prior PASS is inherited.

Candidate verification checks local bytes only. Timing inspection intentionally
still reads the six selected Workspace/bridge source files: they are the object
being researched, not runtime code imported into this fork. Changed target
sources require a new inspection. Historical benchmark evidence stays archived;
CC006 remains failed on a rejected host, with no repair-benefit claim.

## Plan and ownership

Product construction: copy runtime and ontology; adapt consumers; preserve
provenance; test deterministic behavior/import isolation; freeze a new local
candidate; replay the previously blocked timing inspection against it.
Prototype definitions, record relations and typed derivation reuse the copied
ontology. This is a new implementation candidate, not admission or approval.
Runnable next construction is `latency.hypothesize` after verified replay.

Operational support: test operator owns host qualification for future native
tests. No benchmark, model call, process deployment or unrelated host cleanup is
part of this copy. Product approval, Tauri embedding, durable storage, lab
reconciliation, commit and publication remain separate work/decisions.

## Open questions

- Which hypotheses should the local runtime investigate next?
- Should unused inherited APIs be narrowed into a smaller public entrypoint?
- When should ontology/schema vocabulary diverge while preserving old records?
