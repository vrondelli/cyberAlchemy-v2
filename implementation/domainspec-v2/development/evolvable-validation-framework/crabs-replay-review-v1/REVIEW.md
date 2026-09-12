# Independent successor technical replay review

Date: 2026-09-12. Reviewer: Codex subagent `/root/crabs_independent_replay`.
Caller session: `crabs-independent-review-20260912-001`; successor request 002.
Private local technical review; authority effect: none.
This review uses a separate reviewer context but shares the author's host and
model lineage. It is not external accreditation or certification.

## Conclusion

**The successor supports the declared bounded replay comparison.**
Fresh execution reproduced the original order defect and the repaired fixture's
successful merges, preserved members and matching order. Both material defects
from the first review are resolved in the inspected successor and independently
tested failure cases. No unresolved material defect was found within this review
scope. This conclusion does not grant product, governance or production approval.

Reviewed freeze:
`bd030b20f39672247803099d5ace830338a29076d003a414e48c748b21834f6b`.
Only replay.py and test_verifier.py changed between reviewed freezes.
The first review remains preserved in
[evidence/reviewer-attempt-001/REVIEW.md](evidence/reviewer-attempt-001/REVIEW.md).
The reviewer did not change frozen inputs or author evidence.

## Fresh replay and source correspondence

Ran through the repository tools/toolchain/run launcher into the new directory
`/tmp/crabs-replay-reviewer-attempt-002`, using the pinned CBMC binary
SHA-256 `a62af25d27425610608221d79c202f993efe1d5a85cece186119bec196382995`.
Input freeze, all exported SHA-256 identities and available Git blob identities
were rechecked. Packaged manifests remain the provenance trust anchor; commit
ancestry was not separately fetched.

Both original native harnesses aborted on the expected order assertion, with
`merge(A,B)=[A,B] merge(B,A)=[B,A]`.
Historical original CBMC failed main.assertion.1.
Common original CBMC passed assertions 1, 2 and 3 and failed assertion 4.
Both repaired native harnesses returned zero with `[B,A]` in both directions;
all three historical and all four common repaired CBMC assertions passed.
All five native regression groups completed. Fresh verification returned
`REPLAY_COMPARISON_PASS`.

The unchanged common harness uses four independently initialized singleton
states and the same dependency shim, bounds, success/member/order assertions
for both subjects. REPAIRED_LAYOUT initializes placement_id from the element ID
consistently with the repaired constructor; it does not change the oracle.
The original appends missing elements; the repair materializes placement order.
These facts support correspondence for this fixed fixture.

## Independently retested corrections

The runner now supervises process lifetime after output-stream EOF.
The same closed-stream child that escaped the original deadline was independently
rerun with test-only TIMEOUT=0.2. It was killed with exit -9, termination timeout,
in 0.3152 seconds. This confirms the corrected edge case; scheduler/poll latency
means a configured deadline is not a hard real-time kill guarantee.

The verifier now requires the original order assertion itself to fail and the
common successful-return/member assertions to pass. Independent injections
changed each of common assertions 1, 2 and 3 to FAILURE, both with assertion 4
still failing and with assertion 4 changed to SUCCESS. Raw hashes and receipt
digests were recomputed. All six altered vectors were rejected for the intended
reasons. This tests semantic rejection beyond stale-integrity rejection.

The package's updated tests also passed: eight rejected evidence faults and the
closed-stream watchdog regression. Independent probe source and results are
retained at
[evidence/reviewer-attempt-002/reviewer-independent-probes.json](evidence/reviewer-attempt-002/reviewer-independent-probes.json).

## Evidence and remaining limits

[Fresh result and exact commands](evidence/reviewer-attempt-002/result.json),
[verification](evidence/reviewer-attempt-002/reviewer-verification.stdout.txt),
and raw command outputs are preserved in evidence/reviewer-attempt-002,
with frozen-input/runner snapshots and routing receipts; build binaries omitted.
Host remains WSL2 Linux x86_64/glibc 2.43, GCC 15.2.0 rather than historical GCC13.
Timing is recorded below from the fresh result.

The claim concerns fixed zero-filled A/1 and B/1 IDs, successful fresh allocation,
no tombstones and no position maps. CBMC checks selected assertions at the stated
bounds, not all auxiliary safety or unwinding assertions. Native regression
groups are concrete examples and use merge-based cloning. Order equality here
is element-ID sequence equality, not complete payload/state equivalence.
General convergence, all-ID coverage, allocation-failure safety, production
reachability, serialization migration, whole-library safety and abstract-to-C
equivalence remain unproved.

Receipts are unsigned integrity records, not authenticated execution attestation
or complete command-policy verification. Operational toolchain dependencies
remain outside the frozen package. No publication, deployment, admission or
commercial-readiness conclusion follows.

## Open Questions

Broader claims and exclusions remain owned by
[PROPERTY.md](PROPERTY.md#open-questions-and-exclusions). Any changed frozen
runner, harness, input or contract requires a successor freeze and new evidence.

Fresh execution: 2026-09-12T16:11:30.739363+00:00 to 2026-09-12T16:11:36.065987+00:00.
