# Twelve-outcome native scoring

Status: implemented with six offline orchestration tests and one actual prepared-runner integration test; independent review pending. No new provider calls or actual upstream evaluator execution in these tests.

`score-comparison-campaign.mjs` connects the R2 evidence reconciler, sealed outcome hydration, prediction reconstruction, bounded native scoring bridge and R2 score summary. It requires a fresh score directory separate from generation and source trees. The caller must provide affirmative process-settlement verification before scoring and storage admission before each evaluator invocation.

All eligible predictions are reconstructed before any evaluator access. A missing reconciliation or failed reconstruction prevents all scoring. Evaluator failure stops subsequent evaluation while retaining all twelve assigned outcomes and their generation costs. After evaluation, the orchestrator repeats evidence reconciliation, verifies reconstructed predictions and source bindings, and checks process settlement again. Drift invalidates every provisional score. The final guarded RESULTS.json retains rejected native scores as unverified evidence and cannot pass the development gates.

The production prediction preparer reads bounded regular files, validates task identity and journal hashes, reconstructs exports from retained snapshots, and checks the base Git checkout revision and cleanliness. Its verification closure repeats reconstruction and compares file bindings. This assumes settled local source trees; it is not a defense against an adversarial concurrent filesystem writer.

Tests exercise orchestration with injected reconciliation, hydration, prediction preparation and evaluator functions. Schedule validation, score summary, storage guarding and final persistence are real. Covered cases are twelve-outcome success ordering, preflight rejection, evaluator failure, post-score source drift, initial and final settlement failure, storage denial and explicit native error output. Synthetic perfect scores demonstrate gate behavior only; they do not establish benchmark quality.

The separate `comparison-score-preparation.test.mjs` executes the current ARE prepared runner against a temporary Git repository with scripted transport and actual native tools, recycling and guarded persistence. The production prediction preparer reconstructs its saved prediction from the resulting files and rejects a dirty base checkout on verification. This closes current-arm source-layout coverage; it does not execute the isolated evaluator or live provider.

## Open questions

Coordinator owns end-to-end integration using real retained generation artifacts and the actual isolated evaluator. The external process-settlement verifier and live campaign launcher remain necessary; passing a callback is not independently authenticated process evidence. Independent review must cover sealed-outcome nesting and actual source-layout compatibility, not only injected seams. A prospective experiment freeze and D:/WSL storage admission are required before live generation. Untouched confirmation and full benchmark scope remain open after any four-task development pass.
