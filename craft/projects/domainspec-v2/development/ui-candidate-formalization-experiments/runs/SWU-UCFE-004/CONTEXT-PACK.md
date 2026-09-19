---
task: SWU-UCFE-004
mode: standard
status: complete
strict_coverage: n/a
handoff: none
authority: session-evidence
created_at: 2026-07-12
---

# SWU-UCFE-004 Context Pack

## Scope

Normalize the two accepted Body War corpus-v2 receipts into one Form corpus-A
attestation. Preserve literal source facts separately from candidate
projection, pin one accepted author identity and one implementation style, and
publish an immutable candidate-local generation that remains insufficient for
portability.

## Obligation Matrix

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume accepted `distinct-route-open` coverage receipt. | SWU-003 receipt | covered |
| O2 | Verify historical source revision and both file digests. | corpus generation 002 receipts and Git object `996ac...` | covered |
| O3 | Preserve only the two Body War Form receipt rows. | `body-war-form-source`, `body-war-submit-source` | covered |
| O4 | Keep literal observations unchanged. | corpus-v2 receipt semantics | covered |
| O5 | Record style `static-dom-javascript`. | both corpus-v2 receipts | covered |
| O6 | Record one accepted author identity without claiming cross-corpus independence. | dossier policy input `author:body-war` | covered |
| O7 | Map facts to Form hypotheses in a separate projection. | Form law and preregistration | covered |
| O8 | Exclude reviewer projection and Action candidate evidence. | SWU edge cases; corpus generation planes | covered |
| O9 | Preserve omissions and prohibited inferences. | corpus-v2 receipts | covered |
| O10 | Publish replayable generation explicitly below portability threshold. | DEC-UIR-008/009 policy and task done criteria | covered |

Coverage: 10/10. The author identifier is an accepted policy identity for
counting corpus A as one author. It is not proof that a future corpus B author
is independent; that comparison belongs to SWU-005.

## Selected Context

| Source | Selector | Obligations |
| --- | --- | --- |
| `work-pack/tasks/TASK-UCFE-EVIDENCE.md` | SWU-UCFE-004 | O1-O10 |
| `runs/SWU-UCFE-003/receipt.json` | accepted branch | O1 |
| `../ui-meta-type-repair/evidence/results/corpus/generation-002/receipts.json` | two Body War facts | O2-O5, O8, O9 |
| `../ui-meta-type-repair/evidence/corpus-receipt-v2.mjs` | literal/projection boundary and prohibitions | O4, O8, O9 |
| `../ui-meta-type-repair/fixtures/contracts/dossier-policy-current.json` | Form author/style row | O5, O6, O10 |
| `experiments/form/preregistration.yml` | Form law handle, corpus A, hypotheses | O7, O10 |
| `../ui-meta-type-formalization/candidate-meta-types/ui/form/form.schema.yml` | candidate obligations | O7 |
| `EXPERIMENT-CONTRACTS.md` | candidate-local evidence and portability requirements | O7, O10 |

## Normalization Rules

- Literal plane copies receipt IDs, source pins, selectors, observations,
  omissions, extractor, and prohibited inferences without reinterpretation.
- Authorship/style plane records one corpus, `author:body-war`, and
  `static-dom-javascript`, with the policy fixture as the attestation source.
- Projection plane maps literal fact IDs to candidate obligations and labels
  every mapping `partial-correspondence`; it is not a literal fact or identity
  witness.
- Reviewer projection handle `record:...d1cbe0` is excluded.
- The submit receipt is used only as a Form behavior fact. Its reuse in the
  Action candidate evaluation is not imported into this run.

## Write Scope

- `experiments/form/corpora/corpus-a/`
- `tests/form-corpus-a.test.mjs`
- `runs/SWU-UCFE-004/CONTEXT-PACK.md`
- `runs/SWU-UCFE-004/receipt.json`
- direct SWU-004/SWU-005 frontier synchronization

## Validation Surface

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-corpus-a.test.mjs
npm --prefix projects/domainspec-v2/impl run validate:docs
```

## Gate Verdict

PASS. Dependency, historical revision, source bytes, accepted author/style
identity, write scope, and validation are available. No runtime delegation or
subagents are used.
