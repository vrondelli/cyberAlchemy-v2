# TASK-SFC-COMPATIBILITY — Versioned reading and immutable history

Layer/slice/wave: L2 / SFC-S4 / W3.

## Objective

Implement the 12-month stable-contract promise, six-month supported N-1 read
overlap, and permanent original receipt identities without making old formats
writable current inputs.

## SWU-SFC-015 — N-1 decoders and migration checks

- Primary behavior: read current and one explicitly supported predecessor schema,
  preserve original identity, and reject expired/future/unknown/ambiguous input.
- Independent acceptance: current/N-1 golden fixtures decode to version-tagged
  internal models; migration/re-encode is explicit; unknown fields/major versions,
  expired overlap, lossy conversion, and silent current coercion fail.
- Split analysis: receipt and diagnostic decoders were considered separate, but the
  support policy and timeline apply atomically to both public contracts. Retention
  storage behavior remains 016.
- Dependencies: SWU-SFC-012 and SWU-SFC-014.
- Write scope:
  - `projects/domainspec-v2/impl/cli/src/contracts/compatibility.ts`
  - `projects/domainspec-v2/impl/cli/contracts/compatibility-policy.json`
  - `projects/domainspec-v2/impl/cli/fixtures/compatibility`
  - `projects/domainspec-v2/impl/cli/test/compatibility/n1-read.test.ts`
- Done: explicit version matrix/dates, current/N-1 readers, migration diagnostics,
  immutable original hash, no legacy writer.
- Validation: `VC-SFC-015`.
- Execution owner: Task Session.
- Expected receipt: `runs/SWU-SFC-015/TASK-SESSION-RESULT.json`.

## SWU-SFC-016 — retention and historical identity validator

- Primary behavior: validate permanent release/receipt lookup, 90-day diagnostic
  expiry, safe cache cleanup, and secret quarantine without breaking references.
- Independent acceptance: referenced historical bytes remain reachable; expiry
  deletes only eligible unreferenced diagnostics; secret material is quarantined/
  revoked/superseded; delete-history and dangling-reference mutants fail.
- Split analysis: lookup, retention, deletion eligibility, and quarantine share one
  referential-integrity boundary. Release recovery actions remain 017.
- Dependencies: SWU-SFC-015.
- Write scope:
  - `projects/domainspec-v2/impl/cli/contracts/retention-policy.json`
  - `projects/domainspec-v2/impl/cli/tools/validate-retention-history.mjs`
  - `projects/domainspec-v2/impl/cli/test/compatibility/retention-history.test.ts`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/retention`
- Done: content-addressed lookup, reference graph, expiry/quarantine/supersession
  decisions, no destructive historical rewrite.
- Validation: `VC-SFC-016`.
- Execution owner: Task Session; destructive cleanup remains a stop decision.
- Expected receipt: `runs/SWU-SFC-016/TASK-SESSION-RESULT.json`.

