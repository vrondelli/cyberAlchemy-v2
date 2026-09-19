# Radical candidate: continuous investigation with an external evidence archive

The finding-reference R2 run completed all four tasks with valid references but
mean span-F1 was26.30%. All412confirmed observations were exported without loss.
The remaining coverage gap is upstream of export. Valid evidence references alone
do not imply relevant acquisition or sound interpretation.

## Mechanism and falsifiers

Replace three isolated investigations plus finding synthesis with one continuous
investigator. Keep exact tool exchanges in an external archive. Before each model
request, construct a small working set from the latest complete exchange and older
exchanges retrieved by the task and latest tool-query/path terms. Ranking is
lexical, deterministic and gold-blind; no embedding or summary model is called.

Archive entries retain original assistant tool calls and tool result bytes.
Replay whole exchanges, with unique tool-call IDs per prompt and deterministic
ordering. Failed tool results remain explicit. The archive is not confirmed
model delivery: only successful model receipts over the actual replayed bytes
can confirm observations. Never relabel an archive-only observation as delivered.
Existing native source/hash checks and final selection remain mandatory.

This is a different architecture, not a fresh control. It changes investigation
coordination and context projection together; the first run cannot isolate their
individual causal contributions. Historical candidates are descriptive references.

H-A: continuous query-conditioned replay reaches perfect native quality on all
four exposed tasks within the original8K/96K limits. Any valid nonperfect task
falsifies this strong claim for the run.
H-R: irrelevant or repetitive recall crowds out useful evidence and adds tokens.
H-S: the main gap is search strategy rather than state retention, so recall cannot
recover reference context that source tools never acquired.

## Fixed envelope and DAG

Use the same four task identities,GLM5.3Flash,low reasoning,two workers,
384Kcampaign ceiling,96K/96calls per task and measured8Krequest limit.
Allocate88K/95calls to continuous exploration and8K/1call to finalization.
The next exploration request must fit both remaining exploration budget and the
separate final reserve. No phase transfer, retries,replacement tasks or hidden gold.
Cumulative model tokens include repeated recalled content and every failed attempt.

1. Register competing hypotheses and the exact candidate schedule.
2. Implement and test the archive projector: completeness,identity collisions,
   deterministic selection,byte preservation,irrelevance and empty archive.
3. Integrate one-investigator execution with measured prompt admission and native
   receipt/source binding. A replay rejected for size must not become delivered.
4. Test four long production-path trajectories and unknown-cost failures.
5. Qualify actual prompts and freeze/review the exact candidate.
6. Run candidate-only tasks,score native outputs,audit and census evidence.
7. Select the next hypothesis from results; require untouched confirmation before
   claiming generalization or benchmark completion.

Product frontier: concrete query/archive projection and continuous runtime.
Operational owner: research operator. Disk admission,D:/WSLheadroom,source closure
and process settlement affect live execution. No current operational blocker
prevents construction. Fresh controls,worker expansion and release are deferred.

## General objective and Open Questions

The reusable principle under test is an external exact evidence store with a
bounded query-dependent working set, independent of programming language or model.
Code tasks are the current evaluation domain; they do not prove non-code transfer.
No model-authored compaction summary is introduced. Preserve the original15%token
reduction objective as unproven while matched controls are suspended.

Does query-conditioned recall improve source acquisition or merely replay old
mistakes? How much token budget goes to repeated evidence? Can the model recognize
and resolve contradictory observations? Does a promising result survive untouched
tasks and other domains? Perfect score remains unachieved.
