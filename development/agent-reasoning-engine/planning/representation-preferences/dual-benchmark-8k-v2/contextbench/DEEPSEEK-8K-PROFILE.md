# Native DeepSeek 8K profile qualification

Candidate profile: deepseek-8k-profile.patch.yml. The current successor catalog declares
32,768 tokens, a 4,800-token native compaction threshold (ratio 0.146484375),
and a maximum output of 2,048. The external measured limit remains 8,000. It explicitly sends Z.ai
thinking enabled, clear_thinking false and low reasoning effort, matching the
current ARE provider profile. Native compaction remains enabled with that
pressure threshold, 800 retained tokens, 2,048 maximum summary output and one
compaction retry and one native overflow recovery. The external measured 8K gate remains authoritative.

The earlier 8,000-catalog profile in retained qualification evidence completed an offline eleven-call fixture: nine task
calls and two native compaction summary calls. Every captured request had the
expected reasoning fields. The native exporter retained eight delivered source
reads and exported the final selected source after compaction. See
[retained evidence](deepseek-compaction-evidence/profile-60-r2/NATIVE-EXPORT.json).
Synthetic usage is not real tokenizer measurement, quality or savings evidence.

The first fixture incorrectly classified compaction by absence of tool schemas;
this DSH version retains tools while asking for a summary. That attempt is
retained under profile-60 and does not qualify summary behavior. The corrected
fixture recognizes the explicit native summary instruction and returns text.
The exporter/transport also accept genuinely tool-less compaction requests.

DSH's native adapter can lower output capacity as its estimated context fills.
The common policy is a maximum of 2,048, not an assertion that every request has
an identical cap. Actual caps and provider measurements must be reported. A
small-context pilot can still fail if native compaction cannot keep requests
below the external limit; that failure must stay in the comparison.

## Open questions

Real long-task request fit is not established by scripted usage. The exact paired
pilot must bind this profile, ARE settings, four fixed task identities, source
commits, budgets and scoring before dispatch. The current template retains the
fixture base commit and endpoint; production composition must render run-specific
paths and commit without editing the evidence from completed qualifications.

## Real-pilot corrections

Pilot 61 exposed developer-role rejection under explicit Z.ai thinking. The
profile now sets supportsDeveloperRole false. Pilot 62 returned more completion
tokens than max_completion_tokens requested; the profile now uses maxTokensField
max_tokens, matching ARE. The larger adapter catalog avoids an approximate
internal output clamp while the compaction trigger remains 4,800 estimated tokens.
These are declared adaptations, not evidence of native unmodified 8K behavior.
The exact successor profile is frozen in deepseek-pilot-r3; real-task fit remains
an empirical outcome. Both failed pilots and all their costs remain retained.

## Provider plugin and benchmark instrumentation

The VPS already uses the official @deepseek-ai/dsh-llm-pi-ai0.1.5-rc.2 plugin.
The [official provider guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md)
lists zai for GLM. There is no missing GLM provider adapter to implement. Our
private proxy supplies measured8K admission and durable cost evidence; native
matched tools and source export supply ContextBench instrumentation. Compatibility
fixes in that layer must not be reported as missing DSH provider support.

Qualification71 uses the separately frozen deepseek-glm-71/profile-template.patch.yml:
1800maximum output for task and summary calls, source-dictionary-v1 tool rendering,
and a native personaSuffix checkpoint target. The template above remains2048.
The external8000window,512margin and96K total cap remain fixed. Native pruning
remains enabled; the exporter verifies its exact pinned default transformation
and credits only complete visible observations. This is an adapted benchmark
configuration, not stock DSH. A paired run must supply common guidance,
representation and output cap to ARE too.
