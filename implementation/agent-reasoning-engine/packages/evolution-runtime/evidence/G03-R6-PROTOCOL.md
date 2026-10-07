# G03 r6 prospective five-type accuracy confirmation

Status: protocol candidate, written before r6 selection, generation, reference access, or scoring. G03 r5 remains immutable. This study is private; it does not approve a product-page claim.

## Objective and population

Test whether ARE's 5,000-character ranked whole-turn memory projection improves strict answer accuracy over the unchanged sequential retained-note control, using GLM-5.3-flash, an 8,000-token request window, and the same LongMemEval-S source revision as r5. The target is only the five source question types still independently sampleable, not the full six-type LongMemEval-S or general ARE workflows.

The source-only census after excluding all prior pilot, queue, r1–r5, and assigned r2/r3 question IDs found 8 untouched single-session-assistant, 15 single-session-user, 19 knowledge-update, 65 multi-session, and 69 temporal-reasoning questions. Select exactly eight per type by the fixed SHA-256 ordering of `are-product-replication-g03-r6\0` plus question ID, then round-robin the five types. No reference fields may enter selection or generation. No task replacement or top-up after freeze. Report the small and depleted source population.

## Frozen primary analysis

- Unit: one matched question; denominator: all 40 selected questions.
- Primary effect: ARE strict-correct fraction minus control strict-correct fraction, in percentage points. A provider code-1301 refusal before a model call makes both arms incorrect and stays in the denominator. Other unaccounted provider, transport, or usage failures fail the campaign rather than disappearing.
- Judge: the pinned native LongMemEval rubric with blinded arm order. Normalize only surrounding whitespace, ASCII case, and a single optional terminal period in a `Yes` or `No` response. Any other output is invalid and scored incorrect, without retry. Preserve the raw-response digest, parsing version, and per-arm validity receipt. The old r4/r5 judgments are not rescored.
- Sensitivity: for every invalid judgment, assign treatment incorrect and control correct, regardless of its recorded primary outcome. This is the control-favoring bound.
- Uncertainty: 20,000 paired bootstrap resamples within the five fixed question-type strata, deterministic 32-bit seed from the first eight hex digits of the frozen source-manifest SHA-256. Report the 2.5th and 97.5th percentiles for primary and sensitivity differences, plus exact McNemar discordance counts and p-value.
- Accuracy-only directional gate: all 40 have terminal paired accounting; no unknown usage or reference leakage; native judgments and receipts reconcile; primary point difference is positive with 95% lower bound above **+10 percentage points**; control-favoring sensitivity 95% lower bound is above zero. The gate is not amended after scores open. Failure is reported as failure, not repaired with replacements.
- Tokens and summed arm durations are descriptive on answered pairs only; no cost, speed, full-benchmark, or all-workflow superiority headline follows from this study.

Provider refusals and invalid judge outputs are explicitly included because accuracy remains evaluable under the stated conservative rules. This is a separately named protocol, not a retrospective relaxation of r5's stricter product-headline gate. Any exact public evidence card still requires Vlad and Dave to review the sanitized wording and receipt manifest; publication remains a separate decision.

## Open Questions

- Does this new cohort clear the frozen accuracy-only gate? The answer is unknown until sealed predictions and native scores are independently audited.
- What additional independent source population will be needed for a six-type or cross-workflow claim after this depleted five-type cohort?
