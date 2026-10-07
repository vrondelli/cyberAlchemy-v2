# G02 r11 exact code-element gate — exposed rejection

Status, 2026-10-03: **rejected before any GLM call or actual ARE read**.

The [source-only seal](../research/g02-product-r4/seal-g02-r11-code-element-gate-exposed-r1.py)
(script SHA-256 `a6a3ee3dd2847bb6ee40bff682b672eb6eae5c5bcd1d3fe3acbd949de7988afa`)
used the frozen 12-task [relation union](G02-R11-RELATION-UNION-EXPOSED-2026-10-03.md)
and pinned base source. It verified task, issue digest, and base commit;
decoded an issue only when its raw value was a valid JSON string; extracted
explicit code-shaped issue identifiers and qualified phrases; then required
an exact candidate declaration, path-token, or qualified-phrase match.
It ranked by fixed evidence weights, direct import/include relation, size,
and path, and proposed at most three read-cap-eligible files per task.
Native labels, DSH output, scores, and prior audits were not loaded. The
private write-once `SOURCE-SEAL.json` is SHA-256
`6c0a410127571c16cf991f14cab2ba1037cf02a14b8d9d4c7db97a8c7e98219d`
under `/home/vlad_/are-benchmark-archive/g02-r11-code-element-gate-exposed-r1-20261003/`.

Two Ansible issue statements were confirmed to contain a second JSON-string
encoding with literal newline escapes. Normalizing them fixes title/line
interpretation for this screen, but is not itself a retrieval gain. The
source gate proposed 24 files across eight tasks and abstained on four.

Only after the source seal did the separate
[evaluator-only audit](../research/g02-product-r4/audit-g02-r11-code-element-gate-exposed-r1.py)
(script SHA-256 `4dd3bd6f9207e1894050033061d8f39b12d905e582001fd66634b2f1c71525a9`)
open pinned native labels and reproduce archived ARE file-score counts.
It found **one new gold hit in 24 proposals**, **23 false positives**, and
precision **0.0417**. The additive set-based mean File-F1 counterfactual
fell **0.535975 → 0.393056** over all 12 exposed tasks: one improved,
seven regressed, four tied. Ansible, Django, and Sympy repository means all
regressed. Neither JSON-encoded Ansible issue produced a gold proposal.
The fixed development gate—at least six hits, precision at least 0.5,
mean File-F1 gain at least 0.03, and no negative repository mean—failed.
The counts-only private `EVALUATOR-AUDIT.json` is SHA-256
`6d8a8eea1276198f6f9cfc15e82b527faf2c1e73734bde38f5cf06da72b1be13`.

Exact issue-to-declaration/path matching is not selective enough over this
relation union. This version must not be dispatched on a fresh cohort or
presented as an ARE improvement. The result is exposed, label-audited
development only: no added read was delivered, no Span-F1 or all-in cost was
measured, and no superiority claim follows. Adjusting its thresholds after
this audit would be post-hoc and would need a separate development set.

## Open Questions

- Can a different, source-grounded localization mechanism reduce the broad
  pool before selection, instead of merely ranking union members?
- Which untouched population can test a separately qualified successor
  without reusing these opened r11 labels?
