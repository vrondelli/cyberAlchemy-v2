# G03 r6 — five-type LongMemEval-S accuracy confirmation

Status: **terminal, privately scored, independently receipt-audited, and archived, 2026-09-29 UTC**. The [prospective protocol](G03-R6-PROTOCOL.md) fixed 40 previously unexposed LongMemEval-S questions, eight from each of the five question types still independently sampleable after r1–r5. This is a new cohort, not a repair, extension, or rescore of r5. Both arms used GLM-5.3-flash with an 8K request window; ARE's 5,000-character ranked whole-turn memory projection was compared with the sequential retained-note control. The exhausted sixth preference type is not represented.

Generation completed **40/40** questions with zero provider refusals, zero failures, no unknown usage, 1,530 model calls, and 5,658,226 known generation tokens. The generation stage did not access evaluator references. Subsequent evaluator-only projection and blinded native-rubric scoring completed **80/80 valid judgments**, with zero invalid judge outputs. No question was replaced or retried after freeze.

| Frozen accuracy measure, all 40 questions | Result |
| --- | ---: |
| ARE strict correct | 22/40 = 55.0% |
| Control strict correct | 5/40 = 12.5% |
| Paired difference | +42.5 percentage points |
| Stratified paired-bootstrap 95% interval | +27.5 to +57.5 points |
| Control-favoring invalid-judge sensitivity interval | +27.5 to +57.5 points |
| Discordant pairs | 17 ARE-only correct; 0 control-only correct |
| Exact two-sided McNemar p-value | 0.0000152587890625 |

The per-type counts are descriptive only (eight questions each), not separately powered superiority claims: knowledge-update **5 ARE / 2 control**, multi-session **3 / 1**, single-session-assistant **2 / 0**, single-session-user **6 / 1**, and temporal-reasoning **6 / 1**.

The **predeclared accuracy-only directional gate passed**: all 40 paired outcomes and 80 judgments reconcile, the primary 95% lower bound exceeds +10 points, and the control-favoring sensitivity lower bound exceeds zero. The independently recomputed receipt/metric audit reports `status: passed` and `accuracy_directional_gate_pass: true`. Known all-in model-token ratio was 0.01356 (95% interval 0.01317–0.01405) and summed generation-plus-judge arm-time ratio was 0.02415 (0.02198–0.02635), both descriptive under this accuracy-only protocol. Summed arm time is **not** campaign wall-clock speedup. No cost, speed, complete LongMemEval-S, six-type, general-workflow, or broad ARE-product superiority headline follows from r6.

A bounded claim candidate for Vlad and Dave to review is in the [exact private card draft](G03-R6-PRODUCT-CARD-CANDIDATE.md), with a [machine-readable private review packet](G03-R6-REVIEW-PACKET-CANDIDATE.json). Its wording requires the five-type limitation, cohort date, protocol, and failure accounting beside the effect. This private result note does **not** approve or publish a product-page card.

On 2026-10-02, Vlad reported that both he and Dave approved the exact private
five-type accuracy claim and caveats. The [separate review-decision record](G03-R6-REVIEW-DECISION-2026-10-02.md)
binds that report to the unchanged card, bundle, and packet hashes. It is not
an independently authenticated Dave signature or publication authorization.

## Private receipt bindings

