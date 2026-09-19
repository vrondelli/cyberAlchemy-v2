# Native checkpoint guidance qualification69

Completed:9GLM calls,32,214known tokens,zero unknown usage. Three native summary
calls used15,693tokens. No patch or valid final context was produced. Guidance
was configured through the native system-prompt personaSuffix; the compactor
was unchanged. Local PLAN and source freeze preceded dispatch.

The checkpoint remained complete, but two subsequent task requests reserved9000
and8901tokens. Native overflow recovery did not make the retained tail fit.
Inspection found native pruning had replaced the middle of a search JSON payload
with plain text. Prior export logic could not handle this native behavior.

NATIVE-RESEARCH.json verifies eight native records and materializes a five-task
research plan. Its registration occurred after execution; it does not claim
retrospective preregistration. The local prospective plan remains the dispatch
record. See evidence/QUALIFICATION-EXPORT.json for every accounted call.

## Open questions

Owned by ../DEEPSEEK-CONTROL-FIT-DAG.md. Lower failed-run cost is not efficiency.
