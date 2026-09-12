# Robot World / KEP local prototype

Two robots collect resources and construct workshop items while an independent marketplace materializes a fixture dataset. Native Rust RWO schedules both tasks and their exchange bridge. The world contributes a versioned recipe to the catalog; the explorer consumes three rows from an exact dataset version. Godot replays the actual resulting world states.

Start with [the DAG](PLAN.md), [the prototype definition](DEFINITION.md), and [open questions](OPEN-QUESTIONS.md). The full plan contains 26 nodes. The first executable DAG contains three allowlisted local tasks.

## Interaction dynamics successor

The separately versioned [interaction-v1 implementation](interaction-dynamics/REPORT.md)
adds normalized four-axis preferences, active semantic alignment, decay-before-impulse
memory, checked action selection and decision traces. Its 19 focused tests pass and
70 controlled cases repeat deterministically. Full legacy integration regression
is blocked by missing RWO source/binaries in this checkout; see the report.
The default runner and bundled UI recordings retain the original policy.

From the repository root, run a fresh comparison into a new directory:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 development/robot-world-kep/runtime/run_interaction_experiments.py --output /tmp/robot-interaction-new-run
```

Exact numerical behavior and reproduction checks are in the
[contract](interaction-dynamics/CONTRACT.md). This successor remains local fixture
construction, with no live inference, real KEP or product approval.

## Run

From this package directory, with Python 3, `jsonschema` and Rust installed:

```bash
cargo build --offline --locked --manifest-path runtime/Cargo.toml
cargo build --offline --locked --manifest-path ../../trusted-dataset-materialization/rwo-adapter/Cargo.toml --target-dir runtime/target
PYTHONDONTWRITEBYTECODE=1 python3 runtime/run.py validate
PYTHONDONTWRITEBYTECODE=1 python3 runtime/run.py run
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s runtime -p test_prototype.py -v
```

The materializer manifest relative path from this package is `../../trusted-dataset-materialization/rwo-adapter/Cargo.toml`. Offline Cargo builds require the locked dependencies already cached. First-time setup may need an ordinary Cargo dependency download. The run command prints its fresh output directory under `runs/local-*`; it refuses to overwrite a run directory. Its only network activity is a temporary loopback fixture HTTP server.

The branches are also callable independently:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 runtime/run.py task world --root "$PWD/runs/local-world-only"
PYTHONDONTWRITEBYTECODE=1 python3 runtime/run.py task marketplace --root "$PWD/runs/local-market-only"
```

Use fresh directories. The branch task commands are low-level local fixture entry points; durable restart/idempotency across process crashes is not implemented in the new world/catalog host. The reused materializer maintains its own journal and recovery protocol.

## View

Open `godot/project.godot` in Godot 4.5.1, or run the installed local engine:

```bash
/tmp/robot-colony-tools/godot/Godot_v4.5.1-stable_linux.x86_64 --path "$PWD/godot"
```

The bundled replay is the tested first epoch. To view a new run:

```bash
/tmp/robot-colony-tools/godot/Godot_v4.5.1-stable_linux.x86_64 --path "$PWD/godot" -- --replay="$PWD/runs/LOCAL_RUN_NAME/bridge/replay.json"
```

The current Workshop Valley presentation adds a terrain island, tuned materials, robot selection, a capability catalog and playback controls. Space plays/pauses; arrows step; 1/2 select a robot; right-drag orbits; the wheel zooms; R resets the camera. The slider seeks and the speed selector changes playback rate. Click Capabilities to inspect the two artifact versions from the bundled session. A custom replay intentionally does not inherit the bundled catalog.

This is a recorded observation client. Live world transport is future W2/W4 work. The models and robot portraits are reused from the earlier Robot Colony asset package. The visual direction and engine discussion are in [VISUAL-DESIGN.md](VISUAL-DESIGN.md); UI checks and screenshots are under `evidence/ui-002/`.

## Scope and evidence

- Scripted autonomous policies: no trained neural model or live ARE connector yet.
- Local AlchLang carrier prototype and hand-written execution mapping: no general compiler or admitted runtime profile.
- Existing Trusted Dataset Materialization and Rust RWO are used. The data is the existing synthetic fixture, not the user's real gold dataset.
- The bridge is a local KEP contract fixture. It does not implement encrypted coownership, key delivery, network authentication or settlement.
- Caller identities are local test bindings. Do not expose these Python entry points as an authenticated network service.
- The local world history records complete states and can be checked and projected. It is not the canonical ontology event/governance implementation, a huge graph integration or a crash-safe event service.
- Vectors influence policy preferences; they never determine access rights or evidence truth. Physical collision handling and learned policies remain future work.
- Neither a passing prototype nor a vote deploys a function. Hosting, public access and money remain separate construction and operational tasks.

The retained first-epoch run is `runs/epoch-001/`. Its original test log, Godot screenshot and verification are in `evidence/epoch-001/`. Those receipts describe the original presentation. All 35 original candidate source files are preserved byte-for-byte under `evidence/ui-002/baseline/`, including the original project configuration. The revised UI has a separate candidate and verification under `evidence/ui-002/`. No commit, publication, deployment or product approval is implied.

## Bounded orchestrator contracts

The [run/verify integration](orchestrator-integration/README.md) executes the
interaction world through the new sibling OrchestratorService and independently
verifies action/clock transitions. It includes a recorded replay page and restores
the legacy kernel build bindings. See its [report](orchestrator-integration/REPORT.md)
for current evidence; earlier frozen test records retain their historical results.
Open questions remain in its [plan](orchestrator-integration/PLAN.md).
