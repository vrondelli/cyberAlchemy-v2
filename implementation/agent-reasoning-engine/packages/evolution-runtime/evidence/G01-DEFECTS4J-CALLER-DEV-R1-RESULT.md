# G01 caller-informed reader development r1 — 2026-10-06

The exposed development advancement gate **passed**, with 32/32 valid responses.
This is not fresh confirmation or superiority. The earlier r3 gate remains failed.

## Results

| Comparator | MRR@8 | Hit@3 |
|---|---:|---:|
| GLM caller-informed reader | 0.83854 | 30/32 |
| Original production fusion | 0.60707 | 22/32 |
| Caller production fusion | 0.60603 | 24/32 |
| Caller unfiltered-RepoMap fusion | 0.56957 | 24/32 |
| Caller production ARE | 0.52686 | 18/32 |
| Caller production RepoMap | 0.41354 | 17/32 |
| Caller unfiltered RepoMap | 0.25260 | 13/32 |

GLM exceeded every comparator by >=.10 MRR. Project-paired exact two-sided
sign-flip p versus caller production fusion was 0.001953125; versus caller
unfiltered fusion, 0.0009765625. Every preregistered RepoMap/fusion p criterion
passed. Hit@3 advantage was exactly six over the strongest comparator; absolute
Hit@3 exceeded 24/32. Gold mapping was complete and all label digests matched r3.
GLM mean per-case gold recall@8 was 0.91071. All original comparators are retained
in the private score receipt; the table shows the principal stronger baselines.

Compared descriptively with earlier r3 GLM: Hit@3 27→30 and MRR .796875→.838542.
This is not a controlled attribution of all reader improvement to caller text:
candidate width and evidence excerpts also changed. The earlier source-reach
matched-width controls isolate reach only, not answer quality.

## Cost and checks

32 tokenizer calls followed by 32 generation calls, no retries. Every prompt
plus the 512-token output cap fit 8192. Provider-reported generation usage was
114,578 prompt and 1,299 completion tokens. Sum of generation request times was
77,950 ms; tokenizer times 11,899 ms. Local comparator reconstruction took about
33.7 seconds; these are partial measured components, not an all-in cost claim.
Prompt usage increased about 36% from r3's 84,186 tokens.

Verified equal source-file counts and raw source digests for all 32 original and
caller-query RepoMap corpora. Two JS/Python filename-filter parity tests, four
decoder/caller-window tests and three scoring tests passed. Python compilation
and Node syntax checks passed.

The historical Python production filter escaped the filename dot twice. Five
top-20 entries across three r3 cases differed from the intended JS filename
policy. These can be real production classes, not necessarily test files. New
baselines include both corrected-filter and unfiltered rankings. No historical
receipt was rewritten and the r3 failed gate was not retrospectively repaired.

## Evidence

- Frozen [development protocol](G01-DEFECTS4J-CALLER-DEV-R1-PROTOCOL.md), SHA-256
  `6cfa12c945fa0506b964ee65b9f650dca8384e9e689769fc86ce37557586ffed`.
- [Packets](/home/vlad_/are-benchmark-archive/defects4j-caller-dev-r1/PACKETS.jsonl),
  `e1636fad114813142c1b2b2a281db29a0de34433457725cf0a4b95e709b46f59`.
- [Generation receipt](/home/vlad_/are-benchmark-archive/defects4j-caller-dev-r1/GENERATION-RESULT.json),
  `0d31facfc1cabef871ce2ae84129005185a11442e7a011cbb7752e29a653b9a2`.
- [Prediction seal](/home/vlad_/are-benchmark-archive/defects4j-caller-dev-r1/PREDICTION-SEAL.json),
  `77529ae3f549c51544aa71b5799fe3a231708f2ef86f2ee0247629c2d44d3845`.
- [Full score](/home/vlad_/are-benchmark-archive/defects4j-caller-dev-r1/SCORE.json),
  `081c942db265d997e6364b0321c0ebd7a5e3a8c391b35148a2b38c3ecb0c115d`.
- Implementation: [builder](../research/arb-trace2code-r1/build-defects4j-caller-dev-r1.py),
  [caller comparator](../research/arb-trace2code-r1/seal-defects4j-caller-repomap-dev-r1.py),
  [runner](../research/arb-trace2code-r1/run-defects4j-caller-dev-vps-r1.mjs),
  [scorer](../research/arb-trace2code-r1/score-defects4j-caller-dev-r1.py).

## Open Questions

Next: freeze the same caller policy for a disjoint, source-ordered fresh cohort,
with labels closed until all predictions are sealed. Does quality transfer?
Filename-filter false positives, public model-training exposure, modified-file
proxy validity, live ARE delivery and total cost remain limitations. G02/G03
evidence does not inherit this development pass; no product-wide claim follows.
