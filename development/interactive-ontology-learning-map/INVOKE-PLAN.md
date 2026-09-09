---
mode: plan
status: pass
date: 2026-07-20
complexity: high
outputMode: split
nextRoute: task-session
---

# Invoke Plan Receipt

## Apply-approved refresh (2026-07-20)

`DEC-CAV2-IOLM-POSTURE-001` selected
`code-first-candidate-later-authority-rebind`. The plan now activates L0C through
the minted-project candidate adapter and reserves L0A for a later owner-issued
FPR `Sg`. This does not waive `G-DSV2-SG`; it narrows that gate to authoritative
labeling/rebind and selects only `SWU-IOLM-00C-A` for Task Session.

The later accepted `DEC-GCP-002` adds a separate DomainSpec executable-evidence
consumer task. Its narrow EVF run and later BTE breadth rerun are planned but
unselected; neither gates the upstream core whose handle it consumes.

## Outcome

A high-complexity split work-pack now decomposes the private witness into L0C candidate proof, the independent L0D evidence-consumer lane, L0A authoritative rebind, and L1-L3 product layers: ten tasks, eighteen SWUs, seven routed waves, one full Dispatch Spec route, and a refreshed Distill validation.

## Approved inputs

- [SPEC](./SPEC.md)
- [Architecture bundle](./ARCHITECTURE-BUNDLE.md)
- [UX plan](./UX-PLAN.md)
- [Glossary consistency](./GLOSSARY-CONSISTENCY.md)

## Planning artifacts

- [Implementation layering](./IMPLEMENTATION-LAYERING.md)
- [Work-pack](./WORK-PACK.md)
- [Execution pack](./EXECUTION-PACK.md)
- [Dispatch](./DISPATCH.json)
- [Distill validation](./DISTILL-VALIDATION.md)
- Split tasks, waves, shared context/gaps/decisions/traceability under `work-pack/`

## Complexity decision

High complexity is required because the plan spans independent authority, schema, compiler, witness, API, UI, accessibility, performance, and human-pilot evidence. It has more than five tasks, owner-gated vocabulary, cross-project source boundaries, and a private/public split.

## Technique trace

The full trace is in [WORK-PACK.md](./WORK-PACK.md#technique-trace) and [DISPATCH.json](./DISPATCH.json). Techniques are cited only where they control sequence, SWU size, recomposition, boundary evidence, validation, handoff, or residue.

## Distill

Automatic `validate` mode returns `pass` for structural coherence. The smallest coherent consumer unit is `SWU-IOLM-DSC-A`: one exact EVF handle, one deterministic IOLM consumption run, and one fresh non-admitting receipt. It remains downstream of the three-SWU L0C substrate. Distill does not clear G-DSV2-SG, which remains a separate later-authority gate.

## Gate and handoff

- Planning artifact quality: `PASS`.
- Candidate mutation handoff: `READY` for one Task Session over `SWU-IOLM-00C-A` only.
- Resolved prerequisite: G-OWNER — [bounded private-product owner decision](work-pack/shared/G-OWNER-DECISION.md).
- Resolved posture: `code-first-candidate-later-authority-rebind` — operator selection on 2026-07-20.
- Remaining authority condition: no exact owner-generated DomainSpec `Sg` readiness handle; this blocks L0A authoritative labeling/rebind only.
- Active candidate route: 00C-A is complete; 00C-B remains selected but blocked until the owner-generated cross-feature-support receipt exists.
- Consumer route: after 00C-B/C and a successful EVF core receipt, Context Builder may prepare `SWU-IOLM-DSC-A`; a separate later selection is required for `DSC-B` after green BTE core.
- Later authority route: the existing DomainSpec FPR owners issue the exact graph/quotient/retraction receipts, then TASK-IOLM-000B verifies them read-only.
- No implementation or publication occurred during Invoke.
