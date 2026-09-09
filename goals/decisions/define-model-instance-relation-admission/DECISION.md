# Define Model-Instance Relation Admission Decision

Decision ID: `CA2-DECISION-DEFINE-MODEL-INSTANCE-RELATION-ADMISSION-001`

Status: `PASS — exact relation admitted; adoption and conformance remain open`

Selected option: `ADMIT-INSTANCE-OF`

Selection source: explicit user choice (`1`) on 2026-08-30

Authority effect: `none`

## Decision Question

Should exact relation candidate
`CA2-RELATION-CANDIDATE-DEFINE-SYSTEM-INSTANCE-OF-001` at digest
`333b9f251df3bdef157efa9c378ac13cd2905b6379410a62688f2136cc68475d`
be admitted as the directed `CAV2-D16` `instance_of` relation from
`cav2.define.system-runtime.v1` to the exact `cav2.define` parent state?

## Options

1. `ADMIT-INSTANCE-OF` — admit only this exact candidate as the typed-relation
   witness. This does not adopt the parent contract, prove conformance, activate
   authority, satisfy D64, or authorize a runtime or binding.
2. `REJECT-INSTANCE-OF` — reject this exact candidate and return relation typing
   to residue. A replacement would require a new candidate and owner decision.
3. `DEFER-RELATION-ADMISSION` — keep the candidate selected but unadmitted.
4. `STOP-RELATION-ADMISSION` — stop this line of work without changing the
   candidate.

Standing non-decision option: ask for `Explain / more context`. This does not
resolve the gate.

## Owner Gate

`CyberAlchemy v2 product owner plus CyberAlchemy v2 Define runtime owner`

The protected action options are durable owner decisions. Ambient assent,
validation PASS, Project membership, package topology, or the earlier relation
selection cannot satisfy this gate.

## Evidence Boundary

- Selection record: `../define-model-instance-relation/selection.json`
- Exact candidate: `../../bindings/model-instance-relation-candidates.json`
- Exact inherited contract: `../../bindings/inherited-contracts.json`
- Candidate adoption envelope: `../../bindings/adoption-decision-candidates.json`
- Canonical rules: `CAV2-D16`, `CAV2-D48`, and `CAV2-D64`

## Claim Ceiling

The exact candidate is admitted only for `typed_relation(...)` witnessing under
`CAV2-D16`. This decision does not adopt the exact parent contract, prove
conformance, activate authority, satisfy `CAV2-D64`, or authorize a concrete
RecursiveInstanceBinding, runtime, implementation, publication, or effect.

The machine-readable decision is [selection.json](selection.json).
