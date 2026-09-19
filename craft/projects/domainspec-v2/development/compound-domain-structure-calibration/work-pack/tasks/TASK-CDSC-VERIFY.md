# TASK-CDSC-VERIFY

## SWU-CDSC-007 - Independent Replay And Closeout

**Goal:** Independently replay generation 1, audit boundaries and claims, and
route the bounded result.

**Dependencies:** SWU-CDSC-006 accepted.

**Inputs:** generation manifest, three receipts, four result artifacts,
generation index, accepted research, specification, and architecture.

**Outputs:**

- `runs/SWU-CDSC-007/INDEPENDENT-REPLAY.md`
- `runs/SWU-CDSC-007/AUDIT.md`
- `runs/SWU-CDSC-007/TASK-SESSION-RESULT.md`
- final work-pack state synchronization

**Audit rules:**

1. Replay from frozen inputs in a fresh process.
2. Compare semantic result bytes and generation handles.
3. Verify the two fixture-source repositories have no dispatch-caused diff.
4. Scan outputs for forbidden identity, irreducibility, portability, pattern,
   replication, authority, activation, and promotion claims.
5. Verify the suite verdict follows F2, rubric-failure, and replay rules.
6. Verify every uncertainty and disagreement remains present.
7. Route `CALIBRATION-DEFER` to evidence repair, `CALIBRATION-FAIL` to method
   review, and `CALIBRATION-PASS` to bounded follow-up research only.

**Write scope:** `runs/SWU-CDSC-007/` plus status-only synchronization in this
package's work-pack artifacts.

**Done criteria:** independent replay agrees; authority scan passes; source
repositories remain read-only; dispatch receipts are complete; next route is
bounded and does not promote anything.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/tests/*.test.mjs
git diff --check -- projects/domainspec-v2/development/compound-domain-structure-calibration
```

**Execution owner:** `manual` independent auditor through Task Session.

**Handoff context:** all generation-1 handles and accepted result artifacts, but
not unfrozen alternate evidence. Any substantive reinterpretation becomes a new
research or decision route.

**State:** complete via manual local audit on 2026-07-12.

**Evidence:** `runs/SWU-CDSC-007/INDEPENDENT-REPLAY.md`,
`runs/SWU-CDSC-007/AUDIT.md`, and
`runs/SWU-CDSC-007/TASK-SESSION-RESULT.md`. Replay is identical, the authority
scan passes, and the bounded result remains `CALIBRATION-DEFER` routed to a new
evidence-repair generation.
