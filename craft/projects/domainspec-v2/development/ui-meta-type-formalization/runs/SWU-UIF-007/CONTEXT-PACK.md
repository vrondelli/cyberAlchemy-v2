---
task_reference: SWU-UIF-007
mode: standard
status: complete
result: ready
created: 2026-07-11
---

# Context Pack: SWU-UIF-007

## Scope

Join all W1 lane results into exactly one provisional outcome per UI label,
without discarding limitations, disagreements, correction routes, or authority
boundaries.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [Adjudication task](../../work-pack/tasks/TASK-UIF-ADJUDICATE.md) | algorithm; acceptance | Cover 11 labels exactly once and preserve disagreement/residue. |
| [SPEC](../../SPEC.md) | experiment outcomes | Use only the six provisional outcomes; none imply active/promoted. |
| [Experiment plan](../../EXPERIMENTS.md) | acceptance thresholds | Check constructibility, discrimination, portability, graph, repeatability, and round-trip status. |
| [Composition receipt](../SWU-UIF-004/TASK-SESSION-RESULT-COMPLETE.md) | three terminal results | Consume Page/Layout/Component evidence and narrow Component residue. |
| [Data receipt](../SWU-UIF-005/TASK-SESSION-RESULT.md) | four terminal results | Consume View Model/Form/Action/State Indicator evidence and gaps. |
| [Integration receipt](../SWU-UIF-006/TASK-SESSION-RESULT.md) | four terminal results | Consume Hook/Guard/Binding/Adapter evidence and E0 calibration. |
| [Composition results](../../experiments/w1/results/composition/final/) | machine records | Validate schema version, outcome, hashes, and promotion guard. |
| [Data results](../../experiments/w1/results/data-interaction/final/) | machine records | Validate schema version, outcome, hashes, and promotion guard. |
| [Integration results](../../experiments/w1/results/integration-control/final/) | machine records | Validate schema version, outcome, hashes, and promotion guard. |
| [UI11 attacks](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/attacks.md) | earlier demotion positions | Preserve disagreement where bounded lane criteria improved on attacker sketches. |
| [Gap ledger](../../work-pack/shared/cross-task-gaps.md) | owner routing | Keep corpus, framework, DS-D8, non-collapse, and authority gaps explicit. |

## Coverage

- Sources: 11.
- Selector groups: 21.
- Dependencies, result records, outcome rules, limitations, disagreements,
  correction routes, owner routing, validation, and authority: covered.
- Runtime: local/manual.
- Strict delegated coverage: n/a.

## Decision Flow

1. Incomplete or non-deterministic record -> `defer-evidence-gap`.
2. Structural collapse into an existing type -> `merge-candidate`.
3. One label with multiple surviving laws -> `split-candidate`.
4. Pure connective behavior -> `relation-not-node`.
5. Framework-only law -> `framework-vocabulary`.
6. Complete adapted structural separation -> `candidate-schema-ready`, with
   corpus/round-trip/replication gaps retained and promotion forbidden.

## Gate Result

- Three terminal lane receipts: pass.
- Machine census: 11 unique labels, deterministic, promotion false.
- Result disagreement: none across repeated runs.
- Source-position disagreement: present and retainable as residue.
- Consequential synthesis mutation: permitted.
