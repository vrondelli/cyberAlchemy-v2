# Refresh Patch Proposal — FPR01-003 PASS Synchronization

Status: proposal-only
Apply gate: explicit `apply-approved` Invoke Refresh

## Proposed Authored Deltas

### `WORK-PACK.md`

Signals: `RS-FPR01003PASS-001` through `RS-FPR01003PASS-008`.

- Change the FPR-01 task row from `FPR01-003 blocked-with-code` to
  `FPR01-003 PASS; FPR01-004 selected for ratification`.
- Mark `TASK-FPR01-003-REMEDIATION` completed.
- Mark `SWU-FPR01-003`, both repair SWUs, and the replay SWU completed.
- Change `SWU-FPR01-004` from blocked to selected; do not execute it.
- Mark `BLK-FPR01003-002` and `BLK-FPR01003-003` resolved. Preserve
  `PLAN-B2-BASELINE` as partially resolved because ratification is still pending, but
  replace its stale repair dependency text with the PASS replay and FPR01-004 route.
- Rewrite gate checks so exactly one unit, `SWU-FPR01-004`, is selected.
- Append a 2026-07-17 Invoke Refresh change-log row.

### `EXECUTION-PACK.md`

Signals: `RS-FPR01003PASS-005` through `RS-FPR01003PASS-008`.

- Set the planning gate to pass for selected `SWU-FPR01-004`.
- Set the active plan back to W1; mark W1R completed.
- Change the W1 row to `SWU-FPR01-004 selected` and the W1R row to completed.
- Replace the blocked current-state section with replay PASS, closed W1R blockers,
  and unexecuted FPR01-004 selection.
- Preserve W2 and later waves as blocked.

### `IMPLEMENTATION-LAYERING.md`

Signals: `RS-FPR01003PASS-002` through `RS-FPR01003PASS-008`.

- Mark L1-R1, L1-R2, and L1-R3 complete with their receipt-backed evidence.
- Record W1R recomposition into W1.
- Change the recommended next layer/unit to the independent L1 ratification boundary,
  `SWU-FPR01-004`.
- Preserve the explicit no-ratification and no-production boundary.

### `TASK-FPR-01-AUTHORITY-BASELINE.md`

Signals: `RS-FPR01003PASS-001`, `RS-FPR01003PASS-005`,
`RS-FPR01003PASS-007`, `RS-FPR01003PASS-008`.

- Replace “Current FPR01-003 Remediation Route” with a completed-replay section
  binding the PASS receipt digest.
- State that synchronized PASS selects `SWU-FPR01-004` but does not satisfy its
  ratification contract.
- Keep the task `ready`/active until FPR01-004 independently passes.

### `TASK-FPR01-003-REMEDIATION.md`

Signals: `RS-FPR01003PASS-002` through `RS-FPR01003PASS-005`.

- Change frontmatter status from `ready` to `completed`.
- Mark all three blockers closed with their exact receipt evidence.
- Mark both repairs and replay completed.
- Replace hypothetical entry/stop text with the observed completion evidence while
  retaining historical decision boundaries.
- Route only to Invoke synchronization and FPR01-004 selection.

### `W1-AUTHORITY-BASELINE.md`

Signals: `RS-FPR01003PASS-001`, `RS-FPR01003PASS-005`,
`RS-FPR01003PASS-007`, `RS-FPR01003PASS-008`.

- Change status from `remediation-ready` to `ratification-ready`.
- Mark FPR01-003 completed with replay receipt SHA-256
  `ad4064f890fb3445de642b8a2096a0de6961f89b011cf45e3d43caeed17d68a3`.
- Mark W1R completed and FPR01-004 selected but unexecuted.
- Keep the promotion gate unsatisfied until the independent ratification receipt.

### `W1R-FPR01-003-REMEDIATION.md`

Signals: `RS-FPR01003PASS-002` through `RS-FPR01003PASS-005`.

- Change status from `ready-guard-selected` to `completed`.
- Replace stale entry conditions with observed receipt evidence.
- Mark all three included units completed.
- Add recomposition evidence: replay PASS, five mutants killed, aggregate 101/101,
  and zero post-receipt guard violations.
- Preserve the statement that this wave cannot ratify FPR-01.

### `projects/domainspec-v2/.craft/ledger.yml`

Signals: all eight refresh signals.

- Remove `BLK-FPR01003-001`, `BLK-FPR01003-002`, and
  `BLK-FPR01003-003` from `indexes.active_blockers`.
- For each retained blocker row, set `status: resolved` and
  `refinement_status: resolved`, and add receipt-backed `closure_evidence`.
- Update both FPR next-move projections to Task Session for selected
  `SWU-FPR01-004`; retain context `gate: block` until ratification completes.
- Change `ART-DSV2-FPR01-003-BASELINE` and
  `ART-DSV2-FPR01-003-RECEIPT` from blocked to active, with PASS notes and
  unratified boundary.
- Update validator notes from blocked canonical state to deterministic PASS.
- Register stable artifact rows and `by_id`/`artifacts_by_path` entries for the guard
  receipt, sample receipt, replay machine result, and applied refresh report.
- Preserve the prior blocker-sync artifact as historical active evidence.
- Do not add an FPR-01 completion or FPR-02 authorization row.

## Generated Deltas

Signals: `RS-FPR01003PASS-006` through `RS-FPR01003PASS-008`.

After the Craft mutation:

1. run `python3 projects/domainspec-v2/development/first-production-release/visibility/tools/build-roadmap.py`;
2. accept only deterministic changes to `visibility/roadmap-data.json` and
   `visibility/roadmap.html`; and
3. run the same command with `--check`.

The generated views may show the repaired internal frontier and selected FPR01-004,
but they must continue to show FPR-01 open and production unauthorized.

## Explicit No-Ops

- `ROADMAP.md` remains byte-identical.
- Authority baseline/schema/validator/fixtures remain byte-identical.
- Definitions and implementation sources remain unchanged.
- FPR01-004 receipt does not exist yet and is not fabricated.
- FPR-01 is not marked complete.
- FPR-02 is not opened.
- Production is not authorized.

## Apply Stop Conditions

Stop without partial synchronization if:

- any preimage digest differs;
- a source receipt no longer parses or no longer reports PASS;
- Craft reference integrity fails;
- a blocker lacks receipt-backed closure evidence;
- canonical replay or any mutant changes;
- aggregate validation or the retired-reference audit fails;
- roadmap generation is nondeterministic;
- `ROADMAP.md` would need a semantic status change; or
- the patch would imply ratification, FPR-02 entry, or production authority.
