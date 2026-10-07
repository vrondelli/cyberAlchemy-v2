# G01 BugSwarm Java evidence r7 — exposed development result

Status, 2026-10-04: **12/12 new Java GLM responses valid, 12/12 r6 Python
responses carried unchanged, but the frozen 24-case advancement gate
failed.** This is repeated development on the same exposed BugSwarm cohort,
not fresh confirmation, ContextBench, official RepoMap, live ARE, or product
superiority. Original HTTP log/diff payloads remain transport-provisional.

The [r7 protocol](G01-BUGSWARM-JAVA-EVIDENCE-R7-EXPOSED-PROTOCOL.md) was
fixed before provider dispatch at SHA-256
`f409222a2c1629cc5428f40f2513b33db5ee81f9027e2bc6c5f79281b12ab18f`.
The [source-only evidence screen](../research/arb-trace2code-r1/screen-bugswarm-java-evidence-exposed-r7.py)
extracted bounded failure-bearing lines from all twelve full Java logs and
replaced r6's leading-boilerplate excerpts with non-comment,
non-package/import source lines. In r6, 319/350 Java excerpts began with
boilerplate; in this source-only screen, **0/350** did, and **294/350**
contained at least one query term. These are presentation diagnostics, not
gold accuracy. Private source-evidence and seal SHA-256 values are
`5c99d2fd52c04d714b10f347d5b5bfcfdc8b72dfdb34257d5fa13f4d1adcddc3`
and `b72d05cca6bfac47f434cfb00420b06c54dce53b345b98ac3c908642e6e691f7`.

The [packet builder](../research/arb-trace2code-r1/build-bugswarm-java-evidence-packets-exposed-r7.py)
kept every candidate ID/path/order identical to r6, left all twelve Python
prompts byte-identical, and changed all twelve Java prompts. It passed the
local 30-candidate/18,000-byte checks; maximum prompt size was 15,212 bytes.
Private packet/seal SHA-256 values are
`23e85916c8d4c214babd93239049882b2fed9543f8eef788db2551552953f37f`
and `05672eab88f5116bf0e2ad85bb4e30830c6dcfef8354393292e5bbb0bfdace06`.

The [same-account tokenizer runner](../research/arb-trace2code-r1/tokenize-bugswarm-java-evidence-exposed-r7.mjs)
admitted all twelve Java prompts under the 8K window, with a maximum of
2,864 prompt tokens plus the fixed 512-token output reserve. New Java
prompts consumed **29,422** tokens; together with the verified **34,198**
carried Python prompt tokens, the total was **63,620**, below the frozen
84,615 cap. Private tokenizer freeze/result SHA-256 values are
`835df9df7cba8088626746ad4b3951291b921a6f528df053da7b313312caac6a`
and `732ac41b06e881f3abaa9e79f0d3453d1e9fb87b557b98cb290e2f6453ce1200`.
All fourteen new tokenizer files have checksum-identical VPS/WSL copies.

The [generation runner](../research/arb-trace2code-r1/run-bugswarm-java-evidence-rerank-exposed-r7.mjs)
made twelve one-shot, low-reasoning GLM-5.3-flash calls, zero retries, and
received twelve valid JSON selections. Private generation freeze/result
SHA-256 values are
`47bc2c83a29cb2c9046359e61a536bbeb2dc76edc64b739c16fc6c83e92e3afa`
and `6008d42c04fe6436e004c55e692cdff57708da97cbad8d081d4e0a36740c023e`.
All fourteen new generation files have checksum-identical VPS/WSL copies.
The [source-only prediction sealer](../research/arb-trace2code-r1/seal-bugswarm-java-evidence-predictions-exposed-r7.mjs)
verified twelve carried Python response hashes, twelve new Java request,
token, response and path bindings, and the 24-case token total before any
evaluator read. Prediction-seal SHA-256:
`f0fd62598591618af6e6a2bcf63005f10cb5096db2c6934e5544a5107a037798`.

The separate [evaluator-only scorer](../research/arb-trace2code-r1/evaluate-bugswarm-java-evidence-rerank-exposed-r7.py)
recomputed the original baselines, verified Python score carryover, and
scored the sealed Java selections. Its private receipt SHA-256 is
`0d01433b7a861a61d22a2f2713ffc96d4aba857b93853290a419b174fa2d4911`.
An independent `jq` arithmetic check reproduced the 24-case macro MRR and
14 ARE wins.

| Same 24 exposed cases | MRR@8 |
| --- | ---: |
| ARE standalone file ranker | 0.19831 |
| Original r1 GLM | 0.24792 |
| Hybrid r6 GLM | 0.36811 |
| Java-evidence r7 composite GLM | **0.38859** |

R7-minus-ARE MRR@8 was **+0.19028**, paired repository-unit bootstrap 95%
interval **[+0.09335, +0.29861]**, with **14 wins, 8 ties, 2 losses**.
R7-minus-original-r1 GLM was **+0.14067**, interval
**[+0.02996, +0.25734]**. R7-minus-r6 was **+0.02049**, interval
**[-0.07153, +0.12118]**, with 2 wins, 20 ties and 2 losses. Python
scores were carried exactly; Java outcomes still involve fresh stochastic
calls on an exposed cohort, so the r7-r6 difference is descriptive.

The frozen gate failed on **14/24 ARE wins** versus the required 16 and
**1/3** positive newly reachable Java cases versus the required two.
Java ordinal 17 moved from zero to reciprocal rank 1/3; ordinals 16 and 20
remained zero. Other Java changes included two improved and two degraded
cases versus r6. New Java generation used **29,422 prompt + 639 completion
tokens** and **27.638 seconds summed call time**; the composite 24-case
known usage was 63,620 prompt + 1,057 completion tokens. Neither timing
figure is all-in episode cost or campaign wall-clock.

This result supports failure-summary/excerpt presentation as a candidate
mechanism, but does not qualify it or justify a superiority claim. Repeated
tuning on these 24 cases risks overfitting. The next frontier should test a
source-grounded rule on a distinct development cohort and retain a separate
frozen, label-screened confirmation cohort with validated source transport.

## Open Questions

- Can an independently selected Java development cohort replicate the
  presentation signal without gold-informed iteration on these 24 cases?
- Which source-grounded acquisition/presentation rule also addresses cases
  where the gold file is absent, without bloating packet cost?
- Which independent BugSwarm cohort supports a complete matched-denominator
  superiority test with authenticated or reproducible logs/diffs?
