# G01 BugSwarm guarded confirmation r45 — untouched supply protocol

Status: frozen protocol for a private, score-blind supply census. This stage is
not a benchmark result and makes no model call.

## Objective

Determine whether the still-untouched tail of the frozen BugSwarm r32 queue can
supply a new 24-repository confirmation cohort for the unchanged r44 guarded
entity-transfer treatment.

The treatment, guard, prompts, ranking rule, and evaluation rule are not changed
by this census. The r44 mechanism result remains development evidence only.

## Frozen inputs

- r32 queue SHA-256:
  `42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e`
- r33 admission result SHA-256:
  `bbdb33fce8bc165f16a4dc255510fd0c4f588f8deebbd19adffedba1eb356002`
- r34 final-population result SHA-256:
  `fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c`
- r44 guarded-treatment result SHA-256:
  `24c16ff119cd4be96b702b2848cf6382eaf8c8aa143d8ef7891f174006ae78a6`

R33 consumed Python queue indices 1–7 and all three Java candidates. R34 then
consumed Python indices 8–10. Therefore the complete untouched population is
the 29 Python entries at queue indices 11–39, in their existing source order.
There is no untouched Java supply in this queue.

## Score-blind census

The runner must verify every input hash and the predecessor shapes before any
network request. It then attempts each of the 29 remaining entries exactly once
and in queue order using the already-frozen r33 admission method:

1. authenticate the failed-commit source archive by HTTPS HEAD;
2. authenticate the BugSwarm artifact page and repository/job identity;
3. authenticate the raw-log header and require a declared size from 1 byte
   through 8 MiB;
4. make one standard-library HTTPS GET for the exact raw-log length;
5. require HTTP 200, the exact URL, exact declared and received lengths, and
   strict UTF-8.

There are no automatic retries, replacements, reorderings, score reads, label
reads, passing-source reads, patch reads, ranking calls, or model calls. Partial
bodies and all request receipts are retained. Repository identity is unique.

## Decision boundary

- If at least 24 candidates pass, preserve the first 24 passers in frozen queue
  order as the only eligible input to a separately frozen source-projection and
  target-existence census.
- If fewer than 24 pass, record a terminal supply deficit. Do not silently
  reduce the denominator or import easier cases. A different dataset or a
  separately justified campaign would require a new protocol.

Even 24 source/log passers do not constitute a cohort: all 24 must later pass
exact failed-source projection and score-blind target-existence screening before
the unchanged r44 treatment may run.

## Claim ceiling

This stage may claim only authenticated, score-blind source/log availability.
It cannot claim fault-localization accuracy, efficiency, generalization, or
superiority.

## Open Questions

- How many of the 29 untouched repositories pass exact source/log admission?
- If 24 pass, how many retain at least one gold-changed language path in the
  exact failed-source projection?
- If current BugSwarm supply is insufficient, which independent public dataset
  can support the same frozen confirmation contract without changing the
  treatment after outcomes are observed?
