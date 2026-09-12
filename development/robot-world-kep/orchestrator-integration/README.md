# Robot World run and verification contracts

Local candidate implementing `robot-world.run/v1` and `robot-world.verify/v1`.
The first runs the default two-robot interaction world for 1–100 ticks. The second
independently checks each action/clock transition and compares frames and policy
traces. Both execute through the new sibling OrchestratorService, using its
capability-filtered leasing, fencing, receipts and accepted history.

## Run

From the CyberAlchemy-v2 checkout:

```sh
python3 development/robot-world-kep/orchestrator-integration/build.py
PYTHONDONTWRITEBYTECODE=1 python3 development/robot-world-kep/orchestrator-integration/launch.py \
  --output development/robot-world-kep/orchestrator-integration/runs/my-first-run \
  --ticks 100
```

The output must be a fresh directory. Open its `replay.html` to inspect frames,
energy, cargo and four-axis memory. `result.json` contains the owner result and
verification report; `owner/` retains the real orchestration history and worker
artifacts. The demo at `runs/demo-v2/replay.html` records 100 ticks and four buildings.

`build.py` verifies all three pinned RWO source hashes, builds the new driver and
restores both legacy Robot World binaries. `tools/toolchain/run-rwo` supplies the
existing compiler and ICU 74 library installation. No package or compiler is
installed implicitly, and no historical dependency receipt is rewritten.

For an existing completed owner, run the built `world_contracts` driver with the
same worker/binding/owner arguments and `replay` in place of `run`; this verifies
accepted output hashes without executing Python. The `run` mode also returns an
existing completed result without redispatch. A changed binding or incomplete
owner rejects. The driver's location is derived in [build.py](build.py).

Create `OWNER_ROOT/cancel.request` while the local driver is running to request
cancellation. It is recorded by the owner, observed between ticks, and acknowledged
after the process stops. Partial/uncertain attempts remain explicit residue; v1
does not resume them or launch a replacement into the same instance.

## Verify development

```sh
node --import ./agent-routing/node_modules/tsx/dist/loader.mjs \
  development/robot-world-kep/orchestrator-integration/domainspec/build.mjs --check
cd development/robot-world-kep/orchestrator-integration
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest -v test_contracts test_integration
```

The sibling runtime also contains `tests/world_contracts.rs` and
`test_are_decision_worker.mjs`. Run Cargo through the absolute `run-rwo` launcher.
The ARE worker now rejects missing or non-boolean `ok` before writing a receipt.

## Evidence and limits

[PLAN.md](PLAN.md) records scope and D65 stages; [CONTRACT.md](CONTRACT.md) and
[contracts.schema.json](contracts.schema.json) own the prototype payload;
[MAPPING.md](MAPPING.md) links concepts to code; [REPORT.md](REPORT.md) records
validation and candidate identity. Generated DomainSpec views remain scaffolds.

The verifier receives the original world JSON bytes with their digest. This avoids
changing floating-point values by parsing and serializing them through another
language. Completed replay verifies local artifact identity; it is not independent
authentication against an attacker controlling the owner and all its files.

## Open Questions

Shared-world resume, authenticated actor delegation, model proposals and deployed
dashboard launch controls remain deferred in [PLAN.md](PLAN.md). This candidate
provides a local driver and a recorded replay page. ARE decisions do not authorize
world writes. No model invocation, remote service, product approval or deployment
is included.
