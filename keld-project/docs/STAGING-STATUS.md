# KELD staging execution evidence

Date: 2026-09-18. Owner authorized execution of [STAGING-PLAN.md](STAGING-PLAN.md).
Scope: staging infrastructure on `187.77.163.194`; no production checkout or ARE
release. This records observed results, not commercial product approval.

Orders migration source work is recorded separately in [implementation evidence](MERCADO-PAGO-ORDERS-IMPLEMENTATION.md). The validated candidate is now active on staging; no sandbox payment has yet been created or confirmed.

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
- Public staging self-registration is enabled through the application's
  `/auth/register` PKCE/OIDC entry. Email is the unique username and the realm
  requires a 12-character password with upper-case, lower-case, and digit rules.
  Email verification and password reset remain disabled until SMTP is configured.
- Two test users: `staging-buyer-a`, `staging-buyer-b`. Generated passwords are in
  the dedicated operator vault, never committed or included in this report.
- Secrets are generated/consumed through the copied secret store. Only selected
  private runtime files were transferred via SSH. The vault and age identity stay
  at `/home/vrondelli/.local/share/keld-staging-operator` on the operator workstation.
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
| Merchant checkout/webhooks/download | Ready for staged testing | Test credentials and identifiers are installed and the worker is healthy; no checkout, provider event or download has yet been exercised against the live staging app |

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

## Payment-readiness refresh

Fresh validation on 2026-09-18 confirmed the current local staging candidate:

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
PayPal sandbox merchant `VDGALXJWKRU5C`. The candidate uses Mercado Pago
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
