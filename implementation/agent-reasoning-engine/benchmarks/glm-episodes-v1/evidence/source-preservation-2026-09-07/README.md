# Source-preservation pilot — 2026-09-07

The opt-in exact inspected mutation-source policy is implemented. This bounded
matched scorer trial produced no candidate patch, verified repair or continuity
pass. It does not establish a retention-policy winner.

| Policy | Model attempts | Tokenizer attempts | Outcome |
| --- | ---: | ---: | --- |
| clear-v1 | 4 | 7 | Fresh request exceeded soft admission limit |
| recent-observations-v2 | 3 | 3 | Non-owned archive digest rejected |

Both arms used bounded-reads-v1, budget-aware-v1 and inspected-mutation-v1 on
the same frozen sources. Total usage was 20,751 input and 188 output tokens;
no endpoint failures were recorded. The run stopped after the protected second
arm failure, without retries. See [checked report](checked-report.json),
[manifest](manifest.json), [result](result.json), and each arm's visible trace.

Clearing read all four required files, but the cases observation was not delivered.
Its last measured input was 5,791 tokens; adding 2,048 output reserve and 256
margin yielded 8,095 against the 8,000 soft limit. ARE blocked before another
model dispatch. V2 attempted raw archive recovery with a digest outside its
owned archive; ownership checks correctly rejected it. Neither failure justifies
weakening admission or evidence ownership. Provider internal compaction remains
unobservable; these records only establish ARE's measured admission behavior.

## Followup implementation and validation

After preserving the trial, the source policy was narrowed to offer only
read-inspection-evidence for archive recovery, using validated read-call IDs.
Raw read-context-evidence is not offered under this policy and is rejected if
requested. Redundant source-policy prompt text and a legacy raw-recovery progress
flag were removed. Existing policies retain their prior tool exposure.

The pretrial suite passed 315 tests. The final suite passed 316 tests, including
source fidelity, complete-file byte limits, resume, rejected-render accounting,
and denial of unoffered digest recovery without tool execution. See
[final validation](final-validation.json) and [posttrial tests](posttrial-tests.tap).
These followup changes were not run live: corrected request fit and repair success
remain unverified. The original manifest is preserved, not repinned to later code.

The checked report validates recorded hashes, policy consistency and accounting;
it does not rerun the oracle or authenticate records cryptographically. Exported
traces exclude raw message history and provider reasoning. Complete private run
records remain under /tmp/are-glm-source-preservation-2026-09-07 locally; the
export alone is not the complete input required by reportRun.

## Open Questions

- Does a fresh matched trial of the corrected runtime fit the strict token budget?
- Does exact source preservation prevent interface-changing patches and allow a verified repair?
- How do outcomes vary across tasks, repeats and context-window sizes?

Next bounded step: freeze the corrected runtime and run a new matched scorer
pair with unchanged caps, then compare verified repairs and delivery evidence.
Defaults remain unchanged; no general engine improvement is established.
