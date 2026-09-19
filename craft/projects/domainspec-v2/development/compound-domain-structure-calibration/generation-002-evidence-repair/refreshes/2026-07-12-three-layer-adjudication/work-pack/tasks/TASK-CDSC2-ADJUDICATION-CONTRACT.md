# TASK-CDSC2-ADJUDICATION-CONTRACT

## SWU-CDSC2-005A - Three-Layer Contract And Materializer

**Goal:** implement and validate the overlay contract and deterministic v1
compatibility materializer before any post-observation judgment is frozen.

**Dependencies:** completed SWU-CDSC2-003/004, resolved `DEC-CDSC2-009`, parent
F3 receipt, frozen M1/M2 receipts, and accepted generation-2 parity kernel.

**Inputs:** `THREE-LAYER-PROTOCOL.md`, parent evidence receipt schema/validator,
parent fixture evaluator, parent F3 receipt, M1/M2 schemas and receipts, and
generation-1 protected manifest.

**Outputs:**

- `contracts/adjudication-overlay.schema.yml`
- `runtime/validate-adjudication-overlay.mjs`
- `runtime/materialize-adjudicated-f3.mjs`
- `fixtures/contracts/adjudication-overlay-vectors.json`
- `tests/adjudication-contract.test.mjs`
- Task Session context, result, receipt, and observability signal

**Ordered algorithm:**

1. Revalidate protected generation 1 and frozen M1/M2 bytes.
2. Define `cdsc.adjudication-overlay.v1` with exact parent/M1/M2 handle
   bindings, two substitution bindings, a total `A x S` matrix, usefulness
   adjudication, uncertainty resolutions, carried uncertainty, reviewers, and
   required prohibited inferences.
3. Require overlay explanation IDs to equal parent `A` exactly.
4. Require substitution IDs to equal parent permitted/breaking IDs exactly;
   bind M1 only to permitted and M2 only to breaking.
5. Reject combined, missing, duplicate, extra, partial-as-explained, disputed-as-
   approved, and outcome-derived-target vectors.
6. Implement a pure materializer that copies parent `G`, `A`, `Q01-Q05`, and
   their cells; derives separate `Q06/Q07` target propositions from parent `S`;
   maps overlay cells; derives `S`, `D`, `U`, reviewers, handles, and
   prohibitions under the protocol.
7. Validate the materialized projection through the frozen parent v1 validator.
8. Run every positive/negative vector twice and compare canonical bytes.

**Failure modes:** handle mismatch, parent explanation drift, changed
prediction, wrong mutation binding, non-total matrix, extra explanation,
combined coordinate, incomplete evidence marked complete, dropped uncertainty,
unknown enum, nondeterministic bytes, or protected-file drift.

**Write scope:** generation-2 package `contracts/`, `runtime/`,
`fixtures/contracts/`, `tests/adjudication-contract.test.mjs`, this SWU's run
evidence, and status synchronization only. Parent contracts/evaluator,
generation-1 evidence/results, M1/M2, and source repositories are read-only.

**Done criteria:** schemas and direct validators agree; all negative vectors
fail before evaluation; the empty/example overlay materializes a parent-valid
v1 projection deterministically; protected bytes match.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/adjudication-contract.test.mjs
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/*.test.mjs
```

**Execution owner:** local fallback through Task Session.

**Handoff:** on pass, route only to SWU-CDSC2-005B with accepted contract,
validator, materializer, frozen parent/M1/M2 handles, and no source checkout.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** overlay schema, direct validator, deterministic materializer, 16
negative vectors, focused test, and
`../../../../runs/SWU-CDSC2-005A/TASK-SESSION-RESULT.md`. Focused tests passed
23/23; combined parent/generation-2 tests passed 72/72.
