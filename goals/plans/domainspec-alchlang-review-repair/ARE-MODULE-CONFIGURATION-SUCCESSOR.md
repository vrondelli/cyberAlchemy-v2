# ARE module-configuration successor repair

## Decision and boundary

The current `createAlchSemanticAdapter(runtime)` is an explicitly injected
adapter. The historical v1 Alch configuration, runtime-conformance record,
Rust binding, admission and activation decisions select different exact
bytes and a zero-argument factory. They remain historical subjects; none is
repinned or inherited by the successor. The current packaged verifier blocks
on adapter digest drift, and current v1 composition is unavailable.

The successor is a **candidate**, with no runtime admission, enforcement,
operational authorization or activation. A passing local invocation is not
evidence that those decisions occurred.

## Reviewed dependency DAG

| Node | Depends on | Completion condition | State |
| --- | --- | --- | --- |
| S0 Preserve historical v1 | — | v1 source, projections, evidence, binding and decisions unchanged | Done |
| S1 Semantic parity | S0 | Explicit runtime injection and source/compiled digests checked; shared fixtures pass | Done |
| S2 Alch configuration v2 | S1 | Adapter, runtime wrapper and compiled artifact are first-class digest-checked inputs; missing/drifted bindings fail | Done, focused |
| S3 Candidate conformance | S2 | Fresh v2 projection, exact source checks, all three entry invocations and no-effect checks pass | Done, focused |
| S4 Governance and cutover candidate | S3 | Separate Rust binding/verifier and cutover map the injected Alch factory; drift and startup-failure tests pass | Candidate construction done: preadmission Rust verifier, v2 Linux-x64 artifact and packaged preview pass; admission and actual cutover pending |
| S5 Current construction chain | S2 | Requalify package/consumer P02, exact P03, then P04, independent P05 and L4X against changed source bytes | Done at candidate construction level: P01 v3, P02 v5, P03 v3, P04 v3, P05 v3 and L4X v3 pass; owner tests not started |
| S6 Owner validation and decisions | S4, S5 | Owner tests and distinct admission/authorization/activation decisions on the exact candidate | Pending; not implied |

S4 and S5 may be prepared independently, but S6 requires both. No historical
record is overwritten to clear a failed currentness check.

## Current evidence and claim ceiling

The v2 compiler check and runtime validator pass, including the three entry
invocations. The focused compiler, parity, historical-fail-closed and v2
validator tests pass; TypeScript checking passes. The v1 runtime validator
still blocks as expected. A separate Rust verifier binds eleven exact
candidate files and rejects adapter drift (2/2 tests); a local preview
consumes its candidate receipt and composes the injected factory without
claiming activation (2/2 tests). A separate v2 Linux-x64 release-profile
binary and exact manifest are materialized without touching the v1 artifact.
The packaged candidate runs the verified binary directly without Cargo on
`PATH`, checks its receipt and transitive JavaScript closure before dynamic
composition, and passes nine focused preview/failure tests. It still runs in
a mutable local checkout; concurrent JavaScript replacement between
inspection and import is not excluded, and no protected release custody,
admission or activation is claimed. P03 v2 currentness now reports
`source-current: fail` for the prior v2 candidate, because S2 changed selected
AlchLang source/test bytes. A separate P01 v3 package qualification now binds
the exported post-TDE execution-request files (8/8 package checks); P02 v5
passed three installed TypeScript/Python/Rust consumer flows; and P03 v3
candidate `alchlang-domainspec-p03-0575aac7f804030b` passes all seventeen
currentness checks and eight focused P03 tests. P04 v3 binds that candidate
and passes eighteen checks. An independent P05 v3 review passes fifteen
obligations with a short-interval protected-byte snapshot and four focused
tests. L4X v3 binds the exact current chain, four package digests and a
seven-test owner protocol; four static handoff tests pass. The earlier v2
P04/P05/L4X records remain historical, not carried forward. No owner test
result or product approval is claimed.

A wider `npm test` run was stopped after several minutes because the suite is
large and unrelated local-host integration tests were already reporting
failures. It is not a full-suite PASS or a diagnostic conclusion on those
failures; the focused v2, parity, profile and Rust/preview results above are
the current verification ceiling.

Focused `test/local-host.test.ts` separately reproduced 5/8 passing and
3/8 failing. A read-only helper traced the primary failure to this host
lacking the declared `/usr/bin/ansible-playbook`; startup returns `blocked`
before listening, so two later HTTP cases try to fetch `NaN` as a URL. The
existing test-only container is the bounded replay path. That exact
trusted-process slice was rerun in the read-only, network-disabled container
and passed 8/8. The host's 5/8 result is an undeclared-prerequisite environment
failure, not a newly established AlchLang defect. The separate isolated
event/bubblewrap suite was not run or qualified by this replay.

This evidence supports a locally testable candidate configuration and
preadmission Rust source verifier only. The preview accepts a caller-supplied
candidate receipt; it is not an authenticated packaged-artifact cutover. It
does not establish a current packaged release, Rust governance admission,
activation, observed runtime guarantees, provider-native TDE replay or
product approval.

## Open Questions

- What protected distribution/loading contract will close the remaining
  JavaScript inspection-to-import race before an actual cutover?
- Which results will the owner record for the seven exact-candidate L4X tests?
- What owner-test receipt and distinct decisions will be required to admit
  and activate the resulting exact v2 subject?
