# Define Exact Parent Adoption Decision

Decision ID: `CA2-DECISION-DEFINE-EXACT-PARENT-ADOPTION-001`

Status: `PASS — protected D48 owner choice recorded`

Authority effect: `none`

Admissibility receipt: [option-admissibility-receipt.json](option-admissibility-receipt.json)

Request digest: `ed77de1cadf85080e6e336bfcd8496b46d2ec91a5c0b725d6203cff9bd88f9d9`

Selection: [selection.json](selection.json)

## Selected Option

`ADOPT-EXACT-PARENT-CONTRACT`, selected explicitly by the
`CyberAlchemy v2 Define runtime owner` on `2026-08-30T11:14:09Z`.

The decision adopts only the exact parent version, inherited-contract digest,
and admitted-relation digest named by the frozen pre-decision envelope. It does
not prove conformance, activate authority, satisfy CAV2-D64, or authorize a
runtime or implementation.

## Decision Question

Should the `CyberAlchemy v2 Define runtime owner` adopt the exact parent state
`cav2.define@0.4.0-candidate#profile-sha256:d6f280457b02512b571a636f84520405f012165dcc7e570837d836917c921fea`
and inherited contract
`CA2-INHERITED-CONTRACT-DEFINE-SYSTEM-001` at digest
`4b8373b486ca8f1a62a8e59f95a2cfb3b54de43ff58777ebd36684adba47a083`
for `cav2.define.system-runtime.v1`, given exact admitted relation digest
`d905f1101bcd9f9df6689143b9cee48de4f1b6eb2674267cc11962a2504628e0`?

## Options

1. `ADOPT-EXACT-PARENT-CONTRACT` — adopt only the named parent version and
   inherited contract. This supplies the D48 owner-decision conjunct but does
   not prove conformance, activate authority, satisfy D64, or register a binding.
2. `REJECT-EXACT-PARENT-CONTRACT` — reject adoption for these exact bytes. The
   admitted relation remains historical typed-relation evidence, not adoption.
3. `DEFER-EXACT-PARENT-ADOPTION` — leave the candidate envelope, adoption
   posture, and owner decision unchanged.
4. `STOP-EXACT-PARENT-ADOPTION` — stop this line of work without changing any
   candidate or admitted record.

Standing non-decision option: ask for `Explain / more context`. This does not
resolve the gate.

## Owner Gate

`CyberAlchemy v2 Define runtime owner`

The two action options are durable, version-exact owner decisions. Relation
selection, relation admission, Project membership, candidate validation,
conformance evidence, or ambient assent cannot satisfy this gate.

## Exact Subject

- Frozen pre-decision adoption envelope: `../../bindings/adoption-decision-candidates.json`
- Frozen pre-decision envelope digest: `90e225003215d9d1d31e0d4aa2a893528ce59bc79a9568687778117759e9ca67`
- Adopted projection: `../../bindings/adopted-parent-contracts.json`
- Inherited contract: `../../bindings/inherited-contracts.json`
- Admitted relation: `../../bindings/admitted-model-instance-relations.json`
- Relation admission decision: `../define-model-instance-relation-admission/selection.json`
- Canonical lifecycle and invariant: `CAV2-D48`, `CAV2-D64`

## Claim Ceiling

This gate records the exact D48 owner adoption choice only. Conformance remains
absent; candidate authority claims remain inactive; the RecursiveInstanceBinding
registry remains empty; and there is no runtime, implementation, publication,
deployment, or external effect.
