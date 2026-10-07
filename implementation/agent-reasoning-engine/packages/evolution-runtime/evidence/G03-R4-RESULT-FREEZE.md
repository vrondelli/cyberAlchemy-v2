# G03 r4 LongMemEval-S replication — terminal private result

Status: **campaign completed and privately archived on 2026-09-28; product-page claim not approved**. This is the owner-approved fresh 80-question GLM campaign under [DG-G03-R4](G03-R4-PROTOCOL-CANDIDATE.md), not a continuation of r1–r3 predictions. The source-only selection excluded every previously dispatched question. The type mix is five types × 14 and `single-session-preference` × 10, with two abstention IDs. This changed mix must accompany any comparison.

## Sealed outcome

- Generation: 80/80 answered pairs, zero provider refusals, zero failures, zero unknown usage; 3,061 model calls and 11,298,071 known tokens. Generation `RESULT.json` SHA-256: `a83de20e1ab1d35272f2f6c445955debb25f4611606083ef842c7f5701920a77`.
- Native-rubric GLM judging: 160/160 judgments, 156 valid yes/no outputs. The four invalid outputs were counted incorrect as predeclared; none was retried. Score `RESULT.json` SHA-256: `29b6a2c290a5f2bae8eeb6dc15b4879cca2ee6fe671e7831158f6674fc8126a9`.
- Strict correct rate: treatment **54/80 = 67.5%**, control **9/80 = 11.25%**; paired difference **+56.25 percentage points**. The predeclared stratified paired bootstrap 95% interval for the difference is **+45.0 to +67.5 points**. The control-favoring invalid-judge sensitivity difference is **+55.0 points**. Discordant pairs: 49 treatment-only correct, four control-only correct.
- Across all 80 fully answered and usage-reconciled pairs, treatment/control all-in token ratio is **0.01322** (95% interval 0.01300–0.01343); summed per-arm generation-plus-judge elapsed-time ratio is **0.02491** (95% interval 0.02317–0.02668). These are not campaign-wall-clock speedups.
- The analyzer's `quality_directional_candidate` is true, but `directional_product_headline_admissible` is **false** because four judge outputs were invalid. This is a fixed-cohort LongMemEval-S result only; it is not a full-benchmark, general-workflow, or product superiority claim. Vlad and Dave have not reviewed or approved a public card. Analysis `ANALYSIS.json` SHA-256: `ffb65a5a6ae37b993bb2a0ae9eb25943e3cbfa3c499bd06ab95dfa5766b66efb`.

The score integrity was independently checked after finalization: 80 unique question IDs, exactly one control and one treatment judgment for each, 160 distinct judgments, score counts matching the 80-row analysis, and no unknown usage. The generation and scoring systemd units both ended successfully.

## Receipt locations and retention

The private VPS keeps the originals at `/opt/are/evolution-runtime/g03-product-replication-r4`, `/opt/are-benchmark-runs/longmemeval-product80-20260928-r4`, and `/opt/are-benchmark-runs/longmemeval-product80-20260928-r4-score`. Source-only selection SHA-256 is `16632e2084af68612281e6d6a38d521ae25ff096133f1f4d385ec41a3ef71792`; source manifest SHA-256 is `f5ca500e10d593203d912c40ed7a97a2242482c212b40ba49fd3f0cab19cb6f2`; reference manifest SHA-256 is `3ccf26eaa8ed1391135081a042317548ec0a40c237a867fca14f1b268504cc64`. The [protocol freeze](G03-R4-PROTOCOL-CANDIDATE.md) records code and native-rubric hashes.

Verified content-addressed private `.tar.zst` archives (all originals retained; nothing deleted):

| Evidence | Archive SHA-256 | Bytes |
| --- | --- | ---: |
| Cohort and references | `a15258c1390f68bb710e34aa0438986bc5cfaf3703f3077dc94e1cfe4f8ceeeb` | 11,866,086 |
| Generation | `028d2ae3e2c30377fe94a07c75b3bbdb3b4cae60926daf6ab6648e32aeb31383` | 3,761,565 |
| Score and analysis | `029383841c67629e75f4e6ac3e32c55081aacd01aa243d8bc8604bca4fca34ff` | 79,264 |

Each archive and its receipt lives under `/opt/are/evolution-runtime/archives/` with prefix `g03-product80-r4-`. The archive tool verified decompression/listing; a separate SHA-256 check matched each receipt after finalization. No raw answer, reference, provider payload, or credential belongs on the public product page.

## Open Questions

- Vlad and Dave must independently review the private evidence and agree the exact wording and limitations of any product-page card.
- Decide whether the four invalid GLM judge outputs require a separately named sensitivity or replication study before publication; do not silently rerun or repair this frozen campaign.
- Decide the retention period and restore location for the r1–r4 private archives before deleting any live originals.
