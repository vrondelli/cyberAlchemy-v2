# SWU Closeout Contract — WP-FMT-001

Planning authority only. This contract does not admit, execute, or close a unit.

## Admission baseline

At Task Session admission, capture `sha256` or the literal state `absent` for every path
in the selected unit's six-target closeout inventory:

1. `WORK-PACK.md`;
2. `EXECUTION-ENTRY.json`;
3. `work-pack/shared/SWU-MANIFEST.json`;
4. the owning task document;
5. the owning wave document;
6. `work-pack/receipts/<SWU-ID>-CLOSEOUT.json`.

The baseline is part of the Task Session request and receipt. A missing target is not
silently created unless it is the declared closeout receipt path.

## Apply rule

After the selected unit's acceptance-critical command passes, Invoke Refresh may prepare a
closeout candidate changing only the six inventoried targets. Apply requires exact owner
approval. Immediately before apply, recompute every baseline and reject any mismatch.
Immediately after, validate all six target hashes, lifecycle wording, JSON schemas, links,
and successor state. Preserve the first failed command status; cleanup cannot turn a failed
closeout into a pass.

Closeout may record the unit complete and expose its successor as eligible. It must not
select, admit, mutate for, or execute that successor. Terminal `SWU-FMT-014` has no
successor and routes only to a separate owner review.

## Allowed delta classes

| Unit range | Allowed delta |
| --- | --- |
| `SWU-FMT-001..003` | new validator sources, tests, fixtures, and `package.json` script entries only. **No existing repository content may change.** |
| `SWU-FMT-004..005` | edits confined to the named `.md` cards' `## Edge participation` sections. No schema, criterion, or prose outside that section. |
| `SWU-FMT-006` | new plan artifacts only. |
| `SWU-FMT-007..008` | renames and reference/pin updates named in `REPIN-TRANSACTION.json`. **Byte-unchanged: the 176 experiment records, the 33 comment-bearing files, tool-owned lockfiles, `.craft/ledger.yml`.** |
| `SWU-FMT-009` | new evidence artifacts only. |
| `SWU-FMT-010..014` | doc fields, generator, generated cards, fixtures, and script wiring. |

## Receipt minimum

Each fixed closeout receipt records the selected unit, parent task, wave, source Task
Session receipt and hash, preimage states, candidate hashes, applied hashes, all validation
commands with exit status, changed-byte inventory, successor, authority effect `none`, and
the claim ceiling. A failed or unapplied candidate cannot be described as closed.

## Typed prerequisites

| ID | First affected SWU | Gap | Owner |
| --- | --- | --- | --- |
| `FMT-PR-001` | 006 | `WP-SMO-001` G1 stages `relationships.yml` and `supported-profiles.yml`; L2 cannot move them while that package is frozen | SMO owner / refine evidence-refresh |
| `FMT-PR-002` | 009 | the paired negative control for each oracle fixture must be identified before regeneration | validation owner |
| `FMT-PR-003` | 010 | Q1/Q2 are owner choices, not derivable | definitions-governance |

A Task Session may implement fail-closed readers or fixtures before an owner receipt
exists, but it cannot mark the corresponding acceptance boundary pass using a self-issued
substitute.

## Coverage

| Unit | Task | Wave | Closeout receipt | Successor |
| --- | --- | --- | --- | --- |
| SWU-FMT-001 | TASK-FMT-CHECKS | W0-CHECKS | `SWU-FMT-001-CLOSEOUT.json` | SWU-FMT-002 |
| SWU-FMT-002 | TASK-FMT-CHECKS | W0-CHECKS | `SWU-FMT-002-CLOSEOUT.json` | SWU-FMT-003 |
| SWU-FMT-003 | TASK-FMT-CHECKS | W0-CHECKS | `SWU-FMT-003-CLOSEOUT.json` | SWU-FMT-004 |
| SWU-FMT-004 | TASK-FMT-CORRECTIONS | W1-CORRECTIONS | `SWU-FMT-004-CLOSEOUT.json` | SWU-FMT-005 |
| SWU-FMT-005 | TASK-FMT-CORRECTIONS | W1-CORRECTIONS | `SWU-FMT-005-CLOSEOUT.json` | SWU-FMT-006 |
| SWU-FMT-006 | TASK-FMT-REPIN | W2-FORMAT | `SWU-FMT-006-CLOSEOUT.json` | SWU-FMT-007 |
| SWU-FMT-007 | TASK-FMT-REPIN | W2-FORMAT | `SWU-FMT-007-CLOSEOUT.json` | SWU-FMT-008 |
| SWU-FMT-008 | TASK-FMT-REPIN | W2-FORMAT | `SWU-FMT-008-CLOSEOUT.json` | SWU-FMT-009 |
| SWU-FMT-009 | TASK-FMT-REPIN | W2-FORMAT | `SWU-FMT-009-CLOSEOUT.json` | SWU-FMT-010 |
| SWU-FMT-010 | TASK-FMT-GENERATE | W3-GENERATE | `SWU-FMT-010-CLOSEOUT.json` | SWU-FMT-011 |
| SWU-FMT-011 | TASK-FMT-GENERATE | W3-GENERATE | `SWU-FMT-011-CLOSEOUT.json` | SWU-FMT-012 |
| SWU-FMT-012 | TASK-FMT-GENERATE | W3-GENERATE | `SWU-FMT-012-CLOSEOUT.json` | SWU-FMT-013 |
| SWU-FMT-013 | TASK-FMT-GENERATE | W3-GENERATE | `SWU-FMT-013-CLOSEOUT.json` | SWU-FMT-014 |
| SWU-FMT-014 | TASK-FMT-GENERATE | W3-GENERATE | `SWU-FMT-014-CLOSEOUT.json` | none; owner review only |

Coverage: 14/14 units, one fixed closeout path per unit.
