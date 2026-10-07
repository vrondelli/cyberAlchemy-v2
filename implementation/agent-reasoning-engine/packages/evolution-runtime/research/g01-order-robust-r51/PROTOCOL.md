# G01 exposed counterbalanced-order and RRF diagnostic r51

Status: prospectively fixed before packet construction or new GLM calls  
Scope: private exposed development evidence only  
Authority effect: none

## Objective

Test whether presentation-order instability explains the heterogeneous raw GLM
reranking effect in r43, r44, and r50, and whether a fixed rank-fusion rule can
retain the model's early-rank gains without the observed Hit@3 regressions.

## Fixed inputs

- the sealed 23-case r43, 24-case r44, and 24-case r50 packets;
- their sealed historical raw GLM rankings;
- their complete graph rankings and already exposed evaluator labels;
- no candidate additions, source changes, or prompt-evidence changes.

## Counterbalanced views

For every original candidate list of length `n`, construct exactly two new
views:

1. `reverse`: original candidate indices in reverse order;
2. `rotate_half`: rotate the original indices left by `floor(n/2)`.

Display candidate IDs are reassigned consecutively from one in each view. The
card's explicit `graph=N` value remains unchanged. The response is mapped back
to source paths through the sealed display map. Both new views use identical
instructions saying that presentation order and display ID are not evidence.

Each call returns at most eight distinct displayed IDs. Unselected paths are
appended in the complete graph order, producing a full ranking over the same
universe as the historical graph and raw GLM rankings.

## Fixed aggregation

For each case, fuse four complete rankings with unweighted Reciprocal Rank
Fusion using the published constant `k=60`:

- complete graph ranking;
- historical original-order raw GLM ranking;
- new reverse-view GLM ranking;
- new half-rotation-view GLM ranking.

For path `d`, `score(d) = sum(1 / (60 + rank_r(d)))`. Sort descending by score,
then by graph rank, then path. No weight, prefix length, threshold, or constant
may be changed after scoring.

## Diagnostics and metrics

Report per cohort and combined:

- valid response denominator and provider/token cost;
- Kendall tau between the two new full rankings and between each new ranking
  and the historical raw ranking;
- top-1 and top-3 agreement;
- graph, historical raw GLM, and RRF MRR@8, Hit@1, Hit@3, and reach@30;
- paired wins/ties/losses and a deterministic 100,000-resample paired bootstrap
  95% interval for RRF-minus-graph and RRF-minus-historical-raw MRR@8.

## Prospective advancement gate

All conditions are required:

1. `142/142` new tokenizer admissions and valid generations;
2. every completed view preserves exactly the graph ranking universe;
3. combined RRF MRR@8 exceeds combined graph MRR@8 by at least `0.03` and the
   paired-bootstrap lower bound is above zero;
4. combined RRF Hit@3 is at least combined graph Hit@3;
5. RRF MRR@8 exceeds the combined historical raw GLM MRR@8 by at least `0.02`;
6. RRF Hit@3 is at least the combined historical raw GLM Hit@3;
7. RRF MRR@8 exceeds graph MRR@8 in at least two of the three cohorts;
8. no cohort loses more than `0.01` MRR@8 versus graph.

Passing qualifies only the frozen construction for a new independent
confirmation population. It does not establish product, ContextBench, or broad
superiority. Failure advances to the separately frozen Self-Sorting escalation;
the RRF rule is not tuned on these outcomes.

## Cost and failure bounds

- model: `glm-5.3-flash`, reasoning effort `low`;
- exactly 142 tokenizer calls and at most 142 generation calls;
- maximum 512 completion tokens per generation;
- prompt plus completion reserve at most 8,192 tokens per call;
- summed tokenizer prompt cap 500,000 tokens;
- no automatic retries; transport failure stops dispatch;
- malformed successful responses are recorded and dispatch continues.

## Open questions

- If RRF fails, does fixed-lambda Self-Sorting recover cross-list preference?
- Does order instability concentrate in the historical GLM win/loss cases?
- Can a successful exposed mechanism transfer to a fresh Defects4J population?

