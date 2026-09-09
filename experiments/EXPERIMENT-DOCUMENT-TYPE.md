# Experiment Document Type

Status: active private document contract; canonical-kind catalog remains candidate
Canonical kind: `experiment`
Authority-kind rollup: `Evidence`
Durability: ephemeral
Producer: `experiment-harness` or an owner-approved Project experiment process

## Purpose

An Experiment document preserves a fair, bounded, reproducible test and its run
evidence. It connects the test to the Project, Goal, Research question, subject,
protocol, conditions, measures, environment, prerequisites, and stop rules.

## Carrier And Machine Record

The canonical carrier is a file named `experiment.md` with
`canonical_kind: experiment` in frontmatter. Its sibling
`experiment.record.json` is the machine-readable record. Both must share the
same Experiment ID and question or hypothesis.

## Required Meaning

- stable Experiment ID;
- exactly one Project and at least one Goal;
- Research links when Research informed the test;
- question or hypothesis and test subject;
- exact protocol reference;
- conditions and variables or interventions;
- measures and evaluation rules;
- environment and prerequisites;
- stop rules;
- run and evidence references;
- findings references, limitations, owner, dates, and challenge route;
- explicit claim ceiling.

## Designed, Run, And Concluded Are Different

```text
valid document + protocol             = designed experiment
valid run receipts                    = evidence the experiment ran
separate findings or owner decision   = bounded conclusion
```

The record carries no authority state or self-promoted outcome. Empty
`run_refs` means no run is evidenced. Validator PASS proves record integrity,
not execution or truth.

## Relation To Research

Research can motivate an Experiment by exposing a question that existing
sources cannot answer. The Experiment produces new observations under controlled
conditions. Findings may synthesize both Research and Experiment evidence.

## Example

The PythonConstraint Experiment uses the prepared Define downstream-utility
protocol as substrate but narrows the subject to the owner-selected benchmark.
It has no run receipts yet, so it cannot support a comparison result.

## Authority Boundary

An Experiment document does not authorize its own run, model calls, external
access, publication, deployment, or successor selection. Those require their
own accepted authority envelopes.
