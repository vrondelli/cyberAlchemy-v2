# Research Document Type

Status: active private document contract; canonical-kind catalog remains candidate
Canonical kind: `research`
Authority-kind rollup: `Evidence`
Durability: ephemeral
Owner route: CyberAlchemy v2 research route plus the named Research owner

## Purpose

A Research document preserves one investigation: its question, Project and Goal
links, method, sources, gathered evidence, counterevidence, limitations, and
separate findings. It lets later work inspect what was gathered without treating
the aggregate as the answer.

## Carrier And Machine Record

The canonical carrier is a file named `research.md` with
`canonical_kind: research` in its frontmatter. Its sibling
`research.record.json` is the machine-readable record used for validation and
ontology projection. The two must share the same Research ID and question.

## Required Meaning

- stable Research ID;
- exactly one Project;
- at least one Goal;
- one bounded question;
- scope and exclusions;
- source and method records;
- evidence and counterevidence;
- separate findings references, when findings exist;
- limitations, owner, dates, and challenge route;
- explicit claim ceiling.

## Research Is Not Findings

```text
Research = question + sources + method + evidence aggregate
Findings = synthesis derived from that Research
```

The Research record carries no `outcome`, lifecycle status, authority state, or
promotion state. Its Evidence kind is ephemeral: it records what was gathered
at a time. Open or closed investigation state is inferred from its artifacts and
receipts, not self-declared as authority-like status.

## Example

The PythonConstraint Research asks why this benchmark is a suitable bounded
formal-task candidate and what remains unknown before a whole experiment. Its
benchmark admission source supports selection. It does not show that the
experiment ran or that DomainSpec improves the result.

## Authority Boundary

Research can support a Goal, Experiment, finding, decision, definition, or spec.
It cannot promote any of them, authorize an experiment, or become authority by
repetition or proximity.
