# G03 LongMemEval-V2 transition availability r13, 2026-10-06

Status: **source-only exposed-development diagnostic; no answers, scores, provider calls, confirmation access, or superiority claim**. This follows the [r12 form-hybrid study](G03-LME-V2-FORM-HYBRID-R11-R12-2026-10-05.md).

## Inventory and result

The [r13 audit](../research/g03-beam-r1/audit-lme-v2-transition-inventory-r13.py) reads only the 28 exposed question texts, each question's small-tier haystack IDs, the pinned 200-trajectory source, and the r9 source-state index. It does not read answer, evaluator, question-type label, or confirmation question fields. It computes before/after AXTree line differences around observed actions and ranks question-related changed lines. Its private `TRANSITION-INVENTORY-R13.json` is at `/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005/`, SHA-256 `fffffcf559f13c066433fc9a4b57ffd53d75390fa798192215f387bcf1428531`. All 28 questions had at least one lexical transition candidate; **that is not evidence that all 28 answers are present**.

The inventory makes three previously conflated cases concrete:

- For exposed Magento question `6a7f0d24`, the source contains an `Update Attributes` → `Save` transition that adds the scheduling banner and `View Details` link. A later observed click on `View Details` leaves the `Products` page title in place and reveals a dialog with `Description of Operation`, `Summary`, and `Start Time` in the visible AXTree. The r9 reader answered `Summary`, which the two blind GLM-adapted rubric votes marked incorrect. The observed dialog is a stronger source witness than the old packet's irrelevant order path, but it does not justify fabricating a separate page or field called `Result`. The next mechanism should render the actual post-click surface and its bounded field census, including when navigation did **not** occur.
- For exposed Problem-form question `571b841c`, a read-only scan of every relevant small-tier `Problem` state matching `Database` and `Priority` found **zero observed Problem form states with `Category` selected to `Database`**. The high-scoring r13 transitions were unrelated incident/search-result records. A better ranker cannot reconstruct the asked automatic change from these observed text states; the correct system behavior may require an uncertainty response, a visual source, or a different evidence source. This is an observed-source limit, not proof that the application never makes such a change.
- For exposed nested-comment question `11dac74b`, the selected Postmill trajectory witnesses entering and submitting a reply, but its post-reply AXTree shows the new comment without the asked blue-banner link. A screenshot might contain additional visual evidence; this text-only audit did not download or inspect screenshot bundles. It therefore cannot conclude the link is absent.

This rejects a naive “add state-difference lines to every r12 packet” intervention. The r13 raw top matches still over-rank large unrelated search-result transitions, so the index is a **candidate availability probe**, not a qualified treatment. Do not spend GLM calls on the unfiltered r13 output or interpret 28/28 candidate availability as answer reach.

## Comparator and claim boundary

The [official LongMemEval-V2 repository](https://github.com/xiaowu0162/LongMemEval-V2) defines a memory backend that receives trajectories through `insert` and only question text plus an optional image through `query`; the harness keeps answer, evaluator, type, and question ID private during retrieval. It measures answer accuracy and memory-query latency. The [official leaderboard package contract](https://github.com/xiaowu0162/LongMemEval-V2/blob/main/leaderboard/README.md) requires complete web and enterprise runs, matching question/haystack coverage, the fixed Qwen3.5-9B reader and GPT-5.2 judge, and combines accuracy with latency against a reference frontier. Our r12 8K GLM reader and GLM-adapted judge are deliberately **not** that protocol. A matched-GLM comparison could support a clearly labeled private accuracy claim, but it cannot be called an official V2 leaderboard or LAFS win.

Current WSL has 7.8 GiB RAM and 2.9 GiB available memory at audit time; the VPS root filesystem was ~100% used with about 1 GiB free in the preceding r12 run. Native Qwen reader plus embedding/controller service feasibility has not been demonstrated in either environment. Do not install or stage multi-GB model weights on that VPS as an implicit benchmark step.

## Next gate

Implement a **source-only, action-anchored transition witness** that changes a packet only when the question names an action and the trajectory records that exact action plus a bounded post-action surface. Render before/after page identity, newly revealed dialog/banner controls, and the visible field census; mark absent or unobserved separately. Screen it on the exposed 28 for source relevance, validity and 8K packet size before any provider spend. Then test a frozen candidate on a distinct development slice from the reserve partition, preserving the 140-question confirmation partition. In parallel, define the matched-GLM comparator and latency accounting; an official-protocol claim requires its actual reader/judge/backend infrastructure, not relabeling our custom run.

## Open Questions

- Can a transition witness improve premise awareness without turning absence of observation into a false assertion of absence?
- Which screenshot-bearing questions need visual retrieval rather than text-only abstention?
- What frozen absolute quality, paired improvement and cost thresholds warrant opening the 140-question confirmation set?
