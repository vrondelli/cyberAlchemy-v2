# KELD staging execution evidence

> **Current live baseline (2026-09-22 UTC):** staging runs
> `full-keld-staging-20260922-r1` on `web` and `worker`, exact image ID
> `sha256:78eb5d381af954f214b4c9a915d5df392c6c98d911a86d14789213883a8b4b90`.
> The frozen runtime contains 85 allowlisted source/build files totaling
> 2,811,348 bytes; its manifest SHA-256 is
> `d564eeef56a08f195a4881d7dd48cff44b44e4ed60e0eccf46d2db5dc871af99`.
> The 88-file Docker context was reverified byte-for-byte on the VPS before
> promotion. Its source-only credential scan found no unexpected
> credential-shaped files and no embedded private keys. The exact deployed
> image passed a networkless, read-only, capability-free non-root import smoke
> and a cached Trivy 0.74.0 scan with zero High/Critical vulnerabilities and
> zero secret findings; the private scan receipt SHA-256 is
> `0968cba7028e6cee4889f61dff2ad1b705ee99fd200f12e51abac76d16380ded`.
> The exact Docker archive SHA-256 is
> `0679388edcdaa48c6b0bdb28bd4451cbfaab16799922533047e75bc5f072cbde`.
>
> Only `KELD_VERSION` changed and only `web` and `worker` were recreated;
> both are healthy. Edge, PostgreSQL, Keycloak, and the four ARE services were
> not recreated. The immediately preceding H4 application image remains the
> rollback target. Before cutover, the online full-state backup
> `/opt/keld-staging/backups/full-state-pre-full-keld-staging-20260922-20260922T173655Z`
> independently passed the strict verifier: SQLite integrity `ok`, both
> PostgreSQL dump catalogs valid, private modes and all checksums valid, and
> the exact H4 application image recorded.
>
> The verified schema-v3 manifest
> `staging-r28-full-keld-staging-20260922-r1-20260922T180013Z.json` has SHA-256
> `b18a738816b8681b25b8c0d90d975f7c1fb54ea6a29fae1ce34c70d8d42c811b`.
> The fail-closed monitor passed at `2026-09-22T18:00:46Z` with no failures:
> all seven public allow/deny checks matched, the fixed BRL quote remained
> `merchant-fixed-5.10` with no expiry, ARE remained available with 1,800-second
> conversation-only process-memory retention, and no model was invoked.
> Chrome 153 passed 20/20 bounded non-payment checks covering desktop, 320 px
> mobile, the anonymous checkout route, absence of payment creation controls,
> and PKCE login entry, with zero page errors or failed requests. That journey
> created no account, order, provider session, payment, entitlement, or model
> turn. Its private receipt SHA-256 is
> `6742e99a42aa3fd76d55624bf820e82eb46a67ee63c41f3eca174d359bae0910`.
> Candidate verification also passed 49 web tests, 96 commerce tests, 165
> integration tests, and 76 deployment/security tests. This is staging
> acceptance, not a production release, commercial license approval, genuine
> provider-payment result, refund/revocation proof, or ARE bundle delivery.
>
> **Prior live baseline (2026-09-21 UTC):** staging ran
> `checkout-ui-h4-20260921` on `web` and `worker`, exact image ID
> `sha256:2702a6d412186ad4261f1829ea607be4591d956dc7227d2ea91f5ede451f9b4b`.
> H4 changes only the generated React checkout assets relative to H3; the
> other 77 staged runtime entries and Dockerfile are unchanged. Only
> `KELD_VERSION` changed and only `web` and `worker` were recreated. Both are
> healthy; edge, PostgreSQL, Keycloak, and all four ARE container IDs stayed
> unchanged. The verified schema-v3 manifest
> `staging-r27-checkout-ui-h4-20260921T1835Z.json` has SHA-256
> `8696c0f729ec49875f1669c605a7a0694bcd5a57d15cee2e33aa3030613f922a`;
> its private off-VPS copy matches. The staging monitor passed at
> `2026-09-21T18:41:06Z`. A fresh verified online full-state backup and an
> encrypted, hash-verified off-VPS copy precede H4. The live browser passed
> registration/auth return, unpaid Stripe creation, same-order reload and
> fresh-tab history resume, an expected 409 on a second PayPal attempt with
> corrected recovery copy, no false paid claim or download, zero console
> warnings/errors, and no overflow at 320 px. A third synthetic account and
> one unpaid Stripe test order remain on staging; no real-money payment or
> refund was made. H3 remains the immediate image rollback target. P/R3/O/U,
> real session-expiry/revocation, and full S3 acceptance remain open. See
> [CHECKOUT-RECOVERY-DAG-2026-09-21.md](CHECKOUT-RECOVERY-DAG-2026-09-21.md).

