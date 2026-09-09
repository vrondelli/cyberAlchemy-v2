# Retention v2 experiment

Authority effect: none. Construction: [candidate extension](../CONSTRUCTION.json).
User authorization: “pland and do it”, continuing the measured v1 failure.

1. Add `recent-observations-v2`: preserve the newest complete exchange and mask
   older result bodies. If the full request does not fit, measure only the empty
   history fallback. At most two measurements per turn; no larger call allowance.
2. Prove retained tool pairing, immutable archives, source/policy-bound resume,
   and the worst-case measurement ceiling in deterministic tests.
3. Freeze sources. Compare clearing and v2 at soft thresholds 5,000 and 8,000,
   with the same 16,384 hard window, 2,048 output reserve, 256 tokenizer margin,
   task, and per-arm caps. One run per arm. Prewrite four-arm bounds: at most
   48 model calls, 96 tokenizer calls, 2,400,000 ms total.
4. Retain failures, compare completion and total overhead, and leave clearing
   as default until broader evidence supports a change.

Runnable frontier: implementation and offline tests, followed by the bounded
live comparison. Parent owns canary/harness/evidence; retention agent owns the
v2 projection and regression tests; reviewer owns read-only review. The parent
joins passing tests and frozen sources before live dispatch.

The run operator owns endpoint/credential availability and finite live limits.
Unknown transport, billing, authentication, or source-drift outcomes stop
subsequent comparisons. The runtime owner owns deferred activation/deployment;
they do not block this prototype evaluation.

Both the retention shape and search budget change in v2. This experiment tests
the combined candidate; it cannot isolate those two changes. Larger *soft*
thresholds provide more active history room; the hard provider window is held
fixed, so this is not a provider-window-size study. No held-out evaluation or
Kite backend is involved.

## Completed result

The candidate passed 209 combined tests and completed all four live arms.
V2 avoided tokenizer exhaustion at 5,000 but did not finish within 12 model
calls. At 8,000, v2 passed all seven queue tests and recycling checks in five
model calls and seven tokenizer calls. The default is unchanged. See the
[full result and limitations](retention-v2-sweep-2026-09-07/README.md).

## Open Questions

- Does v2 avoid tokenizer exhaustion at 5,000 while completing the task?
- At 8,000, does retaining the latest result reduce repeated reads?
- Does a successful patch also satisfy the forced recycling checks?
- Are observed differences repeatable on other coding tasks and run orders?
- Can provider-internal compaction be observed independently of local admission?
