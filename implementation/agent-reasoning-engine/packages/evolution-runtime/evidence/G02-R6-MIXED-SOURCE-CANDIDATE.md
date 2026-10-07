# G02 r6 mixed-source candidate and eligibility stop, 2026-10-01

Status: private, evaluator-exposed development candidate. **No r6 campaign was
frozen or dispatched; no GLM request, native score, or superiority estimate was
made.** The candidate failed its prospective 24/24 native-eligibility condition
because one selected Multi task has zero files in the native gold loader. Its
24 task IDs must not be reused as an untouched successor population.

## Fixed draw and source qualification

The [source-only draw](../research/g02-product-r4/derive-g02-r6-mixed-source-candidate-r1.py)
selected six tasks each from Ansible and Open Library (`Pro`), Django
(`Verified`), and Svelte (`Multi`), in round-robin rank order. It excluded
task-bearing G01/G02 manifests, all r4/r5 IDs, and prior smoke IDs. Ranking
used SHA-256 of a fixed seed, partition, repository, and instance ID. The
candidate SHA-256 is
`6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3`.
This changes the old Pro-only G02 population; any later result would need a
mixed-source, four-repository claim scope.

The first [cache audit](../research/g02-product-r4/audit-g02-r6-cache-availability-r1.py)
found matching origins but only 12/24 selected commits in the first matching
caches (receipt SHA-256
`edcb8a3f439b273e8558e571113eb017e07ccffc76ab0adbb1825ee94697323d`).
Filtered fetching brought in all six Django and six Svelte commits; the
subsequent exact-commit/origin check passed 24/24 (SHA-256
`ac1b65ebf3d4368801bd5972c59592f254a66f8fc1f30405103ce291c307715e`).
Those parent caches were not sufficient for the offline container clone:
promised historical objects were missing. A first shallow-cache script passed
two tasks then stopped at ordinal 7; a later Pro-cache script stopped at
ordinal 1 because a working repository was treated as bare. Both failures
remain visible in the versioned script lineage.

The corrected [mixed-cache hydration](../research/g02-product-r4/hydrate-g02-r6-task-caches-r2.py)
produced **12/12** exact-commit, single-tip shallow caches with offline
clone-and-checkout tests inside the 1 GiB benchmark image, receipt SHA-256
`c86f1e1acd337766719e26a36b8dd2d5a3152dcd8eae3f40a59fb1df16ad9f73`.
The corrected [Pro-cache hydration](../research/g02-product-r4/hydrate-g02-r6-pro-task-caches-r2.py)
did the same for **12/12** Pro tasks, receipt SHA-256
`4595094905baa565b8605196d2e882b604330dc628f1d14864eb5f39e0ad130c`.
Each offline smoke used `--network none`, a 1 GiB memory limit, and the same
container image as the paired runner. This establishes source-cache
availability, not full ARE-arm reliability.

The adapter [r4 source snapshot](../research/g02-product-r4/build-g02-r6-mixed-tools-r4.py)
binds all four repositories to those per-task caches. Its manifest SHA-256 is
`7e7186b7273ece0ebf66b86718d17c4c6800dee7f2d3fb2bab4bd40ab9c32e3b`.
The versioned differences admit `Verified`/`Multi` row identities, their task
ID prefixes, the `pr6-mixed-` projector root, and exact cache leaves; the
64 MiB ARE index, deletion-only policy, 16K-output DSH comparator, scorer,
and model protocol are not changed by this adapter. No-model preparation
succeeded for one Django and one Svelte task under the final cache binding.

An initial [24-task source-index preflight](../research/g02-product-r4/audit-g02-r6-source-index-r1.py)
stopped at task 1 because its selected Pro commit was not cloneable from a
shared partial cache; failed receipt SHA-256
`346af195df9bcd805ed667ad6614b03966c4fab181eaf1d8b065497e677a1ced`.
After task-specific caches, the separately versioned
[r2 preflight](../research/g02-product-r4/audit-g02-r6-source-index-r2.py)
passed **24/24 offline source checkouts and fixed 64 MiB index builds**,
receipt SHA-256
`a14e2e67774b72153192bda6196137321c2092aaa6b90a74edf0c2cc0b8a286d`.
The highest measured Node index-process RSS was about **311 MB**. This
measurement is not a whole-container memory or all-in time result.

## Evaluator-only eligibility and stop

The first [native eligibility audit](../research/g02-product-r4/audit-g02-r6-native-eligibility-r1.py)
stopped at ordinal 4 with empty native gold, before writing a receipt. The
separately versioned [full census](../research/g02-product-r4/audit-g02-r6-native-eligibility-r2.py)
retained the fixed 24 IDs and exported aggregate counts only, not gold paths.
Its receipt SHA-256 is
`b8680ee8e1b4d5f6cdb9c1b17aff797c01565db57ad73245ba4ebc570c0cc0ea`:
**one empty-gold task**, **112** native reference-file occurrences passing the
pre-budget text rules, and **two** reference-file occurrences untracked in
their pinned bases. All 24 IDs are now evaluator-exposed. The original
24/24-validity design cannot be frozen by silently replacing ordinal 4; r6
is closed as an ineligible candidate. No policy tuning, task replacement,
model call, or native scoring followed the opened labels.

The private WSL cold-copy location is
`/home/vlad_/are-benchmark-archive/g02-r6-mixed-source-candidate-20261001/`.
The candidate receipts, complete G02-owned task caches, and final r4 adapter
snapshot passed remote-to-WSL `rsync --checksum` comparison with no differences.
The four no-model preparation roots were also cold-copied and checksum-verified.
After checking that no r6 benchmark container was active, those exact five VPS
scratch roots (one cache root, four preparation roots) were removed, freeing
approximately 440 MiB of tmpfs; they are recoverable from the cold copy. No
credential or provider payload is in the source-only cache archive.

## Next population rule

A separately named successor must exclude **all 24 r6 IDs** and all prior
campaign/smoke IDs. Define its repository/partition quotas and deterministic
order before evaluator access. Native-gold nonemptiness is a scorable-task
eligibility condition, not an outcome measure; if screening is used, declare
it prospectively, keep the evaluator outputs out of the agent selector, and
report the entire screened denominator and exclusion counts. Do not tune the
fixed index/policy after seeing candidate reference reachability and then
call the same IDs a fresh holdout. A later matched campaign still needs
complete validity, sealed predictions, native scoring, token/time intervals,
independent audit, and Vlad/Dave page review.

## Open Questions

- Which untouched, natively scorable four-repository population should replace
  the exhausted Open Library quota without hiding the changed claim scope?
- Does the 64 MiB index and whole ARE arm remain within the 1 GiB container
  limit on the successor, and can DSH complete all matched pairs at 16K output?
- Can the successor beat DSH on both native quality metrics and known-token
  and all-in arm-time intervals, rather than only on exposed diagnostics?
