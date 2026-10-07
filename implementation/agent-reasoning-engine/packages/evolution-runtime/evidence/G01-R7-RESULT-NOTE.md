# G01 r7 — terminal 24-attempt GLM 8K result

Status: **terminal, incomplete, independently receipt-audited and privately archived** on 2026-09-29. The [prospectively frozen protocol](G01-R7-PROTOCOL-CANDIDATE.md) was not amended. No r7 quality-and-efficiency superiority claim is admitted.

## Fixed cohort and outcome

The frozen definition SHA-256 is `d0d02594dfac39104d4f3afbc0242414b5e84ea30b82ab766b438548a0594a59`; campaign freeze SHA-256 is `258164a3e34ce406f6074c6ec1fa7aff5130976da66e66b05d4c0ae600f6576a`. The original two-worker `are-g01-r7-campaign.service` invocation `5dd809c6672149dd9b9e7b8269319637` terminated with systemd `Result=success` after recording all **24/24 attempts**, but only **13/24** pairs received native scores. The campaign result SHA-256 is `a04bddff482a17f96cb851c429bb3024e7bc948bb351bf27d094d1de6a26358b`. Its frozen `all_pairs_scored` and `campaign_pass` gates are false.

The 13 scored pairs are all seven PonyC C tasks and six of seven cli Go tasks. The remaining cli Go pair, all seven JavaScript pairs, and all three Rust pairs are unscored. These are not missing observations to drop or replace: they remain in the denominator. Across their 22 arm attempts, one control completed, **20 arm runs failed on tokenizer HTTP 429**, and one control failed with `glm.billing-unavailable`; that model receipt carries provider code `1113`, which the pinned local transport classifies as billing unavailable. The tokenizer failure wrapper exposes `index-tokenizer-failed`, and its receipts show 429, but the available tokenizer receipts do not independently establish that every 429 had provider code `1113`. The abrupt failure onset after 13 scored pairs is consistent with provider availability or quota exhaustion; it is not evidence of an ARE localization-quality regression. Do not silently rerun these exact r7 attempts or reinterpret 13/24 as a complete cohort.

The frozen paired analyzer produced `PRODUCT-ANALYSIS.json` SHA-256 `2f1047e97f50677220ede8ee338be530b5c0efc1ec6ab2a5d56d147381658f88`. These **valid-pair-only descriptive** estimates have no r7 directional headline authority:

| Measure | ARE vs control point | Repository-stratified paired 95% interval |
| --- | ---: | ---: |
| Native Span-F1 difference | +0.09337 | [+0.00049, +0.19435] |
| Native File-F1 difference | +0.12564 | [−0.05641, +0.32821] |
| Known model-token ratio | 0.61469 | [0.47755, 0.83111] |
| Summed arm-time ratio | 0.71294 | [0.57259, 0.91015] |

The File-F1 interval crosses zero even on valid pairs, and the prespecified 24/24 completeness rule fails. No JavaScript or Rust pair is valid. The positive point estimates cannot support a four-language, full-ContextBench, or ARE-product superiority statement.

## Finalizer repair and preservation

The original guarded `are-g01-r7-finalize.service` invocation `1ecaba37b2f347e398503a300ccad7a2` failed **before analysis** because it expected `systemctl show ... InvocationID` to remain populated after the runner became inactive. At terminal state systemd reported an empty `InvocationID` despite `Result=success`; the original invocation's journal contains the exact 24-attempt completion event. The failed finalizer and its script remain preserved. The separately versioned [terminal-only recovery](../research/g01-fast-live-v1/finalize-campaign-r7-recovery-r1.sh), SHA-256 `79f0a7994c70cc331f9721f08492386f1aac7494ae70313c015f4d89466c3b9d`, verified that exact journal event, the frozen hashes, all 24 pair receipts, and the absence of prior analysis/audit outputs before running the pinned analyzer and auditor. It did not run a model, change any pair, or restart the campaign.

