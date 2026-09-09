---
canonical_kind: experiment
experiment_id: CA2-EXPERIMENT-PYTHONCONSTRAINT-WHOLE
title: PythonConstraint Whole Experiment
description: Prepared evidence-bounded test of a complete PythonConstraint DomainSpec-v2 path, using pinned benchmark inputs and the Define downstream-utility protocol as substrate, with no run evidence yet.
evidence_for: [Spec]
created: 2026-08-29
last_updated: 2026-08-29
tags: [pythonconstraint, domainspec-v2, define, vero, formal-task]
---

# PythonConstraint Whole Experiment

## Project, Goal, And Research

- Project: `CA2-PROJECT-PYTHONCONSTRAINT-WHOLE`
- Goal: `CA2-GOAL-PYTHONCONSTRAINT-WHOLE`
- Research: `CA2-RESEARCH-PYTHONCONSTRAINT-ADMISSION`

## Question

Can one owner-selected PythonConstraint task be mapped into DomainSpec-v2 and
run through a reproducible, evidence-preserving proof path while keeping the
CyberAlchemy product-thesis claim bounded to the observed experiment?

## Subject And Protocol

The subject is the Vero PythonConstraint task at Vero commit
`0a7325df9e9e6dbc275c0ad483b3d1cbe38d9b09` and upstream source commit
`f1359ff0ff6d9a541923d071cf1c0b50f8e8925b`.

The prepared Define downstream-utility protocol supplies the broader comparison
and evidence discipline. This record narrows the immediate experiment to the
PythonConstraint whole-path Goal. It does not claim the broader six-task live
pilot has been authorized or run.

## Conditions And Measures

The experiment must preserve exact task inputs, DomainSpec-v2 mapping, runtime
and container identity, commands and exit statuses, proof and validator results,
two-run determinism or explicit nondeterminism, and a final claim map.

Measures are the five Goal success conditions, with causal blockers reported as
not evaluable rather than passed.

## Prerequisites And Stop Rules

Required before a run:

- complete DomainSpec-v2 mapping package;
- pinned runtime/container provenance;
- exact command and evidence layout;
- accepted local execution boundary.

Stop before effects outside that boundary, before an unpinned input, or when a
real proof/governance blocker prevents the next declared check.

## Run Evidence

None. The machine record has empty `run_refs` and `evidence_refs`. Therefore
this document proves only that a prepared Experiment record exists.

## Claim Ceiling

This Experiment is designed but not evidenced as run. It supports no conclusion
about PythonConstraint, Define, DomainSpec-v2 effectiveness, productivity, or
the CyberAlchemy product thesis.