> **Prior live baseline (2026-09-21 UTC):** H3 ran exact image
> `sha256:6081fdd26ba9d10da35fb4587d256e5bcb36c6316eb125bdda81b4a974cf3d40`.
> Its verified r26 manifest SHA-256 is
> `16f3e03d69d87c6523aaf4469b36b80c0f5a6a6263f2fd63d4dc18cbc92b7644`.
> H3 staging tests left one earlier unpaid Stripe order and, for another
> synthetic account, one paid Mercado Pago Orders Pix sandbox artifact and
> one pending PayPal sandbox order after cancel. Those records were preserved
> through H4. Older r2/r1 images lack H3's unresolved-attempt guard; suspend
> new checkout or preserve an equivalent guard before rolling back that far.
>
> **Prior live baseline (2026-09-21 UTC):** staging ran
> `checkout-auth-return-20260920-r2` for both the application and worker, exact
> image ID
> `sha256:fe87c5dda8a6dfc70c32e826071fde2781f84f9e8dea006a020f1379dfd365bf`.
> The owner-approved envelope changed only `KELD_VERSION` and recreated only
> `web` and `worker`; edge, PostgreSQL, Keycloak, and ARE container identities
> remained unchanged. The verified pre-cutover recovery point is
> `/opt/keld-staging/backups/full-state-pre-checkout-auth-return-20260921T021824Z`,
> and r1 remains the immediate image rollback target. Anonymous Chrome 153
> loaded `/checkout?amount=200`, observed the exact login and registration
> return targets, reached the KELD realm, and verified the protected HttpOnly,
> Secure, SameSite=Lax return cookie with zero page or console errors. Unsafe
> external, API, duplicate, fragment, and invalid-amount returns fail closed.
> It created no identity, checkout, or provider payment. The browser receipt
> SHA-256 is
> `eac5e438d65c840d6305cebb7bec2f1d582328f7305da40ee84291444aad0138`.
> The schema-v3 release manifest is
> `staging-r25-checkout-auth-return-20260921T0225Z.json`, SHA-256
> `7c492262653e5ca0edb7b23f3387a27eb803560d5720d73f546acb46359fc25b`;
> its verified mode-`0600` off-VPS copy matches. Direct and real scheduled
> monitor runs pass, signup entry reaches the KELD realm, ARE remains canonical
> at `are.keld.studio/`, storefront `/are/` remains isolated with 404, and the
> quote remains fixed at `510/100`, reference `merchant-fixed-5.10`, with no
> expiry. The manifest binds the exact 84-file, 2,701,451-byte candidate context
> with tree SHA-256
> `9f85b323dfe06c95b5b2e28c98bd2cf567c55491665cfd07c9cbf32e6d8f2d77`.
> One real credentialed callback back to `/checkout?amount=200` remains the
> authentication-return acceptance gate; genuine Stripe, Mercado Pago, and
> PayPal journeys through this UI remain the subsequent W11 frontier.
>
> **Prior live baseline (2026-09-20):** staging ran
> `fixed-brl-5.10-20260920-r12` for both the application and worker, exact image
> ID `sha256:ce4f9a238238d2a36ec0c1a5c97f3eccd24fd2b13e7415bcedb7f9430e4fee3e`.
> It is the prior digest-pinned Alpine application plus explicit non-expiring
> fixed-quote support. The configured rate is exactly `510/100` BRL per USD,
> reference `merchant-fixed-5.10`, with `expiresAt: null`. A live in-container
> check converted USD 50.01 to BRL 255.05. The 96-test integration suite,
> 70-test deployment/security suite, constrained non-root image smoke, and an
> exact-image Trivy 0.74.0 scan with zero High/Critical or secret findings pass.
> Existing checkouts keep their previously frozen quote; new checkouts use 5.10.
> Only `web` and `worker` were recreated after a verified online full-state
> backup; both are healthy and r11 remains the immediate rollback image. The old
> r13 manifest detected the intentional image drift. The r14 manifest then
> detected the intentional promotion of the tested Alpine file to the canonical
> application Dockerfile and its addition to the release allowlist. A follow-up
> provenance audit found that r15 still did not bind the 84-file application
> build context. Schema-v3 r16 closed that KELD application-source gap, and r17
> exposed a later `dist/` overlay in the then-live public-chat image. The
> source-clean public-chat replacement is now live as exact image
> `sha256:3321c0ec32f4b6ac7a1df753003f1c3428b0fd0e20882502720bfba5c41df76b`.
> All 96 declared payload files match the prior live content byte-for-byte; the
> replacement removes only four stale unreferenced JavaScript chunks and fixes
> the package manifest. Its context and exact-image scans contain zero secret
> and zero High/Critical findings, and its isolated constrained smoke passed.
> Schema-v3 r18 admitted that source-clean image. The current schema-v3 r23
> manifest is `staging-r23-provider-paid-delivery-evidence-20260920T162129Z.json`,
> SHA-256
> `6906d38c7457f1cb4aaa3d56d5d28df1e0bdfbaf975435689ef1894c2f3b0c96`.
> It binds 43 deployment/evidence inputs plus every file, mode, byte count, and hash
> in the preserved 2,671,404-byte context (tree SHA-256
> `e69ab502008cf32215341f15cac06bcd005e0589e41001f380df7b0ebd59373f`).
> All 82 context runtime files match the deployed image byte-for-byte, the
> context secret scan has zero findings, and matching mode-`0600` evidence is
> copied off-VPS. r18 binds independently observed `/srv` trees and the declared
> package manifests for the exact four live ARE images; all three package trees
> now agree with their declarations with no missing, additional, or changed
> files. A post-promotion Firefox journey loaded the canonical root, opened
> preferences, completed one live GLM turn without `intent-output-invalid`,
> preserved conversation/preferences across refresh, cleared them with Start
> fresh, and recorded zero browser warnings or errors. The full seven-route/
> semantic-ARE/quote monitor passed against r23 at
> `2026-09-20T16:27:33Z`; it recorded `fixed: true`, no expiry, and no refresh
> requirement. The timer remains active. Only `web` and `worker` were recreated
> for r21 after a verified online full-state backup. The r20 private archive
> covers the immediately preceding seven-image set, verifies 91 OCI blobs and seven manifest
> entries, and has a matching mode-`0600` off-VPS copy. An automated empty-engine
> Docker 29.8.1 containerd-snapshotter load recovered all seven exact manifest
> IDs in 15.566 seconds with zero containers before and after. A classic `vfs`
> load was correctly rejected after it converted the deployment identities to
> config digests. Because r21 changed the application image, that archive is now
> rollback evidence. A fresh r21 archive now covers the current seven images,
> verifies 91 blobs, and passed an automated 28.78-second empty-engine
> containerd-snapshotter load with all seven exact IDs and zero containers. Its
> archive, capture-receipt, and recovery-receipt SHA-256 values are respectively
> `811cf5e1e6557fb024079516c79b4cb6274a1aca3977174ff812636aa4b8e18c`,
> `96b06bfde0faed53f151c345c8f1759428d47b281adbc9f47b433b060fcc0f16`, and
> `1c69b4f9b4cafc9ab1d95ea0fa82e0c29972f03f394c9ca70fa5e9fa1f85f928`.
> The archive and both receipts have matching mode-`0600` off-VPS copies, and
> r23 binds the two receipts plus the reusable capture/verification tools. It
> also binds a mode-`0600`, privacy-safe provider-paid-delivery receipt, SHA-256
> `3111ba20f7cbbbea4c920d3a164b85ca6dec75bd864cfc850165db779f370cbb`,
> for five Stripe, two Mercado Pago, and one PayPal provider-confirmed paid
> journey whose exact-artifact grant was consumed. The receipt omits customer,
> account, order, remote-payment, and payer-email identifiers; it proves ledger
> and artifact state, not browser rendering or genuine webhook delivery. The
> old 31-CVE Debian application inventory
> is now rollback-image history; Keycloak remains the live raw High/Critical
> dependency gate. A post-cutover real-Chromium customer journey passed the
> storefront bag and anonymous checkout gate, PKCE signup entry, ARE preferences,
> one live chat turn without `intent-output-invalid`, and session reset with zero
> console errors. See
> [ALPINE-APPLICATION-PROMOTION-2026-09-20.md](ALPINE-APPLICATION-PROMOTION-2026-09-20.md).
> A fresh isolated Chromium 154 journey at `2026-09-20T17:12:19Z` passed 37
> public-browser checks against the unchanged r23 runtime: canonical storefront
> and ARE roots, storefront `/are/` isolation, permanent ARE `/are/` redirect,
> PKCE account-creation entry and registration form, one real chat turn,
> inspectable learned terminology, Forget language, Start fresh, reload isolation,
> and 320 px layout. It recorded no console errors, failed KELD-origin requests,
> or browser authorization headers. No account, checkout, payment, entitlement,
> or webhook was created. The mode-`0600` local receipt is
> `are-documentation/evidence/live-public-r23-20260920T173000Z/receipt.json`,
> SHA-256 `c3ce29970f0d1e4b3e8737589ab0f0644c7e10410d95b0d58f8b202e777c131f`;
> it is browser evidence for r23, not a new release manifest input. The signup
> form is visibly headed `Register`, but its browser document title remains
> `Sign in to keld`; this is a non-blocking identity-theme copy issue to close
> with the production onboarding decision.
> A phased, privacy-safe provider-webhook verifier raises the current
> deployment/security suite to 76 passing tests. It distinguishes Mercado Pago
> settlement recovery from PayPal idempotent replay. The exact reviewed file,
> SHA-256 `2ad4b83034e9f3df22125733c22e3ee23e75cc31ce6fe5ea03f4e0b1743d2d09`,
> was atomically installed standalone at
> `/opt/keld-staging/capture_webhook_recovery_evidence.py` with mode `0755` and
> `root:root` ownership. Its installed-source compatibility check passed without
> a service restart, database write, manifest change, or provider request. It is
> deliberately not bound by unchanged r23; genuine provider runs, a successor
> manifest after accepted evidence, and any separately approved PayPal
> fault-injection test remain open. See
> [PROVIDER-WEBHOOK-RECOVERY-ACCEPTANCE.md](PROVIDER-WEBHOOK-RECOVERY-ACCEPTANCE.md).
> A separate, non-live Keycloak candidate now overlays the complete Bouncy
> Castle 1.85 set. Its corrected exact image
> `sha256:603f818e915dfe80145608dfc22468fcc10b4751744b2bb79f63f42c427a927f`
> removes both Bouncy Castle CVEs from the raw scan, passes a read-only,
> no-published-port restore rehearsal with 9 users and 2 realms, and has private
> SBOM/license evidence copied off the VPS. Three raw findings remain: the two
> configuration-bound stock-image findings and a Red Hat-rejected OpenJDK CVE
> that still requires an exact-subject owner disposition. The downstream image
> is not deployed or approved. A second disposable, internal-only stack now
> passes two Chromium registrations, real PKCE callback exchange, forced token
> renewal, logout, and two-buyer order isolation against the exact candidate
> and r11 app image with no published ports or live mutation. Security/license-
> owner review remains. See
> [KEYCLOAK-BC185-CANDIDATE-2026-09-20.md](KEYCLOAK-BC185-CANDIDATE-2026-09-20.md).
>
> **Earlier same-day evidence:** staging previously ran
> `security-plan-20260920-r10`; signup/session renewal plus Stripe and Mercado
> Pago purchases through verified download pass. A separately preserved live-ledger
> receipt also confirms a completed PayPal purchase and consumed exact-artifact
> grant. Genuine Stripe signed delivery,
> provider redelivery, and stopped-worker restart recovery pass without a
> duplicate grant. Two later PayPal regression attempts reached the real sandbox approval surface, but
> both bounded local windows expired before buyer action. A 36-check watcher
> preserved the second result as `approval-window-expired`, paid false; no
> replacement attempt will be created until the sandbox personal buyer is ready.
> The public KELD edge now runs the separately scanned
> `keld-caddy:2.11.4-security-plan-20260920-r2` image as UID/GID `1001:1001`
> with a read-only root, all capabilities dropped except
> `CAP_NET_BIND_SERVICE`, no-new-privileges, a 128-PID limit, and a 256 MiB
> memory limit. The first deployment correctly failed closed because the
> existing Caddy volumes were root-owned; the preserved compose restored the
> old edge and public TLS immediately. A backed-up, symlink-refusing ownership
> migration then moved the two exact named volumes to UID/GID 1001 and the
> hardened retry passed all seven public probes plus the live Chrome smoke. A
> complete 1,256-line `go.sum` and 169-line `go.mod` now lock the rebuild; the
> locked r2 build produced the same Caddy binary SHA-256 as the scanned r1
> rehearsal, passed its own exact-image scan, and replaced r1 successfully.
> Audited terminal-unpaid review resolution, PayPal
> missing-order classification with an exact-reason ledger guard, and a clean
> anonymous browser load are deployed. Three historical missing PayPal orders
> completed guarded audit resolution; the two expired buyer-action reviews
> remain open by design. The read-only queue now
> contains two PayPal review items and no queued or processing reconciliation.
> The r9 review repair retained by r10 makes worker health fail closed when the durable event
> inbox is full; the current 96-test integration suite and exact-image scan pass.
> PostgreSQL is now a separately scanned, non-root, read-only, capability-free
> image with unchanged live database counts. A current full-state backup and an
> isolated restore of commerce, Keycloak, and session state pass; the earlier
> encrypted off-host commerce copy and private prior-image rollback boot also
> pass. The current stock Keycloak is non-root/capability-free/no-new-privileges,
> but its root remains writable. An earlier experimental optimized/read-only
> image was not deployed after its raw scan surfaced Bouncy Castle findings.
> A later complete 1.85 overlay removes those two findings in a private
> candidate, but remains outside upstream support and is still unpromoted.
> The live realm now disables both unused WebAuthn registration actions through
> a reversible migration. The verifier now covers all seven bound authentication
> flows and all enabled client authenticators, and the public edge blocks dynamic
> client registration; password signup still passes in a clean browser. This is
> a deployment mitigation, not a clean Keycloak image or accepted VEX waiver.
> The downstream candidate now has an exact-SBOM-subject OpenVEX review
> proposal: two configuration-bound findings are proposed `not_affected`, while
> the disputed OpenJDK record remains `under_investigation`. The proposal passes
> the official 0.2.0 schema, is absent from every Compose/scanner input, and has
> not changed the raw scan or the live stock image.
> The r13 complete no-ignore High/Critical inventory covered all eight distinct
> then-live images. Caddy, PostgreSQL, and all four ARE images were empty; the
> old r10 KELD image contained 31 unique findings without available fixes, while the exact
> stock Keycloak image contains five unique findings, four with fixes available
> and one affected OpenJDK finding without a scanner-listed fix. The earlier
> zero-High/Critical result is therefore stated narrowly as a zero-fixable-
> finding result under `--ignore-unfixed`, not a clean raw inventory. Eight
> CycloneDX SBOMs inventory 1,019 across-image components and private license
> triage reports are hash-bound and copied off-VPS. See
> [LIVE-IMAGE-SBOM-LICENSE-REVIEW.md](LIVE-IMAGE-SBOM-LICENSE-REVIEW.md).
> A scripted full-state backup and verified encrypted off-VPS copy now pass,
> including a current post-Keycloak-hardening recovery point;
> the historical r13 mode-`0600` off-VPS Docker-save archive preserved all seven
> then-live custom KELD/ARE images. Its 93 blob digests and seven entries passed
> a 37-second off-VPS load rehearsal with exact recovered IDs. After the r11 and
> r18 replacements, the r20 archive preserved all seven custom image IDs from
> that baseline, verified 91 OCI blobs and seven manifest entries, and has
> matching private off-VPS hashes. The current r21 archive likewise verifies 91
> blobs, has matching private off-VPS hashes, and passed the empty-engine exact-ID
> load in 28.78 seconds. Schema-v3 r23 binds its receipts and tools. A fresh
> release manifest is still required
> after deployment configuration and state are restored and before public
> admission. See [CUSTOM-IMAGE-RECOVERY.md](CUSTOM-IMAGE-RECOVERY.md).
> Independent recovery-key custody, an approved second destination/retention
> policy, and a public rollback cutover remain open. See
> [SECURITY-PLAN-EXECUTION-2026-09-20.md](SECURITY-PLAN-EXECUTION-2026-09-20.md).
> The r13 secret-free exact-release manifest bound all nine then-live KELD/ARE
> containers and 26 allowlisted deployment inputs; re-verification and a
> private off-VPS copy match. A hardened five-minute systemd monitor verifies
> that manifest, service-specific public response content, and the public
> allow/deny probes. Its requests are restricted to the three explicit HTTPS
> hosts and refuse redirects, credentials, fragments, and custom ports. A
> no-model-call semantic status probe now also requires the
> chat to be configured, live, conversation-only, process-memory backed,
> available, and set to the expected 1,800-second retention. It also fails when
> the BRL quote expires or enters its
> 24-hour refresh window. Its scheduled runs and the current exact-release run
> report healthy.
> A bounded HTTPS success-heartbeat sender and inactive systemd drop-in are
> staged; selecting a receiver, proving receipt/missed-heartbeat escalation,
> canary, rollback, and owner authorization remain open.
> A standalone secret-silent full-state verifier now rechecks exact membership,
> private modes, image IDs, checksums, database signatures, and SQLite integrity;
> all three retained r9 full-state recovery points pass, and future backups must
> pass it before publication.
> The staged BCB PTAX fetcher reproduces the active sell-rate ratio and source
> timestamp from the official API without choosing an expiry or applying a
> runtime change.
> The preceding schema-v2 manifest was
> `staging-r13-manifest-v2-20260920T1042Z.json`, SHA-256
> `aae430997ed1ffae13ab56dcd801faf513f454da4de93174ca7d13c818de1458`;
> its private off-VPS copy matches. Deployment tests pass 45/45. The five-minute
> monitor now also requires storefront `/are/` to remain 404 and ARE `/are/` to
> remain a 308 redirect to `/`. The scheduled monitor detected the intended
> edge-image drift at `2026-09-20T10:28:51Z`; after the new manifest was
> captured, the manual r11 run and autonomous r11 run at
> `2026-09-20T10:34:13Z` passed. The locked r2 image then caused the expected
> r11 manifest drift; the new manual r12 run passed with no failures. A focused
> timer-triggered r12 run at `2026-09-20T10:39:32Z` repeated the exact manifest,
> semantic ARE, quote, and seven-route checks with no failures. A focused
> manifest coverage review then added the Caddy Dockerfile, module locks, and
> storage migration to the input set and now binds added capabilities and memory
> limits for every container. The v2 manifest has 26 inputs and nine containers;
> its manual monitor run and timer-triggered run at
> `2026-09-20T10:44:57Z` passed. A focused
> Bandit scan reports zero High and one dispositioned Medium finding for the
> intentional private container listener.
> The reusable deployment candidate no longer attaches ARE to the storefront
> `/are/` route: it requires a distinct `ARE_DOMAIN`, keeps `/` canonical on
> that host, and gives the isolated chat the matching public host/origin. The
> generic and staging Caddyfiles parse through the exact Caddy 2.11.4 candidate;
> this source repair is retained by the immutable live r13 release baseline,
> whose override was already
> correct. The route-isolation monitor update was deployed without recreating
> any application container and its first exact-release run passed all seven
> public probes.
> The report below is retained as the earlier infrastructure/cutover record.

