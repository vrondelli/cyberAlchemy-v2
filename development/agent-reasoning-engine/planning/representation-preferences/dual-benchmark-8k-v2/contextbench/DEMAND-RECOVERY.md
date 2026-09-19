# Demand-driven recovery candidate

Status: additive implementation for the [efficiency hypothesis](EFFICIENCY-HYPOTHESES.md). No frozen benchmark runner or evidence was changed. No model or tokenizer call has run for this candidate. No efficiency or quality claim is established.

## Exact interface

`createDemandRecovery({measure_tokens})` exposes `prepare(archive)`, `acknowledge({prompt, receipt})`, and `execute(name, args)`. The caller retains the complete receipt-bound archive independently of its projected live context and keeps the controller alive throughout the trajectory. Process restart persistence is not implemented and must not silently recreate an entry-state controller.

Entry mode returns one user message and the `open_recovery` tool. It does not enumerate, inspect or claim completeness of archive contents. Preparing this mode makes no tokenizer call. A successful model receipt must bind the exact submitted request, the own user entry message and the exact tool parameter schema before opening is allowed. Failed acknowledgement revokes prior acknowledgement.

`open_recovery({})` stages expansion. It does not mutate the exposed tools midway through a batch. The next prepare validates the complete retained archive through the existing recovery implementation and returns its first catalog page plus its two tools. Corruption fails closed; the staged opening remains retryable without another model request after source repair. The expanded request must itself be acknowledged before recovery.

Expanded mode stays expanded for the remaining trajectory. Existing immutable-snapshot paging, handle validation, staged next-page transitions, refresh-at-end and original read restoration remain delegated to the unchanged controller. Compaction may remove displayed history but must not discard the caller's retained archive or controller. Returned projections are detached from internal state.

## Validation and limits

Four synthetic tests cover staged opening and batch boundaries; no recovery before acknowledgement; exact schemas and own-message delivery; unsuccessful receipts revoking access; detached projections; all 37 reads across multiple pages; off-page handles; archive refresh; and corruption followed by source repair. They use a byte-based fixture measurer solely to exercise page bounds, not to establish provider tokens.

The controller is not yet integrated with episode capture, tokenizer measurement, native bounded persistence, or a live freeze. Its entry mode can add a model/tool turn when recovery is needed. That cost and the risk of reduced catalog visibility belong in the future whole-trajectory evaluation. Cold entry's lack of archive validation does not validate or replace the experiment's source-complete preflight.

## Observed predecessor defect

[Actual-wire audit](RECOVERY-VISIBILITY.json): all 97 prior acknowledged catalogs were pinned empty snapshots created before source delivery. Thus zero recovery calls cannot reject populated recovery. This candidate delays the initial snapshot until opening, but expanded mode still uses explicit refresh. A fair causal comparison must define equivalent archive availability and separate freshness repair from visibility changes.

## Next executable gates

Independent implementation review → exact matched request projection and synthetic tests → native hypothesis/experiment registration and source freeze → real-tokenizer counterfactual. Full generation additionally depends on compact final-reference persistence, episode integration, complete accounting and an independently reviewed prospective full-trajectory experiment. The original perfect-quality and at least 15% cumulative-token gates remain unchanged.

Coordinator owns this candidate and its joins. D:/WSL storage guards remain prerequisites for bounded live stages; C: is excluded. No release or authority promotion is implied.

## Open questions

Does the entry affordance elicit recovery when needed? Does its extra opening turn offset smaller earlier requests? Does implicit catalog visibility help discovery despite zero explicit recovery calls in the previous run? Can this interface preserve perfect quality on complete trajectories? The retained-request tokenizer study can answer only the input-size question.
