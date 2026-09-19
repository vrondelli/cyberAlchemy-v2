# DomainSpec whole-application product-review handoff

## Outcome

The exact `@domainspec-v2/cli@1.0.0` whole-application candidate completed the
five-layer compilation DAG and independent L4 review. The candidate is ready
for product review.

## Exact candidate

- Candidate SHA-256: `8fe1d2ecd5a8812f730790cbf6189d265efd398aece40f925e71e0e929d8000e`
- npm tarball SHA-256: `4e973b1f32ed65a1266da2c6d2d5494f73aef38e1378a6cd7ee344759125221a`
- Packed inventory: 1,522 files and 2,754,883 bytes
- Source inventory: 486 files
- Exact TypeScript 7.0.2 emit: 1,420 files
- Generated provider applications: 65 TypeScript, 117 Python, and 79 Rust artifacts

## Product capability present

The installed CLI composes one authored domain graph and one integration graph,
applies an explicit provider selection, and emits a coherent TypeScript, Python,
or Rust application with dependency locks, migrations, provider adapters,
configuration references, schemas, and an exact verification receipt.

The installed commerce example contains the source, three compiler selections,
three provider selections, the integration source, and executable signed-webhook
startup scenarios. Each language rejects an invalid signature with `401` before
the handler and accepts a valid signature with `202` and one handler call.

## Review evidence

- `CANDIDATE-MANIFEST.json` identifies the complete candidate and claim ceiling.
- `CANDIDATE-VALIDATION.json` records currentness, regeneration, and required-test results.
- `PACKED-FILE-INVENTORY.json` contains the exact package allowlist.
- `INSTALLED-CONSUMER-REPORT.json` records the clean installed three-language flows.
- `INDEPENDENT-REVIEW.json` accounts for every L4 obligation with no unresolved discrepancy.
- The L3 evidence directory contains the bounded PostgreSQL, NATS, HTTP, failure, observation, and cleanup proof.

## Claim boundary

This handoff does not approve, admit, publish, release, deploy, or establish
production readiness or operational support. Those remain separate governed
decisions. `authority_effect` remains `none`.
