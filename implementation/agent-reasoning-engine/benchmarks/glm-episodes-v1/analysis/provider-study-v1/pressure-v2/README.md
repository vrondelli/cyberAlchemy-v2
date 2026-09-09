# Measured context pressure probe, adapter-bound successor

[H9](hypothesis.json) and its [canonical experiment](experiment.json) are frozen before live execution. Parent: [original H9](../pressure/hypothesis.json), whose harness stopped before any provider requests because its compiled-agent adapter was missing. Those results are retained as inconclusive. This successor supplies the same baseline adapter used in the main study. This package uses ARE-RL-D01/D02/D03/D04/D07 from the [research ontology](../../../../../packages/evolution-runtime/ontology/research-learning-v1.json).

The baseline and treatment share the archive-start repair, source, contract, hidden checks, prompt, engine, 8K soft window and 16,384 hard bound. Treatment adds 20,700 characters of deterministic synthetic inventory identifiers to README inspection. These identifiers contain no repair answer. This is intentionally artificial load to test the mechanism; it is not a natural-task generalization test.

The [manifest](prepared/manifest.json) pins all fixture bytes, runner, hypothesis, experiment and existing engine freeze. Exactly two trials are allowed, baseline then pressure: at most 32 model calls and 64 tokenizer calls total, no retries. These caps are additional to the main study's caps. The runner refuses to start while the main study controller holds its lock, creates its entire output directory exclusively, and cannot rerun in place. Any unfinished execution needs receipt review, not deletion and replay.

Success requires baseline semantic success without recycling, plus treatment semantic success with actual recycling, confirmed archive recovery, and every dispatched projected token bound no greater than 16,384. Real provider tokenizer measurements drive the engine; no synthetic token counts are used. A model can fail this test. Failure is an observation, not a reason to replace the trial.

Invocation from the repository root uses `node .../provider-study-v1/pressure-v2/run.mjs CREDENTIAL_CONFIG`. It consumes the existing secret bridge without exporting key material. Candidate code is checked in the pinned validation container, not applied to the repository.

## Construction boundary

CAV2-D65 candidate mechanism experiment, exact owner-directed effects assessed under request `glm-live-hypotheses-59`, effect `pressure59`. Scope is this package and its local evidence. No serving-engine mutation, publication or activation. Evidence review owns classification. Adoption and larger-window qualification remain deferred.

## Open Questions

Will this inspected load cross the real 8K threshold before the model finishes? Can the existing recycler recover useful archived observations while preserving correct source and schema? Does success persist with delayed and revised facts, natural repository tasks and 10K/12K thresholds? Two ordered trials cannot distinguish temporal variation or establish reliability.
