# Bounded replay milestone completion

Date: 2026-09-12. Status: independently reproduced within explicit bounds.
Authority effect: none.

## Completion decision

The CRABS replay-and-review DAG completion node K is satisfied for the declared
fixed fixture. The primary attempt and a separate fresh-context technical
reviewer both reproduced:

- original native order divergence and the named CBMC counterexample;
- repaired successful merges, retained members and equal element-ID order;
- no counterexample for the repaired named properties at the declared bounds;
- all five selected native repair regression groups.

Both successful executions are bound to freeze
`bd030b20f39672247803099d5ace830338a29076d003a414e48c748b21834f6b`.
The author's [attempt 003](evidence/author-attempt-003/result.json) and the
reviewer's [attempt 002](evidence/reviewer-attempt-002/result.json) independently
pass the package verifier. The reviewer's executed runner and input freeze match
the current package byte for byte.

The first independent review found a process-timeout bypass after output-stream
EOF. The primary also found that the verifier accepted a different original
assertion failure. Both findings remain preserved in
[reviewer attempt 001](evidence/reviewer-attempt-001/REVIEW.md). The successor
supervises process lifetime after pipe EOF and requires the exact assertion
vector. The reviewer independently confirmed timeout termination and rejection
of six incorrect assertion vectors. The package test rejects eight evidence
faults and exercises the timeout regression.

## Property, defect and repair

For fixed singleton IDs A/1 and B/1, two successful opposite-direction merges
must retain both members and produce the same ordered element-ID sequence. The
original implementation appends missing source elements at the destination
tail, producing `[A,B]` versus `[B,A]`. The repair carries placement metadata
and deterministically rematerializes order, producing `[B,A]` in both
directions for this fixture. Applying the recovered patch to the exported
original produces every changed repaired file exactly.

## Cost and environment

The final author execution consumed about 5.44 aggregate process seconds. The
reviewer execution ran from 16:11:30.739363 to 16:11:36.065987 UTC, about 5.33
wall-clock seconds. Each process was limited to 180 seconds, 4 MiB combined
output and 4 GiB address space. Both used pinned CBMC 6.11.0 and repository GCC
15.2.0 on the same WSL2 host. Historical GCC13 was unavailable and was not
reproduced. No paid provider cost was incurred.

## Claim boundary and open questions

This closes a reproducible bounded defect-and-repair assessment. It does not
establish general CRDT convergence, all identifiers or payloads, allocation
failure behavior, tombstones or position maps, production reachability,
serialization migration, whole-library safety, abstract-to-C equivalence, or
independent-host portability. Selected CBMC assertions were checked at explicit
bounds; not every auxiliary safety or unwinding property was selected.

The reviewer is a separate technical subagent with fresh conversation context
on the same host and model lineage. This is not external accreditation,
certification, product admission, release approval, publication or deployment.
The 48-case expansion, second implementation and customer pilot remain deferred
objectives requiring separately selected scope and authority.

