---
title: Trusted Dataset PostgreSQL Implementation Layering
status: candidate
updatedAt: 2026-09-01
owner: CyberAlchemy v2 trusted-dataset capability owner
scope: capability
---

# Trusted Dataset PostgreSQL Implementation Layering

## Context

- Target: PostgreSQL persistence for Materialize Trusted Dataset
- Current state: Layer 0 filesystem proof passes its bounded conformance suite.
- Primary operator: a local pipeline operator proving recoverable ETL behavior.
- Primary constraint: preserve RWO and DomainSpec semantics while changing physical persistence.
- Source references: `README.md`, `bindings.json`, `runtime/pipeline.py`, and `runs/conformance-report.json`.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Outcome | Promotion decision |
| --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether the ETL and recovery semantics work at all. | Loopback HTTP, local artifacts, hash-chained file journal, atomic JSONL publication. | One trusted dataset or quarantine residue. | Already proven locally; preserve as a fast non-regression fixture. |
| L1 | After this layer, we know whether the same semantics survive a transactional PostgreSQL binding. | PostgreSQL accepted history, dataset publication, checkpoint, quarantine, and lineage with disposable integration tests. | Selectable PostgreSQL-backed run with replay and resume. | Implement now; promote only on filesystem and PostgreSQL PASS. |
| L2 | After this layer, we know whether concurrency and degraded-mode recovery are credible. | Competing workers, connection loss, transaction retry classification, operational metrics. | Predictable behavior under bounded failures. | Defer until L1 evidence is stable. |
| L3 | After this layer, we know whether pilot-scale packaging is credible. | Managed PostgreSQL, migrations, secrets, backup/restore, retention, load tests. | Deployable pilot package. | Requires separate deployment and operational authority. |

## L1 Included Scope

- Versioned SQL schema and disposable PostgreSQL 16 service.
- Per-run append-only hash-chained accepted history.
- Content-idempotent dataset versions and normalized indicator observations.
- Checkpoint insertion gated by accepted `DatasetCommitted` history.
- Quarantine residue and lineage event persistence.
- Success, replay, crash/resume, quarantine, and tamper/constraint integration checks.

## L1 Explicitly Deferred

- High availability, replicas, partitioning, connection pooling, and managed-service configuration.
- Automatic schema migration across deployed environments.
- Credential distribution or secret management.
- Large dataset benchmarks, `COPY`, Arrow Flight, Kafka, and object-storage data planes.
- Multi-worker contention and network-failure retry policy.

## Non-Regression Guardrails

- RWO remains the structural scheduler and carries references rather than bulk data.
- DomainSpec retains recovery and validation meaning.
- Exactly one accepted-history authority is selected for a run.
- Replaying identical content creates no second dataset version.
- A rejected dataset creates no publication or checkpoint.
- The filesystem backend and its existing conformance suite remain operational.

## Exit Evidence

- `python3 validate.py` passes the L0 suite.
- `python3 validate_postgres.py` passes against disposable PostgreSQL 16.
- Initial publication reports an applied effect and replay reports a no-op.
- Crash/resume reaches `RunClosed` using the PostgreSQL cursor history.
- Duplicate identities reach `ResidueClosed` with a persisted quarantine record.
- Database constraints reject a broken hash-chain append.

## Recommendation

Complete L1 and stop. L2 has lower value for the present decision because it adds concurrency and operational-policy cost before the transactional binding itself is proven.
