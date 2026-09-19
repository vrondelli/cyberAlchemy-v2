# Candidate-only live protocol

Run the reviewed current ARE candidate on all four fixed exposed tasks, with
GLM 5.3 Flash, low reasoning, measured 8K requests and two workers. No fresh
controls are scheduled. The candidate-only research record owns the hypotheses,
criteria and dependency DAG. The radical retrieval-first implementation is a
parallel research branch and does not block this run.

Each task retains 96,000 cumulative model input/output tokens and 96 calls;
the campaign ceiling is 384,000 tokens. Planning, recovery, finalization and
failures count. No model retries, replacement tasks or hidden gold in generation.
Unknown spend stops the queue and remains reserved in the four-outcome report.

The generation child uses the reviewed retained arm and admission-v5 transport.
Every dispatch is measured and storage-guarded. Prospective artifacts bind ESM
imports, literal runtime data, CommonJS package trees and their declared package
dependencies, the task/cohort configuration, credential reference configuration,
native research records, reviewed modules and Python evaluator sources. The
freeze is checked before and after generation and scoring. Secret bytes are
resolved by the existing provider and are never embedded in the freeze.

Generation storage uses the existing 256 MiB run guard, 64 MiB outcome guard,
and 32 MiB metadata guard, with their existing final reservations. The source
ceiling is 2 GiB. Total prospective growth reservation is 2 GiB plus 416 MiB,
including evaluator and supervision output. D:/WSL admission is enforced; C:
is excluded. No new capacity increase is introduced. The four-task repeated-read
fixture used about 46.1 MB run artifacts and 7.4 MB outcomes, not a worst-case
bound. A hard-limit failure remains an incomplete experiment, never success.

Initial-request qualification runs in a separately supervised, model-disabled
child. It records tokenizer receipts and exact prompts, and must settle cleanly
with zero model calls. Its evidence hash and the full source-freeze hash must
appear in the independent launch review. Qualification and live generation
use separate fresh roots. Every later generation request is still measured.

Commands, with NODE_OPTIONS=--experimental-vm-modules inherited by children:

1. `node prepare-candidate-only-production.mjs` creates the exclusive prospective
   freeze, without provider calls.
2. `node run-candidate-only-production.mjs qualify MANIFEST SHA256` performs only
   initial tokenizer qualification. No paid model-generation request is enabled.
3. Independent review binds MANIFEST SHA256 and the completed QUALIFICATION.json
   hash. Offline integration approval alone is not live admission.
4. `node run-candidate-only-production.mjs run MANIFEST SHA256 REVIEW` generates,
   settles the process group, reconciles every outcome and runs isolated native
   scoring. It will not resume or overwrite an existing run.

Report native span/file quality and all model tokens. A perfect valid candidate
may pass candidate_quality_target_passed; matched control savings remain null,
and benchmark_cleared/campaign_goal_achieved remain false pending full required
evidence and untouched confirmation. Partial or historical differences cannot
establish the original 15% matched savings target.

## Open Questions

Can the repaired candidate reach perfect native quality on the exposed tasks?
Will request fitting, source acquisition or selection still limit real GLM
trajectories? The existing scorer withholds evaluation after any reconciliation
or prediction-preflight failure; a descriptive survivor audit would be separate.
Untouched confirmation, generalization and the original efficiency claim remain
unproven. See CANDIDATE-ONLY-PLAN.md for the independent radical branch.
