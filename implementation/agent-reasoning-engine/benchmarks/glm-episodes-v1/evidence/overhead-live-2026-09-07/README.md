# Shorter-prompt live trial — 2026-09-07

Both retention-task arms exhausted their model-call budgets without producing a
patch or performing archive recovery. Neither was blocked by context admission.
The conditional scorer regression was skipped because neither arm passed repair
and continuity. Defaults and budgets remain unchanged.

| Policy | Model calls | Tokenizer calls | Repair | Continuity | Repeated file reads |
| --- | ---: | ---: | --- | --- | ---: |
| recent-observations-v2 | 12 | 20 | No candidate | Fail | 8 |
| clear-v1 | 12 | 17 | No candidate | Fail | 8 |

Both ended with glm.model-request-limit. All four required files were read and
delivered, but neither arm requested archive evidence. V2 read the contract five
times and cases four times; clearing read each five times. Each arm left its final
read undelivered. The model continued reading through the three-response synthesis
reserve. Advisory guidance did not prevent either loop in this trial.

See [checked report](checked-report.json), [analysis](analysis.json),
[manifest](manifest.json), [result](result.json), and each arm's visible trace.
Usage: 24 model calls, 37 tokenizer calls, 114,607 input and 1,103 output tokens.
No endpoint failures or automatic retries occurred. The pair remained within
24/48 calls and 1,200 seconds; per-arm caps remained 12/24 calls and 580 seconds.
All dispatched requests fit the 8,000 soft limit including the 2,048 output
reserve and 256 margin; the hard limit remained 16,384. Recycling still occurred.
This observes request admission, not provider-internal compaction.

## Validation and interpretation

The [prompt-overhead construction](../../../../packages/coding-agent-runtime/glm-flash-v1/evidence/PROMPT-OVERHEAD-PLAN.md)
removed 743 instruction bytes. Sources matched its 322-test validation before and
after this run. Tests were not rerun; the prior receipt and log are included.
Its earlier live_validated:false flag describes the pretrial checkpoint. This
trial owns the subsequent live evidence. Source/fixture manifests were frozen.
The checked report passed recorded integrity, policy and accounting checks.

Unlike the previous trial, this pair reached its call caps instead of blocking
on fresh-context size. Different model trajectories prevent assigning an exact
provider token saving or causal improvement to the shortened instructions.
No verified repair improvement is established.

Exports omit raw message history and provider reasoning. Complete private inputs
remain at /tmp/are-glm-overhead-live-2026-09-07; the export is not a complete
reportRun input. Hashes are not authentication and the report does not rerun an
oracle. No candidate existed to apply. Authority effect none; publication,
deployment and default activation remain deferred.

## Open Questions and next construction

- Can an opt-in execution rule prevent repeated whole-file reads after confirmed delivery?
- Can a typed recovery response preserve useful evidence without creating another loop?
- Can reserving an actual tool-free synthesis response preserve repair quality?

Next bounded candidate: enforce repeat-read handling and synthesis tool availability
in code, with explicit deferred/denied results and unchanged call accounting.
Test scope, delivery-unknown cases, resume, final-response behavior and inadequate
evidence before another live pair. Do not weaken oracle or continuity checks.
