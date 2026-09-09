# Shared correction: fresh twelve-condition matrix

Implemented one correction allowance shared between native missing-authority-field recovery and public semantic feedback. Format success still requires public validation; if source then fails semantics, the stage rejects it without a second correction. Valid original proposals may use the allowance for semantic repair. The opt-in `--shared-matrix` runner preserves all twelve original trials and runs the separate oracle after feedback.

The fresh matrix completed with **11/12 first-pass and final verified repairs**, **3/3 recycled-trial continuity**, and positive recorded headroom throughout. The 12/12 acceptance target failed.

| Initial window | First-pass / final | Minimum recorded headroom |
| --- | --- | --- |
| 8K | 4/4 | 263 |
| 10K | 3/4 | 302 |
| 12K | 4/4 | 640 |

The long8K trial recycled five times and passed continuity. Scoring recycled twice at8K and once at10K, both passing continuity. No other trial recycled; they are not counted as continuity successes. These observations do not establish absence of provider-internal compaction.

The sole failure, **archive-10000**, omitted `schema_version`; its strict parser returned `patch-set.schema-version-invalid`. Recovery currently accepts only an absent `authority_effect`, so it correctly returned `format.ineligible` without a call. No malformed field was synthesized and no source patch was applied. All eleven accepted proposals passed unchanged, with **84 public checks**, **88 final oracle checks**, and **11/11 container cleanups verified**. Initial execution used107 model/115 tokenizer attempts; correction used0/0. Initial execution took813009ms.

Thirty affected tests passed before execution, including both branches of shared-budget exhaustion and rejection of a malformed semantic correction without a format retry. Eight scoring tests passed after a reporting-only fix added the format-blocked case (31 distinct affected tests across those runs). Sources from three manifests were verified after live execution and before that fix; see [verification](source-verification.json).

The raw [feedback result](feedback/result.json) retains its legacy `unsubmitted: 0`, which counted only NO_SUBMISSION statuses. The [corrected summary](corrected-summary.json) counts the format-blocked proposal and reports **one unsubmitted trial**. This fix changed no acceptance, prompt, call, source proposal or oracle outcome. The original raw result remains intact; no live rerun occurred after the reporting fix.

[Plan](PLAN.md), [initial result](initial/result.json), [construction result](construction-result.json), [pre-run tests](tests.tap), and [reporting tests](reporting-tests.tap) carry the evidence. This is CAV2-D65 candidate benchmark integration under the existing user authorization; no default agent policy was activated. Prior matrix and retained-recovery results remain separate.

## Open Questions

Next product frontier: bounded explicit recovery for a sole missing schema_version, preserving exact source/scope and the same shared allowance, with tests and a retained-failure live check. This matrix exercised passing submissions and ineligible-output rejection but neither live format recovery nor semantic correction. The prior standalone format recovery and current composition tests do not prove the full integrated live correction path. Further frozen replication and unseen tasks remain necessary for reliability claims.
