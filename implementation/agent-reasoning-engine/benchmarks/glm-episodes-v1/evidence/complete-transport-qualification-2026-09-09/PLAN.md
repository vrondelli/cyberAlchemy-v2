# Complete transport qualification

CAV2-D65 bounded frontier: finish the small-window chapter. The prior joint-diagnostics campaign reached 35/36; the remaining failure was a 60-second correction timeout. Preserve every previous outcome.

DAG: bounded correction transport recovery and physical accounting -> fault-injection and accounting tests -> source freeze -> three complete twelve-condition live rounds -> independent audit -> chapter decision.

Keep one logical correction per trial, now with at most one retry of the exact admitted request after a recognized transient transport failure. The existing transport owns retry eligibility, cancellation and durable accounting. No retry of malformed or incorrect model responses, schema failures, validation failures, authentication failures or tokenizer failures. Default correction recovery remains disabled. Preserve joint schema/public diagnostics and all initial-request policies.

Qualification uses the unchanged four tasks at 8K/10K/12K, three rounds. Initial per-round caps are 184 physical model and 320 tokenizer attempts. Correction caps are 24 physical model and 24 tokenizer attempts per round, with at most twelve logical corrections. Total caps: 624 model, 1032 tokenizer, 72 public workers. Model deadlines remain 60 seconds, tokenizer 30 seconds. No source changes during the frozen campaign and no failed-trial replacement.

Acceptance: 36/36 final public and independent-oracle passes; delivery and positive headroom for all trials; continuity for every recycled trial; long-8K recycling in every round; no validation execution errors and verified worker cleanup. Report initial quality, correction calls and physical retries separately.

The user authorized completion of this bounded chapter. The agent owns implementation, evidence and its exact workers. Larger contexts, activation and unrelated workloads remain separately scoped. Source drift, invalid accounting and unconfirmed cleanup block acceptance.

## Open Questions

Can bounded correction transport recovery close the last observed failure in a complete frozen campaign? Larger-window behavior, held-out generalization, provider-internal compaction and billing of interrupted requests remain outside this chapter.