Date: 2026-09-18. Owner authorized execution of [STAGING-PLAN.md](STAGING-PLAN.md).
Scope: staging infrastructure on `187.77.163.194`; no production checkout or ARE
release. This records observed results, not commercial product approval.

Orders migration source work is recorded separately in [implementation evidence](MERCADO-PAGO-ORDERS-IMPLEMENTATION.md). The dated record below predates the completed sandbox journeys summarized above.

## Deployed

- Stable directory `/opt/keld-staging`, explicit Compose project `keld-staging`.
- Docker 29.8.1 and Compose 5.5.1 installed through Docker's official repository.
  Exact installed package versions and pre-change service/firewall/listener
  evidence are under the private VPS `baseline/` directory.
- Existing pinned PostgreSQL, Keycloak and Caddy images were retained without
  recreating the stateful services. The KELD web and worker now use the exact
  React signup image `keld-sandbox:react-signup-20260919`,
  `sha256:2f8cbbe1ae86dc5f6f35b34e17f15f21c652070d9ae69f41bc0af87d296f2dcd`.
- `https://staging.keld.studio`: trusted HTTPS and the active React KELD sandbox
  storefront and checkout. `/react-preview` remains a compatibility alias.
  Public `/readyz` returns 404; only Caddy publishes host ports.
