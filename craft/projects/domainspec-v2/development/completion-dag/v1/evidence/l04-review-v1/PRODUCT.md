# Product under review

Candidate `DSV2-L04-MIGRATION-REVIEW-001` combines the L02 additive migration
implementation with L03 selected migration closure. The immutable byte scope is
candidate-manifest.json; its SHA256 is
`2bd0eaf14d65126e68ca5809cfb0aeeb3986e55658e2c1d0ee74f707d55bd1ea`.

The product provides:

- Explicit aspect, normalized-spec and legacy-auto Markdown selection, preserving
  native obligations while rejecting missing or malformed selected inputs.
- A changed-file validation entry point that handles Git paths, spaces, renames,
  deletions and Git failures, with normal-validator-equivalent selected diagnostics.
- An explicitly selected EVF S1 migration profile that verifies source pins and
  compiler reproduction before returning the existing exact native obligation.
- Migration accounting for 33 import rows, two notes and six consumer families,
  with retained, excluded, deferred and implemented work kept explicit.

The historical EVF binding remains stale and rejected. Known BTE mapping failure
and behavioral coverage gaps remain present. SFOL execution, universal machine
profile equivalence, UI, operational rollback, caller cutover, retirement and
publication are outside this product decision. Existing approval records remain
unchanged. Product approval, if later granted, grants no operational authority.

Parent replay: 35 tests and both TypeScript checks pass. Independent review is
BLOCK on L04-F01; this candidate is not ready for product acceptance.
