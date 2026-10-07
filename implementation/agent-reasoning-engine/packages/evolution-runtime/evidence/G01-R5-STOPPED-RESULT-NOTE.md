# G01 r5 — stopped pre-model source-cache failure

Status: **stopped, no scored pairs, no superiority claim**, 2026-09-29 UTC. This is a retained private failed attempt, not a completed 24-pair replication. The [prospective r5 protocol](G01-R5-PROTOCOL-CANDIDATE.md) and all prior campaigns remain unchanged.

The source-only 24-task definition was materialized at `/opt/are/evolution-runtime/g01-product-replication-input-r8/DEFINITION.json` (SHA-256 `29b8d334f5a399a370de812b13c45e9345dac2f6a69a4f54f07c73b4aa26f149`). Pair plans were frozen at `/opt/are/evolution-runtime/g01-product-replication-r5/CAMPAIGN-FREEZE.json` (SHA-256 `0ce678ef6a7a1bc2ab8bdd9cc3abec7cc0d3120a427c75659b906c706f67d23a`). The exact r8 snapshot had passed its targeted tests, the GLM credential and topology checks passed, 24/24 source-only indexes had settled, all source caches existed, and approximately 2.56 GB remained before dispatch. The definition builder SHA-256 on the VPS was `8c147fbddc334c50049b546cb98219806220f2639e5bf2bd11c001253cff17d7`.

The two-worker service `are-g01-r5-campaign.service` started under invocation `ddc1db1fbc264037b27d0b895f2f93a2`. Its first six PonyC pairs immediately returned `unscored`: both arms failed before model dispatch because `git remote get-url origin` found no `origin` in their source cache. Two cli pairs had entered source indexing when the service was stopped; both ended `unscored`, with no persisted model receipts. The service is terminal with `Result=exit-code`, and exactly **8/24** `PAIR-RESULT.json` files exist. No `CAMPAIGN-RESULT.json`, paired analysis, or native score exists. The frozen 24/24 completeness gate is false. Do not rerun these attempted pairs or call r5 a passing benchmark.

A read-only audit of all frozen task caches found **15/24** without a configured `origin`: all six PonyC, three grpc, three serverless, and three tracing paths. The other nine matched the task `repo_url`. The earlier source-index preflight checked commit availability and local index settlement but did **not** check the runner's repository-origin identity prerequisite. This is a preflight coverage defect, not evidence about the candidate's model quality. The r5 task files are now conservatively manifested even though the eight observed attempts recorded zero model receipts; exclude all 24 r5 IDs from the next fresh cohort. Preserve r5 inputs, freeze, attempted pair roots, journal, and failure receipts.

The prospective read-only [runner-cache verifier](../research/g01-fast-live-v1/verify-runner-cache-r2.mjs) (SHA-256 `08912266beb5fc61c2036c7c3f7c4b150daa7094c305b383490e780fea32ecfd`) passed four local tests and reproduced the exact **9 passed / 15 origin-identity failures** on r5's pinned candidate and index receipt, with zero model calls. It is not an amendment to r5's frozen gate.

Next: prospectively validate `origin == repo_url` (or explicitly prepare independent caches with that identity) before a separately named fresh-cohort freeze. Include a no-model runner preflight for source checkout, not just source indexing. Verify storage and GLM transport again. A later campaign must use new task IDs and a new immutable definition; it cannot patch or top up r5.

The new [r6 source-only candidate](G01-R6-SOURCE-ONLY-CANDIDATE.md) follows that path; it is not yet a benchmark result.

## Open Questions

- Which untouched source-only IDs and exact-commit caches can form the next cross-branch cohort after excluding all 24 r5 IDs?
- Should the runner's read-only repository identity and shallow-checkout checks become one reusable pre-dispatch gate for every G01 task?
- Can the next cohort meet the 24/24 validity and quality/cost intervals without a new model failure?
