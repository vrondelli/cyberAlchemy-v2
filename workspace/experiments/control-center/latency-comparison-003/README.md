# WLC-003: isolated native variants and receipt export

Consumes WLC-002's exact source overlays. Both arms add the existing WDIO
bootstrap and an identical read-only diagnostic export. Original Workspace
source, production dist, prior candidates and desktop Cargo outputs stay intact.

## Product construction

Selected semantics remain the owned are.research-learning D01/D03/D08 prototype
scaffolds bound by WLH-001 and WLC-002. The treatment remains speculative surface
warmup deferral until handshake settlement with a 1000 ms fallback.

Sequence: verify predecessor → WDIO frontend builds → isolated native builds →
binary/frontend identity verification → native receipt collection → overhead and
semantic checks → exact registration → qualified differential campaign.

build-inputs.json binds selected overlays, collector, exporter, build scripts,
desktop source and local Rust library sources. Other frontend dependencies come
from the workspace; Cargo uses its lockfile and cached registry. This is not a
hermetic transitive source attestation.

build.mjs is create-only: copy the small desktop crate into native/source,
change only its library dependency path to the absolute original location, and
compile offline with the lockfile and WDIO feature. TAURI_CONFIG selects each
arm's frontendDist. Cargo and generated schema output stay under native/.
Each successful executable is immediately copied to a per-arm directory and
bound to frontend file hashes in identity.json. Failures preserve logs and stop
the sequence. Do not erase an attempt just to rerun it.

## Receipt boundary

globalThis.__WLC_PHASE_EVIDENCE__ returns fresh content-free receipt snapshots,
the arm and build ID. Snapshot edits cannot change the retained receipt array.
The build ID derives from selected inputs and arm, not operating-system identity.

collectPhaseEvidence(browser, expected) uses WDIO execute and requires arm,
build_id and binary_sha256 in expected. It validates exact fields, build identity,
one cold handshake, frame availability and phase-row arithmetic. The supplied
binary digest is NOT proof of the launched executable: verify that separately.
Missing receipts reject collection rather than become zero-duration samples.

The research-evidence harness tests positive and negative synthetic exports.
Fixture success does not qualify a host or establish performance improvement.

## Commands

Run from repository root:

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-003/collector.test.mjs
WLC_ARM=baseline node cyberAlchemy-v2/workspace/runtime/node_modules/vite/bin/vite.js build --config cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-003/vite.config.mjs
WLC_ARM=treatment node cyberAlchemy-v2/workspace/runtime/node_modules/vite/bin/vite.js build --config cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-003/vite.config.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-003/build.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-003/verify-native.mjs
```

No command automatically launches the app or contacts a model. EVIDENCE.json
reports the actual completed and pending checks. Build receipts are not approval.

## Operational support and open questions

Workspace test operator owns host qualification for future product tests; it
does not block code construction. Native launches need isolated database and
explicit bridge/provider configuration, separate from compilation. Product
approval, activation, lab reconciliation and publication remain deferred.
Budgets and the 40-qualified-session/60-attempt protocol stay unchanged.

- Does a native session export exact receipts without protocol drift?
- Which wrapper verifies the running binary before and after collection?
- Do instrumentation and treatment meet overhead and semantic budgets?
- Does the build environment match the declared Node version?
