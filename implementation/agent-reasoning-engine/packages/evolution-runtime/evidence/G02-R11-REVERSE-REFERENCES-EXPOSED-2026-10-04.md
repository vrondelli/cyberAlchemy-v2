# G02 r11 reverse-reference acquisition screen — exposed development

Status: **rejected for fresh dispatch**. This test generated source-only
shortlists; it did not add live ARE reads or score a new matched campaign.

The [VPS sealer](../research/g02-product-r4/seal-g02-r11-reverse-references-exposed-r1.py)
(SHA-256 `b3479e1d862a5dac1b70dbcfe260a386b3220e9dd10baa516aee04edc52fbab2`)
used the 12 prior r11 task packets, exact pinned Git commits, and code files
ARE had already selected. It took up to 24 code-like declarations per task,
searched other tracked code files for reverse references, excluded already
delivered files and files over 256 KiB, and ranked candidates by distinct
symbols, issue mentions, and directory proximity. It sealed at most 20 files
per task before native labels were opened. No model call or DSH output was
used. The VPS source seal was checksum-matched to private WSL storage at
`/home/vlad_/are-benchmark-archive/g02-r11-reverse-references-exposed-r1-20261004/`;
`SOURCE-SEAL.json` SHA-256 is
`829fd2932a55312399a7dea8ecdc81f61f8b05b5c57dff28b9e512ac75a5cbf3`.

The independent [evaluator-only audit](../research/g02-product-r4/audit-g02-r11-reverse-references-exposed-r1.py)
(source SHA-256 `fef434cd6fc26fdc05b992fec77116950b6c47f7962fc7d0d4dc7a045640e04c`)
checked task/base identities, archived ARE selections, delivered paths and
unchanged native references. The 145 sealed top-20 candidate slots covered
only **2/22** missing gold files, both on Sympy; top-three covered **1/22**.
Neither hit was outside the earlier relation union. The predeclared gate
required at least seven top-20 hits, two outside the relation union, and
hits in two repositories; it failed on all three. Evaluator receipt SHA-256:
`48d3bcdb86fd79842f2d9f4890088dcd4a4d2310e2f9093fac5bddd775f0cd99`.

This reverse-reference rule adds no demonstrated candidate-generation
coverage over the earlier union and has no practical three-read policy. Do
not send a model chooser or fresh G02 cohort using this shortlist. No native
File-F1/Span-F1, all-in cost, independent quality, or superiority result
follows from this screen.

## Open Questions

- Can a different source signal find the missing files outside the existing
  lexical, directory, import/include, symbol-definition and reverse-reference
  pools without reading a broad false-positive set?
- Which independent issue-localization population can support a fresh matched
  validation after a source-grounded acquisition mechanism passes exposed
  development?
