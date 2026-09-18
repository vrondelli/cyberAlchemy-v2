# Changelog

**Lifecycle status:** CANDIDATE_INTERNAL

**Audience:** ARE release reviewers, integrators, and maintainers.

**Owner:** ARE release owner. No public release owner is assigned.

**Last reviewed:** 2026-09-17.

**Applies to:** Private ARE product candidates.

**Claim ceiling:** Records immutable candidate history. It does not identify an accepted public release, supported upgrade path, deployment, or stability promise.

This history follows the identities in [`evidence/`](evidence/). The generated
[`candidate-history.json`](docs/releases/candidate-history.json) binds all retained
candidate records and computes path/digest deltas between consecutive
candidates. Candidate IDs identify exact frozen source closures. Repeated
product versions with different candidate IDs are distinct candidate bytes and
must not be treated as releases of the same artifact.

The selected [`release-policy.json`](docs/release-policy.json) defines the
accepted-release taxonomy as Added, Changed, Deprecated, Removed, Fixed, and
Security. It also selects append-only dated corrections and a one-subsequent-minor
deprecation window with an urgent-security exception. These rules begin with a
future accepted `0.10.0-rc.1`. The candidate history below remains historical
evidence rather than retroactively accepted releases.

The same policy now records the customer offer as a paid download of the
complete self-contained software. It also binds the digest of the latest Keld
candidate source-available license direction. Exact legal terms and rights/notice review
remain release gates, so this record does not itself license or sell Candidate
018.

## Unreleased documentation work

- Added an integrated ARE manual and release-readiness documentation contract.
- Added visibly inactive deployment, migration, security, service, and
  compliance guides that expose their missing activation evidence.
- Added a generated candidate-internal API inventory with a closed source
  manifest and deterministic drift check.
- Added this candidate history and a versioned Candidate 013 release note.
- Added a deterministic source-archive lifecycle drill and Candidate 018
  receipt covering install, health, reconnect/restart, failure injection,
  source rollback, two-store backup/restore and uninstall.
- Added Ed25519 archive-statement signing and verification tooling with tamper,
  wrong-key, and private-key-permission tests. No release identity is embedded.
- Added a controlled-English policy, a deterministic writing check, and a
  review receipt for meaning-sensitive findings.

These documentation bytes are tracked by a separate documentation release
manifest. They are not part of the frozen Candidate 018 product closure.

## 0.10.0-self-contained-candidate.7 — Candidate 018

- Candidate ID: `ARE-PRODUCT-CANDIDATE-018`
- Candidate digest: `36e9ecd02bd19346207ccced8d16d4ee0a4036d757398d7b961e8feee41327ab`
- Source closure digest: `02b2fc81eabd58b7273d2a909df355e11388ad871d365596506897a6fa58462c`
- Evidence: [`product-candidate.018.json`](evidence/product-candidate.018.json)
  and [`product-test-receipt.018.json`](evidence/product-test-receipt.018.json)
- Release note: [`docs/releases/0.10.0-self-contained-candidate.7.md`](docs/releases/0.10.0-self-contained-candidate.7.md)

Candidate 018 freezes the self-contained implementation with its final
reader-facing product README. Its 907-file, 7,954,528-byte closure passed 1,158
cases across 146 test files and 20 targets in isolated-source-closure mode.
Release verification is `PASS`. Product approval remains `not-requested`.
The separate source-distribution lifecycle receipt records a reproducible
1,817,921-byte archive and a passing disposable package lifecycle.

Trusted
signing remains unrun. Durable recovery is limited to disposable local paths.

## 0.10.0-self-contained-candidate.6 — Candidate 017

- Candidate ID: `ARE-PRODUCT-CANDIDATE-017`
- Candidate digest: `cfebe68ba60e763fcb35a6443f7d6503fbdde5910be4fdb2aa83cc5590f1ed37`
- Source closure digest: `7febe864be456dc4559a5fd9f9238fb348719a6375eb66523836e21512949f9b`
- Evidence: [`product-candidate.017.json`](evidence/product-candidate.017.json)
  and [`product-test-receipt.017.json`](evidence/product-test-receipt.017.json)
- Release note: [`docs/releases/0.10.0-self-contained-candidate.6.md`](docs/releases/0.10.0-self-contained-candidate.6.md)

Candidate 017 includes the generalized documentation evidence checks discovered
after Candidate 015. It contains 907 files and 7,954,528 bytes. It passed 1,158
cases across 146 test files and 20 targets in isolated-source-closure mode. Release verification is
`PASS`. Product approval remains `not-requested`.

