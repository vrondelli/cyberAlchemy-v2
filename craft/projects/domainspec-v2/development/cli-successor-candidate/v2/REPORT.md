# CLI successor: ready for local product acceptance

Candidate **DSV2-CLI-SUCCESSOR-002** passed all executed local product checks and independent repair review. Its exact candidate.json SHA256 is `e275c0a75b005cef95b0ebde01be609493fe2d94e909cdbf3a1d93b9b09b93e1`. The archive SHA256 is `c7c785282f82cb5435efedc202d62cd37c604ac7dff7d610307dfecd19de9d9c`.

## What changed

The original successor failed independent review: accepted integer literals above or below Rust's i32 range generated Rust that would not compile. The generator now emits validated numeric literals with i64 suffixes. A new regression compiles and executes generated Rust at both i32 boundaries and both JavaScript safe-integer extrema. It reproduced four failures before the repair and passed afterward. The initial incomplete test fixture failure is separately retained in regression-fixture-setup.log.

Exactly two source files changed relative to frozen v1: src/generation/rust-composition.ts and test/generation/project-composition.test.ts. The guarded-binding test inclusion from the preceding validation remains included. Frozen v1 remains BLOCK; prior accepted candidates are unchanged.

## Evidence

| Check | Result |
| --- | --- |
| Typecheck, build, system integration | PASS |
| Serial proof suite | PASS: 21 tests |
| Expanded parallel suite | PASS: 203 tests, including generated Rust regression |
| Contract suite | PASS: 25 tests |
| Generated Rust validation | PASS |
| Clean-package validation and isolated replay | PASS |
| Qualification harness | PASS: 7 tests |
| Real L1 qualification | PASS: both runs, byte equivalence, expected baseline |
| Offline qualification verification | PASS: 16 checks |
| Isolated archive help and root API import | PASS |
| Independent review | PASS: repaired emission, independent Rust probe, source/package integrity |

The full product phases passed without retries. Final integrity checks found no added, changed or missing files in the 199-file CLI source snapshot. Nine direct build-input files also match their frozen copies. Installed tool binaries and every external test fixture are not part of that source snapshot. The source/build-input manifests, tool versions and exact archive are retained for review.

## Product scope and next decision

See PRODUCT-SCOPE.md for the bounded local compiler scope: exact UInt64, declarative/portable/guarded behavior, project composition and the Rust literal repair. Product approval binds this exact candidate digest only. It grants no publication or deployment authority.

Suggested acceptance statement:

> I accept DSV2-CLI-SUCCESSOR-002, candidate digest e275c0a75b005cef95b0ebde01be609493fe2d94e909cdbf3a1d93b9b09b93e1, as satisfying the tested local CLI successor scope described in its review, with the documented limitations retained.

## Operational support

The formal committed-source release bundle and hosted exact-source checks are not_evaluable because this successor has no clean committed-source identity. Release-owner decisions remain for exact integration/commit scope, distribution/provenance configuration and license/repository metadata. These are separate from the completed local construction and review work. No commit, push, release, publication or deployment occurred.

UI remains excluded from v1.0.0. BTE comparison remains deferred. This is bounded product evidence, not a comprehensive security audit or production-safety claim.
