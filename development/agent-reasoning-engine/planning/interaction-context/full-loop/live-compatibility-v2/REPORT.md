# ARE live learning canary: completed

**PASS: selected Codex 0.153.1 compatibility and 20/20 live literal checks.**
**No learning advantage demonstrated:** the full treatment tied the baseline.
The configured and server-confirmed model was gpt-5.6-sol in all four arms.

| Variant | Literal checks | Recorded supported lesson applications | Mean response time |
| --- | ---: | ---: | ---: |
| V0 | 5/5 | 0 | 5.82 s |
| V1 | 5/5 | 0 | 7.18 s |
| V2 | 5/5 | 3 | 5.60 s |
| V3 | 5/5 | 3 | 4.94 s |

V0 used the wrapper without retained interaction lessons. V1 used a generic
summary. V2 and V3 used the same explicit scoped preference in this scenario.
The measured checks cover correction, later use and a current instruction that
overrides the earlier preference. Applications bind dispatch and observed output.
These five-turn conversations validate live integration, not general semantic
quality or an inferred-learning advantage. There were no independent repetitions;
fixed-order latency samples are descriptive, not a controlled speed comparison.

## Budget and failures

The task used **23 model calls total**, zero optional provider calls, zero model
judge calls, and zero observed tool events. All threads were ephemeral and
read-only in owned scratch directories. Shell and multi-agent features were
disabled. No serving profile, canonical ontology, product approval, publication,
release, or deployment changed.

The first epoch completed three turns, then ARE preflight rejected an underspecified
fourth request with `selection.no-match` before forwarding it to Codex. A local
reproduction confirmed that causal failure. The fourth request was made
self-contained. Equal five-turn arms kept the corrected comparison inside the
original 24-call budget; the original six-turn-per-arm plan was not completed.

The next epoch made zero model calls and timed out at thread startup after 60s.
The final epoch restored the repository canary's established 240s startup bound,
added startup diagnostics, and retained the original 30-minute dispatch deadline.
No failed model delivery was retried. Both failed artifacts remain unchanged.

Provider-reported totals across the five completed threads, including the initial
three-turn attempt: 559,990 input tokens
(391,680 cached input tokens), 1,308
output tokens. Totals use the latest cumulative usage per thread. Monetary cost
was not estimated. See ASSESSMENT.json for exact aggregation and all metrics.

## Compatibility and construction frontier

The installed binary generated 416 experimental schemas. The selected schema
closure covers 17 request/notification methods with transitive referenced types.
The canary profile binds those exact schema observations and the existing wrapper
interface. Local schema validation rejects malformed context; harness tests prove
exact forwarded-byte preservation and correction-to-application capture.

The original 543-file full-loop candidate is unchanged. 560 unique source
and envelope files were rechecked against the run manifests after completion.
The previous 638-test evidence therefore remains bound to its original bytes;
this task additionally passed three initial and four revised harness tests, plus
schema/request validation. It did not claim a fresh 638-test rerun.

Product construction now has bounded live integration evidence. Operational
compatibility is resolved for this canary profile only. Product-owner review,
serving-profile rollout and activation remain separate decisions. The evidence
supports no engine upgrade: V3 gained zero checks over V0. The next useful
construction experiment is a discriminating, independently authored cohort for
cross-interaction inferred lessons, scope exclusions and explicit overrides.

## Evidence and reproduction

- `LIVE-RESULT-v4.json`: final 20-turn comparison, model identities, outputs,
  usage and lesson assessments.
- `LIVE-RESULT.json`: retained initial three-turn/preflight failure.
- `LIVE-RESULT-v3.json`: retained zero-call startup timeout.
- `RUN-MANIFEST*.json`: immutable source and execution envelopes.
- `ASSESSMENT.json`: comparison, no-gain decision and next hypothesis.
- `README.md`: local validation commands and experiment limits.

Local rechecks: `python3 validate.py` and
`node --test harness.test.mjs harness-v3.test.mjs` with Node v26.8.1.
Historical live executables refuse to overwrite their result files. A future live
experiment needs a fresh bounded envelope and output; do not rewrite this evidence.

Authority effect: none. Live checks do not grant product approval or activation.
