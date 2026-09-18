# PersonaMem preparation and context result

Status: B1/B2 completed; B3/B4 blocked by measured context admission. Authority
effect none. No answer was generated or scored. This result does not measure ARE's
benefit and is not a failed-quality score.

## Sources and attribution

Source: Bowen Jiang and collaborators, *PersonaMem-v2: Towards Personalized
Intelligence via Learning Implicit User Personas and Agentic Memory* (2025),
[paper](https://arxiv.org/abs/2512.06688),
[dataset](https://huggingface.co/datasets/bowen-upenn/PersonaMem-v2).
Dataset revision: `ed956dea41521fc4499acbc63f966e0fd3c053ba`.
The pinned dataset card declares [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Retain this attribution and the description of changes when sharing derived data.
The eight selected examples are synthetic. No model outcomes guided selection.

[selection.json](selection.json) records exact source row indices, source links,
CSV SHA-256, row hashes, history hashes and disjoint persona IDs. The full text CSV
was streamed through a hash and selector; it was not saved. Only eight selected
rows and eight complete 32K history files were retained. Retained branch files are
approximately 4 MiB including tokenizer request evidence, within the shared cap.
The hydrate script enforces a 64 MiB CSV transfer cap and a 2 GiB disk floor.

Four mutually exclusive selection strata are assigned in this order:

1. A literal user instruction to forget or not retain a preference, grounded in the
   selected related snippet. This is our derived selection label, not a native column.
2. Native `who` other than `self`.
3. Native `updated=True`.
4. Remaining implicit preference examples.

The first two eligible distinct personas per stratum are assigned development then
reserved. No persona crosses the split. All four strata have two rows. Reserved
rows were prepared for split and provenance checks only; no reserved provider call
was made.

## Gold isolation and adapter

The upstream history files include an initial system message containing the expanded
oracle persona. Upstream inference at commit
[d29d91d016add354e459dfeb0d24af08bc402e2a](https://github.com/bowen-upenn/PersonaMem-v2/blob/d29d91d016add354e459dfeb0d24af08bc402e2a/inference.py)
loads that message unchanged. Our adapter explicitly removes this one oracle system
message and retains every user/assistant message, in order, with original content.
It appends the exact original query. Removed-message hashes are in the admission
record. No relevant-snippet selection, summarization, length cropping or injected
preference is used.

The input variant is `text-history-without-oracle-persona-system`. A future score
would be an adapted PersonaMem pilot score, not an official native leaderboard
score. `source/` and `evaluator/` are evaluator/provenance-only. The intermediate
`visible/` files preserve original history envelopes and therefore still contain
the source oracle system; they must never be forwarded directly. Only
`adapter.mjs:prepareTasks()` constructs the admissible generator messages.
The adapter never reads evaluator files, answers, preference labels, persona profile
columns or related snippet fields. Unknown system messages and image content fail
closed. The declared treatment exposure is unmeasured; no lesson is fabricated.

## Exact context result

[context-admission.json](context-admission.json) binds the real GLM tokenizer
receipts and request digests. Provider settings are owned by the coordinator's
shared provider. All four development tasks exceed the 7,168 input-token limit,
with 1,024 output tokens reserved for an 8,192-token window.

| Source row | Stratum | Provider input tokens | Admission |
| --- | --- | ---: | --- |
| 0 | Implicit preference | 31,629 | Blocked |
| 60 | Preference update | 31,844 | Blocked |
| 91 | Other-person attribution | 32,127 | Blocked |
| 107 | Do not remember | 32,078 | Blocked |

Four tokenizer requests were made. Zero generator, judge or extraction calls were
made. Tokenizer counts are measurements of candidate inputs, not consumed model
input/output generation tokens. B3 scoring calibration and freeze were not attempted
because B2 cannot admit these full histories under the current protocol.

## Checks and successor boundary

Run `node --test development/agent-reasoning-engine/planning/representation-preferences/benchmark-pilot-v2/execution/personamem/adapter.test.mjs`.
Four tests pass: disjoint source selection, exact turn/query preservation, oracle and
evaluator isolation, and provider-bound context rejection. The preflight script is
single-use: its provider refuses duplicate call IDs. Do not rerun to obtain a better
admission outcome. Preserve the measured result.

An independent successor can compare sequential ingestion at 8K. Freeze identical
chronological chunk boundaries and total source access for both arms; count all
history-processing model input/output tokens; define what each arm can retain
between chunks; test updates and forgetting without oracle preference extraction.
The unchanged bounded representation learner currently has no established semantic
persona extraction path. That capability must be a separate hypothesis and candidate,
not silently added to this pilot. A larger-window full-history study is a distinct
alternative and cannot be reported as the planned 8K result.

## Open questions

Which equal-access sequential-ingestion control is scientifically appropriate?
Can an existing production state path retain implicit persona evidence without
answer-derived labels? Which independently reviewed single-judge rubric and
calibration cases should a successor freeze? The coordinator owns those decisions;
none blocks the independent LongMemEval or original selectivity branches.
