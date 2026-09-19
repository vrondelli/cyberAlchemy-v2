# WP-FMP-002 Terminal Receipt Refresh Context Pack

This is strict run-local execution evidence for the bounded Invoke Refresh authorship role. It is not a canonical Plan, owner decision, Task Session admission, or execution authorization.

## Identity and boundary

- Task: stage candidate `WP-FMP-002-candidate@2` to repair the two exact terminal-receipt readiness blockers.
- Source Work Pack: `WP-FMP-002-candidate@1`, preserved byte-for-byte.
- Write scope: this Refresh run root only; candidate @2 is represented only as staged postimages.
- Forbidden effects: live apply, owner acceptance, SWU selection, Work Pack execution, readiness rerun, Git, Craft, telemetry, publication, and external transport.

## Obligation coverage

| ID | Obligation | Evidence and resolution | Status |
| --- | --- | --- | --- |
| R1 | Preserve candidate @1 exactly | 39-file source tree captured before authoring; validation requires digest `b3358793ee053b271cfd0211686b34a0203815deb883a4cd22d672784b6fa814` | covered |
| R2 | Bind a real terminal receipt schema | Current Task Session `governance-terminal-receipt.schema.json`, exact path/size/SHA | covered |
| R3 | Bind the actual precloseout profile | Task Session terminal, precloseout, validation, and governance-run request closeout selectors | covered |
| R4 | Provide executable WP/SWU semantic validation | Plan-local validator traverses exact receipt refs and checks task/SWU/run, validation, blockers, evidence, owner, and successor semantics | covered |
| R5 | Prove fail-closed behavior | One positive and 13 adversarial fixture classes exercise the staged schema and validator bytes | covered |
| R6 | Preserve authority gates | Rondelli remains primary owner and Victor Boscaro remains the distinct second approver; both requests remain pending | covered |
| R7 | Make the apply scope exact | Target inventory, changes, and approval scope contain the same 44 create-only candidate paths | covered |
| R8 | Keep execution outside Refresh | No SWU is selected or executed; readiness rerun remains parent-owned after exact apply | covered |

Coverage is 8/8. There is no Refresh-authoring blocker. Apply and audit are later gates, not evidence that this staged role failed.

## Selected evidence

- Failed readiness report: terminal schema and semantic validator bindings are the only reported blockers.
- Failed audit config: `receipt_bindings.terminal_schema_ref` and `semantic_validator_ref` are null.
- Candidate @1 manifest, closeout contracts, and execution entry: exact six-SWU semantics and owner-gated route to preserve.
- Task Session schemas: generic terminal receipt, precloseout receipt, governance evaluation receipt, and closeout request profile.
- Work Pack Readiness v2 schema and pre-route logic: an exact binding reference plus an opaque exact validator artifact are mechanically admitted.
- Invoke Refresh contract: direct-user `apply-approved` requires exact target equality and a valid staged material package.
- Validated dispatch and role briefing: helper authors staged bytes only; parent owns validation, apply, readiness rerun, and closure.

## Inventory lookup

The repository Inventory machine view validated with `lookup_readiness=ready` and 153 uncontrolled historical tag warnings. Nearby entries were broad DomainSpec-v2 or prior one-shot workflow syntheses; none provided a more exact selector than the readiness report, current candidate, or runtime schemas, so they were excluded from the selected source set.

## Fallback and stop rule

If any target already exists, candidate @1 drifts, exact Task Session schema bytes drift, a fixture unexpectedly passes, a declared positive fixture fails, or the material inventories differ, stop and return `BLOCK`. Do not infer an owner response or repair product semantics.
