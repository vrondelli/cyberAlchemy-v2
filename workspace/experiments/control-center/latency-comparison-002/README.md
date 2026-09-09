# WLC-002: defer speculative surface warming

This successor implements the previously unnamed frame-wait treatment. The
source-selected operation is the four dynamic imports in WorkspaceApp's
warmSurfaces effect, scheduled with idle timeout 250 ms or setTimeout(0).
It is a plausible source of overlapping startup work, not a measured cause.

## Construction

Baseline and treatment carry identical handshake phase instrumentation and the
unchanged performance recorder. Treatment wraps only speculative warmup scheduling
in a handshake-settlement barrier. Existing on-demand imports, initial rendering,
navigation, chat permissions and command sequencing are untouched.

The barrier releases on handshake success or failure. A 1000 ms fallback releases
warmup when no native handshake exists. Cleanup cancels both pending barriers and
already-scheduled idle/timer callbacks. This bounds web/error behavior but does not
prove zero navigation regression; the existing navigation budgets still apply.

The new helper specializes WLC-001's probe for the app. A bounded in-memory list
retains at most 64 content-free phase receipts. This is not yet a native collector
export. The existing aggregate metric surrounds the same status-plus-frame
operation in both arms; measurement overhead remains to be evaluated.

Prototype meanings and dependency scaffolds reuse owned are.research-learning
D01, D03 and D08 under WLH-001's pinned ontology and timing-source bindings.
No ontology admission or product approval is granted.

## Isolated build

The pre-load Vite overlay substitutes the three selected source snapshots by
their original module paths, preserving relative dependency resolution. It checks
their upstream source hashes before building and resolves the shared helper
locally. Other app dependencies are read from the current workspace, so this is
an isolated output build, not a fully frozen transitive source closure.

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-002/variants.test.mjs
WLC_ARM=baseline node cyberAlchemy-v2/workspace/runtime/node_modules/vite/bin/vite.js build --config cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-002/vite.config.mjs
WLC_ARM=treatment node cyberAlchemy-v2/workspace/runtime/node_modules/vite/bin/vite.js build --config cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-002/vite.config.mjs
```

Outputs go exclusively to dist/baseline and dist/treatment here. Production dist,
the WDIO build, frozen predecessors and original source files are not replaced.
Frontend bundling is not Rust compilation, typecheck, browser proof or native
performance evidence. The research-evidence harness keeps fixture results separate.

Current product construction: source treatment implemented; run-local build/test
evidence is in EVIDENCE.json. Next is a WDIO-compatible isolated native build and
phase-receipt collector integration, then overhead and semantic checks. The exact
experiment registration remains incomplete until those identities and checks exist.

Operational support: Workspace test operator owns host qualification for that
future native campaign; it does not block source construction. Product approval,
activation, lab reconciliation and publication remain deferred separate decisions.

## Open questions

- Does warmup actually overlap a slow handshake on qualified hosts?
- Does deferral preserve every existing cold-navigation and startup budget?
- Is the instrumentation overhead within the proposed 1 ms research threshold?
- How will exact native binaries and exported receipts be bound and verified?
