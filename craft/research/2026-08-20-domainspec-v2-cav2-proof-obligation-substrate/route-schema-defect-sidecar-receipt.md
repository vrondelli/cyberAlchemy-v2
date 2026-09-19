# Route Schema Defect Sidecar Receipt

## Classification and authority ceiling

- Classification: governance-only form/schema defect.
- Scope: diagnose the dispatch boundary enum mismatch and propose a separately applied candidate repair.
- Authority ceiling: no semantic, owner, promotion, publication, or execution decision is inferred here.
- Accepted state: no human confirmation and no accepted route bytes exist. The schema-0.8.0 dispatch-sheet result at SHA-256 `b43f8c46f31d87744c03a14185d74a77188c8bbcf83ba1344fb28a47e03a7033` is not acceptance of this route.

## Root cause

The route uses `authority_owner` for two `boundary_evidence.boundaries[].kind` values:

1. `boundary_evidence.boundaries[0]`, boundary id `b-domainspec-semantic-owner`.
2. `boundary_evidence.boundaries[1]`, boundary id `b-cav2-authority-owner`.

`authority_owner` is not in the dispatch schema's boundary-kind enum. The accepted values are `capability_handoff`, `artifact_import`, `human_approval`, `evidence_return`, `memory_interaction`, `state_write`, and `external_context`. JSON Schema therefore produces one blocking error for each node before the route-specific checks can yield a nonblocking result.

## Affected invariant

Every `boundary_evidence.boundaries[]` entry must use a schema-enumerated `kind`, while ownership remains represented by `from_owner`, `to_owner`, and the boundary `contract`. A descriptive ownership label cannot be introduced as a new boundary kind without changing the schema.

## Minimal repair proposal

On a new candidate, change only these two scalar values:

```text
b-domainspec-semantic-owner.kind: authority_owner -> artifact_import
b-cav2-authority-owner.kind:      authority_owner -> artifact_import
```

`artifact_import` is the minimal form-correct classification for both existing contracts: each permits research to inspect, classify, or map artifacts owned outside the research role while preserving the source owners' authority. Preserve the boundary ids, owners, applied steps, contracts, and `on_violation` values byte-for-byte.

This is not a transfer of authority. `capability_handoff` would imply a different boundary behavior, and `external_context` would classify the material differently; selecting either would be a semantic decision outside this sidecar's authority.

An in-memory, non-persistent substitution of only those two values was validated with the same validator and an empty catalog (the route cites no techniques). It returned:

```text
VALIDATION=flag
FLAG: dispatch cites no techniques
```

The validator exited `0`.

## No-techniques flag

`dispatch cites no techniques` does not block validation. The validator adds it to `flags`; it returns `flag` when there are flags but no blocks, and its CLI exits `0` for both `pass` and `flag`. It prevents a `pass` result, but it is not the cause of the current blocking result.

## Changed-byte inventory

- Created: `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/route-schema-defect-sidecar-receipt.md`.
- Not changed: `DISPATCH-ROUTE.json`, `dispatch-sheet.json`, product or authority sources, Arcanum sources, inventory, telemetry, Git state, accepted bytes, or canonical bytes.
- The validation probe transformed the JSON only in a process pipeline; it created no candidate or temporary repository file.

## Required revalidation

After the parent or authorized owner applies the two-token repair to the actual candidate bytes, run from the repository root:

```bash
python3 .agents/skills/dispatch-spec/scripts/validate-dispatch.py research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/DISPATCH-ROUTE.json
```

The expected result, if no other bytes change, is `VALIDATION=flag`, the single `dispatch cites no techniques` flag, and exit status `0`. Revalidation must target the saved candidate file, not the in-memory probe. If the route is covered by a candidate inventory or digest binding, regenerate that binding from the repaired bytes before requesting confirmation.

## Owner acceptance

Renewed owner acceptance is not required because no earlier human confirmation or accepted route bytes exist. Initial exact user confirmation is still required for the repaired, revalidated route before a governed multi-agent dispatch. The prior dispatch-sheet digest must not be represented as confirmation of the repaired route.

## Permanent workflow regression fix

Add dispatch-spec fixture coverage for an ownership-preserving artifact-import boundary:

- a positive fixture in which `kind: artifact_import` coexists with `from_owner`, `to_owner`, and a contract that explicitly withholds canonical or promotion authority;
- a negative fixture asserting that `kind: authority_owner` blocks with the boundary-kind enum diagnostic; and
- a route-authoring preflight that runs the validator against the exact saved route bytes before candidate digesting or user confirmation, preserving the validator's failure exit status.

This keeps authority semantics in the ownership and contract fields while preventing an invented kind from reaching the acceptance edge again.
