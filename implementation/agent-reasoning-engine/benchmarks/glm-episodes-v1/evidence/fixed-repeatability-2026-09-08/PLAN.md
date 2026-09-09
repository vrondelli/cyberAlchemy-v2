# V20 fixed repeatability plan

Product frontier: v20 produced a working 9/10 screening result, including a recorded transport interruption. Measure repeatability with a fixed candidate rather than iterating on each failed response. Implement reusable bounded evaluation and durable scoring without altering runtime, defaults, fixtures or oracles.

Runnable product DAG: closed schedule/budget validation -> source and report/evaluator freeze -> local negative/export tests -> no-call preflight -> eight fixed live trials -> checked aggregate and limitations. Two repetitions of long 8K clear, long 8K recent, archive 8K recent, scoring 8K clear. Reverse order for repetition two. This covers three tasks and four conditions, not the full task/window factorial or unseen tasks.

Success target: 8/8 verified repairs and completion gates; every recycled trial passes continuity; every long 8K trial recycles; positive admission headroom and valid independent reports/source bindings. Every failure remains in the denominator. Finish this schedule without candidate changes, retry or failure replacement. A failed target is a result, not permission to tune or rewrite this batch.

Caps: eight trials, 128 model/256 tokenizer attempts maximum; 580 seconds per arm, 660-second driver ceiling, 5280-second batch start deadline. Freeze the evaluator and report checker as well as the episode sources and schedule. Stop on source/task drift, invalid reports or harness errors. Incomplete attempts retain started evidence and uncertain accounting; no automatic replay.

Operational tasks and owners: agent runs the already authorized provider calls; product owner owns any later activation. Affected stages: benchmark orchestration, evidence exports, summary scoring. Causal blockers: validation failure, source/report drift, provider availability. Deferred residue: broader replicated factorial checks, unseen tasks, activation and automated resume. CAV2-D65 candidate construction; no new ontology dependency or operational authority.

## Open Questions

Do both long 8K policies repeat reliably? Does preservation of example fields hold on archive and scoring tasks? How often do transport errors prevent completion? Eight trials cannot establish production reliability, and observable continuity cannot reveal provider-internal compaction.