## 0.10.0-self-contained-candidate.4 — Candidate 015

- Candidate ID: `ARE-PRODUCT-CANDIDATE-015`
- Candidate digest: `049236089d3c7d297567e9b5cb885125e5a7f9824424e1cd76178c2a56229086`
- Source closure digest: `5af2cd079646e0c06c24d3c8804543707b18a85642cc6cd2581d08e5aec95c62`
- Evidence: [`product-candidate.015.json`](evidence/product-candidate.015.json)
  and [`product-test-receipt.015.json`](evidence/product-test-receipt.015.json)
- Release note: [`docs/releases/0.10.0-self-contained-candidate.4.md`](docs/releases/0.10.0-self-contained-candidate.4.md)

Candidate 015 replaces Alch semantic runtime imports with an ARE-native adapter.
It includes an ARE-owned local secret bridge and removes the DomainSpec and Alch
compiler trees from the product closure. It also adds a standalone materializer
that verifies digests. Its 907-file closure passed 1,158 tests across 146 test files and
20 targets in isolated-source-closure mode. Product approval remains
`not-requested`.

Candidate 014 recorded the initial standalone implementation and passing product
suite. Its release verification exposed one stale Rust-binding coverage rule.
Candidate 015 contains that correction and is the release-ready successor.

## 0.10.0-signed-envelope-candidate.2 — Candidate 013

- Candidate ID: `ARE-PRODUCT-CANDIDATE-013`
- Candidate digest: `dbf8633542f3825a19b73dbb0af4506c6c27f589d9ec430539c90d77061a4b70`
- Source closure digest: `a17912f28e834ff2e7bfd6d6de1316dcb43ac5630167cc3dcfdc9771d3c742c4`
- Evidence: [`product-candidate.013.json`](evidence/product-candidate.013.json)
  and [`product-test-receipt.013.json`](evidence/product-test-receipt.013.json)
- Release note: [`docs/releases/0.10.0-signed-envelope-candidate.2.md`](docs/releases/0.10.0-signed-envelope-candidate.2.md)

The frozen closure contains 3,410 files and 53,860,253 bytes. Its recorded
product suite contains 1,244 cases across 156 test files and 26 targets. The
receipt reports `PASS`, while product approval remains `not-requested`.

## Earlier immutable candidates

| Candidate | Product version | Candidate digest |
| --- | --- | --- |
| 012 | `0.10.0-signed-envelope-candidate.1` | `3e23e92aa4e082f31ef5756998b3debf32023cc6314461cd6bc10cb7fd086b66` |
| 011 | `0.10.0-signed-envelope-candidate.1` | `91900ff51701bb8fb1fa7199f96612028e79dc4c01d4d7450a5133bf02807f7e` |
| 010 | `0.10.0-signed-envelope-candidate.1` | `6ec1ae30446ad5bf0ffe8ab6135763d054336d7cc7696f31362a1f699d412773` |
| 008 | `0.7.5-objective-frontier-continuation-candidate.1` | `02514e7b42eeab006ac53ec67999d269217462028a844ac0394f4179b4d203a7` |
| 007 | `0.7.4-current-continuation-scorecard-candidate.1` | `738b9cbd412742e3d638e88492725fc604c0fab117299156828d31829e1d3e98` |
| 006 | `0.7.3-route-continuation-benchmark-candidate.1` | `c856c0bacba653f9665167f07728360c97eb65bd0f440359062a1f1fd3d9b809` |
| 005 | `0.7.2-portable-benchmark-scorecard-candidate.1` | `df9e6ba6004f6435e69fad8bf7757921179aea46ff46e2de5e2f010f18e94306` |
| 004 | `0.7.1-benchmark-scorecard-candidate.1` | `d61540a58314c723e3ad9d74faafb4389304e3f11ab2366f4eaed9235bd1a804` |
| 003 | `0.7.0-first-class-product-candidate.1` | `b2ca50201ae032267132ab9738ba8ce209f35cd18e3509e972928a6c69a590f7` |
| 002 | `0.6.0-coding-agent-l2-candidate.1` | `fc3407647384367095ab4c2d4d5b156281000e2bc348fb3ad9b25586e1cc3719` |

Candidate 009 is absent from the retained evidence directory. The history does
not infer an artifact, status, or explanation for that unused identity.

## Open Questions

- Which candidate will receive the first explicit product approval and release
  identity?
- Which successor candidate will become the first accepted `0.10.0-rc.1`?
