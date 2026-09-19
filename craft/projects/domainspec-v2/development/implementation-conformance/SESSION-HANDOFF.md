# Session Handoff — Profile constraint resolver-to-evaluator seam

## Identity

- Handoff ID: `2026-08-24-profile-constraint-resolver-evaluator-seam`
- Status: `candidate`
- Authority: `invoke-local`
- Handoff type: `new-lifecycle-thread`
- Destination reviewer: Vladimir
- Requested owner route: `implementation-conformance` (`unconfirmed`)
- Source session: `../domainspec-lean-formalization/theorem/sessions/2026-08-24-1041-profile-constraint-evaluation.md`
- Next route if accepted: `invoke design`

This is a recommendation of one bounded integration fixture and a request for an ownership
decision. It is not a patch-review request and does not authorize implementation, semantic
promotion, admission policy, release, or production use.

## New Session Prompt

Review whether `implementation-conformance` is the correct owner route for a characterization
fixture that passes the exact `resolveProfile(...).constraints` result into the Enum
`evaluateCase` consumer and
observes a controlled `actual_findings` delta for distinct-ID equality constraints at the same
candidate semantic locus. Confirm or identify the responsible owner role. If that owner accepts
the seam, route the fixture through `invoke design`; otherwise record the narrower owner or reject
the seam.

The proposed cases all use the positive Enum projection, whose adapter emits
`binding.current = true`:

| case | constraints | required `actual_findings` |
| --- | --- | --- |
| conflicting pair | distinct IDs; `binding.current equals true` and `binding.current equals false` | `[falseId]` |
| true-only control | `binding.current equals true` | `[]` |
| compatible pair control | distinct IDs; both `binding.current equals true` | `[]` |

The fixture qualifies only if its receipt preserves the exact lineage from the resolver's
returned constraint array to the evaluator input. Rebuilding an equivalent array beside the
resolver does not establish the integration seam.

Each row must be a separate synthetic profile with `extends: []`, resolving to exactly the
constraint IDs listed for that row. Every control must traverse the resolver independently; no
post-resolution filtering or reconstruction is admissible.

## Route Rationale

The staged resolver merges constraints by `constraint_id`. Consequently, two constraints with
different IDs survive that boundary even when their property, operator, applicability, and
expected-value fields overlap. The staged Enum runner evaluates every received constraint and
returns the IDs of failed constraints as `actual_findings`.

These two owned mechanisms make a resolver-to-consumer fixture concrete, but they do not settle
whether property equality identifies a canonical semantic locus or whether retaining both
constraints is valid DomainSpec behavior. That ownership question must precede a product claim.

There is no callable cross-module seam today: both `resolveProfile` and `evaluateCase` are
module-local constants in separate staged artifacts. Design must therefore choose an
owner-approved minimal export or a colocated harness that invokes both existing implementations
without copying either algorithm. If neither route is admitted, the fixture is rejected rather
than simulated with duplicated logic.

The Lean artifact proves only a candidate model: for Boolean equality constraints at one
property, the true/false pair is not jointly satisfiable; distinct IDs survive an ID-keyed
projection; a property-keyed check detects the pair; and the positive fact produces exactly the
false constraint ID. It is not wired to the TypeScript implementation.

Collapse-test: this proposal contributes no operational evidence if the exact
`resolved.constraints → evaluateCase` lineage is absent, or if the conflicting and control cases
produce the same `actual_findings`.

## Context Builder Selection

- Mode: standard bounded selection
- Budget: at most 14 files / 280 selected lines
- Selection rule: include only the resolver, consumer, positive-fact producer, formal candidate,
  and research/closeout records needed to check the claim ceiling.
- Inventory preflight: `no_inventory_match`; `.arcanum/inventory/index.json` contained no entry for
  this exact seam as of its 2026-08-10 index timestamp. Inventory is a discovery read model, not
  authority.

## Selected Context

| artifact | selector | why selected | evidence status |
| --- | --- | --- | --- |
| `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/check-profile-resolution.mjs` | `mergeByKey` and `resolveProfile`, approximately lines 273–336 | shows constraint identity key and returned `constraints` array | staged/current worktree |
| `projects/domainspec-v2/impl/architecture-conformance/typescript/runner/enum/index.ts` | `Constraint`, `evaluateOperator`, `evaluateCase`, and execution result, approximately lines 9–20, 99–180, 216–230 | shows consumer input, finding production, and oracle aggregation | staged/current worktree |
| `projects/domainspec-v2/impl/architecture-conformance/typescript/adapter/enum/index.ts` | positive fact emission, approximately lines 328–336 | shows `binding.current = true` | staged/current worktree |
| `../domainspec-lean-formalization/lean-engineer/ProfileConstraintEvaluation.lean` | `BoolFixture` and claim ceiling in module doc | supplies the verified candidate-model expectations | current worktree; `lake build ProfileConstraintEvaluation` previously passed |
| `../domainspec-lean-formalization/research-domainspec/profile-conflict-operational-relevance-2026-08-22/findings.md` | “Smallest admissible future witness” and “Collapse tests” | supplies the operational evidence boundary | current worktree research synthesis |
| `../domainspec-lean-formalization/theorem/sessions/2026-08-24-1041-profile-constraint-evaluation.md` | decisions, open questions, recommendation | supplies the source-session proof trail | current worktree session record |

