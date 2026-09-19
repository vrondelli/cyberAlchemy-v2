# Independent investigations: candidate execution contract

Status: bounded design for implementation; no dispatch admission. Parent objective and evidence: [RADICAL-BRANCH-PLAN.md](RADICAL-BRANCH-PLAN.md), [reviewed diagnostic](RECOVERY-R1-COVERAGE-RESULT-REVIEW.md), and RECOVERY-R1-COVERAGE-POSTRUN.json. Original H1 remains inconclusive. Native registration of this design is prospective; it does not imply a successful implementation.

## Intervention

Use a task-derived question plan, three independent investigations, then one evidence join. The changed variable is the reasoning/search topology. Investigators get the same public objective and tools, but different public-task-derived questions and fresh contexts. They may discover previously unseen source. Their messages do not include other investigators' reasoning or provisional answers. All delivered observations enter one immutable receipt-bound archive for the final join. Claims are provisional; source references never become true merely because a worker emits them.

The planner must emit exactly three nonempty questions and a short statement of what each investigates. It must not emit file paths, task identifiers or purported source findings. This keeps the initial decomposition grounded in task text rather than prior benchmark outcomes. The runtime does not silently invent fallback questions after invalid planner output. Invalid structured output is a counted failure under the shared stop policy. Planner questions are not asserted to be independent merely because there are three.

Each investigator gets the original task, one question, policy and its own local tool exchanges. Questions run in deterministic order within a task, not nested concurrent agents; two benchmark workers remain the only concurrency. Each branch has its own protocol-valid context history and may use the common recovery interface for its own delivered observations. The final join receives all branches' delivered evidence through a common terminal candidate builder, plus their bounded provisional findings. No branch answer is accepted as final without the common source-bound terminal selection.

## Shared accounting and request admission

Each arm has the same maximum of 96,000 cumulative model input/output tokens and 96 model calls. Alternative phase ceilings sum to that same total: planning 4,000 tokens/2 calls; three investigations each 24,000 tokens/24 calls; join 20,000 tokens/22 calls. Unused phase allocation is not transferred in version 1. These allocations are prospective design choices, not measured optimal settings. Every model-generated planner question, tool selection, investigator note, reasoning output and join response counts. Failed and interrupted calls retain known usage or conservative reservations; unknown accounting prevents acceptance.

Each request must satisfy measured input plus reserved output <=8,000. Reservation occurs before dispatch; actual usage settles afterward. Branch budgets do not multiply the arm budget. Admission failure triggers the specified terminal/failure path; it cannot erase prior work or silently retry. Tool protocol boundaries are preserved when creating a fresh model conversation. A context reset is not an unmeasured compaction operation.

The planner's structured output has a bounded schema. Investigator final notes contain question ID, provisional claims and delivered reference IDs; maximum note size and prompt/tool assembly must be fixed by tokenizer qualification before freeze. Terminal evidence handle and span semantics are common across all arms. If the common representation cannot express a correct selection, fix and qualify that interface for every arm before dispatch.

## Baselines and comparison

Three separately named arms, never historical result reuse:

- Minimal-history control: same GLM, public task, source tools, exact-window admission, terminal interface and accounting, without ARE discovery reminders or persistent reasoning notes. Its explicit protocol-valid recent-history projection must be implemented and reviewed. This is an operational baseline, not an unqualified claim of default or plain GLM behavior.
- Current ARE: frozen eager-recovery continuous trajectory with shared provider-health correction. Hold task instructions, source tools, model settings and final evidence representation equal where architecture permits. List unavoidable differences before execution.
- Independent investigations: the intervention above. Planner and join overhead are included.

Primary mechanistic contrast: alternative versus current ARE. Product-efficiency contrast: alternative versus minimal-history control. Require perfect alternative Span-F1/File-F1 on every task and >=15% cumulative-token reduction against both comparators for this candidate's development success; report both comparisons even when one fails. This stricter candidate decision does not relabel historical experiments. Keep incomplete arms in the denominator, with no accepted savings when validity or accounting fails.

Use the same four exposed task identities, one predeclared repetition, twelve assigned outcomes and at most two workers total. Proposed task-local arm order rotates across the first three tasks and reverses on the fourth; exact sequence must be frozen in executable configuration before launch. This small cohort cannot establish generalization or reliable variance. Untouched confirmation remains mandatory. Maximum reservation is 1,152,000 model tokens across all arms, not predicted spend. Retain failed-stage costs separately and in campaign totals.

## Implementation DAG and admission

1. Register competing hypotheses and work tasks from the reviewed coverage question.
2. Implement planner validation, branch isolation, one shared reservation ledger and receipt-bound evidence join as an additive runtime. Test invalid plans, failed/unknown calls, cross-branch reference confusion, context fit, duplicate observations and shared limits before live calls.
3. Implement and test the minimal-history baseline; bind the corrected current runner. Reuse existing transport, request admission, source tools, snapshots and scoring adapters instead of copying them.
4. Run source-only replay and synthetic complete trajectories. They test contracts, not model quality. Qualify real tokenizer request shape before model generation; preserve calls and failure accounting.
5. Freeze exact prompts, allocation constants, model identity, all twelve slots, ranking, final span semantics, tokenizer deadlines, failure/stop behavior, D:/WSL storage growth, scoring and falsifiers. Independent review is required. No live call is admitted by the current native hypothesis objects.
6. Generate, seal, score in isolation, review results, record observations/decisions and select a successor. Retain initial goal, method and earlier counterevidence.

## Product and operational boundaries

Coordinator owns implementation and evidence joins. Current runnable product work is the additive runtime and offline tests. Native hypotheses/work are candidates until exact runtime verification and freeze. Operational prerequisites for provider dispatch are exact capacity, D:/WSL storage and provider-health/settlement checks. Two-plus-two or four-worker simultaneous execution requires separate shared-supervisor evidence; it does not block sequential construction. C: is excluded. VHD reclamation, release and deployment remain separate residue.

## Open questions

Will task-only decomposition produce meaningfully different investigations? Will independent branches repeat searches or omit cross-question dependencies? Do 24K branch allocations allow enough useful exploration? Can the join recover branch evidence without recreating a large prompt? Can a common terminal representation express perfect evidence selection? These are testable risks, not reasons to presume this candidate succeeds.
