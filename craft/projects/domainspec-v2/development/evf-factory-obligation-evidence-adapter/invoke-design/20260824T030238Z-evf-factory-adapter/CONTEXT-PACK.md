# Strict Design Context Pack

- Task: `invoke:design:evf-factory-obligation-evidence-adapter`
- Mode: `deep`
- Scope: private run-local Design authoring only
- Files selected: `19`
- Obligations: `8/8 covered`
- Strict coverage: `pass`
- Runtime handoff: none; this is authoring evidence, not execution context
- Authority effect: `none`

## Obligations

| ID | Obligation | Coverage |
| --- | --- | --- |
| O1 | Preserve accepted topology `FMP-EVF-B` | decision record, gate receipt, overlap result |
| O2 | Preserve EVF obligation and consumer meaning | EVF Define, Design, Work Pack, layering |
| O3 | Reuse the factory lifecycle without duplication | factory README, run-lock, execute/replay/verify/reproduce sources |
| O4 | Keep TLA/TLC semantic verdict provider-owned | provider contract, audit ownership matrix |
| O5 | Bind obligation, request, lock, provider, receipt, accounting, currentness, ceiling, and authority effect | audit report and proposed architecture, factory contracts |
| O6 | Define fail-closed negative behavior and planned witnesses | audit residue, factory rejection behavior, Design contract |
| O7 | State that current EVF-to-FMP invocation is absent/unproven | overlap result, audit report, accepted decision |
| O8 | Preserve owner gates and forbid Plan, implementation, execution, promotion, and Git effects | decision receipt and helper boundary |

## Selected Evidence

| Source | Selectors used | Obligations | Evidence state |
| --- | --- | --- | --- |
| `projects/domainspec-v2/development/decisions/fmp-evf-boundary/FMP-EVF-BOUNDARY-DECISION.md` | architecture decision; downstream owner gates | O1, O5, O8 | accepted owner direction |
| `projects/domainspec-v2/development/decisions/fmp-evf-boundary/DECISION-GATE-RECEIPT.json` | selected option; effects; next routes | O1, O7, O8 | validated decision receipt |
| `projects/domainspec-v2/development/refinement-runs/20260824T020140Z-fmp-evf-overlap-audit/RESULT.md` | Outcome Brief; Boundary | O1, O3, O7 | accepted research input |
| `projects/domainspec-v2/development/refinement-runs/20260824T020140Z-fmp-evf-overlap-audit/helper/FMP-EVF-OVERLAP-AUDIT.md` | ownership matrix; recommended boundary; residue | O2-O8 | independent audit |
| `projects/domainspec-v2/development/refinement-runs/20260824T020140Z-fmp-evf-overlap-audit/stages/06-invoke-design/ARCHITECTURE.md` | all six views; boundary invariants | O1-O8 | proposal adopted by decision |
| `projects/domainspec-v2/development/evolvable-validation-framework/DEFINE.md` | Candidate Contract Set; Invariants | O2, O5, O6 | current candidate Define |
| `projects/domainspec-v2/development/evolvable-validation-framework/DESIGN.md` | low-level contracts; workflow; dependency interfaces | O2, O5, O6 | current candidate Design |
| `projects/domainspec-v2/development/evolvable-validation-framework/WORK-PACK.md` | objective; observed overlay; external handoff | O2, O7, O8 | current candidate-local evidence overlay |
| `projects/domainspec-v2/development/evolvable-validation-framework/IMPLEMENTATION-LAYERING.md` | L2 decision; boundary rule | O2, O7 | current layering evidence |
| `projects/domainspec-v2/impl/architecture-conformance/factory/README.md` | plain-language model; adding a provider; evidence and equality | O3-O6 | implemented contract description |
| `projects/domainspec-v2/impl/architecture-conformance/factory/contracts/factory-node-provider-v1.ts` | semantic result, accounting, upstream handles, provider seam | O4-O6 | implemented code |
| `projects/domainspec-v2/impl/architecture-conformance/factory/contracts/factory-run-lock-v1.ts` | locked refs, tool identity, node and run lock | O3, O5 | implemented code |
| `projects/domainspec-v2/impl/architecture-conformance/factory/contracts/factory-semantic-receipt-v1.ts` | node receipt and terminal semantic receipt | O3-O6 | implemented code |
| `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/execute-factory-run.ts` | snapshot, execute, repeat, accounting, receipt publication | O3, O5, O6 | implemented code |
| `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/replay-factory-run.ts` | verify first, replay locked nodes, reject drift | O3, O5, O6 | implemented code |
| `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/reproduce-reference-suite.ts` | double-run equality and product-tree immutability | O3, O6 | implemented code |
| `projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/verify-factory-run.ts` | complete run-root verification entry | O3, O5 | implemented code |
| `projects/domainspec-v2/impl/architecture-conformance/factory/registry/factory-node-registry-v1.ts` | explicit registry; unknown/duplicate rejection | O3-O5 | implemented code |
| `projects/domainspec-v2/development/refinement-runs/20260824T020140Z-fmp-evf-overlap-audit/helper/FMP-EVF-OVERLAP-AUDITOR-RECEIPT.json` | exact source inventory; ownership; residue | O1-O8 | passing helper receipt |

## Explicit Inferences

- The adapter must consume a factory-owned verification/currentness binding in addition to a semantic receipt digest. The exact representation is not evidenced and remains a factory/EVF owner gate.
- A single adapter version must cover both request translation and evidence translation so their identity relation cannot drift. This is a Design recommendation, not an implementation decision.

## Excluded Nearby Scope

- the six-unit FMP provider Plan: separate parent route;
- exact TLA models, toolchain execution, and corpora: provider-owned;
- the factory material-lock extension: factory-owner decision;
- Zig-to-TLA implementation trace conformance: separate `WP-FMP-TRACE-001` route;
- EVF L3 breadth, cycle, closure, IOLM, release, deployment, and production;
- canonical vocabulary, Inventory mutation, public Arcanum, Craft, authority, telemetry, and Git.

## Blockers

No blocker prevents authoring and deterministic Design selection. Exact adapter schema bytes, role-to-person assignments, negative-fixture acceptance, and the factory verification/currentness handle remain downstream owner gates and prevent normal implementation planning.
