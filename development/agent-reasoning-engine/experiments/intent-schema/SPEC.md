---
title: Intent Record Population Experiment
status: candidate-experiment-defined
invoke_mode: define
run_scope: private-repository-local
authority_effect: none
---

# Intent record population experiment

## Decision this experiment informs

After seeing populated repository-local records and a held-out slice, the
operator and intent-contract owner will decide which candidate record fields are
retained, revised, split, or rejected. The experiment informs that decision; it
does not make it.

## Research question

Can a record built around the seven semantic fields named by `CAV2-D39` preserve
source intent across dispatch, Craft, and Invoke/work-pack artifacts without
hiding inference, collapsing distinct questions, or hardening a current output
hypothesis into the intent itself?

The experiment also tests whether the candidate envelope in
[`../../spec/INTENT-RECORD.md`](../../spec/INTENT-RECORD.md)—raw source,
per-field posture, evidence references, and revision history—is sufficient and
not needlessly duplicated.

## Unit and corpus

- **Unit:** one source-locked intent-bearing excerpt projected into one candidate
  intent record.
- **Population slice:** 12 records, stratified as four validated dispatch goals,
  four Craft context purpose/next-move pairs, and four Invoke/work-pack
  objectives.
- **Held-out slice:** three records not used while fixing fixtures or population
  rules, with at least two source strata represented.
- **Total:** 15 records. This is a diagnostic design sample, not a statistically
  representative estimate of all CyberAlchemy intent.

Each sample must carry a concrete path, selector, SHA-256 of the source bytes,
stratum, inclusion reason, and population/holdout assignment before records are
interpreted.

## Candidate-under-test

The semantic fields are:

```text
source
purpose
scope
constraints
target_pressure
current_output_hypothesis
revision_route
```

Each field is populated as `declared`, `inferred`, or `unresolved`, with source
references and an inference note where required. Record mechanics under test are
the raw-intent envelope, identity/version fields, and revision history.

## Pre-registered hypotheses

| ID | Hypothesis | Evidence that challenges it |
|---|---|---|
| H1 | All seven D39 fields answer operationally distinct questions even when some are unresolved in sparse source artifacts. | Persistent pairwise ambiguity showing two fields cannot be populated or reviewed independently. |
| H2 | `declared/inferred/unresolved` exposes interpretation pressure better than nullable values alone. | Annotators cannot apply posture rules consistently, or the posture adds no reviewable information. |
| H3 | Preserving raw intent separately reveals when an output hypothesis would otherwise replace source purpose/pressure. | No observed replacement risk and the raw field adds only exact duplication without audit value. |
| H4 | Concrete evidence refs are required for declared and inferred values. | References cannot locate supporting source or are too coarse to review a value. |
| H5 | Revision history belongs to the record envelope, not each semantic field. | Real source artifacts require independent, concurrent field-level revision chains to remain traceable. |

The experiment may falsify or weaken these hypotheses. It may not remove a
canonical D39 semantic requirement based only on low frequency.

## Procedure boundary

1. Freeze and hash the manifest before interpretation.
2. Validate passing and intentionally failing synthetic fixtures.
3. Populate the 12-record slice using the frozen posture rules.
4. Record ambiguity, missingness, overlap, and replacement-risk observations
   without changing the schema.
5. Apply the unchanged schema and protocol to the three held-out records.
6. Validate the complete JSONL mechanically.
7. Compute descriptive metrics and list concrete observations.
8. Present candidate field actions and residue to the owner selection gate.

If a record cannot be populated safely, it stays schema-valid with
`posture=unresolved`; no convenient default is permitted.

## Selection evidence model

For every semantic or envelope field, the result must provide:

- the unique question the field claims to answer;
- population and holdout posture counts;
- at least one concrete source example where available;
- ambiguity/overlap observations;
- failure consequence if omitted;
- candidate action: `retain`, `revise`, `split`, `reject`, or `unresolved`;
- owner rationale, recorded only at gate `g6-schema-selection`.

Canonical source status, operational uniqueness, and failure consequence outrank
frequency. Derived mechanics should not be retained merely because every record
can populate them.

## Success criteria

The run is eligible for owner review only when:

- all 15 manifest entries are concrete, unique, source-locked, and readable;
- the synthetic suite contains at least one passing and one expected-failing row;
- all produced live rows pass the unchanged structural validator;
- every declared/inferred value has evidence and every inferred value has a note;
- every unresolved value is explicit and null;
- population rules are unchanged before held-out evaluation;
- metrics, observations, residue, and a terminal Task Session receipt exist; and
- no result claims schema, definition, engine, or anti-bias promotion.

## Failure and stopping rules

- **Block:** source drift after manifest freeze, fewer than 12+3 usable records,
  validator unable to distinguish expected pass/fail fixtures, fabricated values,
  or held-out rules changed after inspection.
- **Flag:** high unresolved rate, repeated pair ambiguity, source selectors too
  broad, or envelope mechanics that appear redundant.
- **Stop after one run:** this is a quick schema-selection input. A second run
  requires a newly named question, repair, or owner request.

## Define trace

- Template: local research/module specification, selected because the output is a
  bounded private evidence experiment rather than a reusable Arcanum capability.
- Techniques: `sequence` fixes define before design, mechanics, population, and
  selection; `sentence_grammar` maps source expressions to fields;
  `minimum_component_catalog` tests the candidate minimum;
  `validation_rule_catalog` separates shape from meaning;
  `data_quality_accuracy/completeness/conformity` govern population;
  `validation_loop` requires fixtures and a live run; `concrete_path_evidence`
  requires source-lockable records; `owner_boundary_check` keeps selection at
  the human gate; and `residue_ledger` preserves ambiguity and missingness
  instead of defaulting them away.
- Distill sanity: `pass`. One question, one frozen candidate, one population
  slice, one held-out slice, and one owner decision boundary form a coherent
  experiment.
- Next route: Invoke design for six-view experiment architecture.