- `https://auth.staging.keld.studio`: dedicated `keld` realm; issuer discovery works.
  Public admin and master realm paths return 404. Both hosts send noindex headers.
  Public `/realms/keld/clients-registrations/*` also returns 404; customer signup
  continues through the reviewed OIDC registration flow rather than dynamic
  client registration.
- Public staging self-registration is enabled through the application's
  `/auth/register` PKCE/OIDC entry. Email is the unique username and the realm
  requires a 12-character password with upper-case, lower-case, and digit rules.
  Email verification and password reset remain disabled until SMTP is configured.
- Two test users: `staging-buyer-a`, `staging-buyer-b`. Generated passwords are in
  the dedicated operator vault, never committed or included in this report.
- Secrets are generated/consumed through the copied secret store. Only selected
  private runtime files were transferred via SSH. The vault and age identity stay
  at `/home/vlad_/.local/share/keld-staging-operator` on the operator workstation.
- Original orchestrator remains active on `127.0.0.1:18080`. Public TCP listeners
  are SSH 22 and Caddy 80/443; database and Keycloak backend ports are not published.
- The separate `https://are.keld.studio/` presentation and anonymous chat remain
  active through the shared ingress network. Exact `/are/` requests redirect to
  its canonical root.
- Final observed root filesystem before activation: 5.3 GB used, 188 GB free (3%).

