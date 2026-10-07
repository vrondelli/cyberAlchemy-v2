# G03 r6 private reviewer bundle — bounded accuracy claim

Status: **candidate for Vlad and Dave; not approved or published**. Prepared 2026-09-29 UTC from the frozen [protocol](G03-R6-PROTOCOL.md), [result note](G03-R6-RESULT-NOTE.md), [card draft](G03-R6-PRODUCT-CARD-CANDIDATE.md), and a fresh read-only check of the private VPS receipts. This bundle contains no question IDs, answers, references, provider payloads, credentials, or raw archive locations.

## Exact claim for review

On a prespecified, previously unexposed **40-question LongMemEval-S cohort covering five available question types**, using **GLM-5.3-flash with an 8K request window**, ARE's 5,000-character ranked whole-turn memory projection answered **22/40 (55.0%)** correctly, compared with **5/40 (12.5%)** for the sequential retained-note control. The paired strict-accuracy difference was **+42.5 percentage points**; its prespecified five-stratum paired-bootstrap 95% interval was **+27.5 to +57.5 points**.

All 40 questions have paired answers; **80/80** blinded native-rubric judgments were valid. There were zero provider refusals, invalid judgments, and task replacements. The frozen accuracy-only gate required a primary 95% lower bound above +10 points and a control-favoring sensitivity lower bound above zero; both passed. The independent receipt/metric audit reports `status: passed` and `accuracy_directional_gate_pass: true`.

The five types each contribute eight questions. The sixth, preference, was exhausted before r6. This is **not** a full LongMemEval-S, all-model, speed, cost, general-workflow, or ARE-product superiority result. The comparator is sequential retained notes, not no memory or another product. This result applies to the named model, window, strategies, source revision, and September 2026 cohort. The public card must keep these limits immediately beside the number.

## Reproducibility and integrity summary

- The source-only selection fixed eight untouched questions per type before generation; no evaluator references entered selection or generation. No replacement or top-up followed the freeze.
- The analysis unit is a matched question. The interval used 20,000 paired bootstrap resamples within the five type strata, with a deterministic seed derived from the frozen source-manifest hash. The observed discordance was 17 ARE-only correct and zero control-only correct; the exact two-sided McNemar p-value was 0.0000152587890625. Per-type counts are descriptive, not separately powered claims.
- The control-favoring invalid-judgment sensitivity interval was also +27.5 to +57.5 points because there were no invalid judgments. Known token and summed-arm-time ratios were recorded in the private result note but are **not** part of this accuracy claim; summed arm time is not campaign wall time.
- On 2026-09-29, a fresh SHA-256 read of the seven private VPS receipt files matched every digest below. A separate read-only projection of the paired analysis and independent audit confirmed 40 planned/answered, 80 judgments, 22/5 correct, zero invalids/refusals, the +0.425 point difference, the [0.275, 0.575] interval, and the passing gate. Hash matching establishes current file identity; it does not turn this selected cohort into a broader population claim.

| Private receipt role | SHA-256 |
| --- | --- |
| Freeze | `ea3919b6cdffc532283e47dfe31e1a808ce00d2a91a47c683edd76959e03f5f1` |
| Source-only manifest | `af04cd3230cd99085fad90c7ad1e0db8654a5ee1a7096345a1d3b8b1b8bae393` |
| Generation result | `8ec05c6520a8d569f3a9509fb9bf053549a5dfadbdcd39623b9fb33c34bff4b8` |
| Evaluator-only reference manifest | `7340d57d5b20f410a8597036b11d22c6e611a8329b2972e566ebd989f02a5b84` |
| Score result | `b5c54f5da9872c0d5a3bcda7e8a8b935a74a89453b767974eafc4fc5ff5e1903` |
| Paired analysis | `4c4561f7678b34d121289e31d7fceb293f7555fe7067f24f474486d4b2b40853` |
| Independent hash/metric audit | `6fb27b6f87a5512c557bbea8b6b009bd3426b1389c3afd778732f53b1ed28988` |

This is a **private review projection**, not itself a public evidence package. The result note owns exact private locations and archive bindings. Publication requires Vlad and Dave to review the exact wording and a separately sanitized public package through the publication route; this benchmark work grants no publication, release, or deployment authority.

## Review questions

- Do Vlad and Dave accept the accuracy-only claim and the prominence of the five-type, model, window, and comparator limits?
- Is the proposed public receipt package sufficient for independent scrutiny without exposing questions, references, answers, payloads, or private archive locations?
- What fresh source revision and population would be needed before any six-type or broader memory claim?
