# G03 LongMemEval-V2 r40–r45: source reach and structural witness diagnostic

## Result and claim ceiling

The r34 medium-relation screen nominated eight of the 26 exposed reserve-development questions. The [r40 packet builder](../research/g03-beam-r1/build-lme-v2-medium-relations-r40.py) produced source-only packets for all eight (`RESERVE-DEV-WIRES-R40.json`, SHA-256 `5fc2ac0e6d3fe476d3cf74622793f2773915b43d852437b052ed04665f7449e6`), but manual source review found that several top states did not contain the answer-bearing field or destination. No r40 GLM calls were made. The later [role/scope screen](../research/g03-beam-r1/screen-lme-v2-role-scope-r42.py) improved page-role discrimination but still made false matches, including global navigation labels treated as order-view tabs. Its latest private output is `ROLE-SCOPE-SCREEN-R43.json` (SHA-256 `eb7dd2f26f41e0180dd7ca1c940824a0ae7a9146eaf6fed1eae39ff3eb289e24`). The earlier R42 output is superseded; the script filename remains `r42` while its current source contains the R43 correction.

The official LongMemEval-V2 trajectory screenshot bundles were obtained from the [primary dataset release](https://huggingface.co/datasets/xiaowu0162/longmemeval-v2/blob/main/DATA_CARD.md) into private WSL archive storage. The compressed web bundle (2,562,302,847 bytes, SHA-256 `68699c6842412e09a6f89d3c05c5ae8813275918002b52d82dec43ab24dd01fb`) and enterprise bundle (3,354,163,660 bytes, SHA-256 `5c4a67ae0856aa1ede9b040e7da7c7a2d0b76fdd6344ef87380bcdf9f4b6d7a3`) matched the published LFS hashes. Only 16 selected trajectory frames (about 1.5 MB) were extracted; neither whole bundle was unpacked or sent to the VPS. Visual inspection revealed that superficially similar source screenshots can depict different tasks or pages. Screenshot presence alone is not answer reach.

An exposed-reference inspection found two concrete reader failures. For the Magento question `1d864942`, `Back` in the observed edit page returned to **All Reviews**, not the separate **Pending Reviews** destination. For the Postmill biography question `77258cda`, the decisive post-save signal was the new bio text in the page's right-hand `complementary` profile panel, not merely the alert, editor text, or preview. The [r44 source builder](../research/g03-beam-r1/build-lme-v2-structural-witness-r44.py) preserved the relevant UI-role hierarchy and actual transitions in two compact packets (`STRUCTURAL-WITNESS-R44.json`, SHA-256 `3564530147b6bcaa8856260adbb1860fa5da37fa262d8078b997406708ceb2a9`). The builder read no answer fields, but **human selection occurred after seeing the exposed references**; this is a post-reference diagnostic, not a blinded candidate.

The [r45 VPS reader](../research/g03-beam-r1/run-lme-v2-structural-witness-r45.mjs) completed two zero-retry, 8K-admitted private GLM responses. Its cold WSL receipt is `/home/vlad_/are-benchmark-archive/g03-lme-v2-structural-run-r45/RESULT.json` (SHA-256 `f44fb511488e78295aff6c062b4ac1673006ed523e8a0624a694fcb8700807bb`). Both responses were valid:

| Exposed question | r45 observation | Against exposed reference |
| --- | --- | --- |
| `1d864942` Magento Back | Says **Yes** despite stating the destination is the general Reviews list rather than pending-only. | Wrong: the question asks whether Back is the action to reach Pending Reviews; the required distinction did not control the yes/no decision. |
| `77258cda` biography save | Identifies the updated bio in the sidebar/complementary region and says no refresh/navigation is needed. | Reference-concordant on manual inspection; formal adapted-judge score not run. |

These two heavily exposed answers do not repair the failed r18 reserve-development gate. If the biography answer is counted, the descriptive r39 counterfactual would rise by one only, to **9–10/26**; this is not an independent score and remains below ≥14/26. The 140-question confirmation partition remains unopened. No LongMemEval-V2 leaderboard, cross-benchmark, or product-wide superiority claim follows.

## Mechanism and next boundary

The source mechanism now needs both (1) relation-preserving retrieval of the right entity/page, adjacent transition, and region, and (2) an answer-decision check that maps the *exact requested destination or comparison* to the observed destination before generating Yes/No or an action. A generic prompt that merely includes the right destination was insufficient for Magento. Conversely, preserving `main` versus `complementary` made the biography confirmation visible and usable.

Before opening another independent development cohort, implement and source-screen this mechanism across the whole exposed 26-question set without reading more reference text for selection. Require answer-bearing source witnesses across more than the current isolated cases, then freeze the exact packet rule, reader prompt, matched control, 8K/cost limits, and prospective absolute/paired gate. The pinned metadata split has **257 unused reserve questions**, but the two enterprise/errors-gotchas reserve questions were both consumed by r17: a fresh cohort can cover at most **12 of the original 13 reserve-populated strata** without changing its target population. Predeclare that limitation rather than silently claiming a matched 13-stratum replication. Do not recycle the r18–r21 cohort as independent evidence. Native official V2 claims additionally require the fixed reader/judge and latency protocol.

## Open Questions

- Can a source-only selector reliably retrieve role-scoped answer-bearing states for the 14 questions whose r34 top state had no positive relation feature?
- What deterministic answer contract will prevent a correct observed destination from being mapped to the wrong Yes/No action?
- Should the next independent reserve-development transfer explicitly use the 12 still-populated strata, or reserve the scarce web/errors-gotchas cell (one ID remains) for a later robustness check?
