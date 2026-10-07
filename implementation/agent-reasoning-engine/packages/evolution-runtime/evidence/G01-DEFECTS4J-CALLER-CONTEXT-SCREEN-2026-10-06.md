# G01 exact-buggy caller-context retrieval screen

Status: exposed development source-reach gain beyond matched-width controls;
no model accuracy, confirmation, cost-superiority or product-superiority claim.
Predecessor: [r3 fresh-case result](G01-DEFECTS4J-32-R3-RESULT.md).

R3 reached 28/32 candidate unions and achieved 27/32 GLM Hit@3. Its composite
gate failed because its five-hit advantage over stronger fusion did not meet
the frozen six-hit requirement. This screen preserves that score unchanged.
All 32 r3 cases are now exposed; no fresh-case labels were opened here.

## Implemented mechanism

For each case, parse retained Java trace frames, map enclosing-class package
suffixes to tracked Java paths at the exact buggy revision, and take at most
three distinct resolved source observations in frame/lexical-path order.
Each observation contains at most 41 lines around the recorded line, capped
at 1,200 characters. Ambiguous matching paths are not claimed to identify the
actual executed file. Missing/out-of-range paths produce no observation.

Append these observations to the original failure view and rerank with the
unchanged Java ARE BM25/trace-text index. Among its first ten production paths,
add at most four paths absent from the original sealed r3 candidate union.
Never discard an original candidate. All sources are buggy revision sources;
gold, patches and fixed revisions are not used to choose observations or paths.
The source-only lists were sealed before a separate post-gold reach calculation.

The screen delivered 50 observations across 28/32 cases; four cases had no
resolved observations. Every delivered observation included its complete trace
line under a separate source check. Maximum expanded retrieval query was
5,173 bytes. This is not provider token admission. Maximum candidate count
grew from 20 to 24; its cost cannot be treated as equal to the original list.

## Full-cohort reach and controls

| Source-only list | Reachable cases | Gains versus r3 | Losses |
| --- | ---: | ---: | ---: |
| Original sealed r3 union | 28/32 | — | — |
| Caller-context additions | **30/32** | 2 | 0 |
| Original-query matched-width additions | 28/32 | 0 | 0 |
| Same-header original-query matched-width additions | 28/32 | 0 | 0 |

Both controls added exactly the same number of paths per case as the caller
screen, using the original query's full production ranking rather than caller
source. The second retained the identical `Caller source observations` query
header without any observation text. Thus the two extra reachable cases were
not obtained by those particular simple-widening or header-only controls.
They were Cli-7 and Mockito-6, both with actual source observations. This is
an observed development attribution, not statistical causal proof or a guarantee
on new populations. Additional candidates can still distract the reader.

The four no-observation cases receive only query-header/list effects, not
caller evidence; do not count them as successful caller-source acquisition.
Whether a no-observation fallback should retain the original union exactly
must be settled before a fresh freeze, not after seeing confirmation results.

## External research grounding

[AutoCrashFL's primary paper](https://arxiv.org/html/2510.22530v1) describes
repository-source retrieval and symbol-location tools for context-aware crash
localization. This supports investigating bounded source exploration as a
mechanism. Its industrial crashdump setting, tools and evaluation differ from
our Java test-failure file proxy; none of its reported performance transfers
to ARE. Our caller-window/reranking screen is an independent implementation,
not a reproduction of that method. BLUiR's author-hosted abstract was located,
but the full PDF could not be opened through the browser, so no implementation
details were imported from it.

## Evidence and implementation

Private archive: `/home/vlad_/are-benchmark-archive/defects4j-production-r3/`.
Zero provider calls and zero fresh confirmation calls in this screen.

- `CALLER-CONTEXT-SCREEN-R1.json`: SHA-256 `50ffdfc6a02194388c73ed3022f25d511c5dbc8f734a60d107e44a83bb0a23b0`.
- `CALLER-REACH-SCORE-R1.json`: `379a4c50eff4c485942287431d9bc93a7973c7c91027a05012a61889c9c58a70`.
- `CALLER-WIDTH-CONTROL-R1.json`: `5170f9b3fa123bcd6d559eb8fd86241b132cd4ef3244f338b7014019201e78c9`.
- `CALLER-WIDTH-CONTROL-SCORE-R1.json`: `7283b394ffeaba55d5e4fc535134cf2c92e7d71a64c16a94e092388a64c09e93`.
- `CALLER-WIDTH-CONTROL-R2.json`: `16e80e9ca0807742f46a3ec77a2d23b7e13c28905b5fbd4fa9dea28e65067020`.
- `CALLER-WIDTH-CONTROL-SCORE-R2.json`: `009828d889ebb690dd5ad36b5ebc9745154dadc75e5e89639f341f60a4e9680c`.

[Caller screen](../research/arb-trace2code-r1/screen-defects4j-caller-context-r1.mjs),
[tests](../research/arb-trace2code-r1/screen-defects4j-caller-context-r1.test.mjs),
[reach scorer](../research/arb-trace2code-r1/score-defects4j-caller-reach-r1.py),
[width control](../research/arb-trace2code-r1/screen-defects4j-caller-width-control-r1.mjs),
[header control](../research/arb-trace2code-r1/screen-defects4j-caller-width-control-r2.mjs).
Frame/window tests passed (2/2); reach/control scorers compile.

Next: freeze a bounded exposed reader check over the improved lists and caller
evidence, with appropriately informed model-free comparators and all-in cost.
Validate candidate/source-window behavior and same-account 8K admission before
generation. Only a successful development quality/cost check merits a new
policy freeze and fresh confirmation under unchanged numerical gates.

## Open Questions

- Does GLM select the newly available files without losing earlier successes?
- Does richer source context repair the one reachable r3 reranking miss?
- Does caller evidence also strengthen retrieval/fusion comparators?
- What no-observation and ambiguity policy should the next freeze use?
- Does the gain survive fresh cases, symbol-bearing baselines and live ARE?
