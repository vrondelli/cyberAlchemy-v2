# Model deadline qualification: not accepted

All36 trials completed under one source freeze.29/36 initial and32/36 final passes; round finals11/12,10/12,11/12. Four dispatched model requests exceeded60000ms: Round1 long10K; Round2 long10K and pairs10K; Round3 long8K. All three schema corrections passed. No retries or failure replacement.

All eight recycled trials passed continuity; Round3 long8K timed out before recycling. All32 public validation workers cleaned up, without execution errors.291 model and310 tokenizer attempts in2341743ms. Longer deadlines alone did not meet acceptance. Successful calls above30seconds: 1. This experiment does not establish the root cause inside the provider or prove a timeout was billable.

Evidence: [plan](PLAN.md), [aggregate](run/result.json), [independent audit](independent-audit.json), [source freeze](run/manifest.json). Final offline checks:57 transport/config,34 runner, and the reporter/completion integration suite passed; one optional historical fixture test skipped. An initial handoff test had a test-helper typo, corrected before the source freeze; all logs are retained.

CAV2-D65 result: explicit bounded deadline configuration implemented and tested; candidate qualification failed. Next: separately admitted bounded transient recovery, preserving the default no-retry transport contract and accounting for every physical attempt.

## Open Questions

Can an explicit bounded recovery policy meet36/36? Unknown provider/network cause remains open. Larger contexts, held-out quality and provider-internal compaction remain outside this chapter.
