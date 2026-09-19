# SIC-FAC-000-R2 Fresh Revalidation Work Pack — Attempt B

## Current state

Attempt A preserved an exact 14-file candidate and stopped `BLOCK` when its acceptance wrapper misread the CLI detail shape. The factory itself rejected the hostile mismatch before publication. The governance sidecar staged a one-predicate runner repair, and the generic-factory owner explicitly authorized a fresh candidate plus complete revalidation.

## Selected SWU

### SIC-FAC-000-R2-SWU-001-REVALIDATION-B

- Status before execution: selected, not started
- Material frontier: one fresh runner path in `TASK-CONTRACT.md`
- Product frontier: 14 read-only candidate inputs from `producer/EXPECTED-POST-APPLY.json`
- Evidence frontier: declared Attempt B command, run, probe, executor, terminal, and continuity outputs
- Lifecycle owner: `generic-factory-owner`

## Ordered execution

1. Validate Inventory readiness, source receipt, sidecar receipt/patch, staged runner derivation, and all 14 live product hashes.
2. Bind strict context and an independent runner audit.
3. Validate the one-target Invoke material package and Refresh handoff.
4. Run fresh Task Session mutation admission immediately before creating the runner target.
5. Create the runner target from the admitted staged bytes and rehash it.
6. Execute the single declared full validation command once.
7. Reconcile every generated path to the declared execution outputs and prove product drift remains zero.
8. Join and close the bounded helper.
9. Write result, owner, closeout, and continuity artifacts; write the Task Session receipt last.

## Done criteria

- Independent runner audit passes with zero product writes.
- Material receipt is current-schema `pass/ready` for exactly one runner target.
- Mutation admission is `admit` with `mutationReady=true` for the exact live controls.
- Runner target matches SHA-256 `5f2dae2d3bb84cdc386df5b85eff97aecc097535b0ae450f03d98570446905d7`.
- Full validation reaches terminal `PASS` with no masked earlier failure.
- Helper is joined and closed; all outputs reconcile; product validation drift is zero.

## Failure policy

Every criterion is acceptance-critical. Preserve the first failure and close `BLOCK`; never rerun the same Attempt B output root.

## Exclusions

No additional product mutation, Inventory mutation, integration contract/profile work, Revision 2 mutation, promotion, publication, release, deployment, or production claim.