| Artifact | VPS path | SHA-256 |
| --- | --- | --- |
| Freeze | `/opt/are/evolution-runtime/g03-product-replication-r6/FREEZE.json` | `ea3919b6cdffc532283e47dfe31e1a808ce00d2a91a47c683edd76959e03f5f1` |
| Source-only manifest | `/opt/are/evolution-runtime/g03-product-replication-r6/source/manifest.json` | `af04cd3230cd99085fad90c7ad1e0db8654a5ee1a7096345a1d3b8b1b8bae393` |
| Generation result | `/opt/are-benchmark-runs/longmemeval-product40-20260928-r6/RESULT.json` | `8ec05c6520a8d569f3a9509fb9bf053549a5dfadbdcd39623b9fb33c34bff4b8` |
| Evaluator-only reference manifest | `/opt/are/evolution-runtime/g03-product-replication-r6/references/manifest.json` | `7340d57d5b20f410a8597036b11d22c6e611a8329b2972e566ebd989f02a5b84` |
| Score result | `/opt/are-benchmark-runs/longmemeval-product40-20260928-r6-score/RESULT.json` | `b5c54f5da9872c0d5a3bcda7e8a8b935a74a89453b767974eafc4fc5ff5e1903` |
| Paired analysis | `/opt/are-benchmark-runs/longmemeval-product40-20260928-r6-score/ANALYSIS.json` | `4c4561f7678b34d121289e31d7fceb293f7555fe7067f24f474486d4b2b40853` |
| Independent hash/metric audit | `/opt/are/evolution-runtime/g03-product-replication-r6/HASH-AUDIT.json` | `6fb27b6f87a5512c557bbea8b6b009bd3426b1389c3afd778732f53b1ed28988` |

The private raw roots remain on the approved GLM VPS. The existing archive helper created the following content-addressed archives under `/opt/are/evolution-runtime/archives/`, verified full tar readability, and retained every source file. A separate SHA-256 and byte-size check matched each archive manifest; no source files were deleted.

| Private archive label | SHA-256 | Bytes |
| --- | --- | ---: |
| `g03-product40-r6-cohort` | `d09a5ae95c2b458a2a7ff248d6649286fa1546f44ef8d7994ee3e9b48d4bc305` | 5,982,160 |
| `g03-product40-r6-generation` | `6b88b9fd56dd9d2071e3d50254e2712c0424f7f6d158e80c072dd8e39f324490` | 1,875,852 |
| `g03-product40-r6-score` | `82c8cf2952adaf429d91e3710119f40b66c3cad3a4069107f19c141ce5c4c296` | 41,089 |

Raw answers, references, provider payloads, and credentials are excluded from the proposed public wording. Archive retention and restore location remain separate decisions.

On 2026-10-01, the three content-addressed archive/manifest pairs were copied to a private WSL cold location. The local archive SHA-256 values matched all three manifests, complete tar-readability passed 3/3, and an `rsync --checksum` comparison against the six VPS files reported no differences. All VPS raw roots and archives remain intact; this is a verified copy, not a retention or deletion decision.

## Remaining LongMemEval-S supply after r6, 2026-10-02

A pinned source-only census excluding every prior queue, pilot, r1–r6
selection, and assigned r2/r3 question ID found **136/500** LongMemEval-S
questions still unexposed: 11 knowledge-update, 57 multi-session, seven
single-session-user, and 61 temporal-reasoning. There are **zero** untouched
single-session-assistant or single-session-preference questions. Its private
receipt SHA-256 is
`cd21b55ed329ac7b52ba9487df53dc9dfb803a1a0eca9bae4f09950389122644`,
checksum-matched to WSL cold storage under
`/home/vlad_/are-benchmark-archive/g03-post-r6-source-supply-r1-20261002/`.
No references, answers, or model calls entered this census. It establishes
that another independently sampled five- or six-type cohort cannot be drawn
from the same LongMemEval-S source revision. A four-type successor would be a
new, narrower claim rather than a replication of r6's five-type effect.
The official [LongMemEval release](https://github.com/xiaowu0162/LongMemEval)
lists S, M, and oracle variants; their question-ID overlap must be verified
before any other variant is called independent. The newer
[LongMemEval-V2](https://github.com/xiaowu0162/LongMemEval-V2) is a distinct
agentic-memory benchmark, not a drop-in fresh S cohort.

## Open Questions

- The exact private five-type wording was approved as reported by Vlad; what sanitized public receipt package and separate publication decision are needed for the product page?
- What new source population would support a six-type, full-benchmark, or cross-workflow claim after the current preference pool was exhausted?
- What archive retention and restore location fit the VPS space budget while preserving the private audit trail?
