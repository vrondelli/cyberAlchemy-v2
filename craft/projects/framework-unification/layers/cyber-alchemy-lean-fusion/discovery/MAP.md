# Integration Map — CyberAlchemy × domainspec (discovery pipe, parent view)

> **What this is.** The parent node of a discovery-shaped map of the *whole*
> CyberAlchemy × domainspec integration. It does **not** re-derive the integration
> — most of it is already owned and written (the `TO-VLAD/` memo series and
> `DISPATCH-COMPOSITION-MODEL.md`). This map's only job is to make the integration
> **navigable**: name each axis, point to its owner, hold the evidence/inference
> boundary, and mark the seams that are still open. Child views live in
> [`views/`](views/); read them for the per-axis evidence.
>
> **What this is NOT.** Not a research-dispatch run — no agents were spawned, so
> there are no `agents/NN-role-surname.md` provenance files. The "child views" here
> are the integration's typed *lenses*, not forged agent receipts.

## 0. The two-view split (the evidence/inference boundary)

Per the discovery-pipe model (`Arcanum/TO-VLAD/DISPATCH-COMPOSITION-MODEL.md §9`,
from TO-VLAD7): split an opaque target into typed perspectives, **hold an
evidence/inference boundary**, then compose. Every child view below is split into:

- **EVIDENCE** — what is on-disk and owned, anchored to a file+symbol or a TO-VLAD
  memo that verified it on-disk.
- **INFERENCE / SEAM** — what is claimed, forecast, or open; each open seam carries
  its collapse-test.

The subset rule binds every row: a claim never exceeds its anchor.

## 1. The integration in one line

Two repos, complementary halves of one *capability foundry*:

- **Arcanum / CyberAlchemy** — the lifecycle machine (fabricate → validate →
  promote): sigils/spells, experiment harness, observability writer, Pass/Flag/Block.
- **domainspec** (theorem repo + core) — the epistemic core: typed residue object,
  subset rule + collapse-test + novelty gate, the `research` (role-set, grader)
  strategy, the populated cross-run dispatch ledger.

**Owned vs un-owned, up front:** the *diagnosis* of every seam below is already
owned by the TO-VLAD series. The one genuinely un-owned contribution this project
adds is **View 01** — offering the Lean residue *type* as the filler for the
"residue has no type" gap the memos only diagnosed.

## 2. The five axes (child views)

| # | Axis | View | Owner of the diagnosis | Status | The open seam |
|---|---|---|---|---|---|
| 01 | **Residue type** | [residue-type](views/01-residue-type.md) | TO-VLAD1/2/4 ("residue has no type at any layer") | **OPEN** — the load-bearing seam | does the Lean morphism-action type fill the agent-artifact residue gap, or collapse to prose? |
| 02 | **Claim≤proof / novelty gate** | [claim-proof-gate](views/02-claim-proof-gate.md) | TO-VLAD5 (gates promotion, never novelty) | **PARTLY OWNED** | mechanizing subset-rule as an automatic Pass/Flag/Block, not a label |
| 03 | **Dispatch composition** | [dispatch-composition](views/03-dispatch-composition.md) | `DISPATCH-COMPOSITION-MODEL.md` (consolidated) | **WRITTEN** (design) | `OQ-mixed-dag-schema` reopened; `loop_cap` value unset |
| 04 | **Observability / logging fusion** | [observability-fusion](views/04-observability-fusion.md) | DCM §7 + §12 | **PLAN, NOT BUILT** | Claude hook surface + envelope producer; empty ledger |
| 05 | **Reflection / measurement** | [reflection-measurement](views/05-reflection-measurement.md) | TO-VLAD1/3/4 ("documentary, not measured") | **PARTLY OWNED** | wire the grading oracle to the loop; reflect on residue, not activity count |

## 3. How they compose (the foundry)

```text
intent
  └─[lifecycle: Arcanum sigil/spell]──────────────► artifact
        every transformation boundary emits:
          ├─ View 01  typed residue record  (← the open seam)
          ├─ View 02  subset-rule gate → pass|flag|block
          ├─ View 03  dispatch composition (Wave/Layer/Agent, typed edges)
          ├─ View 04  three-plane log joined by dispatch_id
          └─ View 05  Brier-scored reflection on residue
```

Views 03 and 04 are the *substrate* (how multi-agent work is composed and logged);
Views 01, 02, 05 are the *epistemic gates* that ride on it. The foundry is real to
the extent the substrate is built (03 written / 04 not built) and the gates are
typed (02 partly / 01 open).

## 4. Bottom line (honest readiness)

- **Most of this integration is already owned and written.** A new document that
  re-states Views 02–05 would be rediscovery — forbidden. Those views below are
  **pointers + status**, deliberately thin, citing TO-VLAD as owner.
- **The one place new work is honest is View 01:** connect the Lean residue type to
  the residue-no-type gap. Until that seam closes (or is killed by its collapse-test),
  the "capability foundry" has a typed gate diagnosed but not filled.
- **One thing is built-but-cold:** the experiment harness (`arcana/experiment-harness/`)
  and Arcanum's ledger writer exist but were never exercised (empty `runs/`, empty
  `sigil-invocations.jsonl` per DCM §12.1). "Exists" ≠ "exercised."

## 5. Trace

- Scope chosen by user: full-integration index map (not the narrow residue doc, not
  a TO-VLAD re-derivation). Format: discovery pipe + child views.
- Stop-triggers run before write: claim>proof — mitigated by the EVIDENCE/INFERENCE
  split in every view and explicit status marks (OPEN / PLAN-NOT-BUILT / FORECAST);
  novelty — the map credits TO-VLAD as owner of every diagnosis and marks View 01 as
  the only un-owned seam, left OPEN, not claimed solved.
- Provenance honesty: no agent dispatch was run; no `agents/` receipts fabricated.

## 6. Next route

Close View 01's seam via a real `research` dispatch in the theorem repo (the type
question), then prototype the View 02 `subset-rule` gate sigil. Views 03–05 route to
their TO-VLAD owners for any change (Authority-Bound Composition).
