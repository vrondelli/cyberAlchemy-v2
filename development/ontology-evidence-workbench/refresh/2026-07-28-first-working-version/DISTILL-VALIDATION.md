# Distill Validation — OEW First Working Version

Mode: Standard (default assumption; no alternate budget selected)  
Role path: local Proposer/Balancer simulation; separate subagent dispatch was
not authorized  
Rounds: 2 of 2  
Verdict: pass for refreshed Plan coherence; implementation remains unselected

## Objective and Output

- Target context: a private local prototype that a reviewer can open and use
  with the Poker Team example.
- Objective: replace the fragmented remaining UI chain with the smallest
  coherent implementation boundary that produces a usable interface.
- Output artifact: a four-unit remaining L1 frontier with an exact first target,
  executable command ownership, and preserved producer/verifier separation.
- Optimization goal: reduce coordination and Refresh churn without weakening
  evidence fidelity, protected-source isolation, or receipt ceilings.

## Discovery Baseline

- `SWU-OEW-006P` proves the isolated toolchain/materializer.
- `SWU-OEW-007` proves the exact-source UI store and existing entrypoint patch.
- `SWU-OEW-008` stopped before mutation because its registered test runner was
  absent and outside its three-file inventory.
- The same runner-ownership defect affects the remaining component commands
  and browser command.
- The six remaining UI components share one store, entrypoint, overlay,
  runtime, user journey, and final build. Individually passing components do
  not produce a usable prototype.

## Round 1 — Proposer

Collapse every remaining L1 concern into one implementation unit:

```text
UI + final build + browser + acceptance verification
```

### Round 1 — Balancer

| Category | Objection | Reconciliation |
| --- | --- | --- |
| independent evidence | a producer cannot accept its own build/browser evidence | retain distinct final-build, browser-producer, and independent-verifier units |
| lifecycle coupling | browser work owns processes, ports, and teardown unlike source authoring | keep browser production separate |
| immutable build | browser acceptance must consume a retained final build, not rebuild implicitly | keep `SWU-OEW-013B` |
| cognitive load | one mega-unit hides which boundary failed | revise to one UI vertical slice plus three closure units |

Round 1 result: revise.

## Round 2 — Proposer

Preserve completed 006P/007 and replace unexecuted 008–013 with one coherent
first-working-version source unit:

```text
006P PASS + 007 PASS
  → 008F Poker evidence-review UI
  → 013B final clean build + distinct build verifier
  → 014 browser producer
  → 014V independent browser acceptance verifier
```

### Round 2 — Balancer

| Category | Objection | Reconciliation |
| --- | --- | --- |
| task-shaped unit | trust, inspector, views, navigation, tour, and responsive shell are independently testable | for this prototype they are internal assertions of one user-visible Poker review journey; none alone is a usable deliverable |
| hidden glue | merging may hide coordination between component files | exact 008F inventory, one new final overlay manifest, six owned Node runners, and six named focused commands expose the glue |
| completed-byte preservation | the old cumulative overlay manifest belongs to 007 | leave it immutable; 008F creates a new first-working-version manifest |
| runtime closure | package scripts can again reference undeclared paths | a planning-owned frontier validator checks every active command entrypoint against existence or same-SWU ownership before selection |
| scope inflation | “first version” could absorb L2 code context or manual UX | keep code context, manual UX, packaging, release, and promotion deferred |

Round 2 result: pass.

## Smallest Coherent Unit

`SWU-OEW-008F — Assemble the Poker Evidence Review Workbench`

Responsibility: turn the verified exact-source store into one usable local
review journey with persistent trust state, exact inspection, equivalent
graph/outline/table views, search and keyboard navigation, Poker grounding
walkthrough, receipt access, and responsive automated behavior.

Inputs:

- passing 006P toolchain verification;
- passing 007 exact-source store receipt;
- pinned Understand-Anything dashboard and existing entrypoint patch;
- verified Poker adapter run.

Outputs:

- complete first-working-version overlay manifest and source;
- six declared Node runner adapters bound to the existing single package root;
- focused source assertions ready for the final clean build.

## Optimization Point

