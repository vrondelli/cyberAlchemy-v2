# G03 r7 prospective four-type LongMemEval-S accuracy replication

Status: private protocol candidate, written before r7 selection, generation, reference access, or scoring. G03 r6 remains immutable. This does not authorize publication.

## Objective and population

Test whether the unchanged ARE 5,000-character ranked whole-turn projection improves strict answer accuracy over the unchanged sequential retained-note control with GLM-5.3-flash and an 8,000-token request window. This is an independent, **four-type** LongMemEval-S cohort, not a repeat of the five-type r6 population or a full LongMemEval result.

Use the pinned r6 LongMemEval-S source SHA-256 `d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442`. Exclude every question ID in the pilot, queue, first live cohort, r1–r6 selections, and r2/r3 assigned lists. The source-only post-r6 census has seven untouched single-session-user, 11 knowledge-update, 57 multi-session, and 61 temporal-reasoning questions, with zero untouched single-session-assistant or preference questions. Select exactly seven per remaining type by SHA-256 ordering of `are-product-replication-g03-r7\0` plus question ID, then round-robin the four types. Selection and generation may read only source fields, never reference answers. No replacement or top-up after freeze.

## Frozen analysis

- Unit: one matched question; denominator: all 28 selected questions. The primary effect is ARE strict-correct fraction minus control strict-correct fraction.
- A provider code-1301 refusal before a model call makes both arms incorrect and remains in the denominator. Other unaccounted provider, transport, or usage failures fail the campaign. No retries.
- Judge: pinned native LongMemEval rubric with blinded arm order. Normalize only surrounding whitespace, ASCII case, and one optional terminal period in a `Yes`/`No` response. Any other output is invalid and scored incorrect. Preserve raw-response digest, parser version, and per-arm validity receipt; do not rescore earlier rounds.
- Sensitivity: for every invalid judgment, assign treatment incorrect and control correct, regardless of its recorded primary outcome.
- Uncertainty: 20,000 paired bootstrap resamples within the four fixed types, deterministic 32-bit seed from the first eight hex digits of the frozen source-manifest SHA-256. Report primary and sensitivity 95% percentile intervals and exact McNemar discordance counts and p-value. Report tokens and summed arm durations descriptively on answered pairs only.
- Accuracy-only directional gate: all 28 questions terminally paired, no unknown usage or reference leakage, native judgments and receipts reconcile, primary difference positive with 95% lower bound above **+10 percentage points**, and control-favoring sensitivity lower bound above zero. A failure remains failure, without replacements or threshold changes.

The claim ceiling is this fixed 28-question four-type comparison only. Do not claim full S, six-type, cost/speed, cross-workflow, or general ARE superiority. Any exact public evidence card requires separate Vlad and Dave review of sanitized wording and receipt manifest, followed by a publication decision.

## Open Questions

- Will this independent four-type cohort clear the frozen accuracy gate and corroborate r6 on its shared types?
- What genuinely distinct source population can test the exhausted question types and broader product claim?
