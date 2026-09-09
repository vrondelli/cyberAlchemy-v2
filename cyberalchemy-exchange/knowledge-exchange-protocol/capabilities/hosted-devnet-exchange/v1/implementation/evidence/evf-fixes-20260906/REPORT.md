# KEP EVF findings repair — 2026-09-06

**PASS for local implementation and configuration preparation. Production is unchanged.**

## What changed

- Added an outer hosted-router middleware in src/ui.rs. All hosted page, asset, API, error and fallback responses now carry host-only Strict-Transport-Security max-age=31536000, X-Content-Type-Options nosniff, and Referrer-Policy no-referrer. Existing CSP remains intact. The middleware does not collect, copy or wrap the response body. No includeSubDomains or preload is imposed; cleartext loopback does not activate browser HSTS.
- Added tests/security_headers.rs, covering three HTML pages, an asset, health, malformed JSON, missing route and wrong method.
- Added resource budgets to implementation/compose.yaml and a new deployment/updates/evf-fixes-20260906 resource-only overlay. Application: 768 MiB memory, equal memory+swap, 1 CPU, 128 PIDs. Database: 1 GiB memory, equal memory+swap, 1 CPU, 256 PIDs. The validator rejects unrelated configuration changes and missing quotas.
- Preserved the concurrent response admission implementation and reran its tests. It retains bulk payload ownership through Bytes and pairs it with transport deadlines; it does not replace the short-lived handler pool. This task did not rewrite the transport, API, file lifecycle or retention semantics.

## Validation

- Full regular Rust suite: 44 passed.
- Focused response ownership and new security-header regression passed.
- Optimized real KEP transfer integration: two tests passed, including admission saturation/recovery, deadlines, keep-alive and queued-handler behavior. The header regression also passed in that optimized invocation.
- Real isolated hosted HTTP: six routes, including a 404, returned the required headers; server stopped cleanly afterward.
- Compose normalization: exact resource-only delta, local configuration agreement, nine negative cases passed.
- Docker applied both role budgets to isolated idle probe containers; actual Memory, MemorySwap, NanoCpus and PidsLimit matched. Probes were stopped. This is mechanism evidence, not application/database load or OOM testing.
- EVF local repair audit: three captured-evidence checks passed twice, three corrupted-evidence controls rejected, and independent S0–S12 evidence verification passed with aggregate_state=passed. This evaluates recorded local HTTP/quota/test evidence and binds source inputs; it does not re-execute tests inside the provider or prove current live-site closure.

## Retained failed attempts

transfer-integration.txt: wrong fresh-database prefix was rejected before database connection. transfer-integration-valid-prefix.txt: debug fixture setup exceeded its explicit one-second precondition for short deadlines. Corrected invocation used a third fresh database and the harness-required optimized build; no assertion or timeout was relaxed. All three database locators and failed logs are preserved. The Compose validator initially encountered Docker's numeric-string memory representation; comparison now uses that documented output shape while keeping exact expected byte values.

## Scope and remaining work

Product construction frontier: these local fixes and focused tests are complete. Existing response work has a validated vectored HTTP/1.1 boundary; scalar/flatten copy paths and universal outbound/HTTP2 protection are not claimed. Longer soak and complete production-proxy coverage remain separate validation work.

Operational support: new configuration is prepared, not deployed. A future rollout must bind the new image and resource overlay, confirm host headroom, back up the database, account for the database container restart needed to apply quotas, preserve volume/credentials, and run a new live EVF audit. An application-only replacement will not apply PostgreSQL's limits. Current production still has the previous audit's header/quota findings until this happens.

These budgets are starting values above prior measured short-run process peaks, not guaranteed capacity. Database worst-case query/connection memory, independent backups, monitoring and broader security review remain open. Limits can cause OOM/availability events when exceeded and require measured tuning.

Only src/ui.rs and compose.yaml were changed among pre-existing implementation files by this task; new regression, deployment package and evidence were added. scope.json separately records another task's update to its response-integration evidence log. Prior EVF/deployment failure records, unrelated dirty bytes, alchLang, production, local preview and user keys were preserved. No commit, push or deployment occurred.

PLAN.md contains the construction/operations DAG. evf-run.json and evf-verify.json locate the evidence. The previous production FAIL remains historical evidence and was not rewritten as PASS.
