# DSR-006 — candidate definitions completed

Status: completed-candidate-evidence. Authority effect: none. Date: 2026-09-08.

The [complete Define result](DEFINE-RESULT.md) presents every required concept with disposition, owner,
source identity, relevant formal/plain/domain content and boundary. The [candidate business ontology](../ontology/business-candidate.json)
links those meanings without adding canonical DomainSpec types or verbs. This is internal review material,
not the released user-facing documentation.

## Outcome

- 106 current concept dispositions: 88 exact source reuses, 15 proposed clarifications, 3 open decisions.
- Reuse coverage: 13 active backend metatypes; DS-D1/DS-D2/DS-D8; all 31 signatures; D18-D49; BMC D01-D08 and RQ1.
- D26 is retained as superseded history, never restored as an active dual-authorship rule. Saga's retired ID is not reused.
- Entity, Value Object, Enum, data shape, pure behavior, state change, proof and owner authority remain distinct.
- Proposals cover declarative composition, field constructors and identity references, explicit mapper values,
  Rule-referencing Policy authoring, trigger/effect separation, cardinality axes, business responsibility,
  storage realization, versioned formalization and evidence-bound product promises.

## Validation and limits

Native Define scripted runtime: `runtime-result.json`, valid = true, deterministic-structure-only,
handoff_ready = false, session_state = blocked-open-meaning, CLI exit 4. This is the expected result for
three open dispositions, not a failed candidate export. The exact non-durable run and its session/pack IDs
are saved; this is not an invented durable repository-session lifecycle or a new interview confirmation.

Fourteen tests pass in `validate.test.mjs`: deterministic generation and native replay, exact reference
coverage, changed-meaning and missing-reference rejection, ontology relabeling rejection, real consumer
coverage, endpoint/scope discrimination, pure Calculation boundaries, provenance separation, relationship
removal non-collapse and endpoint/representation orthogonality. See [tests](tests.log),
[validation](validation.json) and [semantic review](SEMANTIC-REVIEW.md).

These are bounded candidate checks, not an independent product-wide language-quality verdict, compiler
behavior test, SFOL proof or runtime-conformance pass. No Alch/Craft compilation handoff was attempted;
unreviewed syntax and unresolved meanings are not smuggled through compilation. Future implementation
still follows the separately selected Alch -> ontology -> Craft -> compilation process.

Preservation passes: 1,298 prior selected paths, 23 prior recovery/matrix files, 48 matrix source bindings
and 26 HEAD/index preimages. Only the two explicitly synchronized planning files changed; their original
bytes are retained in `preservation-before.json`. Earlier epoch receipts/checkers are untouched and remain
historical; use this epoch's [preservation check](preservation-verification.json) after DSR-006.

## Task Session Result

- Result: PASS for DSR-006 candidate deliverables; no broader product completion.
- Context: Context Builder lean, seven controlling sources, six covered obligations; see CONTEXT.md.
- Decisions: reuse source authority, propose narrower clarifications, keep unresolved selections open.
- Runtime: local native Define scripted run; no delegated runtime, model subprocess, or legacy lifecycle adapter.
- Gates: DEFINE candidate authorship; separate IMPLEMENT route for exact completion bookkeeping. Existing user
  authorization covers this bounded task. ARE receipts provide no additional authority.
- Synchronized: DSR-006, V07 and current frontier in WORK-ITEMS.json; PLAN.md progress only.
- Experiment harness: not applicable; no reusable-skill behavior or product experiment is claimed.
- Follow-up: DSR-007, one existing-contract Entity/Query vertical through direct JSON and supported Alch,
  generated code execution and negative controls. It is not started or authorized by this completion record.
  Any use of proposed syntax still waits for its own decision; source-reused existing contracts remain distinct.

## Recheck

From the DomainSpec v2 root:

```sh
node --test development/reconciliation-v1/definition-pack/validate.test.mjs
node development/reconciliation-v1/definition-pack/validate.mjs
node development/reconciliation-v1/definition-pack/preservation.mjs
```

The scripts are read-only. `build.mjs` emits regenerated candidate objects on stdout; it does not overwrite
the frozen evidence. Sources or candidates changing require an explicit refresh and renewed review.

## Open Questions

[OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) owns the authoring/compatibility choice, exact formalization epoch
and digest-bound admission owner. Seven missing BMC receipts and unresolved constraint facets stay with
their existing tasks. No question was turned into a fabricated answer or hidden in released documentation.
