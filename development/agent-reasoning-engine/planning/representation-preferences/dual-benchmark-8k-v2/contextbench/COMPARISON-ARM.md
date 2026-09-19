# Three-arm execution dispatcher

Status: additive dispatcher implemented; six offline test groups pass. Independent review pending. Tests verify routing/guards with injected executors; they do not establish a full three-arm native run or live admission.

[comparison-arm.mjs](comparison-arm.mjs) derives all cells from the existing verified task/config builder with one repetition. Minimal-history and independent-investigations route to the reviewed common candidate runner. Current-are routes to the unchanged eager-recovery prepared runner, retaining discovery memory, output deferral and compact representation. The dispatcher preserves source task/digest/cache identity against caller runtime overrides and rejects unknown arms or a different configured model.

All cells use GLM 5.3 Flash, exact 8K context, 96K total model tokens, 96 maximum model calls, 2048 output reservation and single-attempt tokenizers. Finalization allocations differ explicitly: minimal-history 8K, current ARE 14K and independent investigations 20K within the shared total. Independent planning and branch limits remain separate as previously specified. Candidate cells discard irrelevant current-ARE behavior flags; current ARE keeps its frozen settings. These differences require the prospective final comparison declaration.

The dispatcher forwards the exact shared signal to client creation, including the older current-ARE runner that does not supply a signal itself. A single client-construction attempt is permitted. Before model dispatch it checks cancellation, all available client attempt families and the external guard. Returned or thrown result evidence with failed attempts receives an infrastructure-failure diagnosis. If a result omits a receipt family, the client receipts are retained rather than treated as zero. A plain executor exception without a result now receives an attached error result with both client receipt families and an explicit accounting-reconciliation requirement. Independent review identified this formerly unhandled path; the regression covers known and unknown usage. Present result arrays are not rewritten; the campaign must compare them with durable/client evidence and reject mismatches.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-arm.test.mjs
```

Six groups pass: fixed cells and explicit allocations; exact executor/task routing and signal forwarding for all three arms; index failures stop later model calls and classify returned/thrown outcomes; pre-abort prevents executor/client creation; missing index summaries on exceptions retain client evidence; and plain executor exceptions retain known/unknown model costs, index receipts and the original exception. Complete candidate source execution and actual production client cancellation are covered by their separate reviewed tests. The current comparator's unchanged runner has prior evidence; a new combined campaign remains necessary.

## Product frontier and open questions

Coordinator owns twelve-slot scheduling, complete outcome sealing, all-family failure supervision and native score/accounting joins. Slots, order, prompts, budgets, exact source hashes and unavoidable behavior differences must be frozen before generation. Real tokenizer qualification and D:/WSL admission remain prerequisites; C: is excluded. No component test proves perfect quality or 15% savings. Untouched confirmation remains open. Release and deployment are deferred residue.
