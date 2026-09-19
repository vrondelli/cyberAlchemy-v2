# Implementation Plan

## Outcome

Prepare, but do not execute, the smallest coherent repository-local path that materializes the admitted N43 envelope schema and N44 evaluator receipt schema as one EVF-owned, digest-bound, immutable-v1 contract chain.

## Selected delivery boundary

`BMC-REL-PLAN-01-A-EVF-EVIDENCE-CONTRACT-FAMILY` fixes:

- canonical family: `projects/domainspec-v2/development/evolvable-validation-framework/`;
- schema namespace prefix: `https://domainspec.dev/schemas/evf/`;
- schema-version prefix: `evf.`;
- compatibility: accepted v1 bytes are immutable and incompatible changes create a new version;
- registry: `contracts/closure-evidence-contract-manifest.v1.json` for this family only;
- lifecycle owner: EVF evidence-chain lifecycle owner, with relationship meaning retained by the relationship-validation contract owner.

Included: two schemas, five fixtures, one scoped manifest, one chain validator, execution/closeout receipt paths, preservation checks, and readiness evidence. Excluded: relationship meaning changes, packet/profile admission, evaluator runtime integration, currentness policy, publication, release, deployment, and D06.

## Ordered implementation frontier

1. `SWU-CCE-002`: create `contracts/emits-incoming-closure-evidence-envelope.v1.schema.json` and `fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE/valid-minimal-envelope.v1.json` from the N43 candidate, changing only candidate identity/paths to the selected EVF v1 identity.
2. `SWU-CCE-003`: create `contracts/emits-target-max-evaluation-receipt.v1.schema.json` and the pass/invalid/incomplete/error fixtures from N44, with exact references to the admitted envelope identity.
3. `SWU-CCE-004`: create `contracts/closure-evidence-contract-manifest.v1.json` containing exact path, `$id`, `schema_version`, digest, size, owner, compatibility, and claim-ceiling entries for the two schemas.
4. `SWU-CCE-005`: create `tools/validate-emits-closure-evidence-contracts.mjs` and prove schemas, fixtures, exact cross-bindings, result precedence, manifest digests, hostile rejections, and canonical preservation.
5. After each Task Session terminal receipt, Invoke Refresh must issue the matching closeout receipt before the next unit can be selected.

## Readiness and acceptance

Work Pack Readiness Audit and Implementation Readiness validate only the frozen Plan contract. Their byte-current receipts report `PLAN_SEMANTIC_READY` and `PLAN_IMPLEMENTATION_READY`; neither is mutation authority. The final implementation-candidate digest must be accepted separately before `SWU-CCE-002` can enter Task Session.
