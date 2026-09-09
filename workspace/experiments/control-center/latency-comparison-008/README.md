# WLC-008: uninstrumented native overhead control

Completed: isolated native build (10m 55s), artifact verification, exact WLC-005
frontend inventory comparison and four verifier tests passed. Evidence and
file hashes are recorded in EVIDENCE.json. Native runtime smoke is not yet run.

Product construction: embed the existing WLC-005 uninstrumented WDIO frontend
in a separate native executable. Original warmup and aggregate metrics remain;
the added phase probe, receipt export and treatment scheduling barrier are absent.
The future overhead comparator is WLC-003 baseline, NOT treatment.

## Build and verification

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-008/build.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-008/verify-native.mjs
```

Build is create-only. It copies the desktop crate into native/source, changes
only its local library path, and uses a new native/target directory. Cargo runs
offline, locked, with WDIO and two jobs. Existing source, production dist and
previous experiment binaries are untouched. Existing frontend assets are reused
without rebuilding. All selected WLC-003 source bindings and WLC-005 asset hashes
are checked before and after compilation; mismatch stops construction.

identity.json binds the executable SHA-256, selected-input manifest, frontend
inventory, copied Cargo manifest and Tauri asset configuration. verify-native.mjs
checks those bindings and rejects missing, changed or additional frontend files.
It does not claim a hermetic transitive build or running-process attestation.
The build ID is an artifact identity, not a frontend-exported identity: this
control intentionally has no phase export.

## Construction frontier and separate operational residue

Current frontier: build and verify the exact uninstrumented native control.
Next construction: add a bounded native control smoke using existing aggregate
metrics (not phase-export polling), verify process identity and semantic parity,
then register the exact baseline-versus-control overhead comparison. No overhead
result follows from compilation. The 1 ms research overhead threshold and all
existing product budgets remain unchanged.

Semantic scaffolds are inherited from WLC-005's selected D01/D03/D08 owned
research definitions; no ontology records are changed or admitted here. This is
an implementation prototype, not a product approval or operational decision.

Operational support: Workspace test operator owns uncontended-host qualification
for subsequent population collection. That pending task does not block this build.
Qualified samples, differential evidence, full frozen-candidate product tests,
product-owner approval, lab reconciliation, commit, publication and release remain
deferred. No desktop session or live-model request is launched by this slice.