The independent receipt and native-metric auditor passed **24/24 attempt bindings**, including 13 scored and 11 unscored rows, and wrote `HASH-AUDIT.json` SHA-256 `da81ed60ee44ba3aed4c8e2763aae1165fd9200d101cedeabd4a85685fee948c`. This establishes receipt, seal, policy, and scored-metric integrity, **not** the superiority gate. The complete raw campaign was preserved at `/opt/are/evolution-runtime/archives/g01-product-replication-r7-59d9bf27620441fa2be59da37273a9969de7a7530f93a36fd6cbb8ba66783b14.tar.zst`, SHA-256 `59d9bf27620441fa2be59da37273a9969de7a7530f93a36fd6cbb8ba66783b14` (591,181,469 bytes). A fresh SHA-256 check and full 200,144-member compressed-tar listing passed. The archive manifest is the adjacent `.json`; the live source root remains intact, with zero deletions. This is private evidence, not a public package.

## Next boundary

A no-generation same-model/container-account tokenizer check using the pinned [r4 transport preflight](../research/g01-fast-live-v1/preflight-transport-r4.mjs) wrote `/opt/are/evolution-runtime/g01-provider-health-after-r7-r1/TOKENIZER-PREFLIGHT.json`, SHA-256 `dfa44866c1a3419d96f38cd5460a76cceea6f84fe3f253e65c2c5b280b5adb50`: **both** concurrent probes returned HTTP 429 and no token count. The check made no generation call or new benchmark selection. Provider availability therefore remains unqualified; do not dispatch another GLM cohort on this account until a separately receipted tokenizer **and** tiny generation preflight succeeds.

The pinned eight-field [cross-branch source-only auditor](../research/g01-fast-live-v1/audit-cross-branch-supply-r1.py) refreshed exposure after r7. Its private receipt `/opt/are/evolution-runtime/g01-cross-branch-supply-after-r7-r1/SOURCE-SUPPLY-AUDIT.json`, SHA-256 `8e25f74d198ab76489676c3bbdd5f00d8e1efd5ccb68738ab4b48ef72ef54f09`, lists 24 r7 task manifests and yields **859 remaining source-only rows across 55 repositories**, after 276 manifested G01/G02 IDs and one missing-source-field row. This is not positional-gold-clean, cache-ready, or representative supply. VPS free space after the r7 archive was about 2.1 GiB; a new campaign needs a non-destructive capacity/retention plan.

A read-only reconciliation of the eight previously sealed r7 positional-gold screen receipts against the **current** 276-ID cross-branch manifest union (`6e6610069179c525f30a6a66cfd5e6a3324e32c929e07ac30b0dc0a5c9622d2b`) found **44 screened-clean IDs, 24 now exposed, and 20 still unexposed**. All 20 are JavaScript: Svelte 11, Prettier 4, Day.js 3, and Serverless 2. Their sorted ID-set SHA-256 is `1c3ca9bd3224ef03f6204a99af67f03d556498bb077f76544e8015242bfc8b1f`. The earlier screen contains no still-unexposed clean C, Go, or Rust task. This is a bound on that *screened set only*, not evidence that the remaining 859 rows lack clean labels; expanding language/repository screening is necessary before a comparable four-language successor can be frozen. The eight receipt paths are under `/opt/are/evolution-runtime/g01-r7-cgojs-gold-lineage-r1/` (seven repository files) and `/opt/are/evolution-runtime/g01-r7-rust-gold-lineage-r3/GOLD-LINEAGE-ELIGIBILITY.json`.

Do not spend a fresh G01 cohort until provider availability and the next clean-label source-only supply and storage preflight pass. A successor must have a new name and freeze, exclude all r7 task IDs, preserve its own all-attempt accounting, and avoid changing the r7 result. Even a numerically favorable successor would require its full validity, label, uncertainty, and independent-audit gates before Vlad/Dave exact-card review and any product-page publication.

## Open Questions

- What account balance, allowance, rate-limit, or provider-side change will restore successful tokenizer and generation calls? The post-r7 no-generation probe still returned two 429s; its status alone does not prove the provider's billing state.
- Beyond the 20 known-clean, still-unexposed JavaScript IDs from the prior screen, how many of the remaining 859 source-only rows are positional-gold-clean and cache-ready?
- Can a successor clear both quality intervals and efficiency intervals without relying on a C/Go-only valid subset?
