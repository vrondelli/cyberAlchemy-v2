# Implementation Layering: ORODI Legacy-v1 Adapter

## L0 — Pinned legacy source boundary

`LEGACY-SOURCE-INVENTORY.json` fixes shape IDs, repository-relative paths, hashes, selectors, exact fields, shape kinds, and dispositions. An adapter input must reproduce one exact binding. Digest or selector drift is a rejection, not an implicit refresh.

## L1 — Closed adapter contracts

TypeScript and JSON Schema define the source inventory, legacy input envelope, normalization finding, and normalization result. Every result preserves the shape ID, source binding, replay time, evidence lane, and authority ceiling.

## L2 — Pure normalization kernel

The kernel receives the input, inventory, and explicit replay time. It performs no I/O and emits stable JSON. Failure-map rows become simulated product-log observations; OTel metric declarations become simulated product-metric observations. All emitted observations use the existing generic `OperationalObservation` contract.

## L3 — Fail-closed classification boundary

Workflow telemetry is rejected as the wrong plane. SLO/Prometheus/config shapes are rejected as declarations rather than observations. Infrastructure/deployment procedure shapes are rejected as proposal-only. Load/canary inputs are rejected because the family is absent. Unknown, drifted, malformed, unsafe, or over-budget inputs are rejected with stable discriminators.

## L4 — Replay proof

Golden input/result pairs prove byte-stable normalization. Hostile descriptors prove binding drift, plane confusion, proposal laundering, absent-family fabrication, malformed time, unsafe attributes, excess cardinality, and unknown shape rejection. Existing WP1/WP2 tests remain green.

Recomposition: L0 pins what v1 actually contains; L1-L3 translate or reject without semantic inflation; L4 proves the adapter boundary. No layer actuates anything.
