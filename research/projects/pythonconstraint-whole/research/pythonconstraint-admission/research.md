---
canonical_kind: research
research_id: CA2-RESEARCH-PYTHONCONSTRAINT-ADMISSION
title: PythonConstraint Benchmark Admission Research
description: Exact-source investigation of why PythonConstraint is the lower-proof Vero candidate and which DomainSpec and experiment questions remain open before a whole run.
evidence_for: [Spec]
created: 2026-08-29
last_updated: 2026-08-29
tags: [pythonconstraint, vero, domainspec-v2, benchmark-admission]
---

# PythonConstraint Benchmark Admission Research

## Project And Goal

- Project: `CA2-PROJECT-PYTHONCONSTRAINT-WHOLE`
- Goal: `CA2-GOAL-PYTHONCONSTRAINT-WHOLE`

## Question

Why is PythonConstraint a suitable bounded Vero task for the whole
CyberAlchemy-v2 and DomainSpec-v2 experiment, and what remains unknown before
the experiment can run?

## Scope

This Research covers benchmark identity, selected revisions, proof-count
comparison, available specification and implementation material, license
evidence, and the current DomainSpec-v2 mapping gap.

It does not evaluate a completed proof run, product value, productivity, or
general benchmark performance.

## Method And Sources

The investigation compared the admitted Vero candidates at one pinned Vero
revision, inspected the PythonConstraint manifest and source revision, counted
the scored proof surface, and preserved the owner selection in the benchmark
admission record.

Machine-readable source and method details are in `research.record.json`.

## Evidence Aggregate

- Vero revision: `0a7325df9e9e6dbc275c0ad483b3d1cbe38d9b09`.
- PythonConstraint source revision: `f1359ff0ff6d9a541923d071cf1c0b50f8e8925b`.
- The admission comparison recorded 20 scored PythonConstraint proofs versus
  203 for Flocq.
- The owner selected PythonConstraint as the bounded candidate.

## Counterevidence And Limits

- Lower proof count does not mean the mapping or proof task is easy.
- Selection evidence does not show that the runtime, DomainSpec mapping, or
  proof path works.
- The broader Define experiment remains prepared and not authorized as a live
  outcome experiment.

## Findings

No separate canonical findings artifact has been created for this bounded
Research record. The benchmark admission document remains source evidence and
must not be relabeled as a completed experiment result.

## Claim Ceiling

This Research supports the choice of PythonConstraint and the need for an
explicit DomainSpec-v2 mapping. It does not prove the Goal, authorize the
Experiment, or establish a CyberAlchemy product outcome.
