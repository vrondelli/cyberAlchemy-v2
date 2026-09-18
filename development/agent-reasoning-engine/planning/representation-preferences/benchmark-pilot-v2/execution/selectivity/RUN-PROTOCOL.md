# Selectivity development run protocol

This branch realizes C3/C4 of [the parent plan](../../PLAN.md). It preserves the
enduring objective, initial GLM small-window objective, ContextBench milestone and
research method defined there. No release or operational admission is claimed.

Question: does selected, confirmed ARE preference state improve appropriate
representation and substantive answers compared with the same visible history?
H1 predicts improvement; H0 predicts history is sufficient; H2 predicts insufficient
state exposure. The four-task sample is a diagnostic pilot, not a population result.

Use preflight/schedule.json unchanged: four development tasks, both arms, two
repetitions, AB then BA. Keep reserved tasks out. Every arm has the same visible
history. Treatment adds only actual selected state items. Apply/change have state;
suppression/override intentionally do not. No extraction model calls are required.
Historical assistant responses are scripted scaffolding, not live model evidence.

Provider: existing Z.ai transport and credentials; request and response model must
be glm-5.3-flash. Temperature 0, thinking disabled, streaming false, output cap 1024.
Actual input limit 7168 and total per-call window 8192. Use returned usage, including
cached input and reasoning within output. All 16 calls share the 204800-token cap.
Tokenizer counts are admission estimates; actual counts must remain within the input
limit. Record differences. No retries, task substitution, partial-output repair or
outcome-based protocol changes. Unknown usage or invalid provider output stops the
run and preserves receipts. Reserve a full 8192 tokens before each dispatch.

Scoring has two layers. The frozen scorer checks format, structure, required concepts,
action order, owner/action pairing and explicit sentence count. It is a heuristic
and can miss negation or relational errors. Therefore a second reviewer receives
only random-coded answers, task facts/query, expected representation and rubric,
without arm, usage or selected-state metadata. The reviewer assesses every answer
for factual correctness, requested dependencies and constraints. Overall quality
requires both structural pass and semantic pass. Preserve disagreements. Fixed
denominators include malformed outputs; missing outputs never count as passes.

No API judge calls are scheduled. Offline fixture calibration and reviewer work are
orchestration, not tested-model calls; report this boundary explicitly. Report raw
counts, tokens and exposure by arm and category; do not pool with native external
benchmark scores. Benefit requires no worse quality/completion/misapplication and
at least one quality gain within budget. A tie supports no demonstrated benefit on
these tasks and does not justify opening the reserve. Preserve negative evidence.

Before dispatch bind schedule, tasks, scorer, gold, adapter, provider, run core,
launcher, protocol, review and hypotheses by hash; verify branch continuity. Create
one exclusive run directory so a second invocation cannot duplicate the run.

## Open questions

Whether visible history already saturates this small diagnostic, and whether the
external histories need a different existing memory path, remain empirical questions.
The parent plan owns external branch blockers and cross-branch synthesis.
