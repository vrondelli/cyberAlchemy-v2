# G02 r11 full-repository lexical screen — exposed rejection

Status: **failed the predeclared candidate-generation gate** before any new
GLM call, VPS transfer, or actual ARE read. This is development on the same
12 already exposed r11 tasks, not an independent benchmark or superiority
result.

The [source-only ranker](../research/g02-product-r4/seal-g02-r11-fullrepo-lexical-exposed-r1.py)
(SHA-256 `f4ebd7bfc5b4fc28c0505858bfcfcea192c032500fa18d27962c78de1b918641`)
verified the 12 source checkout commits and clean tracked trees. It used only
the sealed issue/ARE-delivery packet, tracked source files no larger than
262,144 bytes, a fixed issue-term stoplist, BM25 file-text score, path-term
bonus, and exact-path bonus. It excluded files already delivered to ARE.
No gold, DSH output, native score or model response entered the ranker.
Its top-96-per-task `SOURCE-SEAL.json` was written before evaluation at
SHA-256 `3ead17963e3736cc0609b7e2eed986849297091aaeeb85c33723b5505311e832`.

The source seal fixed an advancement gate at top 24 per task: at least eight
of the 22 undelivered gold files, at least two hits outside the prior
relation union, and hits in at least two repositories. The separate
[evaluator-only audit](../research/g02-product-r4/audit-g02-r11-fullrepo-lexical-exposed-r1.py)
(script SHA-256 `e5d0166f505d0d4b9ecba5021e90f05cc9b3112ffc12d27c6c4e3f5a0f31a991`;
private audit SHA-256 `2894b8b0f15ce200a64932f5fa84d6fa0dc441215dd400b8ed80cc9b97879dfe`)
found:

| Per-task ranked depth | Undelivered gold found / 22 | Outside relation union | Repositories with hit |
| ---: | ---: | ---: | ---: |
| 12 | 4 | 0 | 3 |
| 24 | 6 | 1 | 3 |
| 48 | 9 | 1 | 3 |
| 96 | 9 | 1 | 3 |

Top 24 fails both gold-coverage thresholds. Increasing depth from 48 to 96
adds no gold on this exposed set; only one previously union-missing gold file
appears anywhere in the top 96. This does not justify another GLM chooser or
a fresh G02 cohort. The prior top-24 relation screen and the two-step GLM
prototype also failed on selection precision, so candidate coverage alone
would not establish a runnable improvement.

## Open Questions

- Can a trajectory-grounded or symbol-level source mechanism surface missing
  files outside both the relation union and lexical top-96 without consulting
  native gold or DSH selections at runtime?
- Which qualification test can measure **both** candidate coverage and
  three-read precision before a new independent G02 campaign?
- Should G01's already stronger matched-input source-neighbor development
  result receive the next live ARE integration slot while G02 acquisition is
  redesigned?
