# Evidence for the next complete-trajectory experiment

Status: candidate research design, not an admitted experiment or achieved goal. The current product frontier is a reusable method that preserves reasoning evidence under 8K while reaching perfect benchmark quality and reducing cumulative model tokens by at least 15% separately per benchmark. Frozen failures and exposed development tasks remain in scope.

The [independent diagnostic review](REQUEST-REPETITION-REVIEW.json) approved the descriptive result and reproduced all counts. Experiment admission and quality/savings claims remain unproved.

## New observation

[The offline diagnostic](REQUEST-REPETITION.json) matches actual dispatched wire requests to captured prompts, validates source hashes and reconciles all 218 calls and 605,550 tokens against the sealed discovery results. It makes no provider, tokenizer or evaluator calls. Unsubmitted prompt captures do not count; separate dispatches always do.

| Across four trajectories | Control | Treatment |
|---|---:|---:|
| Actual model calls | 117 | 101 |
| Actual input tokens | 309,186 | 269,762 |
| Actual output tokens | 14,010 | 12,592 |
| Serialized message bytes | 764,619 | 643,854 |
| Message bytes already presented on an earlier call | 353,118 | 289,487 |
| Serialized tool-schema bytes | 335,348 | 351,522 |

Despite fewer treatment calls, treatment sends more tool-schema bytes in total. This is a candidate source of overhead, not a measured token saving. Exact repeated messages account for about 46.2% and 45.0% of message bytes, respectively. Repetition includes essential instructions, user intent, pending tool exchanges and source evidence; deleting all repetition would be unjustified. JSON bytes exclude provider tokenization and outer framing.

The existing discovery analysis also found zero explicit recovery calls despite repeated recovery catalog presentation. Seven of eight delivered archives lacked evidence for perfect whole-read selection. The completed diversity component improves selection quality but increases new tokens by 3.55%. Therefore another terminal-only study cannot establish the original objective.

## Catalog visibility correction

The subsequent [actual-wire audit](RECOVERY-VISIBILITY.json) found that **all 97 acknowledged recovery catalogs were empty**: 31, 29, 10 and 27 across the four treatment trajectories. Each controller pinned its initial snapshot at zero captures and receipts. No explicit refresh occurred. Normal source discovery and other retention mechanisms still ran, but this catalog never exposed subsequently archived reads.

This changes the interpretation of the earlier observation. Zero explicit recovery calls does not show that populated catalogs are unnecessary, and reducing the bytes of this empty catalog does not test useful recovery. Treat missing catalog freshness as an additional implementation hypothesis. Before full-trajectory comparison, explicitly define and validate when newly archived evidence becomes discoverable. A corrected eager catalog and demand-driven catalog must offer the same retained archive; do not attribute a freshness repair to the visibility ablation.

The new candidate controller delays its first archive snapshot until an acknowledged opening and preserves all existing paging behavior after that. Its four tests pass; integration, freshness policy and tokenizer registration remain prerequisites. An input-only comparison using old empty catalog prompts is an overhead diagnostic, not a simulation of populated recovery behavior.

## Gap, question and competing hypotheses

Gap: the previous bundled treatment does not identify the marginal cost or quality effect of its extra recovery surface. Missing discovery dominates several tasks, and reduced prompt size alone need not improve discovery.

Question: can ARE present recovery affordances only when they are useful, while retaining deterministic archived evidence and directing the freed context toward unresolved public-task claims?

H1, demand-driven recovery: a compact persistent recovery entry point plus explicitly requested detailed pages reduces repeated catalog/schema input without losing recoverability. Predict lower measured wire-token input on matched histories, then at least 15% cumulative saving and perfect quality on complete trajectories. Merely saving bytes does not support the final prediction.

H0, visibility loss: less visible recovery reduces model use of necessary history, increases rereads or reasoning output, or harms quality. Zero previous explicit calls does not prove the affordance was useless: the catalog itself may have informed the model.

H2, discovery bottleneck: input reduction alone cannot repair missing evidence. A separate task-agnostic unresolved-claim ledger may redirect search toward missing support. Do not bundle H2 into H1's first causal comparison; carry it as a distinct successor if the recovery ablation cannot improve discovery.

Selection posture: prioritize a tokenizer counterfactual for H1 before committing full-trajectory model spend. It can falsify the size premise cheaply, but cannot validate quality. Keep the diversity component fixed in both new arms if adopted; label the resulting control as new, and do not compare it as though it were the old control.

## DAG and admission gates

1. Independently review the receipt-bound diagnostic and retain this observation with its limitations.
2. Implement compact final evidence references and pre-dispatch size validation; the earlier 12.19 MB combined record exceeded its 8 MiB final limit. Do not repeat that infrastructure failure.
3. Specify H1's exact model-visible entry point, page retrieval, state transitions and source bindings. Preserve access to every archived read and pending tool exchange. Synthetic tests must include evicted evidence, multiple pages, stale handles and recovery after compaction.
4. Register the native question, competing hypotheses, selected experiment, task DAG, budgets, criteria and falsifiers before measurements. Freeze the source-only matched request set; do not tune to gold identities or per-task answers.
5. Run the real-tokenizer counterfactual on identical histories. Include schema and catalog together in each complete request; report measured input differences and output-unmeasured limitations. No percentage saving derived from bytes.
6. If the size premise survives independent review, freeze the full-trajectory paired experiment at exact 8K with two workers. Keep fixed tasks, equal budgets and answer policy, all failed calls, native span/file scores, perfect treatment quality and at least 15% total-token saving as distinct gates. No early-stopping cap substitution.
7. Score and audit all assigned trajectories; register observation and learning decision. Failure leads to a reviewed successor hypothesis, not threshold relaxation. Untouched confirmation remains necessary for generalization.

Dependencies: 1 → 3 → 4 → 5; 2 and 5 → 6 → 7. Broader LongMemEval confirmation can prepare independently. Simultaneous provider branches require shared capacity supervision; four-worker expansion remains a later measured gate.

## Operational scope

Coordinator owns source integrity, retained failure accounting and bounded artifact output. Current bounded live stages require 1 GiB physical D: reserve, 8 GiB guest reserve and 32 MiB growth limit. C: is excluded. User-owned physical VHD reclamation is deferred; it is not an assumed effect of deleting guest files. This offline analysis writes less than 1 MiB and creates no source clones. No commit, release, authority promotion or deployment is part of this candidate.

## Open questions

Does catalog visibility help implicitly even without tool calls? What is its actual marginal token cost? Will saved input become productive discovery or extra output? Can a source-grounded claim ledger improve completeness without task-specific hints? These require prospective evidence; no perfect-score or 15% claim is established here.
