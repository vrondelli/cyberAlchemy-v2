# G03 r5 — fresh five-type LongMemEval-S replication

Status: **terminal, privately scored, independently receipt-audited, and archived, 2026-09-28**. This is a new fixed 50-question cohort, not a continuation or repair of G03 r4. A source-only draw selected ten previously unexposed questions each from knowledge-update, multi-session, single-session-assistant, single-session-user, and temporal-reasoning. The `single-session-preference` pool was exhausted by r4, so r5 does not cover that sixth type. One selected question was an abstention case. Both arms used GLM-5.3-flash under the pinned 8K request window and 5K-character retained-note projection; ARE treatment was compared with the sequential retained-note control.

Generation reached **50/50 terminal attempts**: 47 answered pairs, three provider code-1301 tokenizer refusals before any model call, zero other failures, zero unknown usage, 1,803 model calls, and 6,647,014 known generation tokens. The refused IDs are `81507db6`, `7e00a6cb`, and `51a45a95`. They were neither retried nor replaced. Under the frozen rule, both arms for each refused question count incorrect in the 50-question quality denominator and receive no judge calls; efficiency ratios cover only the 47 fully answered, usage-reconciled pairs.

Evaluator-only reference projection verified 47 reference files after generation sealed; the generation stage never accessed reference values. Blinded native-rubric GLM scoring produced **94/94 judgments**, 90 valid yes/no outputs. The four invalid outputs were counted incorrect, without retry. Exact strict correct rates across all 50 questions are ARE **30/50 = 60%** and control **3/50 = 6%**.

| Bounded descriptive measure | ARE relative to control | Paired 95% interval |
| --- | ---: | ---: |
| Strict accuracy difference, all 50 questions | +54 percentage points | [+42, +66] points |
| All-in known model-token ratio, 47 answered pairs | 0.01304 | [0.01279, 0.01330] |
| Summed generation-plus-judge arm-time ratio, 47 answered pairs | 0.02509 | [0.02307, 0.02719] |

Intervals use 20,000 deterministic paired bootstrap resamples within the five question-type strata. Time is summed per-arm elapsed time, **not campaign wall-clock speedup**. The control-favoring invalid-judge sensitivity difference is +50 percentage points. The analyzer marks the bounded quality direction as a candidate, but `directional_product_headline_admissible` is **false** because of the three provider refusals and four invalid judge outputs. This is not a full LongMemEval-S, general-workflow, or product-superiority claim. Vlad and Dave must review the exact sanitized card before any publication; this note does not authorize publication.

The private generation result is `/opt/are-benchmark-runs/longmemeval-product50-20260928-r5/RESULT.json` (SHA-256 `d7a41fafd00b822eae21a06e6966803f13ed3ec2666c6fd5c58400a60c009cbe`). It binds to the fixed source manifest (SHA-256 `d7f255236abf003d8871084a77f6de094ef8bffc81fd7eb1d98a677ac2754200`). The evaluator-only reference manifest SHA-256 is `864ddb119bb2d1002c06cfacfc71f10aa5d0230e357980c4b89eb8d11baf5242`; the private score result SHA-256 is `7f6a5b84122ef3891e66ddcc256fe987c69cea689c2693438eb245ff415e845a`; and the analysis SHA-256 is `e51ddde81688176a5001da86b8604665f4e4abdda60f066c77b4750b836db81d`.

The independent `/opt/are/evolution-runtime/g03-product-replication-r5/HASH-AUDIT.json` (SHA-256 `41272406b760081401f2d29486abf1a3deee176160aeb74589652642d2906bdc`) reconciled all 50 per-question receipts, all 94 answer-bound judgment files, generation/judge costs, and analysis point metrics. Its claim ceiling is receipt and metric integrity only. The audit script was added after scoring as an independent check; it did not change generation, judging, or analysis.

The waiting finalizer first staged for r5 retained an 80-ID reference assertion. Before generation ended and before any reference access or scoring, a corrected evaluator-only projector changed that assertion to 50; the original was preserved, and the corrected projector SHA-256 is `6c4b9a1e4cbfc96804221e437fdcb692137e8f8d8ad09d1e6fbe2849fbcc0e46`. The r5 scorer SHA-256 is `1873fc9dc6c93b692274343fa3dc2ddc5f73222cca75d1bda60a3dad13d4e2d3`, and analyzer SHA-256 is `60cc5af0735a9f042fdf49035c845f50b2d3e25a0709dbfb083884369d7f160e`. Bootstrap implementation details were bound after G01/G02 scoring began, but before G03 reference scoring. These are disclosed harness-timing boundaries, not retrospective cohort changes.

The finalizer completed projection, judging, and analysis but deferred its archive step because its fixed 15 GiB free-space guard saw 13 GiB. After verifying that the three r5 evidence roots together occupied under 100 MiB against 13 GiB free, the same private archive helper archived each root separately. All three archive SHA-256 values matched their manifests and passed independent full tar-readability checks; raw originals were retained and no source files were deleted:

| Private evidence archive under `/opt/are/evolution-runtime/archives/` | SHA-256 | Bytes |
| --- | --- | ---: |
| `g03-product50-r5-cohort-*.tar.zst` | `37cd00ab5119c7d217736e557d072877301efd9e0681c7702f098821b17501b9` | 7,481,570 |
| `g03-product50-r5-generation-*.tar.zst` | `f20705dfd81b3e6f3c9034c7202c8d8c0ecff9c4a017a1b36d6adbc42b087cc9` | 2,204,594 |
| `g03-product50-r5-score-*.tar.zst` | `3fdf5ce0c9e55cc2ec7893878900e601eae8b28f21b6f46a81774f559a93ec48` | 47,352 |

## Open Questions

- Will Vlad and Dave approve a balanced, bounded evidence card that includes the 3/50 refusal and 4/94 invalid-judge counts and avoids an all-50 efficiency headline?
- Should a separately named future G03 study target the provider refusals or invalid judge outputs? It must not silently repair or merge with r5.
- What retention and private restore budget applies to the raw r5 roots and archives?
