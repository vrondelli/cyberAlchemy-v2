# Decision Gate Workflow Maintenance Findings

## Review Result

- Dispatch: `2026-07-14-decision-gate-workflow-maintenance`
- Sequence: `workflow-reflect` completed, then `sigil-maintenance-loop` stopped at
  its required user-approval gate; the gate was subsequently resolved by
  `DEC-ARC-DG-COVERAGE-GUARD-APPROVAL`.
- Verdict: **KEEP the Decision Gate core contract; FIX one additive decision-
  coverage guard**.
- Maintenance status: `APPROVED-HANDOFF`; canonical and generated mutation remain
  pending under Sigil Development.

## Evidence

The complete repository signal ledger has 197 JSON-object rows. Thirty-one rows
have `sigil == "decision-gate"`, all with unique run identifiers. Twenty-six
include observer blocks; every one reports Quality Bar `pass`, while none reports
an Anti-Pattern hit or output-contract drift.

The latest signal records one low-severity enumeration miss: a collection-wide
fixture-disposition obligation was first narrowed to the toy exemplar. The run
corrected the omission, resolved the fourth decision, and only then returned
`PASS` (`.arcanum/observability/signals/sigil-invocations.jsonl:197`). The existing
contract already requires enumeration of unresolved decisions
(`.agents/skills/decision-gate/SKILL.md:60`) and identification of every visible
blocker (`:130`). This is evidence for executable hardening, not for a new core
contract.

Positive multi-decision evidence is visible at ledger rows 156, 160, 180, and
182. Those runs preserve explicit choices, unresolved downstream limits, and
authority boundaries. The reflection-state counter reports 19 Decision Gate
executions and 48 outputs (`.arcanum/observability/reflection-state.json:88-92`),
while the append-only ledger contains 31 historical rows; the ledger therefore
remains the execution-count source for this review.

## KEEP/FIX Verdict

| Area | Verdict | Reason |
| --- | --- | --- |
| Objective and pass/block authority | KEEP | Honest block and pass outcomes recur without observed drift. |
| One-decision cadence and explain option | KEEP | No contrary signal or Anti-Pattern hit appears. |
| Durable decision record | KEEP | Successful multi-decision runs persist reviewable outcomes and bounded handoffs. |
| Decision inventory reconciliation | FIX | One corrected run shows that source-wide quantifiers can be narrowed to an exemplar before the final coverage check. |
| Reflection counter normalization | DEFER | Real discrepancy, but owned by observability rather than Decision Gate. |

## Proposed Maintenance, Ordered

1. Add a product-neutral pre-question and pre-`PASS` reconciliation guard to the
   canonical Decision Gate process. Every explicit source obligation, named
   blocker group, owner handoff, and collection quantifier must map to a resolved
   decision, open blocker, deferral, or labeled assumption.
2. Add one generic regression under the Decision Gate development harness where
   an illustrative fixture and `every existing fixture` are distinct coverage
   obligations. The test must fail if only the exemplar is asked.
3. Run the governed Experiment Harness validation, then regenerate the installed
   `.agents/skills/decision-gate/` package from canonical source.
4. Separately route the reflection-state 19-versus-ledger-31 discrepancy to the
   observability owner; do not bundle it into Decision Gate maintenance.

No proposal changes the sigil objective, authority rule, standing explain
choice, decision record, or output contract.

## Approval Resolution

The operator approved this bounded public-safe scope after using the standing
Explain path:

> Add the decision-coverage reconciliation guard to
> `arcanum/arcana/decision-gate/SKILL.md`, add one generic collection-scope
> regression under `arcanum/arcana/decision-gate/development/`, validate it via
> Experiment Harness, and regenerate `.agents/skills/decision-gate/`. Preserve
> the core contract and keep all private DomainSpec paths and evidence out of
> public Arcanum.

The durable record is `APPROVAL.md`. Approval removes the human gate but does not
claim that canonical mutation, regression evidence, Experiment Harness, runtime
regeneration, or promotion has occurred.

## Workflow Reflect Output

- Report:
  `.arcanum/observability/reflections/20260715T001911Z-decision-gate-reflection.md`
- Signals analyzed: 31 relevant rows, including 26 full observer rows.
- Thresholds triggered: manual, meaningful executions, generated outputs.
- Pattern claims: stable core; one isolated enumeration miss; one separate
  observability-normalization issue.

## Maintenance Loop Status

- Signal Observer: skipped as already recorded; latest dedupe key occurs once.
- Workflow Reflect: pass.
- Sigil Development: targeted update approved and awaiting a separate lifecycle
  invocation.
- Canonical Decision Gate mutation: none.
- Generated Decision Gate mutation: none.
- Public `arcanum/` mutation: none.

## Invoke Refresh

- Status: `pass`; the approval blocker is resolved.
- Report: `REFRESH-REPORT.md` and `refresh-report.json`.
- Next owner: `sigil-development --update`.
- Boundary: the refresh changes private decision/handoff state only.

## Validation

- `jq -s`: 197 of 197 signal rows parse as objects.
- Decision Gate filter: 31 rows, 31 unique run IDs.
- Latest Signal Observer dedupe check: exactly one row.
- Observer aggregation: 26 Quality Bar passes, zero Anti-Pattern hits, zero
  output drift.
- Canonical/generated contract diff: bodies align; generated metadata and final
  newline account for the current diff.
- JSON parse: reflection state required after update.
- Markdown/path and scoped-diff checks: required after write.

## Files Changed

- `.arcanum/observability/reflections/20260715T001911Z-decision-gate-reflection.md`
- `.arcanum/observability/reflections/20260715T001911Z-decision-gate-maintenance-report.md`
- `.arcanum/observability/reflection-state.json`
- `projects/domainspec-v2/development/workflow-reflections/20260714-decision-gate-maintenance/findings.md`
