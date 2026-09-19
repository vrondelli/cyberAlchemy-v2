# SWU Closeout Contract

This contract applies to every unit in `WP-SFC-001`. It is planning authority
only. It does not admit, execute, or close a unit.

## Admission baseline

At Task Session admission, capture `sha256` or the literal state `absent` for
every path in the selected unit's six-target closeout inventory:

1. `WORK-PACK.md`;
2. `EXECUTION-ENTRY.json`;
3. `work-pack/shared/SWU-MANIFEST.json`;
4. the owning task document;
5. the owning wave document;
6. `work-pack/receipts/<SWU-ID>-CLOSEOUT.json`.

The baseline is part of the Task Session request and receipt. A missing target
is not silently created unless it is the declared closeout receipt path.

## Apply rule

After the selected unit's acceptance-critical command passes, Invoke Refresh
may prepare a closeout candidate that changes only the six inventoried targets.
Apply requires exact owner approval for that candidate. Immediately before
apply, recompute every baseline state and reject any mismatch. Immediately after
apply, validate all six target hashes, lifecycle wording, JSON schemas, links,
and successor state. Preserve the first failed command status; cleanup cannot
turn a failed closeout into a pass.

Closeout may record the unit as complete and expose its successor as eligible.
It must not select, admit, mutate for, or execute that successor. Terminal
`SWU-SFC-020` has no successor and routes only to a separate owner review.

## Receipt minimum

Each fixed closeout receipt records the selected unit, parent task, wave, source
Task Session receipt and hash, preimage states, candidate hashes, applied hashes,
all validation commands with exit status, changed-byte inventory, successor,
authority effect `none`, and the claim ceiling. A failed or unapplied candidate
cannot be described as closed.

## Coverage

| Unit | Owning task | Owning wave | Fixed closeout receipt | Successor |
| --- | --- | --- | --- | --- |
| SWU-SFC-001 | `TASK-SFC-CONTRACT.md` | `W0-CONTRACT.md` | `SWU-SFC-001-CLOSEOUT.json` | SWU-SFC-002 |
| SWU-SFC-002 | `TASK-SFC-CONTRACT.md` | `W0-CONTRACT.md` | `SWU-SFC-002-CLOSEOUT.json` | SWU-SFC-003 |
| SWU-SFC-003 | `TASK-SFC-INPUT.md` | `W0-CONTRACT.md` | `SWU-SFC-003-CLOSEOUT.json` | SWU-SFC-004 |
| SWU-SFC-004 | `TASK-SFC-INPUT.md` | `W0-CONTRACT.md` | `SWU-SFC-004-CLOSEOUT.json` | SWU-SFC-005 |
| SWU-SFC-005 | `TASK-SFC-SCHEMAS.md` | `W0-CONTRACT.md` | `SWU-SFC-005-CLOSEOUT.json` | SWU-SFC-006 |
| SWU-SFC-006 | `TASK-SFC-SCHEMAS.md` | `W0-CONTRACT.md` | `SWU-SFC-006-CLOSEOUT.json` | SWU-SFC-007 |
| SWU-SFC-007 | `TASK-SFC-COMMANDS.md` | `W1-COMPILED-CLI.md` | `SWU-SFC-007-CLOSEOUT.json` | SWU-SFC-008 |
| SWU-SFC-008 | `TASK-SFC-COMMANDS.md` | `W1-COMPILED-CLI.md` | `SWU-SFC-008-CLOSEOUT.json` | SWU-SFC-009 |
| SWU-SFC-009 | `TASK-SFC-BUILD.md` | `W1-COMPILED-CLI.md` | `SWU-SFC-009-CLOSEOUT.json` | SWU-SFC-010 |
| SWU-SFC-010 | `TASK-SFC-BUILD.md` | `W1-COMPILED-CLI.md` | `SWU-SFC-010-CLOSEOUT.json` | SWU-SFC-011 and SWU-SFC-013 eligible |
| SWU-SFC-011 | `TASK-SFC-SECURITY.md` | `W2-HARDENING.md` | `SWU-SFC-011-CLOSEOUT.json` | SWU-SFC-012 |
| SWU-SFC-012 | `TASK-SFC-SECURITY.md` | `W2-HARDENING.md` | `SWU-SFC-012-CLOSEOUT.json` | W2 security lane complete |
| SWU-SFC-013 | `TASK-SFC-RESOURCES.md` | `W2-HARDENING.md` | `SWU-SFC-013-CLOSEOUT.json` | SWU-SFC-014 |
| SWU-SFC-014 | `TASK-SFC-RESOURCES.md` | `W2-HARDENING.md` | `SWU-SFC-014-CLOSEOUT.json` | SWU-SFC-015 after W2 join |
| SWU-SFC-015 | `TASK-SFC-COMPATIBILITY.md` | `W3-COMPATIBILITY-RECOVERY.md` | `SWU-SFC-015-CLOSEOUT.json` | SWU-SFC-016 |
| SWU-SFC-016 | `TASK-SFC-COMPATIBILITY.md` | `W3-COMPATIBILITY-RECOVERY.md` | `SWU-SFC-016-CLOSEOUT.json` | SWU-SFC-017 |
| SWU-SFC-017 | `TASK-SFC-RELEASE-EVIDENCE.md` | `W3-COMPATIBILITY-RECOVERY.md` | `SWU-SFC-017-CLOSEOUT.json` | SWU-SFC-018 |
| SWU-SFC-018 | `TASK-SFC-RELEASE-EVIDENCE.md` | `W3-COMPATIBILITY-RECOVERY.md` | `SWU-SFC-018-CLOSEOUT.json` | SWU-SFC-019 |
| SWU-SFC-019 | `TASK-SFC-PILOT-READINESS.md` | `W4-PILOT-READINESS.md` | `SWU-SFC-019-CLOSEOUT.json` | SWU-SFC-020 |
| SWU-SFC-020 | `TASK-SFC-PILOT-READINESS.md` | `W4-PILOT-READINESS.md` | `SWU-SFC-020-CLOSEOUT.json` | none; owner review only |

Coverage: 20/20 units, one fixed closeout path per unit.
