# Parallel pilot results

The measured configurations do not establish a useful ARE memory improvement.
Selectivity semantic quality tied at higher token use. In the adapted LongMemEval
study, source-linked notes had lower task success and completion than ordinary notes.
PersonaMem's original protocol was blocked before generation by context and budget.

| Branch | Control | ARE treatment | Measured model tokens |
| --- | --- | --- | --- |
| Original selectivity episodes | 6/8 semantic passes; 8/8 completions | 6/8 semantic passes; 8/8 completions | 2,719 control; 3,340 treatment |
| LongMemEval sequential oracle adaptation | 6/8 task successes; 8/8 completed answers | 3/8 task successes; 7/8 completed answers | 73,106 control; 74,566 treatment |
| PersonaMem-v2 original all-history protocol | Not run | Not run | No generation usage; source admission evidence only |

These are different metrics and protocols; do not pool them. Four development
tasks per scored branch do not justify population, cross-model or release claims.
Reserved tasks received no live benchmark evaluation or outcome-based tuning.

## Categories and paired outcomes

Each LongMemEval category contains one development task repeated twice:

| Category | Control successes | ARE successes |
| --- | ---: | ---: |
| Preference | 2/2 | 1/2 |
| Knowledge update | 2/2 | 1/2 |
| Multi-session reasoning | 0/2 | 0/2 |
| Abstention | 2/2 | 1/2, including one failed slot |

Across eight matched task/repetition pairs: both succeed in three, control alone
succeeds in three, ARE alone succeeds in zero, and both fail in two. Repetitions
are not additional independent tasks.

For selectivity, appropriate application succeeds on 4/4 application opportunities
per arm. Blindly reviewed misapplication occurs on 1/4 suppression/override
opportunities per arm, specifically 1/2 explicit overrides. These AAR/MR-inspired
counts are supplementary; they do not replace strict structural or semantic scores.
Their derivation and exact output bindings are in [PAIRED-ANALYSIS.json](PAIRED-ANALYSIS.json).

## What the evidence shows

The [selectivity result](selectivity-v2/RESULTS.md) found no semantic improvement.
Its one extra strict structural pass occurred in a no-state condition, so it cannot
be attributed to the ARE projection. Both arms once ignored a current plain-text
override despite correct state suppression by ARE. Historical instructions remained
visible to the model. Treatment used 621 more tokens, approximately 22.8% more.

The [external results](longmemeval-sequential-v2/finish-independent-control/RESULTS.json)
used the actual ARE source ledger and separately recorded unverified model claims.
Both arms saw every dated source turn before answering from bounded notes. Treatment
used source-linked notes; control used ordinary notes. Task success counts correct,
completed answers against eight planned slots per arm. The failed treatment slot
stays in the denominator. Treatment used 1,460 more tokens, approximately 2.0% more,
despite not completing one task. The total is not an isolated marginal estimate of
reference overhead because completed work differs between arms.

The LongMemEval result is **amended descriptive evidence**, not a clean completed
preregistered run or an official benchmark score. The first sequential attempt
stopped after 5,301 tokens because a note exhausted its output cap. A versioned
compact-note protocol later stopped on a tokenizer network failure; a reviewed
suffix recovery repeated no completed generation. A treatment note then exhausted
its cap. The remaining independent control slot ran unchanged under an explicit
post-stop amendment. Final slot accounting: 15 completed answers, one failed answer;
61 successful generation calls, one failed generation and two dependent calls blocked.

All known LongMemEval branch usage is **152,973 tokens**, including the first failed
attempt, below its 204,800 cap. Individual blinded native-rubric judgments preserve
ambiguities about births versus adoption and a permissive abstention response.
No scorer or gold was changed after observing these answers.

Across branches, **159,032 model tokens are known from receipts**. Four earlier
selectivity/configuration diagnostic requests lack usage, so exact whole-episode
spend is unknown. The 32,768-token conservative allocation for those requests is a
budget policy, not measured spend. It must not be added to known tokens and presented
as an exact total. Tokenizer-only calls and offline review are separately identified.

The [PersonaMem admission](personamem/context-admission.json) measured 31,629–32,127
input tokens per task after removing the source's privileged persona summary.
Four traversals of these complete request histories total 510,712 input tokens,
before generated notes, answers or judges, exceeding the 204,800 branch cap.
This is a blocked evaluation, not a score of zero and not evidence against ARE.
The [successor investigation](personamem/SUCCESSOR-RESEARCH.md) distinguishes a larger
full-exposure study from a different, source-available retrieval study.

## Research decision

Do not retain these configurations as demonstrated improvements. Preserve the
negative outcomes and completion failures. Next hypotheses should distinguish:

- Relevant facts lost during bounded note generation.
- Source identifiers consuming note space without retrieving additional evidence.
- Current instructions conflicting with historical preferences.
- Query-time access to exact archived evidence versus summary-only answers.

These are hypotheses, not conclusions or permission to alter completed runs.
Any next experiment needs a reviewed question, control, token budget, source access,
evaluator, freeze and explicit link to the lighthouse/GLM/ContextBench objectives.

## Evidence and remaining work

Native observations and learning decisions exist for
[selectivity](selectivity-v2/observations.json),
[LongMemEval](longmemeval-sequential-v2/finish-independent-control/observations.json),
and [PersonaMem admission](personamem/observations.json).
[Work tracking](work-tracking/README.md) distinguishes historical stopped states
from successor evidence. The verified [D07/D08 successor v2](work-tracking/D07-SUCCESSOR-V2.md)
integrates the final LongMemEval observation: 30 nodes and 29 edges. The
[completion audit](COMPLETION-AUDIT.md) records each branch's disposition and the
limits of this pilot's closure. The [independent closure review](INDEPENDENT-CLOSURE.md)
verified that all finite pilot requirements are addressed, including the permitted
blocked PersonaMem outcome.

## Open questions

Will exact evidence recovery improve quality per token where bounded notes fail?
How much of the observed deficit comes from omission, source-link overhead or
output-cap failures? Should PersonaMem receive a separately approved larger
full-exposure budget or a distinctly named retrieval protocol? This pilot does not
resolve those choices or clear the separate ContextBench qualification milestone.
