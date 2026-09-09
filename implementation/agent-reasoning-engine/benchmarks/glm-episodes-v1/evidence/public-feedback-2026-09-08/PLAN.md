# Public repair feedback construction

Product frontier: public validation detects two confirmed semantic errors in six retained submissions. Add an explicit post-submission stage with one corrective call, leaving terminal original runs intact.

Product DAG: scope/plan binding -> public validation -> stop on execution failure or skip passing candidate -> one measured native corrective proposal -> strict parser -> public validation -> separate hidden-oracle evaluation. Test before freezing implementation and running all six retained candidates once. At most two corrective model calls, four tokenizer calls, 2048 output tokens/call, effective soft admission 7744, hard window 16384, safety1024, input margin512, final deadline60000ms. No retries or failure replacement. Target: both corrected proposals pass public checks and the separate eight-check oracle; four already-correct proposals make zero calls.

Affected stages: post-submission orchestration and benchmark corrective evaluation. This is not a new uninterrupted episode or integration into the default agent loop. Operational owner: user owns any activation; agent runs already-authorized bounded provider calls. Causal blockers: source drift, validation execution failure, token admission, transport failure. Deferred residue: end-to-end fresh episodes, unseen tasks, stronger isolation, oracle diagnostics. No ontology dependency. CAV2-D65 owner-directed candidate construction, authority effect none.

## Open Questions

Can one public-feedback turn repair both errors without regressions? Retained failing proposals were selected after evaluation, so this experiment cannot estimate overall prospective repair reliability or context continuity.

Execution-budget amendment before live freeze: loaded-host tests hit the default one-second child deadline. The new feedback stage opts into 5000ms per child and 120000ms per validation; the general validator retains its prior defaults. Exact timeout/output-limit categories distinguish execution failures. Both failed test attempts are retained.
