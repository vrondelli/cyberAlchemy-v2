# Audit: objective → research method → plan → experiment → learning

Date: 2026-09-10. Requested audit evidence; authority effect none.

## Verdict

**Yes, recent experiments still use ARE's research-learning ontology. No, the
whole objective-to-learning chain is not consistently connected or verified.**
The problem is fragmented traceability and missing decision checks, not wholesale
abandonment of hypotheses or experimentation. The newest tool-audit plan I wrote
preserves scientific safeguards in prose but does not bind its tasks to exact
research questions, hypotheses, observations or learning decisions. That is an
incomplete handoff for the next experiment, even though the audit itself is complete.

The purpose remains the [saved objective](../tool-state-audit-v1/OBJECTIVE.md):
help the same model reason, preserve continuity, recover and complete tasks more
reliably within cumulative input-plus-output token budgets. GLM is the current
qualification target. A completed experiment, passing patch, intact archive and
improved ARE capability are different achievements.

## Method used as the audit standard

The directly relevant source is [ARE's research-learning ontology](../../../implementation/agent-reasoning-engine/packages/evolution-runtime/ontology/research-learning-v1.json),
not merely a document containing a Mermaid graph. Selected definitions:
ARE-RL-D01 hypothesis, D02 observation, D03 experiment, D04 learning decision,
D05 retention, D07 research DAG and D08 research work plan. D06 failure projection
is a possible source of hypotheses, not mandatory evidence that every hypothesis
was generated automatically.

These definitions require falsifiability, exact evidence bindings, explicit
successor lineage, retained counterevidence, and criterion-verified work completion.
The [work-plan implementation](../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs)
already binds each task to a question, owner, lane, stage, criteria and verifier.
Its [existing example](../../../implementation/agent-reasoning-engine/packages/evolution-runtime/plans/requirement-research-v1.json)
separates inspect → hypothesize → register → run → assess. Reuse this capability
where its registration contracts fit; do not pretend arbitrary planning JSON is
already one of its verified plans.

The separate [repository Research document contract](../../../research/RESEARCH-DOCUMENT-TYPE.md)
requires Project/Goal links, a bounded question, method, evidence/counterevidence,
findings, limitations and claim ceiling. Its profile currently selects a specific
`projects/*/research/*` record population, and its validator hardcodes the
PythonConstraint example. It cannot certify ARE's experiment families. Absence
from that example projection is not proof that ARE has no research method.
An explicit candidate bridge is needed, without inventing admitted Goal records.

No registered ontology-runtime operation or global ontology preflight was used.
This audit reads the exact method definitions and their consumers. Candidate
runtime enforcement remains suspended under repository instructions.

## What is actually present

[Reproducible checks](check-records.mjs), [machine results](record-checks.json):
20 selected artifacts contain 198 research-record appearances, all passing the
existing `verifyEvolutionRecord` integrity check. These are **not 198 unique
experiments**. The sample covers the terminal H23 research graph, shallow external
research bundles, and three recent work DAGs. It does not re-audit every old run.

| Surface | Verified evidence | Assessment |
| --- | --- | --- |
| H23 terminal research graph | 122 records: 24 hypotheses, 35 experiments, 32 observations, 31 decisions; 206 edges; all endpoints resolve, no cycle | Explicit ontology-linked research DAG exists; logical order alone does not prove historical preregistration. |
| Feedback timing | Frozen bundle: five competing hypotheses and one experiment; reviewed result: five observations and five decisions as well | Method continues through execution and interpretation. H1 remained inconclusive because no live syntax-invalid candidate occurred. |
| Recovery reservation | Frozen H1/H0 and experiment; reviewed result retains original observation/decision and adds counterevidence plus revise-hypothesis | Method continues. The review explicitly says not to adopt strict checkpoints. |
| Recent planning DAGs | Feedback, recovery and tool-audit work DAGs have dependencies and evidence/acceptance links, but no question-bound tasks with validator/criteria fields | Useful work schedules, not D08 research-work plans. Research records live beside them rather than being consistently joined. |
| New tool-audit plan | Objective, evidence synthesis, offline controls, token ledger and prospective matched comparison are specified | No selected next hypothesis, exact question ID, decision lineage or criterion verifier yet; valid candidate outline, incomplete experiment handoff. |

Sources: [H23 graph](../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/research/dag-payload-live-87-final.json),
[feedback research](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/feedback-timing-v1/research.json),
[feedback reviewed result](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/feedback-timing-v1/reviewed-research-result.json),
[recovery research](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/research.json),
[recovery reviewed result](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/reviewed-research-result.json),
[current plan](../tool-state-audit-v1/PLAN.md).

Twelve edge appearances in older external bundles point outside their local
bundle. They are cross-file dependencies, not proven missing records or cycles.
The check reports them as unresolved **within that file**; composing a complete
graph requires explicitly resolving those versions. No internal cycle was found.

## Findings: the missing middle

| ID | Finding and evidence | Consequence and required correction |
| --- | --- | --- |
| M1 — high | Current DAG has an objective link but no question/claim mapping per task; recent experimental hypotheses refer to local plans and analyses | Add exact objective version → bounded question → hypothesis → plan-task links. Explain how each metric supports an objective outcome and its claim limit. |
| M2 — high | Recovery `freeze.mjs` sets `parent_hypothesis_ref:null`, although the prior feedback plan motivated recovery budgeting; the new audit DAG cites no exact learning-decision IDs | Narrative succession exists, but machine lineage is interrupted. Link the reviewed predecessor decision and unresolved question to the successor; do not infer parentage from names or dates. |
| M3 — high | Current plan moves from synthesis C to repair D and later protocol G without a distinct, criterion-bound hypothesis comparison/selection step | For experimental claims, record competing explanations, falsifiers, expected discriminating observations and why this experiment is informative. A known contract fix can proceed as engineering work, but its repair test is not evidence of general reasoning benefit. |
| M4 — high | Recovery controls assert correct tool restrictions and recovery after an accepted candidate; they do not test rejected-stage → corrective read → retry. Final report documents two episodes asking for an unavailable reread | Add instrument-validity and recovery-path tests before dispatch. Verify the mechanism can operate, not only that the treatment matches its implementation. |
| M5 — high | Feedback H1 never encountered its target live error; successful reserved repair occurred before checkpoint exposure | Require an exposure/identifiability assessment before freezing and explicit not-exercised outcomes afterward. Use a separate diagnostic fault corpus when needed; do not inject faults into or extend the frozen natural-task cohort. |
| M6 — high | New objective selects cumulative tokens only; completed protocols used fixed calls and time/price criteria as well. New plan recognizes the distinction but has no frozen token tiers or measurement-to-hypothesis binding | Preserve old protocols as history. Future protocol must bind cumulative input/output, missing usage policy, outcomes and an estimand before dispatch; call equality cannot establish token efficiency. |
| M7 — medium | Recovery retains an original inconclusive decision and a later revise-hypothesis decision. Review is explicit in prose, but the new plan does not name which interpretation controls its successor | Record reviewed decision precedence with provenance, preserve both versions, and attach the next action to the plan. Do not count both interpretations as independent experimental evidence. |
| M8 — medium | D08 criterion-bound completion and D05 exact candidate retention exist, but the new plan ends with qualification without an explicit learning/retention/goal-update task | Add a learning closeout after each study: support/revise/inconclusive, permitted claim, exact candidate/evidence, remaining goal gap and successor question. Retain only supported current candidates; never force a positive retention record. |

Primary checks for M2/M4/M7: [recovery freeze](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/freeze.mjs),
[controls](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/controls.mjs),
[mechanism review](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/review-mechanism.mjs),
[final result](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/recovery-reservation-v1/FINAL-RESULT.md).
M5 also follows the [feedback closeout](../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/feedback-timing-v1/FINAL-RESULT.md).

Record constructors and integrity checks do not independently establish causality,
independent replication, or completeness of alternatives. The standard assessor
counts supporting observations and prioritizes counterevidence; it does not infer
whether the intervention was actually exercised. The recent custom reviewers add
useful domain-specific interpretation. Preserve that judgment and bind its method,
rather than treating a generic assessor as a scientific oracle.

## Correction to the plan

The [traceability and insertion map](PLAN-BRIDGE.md) ties every recommended missing
step to the existing plan. This is an audit recommendation, not a new live-run
freeze or a change to historical evidence. The immediate work should complete the
question/hypothesis/decision bridge while tool-contract repairs and measurement
work are prepared. No need to repeat completed benchmarks merely to create records.

## Open Questions

- Which exact objective/project/goal identifiers should the candidate bridge use
  without implying repository Goals admission?
- Which question is next: tool recovery reliability, useful state after pressure,
  or token-efficient presentation? They must not silently become one treatment.
- Which existing D08 registration adapter can accept these explicit GLM records,
  and what minimal bounded adapter work is needed if it cannot?
- What pre-run evidence is sufficient to establish informative natural exposure?
- How should reviewed decision precedence be represented without overwriting history?

## Limits and effects

This audit verifies selected record integrity, graph structure, source code and
plan/result relationships. It does not prove all past work followed the method,
replay models, or certify every causal conclusion. All historical experiments and
the prior audit completion hashes remain unchanged. No new model/tokenizer calls,
engine fixes, ontology promotion, registration or publication occurred.
