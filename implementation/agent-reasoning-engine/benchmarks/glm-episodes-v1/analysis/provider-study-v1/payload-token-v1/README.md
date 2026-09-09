# H23 matched actual-tokenizer study

This prospective test follows the offline preservation result in ../payload-view-v1/README.md. It compares original/projected versions of the first rejected full H22 admission request at 8K, 10K and 12K. No model completion is requested. Each window also has a synthetic payload-heavy negative control: 128 deterministic digest lines appended to the first read's source body equally in both arms, with file and receipt hashes recomputed. Original task facts and padding remain. These synthetic bodies are tokenizer-only controls, not real repository files or live task outcomes.

The frozen prepared.json contains 12 exact bodies, sources, historical counts, admission reserves and prospective criteria. All six successful tool envelopes must project for each pair. The production JS stable serializer must match every prepared request byte-for-byte before dispatch. At most 12 actual tokenizer attempts, zero models, no retry or replacement; any failure stops the cohort. Create-only output prevents accidental rerun. Credentials are consumed through the existing registry and never copied into artifacts.

Supporting means all original observed requests reject, all projected observed requests fit, and both arms of every larger-payload control reject. Changed historical original counts or missing receipts are inconclusive. Other known threshold failures are counterevidence to this narrow token-admission prediction. Neither classification establishes model-quality benefit.

## Construction and operational lanes

D65 candidate research under request glm-payload-token-85 and existing user goal authorization. Owner: ARE implementer/evaluator. Exact runnable frontier: 12 frozen tokenizer measurements, independent receipt audit, canonical research observation and DAG update. Local construction assessment precedes a separate exact dispatch assessment. No default profiles, core sources or serving changes. Adoption/publication remain user-owned deferred effects.

## Open Questions

Will projected requests fit at each observed boundary? Does live GLM interpretation remain stable with the new envelope? What evidence recovery is needed when source payloads exceed capacity? This pilot does not qualify broader windows, repository QA or full GLM readiness.
