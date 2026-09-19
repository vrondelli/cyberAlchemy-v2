---
task: SWU-UCFE-002
mode: standard
status: complete
strict_coverage: n/a
handoff: none
authority: session-evidence
created_at: 2026-07-12
---

# SWU-UCFE-002 Context Pack

## Scope

Publish immutable preregistration generation 001 for the Form pilot. Pin the
candidate law, current candidate and authority handles, three coverage
alternatives, the distinct hypothesis, expected evidence and falsifiers, and
known external gates. Do not execute experiments or include outcomes.

## Obligation Matrix

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume the accepted SWU-001 contract and identity kernel. | `runs/SWU-UCFE-001/receipt.json` | covered |
| O2 | Pin the Form candidate card and checked criterion schema by digest. | Form `form.md` and `form.schema.yml` | covered |
| O3 | Preserve Form as candidate-only DS-D1 evidence. | Form Boundary; meta-type registry UI maturity | covered |
| O4 | Pin three coverage alternatives and one distinct hypothesis. | SWU-002 algorithm; `EXPERIMENT-CONTRACTS.md` Form alternatives | covered |
| O5 | Distinguish Component and Action candidate handles from backend DS-D1 member handles. | Component/Action boundaries; meta-type registry | covered |
| O6 | Pin active DS-D8 signatures without treating endpoint use as DS-D1 formation authority. | `relationships.yml`; meta-type registry authority note | covered |
| O7 | Pin Body War as corpus A input and mark corpus B missing. | Form replication row; policy evaluation Form row | covered |
| O8 | Mark two independent reviewers missing without copying an outcome into preregistration. | DEC-UIR-008/009 policy handle and Form row | covered |
| O9 | Reject wildcard edges, labels as witnesses, result payloads, source drift, and overwrite. | SWU-002 edge cases; shared prohibitions | covered |
| O10 | Freeze generation 001 with no requested disposition or experiment result. | candidate-run kernel; SWU done criteria | covered |

Coverage: 10/10. No source contradiction blocks preregistration. Prior
`deferred` and `missing` records are pinned as baseline handles and gate
constraints, not copied as the new run's result.

## Selected Context

| Source | Selector | Obligations |
| --- | --- | --- |
| `work-pack/tasks/TASK-UCFE-CONTRACT.md` | SWU-UCFE-002 | O1-O10 |
| `runs/SWU-UCFE-001/receipt.json` | accepted generation and artifact handles | O1, O10 |
| `../ui-meta-type-formalization/candidate-meta-types/ui/form/form.md` | Formation Law, Distinguisher, Boundary | O2-O4 |
| `../ui-meta-type-formalization/candidate-meta-types/ui/form/form.schema.yml` | checked candidate criterion | O2, O3 |
| `../ui-meta-type-formalization/adjudication/VERDICT-MATRIX.md` | DS-D1.20 row | O3, O7 |
| `../ui-meta-type-formalization/replication/REPLICATION-MATRIX.md` | DS-D1.20 row and boundary | O7-O9 |
| `../../definitions/meta-types/meta-types.yml` | DS-D1.4, 7, 11, 13 and UI maturity | O3, O5 |
| `../../definitions/relationships/relationships.yml` | active `submits`, `composes`, `exposes`, `enforces`, `maps` | O5, O6 |
| `../ui-meta-type-repair/evidence/results/dossier-policy/generation-001/evaluation.json` | Form input handles and fixed policy | O7, O8 |
| `../ui-meta-type-repair/evidence/results/dossier/generation-002/dossier.json` | baseline missing-conjunct handles | O8, O9 |

## Fixed Alternative Structure

1. Existing compound interaction structure over named current nodes and edges.
2. Component candidate plus typed fields and the active `submits` signature,
   explicitly testing the endpoint mismatch rather than assuming it away.
3. Operation, Action candidate, Interface, Rule, and Mapping with named active
   signatures.
4. Distinct Form candidate law, represented as the distinct hypothesis rather
   than an existing-coverage alternative.

## Constraints

- `DS-D1.20` Form, `DS-D1.17` Component, and `DS-D1.21` Action remain
  candidate-only formation handles.
- Operation `DS-D1.4`, Rule `DS-D1.7`, Interface `DS-D1.11`, and Mapping
  `DS-D1.13` are current backend registry members whose deeper semantic
  authority remains confirmation-gated.
- Active DS-D8 endpoint use is evidence pressure, not DS-D1 promotion.
- No wildcard relationship may replace exact signature IDs and endpoint rows.
- Candidate names, framework labels, and authored criteria are not witnesses.
- Preregistration contains expected observations and falsifiers, never observed
  result states, counts, scores, or a disposition.
- Corpus B and two independent reviewer identities remain explicitly missing.

## Write Scope

- `experiments/form/preregistration.yml`
- `experiments/form/alternatives.yml`
- `experiments/form/run-manifest.json`
- `tests/form-preregistration.test.mjs`
- `runs/SWU-UCFE-002/CONTEXT-PACK.md`
- `runs/SWU-UCFE-002/receipt.json`
- direct SWU-002/SWU-003 frontier synchronization

## Validation Surface

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-preregistration.test.mjs
npm --prefix projects/domainspec-v2/impl run validate:docs
```

## Gate Verdict

PASS. The accepted dependency exists, source handles are available, the
authority distinction is explicit, validation is available, and no policy or
evidence decision is required. Runtime delegation and subagents are not used.
