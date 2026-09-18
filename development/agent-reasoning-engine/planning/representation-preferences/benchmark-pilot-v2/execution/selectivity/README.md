# Original ARE selectivity pilot

Status: authored candidate; awaiting independent label review and shared freeze.
Authority effect: none. Owner: pilot selectivity worker; review owner: coordinator.

These eight original English episodes were written for this project. No restricted
PrefEval or BenchPreS examples were copied or paraphrased. This is a synthetic ARE
benchmark inspired by preference-following/selectivity questions, not either native
benchmark. Four development families and four reserved families use separate domains.
Reserved rows have no model schedule and must not be used for tuning.

## Measurement

The four development cases test confirmed DAG reuse, suppression on an unrelated
explanation, an explicit current plain-text override, and a revoked DAG preference
replaced by a confirmed table preference. Reserved cases test a different DAG domain,
interaction-only scope, declining an offer, and revocation without replacement.

`adapter.mjs` exercises actual `createInteractionReview` persistence and the existing
representation detector. Every repeated request gets a scripted acknowledgement, and
the third completion must generate an offer. Acceptance uses the actual generated
confirmation text and explicit scope, never a gold lesson or fabricated projection.
Both arms receive identical complete authored history, including the offer, consent,
and any revocation. The treatment alone receives the actual selected lesson items.
The host closes and reopens before the final query. Scope checks and revocations use
existing host APIs. Historical assistant responses are scripted fixture scaffolding;
there are no hidden model calls or history extraction tokens.

The host supplies a scripted final response solely to finalize the dispatch and capture
its selected view. It is excluded from model-visible history. The recorded dispatch
is therefore exposure evidence, not evidence that a live output was ingested into ARE.
The shared runner makes the live call against this captured state. No benchmark
outcome is inferred from the host's literal lesson checks.

A common JSON transport instruction names all supported formats and is identical
for both arms. It supplies no task-specific answer or correct representation. The
original user history supplies content facts and preferences. `gold.json` is separate;
`scorer.mjs` reads it only for offline grading. Strict JSON shape, content concept
coverage, acyclicity, valid node references, prerequisite reachability, and owner/action
pairing make correct substance part of success. Literal occurrence of “DAG” fails.
The bounded concept grader can miss paraphrases and cannot establish broad semantic
correctness. Preserve raw outputs for blind review of any disputed cases; no post hoc
label changes are allowed inside this frozen pilot.

Report each arm's content/structure pass count and format accuracy by case. Appropriate
application rate has two development opportunities (apply/change). Misapplication
rate has two development opportunities (suppress/override), counting an incorrect
personalized format, alongside separate invalid-output counts. Empty denominators
are N/A. A four-task pilot supports no population claim. Total actual input plus
output tokens, completion, failures and exposure remain separate metrics.

## Interface

`prepareTasks({split:'development'})` returns task ID, messages, actual
`treatment_projection`, full exposure trace, source hash and metadata.
`scoreOutput(task_id,output)` returns structure validity, representation correctness,
content correctness and joint pass. A source pin must cover this directory and the
production modules it imports before live execution. No live calls have run here.

## Open Questions

Independent reviewer: are expected formats, content concepts, task distinctions and
scope defaults defensible? Will JSON transport dominate the preference signal? Is the
small context history sufficient for control to equal treatment? These are candidate
pilot limitations. The shared plan owns provider, accounting and freeze questions.
