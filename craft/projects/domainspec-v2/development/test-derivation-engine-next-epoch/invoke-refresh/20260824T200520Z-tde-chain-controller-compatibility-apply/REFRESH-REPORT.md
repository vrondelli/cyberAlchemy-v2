# Invoke Refresh apply report: TDE chain-controller compatibility

## Outcome Brief

The exact 84-file `@3` candidate was created only after the standard material package and file-bound handoff passed. Every live file is still byte-equal to its approved staged postimage, but post-apply validation found two governance defects, so this Refresh is blocked and cannot proceed to acceptance, selection, or execution.

- Objective: apply and live-validate the exact controller-compatible TDE successor.
- Result: 84 create-only targets applied exactly; lifecycle wording and declared validation-command binding failed acceptance-critical checks.
- Why it matters: the structural controller repair works, but the candidate identity and validation evidence are not safe to accept or execute.

## Boundary and Next Decision

- Changed: exactly 84 canonical files under `projects/domainspec-v2/development/test-derivation-engine-next-epoch/invoke-define-design-plan/20260824T192000Z-tde-multiformalism-profile-epoch-r3/**`, plus run-local evidence under this apply root.
- Unchanged: accepted `@2`, proposal bytes, material bytes after their validated apply, product implementation, authority, Craft, telemetry, Git, publication, release, deployment, and external state.
- Open questions: none inside diagnosis; the joined sidecar classifies both failures as governance-only.
- User decision: authorize a future proposal-only Refresh only when ready to author a fresh successor; the recommended uncreated identity is `@4`.
- Next action: `invoke:refresh:proposal-only` for a fresh `@4` candidate, followed by new apply authorization, live validation, v2 preacceptance closure, and renewed exact Rondelli acceptance. Selection and chain approval remain later; Victor remains pre-merge only.

## Technical Details

## Invoke Validation Fixture Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: block
- Phase status basis: applied bytes exist, but two acceptance-critical Refresh-authoring blockers remain
- Handoff readiness: blocked
- Mutation mode: apply-approved
- Applied changes: 84 exact create-only targets
- Material package: pre-apply pass/ready; canonical digest `e01a2ba7da92fd08bb533826241b438c0fee6d5b5d608399bec17299632b4904`
- Live byte equality: pass, 84/84, no extras or symlinks
- Live WPRA: `PLAN_SEMANTIC_READY`
- Live implementation readiness: `PLAN_IMPLEMENTATION_READY` with `mutation_ready=false`
- Controller: former `MANIFEST_SHAPE_INVALID` cleared; expected stop `EPOCH_APPROVAL_INVALID`; no controller state or Task Session created
- Blocking lifecycle findings: 34 references across 20 paths, plus eight additional current identity labels
- Blocking command finding: declared `--contracts` operand is an aggregate file; corrected read-only directory-bound run passes 10 units but cannot repair the accepted material binding
- Mutation ready: false
- Authority effect: none
- Next route: proposal-only fresh successor, recommended `dsv2-tde-multiformalism-profile-epoch@4`
