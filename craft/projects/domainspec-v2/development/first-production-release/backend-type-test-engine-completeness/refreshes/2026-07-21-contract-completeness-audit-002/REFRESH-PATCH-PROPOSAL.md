# Refresh Patch Proposal — one complete BTE authoring chain

Status: proposal only; no target mutation authorized

## Proposed outcome

Use the existing
`development/first-production-release/backend-type-test-engine-completeness/`
package as the only all-backend implementation work-pack. Add its missing
definition, requirements, and architecture layer; then regenerate its Plan and
split work-pack against accepted audit 002.

Do not create a third implementation package. Do not move implementation
authority into CyberAlchemy. Retain EVF as selected design evidence and an
optional narrow key-and-door proof whose `DEC-GCP-001` blocker is local.

## Stage A — active Invoke Define

Create inside the BTE package:

1. `DEFINE.md`
   - approved objective and exclusions;
   - explicit authority/source map;
   - 13-kind, 16-criterion, and candidate 16-relationship denominators kept
     separate;
   - graph, node, edge, formation, obligation, test, binding, evaluator,
     execution result, mutation, receipt, and aggregate object boundaries;
   - audit 002 as evidence, never authority.
2. `REQUIREMENTS.md`
   - stable requirement IDs mapped to every surviving audit gap;
   - exact positive and discriminating-negative obligations;
   - causal graph-to-receipt and replay requirements;
   - fail-closed nonempty/exact-set and consumer receipt requirements;
   - explicit `not applicable`, `deferred`, and `pending decision` states.
3. `GLOSSARY.md` and `GLOSSARY-CONSISTENCY.md`
   - plain-language terms and exact machine-source links;
   - no canonical vocabulary promotion.

Define must route `GAP-029` to a new human-owned
`DEC-BTE-FORMATION-AUTHORITY-001` with at least these bounded choices:

- execute current-v1 JSON formation and YAML criteria together, failing if
  either rejects; or
- admit a versioned YAML-owned replacement that explicitly retires each JSON
  formation contract and proves compatibility/migration.

No source implementation proceeds until one choice is recorded. The audit’s
JSON-invalid/YAML-valid Entity body is a mandatory negative control.

## Stage B — active Invoke Design

After the formation decision, create `DESIGN.md` with all six views:

1. Context: machine sources → compiler → graph → obligation/test derivation →
   bindings/evaluators/execution → receipts/aggregates → consumers.
2. High-level structure: source, admission, derivation, execution, evidence,
   replay, and consumer planes with owners.
3. Low-level components: versioned contracts for profile/schema/criterion,
   `Graph`, `Obligation`, `TestCase`, `Binding`, `Evaluator`, execution result,
   mutation result, `Receipt`, and required-check manifests.
4. Workflow: ordered causal handoffs and typed failure at every missing,
   duplicate, stale, empty, skipped, or unsupported boundary.
5. Decision flow: structural versus local/graph/semantic evaluators; unsupported
   claims produce residue, never invented pass.
6. Dependency/interface: exact inputs/outputs, digests, authority owner,
   validator, receipt, and replay consumer for every transition.

Design must preserve the EVF object model by reference while removing its
separate all-backend execution route. It must keep IOLM and Body War as
independent consumer lanes after the green core receipt.

Before Plan, record or explicitly defer:

- relationship-family admission: 16 families stay candidate planning coverage
  until the relationship owner admits them; 21/29 remain derived/unselected;
- `DEC-GCP-001`: its answer affects only the key-and-door semantic fixture and
  cannot block unrelated formation/criterion work.

## Stage C — active Invoke Plan

Regenerate:

- `PLAN.md`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`,
  `EXECUTION-PACK.md`, `EXECUTION-DISPATCH.json`, and
  `DISTILL-VALIDATION.md`;
- shared context, decisions, gaps, and traceability;
- every affected task and wave contract.

Required plan corrections:

1. Preserve completed `SWU-BTE-001` and `SWU-BTE-003` identities and receipts.
2. Re-scope not-started `SWU-BTE-002` to implement the selected current-v1
   formation-authority compatibility contract only.
3. Add a separate successor-profile binding SWU rather than bundling it into
   current-v1 compatibility.
4. Make `SWU-BTE-004` prove all 13 kind positives and all exact 16 criterion
   positive plus discriminating-negative compiler paths.
5. Keep relationship proof separate and conditional on admission; do not call
   the 16 selected families machine-normative before that gate.
6. Require literal `required_structure`, closed Interface/Mapping domains, and
   structural Value Object equality.
7. Propagate profile/schema/criterion/kernel/adapter identities and digests into
   graph, obligations, bindings, receipts, and replay.
8. Make the canonical minted graph/source manifest feed derivation; forbid a
   disconnected feature-document-only completeness path.
9. Freeze independent exact `O_spec`, reject empty sets and arbitrary first
   binding matches, and require role-typed unique digest-bound bindings.
10. Require independent evaluators, executable non-skipped tests, killed
    mutations, and exact replay joins.
11. Implement fail-closed `verify:bte:core`, `verify:bte:consumers`, and terminal
    `verify:bte` with seeded missing/empty/stale/extra/duplicate/skip/todo/
    surviving-mutant failures.
12. Require IOLM parity to include its missing
    `graph_hierarchy_table_get_parity` check and reject self-asserted handles.
13. Replace Body War’s Markdown `source_contract` with a machine contract,
    schema, runner, fresh receipt, and replay lane.

Every medium/high task must include inputs, outputs, ordered algorithm or
pseudocode, precedence rules, edge cases, failure modes, write scope, done
criteria, acceptance evidence, and exact validation. Every SWU must have one
primary behavior and one independently reviewable boundary.

## Smallest first unit after decisions

The first future Task Session unit is the current-v1 formation-authority
compatibility implementation, only after `DEC-BTE-FORMATION-AUTHORITY-001`.
It must not also add successor breadth, relationships, derivation, aggregates,
or consumers. A later exact-16 compiler-parity SWU recomposes on top of its
versioned contract.

## Apply boundary

An approved apply may mutate only the BTE authoring package, its task/wave
contracts, and a small EVF route/status note that removes competing all-backend
handoff language. It must not mutate:

- `projects/domainspec-v2/impl/` or machine definitions/specs;
- audit 002 or earlier review artifacts;
- completed Task Session receipts;
- CyberAlchemy/IOLM/Body War consumer packages;
- Craft, Inventory authority, FPR release state, or UI lane state.

## Apply validation and stop conditions

- All target preimages must match the proposal-time inventory or the apply
  stops for refresh rebase.
- Invoke Define and Design gates must pass before Plan.
- Dispatch Spec must return pass with zero flags/blocks.
- Plan Distill must return pass; a flag or block cannot route to Task Session.
- Requirement-to-gap, requirement-to-design, design-to-task, task-to-SWU, and
  SWU-to-validation traceability must be total.
- Exactly one future first SWU may be exposed, and none is selected/executed by
  Invoke.
- A separately authorized independent package audit must accept the final
  authored set before Task Session handoff.
- JSON/YAML parsing, local-link checks, and scoped `git diff --check` must pass.

## Explicit no-ops

- Old `GAP-009` stays fixed and `GAP-028` stays repaired/non-surviving.
- Current tools `147/147`, engine `107/107`, and typecheck remain baseline
  evidence only, not completeness.
- Current-v1 4-kind/3-relation declaration, deterministic views,
  cross-feature rejection, and honest non-admission remain true narrow facts.
- UI and backend remain independent lanes.
- No profile, relationship family, implementation, consumer result, or release
  state is promoted by authoring artifacts.
