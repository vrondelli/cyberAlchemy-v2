# D0b.4a observation-fixture implementation gate

Status: **pending owner choice**, 2026-10-04. Route: `CA2-ROUTE-PLAN`.
Authority effect: none. This is a decision record, not implementation
authorization, profile qualification, or live activation.

## Decision question

Should the next bounded implementation objective be D0b.4a, the disposable
DSH Web Host/Registry/Agent-mount observation fixture defined in the
[construction contract](D0B4-DSH-GRAPH-LOCK-CONSTRUCTION-2026-10-04.md#d0b4a-observation-fixture-acceptance-checklist)?

| Option | Benefit | Cost or risk | Downstream impact |
| --- | --- | --- | --- |
| A — authorize D0b.4a only | Makes the pinned 173-to-208-fiber structural baseline and direct-plugin rejection repeatable before source-pinned witness work | Adds local test/fixture maintenance; still proves no graph lock, Host identity, or Web ownership | Enables evidence-backed D0b.4b design, subject to its own later implementation gate |
| B — defer D0b.4a | Keeps runtime/test files unchanged while further read-only analysis continues | Delays the first repeatable structural reconciliation and all dependent graph-lock construction | D0b.4 remains planning/source evidence only |

Recommendation: **A**, because the task is bounded to adapter `test/fixtures/`,
`test/`, and candidate evidence; it uses a disposable local Host, no prompt,
no model call and no live profile. An owner selection is still required for
the exact implementation route and write scope. The selected single-local-Host
principal for the first Web profile is a separate P1g decision and does not
answer this gate.

The exact candidate construction boundary is now frozen in
[D0B4A-CONSTRUCTION-BINDING-2026-10-04.md](D0B4A-CONSTRUCTION-BINDING-2026-10-04.md).
It permits only two new test files plus the post-pass evidence file. The
observer is an out-of-graph `runProfile()` child harness using in-memory IPC,
not another Host plugin, so it does not alter the fiber counts it measures.
The binding names the current source hashes, positive and negative assertions,
secret/log handling, cleanup, rollback, stop conditions and claim ceiling.

## Selection and remaining blockers

- Selected option: **none**.
- Decision source: **none yet**; no approval is inferred from the standing
  goal to continue the latest plan or from the earlier plan update.
- Remaining blocker: an explicit owner-directed `CA2-ROUTE-IMPLEMENT`
  objective for the three-file D0b.4a write scope frozen in the construction
  binding under the D65 boundary.
- If A is selected, the test may record structural counts and a negative
  direct-registration case, but must not claim callback origin. The pinned
  Cordis source retains no resolved callback-module identity; D0b.4c's early
  provenance capture remains a later, separately gated unit.

## Open Questions

- Will the owner select A or B?
- If A, does the owner accept exactly the two named test files and one
  post-pass evidence file, with no live activation or runtime-source change?
