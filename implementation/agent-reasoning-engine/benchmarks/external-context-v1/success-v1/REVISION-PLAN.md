# Outcome-driven revision experiment

## Objective and hypothesis

Continue the user-authorized GLM work with one fresh episode on the same Svelte task. Hypothesis: allowing evidence-driven investigation after a failed public test, plus an explicit inability outcome and actionable exact-edit feedback, avoids the placeholder-edit loop seen in attempt 3. This compound treatment does not isolate the contribution of each component. It does not promise a correct repair.

Prior evidence: [campaign result](RESULT.md), [research decision](research-result.json), and [attempt 3 events](evidence/attempt-3/events.json). No previous candidate patch or private evaluator feedback is included in the new model prompt.

## DAG and gates

`prior failure evidence → implement outcome phases → deterministic tests → freeze → one live episode → accounting audit → result`

`live public-green patch → private evaluation → if all-pass, second fresh evaluation → M1`

The live episode allows 24 model calls, 48 tokenizer calls, two candidates, four public probes, 120 seconds per model request, 1800 seconds total, and no retries. The unchanged local threshold is 12,000, hard context bound 16,384, output cap 2048, with receipt-bound reasoning reservation. One episode reserves USD 0.10 under the retained pricing assumptions. No additional episode is automatic. A pressure episode remains separate work after M1.

Staging closes at step 22, preserving test and finalization capacity. An untested candidate requires its exact public probe. A public-green candidate requires exact submission. A red candidate permits source reads, hypothesis updates and a complete replacement candidate against the original base. When no green candidate is available at the final turn, only an explicit inability report is offered. Existing exact-match checks remain authoritative; structured feedback does not repair source on the model's behalf.

## Construction boundary

D65 product frontier: isolated benchmark controller and one measured model episode. Runnable work: new revision source files, tests, frozen research records and run-local evidence in this directory. No ontology runtime record or selector is required. Existing baseline, public control and export preflight remain unchanged. Native execution is owner-directed candidate construction, with no authority promotion.

Operational tasks and owners: the local operator owns credential reference and Docker availability for the live/evaluation stages; both are existing prerequisites. Causal blockers: missing credentials, source drift, cleanup failure, accounting/provenance failures. Deferred residue: production activation, broader qualification, publication and deployment require separate objectives and are not prerequisites for this experiment.

## Success and failure

Behavioral observation: count invalid edits, valid revisions, explicit inability and tested candidate outcomes against retained attempt 3. One unpaired episode supports no causal or population success-rate claim. M1 still requires the model's exact patch to pass the public probe and 67/67 repair plus 5120/5120 regression labels in two fresh private evaluations. An inability outcome is honest termination, not repair success. All failures are retained.

## Open Questions

Does the treatment reduce invalid revision attempts without merely increasing inability or read-only loops? If behavior improves, does correctness improve? Can the mechanism generalize beyond this repeatedly used development task?
