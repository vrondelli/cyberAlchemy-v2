# Minimal issue-resolution episode

Status: additive implementation; four offline tests pass. Independent review and prepared-runner integration pending. No live dispatch or benchmark result.

## Behavior

[minimal-repair-episode.mjs](minimal-repair-episode.mjs) succeeds the frozen localization-only minimal episode. It restores the original issue-resolution instruction and requires the exact native repository tool list, including apply_edits and get_patch. The model ends its attempt through finish_issue_attempt before source-bound terminal context reporting. Inability is allowed and must be reported honestly; an attempted patch or selected context does not establish patch correctness.

The existing minimal history policy, original reasoning replay, 88K/88-call work allocation, 8K/8-call final allocation and exact request admission remain unchanged. The work phase retains the historical internal phase name discover for compatibility. There is no extra repair budget or forced fabricated edit. Every attempted model call counts, including failures. Tool errors are delivered back through normal history.

Native source projection and terminal export are reused. The source context must include snapshots of base/current reads and the untouched base repository. A current read containing an edited line cannot stand in for base evidence; the prompt instructs the model to retrieve the corresponding base source. The prepared runner must preserve the patch separately and must not filter out editing tools.

## Verification

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/minimal-repair-episode.test.mjs

Four tests use actual temporary Git repositories and native tools/export with scripted model receipts:

- Successful exact edit, delivery of edit results, untouched base, base-bound final selection, edited-line exclusion and preserved reasoning replay.
- Rejected stale-hash edit, unchanged worktree and honest terminal inability.
- Provider interruption after a real edit: changed work retained, 240 known synthetic tokens and one unknown call, no fabricated final export.
- Rejection of read-only tool subsets before model dispatch.

The successful fixture uses seven scripted model calls and 840 synthetic tokens. These are instrumentation checks, not measured GLM performance or savings.

## Construction frontier and open questions

Coordinator owns integration. Independent review remains required. The shared candidate runner currently selects the old episode and read-only tools; it must receive an additive successor binding. Independent-investigation synthesis still needs patch-capable execution inside its existing join allocation. Exact native experiment amendment, durable accounting reconciliation, process settlement, scoring and execution freeze remain prerequisites for live comparison. How should a repair-stage failure be represented alongside any already-valid delivered evidence without converting it into success? Full benchmark and untouched confirmation remain open; release/deployment are deferred.
