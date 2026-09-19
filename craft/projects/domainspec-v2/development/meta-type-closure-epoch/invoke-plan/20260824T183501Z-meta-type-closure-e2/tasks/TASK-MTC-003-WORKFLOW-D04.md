# TASK-MTC-003 — Prove Workflow D04

## SWU-MTC-004

- Primary behavior: prove that declared ordered Workflow step count is distinct from the degree of distinct Operation concepts.
- Dependency: SWU-MTC-003 in the serialized execution frontier.
- Sources: BMC-REL-001 D04, current Workflow candidate/card/schema, APE Workflow verification receipt.
- Write scope: exactly the paths in `SWU-CONTRACTS.json#/contracts/3/write_scope`, including the three unit closeout receipts.
- Positive witness: repeated Operation binding across distinct ordered steps remains valid and countable.
- Negative witness: a validator rejects substitution of distinct Operation degree for declared step count.
- Done: proof passes with current bytes and live Workflow remains unchanged. If it fails, stop and open a new bounded representation-gap candidate; do not mutate Workflow inside this unit.
- Split analysis: positive and negative fixtures are one falsifiable D04 claim.
