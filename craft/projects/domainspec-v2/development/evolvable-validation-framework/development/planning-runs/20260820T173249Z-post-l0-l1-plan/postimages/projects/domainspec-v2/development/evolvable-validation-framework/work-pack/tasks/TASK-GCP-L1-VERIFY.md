---
taskId: TASK-GCP-L1-VERIFY
layer: L1
slice: S2V
status: blocked-on-P4-R4
complexity: medium
swuExemption: closure-verification
---

# Task GCP L1 Verify

## Objective

Independently determine whether the two terminal L1 receipts compose into the
bounded repeatability claim without changing product/source bytes, repairing a
failed unit, voting between receipts, or strengthening either claim ceiling.

## Inputs

- exact P4 and R4 terminal Task Session receipts;
- both typed EVF receipts, executor receipts, validation receipts, target-result
  inventories, mutation reports, and replay handles;
- the P4-frozen source/graph inventory and current regenerated graph/manifest;
- this Work Pack, target inventory, validation contract, and decisions.

## Verification Contract

Require:

- two distinct Rule IDs, edge IDs, obligation IDs, binding IDs, test IDs,
  execution IDs, mutation denominators, and receipt IDs;
- identical graph digest, source-set digest, and registry digests;
- P4 effect result and ceiling exactly match its contract;
- R4 Boolean result and ceiling exactly match option A;
- every required validation passed, no failed command was masked, and exact refs
  replay from current bytes;
- no semantic merge, provider result, release flag, or broader feature claim.

P4 remains a valid bounded receipt if R4 fails, but the composite verdict is
`block`. Any stale or disagreeing handle also blocks.

## Closure-Exempt Write Scope

Only the three exact paths in
`target-inventory.l1.json#/closure_verification_targets` may be created:

- `projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/l1/verify-l1-composite.ts`;
- `projects/domainspec-v2/impl/test-derivation-engine/src/minted-project/l1/l1-composite.test.ts`;
- `projects/domainspec-v2/development/evolvable-validation-framework/evidence/L1-GCP-COMPOSITE/attempt-001/composite-validation-receipt.json`.

The verifier accepts only exact P4/R4 receipt refs plus the frozen graph/source
handle, validates the identity/digest/ceiling join, and emits a bounded receipt.
Its test must reject missing/duplicated identities, graph/source drift, one
invalid unit, provider-result injection, and claim inflation. It cannot mutate
or repair either proof result. This is a template-authorized closure verification
exemption, not a third proof SWU.

## Successor

On PASS, return control to the owner for a separate L2 admission decision. Do
not select or execute C0, Datalog, Alloy, TLC, Cedar, breadth, release, or
publication work.
