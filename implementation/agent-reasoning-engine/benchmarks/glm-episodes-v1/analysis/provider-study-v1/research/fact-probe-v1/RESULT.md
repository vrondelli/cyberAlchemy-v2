# A confirmed context-availability gap

The unchanged H15 candidate can pass its completion gate and offer only submission while an earlier decisive Markdown fact is absent from the selected model request. This happens without recycling. The recent-observation policy masks all but the newest raw tool output; delivered-read coverage does not require the needed fact to remain available. The facts stay in the archive, but submission removes the opportunity to retrieve them.

The [verified H18 probe](verification.json) reports:

| Scripted condition | Correct context-only answer | Generic gate passes |
| --- | ---: | ---: |
| Submit immediately after reading revision | 9/9 | 9/9 |
| Three neutral reads, no recycling | 0/9 | 9/9 |
| Three neutral reads, forced recycling | 0/9 | 9/9 |

Each condition covers nominal 8K, 10K and 12K windows with two revised values and an unrevised control. All delayed cases had confirmed earlier revision delivery; the nine pressured cases delivered it before the measured generation change. Selected model bodies and successful tokenizer receipts match their recorded hashes. All 27 proposals remain unapplied. Two verifier tests pass, including rejection of forged bodies, removed tokenizer evidence, false visibility and false gate claims.

This is structural construction evidence, using 171 scripted model and 180 scripted tokenizer calls, with zero provider calls. It is not a GLM accuracy score or a real-token calibration. The same task and controlled responder do not establish how often GLM compensates, guesses or fails in practice.

[H17](h17-research.json) remains inconclusive: its no-recycle controls also lost the fact, so it could not isolate a recycling mechanism. Its initial 18 trials used 135 scripted model and 144 scripted tokenizer calls. Missing completion-gate data from that version is unknown, despite the old convenience metric defaulting it to false. The H18 revision was bound before running and retained complete agent results. Both outcomes are preserved in the [66-record research DAG](../dag-fact-65-final.json).

## Next experiment

Test a general bounded evidence-recovery phase before narrowing the tool set to submission. Recovery should be available for masked inspected evidence even if no recycle occurred. It must use actual document/tool references, not a hardcoded field name or the hidden expected answer. Retain source hashes and successful delivery checks, reserve synthesis budget, and report failure explicitly when required recovery cannot fit.

Before provider testing, freeze an isolated candidate and compare it with the unchanged baseline using the same revised/unrevised controls, additional irrelevant documents, stale-first retrieval and missing-evidence cases. Require authoritative-value recovery, output validity, bounded attempts and unchanged receipt integrity. Do not fix a hidden expected value into a late prompt. This candidate is not yet implemented or live-qualified.

## Open Questions

What task-independent signal tells the gate which earlier evidence is required for synthesis? Is explicit model-requested recovery sufficient, or is a bounded evidence selection step needed? Can recovery plus synthesis fit the existing 12/16-attempt limits under real token pressure? These are the next hypothesis boundaries, not claims this diagnostic resolves.
