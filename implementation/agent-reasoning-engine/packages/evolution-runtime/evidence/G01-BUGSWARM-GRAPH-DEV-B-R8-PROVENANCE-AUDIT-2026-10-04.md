# G01 BugSwarm cohort B r8 — independent source-label and log audit

Status, 2026-10-04: **24/24 patch-file label sets corroborated from exact Git trees over GitHub HTTPS; 15/24 original failure logs byte-matched over BugSwarm HTTPS.** Nine larger HTTPS log transfers ended early with `curl` exit 56 and incomplete bodies; none returned a complete conflicting log. This is a private, evaluator-exposed provenance audit, not a new benchmark score or superiority claim.

The original [r8 score](G01-BUGSWARM-GRAPH-DEV-B-R8-GLM-RESULT-2026-10-04.md) used evaluator-only labels from BugSwarm's HTTP diff API and source-side logs from its HTTP log API. The r8 predictions and scores were already sealed before this audit. No label or patch was exported to the VPS source ranker, and the reserved confirmation partition stayed unopened.

## Patch-path corroboration

An initial evaluator-only GitHub HTTPS `compare/{failed}...{passed}` audit completed 24/24 exact-commit comparisons. Nineteen non-test `.py`/`.java` old-source path sets matched the HTTP labels; five did not. All five comparisons reported `diverged` histories, and their GitHub compare file lists either included unrelated branch changes or, for one case, omitted the direct tree change. Its private result SHA-256 is `c9ccdb93652c42047e53f28fc8cfbdef33118ec17018d5e440a3c8b714dd6cb3`; compare output is not treated as direct failed-to-passed tree truth.

The separately frozen exact-tree audit obtained both GitHub Git trees for those five cases. Each pair was complete, and direct blob-SHA comparison matched the provisional gold set **5/5**; receipt SHA-256 `4501c2f03acd5d22fcdada9fd9f7b4fa277f123eb0e3fadf2f8a2427c66f2c13`. A final evaluator-only audit computed Git blob SHA-1 for every eligible old source file in each sealed failed-commit projection and compared it with the exact passing-commit Git tree served over HTTPS. It reused and cross-checked those five tree pairs, fetched 19 additional passing trees, found **24/24 complete trees and 24/24 exact non-test old-source path-set matches**, and wrote receipt SHA-256 `85d19076caea4155e38b16891a46fcba9ada195349ed4c722f140576f193b631`. This independently corroborates the file-path labels and exact failed-source projection. It does not prove the changed file caused the CI failure or validate log bytes.

## Original failure-log transport

A source-only manifest pinned 24 job IDs, original HTTP-log SHA-256 digests, and byte lengths at SHA-256 `c8a0f5eb17be6deb3f21a5e9e54809fa3aff3d01097dee9e845e78f567f556ee`. It contained no gold paths. A VPS-only, TLS-validated retrieval from `https://www.bugswarm.org/artifact-logs/{job_id}/raw/` obtained **15/24 complete byte-identical logs**. The other nine expected logs were 259,994–4,685,227 bytes; their connections closed early at 65–82 KB with `curl` exit 56. They are *unverified*, not mismatched. The private audit result SHA-256 is `b84ee08aa3f087750c8ce00379f3322a14505cf73dfc39a96c9be3d240ea91df`. The 15 complete HTTPS logs and all receipts were copied to WSL; the 43-file VPS/WSL sorted hash-inventory digest matches at `87b45940a66f9575fa469e3eb2f74cc39cfd86253153c1455a38e428cace63eb`.

The BugSwarm HTTPS site was used because its original API hostname did not accept HTTPS from this environment. No disabled certificate checking, automatic request retry, or model call was used. The nine incomplete HTTPS responses cannot be interpreted as authentication of their full HTTP payloads.

Read-only Docker Hub manifest inspection found the nine corresponding cached artifact images available, but their 223 unique image layers total about **25.6 GB compressed** before unpacking or build outputs. No image was pulled or container run. Reproduction remains an option, but this cost favors first admitting a fresh cohort with complete HTTPS logs where possible rather than treating a nine-image replay as routine cleanup-free work.

## Consequence for claims

The r8 source-file labels now have strong independent GitHub HTTPS corroboration, but the nine CI logs remain unauthenticated as full originals, the cohort is already development-exposed, and the r8 pairwise guard did not improve over raw listwise selection. Keep the frozen r8 whole-gate result **failed**; do not retroactively promote it or reuse this population as fresh confirmation. For an independent claim, freeze a disjoint cohort with HTTPS or reproduced failure evidence, matched comparator and full cost accounting, then evaluate only after source-side predictions are sealed.

## Open Questions

- Can the nine large original logs be obtained completely over an authenticated channel, or can their failure behavior be reproduced from the exact BugSwarm Docker artifacts?
- Does raw listwise selection retain its development gain under a prospectively frozen, repository-disjoint campaign?
- Which independent population can support a full G01 claim without the HTTP transport defect?
