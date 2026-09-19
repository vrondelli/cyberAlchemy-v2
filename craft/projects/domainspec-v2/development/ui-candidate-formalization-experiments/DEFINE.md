---
artifact_id: UCFE-DEFINE-v1
status: approved-for-design
target_owner: empirical-review and DS-D1 candidate governance
discovery_reference: ../ui-meta-type-repair/audit/integrated-001/result.json
template: domainspec-spec
created: 2026-07-12
---

# Define: UI Candidate Formalization Experiments

## Problem

The UI evidence machinery is mechanically complete, but no UI candidate has
the empirical and separating evidence required for formalization. Continuing
to improve schemas cannot supply independent corpora, independent positives,
or reviewer agreement.

## Defined Outcome

Create a repeatable candidate experiment process that returns exactly one of:

1. `distinct-supported`: evidence supports a candidate-specific formation law.
2. `covered-existing`: existing types, edges, roles, projections, or compound
   structures explain the observations without a new type.
3. `defer-missing`: evidence is insufficient for either conclusion.

These are experiment dispositions, not canonical authority changes.

## Pilot Boundary

Form (`DS-D1.20`) is the first pilot. Body War supplies one partial real corpus
in a static DOM/JavaScript style. A second independently authored real corpus,
a second style, independent reviewers, and separating experiments are still
required.

## Mandatory Process For Every Candidate

1. Pin the candidate law and nearest existing-type/edge alternatives.
2. Preregister distinct, covered-existing, and defer hypotheses.
3. Run an existing-coverage and collapse audit before admitting new evidence.
4. Normalize at least two independently authored real corpora in two styles.
5. Produce independent-positive, stable-contrast, label-erasure,
   criterion-erasure, changed-consequence, and typed-negative evidence.
6. Obtain two independent agreeing reviews with independence attestations.
7. Evaluate the fixed 2/2/2 policy and conjunctive dossier.
8. Emit an owner handoff; never mutate DS-D1 or DS-D8 from the experiment run.

## Collapse Standard

`covered-existing` requires positive evidence that an existing representation
preserves the candidate's valid instances, rejects its invalid instances,
supports equivalent composition and downstream consequences, and loses no
independently observed obligation. Missing candidate evidence or zero matches
cannot establish collapse.

## Scope

Included:

- reusable experiment contracts and harness inputs;
- Form pilot preregistration and evidence execution plan;
- corpus/reviewer independence checks;
- candidate-specific policy and dossier evaluation;
- reusable residue for later UI candidate runs.

Excluded:

- canonical definitions or relationship mutation;
- declaring Form or any UI candidate active, replicated, or promoted;
- inventing a second corpus or reviewer independence;
- automatically applying one candidate's evidence to another candidate;
- Action-source relationship admission.

## Define Decisions

| ID | Decision | Reason |
| --- | --- | --- |
| DEC-UCFE-001 | Pilot one candidate before general rollout | Prevent an untested process abstraction from becoming policy. |
| DEC-UCFE-002 | Form is the pilot | It has the strongest existing partial real-corpus evidence. |
| DEC-UCFE-003 | Existing-coverage audit precedes new-type evidence | Reuse existing ontology when it preserves all observed obligations. |
| DEC-UCFE-004 | Collapse requires positive equivalence/no-loss evidence | Absence and missing evidence are not collapse proof. |
| DEC-UCFE-005 | Fixed 2/2/2 and conjunctive dossier remain unchanged | Threshold tailoring would invalidate cross-run comparability. |

## Define Layer Seed

L0 must prove that one preregistered Form run can distinguish
`distinct-supported`, `covered-existing`, and `defer-missing` without authority
leakage. Later layers may collect and review evidence only after that contract
passes.
