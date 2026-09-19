# Experiment Contracts

## CandidateRun Input

Required fields:

- candidate ID, label, law version, and candidate source handle;
- nearest existing alternatives with owner/source handles;
- preregistered hypotheses and falsifiers;
- corpus universe and authorship attestations;
- experiment selectors, extractor versions, and expected outcomes;
- reviewer requirements and fixed policy version;
- predecessor run, if any.

## Existing Coverage Matrix

Each alternative is tested on:

| Dimension | Required evidence |
| --- | --- |
| Valid-instance preservation | Every candidate positive remains constructible. |
| Invalid-instance rejection | Candidate negatives remain rejected with typed reasons. |
| Substitutability | Replacing the candidate interpretation preserves declared interfaces and obligations. |
| Composition parity | Existing edges and composition paths represent the behavior without hidden glue. |
| Consequence parity | Validation, derivation, projection, tests, and generated-code consequences are preserved. |
| No-loss audit | No independently observed obligation disappears. |

`covered-existing` requires all dimensions to pass for one named alternative.
Partial matches remain residue and cannot be pooled across alternatives.

## Distinct Candidate Matrix

`distinct-supported` requires all of:

- independent positive;
- stable contrast;
- label erasure;
- criterion erasure;
- changed consequence;
- typed negatives;
- 2 independent real corpora;
- 2 implementation styles;
- 2 independent agreeing reviewers;
- owner firewall.

## Evaluation Precedence

1. Invalid or contradictory run input -> `invalid` record state; no disposition.
2. Complete positive existing coverage -> `covered-existing`.
3. Complete distinct matrix -> `distinct-supported`.
4. Otherwise -> `defer-missing` with explicit missing conjuncts.

The precedence prevents a candidate from being called distinct when existing
coverage has already been positively demonstrated. It also prevents missing
evidence from being relabeled as collapse.

## Form Pilot Alternatives

The pilot must test at least:

- Form as a compound interaction structure over existing nodes and edges;
- Form as Component plus typed fields and `submits` behavior;
- Form behavior represented by existing Operation/Action, Interface, Rule, and
  Mapping concepts without a distinct Form type;
- Form as a distinct candidate law.

The alternatives are hypotheses, not conclusions. Task execution must pin the
exact existing authority handles before evaluation.
