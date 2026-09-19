# Validation Strategy

This strategy validates the Plan package and defines future admission checks. It executes no product, workload, infrastructure, canary, deployment, or rollback behavior.

## Current Plan validation

1. Revalidate the Dispatch Spec.
2. Revalidate Define exact source locks and Design manifest/denominator/two-pass fixed point.
3. Validate every JSON artifact and Distill schema.
4. Assert Plan designation is `non-executing`, SWU manifest is empty, and no execution/readiness artifacts exist.
5. Assert all blockers have owners or named next routes.
6. Run exact-path whitespace, symlink, EOF and `git diff --check` checks including untracked files.

## Future binding validators

| Validator contract | Positive witness | Hostile witness |
| --- | --- | --- |
| owner/target binding | all exact owners and identities present | missing or collapsed owner |
| profile/tool admission | exact admitted profile and tool/runtime digest | ambient latest or unadmitted profile |
| semantic non-collapse | distinct domain/integration/profile states | aliasing or missing state |
| telemetry/privacy | complete queue accounting and allowlist | M02, M03, M06, M08 |
| workload validity | active thresholds, safe target, unsaturated generator | M04, M05, M15-M17 |
| SLI/SLO/alert | exact query/window/missing-data policy | wrong missing/low-traffic state |
| infrastructure plan | clean/destructive/unknown exact facts | M12 unknown used as apply authority |
| canary | complete stable/candidate/controller evidence | M13 missing metrics/controller |
| deployment | independent authorized effect observation | simulation substituted for C12 |
| rollback | zero candidate refs across full inventory | M10 residual candidate reference |
| freshness | current expiry and invalidation keys | M09 stale reuse |

Future validators must emit typed receipts and preserve the earliest failing exit. A later cleanup command cannot mask an acceptance-critical failure.
