# Bounded transport model-visibility canary

Product test: two Luna turns under the user's renewed do-it instruction following
an explicit usage-allowance boundary. Model gpt-5.6-luna, low effort, standard
service, existing ChatGPT login. Maximum two reserved turn/start calls, no retries.
Definitions: BaselineAbsence is absent provenance before injection. ModelVisibility
is exact echo of a high-entropy provenance digest supplied only in ARE context.
This is not general reliability, causal learning benefit, or native compaction.
Scaffold: real baseline Episode -> explicit fixture Preference -> learned Guidance
-> durable Injection -> host acceptance -> model provenance observation.
Product hypothesis: a model can consume ARE guidance through the tested transport.
Business benefit unmeasured. Contract: CONTRACT.json. Implementation candidate:
unchanged transport-v1 and dependencies, plus this bounded runner and grader.

Turn 1: ask for a brief cache explanation and scoped source_digest, absent if none.
Record its actual prompt/output as an observed ARE episode. Apply a local mode
control and explicit synthetic examples preference, tied to that baseline episode.
Generate recovery via a synthetic compaction event, inject through durable
transport. Turn 2 repeats the same user prompt. Expected digest is never in it.
No model tools, no normal hook installation, no parent task activation.

Runnable frontier: local grader checks, then this exact two-turn canary.
Operational support owner: host integrator; affected stages: isolated canary now,
activation deferred. Dispose owned auth reference and stop host on completion.
No causal construction blocker. Product approval and activation remain separate.
