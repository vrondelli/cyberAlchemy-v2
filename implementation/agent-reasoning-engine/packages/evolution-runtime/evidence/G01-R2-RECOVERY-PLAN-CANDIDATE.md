# G01 r2 recovery — candidate population and preflight plan

Status: **owner-approved population; r2 frozen and running, 2026-09-28**. The user explicitly requested implementation and a G01 r2 run with jq. A private jq cache, source/native-gold preflight, and two-worker live tokenizer probe passed; the 24-pair campaign is now running on the VPS. The exact freeze, PID and log are in the [live handoff](BENCHMARK-CAMPAIGNS-LIVE-2026-09-28.md). Preserve the [r1 result](g01-product-replication-r1/RESULT-NOTE.md) and all its exposed-task and failed-attempt receipts. The [product-page replication plan](PRODUCT-PAGE-REPLICATION-PLAN.md) owns the three-branch claim boundary.

## Objective and evidence

Obtain a complete, separately named prospective G01 8K source-localization comparison against the same native intent-anchor control, without treating r1's 15 valid pairs as a completed 24-pair result. Keep the r1 candidate, control, metric definitions, GLM model, 8K request cap, and 24-task language quotas (3 C, 7 Go, 7 JavaScript, 7 Rust). The changed C repository and any harness revision must be prominent in the report; r1 predictions cannot be reused.

The r1 source-only supply audit excluded 75 exposed IDs and found zero untouched `facebook/zstd` tasks. A fresh 2026-09-28 read-only check against the same pinned parquet and exposure roots reproduced 75 exposed IDs. Its source-only process found 9 `jqlang/jq`, 43 `ponylang/ponyc`, 48 `cli/cli`, 71 `sveltejs/svelte`, and 18 `clap-rs/clap` eligible IDs. A separate evaluator-only process applied the pinned native `GoldLoader.files()` eligibility bit: 9/9 jq, 43/43 ponyc, 48/48 cli, 70/71 svelte, and 18/18 clap have at least one native gold file. The one missing-gold Svelte ID is an eligibility exclusion only; its gold paths/labels must not reach source-only selection. Neither process made model calls or froze a cohort. No jq or ponyc repository cache was found under the bounded VPS ARE data roots, so base-commit/index readiness is not yet established.

A further read-only preflight on 2026-09-28 verified the pinned parquet and selector SHA-256 values above against the VPS files. Taking the selector's first 3 jq, 7 cli, 7 svelte, and 7 clap rows after the 75-ID exposure exclusion produced 24 distinct prospective IDs. A separate evaluator process found native gold files for all 24; the first seven Svelte rows did not include the known missing-gold candidate. GitHub's commit endpoint returned HTTP 200 for each prospective jq base commit: `f88c4e5888d6d125695444d044df4bb55ad75888`, `0b5ae30f19d71ca6cc7b5867f3c988c570ecd579`, and `0b558f6ed498717546406b5367483b976578a9b2`. This establishes only remote commit visibility, not successful VPS fetch, local source-index admission, transport health, or cohort freeze. No model calls or cache writes occurred in this check.

A bounded read-only VPS Git-cache audit then found all 21 prospective cli, svelte, and clap base commits present as commit objects in their existing r1 caches (`git cat-file -e`). At that point no jq cache existed among the bounded G01 repository-cache roots. The first repository-cache action therefore concerned only jq; its later outcome is recorded below.

## 2026-09-28 implementation preflight