## Excluded Context

- Presheaf and sheaf artifacts are excluded: no stable DomainSpec context category, restriction
  maps, compatibility relation, or global reconstruction requirement is selected here.
- Marketplace `BLOCKED` / `UNKNOWN` states are excluded: no current transformation connects this
  resolver result to those states.
- Production, release, deployment, and admission surfaces are excluded: `actual_findings` is an
  observation, not an authority-changing decision.
- General constraint operators are excluded: the Lean model covers only equality against an
  externally supplied property reader.
- Committed-HEAD claims are excluded: the inspected resolver, runner, and adapter surfaces are
  staged/current-worktree artifacts.

## Target Boundary

The requested owner decisions are:

1. Is the exact `resolveProfile(...).constraints → evaluateCase` seam intended and legitimate for
   an `implementation-conformance` fixture?
2. What tuple, if any, is the canonical semantic locus for compatibility: `property_id` alone, or
   a tuple including `constraint_kind`, `applies_to`, `property_id`, `operator`, and other context?
3. If the fixture is admitted, should it remain a characterization test of current behavior or
   become a normative rejection/compatibility rule owned elsewhere, and which role owns that
   decision?

The recommended first move is only the characterization fixture. It should report the three
controlled `actual_findings` observations and the exact input lineage. It should not label the
conflicting pair invalid, reject a profile, or change resolver behavior without a separate owner
decision.

Important result boundary: the runner's `execution.result = "pass"` means all
`actual_findings` matched the fixture's `expected_findings` oracle. It does not mean every
constraint was satisfied, the profile was admitted, or the configuration is semantically valid.

## Gaps / Blockers

- No current receipt demonstrates that the resolver's returned array reaches this evaluator. A
  qualifying receipt must bind source-profile refs, a canonical digest of `resolved.constraints`,
  a canonical digest of the evaluator input captured at entry, and an explicit equality result.
- No owner-approved definition fixes the semantic-locus tuple for profile constraints.
- The source artifacts are staged/current-worktree rather than established committed surfaces.
- The Lean artifact is a candidate contract and does not verify the TypeScript implementation.
- Adoption location and fixture lifecycle remain decisions of the confirmed owner; Vladimir is
  asked to identify or confirm that owner.

None of these gaps blocks reviewing this recommendation. They do block narrating it as an
implementation defect or an established DomainSpec law.

## Next-Session Prompt

Review the selected resolver, runner, and adapter selectors. Then answer the three owner questions
under **Target Boundary**. If the seam is accepted, run `invoke design` for a fixture that:

1. constructs three independent synthetic profiles with `extends: []` for the conflicting,
   true-only, and compatible-pair cases, each resolving to exactly its enumerated constraint IDs;
2. chooses an owner-approved minimal export or colocated harness for the two currently private
   functions, without duplicating either implementation;
3. calls the staged resolver independently for every profile, with no post-resolution filtering;
4. passes the exact returned `constraints` array to the Enum evaluator;
5. records source-profile refs, canonical resolver-output and evaluator-input digests, their
   asserted equality, and the three expected `actual_findings` values; and
6. keeps oracle agreement, constraint satisfaction, profile admission, and authority effects as
   separate fields or explicit non-claims.

Stop and reroute if satisfying the seam would require duplicating private implementation logic or
silently declaring the semantic-locus tuple.

## Provenance

- Execution path: `invoke handoff → context-builder bounded selection → session-handoff`
- Dispatch trace: `frame_handoff`, `handle_handoff`, `residue_ledger`,
  `owner_boundary_check`, `artifact_contract_bridge`, `concrete_path_evidence`
- Source session: `../domainspec-lean-formalization/theorem/sessions/2026-08-24-1041-profile-constraint-evaluation.md`
- Context Builder: standard bounded selection; six artifacts selected
- Obligation coverage:
  - exact source/session reference: covered
  - continuation prompt: covered
  - handoff type, destination reviewer, and requested owner route: covered
  - selected and excluded context: covered
  - evidence/authority boundary: covered
  - gaps and collapse-test: covered
  - next route: covered conditionally on owner acceptance
- Result: candidate recommendation red-team reviewed and repaired
- Next route: owner confirmation; then `invoke design` only if the confirmed owner accepts the seam

## Gate Result

- Claim ≤ proof: `pass`
- Novelty claim: `not made`
- Authority boundary: `pass`; evidence is non-authoritative
- Mutation authorization: `not granted`
- Promotion/release authority: `none`
- Handoff status: `candidate`
