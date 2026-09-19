---
task: TASK-BTE-L7A-IOLM
layer: L7A
status: proposed-17-signature-consumer-owned-no-swu-instantiated
updatedAt: 2026-08-23
---

# TASK-BTE-L7A-IOLM — Interactive Ontology Learning Map Consumer Proof

## Primary Behavior

Prove that IOLM consumes one exact green BTE core handle and preserves IDs,
relation direction, provenance, semantic bytes, deterministic rebuild, view
hashes, and graph/hierarchy/table GET parity through a consumer-owned run and a
separate BTE-owned replay.

The consumer contract must require the exact candidate core denominator of 13
backend kinds and 17 ordered relationship signatures. Its earlier DSC-A
predecessor remains an independent IOLM-owner gate: only an exact passing
receipt or a separate owner decision may resolve it.

## Boundary And Outputs

Consumer writes stay under
`cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/`. First repair the
closed receipt schema so `graph_hierarchy_table_get_parity` is a required
property matching the existing machine contract. Then add missing/invalid/
parity-drift fixtures, run the consumer-owned adapter/runner, and emit raw
observations plus a non-authoritative consumer receipt. BTE may write only its
replay artifacts under the BTE run root.

## Failures And Exit

Reject missing parity, parity drift, stale or wrong core handle, digest-shaped
placeholder, literal pass, fixture/schema-only evidence, BTE-authored consumer
receipt, nondeterministic rebuild, or altered identity/direction/provenance.
Exit is one fresh IOLM ReplayResult referencing the exact L6 handle. IOLM cannot
change core truth or admission.

No consumer run, DSC-A receipt, DSC-B receipt, or replay is authored by this
planning proposal.
