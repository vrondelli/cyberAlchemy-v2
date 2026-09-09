---
module: investor-package-language-value-migration
version: current
status: pass
updatedAt: 2026-07-12
docType: execution-pack
---

# EXECUTION-PACK: Investor Package Language And Value Migration

## Purpose

Schedule the medium-complexity migration. `WORK-PACK.md` owns status and SWU
manifest; task files own implementation detail; wave files own ordering.

## Control Fields

| Field | Value |
| --- | --- |
| planningGateStatus | pass |
| complexity | medium |
| baselineWave | W0 |
| activePlanRef | `WORK-PACK.md` |
| workPackManifest | `WORK-PACK.md` |
| layeringArtifact | `IMPLEMENTATION-LAYERING.md` |
| activeLayerWindow | L0 |
| selectedSWU | `SWU-CABP-001` |
| lastPlannedAt | 2026-07-12 |
| readinessProfile | pilot |

## Wave Choreography

| Wave | Layer | SWUs | Outcome | Entry Gate | Exit Gate |
| --- | --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | L0 | 001, 002 | Evidence controls migrated. | Approved findings present. | Registry and trace agree. |
| [W1](work-pack/waves/W1.md) | L1 | 003, 004 | Economics and operating contract migrated. | W0 pass. | Finance and operations agree. |
| [W2](work-pack/waves/W2.md) | L2 | 005 | Canonical BP rewritten. | W1 pass. | Narrative review passes. |
| [W3](work-pack/waves/W3.md) | L2 | 006 | Provisional claim gate completed. | W2 pass. | Every Markdown claim classified. |
| [W4](work-pack/waves/W4.md) | L3 | 007 | Shareable HTML rewritten. | W3 pass. | HTML mirrors audited BP. |
| [W5](work-pack/waves/W5.md) | L3 | 008 | Final package validated. | W4 pass. | Browser, comprehension, and claim audit pass. |

## Execution Rules

- Run waves and SWUs sequentially.
- Select one SWU before every Task Session.
- Do not batch files even when one agent could edit several.
- Preserve unrelated dirty-worktree changes.
- Synchronize `WORK-PACK.md` only after receipt and validation.
- A blocked SWU returns to its owning task; later waves do not compensate.
- Whisper may compose prose but does not set evidence status.
- Browser validation may identify repairs but does not silently rewrite content.

## Receipt Contract

Every SWU returns:

```yaml
swu_id: <id>
result: pass | flag | block | interrupted
capability_ref: <native capability>
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: [<paths>]
validation: [<check and result>]
blockers: [<blocker or none>]
residue: [<residue or none>]
reroute: <owner or none>
handoff_note: <next coordinator action>
```

## Stop Conditions

Stop and route through the named owner when:

- a rewrite requires a founder fact or financing value that is not supplied;
- a current hypothesis is being promoted to customer evidence;
- a monetary claim lacks the approved tag and proof route;
- HTML introduces a claim absent from the audited BP;
- browser evidence shows overlap, overflow, broken navigation, or illegible text;
- private material would be copied into public Arcanum;
- a worker proposes batching multiple unselected SWUs.

## First Handoff

```text
task-session SWU-CABP-001
```

Source anchors are in
`work-pack/tasks/TASK-CABP-001-EVIDENCE-CONTROLS.md`. The only write scope is
`diligence-evidence-registry.md`.

