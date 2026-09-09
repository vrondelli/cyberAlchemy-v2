# Intent Record

Status: stable-for-design
Date: 2026-07-26

## Source Intent

Determine what is missing for a working ontology prototype, then define and
design the smallest defensible architecture and show a concrete example.

## Purpose

Make one finite candidate graph executable enough to falsify its edge rules,
inspect its policy dispositions, reproduce its projection, and prove that the
prototype did not mutate governed ontology or authority inputs.

## Target Pressure

The repository has authored ontology contracts and adjacent viewers, but lacks
an ontology-bound instance validator, deterministic named-policy evaluator,
ontology candidate projection, immutable run receipts, and tested write
isolation.

## Current Output Hypothesis

A private command-line prototype consumes immutable JSON fixtures plus the
existing four-kind edge grammar, evaluates them under one named policy, writes
only an isolated run bundle, and renders a human-readable research-lineage
report from that bundle.

## Scope and Constraints

- candidate-only JSON records, never live authority objects;
- policy dispositions are `policy-pass`, `policy-fail`, or
  `policy-indeterminate`;
- every run has `authority_effect: none`;
- `specializes` remains indeterminate with `POLICY_OWNER_UNBOUND`;
- the first UI is a static report generated from the run bundle;
- IOLM remains an optional later adapter;
- Define and Design do not authorize Plan or implementation.

## Revision Route

Any change that adds node kinds, relation meaning, promotion effects, a live
schema, or a write to governed paths returns to the ontology owner and, when
load-bearing vocabulary changes, definitions-governance.
