# KELD staging execution evidence

Date: 2026-09-18. Owner authorized execution of [STAGING-PLAN.md](STAGING-PLAN.md).
Scope: staging infrastructure on `187.77.163.194`; no production checkout or ARE
release. This records observed results, not commercial product approval.

Orders migration source work is recorded separately in [implementation evidence](MERCADO-PAGO-ORDERS-IMPLEMENTATION.md). It has not replaced the deployed maintenance infrastructure.

## Deployed

- Stable directory `/opt/keld-staging`, explicit Compose project `keld-staging`.
- Docker 29.8.1 and Compose 5.5.1 installed through Docker's official repository.
  Exact installed package versions and pre-change service/firewall/listener
  evidence are under the private VPS `baseline/` directory.
- Pinned PostgreSQL, Keycloak and Caddy images from
  [compose.infrastructure.yaml](../deploy/compose.infrastructure.yaml).
- `https://staging.keld.studio`: trusted HTTPS and deliberate HTTP 503 maintenance
  response. No payment application or worker is running.
- `https://auth.staging.keld.studio`: dedicated `keld` realm; issuer discovery works.
  Public admin and master realm paths return 404. Both hosts send noindex headers.
- Two test users: `staging-buyer-a`, `staging-buyer-b`. Generated passwords are in
  the dedicated operator vault, never committed or included in this report.
- Secrets are generated/consumed through the copied secret store. Only selected
  private runtime files were transferred via SSH. The vault and age identity stay
  at `/home/vrondelli/.local/share/keld-staging-operator` on the operator workstation.
- Original orchestrator remains active on `127.0.0.1:18080`. Public TCP listeners
  are SSH 22 and Caddy 80/443; database and Keycloak backend ports are not published.
- Final observed root filesystem: 4.1 GB used, 189 GB free (3%).

## Tests and limits

| Check | Result | Claim boundary |
| --- | --- | --- |
| Provisioning tests | 4 passed | Includes real encrypted vault and infrastructure provisioning without merchant entries |
| Compose/Caddy validation | Passed | Infrastructure manifest and both Caddy configurations parse |
| Disposable infrastructure cold-start test | Passed | Issuer discovery, maintenance response, public admin/master rejection; first run timed out, rerun with 360-second allowance passed |
| Public HTTPS | Passed | Trusted certificates and correct issuer through public DNS |
| Browser identity login | Both buyers passed | Authorization code and matching state reached the configured callback; KELD app session/PKCE redemption is not tested because app is absent |
| Service restart | Passed | Keycloak and edge restarted; public discovery recovered; persistent realm retained |
| Backup restore | Passed for identity database | Custom-format Keycloak dump restored into isolated networkless PostgreSQL container; both buyers present; temporary restore container/volume removed |
| ARE coexistence | Passed | Existing service remained active throughout installation, deployment and restart checks |
| Merchant checkout/webhooks/download | Blocked | Real sandbox credentials/configuration missing; maintenance endpoints return 503 |

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
not encrypted off-server backups. No SQLite commerce ledger exists yet. No app
rollback, commerce restoration, or host reboot test is claimed.

## Next execution frontier

1. Store Stripe test secret and endpoint signing secret using the hidden-prompt
   commands in [deploy/README.md](../deploy/README.md#infrastructure-only-staging).
   User selected Stripe for the first journey; its credentials have not yet been
   observed in the dedicated vault.
2. Supply merchant identifiers and the remaining Mercado Pago/PayPal sandbox
   configuration, plus a current BRL quote. Current application startup requires
   all three providers. A Stripe-only startup would need a separately tested
   configuration change; it is not silently enabled by this infrastructure work.
3. Prepare full runtime from the same vault and a synthetic artifact; retain
   existing initialized database/client secrets and persistent state.
4. Activate app/worker, then prove real application login/session/logout and buyer
   isolation, followed by Stripe checkout, genuine webhook verification and exact
   artifact download. Repeat with the other providers and failure/recovery cases.

## Open Questions

Merchant test credentials/identifiers, endpoint signing configuration and BRL
quote remain necessary inputs. Offline age-key backup and encrypted off-server
retention remain operator work. Temporary Keycloak bootstrap admin replacement
with a durable operator administration arrangement remains open; no public admin
console is exposed. Production policy, license, release, onboarding and refunds
remain owned by [STAGING-PLAN.md](STAGING-PLAN.md#open-questions).
