# G01 BugSwarm cohort B r8 — bounded GLM ranking with pairwise guard

Status: fixed before r8 packet construction, provider calls, or r8 scoring.
The separately sealed r7 source-only acquisition reached 22/24 cases with
at most 80 candidates and zero reach losses. Cohort B is evaluator-exposed
development, not independent confirmation. R5/r6 failed screens remain
terminal. The reserved confirmation partition stays unopened.

## Source-only packet

Bind the exact B-r2 failed-commit code roots, queries, graph-r2 complete
rankings, test-edge-r3 rankings, and r7 candidate lists by SHA-256. For each
case retain r7 order: r2/r3 union first, then stratified additions. Include
at most 80 candidates. For each candidate include ID, path, r2/r3 rank,
origin stratum, and one deterministic query-overlap source excerpt of at
most 120 characters with line number, using the unchanged r4 excerpt rule.
The prompt is at most 24,000 UTF-8 bytes. Do not include gold, patches,
passing-commit code, evaluator scores, or raw full logs. Seal all packets
before provider access.

## Provider and selector

Run only on the VPS using the pinned HTTPS `glm-5.3-flash` transport. Admit
each listwise packet with the same-account tokenizer: prompt tokens plus
512 output reserve must be at most 8,192. Make one listwise generation per
case, 512 output tokens, low reasoning effort, no automatic retry. Parse
the entire response as exactly `{"candidate_ids":[...]}` with at most
eight distinct values. Accept integer IDs, canonical nonzero decimal-string
IDs, or exact listed candidate paths. No fuzzy matching. Invalid outputs
count invalid and fall back to graph-r2 for the all-case primary score.

For a valid listwise response, the complete listwise ranking is selected
paths in returned order followed by all unselected graph-r2 paths in r2
order. If its first path differs from graph-r2's first path, make two
pairwise calls with swapped A/B order. Each call sees the same failure
query and only those two candidate paths, r2/r3 ranks, origin, and sealed
source excerpts. Require exactly `{"choice":"A"}` or
`{"choice":"B"}` with HTTP 200 and finish reason `stop`. Promote the
listwise alternative above r2's first path only if **both** swapped calls
validly choose it. Otherwise retain r2's first path, then append the
listwise ranking without duplicates. If the first paths already agree,
make no pairwise calls. Pairwise invalidity is reported and falls back to
the r2-first guarded ranking; no retry or rule repair.

At most 24 listwise plus 48 pairwise calls, each at most 512 output tokens;
total known prompt tokens at most 220,000. Stop dispatch on transport
failure, preserve every attempt, and report actual calls, usage and summed
model-call time. Seal raw responses and complete predictions before
evaluator access. A partial run fails the 24/24 validity gate.

## Development advancement gate

Score all 24 cases, including graph-r2 fallback for invalid listwise
responses. Report MRR@8, Hit@3, top-30 reach, paired wins/ties/losses,
20,000-draw repository-unit bootstrap 95% intervals versus ARE and graph-r2,
and raw-listwise versus guarded differences with rank-1 demotions and
rescues. Also report all-in provider tokens and summed generation time.
Advancement requires 24/24 valid listwise responses, no transport failure,
at least 22/24 candidate reach, guarded MRR@8 at least graph-r2's B value
0.41667, at least 16/24 guarded wins versus ARE, a positive paired lower
bound versus ARE, and no unresolved label/source integrity defect. A failed
component prevents promotion; do not retune on these scores and call this
population confirmation.

Even a development pass is not product superiority. A claim requires an
untouched, provenance-admitted confirmation campaign and end-to-end
comparator parity. Original BugSwarm logs/diffs remain HTTP-provisional.

## Open Questions

- Can the 80-candidate packets fit the actual same-account 8K tokenizer
  bound and preserve the r7 reach gain?
- Will the pairwise guard avoid correct graph-r2 rank-1 demotions while
  retaining new wins after its additional cost?
- Can the original logs and diffs be independently authenticated?
