# Trusted Dataset Materialization

This candidate package specializes the accepted generic work-orchestration meaning into a closed ETL capability: **Materialize Trusted Dataset**.

It follows the CAV2-D65 chain:

```text
definitions
  -> Product Capability
  -> capability-local business ontology
  -> DomainSpec-authored pipeline
  -> compiled graph and system ontology
  -> RWO and connector bindings
  -> bounded conformance evidence
```

## Ontology branches

The package has separate business and system branches:

- `ontology.json` owns capability-local business meaning: trusted datasets, recovery, validation, accepted history, publication, and residue.
- `domainspec/system-bindings.json` authors the exact implementation mapping.
- `generated/system-ontology.json` is the deterministic system branch compiled from the business ontology, Product Capability, DomainSpec workflow, RWO composition, runtime sources, PostgreSQL schema, and binding schema.

The system ontology models components, artifacts, PostgreSQL relations, database constraints, workflow handlers, RWO event bindings, observability, conformance evidence, known gaps, and `realized_by`, `tested_by`, and `observed_by` bridge edges. It is validated by `scripts/validate_system_ontology.py`; validation proves source currency and bridge closure only, not ontology admission.

## Architecture

```text
loopback HTTP source -> immutable landed pages -> canonical mapping
       |                                            |
       +-- DataReferences and receipts -> RWO cursor + hash-chained journal
                                                    |
                    validation --pass--> atomic content-addressed publication
                         |
                         +--reject--> quarantine residue
```

RWO is the control plane. The adapter now uses the public `orchestrator/rwo`
API and `rwo-core-dag/v2`; it compiles the graph and reduces accepted events
into the next structural command. The Python host owns connector calls, data
bytes, durable journal append, artifact production, validation, publication,
lineage, and recovery. DomainSpec owns what recovery means. The former external
kernel identities remain in `orchestrator/examples/trusted-dataset/LEGACY-PROVENANCE.json`
as migration evidence.

The recommended Layer 1 binding uses PostgreSQL as the one accepted-history authority and persistence system for dataset versions, normalized observations, source checkpoints, quarantine residue, and lineage events. The original `journal.jsonl` and atomic-file warehouse remain available as the Layer 0 reference fixture.

HTTP is exercised over a real loopback socket using World-Bank-shaped paginated JSON. PostgreSQL is exercised through its wire protocol using `psql` against a disposable PostgreSQL 16 container. gRPC, Arrow Flight, and Kafka Connect are typed extension contracts only; this package does not claim to execute them.

## Workflow

```text
DiscoverSource -> PlanExtractWindow -> ExtractWindow -> SealRawDataset
 -> MapDataset -> ValidateDataset -> StageLoad -> CommitDataset
 -> ReconcileRun -> CloseRun

ValidationRejected -> QuarantineDataset -> CloseWithResidue
```

The published version ID is the SHA-256 digest of canonical JSONL bytes. Repeating the same input therefore yields the same PostgreSQL dataset version and a no-op publication receipt. Database triggers guard the per-run history chain and reject checkpoints without matching accepted `DatasetCommitted` history.

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/trusted-dataset-materialization/validate.py
```

The validator compiles twice, verifies selected dependency bytes, tests and builds the Rust adapter offline, then runs success, replay, interruption/resume, and quarantine fixtures. Its durable summary is `runs/conformance-report.json`.

Validate the PostgreSQL binding with:

```bash
python3 cyberAlchemy-v2/trusted-dataset-materialization/validate_postgres.py
```

This starts a disposable loopback-only PostgreSQL 16 container, applies `postgres/schema.sql`, runs success, replay, interruption/resume, quarantine, history-chain, and checkpoint-gate tests, writes `runs/postgres-conformance-report.json`, and removes the container and volume.

For a manual PostgreSQL run:

```bash
export CAV2_POSTGRES_PORT=55439
docker compose -f cyberAlchemy-v2/trusted-dataset-materialization/postgres/docker-compose.yml up -d
psql 'postgresql://cav2:cav2-local-only@127.0.0.1:55439/cav2_etl' \
  -v ON_ERROR_STOP=1 \
  -f cyberAlchemy-v2/trusted-dataset-materialization/postgres/schema.sql

etl_run_root=$(mktemp -d)
python3 cyberAlchemy-v2/trusted-dataset-materialization/runtime/pipeline.py \
  --root "$etl_run_root" --run-id pg-demo --fixture valid \
  --backend postgres \
  --postgres-dsn 'postgresql://cav2:cav2-local-only@127.0.0.1:55439/cav2_etl'
```

The password and port above are development-fixture values only. Real credentials, managed PostgreSQL, migration operations, backups, roles, and deployment are deliberately deferred.

## Claim ceiling

This is a bounded local candidate with loopback-only HTTP and disposable PostgreSQL effects. The evidence does not adopt the Product Capability, admit either ontology or DomainSpec source, establish production readiness, or prove execution of gRPC, Arrow Flight, Kafka, or the OpenLineage specification.