## Tests and limits

| Check | Result | Claim boundary |
| --- | --- | --- |
| Provisioning tests | 4 passed | Includes real encrypted vault and infrastructure provisioning without merchant entries |
| Compose/Caddy validation | Passed | Infrastructure manifest and both Caddy configurations parse |
| Disposable infrastructure cold-start test | Passed | Issuer discovery, maintenance response, public admin/master rejection; first run timed out, rerun with 360-second allowance passed |
| Public HTTPS | Passed | Trusted certificates and correct issuer through public DNS |
| Browser identity login | Pre-activation checks passed for both buyers; post-activation login entry passed | The live app generated a PKCE authorization request and reached the `keld` realm login form with no browser console errors; credential redemption is the next acceptance step |
| Browser self-registration entry | Passed without creating a customer | `Create account` generated a PKCE request with `prompt=create` and reached the dedicated realm registration form with all expected fields and no console errors |
| Service restart | Passed | Keycloak and edge restarted; public discovery recovered; persistent realm retained |
| Backup restore | Passed for identity database | Custom-format Keycloak dump restored into isolated networkless PostgreSQL container; both buyers present; temporary restore container/volume removed |
| ARE coexistence | Passed | Existing service remained active throughout installation, deployment and restart checks |
| Merchant checkout/webhooks/download | Superseded by newer evidence above | Stripe, Mercado Pago, and PayPal purchase-to-download pass; Stripe webhook/redelivery/recovery passes; Mercado Pago/PayPal genuine webhook recovery remains open |

