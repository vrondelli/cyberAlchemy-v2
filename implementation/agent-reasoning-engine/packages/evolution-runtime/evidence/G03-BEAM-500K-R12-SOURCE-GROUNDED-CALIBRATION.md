# G03 BEAM 500K IE r12 — source-grounded scorer output-cap calibration

Status: **terminal passed private exposed-development scorer calibration**,
2026-10-03 UTC. This protocol was fixed before r12 calls. R11 is terminal
failed at 70/71 valid calls because its
256-token output cap exhausted on reasoning. R12 is a distinct assessor
version, not a top-up, rescore, or amendment of r11.

The sole experimental change is `max_tokens: 512` in the r11 source-grounded
judge request and its matching tokenizer reserve and validity ceiling. Keep
the identical sealed 19 exposed BEAM 500K development question pairs, 38
blind answers, complete cited turns, prompt text, model `glm-5.3-flash`,
8,192-token window, low reasoning effort, thinking enabled, reverse-order
two-pass schedule, zero retries, stop-first-invalid rule, and private raw
receipts. All 38 prompts must first pass the same-account tokenizer with a
512-token output reserve; otherwise stop with zero judge calls. Then run at
most 76 judgments. No reserved BEAM 100K evaluator values may be accessed.

The unchanged scorer gate requires 76/76 valid judgments; all five r10/r11
false-credit treatment sentinels false in both passes; at least eight of
nine direct-answer treatment sentinels true twice; clear control sentinel
`6439bc12` true twice; and at most two of 38 repeated blind answers with
disagreements. Failure rejects r12. No in-place prompt/cap edit, top-up,
retry, or invalid-output interpretation is permitted.

Passing would only qualify a *development scorer candidate*. It would not
establish a native BEAM score, independent test result, or product superiority.
The exposed 19-pair sample was selected for r9 score discordance and cannot
estimate the 60-question development population. Source-label integrity,
particularly later updates outside cited turns, must be resolved before a
held-out confirmation protocol.

## Terminal result and claim boundary

The same-account VPS tokenizer admitted **38/38** untruncated prompts with
the 512-token reserve; prompt usage ranged 400–5,180 tokens. The frozen
two-pass run completed **76/76 valid** zero-retry judgments, with 81,662
known prompt tokens, 2,263 completion tokens (maximum 295 on one call),
and 172.405 seconds summed judge-call time. The raw run and audit are
privately retained under
`/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/`:
`R12-SOURCE-GROUNDED-JUDGE-RUN/` and
`R12-SOURCE-GROUNDED-AUDIT.json`. The terminal result SHA-256 is
`d89669236c20d6a72fbdd323f53d57019e0b2fa4e2f2da84799db664e9819503`;
the raw-attempt/identity audit SHA-256 is
`53b4373900a99eca562ef15d971bd0d446f1dca753e5970d493b615cde452b3b`.

The prospectively fixed **scorer calibration gate passed**: all five
false-credit treatment sentinels were rejected in both passes, all nine
direct supported treatment sentinels and the clear control sentinel were
accepted in both passes, and zero of 38 blind answers disagreed across
passes. This establishes a development scorer candidate only. It is not
an accuracy improvement by ARE, a native BEAM score, a population estimate,
or permission to claim superiority. The scorer may be used in a separately
frozen confirmation protocol only after source-label integrity and
independent-population requirements are specified.

## Open Questions

- What prospective source-label integrity and untouched-cohort scorer check
  are needed before opening reserved evaluator values?
- Will the calibrated scorer transfer outside these 19 selected, exposed
  development pairs without false credit or reference-currentness drift?
