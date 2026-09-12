# Work Orchestration RWO realization candidate

Start with [RWO: how it works and why we use it](RWO-EXPLAINED.md) for a
standalone explanation of recursive work, commands, events, ownership, and the
distinction between the RWO kernel and the current durable DAG implementation.

The [Alch Host provisioning extension](extensions/alch-host-provisioning-v1/README.md)
adds a bounded real-Ansible local fixture, Rust DAG integration, and single-host
SQLite accepted history with restart reconciliation. Its evidence is scoped to
that extension; the original in-memory demo and its claim boundaries below remain.

The [Alch provisioning evidence adapter](extensions/alch-host-evidence-v1/README.md)
verifies that history and projects typed ORODI workflow observations, including
failed and unevaluated stages. Its local historical verdict is not live readiness
or the full ORODI product-control evaluation.

This package carries the adopted `Execute Bounded Composite Work` capability
into a generic RWO structural realization, one deliberately small ETL fixture,
and one exact 42-role historical-research micro-swarm candidate:

```text
generic DomainSpec runtime source
  -> deterministic generic compiled graph and system ontology
  -> exact RWO Rust structural binding
  -> one AcceptedHistoryPort authority per stream
  -> HTTP/gRPC transport adapters
  -> contained ETL replay and idempotency evidence
  -> finite DAG validation and deterministic fan-out/fan-in
  -> deadline-bounded structured-agent shell execution
  -> 27 extractors -> 9 reducers -> 3 synthesizers -> 3 judges
```

The fixture extracts two synthetic customer rows, normalizes their names and
email addresses, validates the batch, and loads a contained in-memory warehouse.
It then replays the accepted event sequence against a fresh RWO cursor while
retaining the same idempotency store. The replay derives the same structural
commands and the second load is a no-op.

## Boundaries

- DomainSpec owns the workflow, operation, mapping, validation, effect, and
  idempotency meaning in `domainspec/etl-small.json`.
- The RWO Rust kernel owns only deterministic structural compilation, command
  derivation, cursor transition, duplicate detection, and replay.
- One host-selected `AcceptedHistoryPort` owns atomic acceptance of an event,
  next cursor, and the complete zero-or-more command batch. RWO does not accept
  its own history.
- The local `DagEngine` validates finite acyclic graphs; supports `root`, `all`,
  `any`, and `quorum` release; creates canonical dependency-output manifests;
  bounds retries; blocks impossible joins; and rejects divergent event reuse.
- `StructuredAgentShell` executes batches at bounded parallelism. Each request
  is killed at the smaller of its configured timeout and the DAG's remaining
  global deadline. Before a downstream request, it reads each dependency JSON
  only from the run's output directory, verifies its recorded size and SHA-256,
  and materializes the content at `dependencies[].output`; drift or path escape
  fails closed.
- `micro_swarm` is a contained CLI over the existing RunPod `agent.sh` contract.
  It writes inputs, outputs, and `run-receipt.json` under one selected run root.
- The HTTP and gRPC adapters translate transport requests into that same port;
  neither adapter owns semantic acceptance or domain effects.
- The demo host owns synthetic ETL adapter execution.
- The Product Capability is adopted and RWO is selected at exact digests. The
  generated system ontology remains a candidate: this package does not admit a
  production journal, survive process/host loss with the in-memory reference
  history, prove live model quality or multi-host recovery, or authorize an
  external effect.

## Run

From the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/work-orchestration-implementation/scripts/compile.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/work-orchestration-implementation/scripts/compile_generic.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/work-orchestration-implementation/scripts/compile_micro_swarm.py
cargo test --manifest-path cyberAlchemy-v2/work-orchestration-implementation/runtime/Cargo.toml --offline
cargo run --manifest-path cyberAlchemy-v2/work-orchestration-implementation/runtime/Cargo.toml --bin cav2-work-orchestration-etl-demo --offline --quiet
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/work-orchestration-implementation/validate.py
```

The reusable system view is `generated/generic-system-ontology.json`; the first
behavioral fixture is `runs/etl-demo-result.json`. The bounded claim and exact
dependency digests are in `runs/conformance-report.json`.

## Run the micro-swarm DAG

The existing shell surface is compatible: `agent.sh` accepts
`<contract> <role-id> <input-file> <output-file>`. After the vLLM endpoint is
ready on the pod, run from the repository root (or translate these paths to
`/opt/experiment` in the image):

```bash
export API_BASE=http://127.0.0.1:8000/v1
export REQUEST_TIMEOUT_SECONDS=240
cargo run \
  --manifest-path cyberAlchemy-v2/work-orchestration-implementation/runtime/Cargo.toml \
  --bin micro_swarm --offline -- \
  cyberAlchemy-v2/work-orchestration-implementation/generated/micro-swarm-dag.json \
  cyberAlchemy-v2/development/research/2026-09-01-subagent-research-context-footprint/micro-swarm-native-control/historical-strategy-benchmark/runpod-27b/agent.sh \
  /workspace/results/rwo-micro-swarm \
  historical-research-micro-swarm-42-run-001
```

This command can invoke the configured model endpoint, so it is an operator
action rather than part of local validation. The current accepted-history
implementation is deliberately in-memory. Durable restart/resume, multi-host
leases, credential handling, deployment, and a live benchmark verdict remain
separate pieces and are not claimed by this candidate.
