# Context pack — ACI-subordinate conformance plan revision

## Selection

- Context Builder mode: `standard`, strict obligation coverage
- Invoke mode: `plan`
- Evidence date: `2026-07-23`
- Target work-pack:
  [`../WORK-PACK.md`](../WORK-PACK.md)
- Accepted design:
  [`../../design/aci-reasoning-binding/ARCHITECTURE.md`](../../design/aci-reasoning-binding/ARCHITECTURE.md)
- Binding decision:
  [`../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json`](../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json)
- External evidence root: `projects/cyberalchemy-orchestrator/`
- External source state:
  - `origin/master@6e5936b6d02f4d10c10d215d51a588b5520aa57f`
  - local checkout `05701291d878cab1824c9e0e4193298964f70e79`
- Scope: revise the private high-complexity plan so integrated work is
  subordinate to ACI and local interim work is explicitly non-integrated.
- Excluded: source implementation, SWU selection, Task Session execution,
  external-repository mutation, Craft mutation, public Arcanum mutation, ACI
  compatibility, real effects, whole-engine promotion, and anti-bias efficacy.

## Obligation matrix

| ID | Planning obligation | Selected evidence | Coverage |
|---|---|---|---|
| `O-PLAN-01` | Preserve the accepted option-A claim ceiling. | Binding receipt and design receipt | covered |
| `O-PLAN-02` | Remove the planned second integrated journal writer. | Accepted binding architecture; current protocol task | covered |
| `O-PLAN-03` | Separate local-only containment from integrated conformance. | Binding architecture Views 2–6 and layering seed | covered |
| `O-PLAN-04` | Define fixture-first conformance before adapter mutation. | ACI ADR-001 canonical/crash obligations and ACI-X1 assessment | covered |
| `O-PLAN-05` | Keep Work Bus acceptance distinct from evaluator admission. | Binding architecture; Bus assessment and draft contracts | covered |
| `O-PLAN-06` | Map replay, revalidation, semantic artifacts, and exact-effect intent to their owners. | Binding architecture workflow and interface table | covered |
| `O-PLAN-07` | Preserve APT as a projection-only optional dependency. | APT work-pack mutation gate and authority notes | covered |
| `O-PLAN-08` | Keep every execution lane unselected while external and task-specific gates remain open. | Binding receipt, design receipt, current Craft/work-pack state | covered |
| `O-PLAN-09` | Provide a navigable high-complexity work-pack, layer map, waves, task contracts, technique trace, and Distill verdict. | Invoke Plan contract and templates | covered |

Coverage is `9/9` for plan authoring. Runtime handoff coverage remains blocked:
external owner receipts, cross-repository fixtures, per-SWU closeout
synchronization, and an explicit one-SWU selection do not exist.

## Selected evidence and posture

| Source | Digest / maturity | Planning use |
|---|---|---|
| `decisions/aci-reasoning-binding/BINDING-RECEIPT.json` | SHA-256 `fba608dfa67c353417ecd67e711d1a2d56eb56f8860aa500635e6f80ec95591d`; option A pass | Fixes the disposition and claim ceiling. |
| `design/aci-reasoning-binding/ARCHITECTURE.md` | SHA-256 `02eaede41676bcf19e45cb8cf9b7130bddf297d6ae786d81fdb67ee456bb2c8c`; accepted local target | Supplies the six-view owner and record mapping. |
| `design/aci-reasoning-binding/DESIGN-RECEIPT.json` | SHA-256 `0a2ac68d8217a3eb16bfe50492c42eeaa9f86827b76c3d9d4b74247f60e3e27d`; design pass | Authorizes plan authoring only. |
| prior `planning/WORK-PACK.md` | SHA-256 `477b1c32b3bd9153af268b9dd1bc919c24f6797941292910e96cd87464ce72a7`; revision input | Preserves completed L0 evidence and planned SWU identities. |
| ACI ADR-001 | SHA-256 `2add074d6895e571230ba80e530cf37698870bd219f1e0202d417a65c6392fed`; accepted W0 decision only | Supplies target canonical, transaction, replay, and crash obligations. |
| ACI work-pack | SHA-256 `873a601e029676fecde92896f15d4b6e78c4d48162b658448debb29dd24e7631`; runtime gate block | Blocks integrated implementation. |
| Bus assessment | SHA-256 `a98d51f4b4990cc82a962b836d96dbcabf4183926e889c518d668db99508622f`; latest review `FIX` | Blocks Work Bus binding and names ACI-X1 falsifiers. |
| ACP discovery | SHA-256 `e365aa804f82b280c13b12a48e69931c103ab736db632a5c5070f621e6d3f02a`; draft/low veracity | Prevents treating discovery vocabulary as confirmed `DispatchSpec`. |
| APT work-pack | SHA-256 `f8808a276ab3413f9b12d4f90f90a101c6826ec4d55852e363498786df56abc4`; mutation gate block | Keeps provenance projection optional and read-only. |

## Plan invariants

1. ACI owns integrated command acceptance, canonical receipt identity, journal
   offsets, aggregate concurrency, replay cursors, and effect intents.
2. The private evaluator owns semantic admission, derivation, typed outcome,
   residue, and the content of the semantic reasoning artifact.
3. Local-only evidence uses a separate namespace and explicit
   `non-integrated` posture; it cannot reuse or invent ACI identities.
4. A local `RuntimeJournal` may not remain a planned integrated authority.
5. External contract shapes become runnable inputs only through current,
   digest-bound owner receipts and cross-repository conformance fixtures.
6. Work Bus publication acceptance creates at most a proposed observation
   handle; evaluator admission remains a distinct decision.
7. Historical replay folds verified ACI facts plus immutable semantic artifacts
   with zero mutable calls. Current revalidation is a new ACI command/run.
8. A semantic recommendation and exact-effect pass may produce only a candidate
   ACI command; ACI still owns acceptance and effect-intent creation.
9. No plan artifact selects an SWU or authorizes implementation.

## Excluded candidates

- Reusing `SWU-ARE-002` to build an integrated local command/event journal.
- Treating schema similarity or local canonical JSON as ACI conformance.
- Copying draft ACP/Bus schemas into private authority.
- Treating a `ReasoningReceipt` content digest as an ACI acceptance receipt.
- Letting a positive semantic result bypass the exact-effect and ACI gates.
- Making APT a lifecycle writer or required dependency before its owner gate.

## Context Builder result

- Mode: `standard`
- Selected source artifacts: `9`
- Obligation coverage: `9/9`
- Strict coverage: `pass` for plan authoring
- Runtime handoff: `block`, intentionally
- Blockers: external maturity, missing conformance fixtures/receipts, no selected
  SWU, and incomplete Task Session closeout synchronization
- Next consumer: Invoke Plan
