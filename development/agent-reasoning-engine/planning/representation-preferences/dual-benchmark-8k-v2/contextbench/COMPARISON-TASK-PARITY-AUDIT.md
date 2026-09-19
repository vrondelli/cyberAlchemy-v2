# Comparison task-fidelity audit

Status: confirmed source-level defect; no live dispatch or benchmark clearance.

## Finding and decision

The original [issue-resolution protocol](../../../../../../agent-reasoning-engine/research/contextbench-v1/PROTOCOL-v1.md#task-fidelity) requires investigation and an attempted patch, followed by reporting the source context used. It explicitly excludes localization-only substitution. Native context scores do not certify patch correctness.

The current ARE [episode](discovery-v1/episode-recovery-v2.mjs) instructs the model to resolve the issue and attempt a patch; its orchestrator provides repository editing tools. The [minimal candidate](minimal-episode.mjs) only discovers/selects evidence. The [independent candidate](independent-episode-v2.mjs) restricts tools to search/read/list and ends with a selection-only join. This changes task duties as well as architecture. Existing offline tests prove their narrower mechanics, not compliance with the original task.

Preserve the issue-resolution protocol. Add successors that restore patch-capable work to both candidates; do not simplify current ARE to localization. Keep frozen sources/reviews unchanged. A failed patch attempt is evidence, not grounds to drop a task; native context quality and patch correctness remain separate claims. Exact source hashes are in [the audit record](COMPARISON-TASK-PARITY-AUDIT.json).

## Required construction order

1. Define the common task-duty/tool contract and architecture-specific deviations. Preserve public tasks, gold isolation, model, 8K requests, 96K/96-call per-arm caps and all twelve outcomes.
2. Add a patch-capable minimal successor with the original task instruction and source-bound final context.
3. Add patch-capable synthesis after independent investigations, inside the existing 20K/22-call join allocation. Keep investigators isolated and read-only; the arm as a whole must perform the original task. Explicitly declare phase-specific tool availability as an architecture difference.
4. Extend prepared-runner and join/export tests for actual edits, source snapshots, base/current projection, full cost accounting, failed edits and final selection. Do not assume the existing selection-only join validates a synthesis tool loop.
5. Amend prospective native hypothesis/experiment/task records and exact execution freeze; independently review before provider dispatch.
6. Complete durable ledger/index/capture reconciliation, process settlement and native scoring integration; qualify requests and D:/WSL capacity before the fixed comparison.

Coordinator owns construction. Independent review and exact experiment binding are prerequisites for live execution; release, publication and VHD reclamation remain separate operational residue. C: remains excluded from storage gates. The outcome store is independently approved with seven offline tests, but that approval does not resolve task parity.

## Open Questions

How should synthesis receive branch evidence without inheriting unverified claims as facts? What final-selection reservation fits within the existing join cap? Which prompt, tool-phase and history differences must be declared to distinguish end-to-end architecture effects from a pure retention effect? Broader confirmation and full benchmark acceptance remain separate from four-task development success.
