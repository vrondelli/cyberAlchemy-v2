# G03 external memory populations — source feasibility audit

Status: **private research evidence, not a frozen campaign or a superiority claim**. Audited public release metadata and selected published Parquet files on 2026-09-29. No ARE or control generation, GLM request, scoring, or task selection was performed at that initial stage. The [G03 r6 result](G03-R6-RESULT-NOTE.md) remains a separate five-type LongMemEval-S result.

**Current-work pointer (2026-10-04):** This running feasibility log's
"Recommended next action" section predates later 500K r9–r12 development
and the [100K r13 reserved protocol](G03-BEAM-100K-R13-SOURCE-AND-LABEL-PROTOCOL.md).
R13 has 32/32 source-only selections and 64/64 sealed paired GLM answers,
but still has **zero sealed human label dispositions** and no valid accuracy
or superiority result. The two answer-blind reviewer forms, then the fixed
label seal and scorer transfer, are the current r13 critical path; do not
restart an r4 answer pilot based on this older log.

## What changed the successor choice

The official [MemoryAgentBench repository](https://github.com/HUST-AI-HYZ/MemoryAgentBench) describes newly constructed EventQA and FactConsolidation tasks, but its published [dataset revision](https://huggingface.co/datasets/ai-hyz/MemoryAgentBench/tree/7ea066982b140a19337e17e60d45d4076e042faf) has much less independent context diversity than its question count suggests. The Accurate_Retrieval file (SHA-256 `56c3cd80fb6731a3e53cd1a6be3148f54df60ff2d290ee50e28f8acebf9655c1`) contains 15 EventQA rows, 100 questions each, across `eventqa_full`, `eventqa_65536`, and `eventqa_131072`. For each of five row positions, the shorter context is contained in the longer context and the first 1,000 characters match across all three variants. Thus these are **five base-context families**, not 15 independent histories. The Conflict_Resolution file (SHA-256 `24d5c3f09ce0ce15625cb9f8a98f44f0d864ca6c94d7b4ad04eb697ca3a5ff45`) contains eight FactConsolidation rows, 100 questions each: `mh` and `sh` share the exact context at each of four lengths, leaving **four distinct published contexts**. Question IDs are reused across EventQA rows within each length variant, so bare `qa_pair_id` is not a globally unique exposure key. These tasks remain useful as mechanism diagnostics, but treating their 2,300 questions as independent observations would overstate precision.

The official [BEAM release](https://github.com/mohammadtavakoli78/BEAM) is a stronger prospective external-validity candidate. Its [published dataset revision](https://huggingface.co/datasets/Mohammadta/BEAM/tree/3205395e897e7318c7b094ef4e6047b9b82dbb03) has three Parquet splits:

| Split | Published rows | Audited probes | Distinct conversation IDs *within split* | File SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `100K` | 20 | 400; 40 per ability | 20 | `c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace` |
| `500K` | 35 | 700; 70 per ability | 35 | `af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122` |
| `1M` | 35 | 700; 70 per ability | 35 | `41b5acbbb55a586b1305514ef9d9fb03365d9b3331b598a1c2dd7603d93ef533` |

The 90 rows have 1,800 probe occurrences and 1,799 distinct question-text hashes. The ten abilities are abstention, contradiction resolution, event ordering, information extraction, instruction following, knowledge update, multi-session reasoning, preference following, summarization, and temporal reasoning. Each conversation has two probes per ability. The three splits contain **75 distinct `(seed category, seed ID)` groups**, not 90 unique seed groups: ten groups recur across splits (five in all three, five in two), although no first chat turn matched exactly and only one question-text hash overlapped between the 500K and 1M splits. Numeric `conversation_id` values also recur across splits. For population-level inference, use the seed group as a conservative cluster or prospectively select one variant per repeated seed; never treat a bare conversation ID as global. A first bounded study could use the 20 unique-seed `100K` conversations, but its uncertainty must be clustered by conversation (20 units, not 400 independent units). The larger 75-seed population is a later, higher-cost extension, not an automatic addition to a first cohort.

## Adapter and claim implications

BEAM is **not** LongMemEval-S. Its public `probing_questions` field is a Python-literal-formatted string, not JSON, and contains the question alongside answer/reference and rubric fields. A G03 successor adapter must parse it without executing it, export only source history plus question to the running arms, and keep references/rubrics evaluator-only. The ten ability types have heterogeneous answer contracts: factual answers, abstention, instruction/preference compliance, and summaries cannot all be judged by a single exact-match rule without validation. Freeze an ability-specific scoring contract, invalid-judge handling, and a conversation-clustered paired analysis before model dispatch. Preserve the same GLM model and matched comparator if the intended claim is about ARE's memory projection; any changed baseline or context budget names a different study. The source README describes code as MIT and the benchmark data as CC BY-SA 4.0; attribution and downstream redistribution must be checked before a public artifact package.

This audit examined published metadata, identity keys, context hashes/nesting, and probe structure. It did not validate BEAM's answer quality, judge calibration, cost, licensing interpretation, or fit with the current 8K treatment/control protocol. No BEAM question or reference was sent to a model. The selected release may have source-history and synthetic-generation correlations beyond the conservative seed grouping observed here.

2026-10-02 source-only follow-up: the pinned `100K-00000-of-00001.parquet` was downloaded to private WSL storage at `/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/` and matched the published SHA-256 `c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace`. A no-generation, in-memory projection check parsed the probe field with `ast.literal_eval`, never `eval`, across all 20 rows: **20 unique `(seed category, seed ID)` groups, 5,732 ordered chat turns, 400 nonempty and text-unique questions, 40 questions in each of ten abilities, and no missing rubrics**. Its model-visible candidate shape admitted only conversation key, chronological `{role, content, time_anchor}` turns, and `{id, ability, question}` probes; answer/reference/rubric fields stayed outside that shape. This establishes a feasible source/reference separation pattern, not a validated adapter, scorer, 8K request schedule, frozen BEAM campaign, or model result. The actual implementation must still enforce the allowlist at every emitted request boundary.

An evaluator-side schema pass found that all 400 rubrics are nonempty lists of strings, but reference fields differ by ability: `answer`, `ideal_answer`, `ideal_response`, `ideal_summary`, or `expected_compliance`. Rubric lengths range from one to nine criteria. An exact-match scorer over a single field would silently mishandle several abilities; a prospective BEAM protocol must map each ability's reference and rubric contract and validate the judge on held-out calibration examples before any model dispatch.

2026-10-02 no-generation source-boundary preflight: the pinned private `100K`
file passed the [allowlisted adapter check](../research/g03-beam-r1/preflight-beam-100k-source-r1.py)
(source SHA-256 `81553b9bf612006e52f375ce5dd3bfc12ce108e48b57df45c0bdaf578fc2b498`).
It independently checked 20 unique seed keys, all 5,732 sequential,
alternating-role, nonempty turns, 400 unique nonempty questions, two questions
per ability per conversation, and a nonempty ability-specific reference and
rubric for every probe. The only constructed model-visible shape contains a
conversation key, ordered `{role, content, time_anchor}` turns, and
`{id, ability, question}` probes; the receipt stores hashes and counts, not
questions, history, answers, or rubrics. The private receipt SHA-256 is
`9b90855f33c62a81679f671f3871da2cbfb30ec3bc4cd7161af96b043205d735`
at `/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-PREFLIGHT.json`.
This did **not** select or freeze a BEAM cohort, send a model request, qualify
the 8K tokenizer schedule or two-arm projection, or validate the heterogeneous
judge. It cannot support a superiority claim.

A separate [source-size/runner compatibility census](../research/g03-beam-r1/audit-beam-g03-compat-r1.py)
(script SHA-256 `7a6a73bddad2e4ad6a68398f86325d5ceb48cc915f177344349c25dcb28e29e5`;
private receipt SHA-256 `80bd8aa76054e0adffb37881086b806a04f043cb89d292334999de5a6bed07c0`)
bound the pinned r7 adapter, runner, and chunker source hashes without model
calls. BEAM `100K` contains **12,232,071 chat-content characters**. There are
**419 individual messages longer than 5,000 characters** in 19 of 20
conversations; two messages exceed 20,000, with a maximum of 348,853.
The unchanged r7 treatment selects whole turns under a 5,000-character
projection, so such messages cannot be selected whole. R7's control planner
allows at most eight within-turn split attempts; the 348,853-character turn
requires a prospective compatibility check and likely a different bounded
partition policy. This is not an exact tokenizer failure finding.

If ingestion chunks are actually capped at 16,000 content characters, the
source alone imposes a **774-chunk lower bound** across the 20 conversations.
Rebuilding the same notes separately for each conversation's 20 probes would
raise that character-based lower bound to **15,480 chunks**, before answer or
judge calls. The current r7 planner uses 16,000 characters as a proposal
heuristic, not a hard cap for an oversized single turn, so these figures are
planning bounds rather than observed or exact-token call counts. A prospective
BEAM comparison should qualify lossless within-turn partitioning and build
control notes once per conversation, then share those fixed notes across its
20 questions with explicit cost allocation. It must not silently treat 400
questions as independent clusters or let a probe influence the shared notes.

There is also a semantic mismatch: the pinned r7 ingestion prompt calls
historical conversation *evidence, not instructions*, while BEAM includes
instruction-following and preference-following probes. A BEAM-specific common
answer/ingestion contract must distinguish user instructions and preferences
to remember from unsafe historical prompt injection, apply it symmetrically
to both arms, and freeze it as a changed study. This is an inference from the
two source contracts, not a measured effect on answers. No current G03 r7
code or result is retroactively changed.

A prospective [shared-ingestion source planner](../research/g03-beam-r1/plan-beam-shared-ingestion-r1.py)
(source SHA-256 `f84c29ef504fb96a8aa7f5219e3d72010ea9f2f9a9fd80d7d2133fcce41740e9`)
now partitions every conversation turn into UTF-16-character-bounded,
source-indexed fragments, packs fragments into bounded history chunks, and
reconstructs all original content and turn roles/anchors from the packed
chunks. Its private r2 receipt SHA-256 is
`c8b1867df27f0eff76b375ace768f374aa94cfd6f41d8f7b5f3e608530414658`
under `/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/`;
the earlier r1 receipt is retained but superseded because it overstated
matched-arm binding. The checked source plan contains **5,770 fragments** for
5,732 turns, **950 one-pass control chunks** across 20 conversations, and at
most 70 chunks for any one conversation. Rebuilding the same plan separately
for each of 20 probes would require 19,000 chunks. The control chunks are
constructed before parsing probe questions and contain no probe or evaluator
fields; hashes bind the history and question identities available to both
future arms. A Unicode/escape fixture also reconstructed losslessly. This
does **not** establish actual 8K token admission with system prompt, retained
notes or output reserve; the treatment projection, common answer prompt,
judge, model-call budget, and cost allocation remain undefined. No model call
or BEAM cohort selection occurred.

For strict source/reference separation in the next candidate, a new
[allowlisted extractor](../research/g03-beam-r1/extract-beam-source-only-r1.py)
(source SHA-256 `5b3754aa53be87be82838da0f56d86c702a30ae19e65c6b6662d3742d9e07511`)
staged only conversation keys, `{role, content, time_anchor}` turns, and
`{id, ability, question}` probes in a private 12,865,696-byte JSONL file.
Its data SHA-256 is
`bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d`
and receipt SHA-256 is
`d6ded2011d474a655d934ce3ccd8f80bee7472f3c5b39f9bdd3d9fa58c5f3296`.
The extracted schema was separately checked as 20 rows, 5,732 turns, and 400
probes with no answer or rubric keys. It is private source staging, not a
model request or cohort freeze.

A prospective [treatment projection candidate](../research/g03-beam-r1/plan-beam-treatment-projection-r1.py)
(source SHA-256 `221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087`)
then read **only** that source-only JSONL and the prior source-plan receipts.
It losslessly formed 9,106 at-most-2,500-UTF-16-character fragments and ranked
them by question-term rarity, then user role and recency, under a 5,000-UTF-16-
character JSON projection ceiling. Its private receipt SHA-256 is
`061452525015aa9a274fa70ef87da957b7e2088cf1183b342353ad726528476c`.
Across 400 probes, it selected 1,745 fragments in total, 2–16 per probe;
the maximum serialized projection was exactly 5,000 UTF-16 characters. All
questions had at least one lexical source match. This is **not** evidence that
the matched fragments contain the right answer: no reference field, native
metric, judge, model answer, or independent cohort was accessed. The policy
changes the r7 whole-turn strategy to fragment ranking and must be evaluated
as a separate BEAM study, not pooled with LongMemEval-S r6/r7.

The first evaluator-only development check is now sealed and **negative as a
ten-ability retrieval qualification**. A [source-only split](../research/g03-beam-r1/seal-beam-development-split-r1.py)
(script SHA-256 `521cf4840ef52fab73705dc56355cc5fc466b37f6ba6062cb81dc99a35693063`;
manifest SHA-256 `3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e`)
put four conversations/80 probes in development and reserved 16/320 from
this diagnostic. `Coding:1` was forced into development because one row's
citation-schema examples had already been inspected; only three additional
development conversations were chosen by the fixed source-key hash. The
[candidate-selected turn IDs](../research/g03-beam-r1/seal-beam-dev-selections-r1.py)
were sealed without evaluator fields and matched the prior 400-probe
projection root before the label audit (selection SHA-256
`129082c45b21f6fa826dfb6fad78a9c418ea3f6a864ecbff4dfd781160a7f20a`).

The [evaluator-only citation audit](../research/g03-beam-r1/audit-beam-dev-citation-reach-r1.py)
(script SHA-256 `53c964fb90ef5bed295308aa22384e6d304b3e5ac58d5947c5fd9ae1a21caa`;
private receipt SHA-256 `5854319b0abeb445023f877868ac5f5a2899997f76c4ce9ef74120de087534a0`)
inspected citation IDs only for those four development conversations. Of 80
probes, 70 have nonempty citation metadata: eight abstention probes have none,
and two summarization probes have empty lists. The candidate selected at
least one cited turn on **37/70** measurable probes, all cited turns on
**15/70**, and **47/208** distinct cited turns overall. Event ordering was
**0/8** hit-any; summarization was **2/6** hit-any with only **2/52** cited
turns reached. The first audit attempt stopped on the unexpected empty
summarization lists before writing a receipt; the versioned script then
classified them as unmeasurable and completed. These citations may be neither
exhaustive nor sufficient for a correct answer, so this is not native
accuracy. It is enough to reject direct holdout dispatch of this unchanged
candidate and direct attention to multi-event coverage. The 16 reserved
conversations were not evaluated in this audit; no model call or score was
made. A future holdout still needs an approved, frozen protocol and should
not silently treat the four development conversations as independent evidence.

A subsequent [evaluator-only event-rank diagnosis](../research/g03-beam-r1/diagnose-beam-dev-rank-r1.py)
(script SHA-256 `16db2678c9ec3987aa08c2ebb798a0728c1c8861f32fc332e4e76181e9f9cbe0`;
private receipt SHA-256 `f2a50b17070dc037b0b3171e559cae43dacbc56332527a69d5a885d615110fb7`)
used the same four sealed development conversations and citation IDs, with no
reference answers, reserved evaluator values, or model calls. **26/39** cited
event-ordering turns contain at least one question term, but only **2/39**
have any fragment in the frozen ranker's top 10 and **4/39** in its top 100;
the median cited turn's best fragment rank is **218** (range 4–529). The
actual 5K projections reached **0/39**, as independently recorded above.
Top-K is a diagnostic ranking, not a feasible 5K projection, and citation
turns are not proof of answer-bearing text. This narrows the next mechanism
work to multi-event candidate coverage and ranking; simply enlarging the
fragment shortlist is not an established fix. The 16 reserved conversations
remain outside this diagnostic.

The first changed [event-ordering source-only candidate](../research/g03-beam-r1/plan-beam-event-projection-r2.py)
(source SHA-256 `2cad2660d5c38f22997b8c55dccdc45abbcb2a0542d3e8483d61f9ed905c4297`)
uses exact 420-code-point-or-shorter excerpts around topical question terms,
selects one anchor from each occupied temporal bin before ranked fill, and
keeps the r1 projection policy for the other nine abilities. It sealed
400/400 projections under the 5K UTF-16-character ceiling, emitting selected
identities only for the four development conversations before reading r2
citations (private source-only seal SHA-256
`6742812fb55d609326bcca3f2228a321da1c0ca79b21e43dfa5029e0daea019a`).
The [evaluator-only r2 comparison](../research/g03-beam-r1/audit-beam-dev-event-r2.py)
(script SHA-256 `16a82264a9eedccc1877629aa66088ae5d0af248a687b96c7f74de4d5647fe4c`;
private receipt SHA-256 `95df22705ccf93595dff1c04ac361b7c73f9c6482272f6917d4391a9f44d2d31`)
reconciled the old **0/39** event cited-turn reach and found **11/39** for r2,
with hit-any improving from **0/8** to **6/8** development probes. It found
**0/8** hit-all, and r2 selected 113 distinct turns across those probes versus
27 under r1. The other nine abilities retain exactly the r1 development
selections and projection hashes. This is a development citation-turn gain,
not proof that the short excerpts contain answer-bearing details or that a
model can produce correct ordered answers. The 16 reserved conversations
remain unevaluated; exact 8K wire, common prompt, rubric/judge reliability,
paired native quality, cost, and a frozen campaign are still missing.

An exact source-only [development event wire builder](../research/g03-beam-r1/build-beam-dev-event-wire-r1.py)
(script SHA-256 `f4ec4b06fb1d2d727fb570a67b87cc0a3429fdd5662dd5c6e6398218cea91569`)
reconstructed the eight r2 development event projections from their sealed
source offsets, verified each projection hash, and bound a common event-answer
prompt without evaluator fields. The private eight-wire input SHA-256 is
`2314e2691f61aee795e3e45ef60ae420a75a00c43f636449b942a23dc4c55a6a`.
After checksum-matched VPS transfer, the [tokenizer-only preflight](../research/g03-beam-r1/probe-beam-dev-event-wire-r1.mjs)
(script SHA-256 `1d0a3bfaca1b9ecf6f160f23137146583c0e0396310662e99d4f1cf4aebe86cc`)
made eight same-account GLM-5.3-Flash tokenizer requests and **zero** generation
calls. All eight development prompts were **1,239–1,357 input tokens**, leaving
more than 512 tokens below the declared 8,192-token window. The sanitized
receipt SHA-256 is
`d8e19153ed0b484f3acf3b88a939ed55b88cc342522c117d8c17e046f8c4df5b`,
retained on the VPS at `/opt/are/evolution-runtime/g03-beam-dev-wire-result-r1/RESULT.json`
and checksum-matched under the private WSL source archive. An independent
request-hash join matched all eight tokenizer calls to the sealed wires. This
qualifies only the **input side** of the event-ordering development answer wire;
it does not
qualify the other nine abilities, control-arm shared ingestion, end-to-end
cost, output validity, answer accuracy, judge reliability, or a BEAM campaign.

The first bounded [development generation run](../research/g03-beam-r1/run-beam-dev-event-r1.mjs)
(runner SHA-256 `26e56ce32e05c5f1a7a4922a34309a8e3a7c9dbfa990ef2853e3e0a84f23d246`)
froze the eight already-exposed wires before provider dispatch at private
`FREEZE.json` SHA-256 `344b49bedab95f2173e46512b8d590fbb142c8e0e1604420103bcd96540c4fab`.
All **8/8** calls returned nonempty answers and settled usage with zero retries;
`RUN-RESULT.json` SHA-256 is
`125770dbffe18cb16bf9822da995daf48225ee3b5a38a64e4283a94963c77c94`.
Raw receipts are checksum-matched in the private WSL archive. The run used
10,558 prompt and **25,097 completion tokens** (22,532 reported reasoning
tokens) across the eight calls, or 1,343–5,495 completion tokens per call.
This exceeded the requested 512-token output reserve on every call, although
each observed prompt-plus-completion total stayed below 8,192. The request
used `max_completion_tokens`, whereas Z.AI's [current chat-completion API
reference](https://docs.z.ai/api-reference/llm/chat-completion) documents
`max_tokens` and GLM-5.3-Flash's forced thinking with `reasoning_effort`.
The mismatch is an observed protocol failure and a plausible parameter cause,
not proof of provider behavior under a corrected request. R1 is an exposed
development diagnostic only; it cannot qualify the intended 512-token budget,
paired cost, answer quality, or a superiority claim. Do not silently repair
its frozen requests or pool a corrected successor with it.

After all eight responses and usage receipts were sealed and cold-copied, an
[evaluator-only review packet](../research/g03-beam-r1/prepare-beam-dev-answer-review-r1.py)
(script SHA-256 `e19f7360658850307fcbcd6ed70fa69a2026b21cbf29eca5cad50d9efd3c3ab3`;
private packet SHA-256 `3273a0dc817befc46da16e67ce46a3166d54de06788bf47384e2633b1f334f00`)
joined only the four development conversations' final answers, questions,
ordered reference items, and rubrics. It exported no reasoning content and no
reserved evaluator values. A separate reviewer agent examined that packet:
all **8/8** answers had the requested number of numbered entries, but **0/8**
reproduced the complete reference sequence, and every answer added commentary
despite the only-items instruction. The Carla example was closest but still
merged one expected item and substituted another. This is a qualitative,
unblinded exposed-development judgment, not a calibrated native BEAM score.
Combined with the output-budget failure, it **rejects r2 for direct holdout
promotion**. The next mechanism must improve actual sequence evidence and
answer extraction, not merely citation-turn recall or excerpt count.

A separate, frozen [one-call output-cap calibration](../research/g03-beam-r1/probe-glm-output-cap-r1.mjs)
(script SHA-256 `dd19ba43b11076ddb7af7ae58f98cc443d395901153f5dde85d6e4e0c30dd424`)
used the **same first already-exposed development question** and source-only
messages, changing only the provider parameters to the documented
`max_tokens: 512`, `reasoning_effort: low`, and explicit thinking enabled.
The zero-retry HTTP 200 call returned a nonempty answer with **118 completion
tokens and zero reported reasoning tokens**, below the 512-token cap. The
private `FREEZE.json` and `RESULT.json` SHA-256 values are
`1be82a22b21d7aa94a8977dafc59e5fb39127159f75170d5758a7c0af94f7262`
and `92bdd16fba2b5310c506ae8a2c3cf3727eaf8a0c5395a4cac5bb6ccd5a616e2e`;
VPS and WSL raw receipts were checksum-matched. This **one-call calibration**
does not establish all-request cap reliability, answer quality, or a corrected
eight-question result, and it cannot be pooled with the earlier frozen run.

A [source-only r3 event timeline candidate](../research/g03-beam-r1/plan-beam-event-projection-r3.py)
(script SHA-256 `60e3b66bfe6438b31e2c7d8c191fd9bc137107ac37029c962380389340f534e2`)
was sealed before its evaluator-only development citation audit. It uses
topical user-turn anchors across eight temporal bins, then nearby user turns,
with a 14,000 UTF-16-character evidence ceiling. The private source-only
selection receipt SHA-256 is
`c8deb9446fef6ea40df1e0b8d07f5db2bddb6e608d39c662b51553d4fb35675c`.
The [r3 audit](../research/g03-beam-r1/audit-beam-dev-event-r3.py)
(private receipt SHA-256
`6129188d840396d97df90f4a5d9bc2d75989267cb6d4b170c516797354cb4e01`)
found **19/39** cited event turns versus r2's **11/39**, with at least one
cited turn reached in **8/8** questions and all cited turns reached in **1/8**.
This remains an exposed-development *retrieval* diagnostic; more snippets can
add distractors, and no answer-quality gain follows from citation reach alone.
The exact source-only r3 [wire builder](../research/g03-beam-r1/build-beam-dev-event-wire-r3.py)
produced eight requests (private receipt SHA-256
`22b0e2144aa071a6bd13e7bcb7a781fa0cd9cf38d2a67bec1703dadb87f591a2`)
with the calibrated `max_tokens` key, low reasoning effort, and 1,024-token
output reserve. Its [live tokenizer preflight](../research/g03-beam-r1/probe-beam-dev-event-wire-r3.mjs)
passed **8/8** exact development wires at **3,450–3,648 prompt tokens**;
all fit the 8K window with the 1,024-token reserve. The private VPS result and
WSL cold copy matched SHA-256
`85fe045ba30787db1ea057334a012048fcd60dc289f09aa122b826c762ac2140`.
No generation occurred in that preflight.

The separately frozen [r3 development generation](../research/g03-beam-r1/run-beam-dev-event-r3.mjs)
completed **8/8** nonempty final answers with zero retries and normal stop
reasons. It used **28,474 prompt tokens and 2,713 completion tokens** in total,
including 513 reported reasoning tokens; every individual completion stayed
within the 1,024-token cap and prompt-plus-completion stayed within 8K.
Its private `FREEZE.json` and `RUN-RESULT.json` SHA-256 values are
`c8d58b888183a90c74202ce97b6c05690b3dfc219e313a76279495235d2a47c7`
and `edc24105b16389b43eafadc818f2fadc0f314c7f61426e9ca1f96c77f72cb286`;
all ten raw VPS files have checksum-identical WSL cold copies. A
[final-answer-only review packet](../research/g03-beam-r1/prepare-beam-dev-answer-review-r3.py)
(private SHA-256
`57609be2256463ea78ff4d47202d9844722ac6dbb7ade81157fada5cd3eff10d`)
contains only the eight development answers and references, no reasoning
content or reserved evaluator data. A separate reviewer agent examined only
that packet and found **0/8 complete reference sequences**. All eight answers
had the requested number of numbered items, but all added text beyond the
only-items instruction. The Carla case broadly matches the first four stages
but substitutes webinar results for the required engagement and incentives
stage; other answers omit, reorder, or replace multiple required stages.
This is not a calibrated native BEAM score, but it rejects r3 for direct
holdout promotion despite higher cited-turn reach and corrected output cost.
The r3 failure is not only retrieval: its Carla wire included the full source
text of all six cited turns, including the engagement/incentive messages at
turns 230 and 232, yet the answer substituted a later webinar-results event.
The other probes still missed 20 of 39 cited turns overall. A source-only size
check on the four development histories found 94, 130, 172, and 186 user turns;
their first 120 characters total roughly 10.9K, 15.3K, 20.2K, and 21.4K
characters before framing. This makes a compact complete user-turn timeline
worth testing under the *actual* 8K tokenizer, with focused full excerpts
and a stricter sequence-only prompt. It is a new candidate, not a modification
of the frozen r3 result or a guarantee of quality.

The separately sealed [r4 source-only chronology candidate](../research/g03-beam-r1/plan-beam-event-projection-r4.py)
covered all 400 structural probes while emitting selection identities only
for four development conversations. For event-ordering, it included a prefix
from **every user turn** plus up to 18 longer, temporally spread topical
excerpts; all eight exposed development projections stayed below 24,000
UTF-16 characters. Its private selection SHA-256 is
`f36e2267c61d491e49356a5449f5adb179f6f7a53305ad2abc57fc0c22e4f899`.
The [exact wire builder](../research/g03-beam-r1/build-beam-dev-event-wire-r4.py)
reconstructed and hash-checked all eight source-only projections (private
wire SHA-256
`3466d14ed43f10698b4dd383b974ac965d805152378a3e013d9a897d9859e8b8`).
The live [tokenizer check](../research/g03-beam-r1/probe-beam-dev-event-wire-r4.mjs)
passed **8/8** at 4,281–6,029 input tokens plus 1,024 output reserve
(private receipt SHA-256
`3f2788bb69ada156e499ee123bc746d4957fe93835393d7e85b869aa6d52cf88`).
The zero-retry [development run](../research/g03-beam-r1/run-beam-dev-event-r4.mjs)
completed **8/8** with normal stop reasons, **43,176 prompt / 2,453
completion tokens**, 477 reported reasoning tokens, and each request within
8K. Its private `FREEZE.json` and `RUN-RESULT.json` hashes are
`729f60cd49a58332e61695e0344271eda656ff4b8f7ccd4ff5299e6ce8bb104c`
and `c2895a0f054ab91939af31552070f0955e87bad0669fb1e238e32b8bc4920f4e`;
all ten raw files were checksum-matched to WSL cold copies. The
[final-answer-only development packet](../research/g03-beam-r1/prepare-beam-dev-answer-review-r4.py)
(private SHA-256
`cacda6377089f60a2d8faec04e6486ea10579d72962d408b62ee5e15262d9db2`)
exported no reasoning content or reserved evaluator values. A separate
reviewer found **0/8** complete reference sequences, although the stricter
prompt yielded the requested number of numbered items with no extra
preamble or closing note in all eight. R4 improved output-format compliance,
not sequence accuracy, while raising input cost from r3's 28,474 to 43,176
prompt tokens. It is rejected for direct holdout promotion. The next mechanism
must identify question-relevant stages across history rather than merely
presenting more history to one answer call.

An r5 **question-conditioned extraction pilot** tested that mechanism on only
two previously exposed event-ordering questions from one development
conversation. The [source-only builder](../research/g03-beam-r1/build-beam-dev-event-extraction-r5.py)
losslessly divided all 172 user turns into six chronological chunks and made
one extraction request per chunk and question: 12 calls, no evaluator fields.
The sealed extraction wire SHA-256 is
`36e61d303c048982777dda0d154e3b94058ebb2c4dca354b1df64f0f6187e576`.
The [tokenizer preflight](../research/g03-beam-r1/probe-beam-dev-extraction-r5.mjs)
admitted 12/12 with 428–2,203 prompt tokens and a 512-token output reserve
(private result SHA-256
`5d714b76f0d91349d6548863d06ce9749ef77f680327edd6aba1d6bc6518f48d`).
The zero-retry [extraction run](../research/g03-beam-r1/run-beam-dev-extraction-r5.mjs)
completed 12/12 normal stops, using **22,388 prompt and 2,990 completion
tokens**, including 364 reported reasoning tokens. Its private `FREEZE.json`
and `RUN-RESULT.json` SHA-256 values are
`e8948d58d0057c01678c5a5ca56b1500d00afd246484a4efd38efb8ff0eb5be1`
and `0cd39e4c40014c6f734f9006494a9f6d9448fc4134fecc7812f2fa16830bbbdd`;
all 14 raw files were checksum-matched to WSL cold copies.

The [synthesis builder](../research/g03-beam-r1/build-beam-dev-synthesis-r5.py)
validated source-turn citations in those notes and sealed two answer-only
wires at SHA-256
`2073573b00f4202ab678c4651d148080b76565052daa3ed16a3bf8ed45ed8960`.
The [synthesis tokenizer](../research/g03-beam-r1/probe-beam-dev-synthesis-r5.mjs)
admitted both at 754 and 2,298 prompt tokens plus a 1,024-token reserve
(private receipt SHA-256
`ec949b9a81eceb5f2151b781c6881aca355acaf0edd8dd7773073bdc128c63a0`).
The zero-retry [synthesis run](../research/g03-beam-r1/run-beam-dev-synthesis-r5.mjs)
completed 2/2 normal stops with **3,052 prompt and 416 completion tokens**,
including 66 reported reasoning tokens; its private `FREEZE.json` and
`RUN-RESULT.json` hashes are
`e8f58f3a13f14f981bda0e104a24200b8a65d147d585eaabe8006c91d6d0f07a`
and `716f9238bedbc9f3f7e2dd90ce332e6e58a085c001c32bcec8f7bc94a02b7a38`.
All four raw files are checksum-identical on VPS and WSL. The full two-question
pilot cost **14 calls, 25,440 prompt and 3,406 completion tokens** (430
reported reasoning tokens); synthesis-only cost would understate it.

A [final-answer-only r5 review packet](../research/g03-beam-r1/prepare-beam-dev-answer-review-r5.py)
(private SHA-256
`b3c7a08bf8e82f4544e4ba92649ac29d171fe23118450ceea35fd65d9e3f29a7`)
paired those answers with only their already exposed development references,
exporting no reasoning or held-out evaluator values. Both had five numbered
items, but **0/2 reproduced the complete reference sequence**. The Carla
answer replaced the fifth engagement/incentives stage with later webinar
results despite extraction notes containing the relevant turns. The
writing-journey answer included first-draft confidence but missed the
workshop nerves, workshop feedback, and revision-planning sequence. This is
an unblinded qualitative development comparison, **not a calibrated native
BEAM score**. R5 is rejected for direct holdout promotion: staged extraction
did not solve event selection and substantially increased cost.

A subsequent [evaluator-only citation-order audit](../research/g03-beam-r1/audit-beam-dev-event-order-integrity-r1.py)
of all eight event-ordering probes in the four **already exposed** development
conversations found **one reference with an inverted source-turn order**
(private receipt SHA-256
`e6a30a96b8ceddc0578ef2786e26d96b2cc2b794bb0432df510aad0d34227ddf`).
The writing-journey reference explicitly lists source turns
`6, 82, 182, 238, 84`; its fifth stage, revision planning, is indeed at
user turn 84, before the workshop nerves at turn 182 and workshop feedback
at turn 238. Thus a source-chronological answer cannot satisfy that reference
order. The r5 **0/2 reference-match count remains factual**, but it must not
be interpreted as two clean model failures; the r2–r4 **0/8** counts also
contain this same inconsistent development item. This audit did not read any
of the 16 reserved conversations' evaluator values. It is a label-integrity
diagnostic, not permission to remove an unfavorable case after seeing scores.

A separate [targeted temporal-reference arithmetic audit](../research/g03-beam-r1/audit-beam-dev-temporal-labels-r1.py)
used only the same four exposed development conversations, their cited source
turns, and the pinned evaluator rows (private receipt SHA-256
`1270c7c44fde0b8e74a333b7b278457f55adf45232242b1acdfb4f5afe14547d`).
It confirmed **at least two flawed references among eight temporal-reasoning
development questions**. One says January 15 to March 15, 2024 is “exactly
4 weeks,” but the dates are **60 days** apart. Another asks for time from an
April 2 challenge start to completion of a second challenge on May 25, yet
answers **38 days** by using that challenge's May 10 *start*; the asked interval
is **53 days**. These are two selected falsifications, not an exhaustive audit
of the other six questions. No model call or held-out evaluator read occurred.
Temporal reasoning cannot be treated as a clean objective fallback without a
predeclared label-integrity and adjudication protocol.

For a different, narrower prospect, the **first information-extraction
question in each of the 20 source-only conversations** defines a reproducible
one-per-conversation candidate. Most are short factoids, but the source-only
Math question is broader; this is not yet a uniformly factoid-scored set.
In the four exposed development conversations, all four short
references are directly supported by their cited user turns. The original
source-only ranker selects the cited turn in **3/4**, but for the fourth
(first-sprint end date) it selects the immediately following assistant turn,
whose first fragment explicitly says the same March 29 date. Thus citation
reach is not identical to answer-bearing evidence in this slice.

The [source-only development wire builder](../research/g03-beam-r1/build-beam-dev-factoid-wire-r1.py)
then reconstructed those four exact sealed r1 projections without reading
evaluator values. Its private four-wire SHA-256 is
`5d667fc5a53cba25a735077fc326a5f53ae7b7c4d71b7852f9c6cb4c635a654e`.
The [live tokenizer preflight](../research/g03-beam-r1/probe-beam-dev-factoid-r1.mjs)
passed **4/4** exact wires at **1,188–1,348 input tokens** plus a 512-token
output reserve (private result SHA-256
`882e260bc03a10795803426700b6265ddba82f63a34e080c29201caa859a2279`).
The zero-retry [development generation](../research/g03-beam-r1/run-beam-dev-factoid-r1.mjs)
completed **4/4** nonempty normal-stop answers within 8K, using **5,079
prompt and 84 completion tokens** (18 reported reasoning tokens). Its
private `FREEZE.json` and `RUN-RESULT.json` SHA-256 values are
`533f7ccab42cd57beb248f52c9d529ec27a2484b20a2bd3a39805deff3a84ed4`
and `f5d568e4aa32229533733ad3e5a27adc5a1ddb2373057d18de2a01537a5d5618`;
all six raw run files and five tokenizer files have checksum-matched VPS/WSL
copies. A [final-answer-only review packet](../research/g03-beam-r1/prepare-beam-dev-factoid-review-r1.py)
(private SHA-256
`9972cf51d01ee30cf94ba80f061d23041a4369c3de9b85f505aff714be85f771`)
paired only these four exposed development answers with their references,
exporting no reasoning or held-out evaluator values. Unblinded qualitative
inspection found the expected date or age-and-college fact in **4/4** answers.
This is a promising **development feasibility signal**, not a calibrated
native BEAM score, an independent holdout result, or superiority. It also
does not establish quality on the broader first-question population,
especially its more complex Math case. A predeclared semantic factoid scorer,
matched comparator, source/label integrity checks, and a separate freeze are
still needed before reserved conversations can be used for confirmation.

A conventional [BM25 control plan](../research/g03-beam-r1/plan-beam-factoid-bm25-control-r1.py)
was then sealed **source-only** for the same first information-extraction
question in all 20 conversations, using the same 2,500-character fragments,
5,000-character projection ceiling, and user/recency tie-breaks; only the
ranking formula changed to BM25 (`k1=1.2`, `b=0.75`). Its private source-only
receipt SHA-256 is
`fe543210a8e29a4ad5d3742d3046775d6aba2551ea747e18f32b1ef49b75ac89`.
The [separate evaluator-only development citation audit](../research/g03-beam-r1/audit-beam-dev-factoid-bm25-r1.py)
found **4/4** cited user turns selected (private receipt SHA-256
`2553ba8463f0568bdaf00361dc7c43eb294f8618e48a0f4cab30164a043882eb`),
versus 3/4 cited turns in the r1 treatment selection. Neither count measures
answer quality, and treatment's fourth projection contained the same answer
in the next assistant turn.

The [matched control wire builder](../research/g03-beam-r1/build-beam-dev-factoid-bm25-wire-r1.py)
kept the treatment's exact four questions, system instruction, GLM model,
reasoning setting, 512-token answer cap, and message framing. Only the
source-only evidence fragments changed. Its private wire SHA-256 is
`fc106339fc29a6085150f22de8b0e00d517f9cb5d4ff8f7995eb79ab604da452`.
The same tokenizer runner admitted **4/4** at **1,221–1,355 prompt tokens**
plus 512 reserve (private result SHA-256
`8f05e16a155a6e762f62a43b4d37b67f400c9e4f6eff4d485ae2a65a99ab082e`).
The same zero-retry generation runner completed **4/4** normal-stop control
answers with **5,068 prompt and 102 completion tokens** (33 reported reasoning
tokens). Its private `FREEZE.json` and `RUN-RESULT.json` hashes are
`22a7e04c7cfd09e597f9a09f4408ca18cd5a8fa711ff84f9df7a3bbb287a4364`
and `1d1ae0d89c2539ba612b597aa287c7dfb4402f8bb2dce67a5e7e7050135e6aa3`.
All eleven control tokenizer/run files have checksum-matched VPS/WSL copies.

The [final-answer-only paired packet](../research/g03-beam-r1/prepare-beam-dev-factoid-paired-review-r1.py)
(private SHA-256
`7a14d31d404a08320372261b5ea31c9fe1bfc58d3a71d1420693ab6d28fd1a28`)
shows **three unambiguous ties** and one reference-sensitive discordance.
ARE answered the sprint question “March 29,” matching the reference; BM25
answered “March 31,” citing a later *revised completion target*. The source
also states still later that sprint 1 was actually completed March 29.
Thus a strict reference read gives ARE **4/4** and BM25 **3/4**, but allowing
the revised target as a plausible interpretation makes this a **4/4 tie**.
This is an unblinded post-hoc interpretation, not a predeclared native score;
four exposed conversations and one ambiguous discordance do not support a
superiority claim. Source/label ambiguity rules and a genuinely independent
population must be fixed before any confirmatory paired campaign.

The second information-extraction question in those **same four exposed
development conversations** provided a no-generation generalization check.
The [source-only projection script](../research/g03-beam-r1/plan-beam-dev-second-factoid-r1.py)
replayed the first-question BM25 selections exactly, then sealed both arms'
second-question fragment identities before any evaluator citation access
(private selection SHA-256
`25dd352dd7ecdbc9bf94487bfd8def97eb22188e6a568c71071c12a7fed7033f`).
The separate [evaluator-only citation audit](../research/g03-beam-r1/audit-beam-dev-second-factoid-r1.py)
read only those four development rows and reported **0/4 hit-all for both
arms**, **2/4 hit-any for both**, and cited-turn reach **2/11 for ARE versus
3/11 for BM25** (private audit SHA-256
`4fd5b689260d568335bfecf488143772185cc274222c6746ea5b9d6c60371670`).
No held-out evaluator values, reference answers in the receipt, or model calls
entered this diagnostic. The four second questions ask for **multi-step
processes or plans**, unlike the four short first-question factoids; this
is a breadth stress test, not a like-for-like factoid replication. Citation
reach is not answer quality—an uncited turn can still carry the answer—but
the result supplies no retrieval advantage for general information extraction
and blocks direct promotion of the unchanged 5K-character projection to a
general BEAM information-extraction holdout. First-question factoid eligibility
still needs a prospective source-only rule, not a post-hoc favorable subset.

A separately named **development-only neighborhood mosaic r1** then tested a
multi-source retrieval change on those four already-exposed multi-step
questions. Its [source-only planner](../research/g03-beam-r1/plan-beam-dev-mosaic-r1.py)
ranked whole turns with BM25, chose two anchors, added nearby turns within
three positions, and represented each selected turn by a bounded
query-conditioned excerpt. It sealed four projections at **4,952–4,994 UTF-16
characters**, all below the unchanged 5,000-character evidence ceiling,
before evaluator access (private source seal SHA-256
`9262c7c88f73b4b8225c98e6c0a315d64a74947ebdb6e4d93ad97f141cdad0ea`).
The separate [development-only citation audit](../research/g03-beam-r1/audit-beam-dev-mosaic-r1.py)
found **10/11 cited turns reached and 3/4 hit-all**, versus **2/11 and 0/4**
for the earlier ARE fragment ranker and **3/11 and 0/4** for BM25 fragments
(private audit SHA-256
`9b582ce8538733e363697af3e7ba8adee4967d3cefaa7d27dbaf821467be1580`).
No model calls or reserved evaluator reads occurred. A selected turn may have
only a 350–500-character excerpt, so this is **citation-identity coverage,
not proof that the answer-bearing passage survived**. The changed
representation requires source-grounded snippet review, exact GLM 8K wire
admission, and paired answer scoring before it can be considered for any
independent holdout. The fourth development question still misses its sole
cited turn; no general BEAM superiority follows.
An unblinded inspection of the exposed source and mosaic excerpts confirms
the limitation: the Coding sprint-plan excerpt includes the introduction but
not the later Week 1/Week 2 task schedule needed for the reference answer;
the writing-mentor excerpt includes preparation but not its later follow-up
steps. The legal-resource excerpts preserve several relevant steps, while the
other writing-process case misses its cited turn entirely. This qualitative
review is not a native score, but it rejects treating 10/11 turn identities as
10/11 answer-bearing excerpts. A multi-span within-turn selector or bounded
source-grounded extraction is the next development mechanism, not a holdout
promotion.

The matched **mosaic-versus-BM25 answer pilot** then used the exact same four
exposed multi-step questions, common instruction/model/output cap, and 8K
contract in both arms. Its [source-only wire builder](../research/g03-beam-r1/build-beam-dev-mosaic-paired-wires-r1.py)
sealed eight requests before evaluator access (private wire SHA-256
`30e1a92645f1fb254d2505a9bb53cf9a46bc0e38442536323d0222b089c89562`).
The [VPS runner](../research/g03-beam-r1/run-beam-dev-mosaic-paired-r1.mjs)
passed **8/8 exact tokenizer admissions**, then completed **8/8 zero-retry
generation calls** with 9,994 known prompt and 1,899 completion tokens.
Preflight and run result SHA-256 values are
`99ce8a99f716104b0e07e5789f03e2becc289af32d5c995060897bded3f63f88`
and `fc8cecfd0955dcdf0d907403fc272d4c66bc73b88d6c9c7f2763b3858a61457d`.
All 20 VPS run files have a checksum-matched private WSL cold copy. The
[evaluator-only final-answer packet](../research/g03-beam-r1/prepare-beam-dev-mosaic-paired-review-r1.py)
is private at SHA-256
`75315432d3c217e6141f2ea79135b4856aa3d685d0060cc29f5e22e6f3a2911d`;
it exports no reasoning content or reserved evaluator values.

An unblinded, final-answer-only comparison does **not** show a mosaic quality
advantage. On the sprint-plan case, mosaic says the backend/frontend sequence
is not stated while BM25 supplies the reference's Week 1/Week 2 structure.
On the mentor-meeting case, mosaic retrieves some preparation steps but omits
the reference's follow-up steps, whereas BM25 abstains. On the writing-process
case, both answers omit reference elements; on the legal-resource case, both
are relevant but BM25 includes more of the reference's networking,
interviewing, and fit/budget sequence. This is not a calibrated native BEAM
score; it is sufficient to **reject mosaic r1 as a direct holdout candidate**.
The 10/11 cited-turn reach must not be presented as a quality improvement.
The VPS helper's missing non-secret `secret-provider.mjs` dependency was
restored from the pinned checkout before tokenizer dispatch; the model secret
itself stayed in the existing container-bound file and was not displayed or
copied.

A separately named **multi-span outline r2** then replaced contiguous
350–500-character snippets with source-only heading/list-line selection inside
the same 5,000 UTF-16-character projection ceiling. Its four exposed
development projections were sealed before evaluator access at private SHA-256
`f8bcd45ea56c4896a0c5d55cec48351bf44618b1ec93678d53689d6f141b45f3`
([planner](../research/g03-beam-r1/plan-beam-dev-multispan-r2.py)). The
[wire builder](../research/g03-beam-r1/build-beam-dev-multispan-wires-r2.py)
reused the prior common system instruction, GLM-5.3-flash settings, and
1,024-token answer cap; its four treatment wires were sealed at SHA-256
`da5c94b5123bfd204180feeffadb8f97ba9aeabe9da85cc356553cbcfa61a127`.
The [VPS runner](../research/g03-beam-r1/run-beam-dev-multispan-r2.mjs)
passed **4/4 exact tokenizer admissions** and **4/4 zero-retry generation
calls**, using 4,706 prompt plus 1,151 completion tokens. Private preflight
and run-result SHA-256 values are
`1fec6513067bcdf6204b546bacf50d54bc9d4f29599d657cc0ef661fd3b7f375`
and `5db3064fdc16d470c70909840cb590cb1e7383b6139654add9d518f9f384fe31`;
all 12 VPS raw files have checksum-matched WSL cold copies. The
[evaluator-only final-answer packet](../research/g03-beam-r1/prepare-beam-dev-multispan-review-r2.py)
is private at SHA-256
`a8c68df0ee543edc25909969c0394dada688056b47c576b255bb4028811e0d4e`.
It joins to the **archived**, not contemporaneously rerun, BM25 control and
exports no reasoning or reserved evaluator values.

R2 recovers many mentor-meeting preparation, during-meeting, and thank-you
steps that mosaic r1 missed, but it omits the reference's later stay-in-touch
step. Its sprint answer recovers Week 1/Week 2 structure yet drops several
registration/login, validation, unit-test, and security tasks present in the
reference and BM25 answer. The writing-process answer remains incomplete;
the legal-resource answer is broadly relevant but gives no clear superiority
over BM25. This unblinded development comparison is **not a native BEAM
score** and does not support holdout promotion or a superiority claim.
R2 shows that within-turn multi-span selection can repair part of r1's
answerability loss, while also exposing the need for complete step coverage
and a predeclared scorer.

A final, separately named **complete-steps outline r3** for this four-case
development slice removed redundant day/milestone lines and prioritized
structural task and follow-up lines, still within the 5,000 UTF-16-character
evidence ceiling. The [source-only planner](../research/g03-beam-r1/plan-beam-dev-complete-steps-r3.py)
sealed all four projections before evaluator access at private SHA-256
`a379e7f3c36aa007b9eb7c95a928bebf60ddffa3723f596fe3e990d5b5b55514`.
The [wire builder](../research/g03-beam-r1/build-beam-dev-complete-steps-wires-r3.py)
kept the r2 model, prompt, and 1,024-token cap and sealed four requests at
SHA-256 `59b4327e7e4dce05418a0cb106ab33d9ffd0402ccf4cdaf83078d6b3090a7135`.
The [VPS runner](../research/g03-beam-r1/run-beam-dev-complete-steps-r3.mjs)
passed **4/4 exact 8K tokenizer checks** and completed **4/4 zero-retry
answer calls**, using 4,888 prompt and 1,179 completion tokens. The private
preflight and run-result SHA-256 values are
`06f89e2268fda0c195bce47a8aec5f349d00cb0363ad4085fb57c4e4745bcb5b`
and `450da88dd3d258b571fe78b8796bfe41b4ae8ea46f05e7acbc36d587ea9a8908`;
all 12 VPS files have checksum-matched WSL cold copies. The
[evaluator-only final-answer packet](../research/g03-beam-r1/prepare-beam-dev-complete-steps-review-r3.py)
is private at SHA-256
`6bf4c9a652b39ff5b162b6689db81458c6b4e06b84fd1d8b8bb73d8a296a5916`.
It exports neither reasoning content nor reserved evaluator values and
compares against the **archived noncontemporaneous** BM25 answers.

An unblinded read of the four exposed final answers finds one clear r3
improvement: it gives the reference-supported mentor preparation, meeting,
thank-you, and stay-in-touch steps where BM25 abstained. R3 and BM25 both
give the sprint's Week 1/Week 2 task sequence and broadly relevant legal
resource steps. Both writing-process answers remain incomplete against the
reference. These are qualitative development observations, **not a calibrated
native BEAM score or an independent superiority result**. R1–r3 tuning used
the same four exposed cases; further tuning on them would increase overfit.
No BEAM holdout is frozen. A future r3-like independent campaign needs a
predeclared semantic scorer, label-integrity treatment, comparator parity,
and clustered uncertainty on a fresh population; this development slice
alone cannot justify that claim.

## Official BEAM evaluator compatibility check — 2026-10-02

The BEAM upstream `main` source was inspected at immutable commit
`b2da22eac88bb0874c64665f13457eb99835774a`, without reading the 16
reserved conversations' evaluator fields. Its
[evaluation dispatcher](https://github.com/mohammadtavakoli78/BEAM/blob/b2da22eac88bb0874c64665f13457eb99835774a/src/evaluation/run_evaluation.py)
passes each question's rubric and model response to an ability-specific scorer.
For information extraction, the
[scorer](https://github.com/mohammadtavakoli78/BEAM/blob/b2da22eac88bb0874c64665f13457eb99835774a/src/evaluation/compute_metrics.py)
judges every rubric item separately and reports their arithmetic mean; the
[pinned prompt](https://github.com/mohammadtavakoli78/BEAM/blob/b2da22eac88bb0874c64665f13457eb99835774a/src/prompts.py)
allows item scores of 0, 0.5, or 1, with semantic equivalence for dates and
numbers. This is more appropriate than exact answer-string matching for the
multi-step development questions. The
[upstream model binding](https://github.com/mohammadtavakoli78/BEAM/blob/b2da22eac88bb0874c64665f13457eb99835774a/src/llm.py)
uses GPT-4.1-mini at temperature zero for evaluation; substituting the
owner-approved VPS GLM gateway would produce an **adapted**, not identical,
BEAM judge score.

The upstream scoring function accepts `probing_question`, but its rubric
prompt substitutes only the rubric item and response. The prompt asks the
judge to check responsiveness to the question without providing that question.
This is a source-level limitation, not a measured scoring error on our cases.
For any future independent paired campaign, fix one judge variant, model,
prompt hash, score parser, blinded arm order, and repeated-judgment reliability
rule on exposed development data *before* opening reserved labels. Report the
faithful upstream-prompt score separately from any question-aware sensitivity
score; neither can be called an official BEAM replication if the judge model
or prompt differs. Retain all item-level raw judgments privately and audit
source/reference conflicts under a predeclared rule rather than changing
labels after seeing arm outcomes. No new model or score call was made in this
source check.

The first GLM-adapted rubric calibration is now complete on the **four already
exposed paired short-factoid development cases**, not the 16 reserved
conversations. A [development-only packet builder](../research/g03-beam-r1/build-beam-dev-rubric-judge-r1.py)
bound the pinned source, split, four-pair answer packet, and only those four
development conversations' evaluator rubrics. Its blinded r2 wire seal
SHA-256 is `66ee7f2e5d382c64db9e68f98b63677d281354c929217b4656c8847d2e307907`;
the separate private arm-map SHA-256 is
`dbfd019c61ee7c38004a807ee63e4ae411cdb3786576aa42285761a5a82900c0`.
An earlier r1 wire/map pair was retained but superseded before any provider
request when the prompt variant was labeled explicitly as whitespace-normalized.
The five rubric criteria produced ten arm-specific judge inputs. The
[VPS runner](../research/g03-beam-r1/run-beam-dev-rubric-judge-r1.mjs)
used the upstream prompt's identical non-whitespace tokens, but normalized
its whitespace and substituted GLM-5.3-flash for upstream GPT-4.1-mini;
this is explicitly an **adapted** score. It passed **10/10 exact tokenizer
admissions** and **20/20 zero-retry judgments** across two reversed-order
passes, using 17,710 prompt and 996 completion tokens. Its private preflight
and run-result SHA-256 values are
`c22efa39f2a77b4645075bd72c79a6c1b8a489724f7185e08d45bcc2056b83fc`
and `097ea8b11e64ad55d0f7ca277997c7b56caf5662288566b8fb8f13e6f94d8340`.
All **34** raw VPS files have a checksum-matched private WSL cold copy. The
initial remote invocation used bare `node`, absent from the VPS host PATH,
and failed before the runner or any provider request; the successful run used
the pinned absolute Node path.

The [independent receipt and score audit](../research/g03-beam-r1/audit-beam-dev-rubric-judge-r1.py)
passed at SHA-256 `daaa8cf09563d2dde20a80368849b7e9dae125ecffa05b0aef11037f7613678e`.
Repeat agreement was **10/10 item scores**. Pair-mean rubric scores were
ARE **1.00** and BM25 **0.75**, comprising **three ties and one ARE-favoring
pair**. The discordant pair is precisely the previously documented
March 29/March 31 sprint-date source conflict; under the ambiguity-sensitive
reading it does not establish a clean win. Ten identical repeats on five
criteria are not a broad judge-reliability validation, and these repeatedly
inspected development cases are not independent. No native BEAM score,
holdout result, or superiority claim follows. Calibrate the same fixed judge
on the exposed multi-step cases and settle a prospective source-conflict rule
before any reserved-conversation freeze.

That multi-step calibration is now complete, with a retained failed-attempt
lineage. The [blinded packet builder](../research/g03-beam-r1/build-beam-dev-multistep-judge-r1.py)
bound the same four exposed conversations' second information-extraction
questions, complete-steps r3 answers, archived noncontemporaneous BM25
answers, and **19** rubric criteria per arm. Its private wire and arm-map
SHA-256 values are `6b7bba48f602cd02f76e18723c5206a413693f668ef89d2a5f61a90708a7bce3`
and `a0b861c147a9ab3e7798353bcf6b9e08f3817e3c8cf58f1e316310da3e709326`.
The unchanged r1 judge runner passed **38/38** exact tokenizer admissions,
then stopped after **22** model calls (21 accepted) because call 22 returned
HTTP 200 with score encoded as string `"0.0"`; its narrow parser accepted
only JSON numbers. The original terminal result remains immutable at SHA-256
`595c027ef6013f2e913c74eb5d66974e658256d7a0eb79c7beb8317e0d5e0edb`.
The upstream scorer converts the score with `float(...)`, so this was a local
parser mismatch, not a refused model response.

A separately frozen [r2 continuation](../research/g03-beam-r1/resume-beam-dev-rubric-judge-r2.mjs)
verified all 22 original raw responses, reinterpreted only that sealed string
score under an exact `0/0.5/1` numeric-or-decimal-string rule, and made the
remaining **54** calls without repeating any earlier provider request. The
combined result passed **76/76** valid judgments with zero automatic retries,
using 87,546 prompt and 5,181 completion tokens across both retained and new
calls. Its result SHA-256 is
`99b7a4efac007ecc7c94f43607e772dd7f0e978b46fc6561cf7c0b20e2588176`.
All **64** r1 and **56** r2 raw VPS files have checksum-matched private WSL
cold copies. The [independent lineage and score audit](../research/g03-beam-r1/audit-beam-dev-multistep-judge-r2.py)
passed at SHA-256 `46999f9b92fd0469675c6adab1a4fe0a917eed4e8d2ea91a3c0b4b6603c4317c`.

Repeat agreement was **37/38** blinded item scores. On the four exposed
questions, complete-steps r3 versus archived BM25 yielded **one ARE-favoring
pair** (mentor preparation/follow-up: 1.00 vs 0), **one BM25-favoring pair**
(writing process: 0.33 vs 0.58 in pass one), and **two ties** (sprint and legal
resources: both 1.00). The single changed item raised r3's writing-process
mean to 0.42 in pass two; it did not change the pair direction. This supports
the judge's limited repeatability on exposed material but rejects a claim that
r3 consistently improves answer quality. The comparator answers were not
contemporaneously rerun, and the four cases were repeatedly tuned; this is
**not** native BEAM scoring, independent confirmation, or superiority. No
reserved-conversation evaluator fields were parsed. Do not freeze r3 for an
independent superiority campaign on this evidence alone.

## Separate 500K development population — 2026-10-03

To avoid further tuning on the four repeatedly inspected 100K development
conversations, the published BEAM 500K source was staged privately at its
already recorded SHA-256. A [seed-overlap preflight](../research/g03-beam-r1/preflight-beam-500k-dev-r1.py)
excluded all five seed groups shared with the reserved 100K source, leaving
30 disjoint-seed conversations, 32,996 ordered turns, and 600 questions.
The [allowlisted extractor](../research/g03-beam-r1/extract-beam-500k-dev-source-only-r1.py)
(script SHA-256 `4be79f369dd74aa0b1ea40b040f9f9963a95232dedd124f09380f8dd8d62f949`)
staged only conversation keys, history turns, and question IDs/text in a
private source-only JSONL (SHA-256
`0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0`;
receipt SHA-256
`2e63d4a74d57d822c73bc806025acf36d57ab38fed75d0597282366d981f478d`).
No reference, answer, rubric, or reserved 100K evaluator field was emitted.

An evaluator-side citation-schema census found valid nonempty source-turn IDs
for all 60 information-extraction questions in these 30 conversations. A
[matched source-only selector](../research/g03-beam-r1/plan-beam-500k-dev-ie-paired-source-r1.py)
(script SHA-256 `fbf767266cfe26ad6563a492d4710fb43e0ab70aa6601a710874f0302cc7e863`)
ran the unchanged ARE rare-query-term fragment ranker and the unchanged BM25
control over identical 2,500-UTF-16-character fragments with an identical
5,000-character projection cap. It sealed all 60 paired fragment selections
*before* the evaluator audit; private selection SHA-256 is
`fa82830ff3e6d3e9eb386404901c76a3d610768324aa326d7ac9ee4925c0e2f0`.
The [independent citation audit](../research/g03-beam-r1/audit-beam-500k-dev-ie-citations-r1.py)
(script SHA-256 `49c98d81c6e5aa87c60f8903f3decaf057074ab13ad5ad05d3d07fbd0db3d799`;
private receipt SHA-256
`4d97d7161056dc506bfe6765542d0bb3c810e18505894c325f9f42998f515391`)
found **28/60** hit-all and **29/60** hit-any for ARE, versus **31/60**
hit-all and **31/60** hit-any for BM25. Of 74 cited turns, ARE selected 30
and BM25 33. On per-question cited-turn counts, **57 tied**, **three favored
BM25**, and **none favored ARE**. The three BM25-favoring questions span
problem-solution context, context date/time, and numerical precision.

This is a negative result for the unchanged ARE selector on a new development
population, not a model-answer test. Citation IDs may be incomplete or
insufficient to answer a question; these counts are not native BEAM accuracy.
No GLM generation, 8K wire admission, reserved 100K evaluation, or superiority
claim was made. All 60 questions are now exposed development material. Do not
represent them as an independent holdout after subsequent tuning.

A changed [compact source-only r2 selector](../research/g03-beam-r1/plan-beam-500k-dev-ie-compact-r2.py)
(script SHA-256 `7af89258998136461b8fca66cf41aedb0bcc6510f562267b475685de0f7e0bec`)
used two whole-turn BM25 anchors, radius-two neighboring turns, and bounded
query-centered excerpts under the same 5K-character projection ceiling. It
retained the r1 BM25 control bindings unchanged and sealed 60 new
treatment selections before label access (private SHA-256
`b47cf80b3ba4561124b0f79001912e35a7ed65134e9d1621f5646fe062a7c0af`).
The [r2 citation audit](../research/g03-beam-r1/audit-beam-500k-dev-ie-compact-r2.py)
(script SHA-256 `f005b1b2b09e3a4f46f803ad068fa0012dc5155d15248b5eccb12cef934d26ad`;
private receipt SHA-256
`0b57a3e979fb6ebcd067e1f4de5ad923aa3cb29836e4974767d679ed6d23d861`)
found **29/60** hit-all and hit-any for r2, **30/74** cited turns reached,
versus unchanged BM25's **31/60** hit-all/hit-any and **33/74** cited turns.
On paired cited-turn counts, r2 won three questions, BM25 won five, and 52
tied. R2 is not promoted; excerpt-level answer fidelity was not tested.

An [evaluator-only miss diagnosis](../research/g03-beam-r1/diagnose-beam-500k-dev-ie-misses-r1.py)
(script SHA-256 `5d2e7fa3ed24afb7029f8e3cc50d740853bda50eaa069bad9d6053bf7b69b331`;
private receipt SHA-256
`5adb7899659ace58a3e26ebf5346806a70e9b74ba88a312114124f8a7317a4e8`)
found only **36/74** cited turns in the whole-turn BM25 top ten and **51/74**
in its top 100. Ten cited turns have zero non-stopword question-term overlap;
seven questions have no overlapping cited turn at all. Only one cited turn's
full JSON projection exceeds the 5K limit. This suggests that query–history
semantic mismatch and ranking, not oversized cited turns alone, are the
dominant retrieval frontier. That is a mechanism inference, not evidence that
semantic retrieval will win or that citation reach predicts answer quality.

A separate, fixed [cross-encoder development protocol](G03-BEAM-500K-CROSS-R4-DEV-PROTOCOL.md)
tested one changed semantic-ranking mechanism. Its source-only r4 selector
reranked the BM25 top 100 fragments with a pinned quantized MiniLM
cross-encoder while retaining the identical 5K projection ceiling and all
60 unchanged BM25 control bindings. After **60/60** treatment selections were
sealed without evaluator access (private SHA-256
`21563d67cd378171d9e21e3778ee92a4a56dfd0dfe2566e3ce810d58341e8f02`),
the independent evaluator-only citation audit found r4 **36/60** hit-all,
**37/60** hit-any, and **39/74** cited turns reached versus BM25 **31/60**,
**31/60**, and **33/74**. The paired cited-turn count had **seven r4 wins,
one BM25 win, and 52 ties**. The private audit SHA-256 is
`4ae69ed08a8e21c500e7eda23ddd84bc768921e4cfb6ce85d3aaeb53aa234c6f`.
R4 scored **6,000** question–fragment pairs in **600.753 WSL seconds** and
made zero GLM calls. This is a promising development retrieval signal, not
native BEAM answer accuracy or superiority. Before a reserved holdout or
product claim, measure matched GLM answers, exact 8K wire admission, source
integrity, and all-in retrieval cost on the VPS.

## Recommended next action

The paired factoid development pilot shows no robust quality separation from
standard BM25, and the multi-step second-question citation check finds no
retrieval advantage for the unchanged ranker. Mosaic r1 improved citation
identity coverage but failed the matched answer-quality pilot as a direct
successor; do not freeze a holdout for it. Multi-span r2 restored some steps,
and r3 repaired two concrete omissions, but only one of four repeatedly used
development cases clearly favors r3 against an archived control, and the
adapted rubric judge now finds one r3 win, one loss, and two ties. Stop tuning
on this four-case slice and do not freeze r3 as a superiority candidate. The
GLM rubric judge has preliminary **47/48** exact repeat agreement across
factoid and multi-step item inputs, but that is only exposed
information-extraction calibration, not an all-ability reliability gate.
The new 500K development audits show both the unchanged ARE selector and the
compact r2 successor trailing BM25 on cited-turn reach. Cross-encoder r4
improved that development proxy, but is not yet an answer-quality or cost
win and cannot be frozen for a superiority test. Its model and all-in compute
must remain part of any later treatment definition; it must not silently
become the old ARE treatment. Before an independent
holdout, predeclare source/label ambiguity handling, qualify a changed
source-grounded treatment on the now-exposed 500K development data without
using the 16 reserved 100K conversations, and freeze a contemporaneous
matched comparator protocol. Do not infer a superiority claim from the ambiguous
factoid discordance or tune the reserved population after seeing it.
Separately, diagnose r5 event-stage selection on exposed data; the Carla
missing-in-answer stage is a clean synthesis failure, while the writing-
journey reference order is internally inconsistent. Any future independent
paired protocol must bound all-in retrieval plus answer cost for both arms.
Do not spend any of the 16 reserved conversations or infer superiority from
citation reach or output-budget compliance. A later paired protocol must keep
source/reference separation, comparator parity, ability-specific scoring,
and conversation-clustered uncertainty.

## Open Questions

- Which BEAM abilities can the current ARE memory projection and retained-note control address under the same 8K contract without changing the task?
- Can an evaluator-only rubric produce reliable blinded judgments for all ten abilities, particularly instruction/preference following and summarization?
- What deterministic conversation and question selection gives a sufficiently powered clustered comparison within the GLM and storage budget?
- Will the owner approve a separately named BEAM external-validity definition after the source-only adapter and scoring preflight? No approval is inferred here.
