# G03 r4 approved protocol — fixed GLM cohort with explicit provider refusals

Status: **owner-approved and executed 2026-09-28**. The owner answered “yes” to DG-G03-R4. Generation, native scoring, analysis, and private archival completed; the [terminal result freeze](G03-R4-RESULT-FREEZE.md) records outcomes. This protocol grants no product-page claim; Vlad/Dave review remains separate. It responds to the terminal [r3 failure](G03-PRODUCT-REPLICATION-R3-FREEZE.md) and the hash-checked [source-only supply audit](G03-R4-SOURCE-SUPPLY-AUDIT.json).

## Objective and changed population

Keep the G03 question-answering comparison on the existing GLM VPS and pinned LongMemEval-S source, but create a new, independently named 80-question campaign. Exclude every question assigned in r1, r2, or r3, plus the prior 16, the prior four, and the eight older queue exposures. The r2 and r3 questions that were never dispatched remain eligible under the previously approved exposure rule. Freeze IDs, source-only manifest, code hashes, budget, rubric, and analysis before generation; do not top up or substitute after a refusal.

The old six-type quotas (14, 14, 13, 13, 13, 13) were impossible: only ten unexposed `single-session-preference` questions remained. Approved r4 quotas were 14 for each other type and ten for `single-session-preference` (80 total). This used all ten preference questions and changed the type mixture; report that limitation prominently. The source-only draw included two abstention questions without consulting reference answers. A 60-question balanced alternative (ten per type) was possible but was not the approved r4 population.

## Provider-refusal rule

- A tokenizer or generation response with provider code `1301` ends that question immediately. Do not resend, rephrase, redact, or continue the other arm for the same question. Preserve the request hash and status/code metadata, not credential or response text.
- Record both arms as incorrect for that question in the predeclared primary strict-correct-rate denominator of 80. If an answer was produced before the refusal, retain its private receipt but do not use it for that question's primary score. This is a conservative safety/availability outcome, not a native answer judgment.
- Continue to the next frozen question. Other errors, missing receipts, unknown model usage, source drift, or a failure to identify the provider code remain fail-fast campaign errors, not automatic `1301` classifications.
- Native reference projection and blinded GLM judgment begin only after all 80 questions have a terminal `answered-pair` or `provider-refused` classification. Score answered pairs against the pinned rubric; refused pairs are fixed incorrect without reference access. Keep the existing invalid-judge-as-incorrect rule and control-favoring sensitivity analysis.
- Report the provider-refusal count and type distribution beside accuracy. Model token and elapsed-time ratios use only fully answered, fully reconciled pairs, with that denominator stated. If any provider refusal or unknown usage occurs, do not make an all-80 efficiency-superiority headline. A quality headline still requires the prespecified paired interval and sensitivity criteria across all 80 rows plus Vlad/Dave review.

Use the existing 8K context cap, 5K-character treatment projection, two workers, at most 96 model calls per question, zero retries, and the existing gateway whose secret stays inside its container. No r3 outputs are reused as r4 predictions. Preserve all attempt receipts and a private content-addressed archive; no raw reference text, credentials, or provider payloads go to the product page.

## Decision gate

**DG-G03-R4: approved.** The exact r4 effect scope is bound to selection SHA-256 `16632e2084af68612281e6d6a38d521ae25ff096133f1f4d385ec41a3ef71792`, source manifest SHA-256 `f5ca500e10d593203d912c40ed7a97a2242482c212b40ba49fd3f0cab19cb6f2`, runner SHA-256 `a9a1dd322345ecca4b0645f54f2cb1595ae8aaf39502593fabf2cf3707084014`, and output `/opt/are-benchmark-runs/longmemeval-product80-20260928-r4`. Source-only audit passed before dispatch: 80 questions, two abstentions, 20 never-dispatched r2 and 20 never-dispatched r3 questions selected, no prior dispatched IDs reused. Generation ran under `are-g03-r4-20260928.service` on the GLM VPS; terminal result and score are frozen in [G03-R4-RESULT-FREEZE.md](G03-R4-RESULT-FREEZE.md).

The pre-generation evaluation code freeze is: selector `429588cc83db9913776b885bdbdc132f099883616fda44cfaee81c06548a05bd`, reference projector `0f60feaef46e217dc460ec1cc14645c3ae390ab40b6ab9774d0e2f6bdee934cd`, scorer `74bc2193b77583a79f14d37787e1ea9271da80118ebcc7e13584aa19adca89b2`, analyzer `adafb4c6ca1307fd290608e3eae2a936689b74c2557346af977d4baaed374112`, gateway `87fc46f5222f9002167d305cd08f90804ca1f6ad442332c8301e3359a1b3faa5`, and native rubric `64e3ee142988fecff66a37057e2259ad501978590ce4272ee88a5f39187f1f12` (all SHA-256). The fail-closed follow-on is `are-g03-r4-finalize-20260928.service`; its script SHA-256 is `548d5ff082d73c000582ec10e00176a7d39b7d435b6a0da0ea3a7a0306c5b156`.

## Open Questions

- How should Vlad and Dave word any fixed-cohort evidence card given four invalid judge outputs and no provider refusals? No product-page claim has been admitted.
- What raw-retention period and private restore location should Vlad and Dave approve for the r1–r4 attempt archives?
