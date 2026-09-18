# Selected preference and memory tasks

Status: 24 selected references; zero benchmark model calls. Authority effect none.

| Benchmark | Development tasks | Reserved tasks | Coverage |
| --- | --- | --- | --- |
| PrefEval | 4 | 4 | Two explicit domains, choice-based travel, persona-based education |
| BenchPreS | 4 | 4 | Four recipient domains; different profiles/recipients in reserve |
| LongMemEval oracle | 4 | 4 | Preference, knowledge update, multi-session, abstention |

The exact source revisions, row selectors and hashes are in [tasks.json](tasks.json).
LongMemEval development question IDs: 32260d93, 01493427, 2e6d26dc, eeda8a6d_abs.
BenchPreS development row offsets: 0, 13, 26, 34. PrefEval identifiers use the
upstream file path and row offset because those files do not supply stable IDs.
No dataset payload, answer or profile text is vendored here.

The proposed development schedule has 48 generator calls: four tasks per benchmark,
two arms, two repetitions. [schedule.json](schedule.json) is deliberately not ready
to dispatch. Reserved tasks are not in the schedule.

## Evolution and ontology integration

[build.mjs](build.mjs) invokes the existing engine constructors, record verifier,
cycle sealing, D07 research DAG, D08 work plan and event replay, and continuity
validator. It does not create fake observations for the unrun external benchmarks.
The actual prior local contract evidence anchors the research question. H0/H1/H2
and prospective experiment protocols are registered in the local evolution cycle.

```sh
node development/agent-reasoning-engine/planning/representation-preferences/benchmark-pilot-v1/build.mjs --check
```

Expected: candidate continuity passes, all records verify, selection is completed,
three adapter tasks are ready, and dispatch freeze fails on unresolved bindings.
A candidate record's existence grants no live execution or serving activation.

[PLAN.md](PLAN.md) contains the protocol and diagram. [work-plan.json](work-plan.json)
and [work-state.json](work-state.json) carry the machine DAG and derived frontier.
[validation.json](validation.json) exposes both candidate and freeze verdicts.

## Remaining work in order

1. Adapt original inputs and isolate evaluator-only gold; measure unchanged ARE coverage.
2. Bind exact model, native scorers, blind evaluation and full token accounting.
3. Resolve PrefEval/BenchPreS noncommercial terms for their branches. LongMemEval proceeds independently.
4. Review and freeze each runnable branch; execute its fixed development schedule.
5. Save observations and a reviewed learning decision. Use reserve only under a successor freeze.

Data sources: [PrefEval](https://github.com/amazon-science/PrefEval),
[BenchPreS](https://huggingface.co/datasets/sangyon/BenchPreS),
[LongMemEval cleaned](https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned).
The pinned license links are in tasks.json. PrefEval and BenchPreS are CC BY-NC 4.0;
LongMemEval's dataset card states MIT. This package stores references, not a
commercial redistribution bundle. No rights holder was contacted.

## Open Questions

[PLAN.md](PLAN.md#open-questions) owns adapter coverage, model/evaluator bindings,
usage eligibility and the exact live freeze. The selected subsets cannot establish
full benchmark performance, context compaction behavior, or generalization.
