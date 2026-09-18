# LongMemEval sequential-history successor

Status: candidate; not frozen. This follows the original four-task admission result
and [source investigation](../personamem/SUCCESSOR-RESEARCH.md). The original 8K
all-history suite remains blocked, not reclassified as passed.

## Objective and hypotheses

Preserve the parent plan's objective: useful reasoning, continuity, correctness and
completed outcomes within cumulative model input plus output tokens. Preserve GLM
small-window qualification and the separate ContextBench milestone.

Question: does ARE-backed source-linked state improve answers over ordinary bounded
notes when both arms ingest the same complete history within 8K per call?
H1: source-linked state improves update/attribution/reasoning accuracy.
H0: ordinary notes suffice; source references add tokens without useful accuracy.
H2: the shared note budget loses necessary evidence, regardless of provenance.
Falsification: no native-quality advantage, worse completion, or a budget violation
prevents an improvement claim. Four tasks cannot establish general superiority.

## Fixed causal comparison

Use the same four selected development LongMemEval oracle tasks and two repetitions
in AB then BA order. Keep all reserved tasks untouched. This is an adapted sequential
oracle-history study, not the official full-history score and not a retrieval test.

Both arms read every original dated user/assistant turn in order, without the final
query during ingestion. Control carries ordinary model-authored notes. Treatment
carries notes referring to ledger-bound source aliases (sN-mN), with an explicit
alias-to-event-digest mapping retained in evidence. It receives the same source
words plus evidence identifiers, and its retained notes are stored as model claims,
not silently promoted to verified source facts. Do not create preference consent.

Treatment source identifiers must resolve against the task's actual sealed ledger.
Measure missing/invalid references without repairing or retrying outputs. Preserve
source records separately from claims. Archive recovery is excluded from both arms
in this first causal comparison, avoiding an additional retrieval confound.

The final question uses only the last bounded notes and question/date. Both arms
receive identical answer instructions and abstention guidance. Source-linked notes
may support attribution but do not give treatment extra source text at answer time.
Report actual state exposure and reference validity alongside answer quality.

## Context, calls and tokens

Partition whole dated turns greedily into chronological chunks with at most 14,000
serialized characters before framing. This is only a deterministic partition rule;
real tokenizer admission is mandatory. Overlength individual turns require a new
explicit span-splitting protocol, never truncation. All original turns must appear
exactly once, with role, date and content preserved.

Each ingestion request includes instructions, current chunk and previous notes.
Generate at most 512 tokens of notes, including reasoning. Final answers reserve
1,024 output tokens. GLM-5.3-flash uses enabled low reasoning, temperature zero.
Measure every actual request; maximum input 7,168 tokens, total context 8,192.
For preflight reserve 512 input tokens for prior notes, carried as raw message text
rather than escaped JSON, beyond the measured empty-notes prompt. This is an enforced
reservation, not an assumption that different tokenizations are identical. Tokenize
each actual carried-note request at dispatch; if it exceeds its reserved input,
stop before generation. Preserve the first 233,552-token failed admission in
preflight/result.json; the compact-notes successor is separately measured.

Preflight must reserve the complete four-task × two-arm × two-repetition schedule,
including every note call and answer. Maximum total remains 204,800 tokens. Cached
input and reasoning output count. No model judge calls are planned: use the pinned
native rubric with blind independent semantic review and preserve ambiguity.
Any required scoring calibration is offline; no uncounted model extraction exists.
Unknown usage, model drift, invalid context, source leakage or incomplete output
stops the affected run with receipts. No silent retries, dropped tasks or tuning.

## Method and DAG

Objective → admission gap → H1/H0/H2 → source ledger and equal-access adapter →
measured complete schedule → offline tests and scorer calibration → independent
review → native continuity freeze → run → blind native-rubric scoring → D02
observation → D04 reviewed decision → successor. Retention of an engine improvement
requires separate evidence; this protocol alone changes no production behavior.

Coordinator owns chunking, shared transport, budgets, freeze and synthesis. The
bounded ledger worker owns ledger.mjs and its tests. External provider availability
blocks live calls only. Release, deployment and ContextBench milestones are separate.

## Open questions

Will full-schedule measured reservations fit 204,800 tokens? Can low reasoning leave
enough of a 512-token completion for useful notes? Does source-link validity predict
native answer quality? These are admission or empirical questions, not assumed wins.

## Metric applicability

The inherited preference misapplication metric and no-worse criterion are N/A for
this LongMemEval subset: it has no defined selectivity-opportunity denominator.
They are not scored as zero or counted as a passed gate. Native answer quality,
completion and total tokens govern benefit; source-reference validity is diagnostic.
A valid source alias establishes existence in the archive, not that its statement
was observed so far or that the cited source entails a model claim.
