# Evaluation and research

ARE separates product verification from research qualification.

The detailed operating method, benchmark inventory, current evidence, and
ordered roadmap are maintained in the
[research program](RESEARCH-PROGRAM.md). This page is the shorter evaluation
reference for product users.

## Product verification

The product suite derives its files from the exact source closure. Candidate
018 records 146 test files, 1,158 passing cases, and 20 owned targets. Every one
of the 17 components and two integrations has directly owned coverage. This
evidence verifies the declared local candidate. It does not prove every model,
task, provider, or production environment.

## Real-reasoning benchmark

`benchmarks/real-reasoning-v1` is a declared product component. It tests
continuity, compaction, scoring, reuse, reconnect behavior, and the improvement
chain with controlled fixtures. Run its supported surface through:

```sh
node bin/are.mjs benchmark --mode core
```

## ContextBench

ContextBench is the research benchmark for whether retained state improves
answer continuity and evidence recovery under context pressure. Core measures
include:

- Span-F1: overlap between required answer spans and recovered spans.
- File-F1: overlap between required and recovered source files.
- completion and validity gates.
- state exposure and continuity checks.
- token differences between matched control and treatment conditions.

One percentage point (`pp`) is an absolute change in a percentage metric. A
rise from 60% to 65% is `+5 pp`.

The GLM-5.3-Flash 8K milestone passed its bounded development and confirmation
cohorts. Full ContextBench acceptance remains open. The reviewed 10K Round 59
hypothesis saved tokens but failed its semantic quality criterion. The 12K
transfer remains blocked until a fresh 10K hypothesis passes and confirms.

## Research method

Each round should preserve the lighthouse objective and declare a falsifiable
hypothesis. It should bind control and treatment, preregister gates, and record
tool and model conditions. It should then analyze counterevidence and produce a
reviewed decision. Failed
rounds are evidence. Repeated tuning without a distinct mechanism is not a new
hypothesis.

## Reading results safely

Always identify the model, window, task set, scorer version, condition, sample
size, validity gates, and token accounting. Aggregate improvement cannot erase
a failed completion or exposure gate. A token reduction is valuable only when
the required quality boundary still passes.

## Open Questions

- Which prefix-observable displacement or evidence-structure signal should be
  preregistered for the next 10K hypothesis?
- Which non-code task family should become the first cross-domain retention
  benchmark?
