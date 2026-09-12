# Recovery reservation comparison

Status: prepared for frozen execution. Authority effect: none.

## Objective and evidence

Execute K–P of [the authorized follow-up](plan-snapshot.md). The six failures
are analyzed in [failure-analysis.json](failure-analysis.json). Late hypotheses
and staging motivate an experiment; they do not establish causality. Output
exhaustion, terminal protocol errors, task knowledge and retained evidence remain
competing explanations. No prior solution or trace content enters model inputs.

H1: an earlier construction checkpoint increases full repair completion within
24 model calls at the same 12K recycling threshold. H0: it merely ends exploration
earlier, yielding no repair gain or worse repairs. Knowledge and memory remain
unmanipulated alternatives.

## Exact intervention

Baseline delegates scheduling to the completed feedback-timing workflow.
Reserved arm, only while no candidate exists: starting call 11, require recording
at least two hypotheses or reporting inability; starting call 15, require staging
an evidence-based candidate or reporting inability. After staging, all baseline
actions resume, including source reads and revision. A rejected staging attempt
retains the checkpoint. Both arms close staging after call 22, and require a
public-green candidate for submission. No model is forced to invent a patch.

This tests scheduled construction checkpoints, not pure extra revision turns:
reduced exploration is an inseparable treatment tradeoff. Both arms use early
syntax feedback and identical system prompts, tool definitions, transport,
context accounting and evaluator. The dynamically offered tools/phase text are
the treatment. Shared legacy wording and terminal-only protocol limitations
remain unchanged. No other intervention is bundled into this comparison.

## Fixed cohort and limits

Two observed Svelte development tasks (16417 and previously unresolved 16542),
two repetitions, baseline/reserved: eight episodes and four pairs. Repetition 1
uses ascending task order, baseline first; repetition 2 reverses both orders.
No independent holdout or broad qualification claim. Exact cells in matrix.json.

GLM-5.3-flash low reasoning, 12000 recycle / 16384 hard context, output 2048,
24 model calls, 48 tokenizer calls, two candidates, four probes, 120-second model
requests and 1800-second episodes. No retries, replacements, padding or extra
calls. Aggregate 192 model and 384 tokenizer attempts. Model reserve USD 0.10
per episode, USD 0.80 total; current published pricing verified 2026-09-10 at
https://docs.z.ai/guides/overview/pricing. Tokenizer/checker billing is not inferred.

Source, privacy, cleanup, budget or unclassified infrastructure failures pause
unstarted dispatches. Preserve failures; resume only unstarted cells after exact
diagnosis. Output exhaustion and mixed terminal-call rejection are terminal
agent/harness non-completions, not grounds for replacement.

## Scoring and decision

All model episodes must terminate before private evaluation. Score every submitted
patch against all expected repair/regression labels; repeat each passing patch
in a fresh evaluator. No-candidate and failed patches remain in the denominator.
Report operational outcomes separately; never hide incomplete pairs.

Primary outcome: repeat-verified repairs, with four paired wins/ties/losses.
Secondary: first hypothesis/stage call, second candidate after failed public
probe, calls remaining at first stage, total tokens/time/cost and recycling.
Screen for further replication: more reserved wins than losses and no more than
20% increase in mean model tokens or elapsed time. This is a pilot screen, not
statistical proof. Report all per-task variation. If checkpoint exposure is absent,
H1 is inconclusive; no positive repair difference fails the retention screen.

Target demonstration is a repeat-verified repair on 16542. Report whether met;
a completed fixed experiment may fail this target and must say so. Do not extend
or retune the cohort to obtain a favorable result. Context audits verify admitted
bounds, archive hashes and continuation; provider-internal compaction and perfect
semantic recall remain unobservable.

## DAG, construction and operations

K analysis → L fixed hypothesis/cohort → M isolated policy/controls → N eight
terminal episodes → O private scores/repeats → P results and typed learning
records. Q transfer work is deferred. The executing agent owns K–P.

Current frontier: M controls and freeze. construction.json binds existing ARE
product/capability, business ontology, DomainSpec and generated graph sources.
This is owner-directed candidate implementation; product approval is not requested,
conformance not_evaluable, no ontology-runtime selectors, no engine activation.

Operational prerequisites: executing agent verifies frozen images, credentials,
price/reserve before N; evaluator isolation and cleanup before O; accounting and
archive integrity before P. Deployment, publication and other domains/models are
deferred with future scope owned by the product owner; they do not block K–P.

## Open Questions

Can early construction improve repairs despite less exploration? Does task 16542
need knowledge or coordinated changes beyond the fixed budget? Does the checkpoint
increase invalid attempts or premature inability? Which evidence would separate
retention failure from rational rereading? Would any benefit transfer to fresh
tasks, models or non-coding work?
