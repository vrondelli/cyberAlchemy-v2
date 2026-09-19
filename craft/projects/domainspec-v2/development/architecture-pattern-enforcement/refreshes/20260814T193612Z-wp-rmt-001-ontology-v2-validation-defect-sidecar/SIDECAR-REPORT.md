# WP-RMT-001 ontology-v2 post-apply validation defect sidecar

## Outcome Brief

The live ontology implementation is semantically healthy under its ordinary validator. The post-apply failure is confined to the package validator's hostile-fixture topology: the wrong-generation hostile selects a historical proposal reference that points to the former live-v1 path, which necessarily becomes stale after the v2 apply. Stale-reference checking therefore fires before the intended generation-identity check.

- Result: proposal-only repair candidate and regression pass.
- Classification: ordering and error classification only.
- Semantic rollback-generation hole: not found.
- Live or accepted-package mutation: none.

## Root cause and invariant

The package validator creates the wrong-generation hostile from the historical proposal synthetic-live document and replaces the PromotionRecord rollback preimage with that document's first historical preimage reference. That reference binds the live ontology path to the old v1 hash. Before apply it is digest-valid; after apply it is stale, so validation returns V2_PROMOTION_ROLLBACK_REF_STALE before comparing it with the exact current-generation admission preimage.

The affected invariant is that two independent negatives must remain distinguishable in both pre-apply and post-apply topology:

1. A stale rollback reference must produce V2_PROMOTION_ROLLBACK_REF_STALE.
2. A digest-valid but wrong-generation rollback reference must produce V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH.

The semantic validator already enforces the second invariant by exact comparison with admissionPreimageRef. The defect was that the hostile did not supply a digest-valid wrong-generation reference after apply.

## Minimal repair candidate

The staged patch changes one acceptance-bound file only:

- Target: validation/validate-apply-package.mjs in the accepted five-target apply package.
- Preimage: 2b27e0861740600a46be207e72d4a385fc82081e82ed5e42e2eed486092b322e / 149,061 bytes.
- Candidate postimage: 985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c / 149,370 bytes.
- Delta: replace one hostile-assignment line with four lines that select the digest-valid archived ontology preimage from the staged-or-live target ontology and fail closed if it is absent.
- Net size change: +309 bytes.

The patch is stored at repair/validate-apply-package.patch. It was checked against the exact preimage and materialized only in a temporary directory for validation. It was not applied to the accepted package.

## Validation

- Ordinary live validator, no DomainSpec environment overrides: exit 0, pass, 24 checks; stdout SHA-256 9fcc614912fc9c3c3f4ea49f28aabbff507f7839c0e9e8205292b7f3a5927dc2.
- Original package validator live replay: expected exit 1 with V2_HOSTILE_SURVIVED:promotion-wrong-generation-preimage:V2_PROMOTION_ROLLBACK_REF_STALE.
- Patch dry-run against exact source: pass.
- Candidate live package replay: exit 0, pass, 37/37 hostile controls.
- Candidate wrong-generation result: V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH.
- Candidate stale-reference result: V2_PROMOTION_ROLLBACK_REF_STALE.
- Focused staged topology: archived v1 reference is digest-valid and differs from the current-generation admission preimage.
- Full staged replay after live apply: not applicable because the staged-mode baseline gate correctly requires the live v1 preimage and now observes applied v2 bytes.

## Authority and next gate

This sidecar grants no authority and applies nothing. The five live targets, accepted package receipt, accepted package validator, candidates, receipts, registry, admission state, and PromotionRecord state remain unchanged.

Fresh exact owner acceptance is required before the repair can be applied or treated as accepted validation evidence. The validator is part of the acceptance-bound 21-file package inventory, so changing it creates a new candidate and invalidates the old inventory binding for that repaired byte set.

The next owner must create a fresh repair-package inventory and receipt, rerun independent validation, carry this regression as an acceptance-critical post-apply control, obtain exact owner acceptance, and only then decide whether to apply the one-file validator repair or adopt an equivalently bound sibling validation harness. No five-target live reapply, candidate migration, admission, PromotionRecord creation, promotion, publication, release, deployment, or production action is authorized.

