# R08 review preparation

The proposed product is the **local durable Workflow recovery reference runtime**, candidate `DSV2-R07-LOCAL-RECOVERY-PRODUCT-001`: Python/SQLite coordination storage, Operation replay protection, a fenced worker, persisted bounded retries, terminal recording, restart and local outbox acknowledgement.

The exact product-test manifest SHA-256 is:

`f7068d6ecd0ae4208b792804fcf502a1b25502309913eaa32c7b88b3138d47aa`

R07 verification passed during this preparation. Its 30 scenarios and 60 passing executions are recorded evidence; they were not rerun here. The replay used isolated processes and fresh stores but the same authored tests. It is not independent review.

The product scope remains one local host and boot, two competing workers, separate SQLite files, the example local Operation and at most three attempts per occurrence. Cross-boot operation, remote effects, power-loss guarantees, multi-host operation, production deployment and universal exactly-once execution remain outside the candidate.

`review-request.json` is a concrete contract for one independent native reviewer. It names the exact candidate, read scope, forbidden changes, temporary test allowance, required checks and report shape. The reviewer must challenge the implementation and the campaign's coverage rather than rely on its PASS status. Repository files are read-only; any targeted test probes use temporary files. No helper has been started.

`preacceptance.json` records every check: current candidate/test binding passes; author inspection is preparation only; independent review is not evaluable; the owner decision is not evaluable because that review is pending. R08 remains incomplete. This document does not ask for or record product approval.

Current session instructions prohibit spawning a subagent without an explicit request for subagents, delegation or parallel agent work. Permission to use the prepared reviewer is separate from approval of the product. After the independent report is joined and any findings are resolved, the exact candidate can be presented for the owner's product decision. Changed acceptance-bound bytes require a new candidate/test epoch.

`progress.json` preserves the product-construction frontier and separate operational residue. U00/L00 remain independently runnable. Existing release, distribution, EVF environment/stability and source-index work retains its owners and affected stages. No publication, deployment or operational authority is inferred.
