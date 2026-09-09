# Invoke refresh report — readiness synchronization apply

## Result

- Mode: `refresh`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Handoff status: `ready`
- Mutation ready: `true`
- Targets applied: 5
- Owner split: Invoke 2; Craft 3
- Implementation executed: no

Both owner-scoped material packages passed exact package identity/digest,
dependency, lifecycle-owner, private-authority, internal-publication, path, and
validation-command checks before mutation. Their handoffs were `ready`.

## Applied changes

| Owner | Target | SHA-256 after apply |
|---|---|---|
| Invoke | `planning/WORK-PACK.md` | `b3c01e40cdd9913120a1b0d3fa719f9219db1d0268b991d5a89dde6da1bd3999` |
| Invoke | `planning/work-pack/tasks/TASK-ARE-READINESS-001.md` | `b695bc8c02d8ca1564ecb0661eb0cd73507f9f8e1b108dc8383391236e0a2967` |
| Craft | `.craft/ledger.yml` | `c019b88c4b73b572e79a8aad41d51d66e6780a9e1f7f2979d29c97a03944f3a8` |
| Craft | `.craft/index.json` | `e79b459199f5f48d66f8a8fa34e249e3ad6fc5890b2236696204964b6da77da5` |
| Craft | `CRAFT.md` | `e7a3b5bd93e30c93fcb20253e0838f8e8b5cc76b2be68f8ecad4a467a532f149` |

The changes map to proposal signals `RS-ARE-001` through `RS-ARE-007`.
`implementation_authorized: false` remains intact: the apply reconciles
planning state and does not itself execute implementation.

## Validation

- Invoke material package: `pass`, handoff `ready`.
- Craft material package: `pass`, handoff `ready`.
- Staged sync validation: `pass`.
- Applied targets byte-equal validated staged outputs: `pass`.
- Craft ledger parses; embedded indexes match the generated index: `pass`.
- Generated index ledger digest equals the applied ledger: `pass`.
- Active policy blockers: none.
- Active gaps preserved: six.
- Planning task and SWU statuses match the readiness receipt.
- Trailing-whitespace scan: `pass`.

## Boundary result

- No evaluator or other implementation file was created by Refresh.
- No SWU status was changed to executing or completed.
- No semantic-witness, anti-bias-efficacy, rollout, or promotion claim was
  admitted.
- No public Arcanum or canonical definition surface was mutated.

## Next route

`task-session:execute:SWU-ARE-001`.

The user's current request authorizes serial Task Session execution of all
dependency-ready SWUs. Each Task Session remains one SWU, must close and
synchronize before the next session, and must stop at any promotion, evidence,
or owner gate.
