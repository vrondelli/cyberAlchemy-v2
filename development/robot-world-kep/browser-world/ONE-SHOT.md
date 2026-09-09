# Browser World execution handoff

Status: planning handoff, 2026-09-06. Use with [PLAN.md](PLAN.md), [dag.json](dag.json), and [SOURCE-REGISTER.json](SOURCE-REGISTER.json). This document does not start implementation or extend the existing RWO host's executable allowlist.

## Outcome

Implement a local Babylon.js/TypeScript Robot World with React controls that matches the approved colony reference and faithfully presents the existing simulation. Work continuously within each batch. Stop only at B1, B2, B3, or an actual blocker affecting the remaining work in that batch. Later roadmap milestones require a separately selected scope.

## Before construction

1. Enter through the repository's current CyberAlchemy-v2 router and select the applicable implementation objective. Read the exact selected sources and current instructions.
2. Confirm the requested construction scope and current checkpoint decisions from this task. Do not interpret this planning handoff as authorization to deploy or alter cloud resources.
3. Check ownership and dirty state for the new browser package. Verify the source-register digests and frozen reference package. Reconcile changed selected inputs before consuming them; unrelated drift cannot block this scope.
4. Announce the exact files for the first mutation batch. Keep all changes in the browser package and fresh selected run outputs. Preserve Unity/Godot assets, fixtures, and checkpoint-1 bytes.
5. Expose product and operational lanes. D0/D1/D2/C0 can progress while local package/GPU inspection is pending. Do not resume Unity installation, VNC repair, or networking work as a prerequisite.

## Batch 1 — Stop at B1

Complete D0/D1/D2/C0, O1, E1/A1/L1, S1, O2, and T1 according to the DAG. Pin actual package versions, produce source-mapped browser assets, validate the retained 82-frame session, and assemble a detailed animated colony with camera controls and robot inspection.

Open the actual loopback browser page. Verify render backend, imports, console/network failures, selection, replay motion, resize, and resource disposal. Capture the full scene, robot/workshop close-ups, a movement clip, transferred bytes, and measured frame timings on the named device. Compare against the accepted concept and explicitly report remaining fidelity gaps.

Prepare `checkpoints/B1/<revision>/REVIEW.md`, a candidate `manifest.json`, screenshots, clip, and check results. These are future output paths; do not pre-create empty evidence and mark it successful. Show the running scene and review package to the user, then wait for visual validation. Store the explicit response in a separate digest-bound decision receipt. Requested changes stay in B1 and produce a new revision.

## Batch 2 — Stop at B2

Begin only after the current B1 candidate receives an explicit visual decision allowing continuation. Complete U1 and T2: full crew and inspector, frame-index playback, catalog/details, responsive layout, keyboard/focus behavior, and visible loading/error/empty states.

Use the Playwright skill for real browser interaction checks. Test the timeline's same-tick final revision, editable-control shortcuts, canvas-versus-panel input routing, robot selection from both canvas and DOM, and all required viewports. Keep console/network and failed check evidence. Capture a new complete interface candidate under `checkpoints/B2/<revision>/` and stop for validation.

## Batch 3 — Stop at B3

Begin only after the current B2 candidate receives an explicit interface decision allowing continuation. Implement X1's new fresh-run export path without changing the fixture-pinned Unity exporter. Validate explicit source bounds and replay/catalog association; hashes alone cannot prove unrelated inputs belong together.

For I1, run from the parent `robot-world-kep` directory. Verify these source-derived commands against the current runner before use:

```bash
cargo build --offline --locked --manifest-path runtime/Cargo.toml
cargo build --offline --locked --manifest-path ../../trusted-dataset-materialization/rwo-adapter/Cargo.toml --target-dir runtime/target
PYTHONDONTWRITEBYTECODE=1 python3 runtime/run.py validate
PYTHONDONTWRITEBYTECODE=1 python3 runtime/run.py run --root "$PWD/runs/browser-<unique-id>"
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s runtime -p test_prototype.py -v
```

Replace `<unique-id>` with a new unused identifier. The runner's validator applies to its existing DAGs, not this browser planning graph. Missing offline dependencies are an environment issue to resolve within the authorized setup scope; do not rewrite locks merely to obtain a passing check. Keep the fresh run directory and runtime receipts.

Implement and document the new exporter command when its interface is concrete; this plan does not invent a working CLI. Export only the selected fresh run's replay and catalog into a new browser session package. Load it in the production browser build, verify exact final state/catalog identity, and repeat only tests justified by this integration and remaining concerns.

Create `checkpoints/B3/<revision>/` with source/asset/package/session/build hashes, run receipts, test results, browser evidence, performance measurements, known limitations, and a reproducible launch instruction. Present this exact local candidate for product review and approval. A passing test or prior B1/B2 decision cannot substitute for that product decision.

## Checkpoint rules

- No intermediate aesthetic preference interviews when the reference and plan answer the choice. Use judgment and show the result at the next checkpoint.
- User feedback changes the current candidate. Record a new revision and current evidence; preserve the previous review package.
- Silence, timeout, a screenshot, a passing check, and a changed status field are not approval.
- A failed check records failure. A check that cannot run records `not_evaluable` and its causal prerequisite. Continue independent in-scope work without claiming the checkpoint passed.
- Keep the user informed during construction; progress messages are not extra approval gates.
- B3 ends this implementation scope. No automatic F1/M1 work, cloud change, deployment, publication, credential exchange, or real-money integration follows.

## Open questions

Use [PLAN.md — Open questions](PLAN.md#open-questions) and the parent question register. BQ1/BQ2 are addressed through measurement and the B1 review; future ecosystem questions do not block the recorded browser prototype.
