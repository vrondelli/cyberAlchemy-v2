# Dual 8K successor research

Status: tested candidate implementation and completed offline diagnosis. The active
perfect-score goal remains open. No successor answer-generation run has occurred.

The [previous live results](../dual-benchmark-8k-v1/AMENDED-RESULTS.json) remain the
latest benchmark scores: LongMemEval 7/8 treatment answers correct with 68.28%
fewer tokens; ContextBench 4/8 valid treatment outcomes, 16.07% macro Span-F1 and
9.41% fewer tokens. Two then four workers per benchmark were exercised. These
are small exposed development results, not full-benchmark qualification.

## Evidence and implementation

- [Plan and DAG](PLAN.md), [native hypotheses](hypotheses.json),
  [planned experiments](experiments.json), [continuity check](continuity-validation.json).
- [Receipt token audit](contextbench/TOKEN-ANALYSIS.md): another 35,001 tokens must
  be removed from the prior ContextBench treatment to reach 15%; all final calls
  combined cost only 28,811. Earlier input or unnecessary calls must change too.
- [Archive ceiling audit](contextbench/REPRESENTATION-CEILING.md): none of five
  selected failed archives contains enough eligible source coverage for perfect
  native Span-F1, even with unlimited selection. This is not a future-run bound.
- [Five real archive replays](contextbench/REPLAY.md) verify receipt/provenance
  handling without pretending that structural selections were model predictions.
- [Terminal evidence](contextbench/INTEGRATION.md) and
  [episode integration](contextbench/EPISODE-INTEGRATION.md) provide a versioned
  32-handle candidate, early terminal review, exact dispatched-packet binding,
  failed-call accounting and unchanged native export/scoring semantics.
- [LongMemEval diagnostic runner](longmemeval/RUNNER.md) isolates a generic
  preference-scope policy on identical evidence. Its eight real tokenizer checks
  passed; the largest measured input plus output reserve is 3,748 tokens.
- [Offline observations and decisions](offline-observations.json) are explicitly
  inconclusive about untested treatment performance. Planned live experiments
  have not been reported as executed.

Group admission now occurs before global worker reservation. Nested source-copy
reservations protect host storage, and usage survives tested journal failures.
Tests use local fixtures unless explicitly identified as tokenizer measurements;
none of the test suite is a scored GLM benchmark result.

The prior freezes and results remain separate. Gold access for the coverage audit
is isolated in evaluator code and never enters candidate prompts, state or tools.

## Next order

1. Close implementation review and preserve exact source bindings.
2. Freeze and run the four-pair LongMemEval scope diagnostic with two workers,
   a separate native-judge budget, and all eight answer slots retained.
3. In parallel, specify one task-derived source-discovery mechanism and one
   earlier-input efficiency ablation for ContextBench; review exact costs.
4. Freeze the next dual run with two workers per benchmark. Admit four only after
   measured health and disk gates. Score every outcome and every model token.
5. Use untouched long-task confirmation before broader success claims.

## Open questions

Can discovery improve usable source coverage without increasing cumulative costs?
Which earlier input or calls can be omitted safely? Does the preference-scope
policy generalize? How should evidence pages expose more than 32 observations?
These are owned by [PLAN.md](PLAN.md) and the benchmark-specific integration docs.