- Cloned `https://github.com/jqlang/jq.git` into the new private cache `/opt/are/evolution-runtime/g01-product-replication-jq-cache-r2/repositories/contextbench-full`; all three proposed jq base commits are present as commit objects. The 21 non-jq commits remain in the existing pinned caches. No r1 data was replaced.
- The pinned source-only selector supplied the first 3/7/7/7 prospective rows to the two-worker bounded index preflight. All **24/24** index and 1,024-byte primer queries passed with settled workers and zero model calls. VPS receipt: `/opt/are/evolution-runtime/g01-product-replication-preflight-r2/SOURCE-INDEX-PREFLIGHT.json`, SHA-256 `f80a3c2b89a227c5ac6c2532bd4d90d96941468c4c213ca0c7859a39b7cec46b`. Twenty indexes are partial under the pinned limits; this is an eligibility/coverage caveat, not a worker failure.
- A separate evaluator-only `GoldLoader.files()` check found **24/24** selected IDs with native gold files, exporting only eligibility bits. VPS receipt: `/opt/are/evolution-runtime/g01-product-replication-preflight-r2/GOLD-ELIGIBILITY-PREFLIGHT.json`, SHA-256 `e48fe9d4990a83452982e96ec88819ba0c7eaf2f49862a2fd595ebedfb3085aa`. Neither scorer labels nor paths entered the source-only process.
- The pinned VPS host, Node binary/version, running provider-gateway container, and container-owned secret topology passed `verifyHen11VpsTopology()`. Two concurrent live no-generation tokenizer probes both returned HTTP 200 and settled with known usage; receipt: `/opt/are/evolution-runtime/g01-product-replication-preflight-r2/TRANSPORT-PREFLIGHT.json`. The benchmark-run route admitted the exact protected GLM effect for owner-authorized execution. Definition SHA-256 `bb5cb1fb1414b694f966d0df3f0cdcae7f64f4e4316801cad0962f9b5c08574e` and campaign freeze SHA-256 `b43f572ddd4a4d91e6315ed48f694ddc24a5f8a9e8da9266e2d39976fac181b6` were sealed before dispatch. The run is in progress; no r2 score claim exists yet.

## Recommended single change

Use `jqlang/jq` for the three C slots and retain the other three repositories and their seven-slot quotas. This changes only the exhausted C repository relative to r1, not the number of pairs or the arm comparison. The nine source-only, native-gold-eligible jq IDs are enough to propose three slots, but that is **not** proof their pinned base commits can be fetched or indexed. `ponylang/ponyc` remains an alternative C population if jq fails a pre-score eligibility check; do not substitute it silently after freezing or seeing any r2 model output.

## Execution DAG after owner approval

1. Bind the changed four-repository population and r1 exposure set. Run source-only selection from the pinned parquet using only the eight declared source fields. Apply the evaluator-only native-gold eligibility bit without exposing gold values or paths to the selector. No score labels or reference text enter generation.
2. Resolve exact repository URLs and every proposed base commit into a pinned, private cache. Verify all selected tasks' source-index admission, regular-file traversal, bounded primer, source digests, and native scorer eligibility before freeze. Perform a no-generation transport and receipt-settlement preflight under the intended two-worker envelope. Report failures and repair the harness uniformly before selection freeze; do not adapt to scores.
3. Freeze a new `g01-product-replication-r2` definition with 24 exact IDs, 3/7/7/7 quotas, all source/cache/code/scorer hashes, deterministic selection seed, 8K and per-arm budgets, zero-retry policy, analysis script, and explicit changed-population disclosure. Preserve the r1 definition and results unchanged.
4. Route the exact frozen GLM dispatch through the protected effect boundary, then run all 24 paired tasks. Seal generation and known-cost receipts before independent native scoring. Keep all invalid tasks in the denominator and operational audit; no top-up or silent replacement.
5. Compute paired Span-F1/File-F1 differences, known-token and summed-arm-time ratios, stratified intervals, and all failure counts. Verify archive readability and content hashes. A product-page card remains a reviewer decision by Vlad and Dave, not an automatic consequence of favorable scores.

## Decision gate and disposition

**DG-G01-R2-POPULATION: approved and executed.** The owner selected jq for the three C slots and authorized all normal GLM requests. Commit/index/gold and no-generation transport preflights passed before freeze. `ponylang/ponyc` was not substituted. The r2 campaign is in flight under the exact fresh cohort above.

## Open Questions

- Will all 24 frozen r2 pairs produce valid native-scored outcomes, including the previously fragile source-index/receipt-settlement paths?
- Will the new full-denominator quality and efficiency intervals satisfy the predeclared product-page threshold? No answer exists before r2 scoring.
