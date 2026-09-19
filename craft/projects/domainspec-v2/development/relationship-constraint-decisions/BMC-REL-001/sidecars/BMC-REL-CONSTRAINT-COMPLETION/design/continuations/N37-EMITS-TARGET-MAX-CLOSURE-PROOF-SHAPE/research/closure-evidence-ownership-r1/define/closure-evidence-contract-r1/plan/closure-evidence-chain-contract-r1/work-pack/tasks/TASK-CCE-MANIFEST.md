# TASK-CCE-MANIFEST

Objective: materialize the scoped immutable-v1 registry for this evidence-contract family.

- SWU: `SWU-CCE-004`.
- Dependency: joined SWU-CCE-003 terminal and Invoke closeout receipts.
- Write: `projects/domainspec-v2/development/evolvable-validation-framework/contracts/closure-evidence-contract-manifest.v1.json` plus its execution receipt.
- Required entries: the exact two schema paths, `$id` values, `schema_version` values, SHA-256 digests, sizes, EVF lifecycle owner, relationship-validation semantic owner, immutable-v1 compatibility policy, and `authority_effect:none`.
- Boundary: this scoped manifest is the registry for these two contracts only. It does not create a global EVF registry, admit a relationship profile, or grant publication/release authority.
- Validation: JSON parse, exact path/digest/size recomputation, duplicate-entry rejection, unknown-entry rejection, and no candidate identity residue.
