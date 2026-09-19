# Candidate: task-directed discovery with recoverable history

Status: **offline proposal only**. No provider execution, source mutation or acceptance change is authorized by this document. This experiment is grounded in public task text, receipt-bound evidence and the input byte audit. It uses no evaluator-derived locations, task-specific search hints, gold labels or outcome-ranked candidates.

## Hypothesis and competing explanations

A bounded recent-history view plus an explicit public-task discovery checkpoint may reduce repeated input while encouraging exploration of unresolved task requirements. Treatment's tool messages are 47.68% of captured prompt bytes; exact repeated tool messages are 19.36%. These are bytes, not a saving forecast. The mechanism should transfer from repositories to document collections or conversation histories: preserve recent interactions, keep a provenance-bound evidence archive, recover earlier material on demand, and revisit explicit requirements when exploration stops producing new evidence.

Competing explanations: old source bodies are necessary for comparison; the model may repeatedly recover them and spend more total tokens. Unresolved-task reminders may encourage unnecessary searches or distract from a sufficient solution. A small evidence index may hide useful archive entries. Fewer bytes may tokenize poorly or cause longer reasoning/output. A combined discovery/retention intervention cannot attribute a result to either component; a later frozen ablation would be required before such a claim.

## Exact initial control and candidate

Use a paired full-trajectory development experiment on the same source-only selected cohort and pinned tasks, model, tools, source snapshots, output caps, total-token budget, terminal evidence recovery and evaluator. Both arms use the same successor terminal validation implementation; improvements from terminal repair must not be credited to retention. Both keep the full immutable observation/capture archive. Freeze all policy constants before any new model outcomes.

Control: successor episode with its existing recycler-visible history and terminal evidence recovery, without the policy below. Use the same compact schema/system representation in both arms so that schema shortening is not a confound.

Candidate, version `task-discovery-retention-v1`:

1. At the render boundary retain the latest **two complete assistant/tool exchange groups**, plus any pending exchange not yet confirmed delivered. Preserve each retained group byte-for-byte and preserve assistant/tool pairing. Ordinary latest user messages, the public task, system instructions, errors awaiting correction and finalization instructions remain intact. Do not rewrite old source bodies or assistant reasoning into invented summaries. Omit older completed groups only from the model view; keep the durable archive unchanged. Older unpaired assistant messages are omitted only when they precede the earliest retained group and carry no pending terminal/correction action.
2. Add a source-only recovery index capped at **16 entries, 1,024 UTF-8 bytes and 256 measured tokens**, whichever binds first. Each entry binds an opaque handle to an already confirmed archive observation and its original source identity/range. Choose most recent distinct source identities deterministically; disclose omission count and a paging/recovery operation, so the cap is not a silent archive ceiling. Recovering a handle returns its unchanged archived body and original provenance through the normal tool exchange. No reconstructed text is accepted as a new original read. Index insertion and recovery schema count toward complete-request admission.
3. Insert a fixed discovery reminder on the **first recycle**, and subsequently only after **four completed model/tool cycles with no new confirmed source-body hash**. At most one reminder per four cycles, at most three reminders per trajectory. Exact reminder: “Review the explicit requirements in the original task. If a requirement lacks supporting source evidence, choose one and use an available read-only search or read operation to investigate it. If the evidence is sufficient, finish. Do not infer that an uninspected source supports a claim.” The reminder contains no inferred task entities, file hints, retrieved gold or compulsory extra search. It has no effect during terminal-only finalization or correction.
4. The model chooses the next tool and arguments from the existing tool set. No hidden external searches or source reads occur. New evidence counts only after a receipt confirms delivery. Model calls, index/recovery requests and any correction attempts remain inside the existing whole-trajectory budget; no extra completion subsidy. Before dispatch, measure the complete rendered request with output reservation and existing safety margins, enforcing **8,000**, not 8,192. If the mandatory pending exchange cannot fit, use the existing validated deferral/failure path; never silently truncate its body.

The recovery index and paging adapter are implementation prerequisites, not claimed existing features. If they are unavailable, this candidate is not ready to run; do not substitute a silently truncated archive.

## Runtime integration and preflight

Use a new scoped/versioned episode copy, preserving frozen v1. In native `episode.mjs`, `renderPrompt` currently obtains `deliveryVisible` through `retainPendingToolExchange` and appends task state before capturing the prompt. The new retention view belongs immediately after that pending-exchange protection and before capture/token admission. `recycler.generate` already accepts render callbacks, `render_candidates` and `admit_dispatch`; do not alter an admitted wire body afterward. The snapshot receipt must bind the exact rendered index and request.

Native `buildEvidenceIndex`/`recoverObservedRead` and the orchestrator's `recoveryTool` provide archive-recovery foundations; `task-state.mjs` provides bounded state precedents. The successor `terminal-evidence.mjs` keeps full read IDs private and validates source projection at final selection. Discovery checkpoint counters belong beside the receipt-confirmed step update, not speculative render calls, because the recycler may render multiple non-dispatched candidates. Use complete exchange grouping; do not remove individual tool replies by role alone.

Required offline checks before a freeze: full pairing for multi-tool exchanges; pending first delivery survives retention; untouched retained bytes; recovery maps to the original observation after recycling; explicit paging reaches a seventeenth entry; no counter increments from rejected render candidates; reminder rate limits and finalization suppression; strict complete-request 8K admission; source edits cannot masquerade as original evidence; archive hashes unchanged. These checks require synthetic fixtures or public archived source evidence, not gold. They are proposed prerequisites, not tests already implemented by this task.

## Decision rule and risks

Measure actual provider input plus output across every planned task, failure, recovery and correction. Unknown usage prevents a pass. Preserve fixed native quality and completion gates, the full planned-slot denominator, pinned source and the 8K constraint. Retain the user's **at least 15% cumulative token reduction** requirement; do not lower it to match byte shares or exclude failed tasks. If perfect native quality is the active objective, nonregression alone is insufficient to declare success.

Report actual calls, recoveries, repeated bytes, new source observations, recycles, native scores and completion. A reduction caused by premature termination fails. Four tasks/two repeated stages are development evidence, not independent confirmation or a full-benchmark score. Do not claim a throughput benefit from configured concurrency alone.

Primary quality risks are forgotten dependencies, misleading source selection from a narrow index, and additional exploration exhausting the finalization reserve. Primary cost risks are repeated recovery, larger state/schema overhead and extra reasoning. Stop or reject according to the frozen quality/cost gates; do not use post-run gold to tune reminder locations or source ranking.

## Open Questions

Does the combined policy improve actual whole-trajectory cost without losing evidence? If it helps, which component causes the change? Is a two-exchange view adequate for comparison tasks, and does paging itself consume the expected savings? These remain untested hypotheses. A future discovery-only/retention-only ablation must be separately frozen before execution.