The initial browser check incorrectly depended on intercepting a redirect. It
failed its test assertion; checking the actual final browser URL verified both
authorization responses without logging codes. The reusable test is
[browser_identity.mjs](../deploy/browser_identity.mjs): provide an array of
`{name,password}` over stdin and set `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE`
to installed tools. Never put passwords in command arguments or saved test data.

Source identities are recorded in
[staging-source-manifest.json](../deploy/staging-source-manifest.json).
The five deployed configuration/script hashes were read back from the VPS and
checked against local source. Local transient evidence is in
`/tmp/keld-infrastructure-smoke.log` and
`/tmp/keld-staging-browser-result.jsonl`; this document retains the outcomes.

Backups under `/opt/keld-staging/backups` are private local recovery copies,
not encrypted off-server backups. The pre-activation rollback snapshot is
`/opt/keld-staging/backups/keld-candidate-before-20260918T213346Z`; it contains
the prior configuration/runtime and fresh custom-format dumps of `keycloak` and
`keld_sessions`. The new SQLite commerce ledger exists but is empty of checkout
activity. No app rollback, commerce restoration, or host reboot test is claimed.

## Historical payment-readiness refresh (2026-09-18)

Validation on 2026-09-18 confirmed the then-current local staging candidate:

- all 91 KELD integration tests passed, including Stripe, Mercado Pago Orders
  Pix, PayPal, signed events, reconciliation, entitlement ownership, exact
  downloads, restart recovery and cross-buyer denial;
