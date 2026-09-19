# DSV2-APPLICATION-LAYOUT-RELEASE-001

Result: PASS for local qualification and private archive preparation. This is a tested local release candidate; acceptance and publication are pending.

## Product and archive

The archive contains DomainSpec CLI 1.0.0 with the accepted `domainspec.application-layout/v1` generated-output and runtime layout. The accepted AlchLang checkout was tested against the extracted archive; AlchLang itself is not distributed in this package. UI remains excluded from v1.0.0, and BTE remains deferred.

Archive: `package/domainspec-v2-cli-1.0.0.tgz` (381846 bytes, 281 regular files).
SHA256: `5b16b847a08743c994d8f8709ddda64926113b1fb1a17f16952a9ea1d4a2654d`.

Relative to the previous private archive: 4 added files, 17 changed files, 0 removed files, and 260 byte-identical files. The additions expose the output-layout contract. See `archive-diff.json` for exact members. Repacking after the full build produced the same archive bytes.

The only isolated source correction beyond accepted layout candidate DSV2-APPLICATION-LAYOUT-001 restores the existing SQLite runtime test to `test:parallel` in package.json. This restores the previously accepted test-coverage correction; no compiler or runtime implementation was changed during this preparation. Original accepted source bytes remain unchanged.

## Qualification

- 255 unique CLI tests passed: 21 proof/assurance, 209 parallel regression, and 25 package contract tests.
- 9 system-integration tests and 6 AlchLang consumer tests against the actual extracted archive passed, including Node and Rust consumers.
- Typecheck, build, generated Rust validation, clean package installation/replay, and test-file coverage checks passed. The supplemental four SQLite tests passed and are already included in the 209 regression tests.
- Both executable recipe runs passed Terraform format, backendless initialization and validation, Docker buildx bake checks, and recipe byte verification. Certificates were byte-equivalent and matched the expected baseline. The offline recipe verifier passed all 16 checks.
- All 219 accepted artifacts, 584 accepted source files, and 35 accepted fixtures remained current. The previous archive remained unchanged. All 789 isolated input files matched their expected source digest, with only the declared package.json correction.

Initial runs lacked direct fixture inputs in the isolated workspace: integration binding records, canonical Lean comparison files, Auth fixtures, and governance compiler fixtures. Those exact dependencies were copied and affected suites rerun successfully. Original failed logs and `qualification-checks.json` are retained. `final-checks.json` reconciles them with passing rechecks. Four expensive assurance tests passed originally; all 17 formalization tests passed in the subsequent recheck, covering the complete 21-test proof suite.

## Limits and next decision

This evidence is local Linux x64 qualification using Node 26.8.1, npm 11.19.0, Python 3.12.3, Lean 4.33.1 and Rust 1.94.0. Hosted CI previously used Python 3.12.14; no hosted run was performed for this new candidate. Pinned Terraform and Docker adapters were exercised without deployment.

This is a digest-bound local snapshot, not the formal clean-Git-commit release bundle. No source commit, remote push, tag, signing, npm publication, deployment, or external distribution was performed. Prior hosted qualification and its full bundle-verifier result do not transfer to this candidate. Other documented product limitations remain in force; these tests do not prove production readiness on every platform.

Product construction is complete for this tested successor, pending review of these exact bytes. Operational support owner is this task for completed local preparation; the user owns the separate decision on scoped integration and publication. Deferred operational work includes a clean integration commit, fresh hosted qualification, formal release bundle creation and private distribution. None blocks review of the tested local product.

Next decision: accept DSV2-APPLICATION-LAYOUT-RELEASE-001 for the tested local archive scope described here. Acceptance would not authorize publication.
