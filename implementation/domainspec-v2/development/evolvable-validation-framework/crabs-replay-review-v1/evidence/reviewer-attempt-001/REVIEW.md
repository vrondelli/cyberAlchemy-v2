# Independent technical replay review

Date: 2026-09-12. Reviewer: Codex subagent `/root/crabs_independent_replay`.
Caller session: `crabs-independent-review-20260912-001`.
Scope: private local technical review; authority effect: none.
This separate fresh-context review shares the author's host and model lineage.
It is not external accreditation, an organizational audit, or certification.

## Conclusion

**Changes required for package completion.** The fresh execution supports the
narrow defect/repair comparison, but the runner's promised process timeout is
not enforced after both output streams close. This defect was independently
reproduced below. The parent separately reported an assertion-normalization
defect after this review's live replay; that finding is attributed to the parent,
not presented as an independent discovery.

Reviewed freeze:
`18d7d680ed1f45db3163d8539f0856a7ca75eed6a915cc9b43726d3d193d9e87`.
No frozen input, runner, contract, or author evidence was changed by this reviewer.
A corrected successor must have a new freeze and fresh author/reviewer evidence.

## Fresh execution and correspondence

Read README.md, PROPERTY.md, replay.py, the historical and common harnesses,
the common dependency shim, regression harness, and relevant original/repair
merge, preflight and materialization sources. Checked every exported SHA-256
and every available Git blob identity against the packaged source manifest.
Commit ancestry was not separately fetched; packaged provenance remains a trust
anchor rather than independently authenticated historical ownership.

Executed the documented run using repository tools/toolchain/run with verified
CBMC binary SHA-256
`a62af25d27425610608221d79c202f993efe1d5a85cece186119bec196382995`.
The fresh directory was `/tmp/crabs-replay-reviewer-attempt-001`.
Execution ran from 16:07:56.370794 to 16:08:02.673567 UTC (about 6.30 seconds).
Host: WSL2 Linux x86_64, glibc 2.43. Compiler: pinned GCC 15.2.0,
not historical GCC13. Exact commands, tool hashes, durations and outputs are in
[evidence/reviewer-attempt-001/result.json](evidence/reviewer-attempt-001/result.json).

Both original native runs aborted on the order assertion with
`merge(A,B)=[A,B] merge(B,A)=[B,A]`.
Historical original CBMC failed `main.assertion.1`.
Common original CBMC passed assertions 1, 2 and 3 (two successful returns and
preserved membership/counts), then failed assertion 4 (order).
Both repaired native runs returned zero with `[B,A]` in both directions.
Historical repaired CBMC passed all three selected assertions; common repaired
CBMC passed all four. The five native regression groups completed.
Re-running verify returned `REPLAY_COMPARISON_PASS`; the seven existing verifier
fault tests also passed, but do not cover the two defects identified here.

The common fixture has four independently initialized stack singleton states,
fixed zero-filled A/1 and B/1 IDs, and identical oracles/shim/bounds.
REPAIRED_LAYOUT only initializes placement_id from the element ID, corresponding
to the repair's element constructor. Original merge appends new elements;
repair merges placement metadata and materializes deterministic order.
The dependency stubs do not exercise position maps because these fixtures have
no OT data. The property is order of element IDs, not complete payload/state
equivalence. The regression examples do not establish general algebraic laws.

## Required corrections

1. **Process timeout can be bypassed by pipe EOF.** In replay.py, execute()
   monitors the deadline only while the selector contains output streams, then
   calls unbounded proc.wait(). A process can close both streams and remain alive
   beyond the promised deadline. An in-memory test-only TIMEOUT of 0.2 seconds
   with a Python child closing stdout/stderr and sleeping two seconds returned
   exit 0, elapsed 2.0187 seconds, termination null. See
   [probe evidence](evidence/reviewer-attempt-001/reviewer-closed-pipes-timeout-probe.json).
   No package bytes were changed for this probe. Supervise until the process
   exits as well as draining its pipes, and add a regression for this condition.
   Actual replay commands here did not exceed their deadline.

2. **Parent-reported exact-assertion normalization gap.** After this independent
   live execution, the parent reported that changing common-original output to
   assertion 1 FAILURE and assertion 4 SUCCESS, then recomputing raw hashes and
   the receipt, still passes verify_result(). Source inspection is consistent:
   classify_cbmc() returns COUNTEREXAMPLE when any selected assertion fails,
   and verify_result() accepts that aggregate result for the original. It does
   not require the order assertion itself to fail. This reviewer did not rerun
   that injection. The fresh raw trace here does have the intended exact vector.
   Require the expected assertion vector, including success/membership passing
   before the original order failure, and cover the alternative-failure case.

## Evidence and limitations

[Reviewer evidence](evidence/reviewer-attempt-001/) preserves raw run output,
result, verification, source checks, executed runner snapshot, input freeze and
routing receipts; build binaries are omitted. The runner's current verification
is useful integrity/normalization checking, not independently authenticated
execution attestation or a complete command-policy checker.

CBMC conclusions concern selected assertions at the declared loop bounds.
Auxiliary safety and unwinding assertions are not all checked. Successful fresh
allocation, fixed IDs, no tombstones and no position maps bound the fixture.
General convergence, all-ID behavior, allocation failures, production
reachability, serialization migration, complete library safety and
abstract-to-C equivalence remain unproved. No public, deployment, admission or
commercial-readiness conclusion follows.

## Open Questions

After correcting and freezing the runner, does a fresh paired replay and
independent reviewer replay preserve these results while rejecting the two
failure cases? Broader property questions remain owned by
[PROPERTY.md](PROPERTY.md#open-questions-and-exclusions).
