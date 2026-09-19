# Complete minimal-history baseline episode

Status: additive offline implementation, five test groups pass; independent review pending. No provider calls or benchmark score. This is a complete episode over a driver contract, not yet a production source runner or campaign.

## Execution and evidence

[minimal-episode.mjs](minimal-episode.mjs) executes source discovery with the reviewed [two-exchange adapter](MINIMAL-HISTORY.md), then a separate native evidence-selection request. It offers only search/read_file/list_files plus finish_discovery during discovery. The final phase exposes only the same expanded terminal handle tool used by the independent-investigation candidate. Task/source text is evidence, not instructions. There are no planner questions, injected discovery reminders or separately saved reasoning notes.

Full delivery captures remain retained after visible history is pruned. The native branch binder receives one evidence container, q1; that identifier is internal bookkeeping, not an investigation question. The common terminal builder and exporter can therefore select evidence delivered in older, now omitted exchanges. No archive union is implicitly selected. The final export is bound to the actual terminal request and response.

Original transport messages supply subsequent assistant history, including reasoning fields. Public response captures are used only for evidence verification; they intentionally omit reasoning. An initial regression failed because the public capture was incorrectly replayed as history. The implementation now preserves the original message, and the regression verifies the next request contains its reasoning field. The frozen independent episode has the same public-capture replay pattern and requires an additive correction before common provider qualification; its existing review does not establish reasoning-field replay.

## Shared budget and stopping

[minimal-phase-runtime.mjs](minimal-phase-runtime.mjs) is an additive derivation of the reviewed independent phase controller, with the same receipt integrity, reservation, failed-cost and settlement checks. Its fixed phase schedule is discovery 88,000 tokens/88 calls and final selection 8,000 tokens/8 calls, summing to the common 96,000-token/96-call ceiling. These are prospective implementation choices requiring the final comparison freeze, not tuned results.

Discovery stops when the model emits an empty-object finish_discovery call, after 88 discovery calls, or when less than a full 8K discovery reservation remains. Checking that conservative ceiling before preparation avoids leaving an un-dispatched prepared request open while switching phases. Unused discovery allocation is not transferred. Final selection currently permits one model response, despite the broader final phase call ceiling. Every failed attempt retains costs/reservations and prevents another phase from running.

A request must pass measured input plus output reservation <=8K through the native driver. An oversized retained history fails explicitly; this module does not truncate tool messages or manufacture summaries. If discovery hits its limit just after executing a source tool, that last result has not been delivered to the model and is excluded from bound terminal evidence. Earlier delivered observations remain eligible.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/minimal-episode.test.mjs
```

Five groups pass: full six-call discovery/selection with retained early evidence and reasoning replay; provider/persistence/window failure accounting; forced finalization at 88 discovery calls; finalization at the 88K discovery token ceiling with exactly 96K total synthetic spend; and sticky receipt-integrity failure with window admission rejection. Synthetic token usage and scripted model choices do not demonstrate real quality or efficiency.

## Product frontier and operations

Coordinator owns native driver/source runner integration, additive correction of independent reasoning replay, and the three-arm/twelve-outcome campaign and scorer. Native production accounting must reconcile raw receipts, not treat missing summary fields as zero. Exact shared abort wiring, measured request qualification, reviewed source freeze and D:/WSL admission precede live dispatch. C: is excluded. Release/deployment are deferred residue.

## Open questions

Will real GLM use finish_discovery reliably and select the relevant evidence? Does the fixed two-exchange policy preserve enough context? How should the independent arm adopt a bounded history policy without hiding the experimental difference? Common task instructions, terminal semantics and unavoidable architecture differences still need the final comparison declaration. Perfect native scores and at least 15% token reduction against both baselines remain unproved; untouched confirmation remains required.