- the copied secret store passed 31 tests, full provisioning passed 4 tests,
  and the production-input gate passed 7 tests;
- the 49-file staged runtime manifest matches the source-only build context and
  the local `keld-sandbox:candidate` image exactly; its image identity is
  `sha256:9fe3414dd54e472ea92d767ac6e31ba66bca462ded64fdfd64c5daafac1c7d29`;
- the disposable integrated Compose stack passed PostgreSQL migrations,
  Keycloak discovery, KELD web/worker readiness, exact `/are/` routing,
  production-input enforcement, ARE network segmentation, hardened runtime
  controls and backend-port isolation using synthetic credentials only; and
- both invited staging buyers again completed real public Keycloak
  authorization redirects. Application session redemption remains untested
  while the storefront deliberately returns maintenance responses.

The dedicated operator vault is healthy and contains the infrastructure,
test-buyer and six sandbox payment records. Read-only identity checks matched
Stripe account `acct_1UGuJyPpQdqazZcw`, Mercado Pago collector `3699662998` and
PayPal sandbox merchant `VDGALXJWKRU5C`. At that historical checkpoint, the
candidate used Mercado Pago
application `1751375122490495`, PayPal webhook `4W859304D6425863A`, and BCB PTAX
sell rate 5.15750 BRL/USD, reference
`BCB-PTAX-venda-2026-09-18T13:03:34-03:00`, expiring at
2026-09-19T18:26:44-03:00. The operator reports all three webhook endpoints
registered; genuine signed event delivery is not yet proven. No merchant charge,
capture, refund or payment was attempted during deployment.

