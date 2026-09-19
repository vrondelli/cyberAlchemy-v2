# WP-RMT-001 ontology v2 live-apply result

## Outcome Brief

The exact five accepted staged postimages were copied to their five live targets after every preflight binding passed. The first acceptance-critical post-apply package replay then failed on one hostile-control code mismatch, so the apply cannot be reported as validated. The live targets remain at the accepted postimage hashes because rollback was neither authorized nor automatic.

- Objective: apply and validate the accepted WP-RMT-001 ontology-v2 five-target package.
- Result: BLOCK after live mutation; post-apply validation did not complete.
- Why it matters: the ontology-v2 bytes are materialized but are not validated for continuation to migration, admission, PromotionRecord creation, promotion, publication, release, deployment, or production use.

## Boundary and Next Decision

- Changed: exactly two schema files were added and exactly three existing ontology-experiment files were replaced with their accepted staged postimages.
- Unchanged: all six candidate files and six projection receipts; admission state; authority; PromotionRecords; publication and deployment state.
- Rollback: not attempted. The accepted manifest declares automatic rollback false, and this execution had no rollback authority.
- Ordinary live validator: not run after the first acceptance-critical post-apply failure.
- Next action: route a proposal-only governance-defect repair to the DomainSpec architecture-property ontology validator owner. It must preserve the current five live hashes, explain and repair the historical-synthetic hostile topology in a separately staged package, add a post-apply regression, and obtain fresh validation and owner acceptance before any further mutation.

## Applied target inventory

1. architecture-property-ontology-v2.schema.json — added — d616095d63a656af121df2ebc41cd9e6cd3e88d7fd3b6f3edebf50a9a2252f59 — 43,684 bytes.
2. promotion-record-v1.schema.json — added — 9e1e144308ccaadbfc71fe9e7004f68fef82da3860fc13c2cae9fd4c29fcb86f — 11,066 bytes.
3. ontology.json — modified — 6cd5a46c8d51c3c88f16a5ee483e190c6225e5aebeffbb909070ad6cac44169a — 151,653 bytes.
4. domain-meta-types.projection.json — modified — 43afaa7532614ddc1894b1d4760cb434792964295b1ec637e9ddcbf74f052323 — 34,206 bytes.
5. validate-ontology.mjs — modified — 3de34afb076339bce71b7a935a4bd7295df878cdc0c9e529600ce7f0803d9dbc — 169,605 bytes.

All five live targets were byte-equal to the accepted staged postimages in the post-failure residue audit.

## Validation result

- Preflight receipt: ebdbb200f0df38d8cb63593ee09786cf79ca00fd648a972d9d611ab05a76e2e8 / 21,494 bytes — pass.
- Bound pre-receipt inventory: 4f3d288494408c22c8c0342aa29837d80803cb8cfad995050b2e3374335cd3b9 / 21 files / 826,270 bytes — pass.
- Staged semantic package replay: pass.
- Ordinary staged validator with DomainSpec overrides removed: pass, 24 checks.
- Live package semantic replay: exit 1, BLOCK.
- Failure: V2_HOSTILE_SURVIVED:promotion-wrong-generation-preimage:V2_PROMOTION_ROLLBACK_REF_STALE.
- Fixture expected: V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH.

The failure topology is governance-only evidence at this point: the package hostile runs from the historical synthetic live document, whose historical-generation reference resolves through the former live-v1 path. Once that path contains the applied v2 bytes, stale-reference validation fires before the intended wrong-generation semantic mismatch. This diagnosis is not repair authority.

## Preserved state

- Implementation instances: 6.
- Supporting instances: 0.
- Materialized relation instances: 0.
- Deferred relation blueprints: 4.
- PromotionRecords: 0.
- Derived projections: 6/0/0.
- Every instance remains not-admitted.
- Ontology and projection authority effect remain none.
- Candidate and projection-receipt immutability: 12/12 pass.

