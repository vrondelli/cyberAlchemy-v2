# TASK-CCE-VALIDATION

Objective: prove the materialized envelope, receipt, and manifest form the admitted chain without expanding authority.

- SWU: `SWU-CCE-005`.
- Dependency: joined SWU-CCE-004 terminal and Invoke closeout receipts.
- Write: `projects/domainspec-v2/development/evolvable-validation-framework/tools/validate-emits-closure-evidence-contracts.mjs` plus its execution receipt.
- Positive coverage: schema validity, five fixtures, exact receipt-to-envelope binding, manifest digest/size binding, deterministic result precedence, and canonical preservation.
- Hostile coverage: candidate identity residue; path/digest/size drift; unknown manifest entry; missing closure components reported as pass; visible numeric violation reported as pass; binding error not reported as error; runtime or packet authority inflation; outgoing closure inferred closed; currentness inferred current; D06 scope introduced.
- Done criteria: positive run passes; every hostile probe is rejected; failures propagate nonzero; `relationships.yml`, BMC packet/schema/validator, and candidate sources retain their exact baseline hashes.
- Boundary: validates contract bytes only. It does not evaluate a consumer graph or establish `emits.target_max=1` for any project.
