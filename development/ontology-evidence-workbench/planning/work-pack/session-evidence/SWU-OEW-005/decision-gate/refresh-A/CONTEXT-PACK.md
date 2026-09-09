# Runtime Context Pack — SWU-OEW-005 Option-A Refresh

Session evidence only; not a canonical planning source.

## Identity and Scope

- Capability: `invoke:refresh:apply-approved`
- Decision: `DG-OEW-005-UPSTREAM-OUTPUT-SCOPE`
- Selected option: `OEW005-A-ADD-PACKAGE-AND-ARCHIVES`
- Owner: `ontology-evidence-workbench-plan-owner`

## Obligations

| ID | Obligation | Status |
| --- | --- | --- |
| REF-5A-01 | add only `package.json`, `source.tar.gz`, and `viewer-dist.tar.gz` to SWU-005 implementation targets | covered |
| REF-5A-02 | preserve the original SWU-005 blocked receipt | covered |
| REF-5A-03 | route resumed execution to `attempt-002/receipt.json` | covered |
| REF-5A-04 | reactivate the chain without duplicating SWU-005 in visited selectors | covered |
| REF-5A-05 | do not perform network or implementation mutation in Refresh | covered |

## Write Scope

Exactly four private planning/chain targets: `WORK-PACK.md`,
`TASK-OEW-UPSTREAM-001.md`, `swu-manifest.json`, and `chain-state.json`.

## Validation

- staged JSON parses;
- SWU-005 has nine unique targets;
- the three option-A targets are present;
- expected receipt is attempt 002;
- chain is active and retains one visited selector;
- original blocked receipt digest remains unchanged;
- applied live targets equal admitted staged bytes.

Strict coverage: **PASS**. Blockers: **0**.
