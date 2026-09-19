# Private CLI release integration prepared

The 36-file integration proposal passed local product validation and independent review on fresh origin/master `9832ee36c5332be825ff065fb8cff05b23b2fd81`. A private downloadable archive is prepared as selected by the user. No commit, push, hosted workflow dispatch or release was performed.

## Correction found during preparation

The latest hosted run failed before compiler tests because package.json omitted `test/runtime-l3.test.ts`. The previous local assessment did not run the CI contract validator and missed this test-list gap. The accepted source reproduces the CI failure.

The isolated proposal adds that file to `test:parallel`. CI validation now passes and its four SQLite tests pass. All 34 CLI test files are included. This is the sole source difference from accepted DSV2-CLI-SUCCESSOR-002. All 277 packaged file paths and metadata match; only package/package.json content differs. Compiler runtime contents are identical to the accepted archive.

## Local evidence

| Check | Result |
| --- | --- |
| CI configuration contract | PASS after correction; prior failure retained |
| Typecheck, build and system integration | PASS |
| Previously omitted SQLite tests | PASS: 4 tests |
| Serial proof tests | PASS: 21 tests |
| Complete parallel suite | PASS: 207 tests |
| Contract suite | PASS: 25 tests |
| Generated Rust validation | PASS |
| Clean package validation and replay | PASS |
| Independent scope/correction review | PASS |
| Exact staged allowlist and patch | PASS: 36 CLI files, no submodules |
| Accepted candidate and primary checkout source preserved | PASS |

The earlier v2 real-tool qualification remains retained evidence; it was not rerun for this metadata-only correction. Hosted qualification must run for the eventual exact source commit. The formal clean-source release bundle and hosted results remain not_evaluable until that source exists remotely.

## Exact next product decision

Candidate **DSV2-CLI-TEST-COVERAGE-003** has candidate.json SHA256:

`8474c95dd8b6447779e9cd98815d61ea776f8df84293c2783ec732f2343850dd`

Private review archive SHA256:

`8ca3405e974a9b2ffac3b388bc542c1dc1dd6ef60962eacdd84b3427d2494f57`

Suggested acceptance statement:

> I accept DSV2-CLI-TEST-COVERAGE-003, candidate digest 8474c95dd8b6447779e9cd98815d61ea776f8df84293c2783ec732f2343850dd, as the tested one-line test-command correction to DSV2-CLI-SUCCESSOR-002, with the existing scope and limitations retained.

This additional decision is necessary because the correction changes acceptance-bound package bytes. The root AGENTS.md CAV2-D65 rule requires a new test and approval epoch for changed acceptance-bound bytes. Existing acceptance and frozen files remain untouched. Accepting the correction grants no operational authority.

## Prepared operational envelope

See EXECUTION-PROPOSAL.md and integration-scope.json for the 36-path allowlist, complete binary patch, before/after hashes and proposed Git tree `2a7cae033b34b65fbf29024ae8538e93f5835257`. After product acceptance, the next separate authorization can cover one local commit on `codex/domainspec-cli-release-1.0.0`, private branch push and workflow_dispatch on that branch. The master branch, gitlinks and package publication are outside that proposed envelope.

Your selected distribution target is a private downloadable archive. DISTRIBUTION.md records the private CI-evidence route, 14-day workflow-artifact retention limitation, and the later durable release/access decision. No npm configuration change is needed for this archive proposal. UI remains excluded; BTE comparison remains deferred.

Artifacts: package/domainspec-v2-cli-1.0.0.tgz, integration.patch, candidate.json, checks.json and the phase logs.
