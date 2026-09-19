# EVF Post-L0 L1 Planning Context Pack

## Identity

- Target: proposal-only EVF L1 Plan after `DEC-GCP-004` and `DEC-GCP-005`
- Run: `20260820T173249Z-post-l0-l1-plan`
- Builder mode: deep
- Repository revision observed: `3539c9e18cf78f5fbee325f859982112a22a1c10`
- Handoff ceiling: exact planning proposal only; mutation-capable handoff blocked

## Obligation Coverage

| Obligation | Status | Resolution |
| --- | --- | --- |
| `O0-design-activation` | blocked | `DESIGN.md` is authored candidate material; no validator-owned pass or selected Design binding exists, so normal Plan handoff cannot activate. |
| `O1-live-L0` | covered | The L0 receipt is PASS in `candidate-local-fast-lane` mode, kills 16/16 mutants, and states `release_admission: not-granted`. |
| `O2-current-frontier` | covered | Canonical Plan/layering/Work-Pack/execution bytes still describe the pre-L0 frontier; historical refresh reuse is blocked. |
| `O3-L1-order` | covered | `DEC-GCP-004` selects strict P4 then fresh R4 as distinct serialized SWUs over one combined graph/source postimage. |
| `O4-P4-boundary` | covered | P4 is the one-way eligible-payout write-then-event implication only; no zero/duplicate converse, R5, or full-feature claim. |
| `O5-R4-boundary` | covered | `DEC-GCP-005` option A fixes zero same-date makeup -> `true`, one or more -> `false`, under otherwise-eligible premises, as a pure decision only. |
| `O6-L2-boundary` | covered | `DEC-GCP-003` preserves future C0 -> Datalog -> Alloy -> non-inflating join ordering; C0 and providers are excluded from the current Work Pack. |
| `O7-claim-ceiling` | covered | No source, prior adoption receipt, plan, or synthetic contract grants formal-owner, lifecycle, release, publication, deployment, or production admission. |
| `O8-canonical-survivors` | covered | The complete directly implicated denominator is one shared gap surface and four wave surfaces. `GAPS`, W0, W1, and W2 require compatibility postimages; W3 is exact, inspected, and truthfully deferred. |

Strict source coverage is `pass`. Normal Plan and mutation-capable handoff remain
`block` until the exact Design is validator-passed/selected and the postimages
are independently reviewed, explicitly owner accepted, canonically applied, and
admitted by readiness owners.

## Selected Sources

- EVF `DESIGN.md`
  - Finding: six candidate views are authored, but no validator-owned pass or
    Design selection result activates normal Plan handoff.
- Canonical EVF `PLAN.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, and
  `EXECUTION-PACK.md`
  - Finding: they still model L0 as the current frontier and need a fresh,
    non-historical Plan postimage.
- Canonical `work-pack/shared/GAPS.md` and all four canonical wave files
  - Finding: `GAPS`, W0, W1, and W2 remain current-looking legacy surfaces and
    require explicit compatibility postimages. W3 is truthfully blocked behind
    L2/breadth work and remains an exact classified unchanged input. Any omitted
    denominator member is a candidate-completeness failure.
- `evidence/SWU-GCP-001/attempt-001/validation-receipt.json`
  - Finding: PASS candidate-local L0 evidence, 16/16 mutants,
    `release_admission: not-granted`.
- `decisions/2026-08-20-l2-first-evaluator.md`
  - Finding: the future dual-provider order is accepted, but implementation and
    provider gates remain blocked behind L1.
- Run-local `DEC-GCP-004` and `DEC-GCP-005`
  - Finding: two distinct serialized Rules are selected; R4 option A is exact.
- Financial Settlement `SPEC.md`, `feature.json`, Payout Rule node, generated
  graph, and source manifest
  - Finding: source prose names `NoDuplicateMakeupRule`, while the generated
    graph contains `PayoutEligibilityRule`; reconciliation must add both as
    distinct source-owned nodes/edges and regenerate rather than hand-edit.
- Financial Settlement SFOL source proposal, adoption report, and effect receipt
  - Finding: P4-shaped execution/mutation material exists, but it is experimental,
    lacks formal-owner approval, and does not prove R4.
- Legacy Financial Settlement binding
  - Finding: R4's pure decision binding is useful substrate, not accepted proof.
- Actual settlement service, generated effect adapter, and GenerateSettlement
  use case
  - Finding: P4 can bind recorded write/event behavior and R4 can bind a pure
    Boolean decision without manufacturing expected values.

## Architecture Guidance

Preserve the L0 causal spine. P4 owns additive source/graph reconciliation and
freezes one exact graph/source/registry handle. R4 consumes that handle with zero
graph/source mutation. Each unit owns independent `O_spec`, `O_gen`, binding,
execution, mutation, and receipt identities. Composite L1 closes only after an
independent verifier proves both receipts share the frozen handle without
semantic merge or claim inflation.

## Constraints

- Do not call L0 lifecycle-admitted or release-ready.
- Do not infer formal-owner approval from experimental SFOL evidence.
- Do not reuse the historical refresh package, target counts, route digest,
  material receipt, or acceptance.
- Do not loosen the key-door-specific S1 receipt into L1 or L2.
- Do not download or execute Datalog, Alloy, TLC, Cedar, or another provider.
- Preserve dirty and untracked owner bytes.

## Fallback Exploration Rule

Additional reads are allowed only to validate this exact Plan candidate or a
later independently authorized review/apply/readiness step. Any semantic or
scope expansion returns to Decision Gate.
