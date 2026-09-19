---
artifact: bte-plan-distill-validation
mode: skipped-receipt-synchronization
status: not-applicable
handoffStatus: owner-gated
updatedAt: 2026-07-23
semanticAuthority: none
---

# Distill Validation — L0 Bootstrap Split And Evidence Repair

## Result

- Current refresh: Distill is skipped because the passing
  `SWU-BTE-L0A-REPAIR-001` receipt is being synchronized without changing the
  architecture, responsibility split, or SWU boundary.
- Current handoff: `owner-gated` on the independent validation-owner red
  manifest/freeze only. Current L0A verification passes; L0B is unselected.
- The prior bootstrap-split validation below remains the accepted explanation
  for the L0A/L0B architecture; it is not current execution status.
- Target context: accepted L0 bootstrap correction inside the validated BTE
  architecture; L1–L8 remain unchanged.
- Output artifact: one atomic Plan/work-pack/dispatch package with separate L0A
  publication and L0B validation boundaries.
- Mode and budget: `Validate`; one proposal track, one independent objection
  pass, and one reconciliation.
- Role execution: inline Proposer/Balancer fallback. Repository policy requires
  a separately proposed and user-confirmed DomainSpec dispatch before using
  subagents; this bounded refresh grants no such dispatch.
- Verdict: `pass`.
- Historical handoff: L0A was explicitly selected and implemented. Its current
  proof is restored and verified by the bounded repair receipt.

## Corrected Route

```text
accepted Design and bootstrap decision
  -> L0A: publish machine contracts + closed diagnostics
  -> exact contract-publication receipt
  -> independent validation owner authors and freezes red cases
  -> L0B: run shape + semantic validation against unchanged inputs
  -> non-admitting ValidationReceipt
  -> L1..L6 core
  -> L7A IOLM || L7B Body War
  -> L8 terminal aggregate
```

The former route required a frozen manifest before the schemas and diagnostic
registry needed to author that manifest existed. That was a circular dependency,
not an owner delay.

## Role Conversation Trace

| Pass | Proposer claim | Balancer objection | Reconciliation |
| --- | --- | --- | --- |
| 1 | Split L0 into contract publication and semantic execution. | Two SWUs may create hidden glue or let a publication receipt masquerade as proof. | Accept the split, but define an exact digest-bearing publication receipt whose schema is published in L0A; state that it is non-admitting and not a ValidationReceipt. |
| 1 | Let the validation owner freeze immediately after L0A. | A partial schema set or open diagnostic registry would force the owner to guess. | L0A is indivisible across all nine shapes, keyword policy, diagnostic closure, deterministic bytes, and publication receipt. |
| 1 | Keep later L1–L8 work unchanged. | L1 could accidentally consume the publication receipt rather than executed validation evidence. | Gate L1 on the exact L0B ValidationReceipt and unchanged L0A/Design/seed digests. |
| 1 | Mark L0A ready. | Invoke must not select execution work. | Candidate is dependency-ready but remains explicitly unselected; Task Session begins only after user selection. |

No stable disagreement remains.

## Smallest Coherent Units

`SWU-BTE-L0A-REPAIR-001` completed one primary behavior: append one additional LF to
the eight mismatching schemas and `diagnostics.ts`, restoring exact immutable
receipt handles. Adding L0B, owner-freeze work, planning sync, or new receipt
architecture would mix owners; splitting the nine surfaces would leave the
historical receipt only partially reproducible.

`SWU-BTE-L0A-001` has one primary behavior: publish one stable machine boundary
that another owner can use to construct expectations. Removing any contract,
the diagnostic registry, keyword policy, or publication receipt would make that
handoff incomplete.

`SWU-BTE-L0B-001` has one primary behavior: execute unchanged published
contracts against independently frozen cases and emit recomputable validation
evidence. It is not currently selectable because its owner freeze is absent.

## Recomposition Proof

```text
Set(L0A published contract handles)
  = Set(validation freeze governing contract handles)
  = Set(L0B consumed contract handles)

Set(frozen red case IDs)
  = Set(L0B raw result case IDs)
  = Set(L0 ValidationReceipt case IDs)
```

The publication receipt transports identity and bytes, not a pass verdict.
The ValidationReceipt transports bounded execution evidence, not admission.
Exact equality at both joins prevents hidden prose or count-based glue.

## Technique Trace

| Technique | Result |
| --- | --- |
| abstraction-level guard | Design remains fixed; Refresh changes sequencing, SWU boundaries, paths, and handoffs only. |
| responsibility/independence | contract author, validation owner, and semantic executor have distinct write authorities. |
| recomposition proof | publication digests join to freeze digests; frozen case IDs join to raw/result receipt IDs. |
| boundary-object check | typed publication and freeze receipts replace an informal owner handoff. |
| requisite-variety check | explicit selection gates L0A; publication plus freeze gate L0B; ValidationReceipt gates L1. |
| premortem | stale contract, guessed diagnostic, self-authored red case, and receipt-type substitution each have a fail-closed check. |

## Tension Ledger

| Tension | Resolution | Status |
| --- | --- | --- |
| complete contract handoff vs oversized first SWU | L0A includes only publication artifacts and their deterministic checks | resolved |
| independent expectations vs executable schemas | validation owner acts after L0A and before L0B | resolved |
| split ownership vs hidden glue | exact digest-bearing publication/freeze receipts | resolved |
| evidence vs admission | both receipt types explicitly non-admitting; only L0B emits ValidationReceipt | resolved |
| navigability vs renumbering churn | W1 becomes L0A, new W1B is inserted, W2–W9 retain names and order | resolved |

## Frame Expiry And Next Route

Invoke Design expires if profile identity, formation authority, catalogue
definitions, proof cardinality, evaluator independence, mutation lineage, or
consumer ownership changes. Invoke Plan/Refresh expires if contract files,
diagnostic ownership, freeze shape, task boundaries, or predecessor handles
change.

Start at `PLAN.md`, then `WORK-PACK.md`, then
`work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md`. The next route is the
independent validation owner for the package-local L0 red manifest and freeze
receipt. A later Invoke Refresh must validate that exact owner output before
exposing `SWU-BTE-L0B-001`.
