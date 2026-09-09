# Refresh patch proposal — readiness synchronization

Mutation mode is `proposal-only`. This document is an exact change contract,
not authorization to mutate the named targets.

## 1. Invoke-owned planning delta

### `planning/WORK-PACK.md`

Apply these field-level changes:

1. Frontmatter:
   - `status: planned-blocked-before-implementation`
   - becomes
   - `status: planned-policy-ready-awaiting-explicit-implementation-authorization`
2. Preserve `selected_swu: SWU-ARE-001`.
3. Preserve `implementation_authorized: false`.
4. Task board:
   - `TASK-ARE-READINESS-001`: `blocked-owner-decisions` → `completed`
   - `TASK-ARE-EVALUATOR-001`: `selected-blocked` →
     `selected-ready-awaiting-explicit-authorization`
5. SWU manifest:
   - `SWU-ARE-001`: `selected, blocked` →
     `selected, ready-awaiting-explicit-authorization`
6. Immediately after the gate table, add:

   > Current `G-ARE-POLICY` evidence: `TASK-ARE-READINESS-001` passed through
   > `decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json`;
   > its claim ceiling is policy readiness only.

7. Blocker table:
   - keep IDs, owners, and history visible;
   - change the first three `Type` values from `implementation blocker` to
     `resolved implementation blocker`;
   - replace each closure cell with the exact policy record plus terminal
     receipt:
     - `BLK-ARE-APP-001` →
       `APPLICABILITY-POLICY-v1.md` + terminal receipt
     - `BLK-ARE-CHAL-001` →
       `CHALLENGE-CLOSURE-POLICY-v1.md` + terminal receipt
     - `BLK-ARE-EFFECT-001` →
       `TEST-EFFECT-POLICY-v1.md` + terminal receipt
8. Replace the current-state paragraph with:

   > Planning status is **pass**; policy readiness is **pass**; implementation
   > authorization remains **not granted**. `SWU-ARE-001` is selected and ready
   > for a separately authorized execution route, but it is not handed off or
   > executing. The next move is to apply and validate this synchronization
   > through the owning Invoke and Craft lifecycles. Only then may a separately
   > approved Task Session or Goal route execute the selected frontier.

Signal mapping: `RS-ARE-001` through `RS-ARE-007`.

### `planning/work-pack/tasks/TASK-ARE-READINESS-001.md`

Apply these changes:

1. Change `Status: **blocking**` to `Status: **completed**`.
2. Preserve the decisions-only write scope and SWU exemption.
3. Append a `## Completion evidence` section containing:
   - terminal receipt:
     `decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json`
   - boundary review:
     `decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md`
   - gate result: `G-ARE-POLICY: pass`
   - claim ceiling: policy readiness only
   - explicit statement: no evaluator code or implementation evidence was
     created.

Signal mapping: `RS-ARE-001`, `RS-ARE-005`, `RS-ARE-007`.

## 2. Craft-owned lifecycle delta

Do not hand-edit `.craft/index.json`. Run the Craft lifecycle owner against
`.craft/ledger.yml`, then regenerate the index and human view.

### `.craft/ledger.yml`

The Craft owner should make these schema-valid changes:

1. Add `ART-ARE-READINESS-RECEIPT` to `indexes.by_id`,
   `indexes.artifacts_by_path`, `contexts[0].owned_artifacts`, and `artifacts`.
   - path:
     `decisions/implementation-readiness/session-evidence/TASK-ARE-READINESS-001-RECEIPT.json`
   - artifact type: `execution-receipt`
   - status: `pass`
   - note: closes policy-readiness blockers only.
2. Set `indexes.active_blockers: []`.
3. Replace both indexed and context `next_move` values with:

   > Apply and validate the readiness synchronization through Invoke refresh
   > and Craft; then request separate authorization for SWU-ARE-001 or the
   > work-pack Goal frontier.

4. Change `contexts[0].gate` from `block` to `pass`, while retaining
   `contexts[0].stage: plan`.
5. Update the context notes and active description to say:
   - `G-ARE-POLICY` passes;
   - the three policy blockers are resolved;
   - `SWU-ARE-001` is ready but not authorized;
   - semantic-witness and downstream gaps remain active.
6. For `BLK-ARE-APP-001`, `BLK-ARE-CHAL-001`, and
   `BLK-ARE-EFFECT-001`:
   - `refinement_status: resolved`
   - `requires_human: false`
   - `status: resolved`
   - evidence: `ART-ARE-READINESS-RECEIPT`
   - summary: the named policy exists and passed the boundary/readiness review
   - preserve the original owner and closure condition as history.
7. Do not close or remove any gap row.

Signal mapping: `RS-ARE-001` through `RS-ARE-004`, `RS-ARE-006`,
`RS-ARE-007`.

### `.craft/index.json` and `CRAFT.md`

1. Regenerate `.craft/index.json` from the updated ledger using the Craft
   validator/generator; its `ledger_sha256` must equal the updated ledger.
2. Refresh `CRAFT.md` so it reports:
   - stage/gate `plan` / `pass`
   - active policy blockers: none
   - `G-ARE-POLICY`: pass
   - `SWU-ARE-001`: ready, not authorized
   - all six existing active gaps preserved
   - the exact next move above.

Signal mapping: `RS-ARE-001` through `RS-ARE-007`.

## 3. Apply validation contract

An `apply-approved` run must block unless all checks pass:

1. Recompute the four controlling policy/review digests and match the Task
   Session receipt.
2. Confirm `implementation_authorized: false`.
3. Confirm no file under
   `cyberAlchemy-v2/implementation/agent-reasoning-engine/` changed.
4. Confirm the readiness task is completed and `SWU-ARE-001` is only
   ready-awaiting-explicit-authorization.
5. Validate `.craft/ledger.yml` against schema version `0.3.0`.
6. Rebuild and validate `.craft/index.json`; confirm its ledger digest.
7. Confirm `CRAFT.md` is a faithful human projection.
8. Re-run link and whitespace checks.
9. Emit separate Invoke and Craft receipts, or one joined receipt that retains
   both lifecycle owners.

## 4. Explicit non-changes

- No evaluator source or tests.
- No `implementation_authorized: true`.
- No SWU execution status.
- No closure of semantic-witness or downstream gaps.
- No mutation to public Arcanum or canonical definitions.
- No reasoning-engine or anti-bias efficacy claim.