The unit is larger than a component because the target is a working interface,
not a component library. Splitting it again recreates the coordination burden
that produced the runtime-registry blocker. It remains smaller than the full L1
closure because build materialization, browser lifecycle, and independent
acceptance retain different owners and failure evidence.

## Recomposition Proof

`008F` consumes the already-verified store and produces all remaining feature
source. `013B` binds exactly 007 + 008F bytes into an immutable build.
`014` exercises that build in pinned browsers. `014V` independently recomputes
the retained evidence. No unnamed adapter, package root, or implicit rebuild is
required.

## Technique Trace

| Technique | Hook | Trigger | Inspected state | Emitted output | Decision | Readiness effect |
| --- | --- | --- | --- | --- | --- | --- |
| `abstraction_level_guard` | before layer split | always | UI component units versus user workflow | selected workflow/process level for 008F | pass | unchanged |
| `recomposition_proof` | before verdict | always | 007 store, overlay, build, browser, verifier | explicit 007 → 008F → 013B → 014 → 014V chain | pass | unchanged |
| `evolution_profile` | after proposer | Standard | pinned upstream and future code-context pressure | keep manifest boundary; defer L2 | pass | unchanged |
| `frame_expiry_note` | before verdict | always | prototype/local/private frame | rerun on pin, schema, authority, or delivery-scope change | pass | unchanged |
| `cognitive_load_check` | after balancer | more than three former siblings and user requested simplicity | six UI selectors plus refresh-per-selector burden | reduce nine remaining selectors to four | pass | unchanged |
| `boundary_object_check` | after balancer | UI, build, browser, and verifier have different owners | shared build handle and receipts | stable producer/verifier interfaces | pass | unchanged |
| `premortem_pass` | before verdict | Standard and medium risk | prior late blockers | frontier command/owner validator before selection | pass | unchanged |
| `navigable_result_check` | before verdict | always | work-pack, manifest, chain, next route | start at 008F after selection | pass | unchanged |
| `requisite_variety_check` | before verdict | no actor/policy variety beyond retained boundaries | current local single-user prototype | skipped | skipped-with-reason | unchanged |
| `concept_vs_knowledge_status` | before accept split | no knowledge-promotion claim | planning artifacts only | skipped | skipped-with-reason | unchanged |
| `set_based_tournament` | before pitch-off | Standard mode, one proposal track | n/a | skipped | skipped-with-reason | unchanged |

## Evolution Profile

Concrete pressure: upstream pin updates and optional L2 code-context
integration. The smallest extension boundary is the versioned overlay manifest
plus exact build handle. Multi-user state, plugin abstraction, automatic
mapping inference, and public packaging remain deferred.

## Tension Ledger

- Resolved: component atomicity versus a usable prototype — use one vertical
  UI workflow with internal focused assertions.
- Resolved: speed versus evidence independence — collapse only feature source;
  retain build/browser/verifier boundaries.
- Resolved: one package root versus runner ownership — keep the package
  unchanged and assign every referenced runner to its consuming unit.
- Unresolved target work: implementation and browser execution have not run.
  This is a target-lifecycle condition, not a Refresh authoring blocker.

## Premortem

Likely failure: 008F becomes a large source dump whose components pass textual
checks but fail to compose in the real dashboard.

Guard: exact new overlay manifest, all focused runners, final upstream
Vitest/TypeScript/Vite build in 013B, and browser journey in 014. Failure at any
boundary stops without manufacturing UI readiness.

## Frame Expiry

Rerun Distill if the upstream pin changes, the input schema/authority effect
changes, the prototype becomes multi-user/public, L2 code context becomes part
of the first version, or manual accessibility becomes an automated L1 claim.

## Navigation

Start with `SWU-OEW-008F` only after
`G-OEW-L1-FIRST-WORKING-VERSION-SELECTION`. Use the refreshed manifest for its
exact targets and the Workbench task for the Poker journey. Then proceed
serially to 013B, 014, and 014V only on passing receipts.

Evidence emission: prepared for caller-owned Invoke observation. Runtime-event
emission is not required because no accepted append-only Distill event ledger
is bound to this planning refresh.

Next route: `task-session`, gated by the fresh selection.
