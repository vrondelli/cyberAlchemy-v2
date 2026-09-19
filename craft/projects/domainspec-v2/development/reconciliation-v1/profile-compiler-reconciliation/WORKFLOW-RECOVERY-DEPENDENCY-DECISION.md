# Recovery dependencies after partial Workflow failure

Date: 2026-09-09. PCR-06 / DSR-017 successor. Candidate decision record.
Selected option: **A — ordering among needed compensations**, explicitly selected
by the user's `apply the suggestion` after the ordered/unordered explanation.
Decision Gate: **PASS for this candidate policy construction**. Authority effect:
none. No canonical definition, legacy behavior or default selection changed.

The [selected policy implementation](WORKFLOW-RECOVERY-POLICY.md) preserves ordered
and unconstrained compensations in the same Workflow. Its exact definition is
`workflow-recovery-policy-contract.json`, SHA-256
`194b34af821696ec129c5894333929670efe9f8acea708c662c55a9e11d4b48f`.

## The decision

Does a compensation's `depends_on` constrain ordering only when both
compensations are needed, or is it an unconditional prerequisite?

Example: `reserve-stock` completed, then `charge-payment` was definitively
rejected before committing. Recovery declares `release-stock` depends on
`refund-payment`. There is stock to release but no committed payment to refund.
Should the recovery plan contain only `release-stock`, or report the missing
prerequisite and decline to produce an executable plan?

This is not a question about automatically executing compensation. The existing
owner-admitted model already assigns that to an external executor.

## Evidence and scope

- `definitions/DEFINITIONS.md`, D36: recovery targets are a subset of the
  Workflow's Operations; dependencies constrain ordering; Workflow emits intent
  but does not execute recovery. D37 binds one immutable failure occurrence,
  completed-step journal and frozen plan.
- `impl/architecture-conformance/targets/typescript/workflow-compensation-v1.md`
  preserves that model and the independent external executor boundary.
- Its `.ts` reference implementation, `planWorkflowRecovery`, selects only
  completed-step compensation mappings, then rejects dependencies absent from
  that selected set with `RECOVERY_DEPENDENCY_INVALID`.
- The legacy generated TypeScript planner in `impl/cli/src/generation/generators.ts`
  similarly rejects an absent or ambiguous selected dependency.
- The selected `domainspec.workflow-occurrences/v1` source accepts an acyclic
  dependency between declared compensation occurrences, including a dependency
  whose forward step is later. It validates source closure, not failure-prefix
  recovery readiness. The approved occurrence-ID choice did not select a new
  partial-recovery policy.
- `impl/cli/test/typed-operation/workflow-bindings.test.ts`, the final partial
  failure test, executes the existing reference planner: two completed steps
  produce the declared recovery order; only the first completed step produces
  `RECOVERY_DEPENDENCY_INVALID`. The same structurally valid dependency is
  accepted by the new checked occurrence and typed binding layers.

The old behavior is verified, not silently designated a bug or changed. Applying
different behavior to the new lane requires this explicit meaning choice.

## Options

### A — Ordering among needed compensations (recommended)

When a forward step is definitely not committed, its compensation is not
selected. Ignore dependencies to those inactive compensations when ordering the
selected recovery plan. Preserve the original authored graph as source evidence.

- Benefit: ordinary partial failures still produce useful recovery plans.
- Cost/risk: `depends_on` cannot express a mandatory business prerequisite;
  silently assuming it can would be unsafe. A distinct prerequisite construct
  would require its own future definition, not an invented canonical edge.
- When to choose: dependencies mean “do B before A if both are needed.”
- Downstream: explicit candidate execution policy, deterministic selected-subgraph
  ordering, hostile controls for unknown outcomes, and preservation of legacy
  behavior. No automatic compensation dispatch or retry.

### B — Mandatory prerequisite

Keep the dependency even when its forward step did not complete. If it is absent
from the recovery set, return an explicit planning-blocked diagnostic; do not
execute it speculatively and do not return false success.

- Benefit: preserves strict prerequisite meaning and the existing planner's
  refusal to drop dependencies.
- Cost/risk: the example cannot produce an executable recovery plan even though
  stock needs releasing; authors must avoid such dependency arrangements or
  resolve the business prerequisite externally.
- When to choose: A is not lawful unless B has actually been performed.
- Downstream: failure-prefix closure diagnostics and explicit blocked planning
  outcomes; no fallback that silently omits an authored prerequisite.

Original recommendation: A for recovery **ordering**, because compensation should
not be requested for an action known not to have committed. The user subsequently
selected this recommendation. The distinction from mandatory business conditions
remains explicit: those belong to declared Rules and Operation guards, not to an
inferred ordering prerequisite. Unconstrained ordering does not authorize parallel
dispatch.

## Related boundaries, not new choices

An `indeterminate` Operation outcome is not evidence of non-commit. Neither
option permits skipping it, retrying it or fabricating its success value. Exact
outcome reconciliation remains necessary before freezing a plan that depends on
that fact; this unit implements no reconciliation provider or durable journal.

D36's explicit-dependency precedence and reverse-completion tie-break remain
separate from source declaration order. The occurrence source did not execute
an ordering policy. The new generator must bind the selected execution policy
explicitly rather than label source validation as execution.

## Original Task Session gate and continuation

At the original checkpoint the typed-binding unit completed independently, and
native Workflow recovery generation paused before choosing A or B. Independent
Interface/Mapping work remained runnable. The user's later selection above
resolves that pause; the full CLI ledger remains incomplete.

Decision Gate was applied with a bounded Context Builder evidence pack: current
source, bindings, Operation outcomes, D36/D37, canonical reference and a fresh
positive/negative reproduction. No delegation or runtime handoff. Dedicated
sigil-development experiments are not applicable. No operational owner action,
publication, admission, database setup or cleanup is a construction blocker here.

ARE request `ds-cli-continuation-20260909-058`; exact raw request
`continue until other decision`. Additional candidate-record effect assessment:
`84003c5e8203e95e6830770d83def6f4582770feb9752c20ef049404cd43c7b9`.
This non-executing assessment grants no authority and does not select an option.

## Open questions

The A/B dependency meaning is resolved. No new choice blocks implementing the
selected ordered/unconstrained policy. Native Workflow generation and public
CLI integration remain construction work, not completed by this decision.
The broader CLI and provider work remain in [CLI-COMPLETION.md](CLI-COMPLETION.md).