Activation used [compose.staging-candidate.yaml](../deploy/compose.staging-candidate.yaml)
and [Caddyfile.staging-candidate](../deploy/Caddyfile.staging-candidate) so the
existing PostgreSQL volume and dedicated `are.keld.studio` presentation remain
intact. Candidate and running Compose hashes for PostgreSQL and Keycloak matched
before startup. After cutover, the storefront, issuer and ARE root returned 200;
private readiness returned 404; `/are/` returned the expected 308; web was
healthy; worker was running; all four ARE containers stayed healthy; and the
orchestrator service stayed active.

## Next execution frontier

1. Complete real application login/session/logout for both invited buyers and
   prove cross-buyer isolation.
2. Run one bounded Stripe test checkout, verify the genuine signed webhook and
   exact artifact download, then exercise retry/recovery without duplicating the
   payment request.
3. Repeat the bounded acceptance journey for Mercado Pago Orders Pix and PayPal,
   including pending/failure paths and worker reconciliation.
4. Refresh the BRL quote before its recorded expiration if Mercado Pago testing
   has not completed, then capture sanitized provider/event evidence.

## Open Questions

Genuine webhook delivery and provider-side end-to-end acceptance remain open.
Offline age-key backup and encrypted off-server retention remain operator work.
Temporary Keycloak bootstrap admin replacement with a durable operator
administration arrangement remains open; no public admin console is exposed.
Production policy, license, release, onboarding and refunds remain owned by
[STAGING-PLAN.md](STAGING-PLAN.md#open-questions).
