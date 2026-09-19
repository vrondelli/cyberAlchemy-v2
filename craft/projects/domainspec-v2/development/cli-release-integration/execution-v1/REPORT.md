# Authorized CLI integration execution: PASS

Created commit `3690cc931d66c2d6e1914aaacb06ab64a66d8222`, pushed it to the private branch `codex/domainspec-cli-release-1.0.0`, and completed hosted workflow [34028802963](https://github.com/cyberAlchemyAI/domainspec-core/actions/runs/34028802963). The source tree matches the approved36-file proposal exactly. No master update, submodule change, PR, tag, npm publication, GitHub release or deployment occurred.

## Verification

- Fresh-base and exact staged-tree reconciliation passed.
- Repository publication check passed; the isolated checkout is clean.
- Hosted verify-product passed: 21 proof tests, 207 parallel tests, 25 contract tests, plus configuration, integration, build, Rust and clean-package checks. These suites report no failures or skips.
- Hosted qualify-recipe passed: real-tool qualification ran twice, then the formal unsigned candidate bundle was built and uploaded.
- Both downloaded ZIP digests match GitHub artifact metadata and the expected source commit.
- The offline verifier passed all44 checks against `3690cc931d66c2d6e1914aaacb06ab64a66d8222`.
- The hosted CLI archive is byte-for-byte identical to accepted DSV2-CLI-TEST-COVERAGE-003.

Package SHA256: `8ca3405e974a9b2ffac3b388bc542c1dc1dd6ef60962eacdd84b3427d2494f57`.

Formal bundle candidate: `domainspec-v2-cli-1.0.0-3690cc931d66`.
Formal candidate manifest SHA256: `b6256d4f90a2848b2d0709bba6a6ec3205a5c9a0c80cb90953b13e7490052db0`.

## Private artifacts

- [Installable CLI archive](hosted-bundle/package/domainspec-v2-cli-1.0.0.tgz)
- [Complete hosted bundle ZIP](domainspec-v2-release-candidate-1.0.0.zip)
- [Offline verification](offline-bundle-verification.json)
- [Package equivalence](hosted-product-equivalence.json)

The full bundle includes qualification evidence, checksums, an unsigned provenance statement and SBOM. These are build/source evidence; they do not assert publisher signing identity or comprehensive security assurance.

## Remaining release boundary

Product construction: the accepted package has now been reproduced and verified in hosted CI from its exact source commit.

Operational support: this approved execution envelope is complete. A durable private release and its access/usage terms remain a separate release-owner decision. The private Actions artifacts expire on 2026-09-20; local copies are retained here. The branch has not been merged to master.

The hosted runner emitted a non-failing deprecation annotation for pinned action runtimes. Any action-pin maintenance is separate future CI work; it did not block this run. UI remains excluded from v1.0.0 and BTE comparison remains deferred.
