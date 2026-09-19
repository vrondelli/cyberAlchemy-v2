# Validator Repair Patch Proposal

## Exact target

`projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/validation/validate-apply-package.mjs`

## Exact byte transition

- Preimage: SHA-256 `2b27e0861740600a46be207e72d4a385fc82081e82ed5e42e2eed486092b322e`, 149,061 bytes.
- Postimage: SHA-256 `985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c`, 149,370 bytes.
- Patch: SHA-256 `484c1ef52b8799d93c22a8ed646e39700061391bdd7104409645cc34721028de`, 1,632 bytes.
- Net change: +309 bytes; one target only.

## Behavior

The wrong-generation hostile selects the digest-valid archived ontology preimage instead of reusing the now-stale former-live reference. The production rollback-generation comparison is unchanged. A missing archived ontology ref fails closed as `V2_PROMOTION_FIXTURE_INVALID`.

## Acceptance boundary

The proposal is not applied. Fresh exact-byte owner acceptance must bind the terminal repair-package receipt and pre-receipt inventory before any mutation of the accepted package. Admission, PromotionRecord creation, promotion, publication, release, deployment, and production effects remain forbidden.
