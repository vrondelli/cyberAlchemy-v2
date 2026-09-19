# Implementation layering

## Layer 0 — authority inputs

Read only:

1. `projects/domainspec-v2/.craft/ledger.yml` — continuation state, active gaps,
   gate, next move, and artifact status.
2. `projects/domainspec-v2/development/first-production-release/craft/expected-node-edge-manifest.yml`
   — nodes, edges, frontiers, critical steps, and claim boundary.

Invariant: if these sources disagree, generation fails or presents the disagreement;
the renderer never chooses the favorable state.

## Layer 1 — source adapters and contract validation

`tools/build-roadmap.py` loads YAML, selects only the FPR context and its referenced
frontiers/artifacts, validates required identifiers and references, and normalizes the
data into a stable JSON structure.

Invariant: the adapter has no transition API and no authority-writing capability.

## Layer 2 — deterministic read model

`roadmap-data.json` contains normalized provenance, counts, Craft state, nodes, edges,
frontiers, critical steps, and source links. Keys are stable, lists preserve canonical
ordering, and a SHA-256 fingerprint identifies the exact input bytes.

Invariant: no wall-clock timestamp, random identifier, environment-dependent absolute
path, or Git heuristic enters the projection.

## Layer 3 — Whisper composition

`roadmap.template.html` defines a self-contained, source-bounded operational roadmap.
The generator embeds the normalized JSON so `roadmap.html` works from `file://`, while
keeping the standalone JSON available for machines.

The composition trajectory is:

1. release boundary and current Craft gate;
2. whole dependency graph;
3. selected-node proof, dependencies, exit, omission, and next move;
4. active research frontiers;
5. exact Body War critical sequence;
6. evidence and refresh contract.

Invariant: visual language distinguishes closed, open/blocked, and future work and
always displays `production_authorized: false`.

## Layer 4 — seamless refresh and verification

One command regenerates both read models. `--check` performs a byte comparison against
the would-be generated outputs and exits non-zero when either is stale. Unit tests
exercise schema/count/reference/determinism/rendering contracts.

Invariant: refreshing changes generated files only; updating state still happens in
Craft and updating the roadmap graph still happens in the manifest.

## Layer 5 — governed continuation

Craft indexes the plan, builder, JSON, and HTML under a child visibility context. The
parent FPR context retains `stage: plan`, `gate: block`, and FPR-01 as its next move.
The child context may close when the read-model feature verifies, but that does not
advance any FPR node or grant production authorization.

## Failure behavior

| Failure | Required residue |
|---|---|
| Missing FPR context | generation blocks with the missing context id |
| Unknown edge endpoint | generation blocks with the edge and endpoint |
| Frontier not present in Craft gaps | generation blocks; no inferred frontier state |
| Manifest marks production authorized | generation blocks until an owner-governed route explicitly changes the contract |
| Generated output differs in `--check` | stale-output failure and refresh command |
| Browser cannot run JavaScript | static warning and source links remain visible |
