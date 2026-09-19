# N23 Runtime Handoff

## Current State

N22 exact A is immutably closed: every directed same-kind canonical `belongs-to`
cycle of length at least two over at least two distinct Entity IDs is rejected
uniformly, with source repair required but no replacement parent or membership.
N23 is formed and remains unselected.

## Owner Question

For a directed canonical `belongs-to` closed path of length at least two containing
at least two distinct Entity IDs and using at least two admitted D30 kinds, should
the independent direct facts be allowed, or should the combined path be rejected as
one global `belongs-to` cycle?

- A: `BMC-REL-NONNUMERIC-23-A-ALLOW-MIXED-KIND-CLOSED-PATHS`
- B: `BMC-REL-NONNUMERIC-23-B-REJECT-MIXED-KIND-CLOSED-PATHS-GLOBALLY`
- C: `BMC-REL-NONNUMERIC-23-C-DEFER`
- D: `BMC-REL-NONNUMERIC-23-D-STOP`
- Standing non-answer: Explain / more context.

Recommendation: A because D30 makes kinds non-overlapping and permits distinct
parents across them. B remains fully admissible because D30 withholds cycle policy.

## Exact Bindings

Manifest SHA `1a0f916679aac4f656e6f2207b60963be06253a190ef4f2a0c518dd72426baae`,
denominator SHA `c5bdfc09bef6d07ea5d68b708934969f3c5b27f3153e2f516fec563c2f8ddef0`,
selection SHA `b86fd528b7b5c21d3f11381349c23bb8561fde61f09ee781824548cb433b8321`,
request SHA `96482b465cf0e8e696a89a71c8dc29600ad3fc3983f53e32a4020b9eba2d70cc`,
receipt SHA `f20edaa712a6dbb466aea7145c4fa2494210f2b71cd9aad2e0e8b3030db41cdb`,
and requestDigest `6bb6ba6efaccfe861c522e8d00d11473e462932cbfc7f63d5dabde0f0ca024b2`
bind the deterministic run. The two selector passes both equal
`8666755d69b9d3f9492e3e98fb00b3c9631fcd2cdce58d005446c6c53d0bb771`.

## Stop Boundary

Do not infer N23 from N22 A or N07 analogy, reopen N20/N22, derive reachability,
collapse kinds, decide closure/completeness/partial-view, duplicates, exceptions,
cross-feature, representation/runtime/numeric policy, mutate canonical or packet
bytes, plan implementation, promote, or publish. Decision effect: `none`.
