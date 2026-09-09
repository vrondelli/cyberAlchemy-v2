---
mode: validate
budget: validate
status: pass
date: 2026-07-22
---

# Distill Validation

## Object under review

[WORK-PACK.md](./WORK-PACK.md), its task and wave files,
[IMPLEMENTATION-LAYERING.md](./IMPLEMENTATION-LAYERING.md), and
[EXECUTION-PACK.md](./EXECUTION-PACK.md), after the approved UI SWU split.

## Round 1 — Proposer

The complete `L0C-demo` outcome remains one fixture-backed runnable witness, but
its former single execution unit mixed four independently testable failure
domains:

1. `SWU-IOLM-00C-UI-A1` proves the pinned fixture and loopback trust boundary and emits `iolm-fixture-boundary/v1`.
2. `SWU-IOLM-00C-UI-A2` proves the deterministic immutable snapshot and exact question slices and emits `iolm-demo-snapshot/v1`.
3. `SWU-IOLM-00C-UI-A3` proves synchronized graph, outline, table, selection and provenance source contracts and emits `iolm-interactive-viewer/v1`.
4. `SWU-IOLM-00C-UI-A4` proves the real-Firefox behavior and honest evidence aggregation and emits `iolm-browser-acceptance/v1`.

The former claim that splitting UI-A would destroy the runnable witness confused
the parent task outcome with a single Task Session boundary. Typed receipts let
the four units recompose without widening the product or authority claim.

A1 cannot split further: path/hash/identity validation and the pre-bind server
boundary are one causal security decision. Separating them would permit a server
receipt that was not bound to the exact validated bytes. A2 is independent
because immutable semantic serialization can be proven without UI rendering.
The three A3 lenses remain together because their relevant property is parity
over one active stable-ID set; splitting each lens would defer the cross-lens
invariant and create three incomplete interfaces. A4 is separate because source
and pure-model tests cannot substantiate rendered-browser behavior.

## Round 2 — Balancer

The split is accepted only with these constraints:

- one UI unit is selected at a time;
- each intermediate handle has exactly one producer and one declared next consumer;
- every package path has one owning SWU;
- A4 has no implementation-repair scope and must return defects to A1, A2 or A3;
- every receipt retains the six-value eligibility exclusion fence;
- human checks remain `NOT_RUN` unless named runners perform them;
- none of A1–A4 can evidence or unblock 00C-B/C, G-DSV2-SG, promotion or publication.

Further decomposition is rejected. Splitting the A1 trust boundary would make
pre-bind validation non-atomic. Splitting A2 schema, adapter and slice selector
would leave no meaningful immutable-model receipt. Splitting A3 by visual lens
would lose parity as the unit under review. Splitting A4 by test case would turn
one browser/evidence verdict into orchestration overhead without a new owner or
promotion boundary.

The old UI-A Context Pack and Goal remain immutable historical evidence. The new
supersession marker makes them explicitly non-runnable; UI-A is not passed, not a
parent, and not a reusable receipt.

## Resolution and recomposition

```text
iolm-candidate-contract/v1
  -> A1 iolm-fixture-boundary/v1
  -> A2 iolm-demo-snapshot/v1
  -> A3 iolm-interactive-viewer/v1
  -> A4 iolm-browser-acceptance/v1
  -> TASK-IOLM-00C-UI narrow completion
```

- Historical A1 through A3 remain immutable audit evidence. Fresh A1 rebind `20260723T002902Z-current-fixture-rebind` passed against the selected current generation; A2 regeneration alone is selected, with A3 and A4 gated.
- The parent task and W0C-UI remain active until the current-generation A1 -> A2 -> A3 -> A4 chain returns the narrow terminal receipt.
- The fixed fixture, 4/3 and 2/1 sets, runtime floor, no-package policy, loopback and GET/HEAD restrictions, manual-truth rule, gateway seam and public/private boundary are unchanged.
- The independent 00C-B cross-feature blocker and 00C-C status are unchanged.
- L0D and the later authoritative rebind retain their existing owners and gates.

## Premortem

| Failure mode | Preventive contract | Owning unit |
|---|---|---|
| server exposes stale or unbound bytes | exact hashes, realpaths, symlink rejection and pre-bind validation | A1 |
| UI views derive different semantic sets | one immutable deterministic snapshot and typed question slices | A2 |
| graph, outline and table selection drift | one stable-ID projection/selection contract across all three lenses | A3 |
| model tests are overstated as browser proof | real Firefox `PW-BB-01`–`PW-BB-10` plus network/console evidence | A4 |
| browser fix silently widens A4 | defect receipt reroutes to the exact owning SWU | A4 -> A1/A2/A3 |
| automation fabricates human success | required unperformed checks remain `NOT_RUN` | A4 / parent task |

## Checks

| Check | Verdict | Evidence |
|---|---|---|
| Smallest coherent units | pass | each SWU owns one risk and one typed receipt; further splits lose an atomic invariant |
| Recomposition proof | pass | the four handles form one linear chain to the unchanged parent outcome |
| Path ownership | pass | task contract assigns every aggregate package path to exactly one SWU |
| Selection safety | pass | historical A1–A3 remain immutable; the fresh current-generation A1 rebind passed and only A2 regeneration is selected, with A3–A4 gated |
| Repair ownership | pass | A4 cannot alter A1–A3 implementation paths |
| Claim boundary | pass | unchanged six-value exclusion fence on every result |
| Manual truth | pass | human checks remain independent and `NOT_RUN` until performed |
| Historical evidence | pass | UI-A is superseded before execution and its prior context/Goal artifacts remain immutable |
| Independent routes | pass | 00C-B/C, L0D and L0A semantics are unchanged |

## Verdict

`pass`. The four-unit split is a smaller, safer execution plan than the stale
one-SWU boundary while preserving the exact runnable-demo outcome and authority
fences. This validation authorizes planning synchronization only; it does not
authorize sidecar implementation.

## Next handoff

Run Context Builder and a compact Goal profile for one
`SWU-IOLM-00C-UI-A2` regeneration, then execute one bounded Task Session against
fresh A1 receipt `20260723T002902Z-current-fixture-rebind` and stop at the
current-generation `iolm-demo-snapshot/v1` receipt.
