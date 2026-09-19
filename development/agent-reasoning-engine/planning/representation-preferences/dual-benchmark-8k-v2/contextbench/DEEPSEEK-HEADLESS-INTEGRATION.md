# Matched DeepSeek headless episode

Status: full scripted headless integration passes; no new live provider calls or benchmark score.

## Implementation

[Plugin](deepseek-headless-plugin.mjs) registers the five shared repository tools plus submit_context_selection in the installed DSH headless composition. The [tested overlay](deepseek-headless-evidence/profile-r3.patch.yml) disables stock source/shell/web/subagent/goal/workflow tool owners and plan mode for matched task capability. Native agent loop, compaction-basic, tool-result pruning and reasoning replay remain installed. Auxiliary title generation and telemetry remain disabled as declared in the canary. This is an adapted task-capability profile, not stock DSH performance.

Each run requires disjoint canonical work/base/evidence roots, the exact base commit, clean tracked base and a fresh evidence directory. Existing guarded persistence bounds/fsyncs the run-local source snapshots, intents and results. Native source provenance validation diagnoses invented IDs and changed lines. Accepted final claims invoke DSH concludeTurn and reject subsequent tool actions.

Final selection is explicitly a candidate over executed observations. It is not declared delivered or provider-bound. Independent successful-request and terminal-response binding is the next construction step; the archive cannot be substituted for model-visible evidence.

## Evidence

Three local tests pass: malformed/invented/changed source selection with correction and episode closure; disjoint evidence roots; and rejection of modified base source before evidence creation.

The exact [R3 VPS result](deepseek-headless-evidence/RESULT-R3.json) binds source/dependency files, overlay, requests, scripted responses and nine execution records. The real DSH headless process consumed four scripted model turns: base read, source edit, base read, final selection. It advertised exactly the six intended tools, exited zero, changed value from 1 to 2, preserved the base and produced one terminal candidate. No network route to a real provider or credential was supplied. These are functional integration checks, not token/quality measurements.

An initial Docker launch used a configuration digest rather than the image manifest identity and failed before a container started; the verified image ID was then used. The first launched headless attempt exposed a missing runtime JSON-schema asset in the source closure. Its failed output is retained. Adding the exact schema enabled the next run. R3 adds clean-base admission and captures scripted responses as well as requests, and reruns the complete episode from a fresh worktree/state/evidence directory. Scripted mock servers were stopped afterward.

## Next tasks and open questions

1. Bind DSH's actual streaming request/response evidence to these canonical tool results and final selection, then project selected source into unchanged native ContextBench format.
2. Integrate production durable token accounting, bounded transport and parent process settlement; the canary proxy remains a fixture.
3. Qualify the matched profile with real tokenizer inputs, common output reservation and native compaction at 8K. Provider catalog size is not experimental context admission.
4. Register/review/freeze exact ARE-versus-DSH experiment and run all eight paired outcomes.

Coordinator owns construction. Independent review and fresh VPS capacity/provider checks remain live prerequisites. Guarded tool records are bounded; DSH session logs need a separate bound in the final supervisor. Does long-run compaction preserve final evidence references, and does this matched profile leave enough useful working context? These remain measured questions. The objective is a real comparison, regardless of which harness wins.
