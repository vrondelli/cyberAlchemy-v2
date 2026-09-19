# Distill Validation — contract-completeness rebase proposal

## Run

- Target context: one implementation-facing package for DomainSpec v2 graph
  composability and test derivation across the backend machine inventory.
- Objective and output artifact: reduce the broad “complete Invoke package”
  request into a safe active-mode route and one future first implementation
  unit; output is this proposal-only refresh package.
- Mode and budget: **Standard**, one proposal track, two recursive rounds, one
  reconciliation pass.
- Role path: local Proposer/Balancer simulation because this proposal does not
  carry authorization for a subagent dispatch. The future independent package
  audit is separately recommended and permission-gated.
- Verdict: **pass for the refresh proposal**. This is not a pass for the future
  Define, Design, Plan, implementation, or completeness claim.

## Concept layer map

```text
DomainSpec v2 implementation completion (purpose)
  -> backend validation and derivation framework (capability)
  -> one BTE definition/design/plan/work-pack chain (workflow)
  -> formation-authority compatibility contract (policy + interface)
  -> one later Task Session SWU (operation)
```

The EVF package remains design evidence for graph, obligation, binding,
evaluator, test, and receipt objects. The BTE package becomes the only
all-backend implementation work-pack. No third package is introduced.

## Role conversation trace

### Round 1

- Proposer claim: create a new “graph composability and test derivation” package
  to contain the complete work.
- Evidence/assumption: the EVF package is narrow and the BTE package lacks
  Define/Requirements/Design artifacts.
- Balancer objection — `hidden coupling` and `cognitive load`: a third package
  would duplicate the BTE task/SWU/receipt owner and preserve the exact loop the
  user wants removed.
- Reconciliation: **accept objection**. Extend the existing BTE package and
  retain EVF only as selected design evidence.

### Round 2

- Proposer claim: rewrite all BTE planning artifacts directly from audit 002.
- Evidence/assumption: audit 002 is accepted and identifies the precise repair
  sequence.
- Balancer objection — `unsupported knowledge claim` and `owner boundary`:
  `GAP-029` requires a human-owned formation-authority decision, and active
  Invoke modes have separate Define, Design, and Plan gates. Refresh cannot
  silently simulate deferred `full` mode or select implementation.
- Reconciliation: **revise** to a proposal-only refresh that sequences active
  `define → decision → design → decisions → plan → Distill → review → handoff`.

Stable disagreement: none about the package owner. The future relationship-
family admission choice and Rule predicate source remain explicit decisions.

## Current smallest coherent unit

`FormationAuthorityCompatibilityContract`

- Abstraction level: policy/interface contract.
- Responsibility: state which versioned contract validates a current-v1 node
  body, how JSON formation and YAML criteria compose or supersede one another,
  and which compatibility counterexamples must fail.
- Inputs: current-v1 profile mapping, base node schema, per-kind JSON formation
  schemas, 13 YAML meta-type schemas, shared criterion kernel, node adapter, and
  the audit’s JSON-invalid/YAML-valid Entity witness.
- Outputs: one human-owned decision, one machine-addressable version/mapping,
  positive and discriminating-negative compatibility tests, and a receipt
  identity used by later successor work.

It is the smallest responsible future implementation unit because compiler
breadth, obligation derivation, and receipts cannot safely build on an
unresolved semantic owner. The unit does not also implement 13-kind breadth,
relationship coverage, graph derivation, or consumer integration.

## Technique trace

| Technique | Hook and inspected state | Result | Readiness effect |
| --- | --- | --- | --- |
| `abstraction_level_guard` | before both splits; package, workflow, policy, operation | Separates authoring route from implementation unit. | pass |
| `recomposition_proof` | before verdict; first unit to full BTE chain | Formation ownership feeds profile mapping, compiler parity, exact obligations, replay, and consumers without hidden glue. | pass |
| `evolution_profile` | after intent and verdict; variants, rules, integrations, governance | Preserve versioned profile/criterion/receipt boundaries; defer generic solver/plugin systems. | pass |
| `frame_expiry_note` | before verdict | Re-run when kind, criterion, relationship, node/edge source, or receipt contracts change. | pass |
| `cognitive_load_check` | after both role passes; competing package owners and artifact count | One BTE owner lowers load; split Define/Design/Plan keeps lifecycle gates explicit. | pass |
| `requisite_variety_check` | after Balancer; 13 kinds, 16 criteria, candidate relationships, consumers | Denominators and owners are represented separately; no universal evaluator is added. | pass |
| `boundary_object_check` | after intent; DomainSpec, EVF, IOLM, Body War, Inventory | Stable shared object is the versioned receipt/handle contract; local consumers keep independent runners. | pass |
| `concept_vs_knowledge_status` | before accepting split; audit versus authority | Audit findings are knowledge-backed review evidence; proposed source mappings remain decisions/candidates. | pass |
| `premortem_pass` | before verdict | See premortem below. | pass |
| `navigable_result_check` | before verdict | Start at REFRESH-REPORT, inspect the patch proposal, then approve or revise before active Define. | pass |
| `set_based_tournament` | not activated | Standard mode has one reconciled track; no competing architecture set remains. | skipped-with-reason |

## Closure and recomposition proof

```text
formation-authority decision and compatibility proof
  -> versioned profile/schema bindings
  -> exact 13-kind + 16-criterion compiler proofs
  -> canonical graph and independent O_spec
  -> O_gen + bindings + evaluators + executable tests + mutants
  -> replayable core receipt
  -> independent IOLM and Body War receipts
  -> fail-closed consumer and terminal aggregates
```

The 16 relationship-family planning set joins only after its owner admission
decision. `DEC-GCP-001` joins only the key-and-door semantic proof. Neither is
hidden as a universal prerequisite.

## Evolution profile and deferred complexity

- Concrete pressures: schema/criterion growth, new profiles, relationship
  admission, independent consumers, and review/promotion boundaries.
- Smallest extension boundary: version every profile, criterion catalogue,
  obligation catalogue, evaluator, binding, and receipt identity.
- Deferred: generic FOL/SMT plugin framework, universal semantic evaluator,
  UI admission, 21/29 derived relationship variants, and production promotion.

## Premortem

Six months later this failed because the package again treated three different
denominators as one “16”, let generated output define its own expected set, and
used green consumer fixtures as proof. Category: hidden coupling plus unsupported
knowledge claim. Guardrail: separate `D_kind=13`, `D_form=16`, and selected
`D_rel=16`; require owner decisions, independent catalogues, exact-set checks,
fresh receipts, and seeded false-green controls at every aggregate.

## Frame expiry and navigation

Re-run Distill if a 14th backend kind, 17th formation criterion, different
relationship set, new canonical source layout, or new receipt/evaluator family
enters scope. Start with [REFRESH-REPORT.md](REFRESH-REPORT.md), then inspect
[REFRESH-PATCH-PROPOSAL.md](REFRESH-PATCH-PROPOSAL.md) and
[REFRESH-DISPATCH.json](REFRESH-DISPATCH.json). The next route is explicit apply
approval followed by active Invoke `define`; Task Session remains downstream.
