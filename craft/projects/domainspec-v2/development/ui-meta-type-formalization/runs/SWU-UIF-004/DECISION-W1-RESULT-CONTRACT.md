---
decision_id: DEC-UIF-W1-RESULT-CONTRACT
target_scope: SWU-UIF-004..006
status: resolved
created: 2026-07-11
selected_option: versioned-w1-contract-alongside-e0
source_of_decision: user
remaining_blockers: 0
---

# Decision: W1 Result-Contract Evolution

## Question

How should W1 add machine-valid records for all 11 UI labels while preserving
the frozen, already-executed E0 evidence contract?

This blocks UIF-004, UIF-005, and UIF-006 before fixture/result mutation.

## Evidence

- [E0 result schema](../../experiments/result.schema.yml) allows only the E0
  pair IDs and Form/Adapter candidates.
- [W1](../../work-pack/waves/W1.md) requires Page through State Indicator and
  forbids lane edits to the shared schema.
- [Layering guardrail](../../IMPLEMENTATION-LAYERING.md) says later layers
  preserve the E0 schema unless a versioned repair invalidates and reruns prior
  evidence.
- [Experiment result contract](../../EXPERIMENTS.md) expects per-label W1
  provisional outcomes that the E0-specific contract cannot represent.

## Options

### 1. Add A Versioned W1 Contract Alongside E0 - Recommended

Create a prerequisite contract-bridge SWU that adds a W1-specific shared result
schema and preregistration structure while leaving E0 files and evidence
unchanged. W1 records retain `protocol_version: ui-formalization.v0.1` for the
proven method and carry a separate W1 result-contract version. Each lane freezes
its candidate criteria, fixtures, expected observations, and correction routes
before its first run.

- Benefit: preserves E0 provenance and gives UIF-007 one normalized join shape.
- Cost/risk: adds one small prerequisite SWU and explicit schema-version routing.
- Choose when: evidence continuity and cross-lane comparability matter.
- Downstream: UIF-004..006 use the same W1 schema; E0 remains reproducible and
  untouched.

### 2. Generalize The Frozen E0 Schema In Place

Broaden the existing allowlists and rules to support every W1 label, then rerun
and revalidate E0 under the modified contract.

- Benefit: one schema path and less file-level indirection.
- Cost/risk: mutates an executed frozen contract, weakens provenance, and may
  require treating prior E0 evidence as invalidated.
- Choose when: a single evolving contract is more important than preserving the
  original evidence boundary.
- Downstream: every E0 receipt/hash/reference must be repaired and audited.

### 3. Give Each Lane A Local Result Schema

Let UIF-004, UIF-005, and UIF-006 define schemas inside their disjoint lane
paths without changing the shared E0 contract.

- Benefit: fastest lane autonomy and no shared pre-lane mutation.
- Cost/risk: three contracts can drift; UIF-007 needs an additional
  normalization/adjudication layer before comparing outcomes.
- Choose when: lane experimentation is intentionally heterogeneous.
- Downstream: schema parity becomes a new join gate and duplicated maintenance
  persists into replication.

## Recommendation

Choose option 1. It is the only path that preserves the executed E0 contract,
keeps W1 records comparable, and avoids making UIF-007 repair preventable schema
drift. The repair is reversible because it adds a sibling contract rather than
rewriting evidence.

## Standing Non-Decision Option

`Explain / more context` expands the exact artifact changes, reversibility,
and downstream consequences without resolving this gate.

## Decision Record

- Selected option: 1 - add a versioned W1 contract alongside E0.
- Rationale: preserve executed E0 provenance while giving all W1 lanes one
  normalized machine contract.
- Source: user reply `1` on 2026-07-11.
- Remaining blockers: none for contract-path selection.
- Consequential mutation performed: none.
