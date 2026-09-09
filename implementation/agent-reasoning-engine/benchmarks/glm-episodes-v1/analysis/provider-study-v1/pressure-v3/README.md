# Token-density pressure probe

[H10](hypothesis.json) and its [canonical experiment](experiment.json) are frozen before live execution. Parent: [H9-v2](../pressure-v2/hypothesis.json), whose 20,700-character inventory was fully paged but never recycled: peak projected tokens 6,855. Recent-observations-v2 retains only one full observation, so history length was an ineffective intervention. The same compiled-agent baseline adapter is retained. This package uses ARE-RL-D01/D02/D03/D04/D07 from the [research ontology](../../../../../packages/evolution-runtime/ontology/research-learning-v1.json).

The baseline and treatment share the archive-start repair, source, contract, hidden checks, prompt, engine, 8K soft window and 16,384 hard bound. Treatment adds 4,000 deterministic CJK code points to README inspection. These identifiers contain no repair answer. This is intentionally artificial load to test the mechanism; it is not a natural-task generalization test.

The [manifest](prepared/manifest.json) pins all fixture bytes, runner, hypothesis, experiment and existing engine freeze. Exactly two trials are allowed, baseline then pressure: at most 32 model calls and 64 tokenizer calls total, no retries. These caps are additional to the main study's caps. The runner refuses to start while the main study controller holds its lock, creates its entire output directory exclusively, and cannot rerun in place. Any unfinished execution needs receipt review, not deletion and replay.

Success requires baseline semantic success without recycling, plus treatment semantic success with actual recycling, confirmed archive recovery, and every dispatched projected token bound no greater than 16,384. Real provider tokenizer measurements drive the engine; no synthetic token counts are used. A model can fail this test. Failure is an observation, not a reason to replace the trial.

Invocation from the repository root uses `node .../provider-study-v1/pressure-v3/run.mjs CREDENTIAL_CONFIG`. It consumes the existing secret bridge without exporting key material. Candidate code is checked in the pinned validation container, not applied to the repository.

## Construction boundary

CAV2-D65 candidate mechanism experiment, exact owner-directed effects assessed under request `glm-live-hypotheses-59`, effect `pressure59-v3`. Scope is this package and its local evidence. No serving-engine mutation, publication or activation. Evidence review owns classification. Adoption and larger-window qualification remain deferred.

## Open Questions

Will this inspected load cross the real 8K threshold before the model finishes? Can the existing recycler recover useful archived observations while preserving correct source and schema? Does success persist with delayed and revised facts, natural repository tasks and 10K/12K thresholds? Two ordered trials cannot distinguish temporal variation or establish reliability.
