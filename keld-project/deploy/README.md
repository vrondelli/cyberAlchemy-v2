# KELD sandbox VPS deployment

This is the reusable deployment candidate for a Linux VPS. The current staging
deployment is tracked separately in `../docs/STAGING-STATUS.md`; do not infer its
state from this generic package. This package uses the copied
[secret store](../vendor/secret-management/README.md) for operator-side custody;
the application gets individual files, not the vault or age identity.

## What is included

- Digest-pinned Node, PostgreSQL, Keycloak and Caddy base images.
- KELD web and worker containers, running as UID 10001, with read-only roots,
  bounded logs, process/memory limits and private backend networking.
- PostgreSQL runs directly as UID 70 with a read-only root and a separately
  provisioned `.runtime/postgres` data directory; it does not use root startup
  or a Docker-managed data volume.
- Separate PostgreSQL databases/roles for Keycloak and KELD sessions.
- A private SQLite commerce directory shared by one web and one worker.
- Initial Keycloak realm/client with exact callback URL, PKCE S256, audience mapper,
  300-second access tokens and no password-grant/service-account flow.
- File-secret input, public HTTPS origin/private HTTP listener separation,
  readiness, graceful draining and at most two concurrent archive downloads.
- Store-backed provisioning, explicit UID permissions and local smoke tests.
- An operator-invoked, fail-closed full-state backup command for commerce,
  Keycloak, and session state. Encryption, scheduling, retention, and off-site
  custody remain operator responsibilities.
- An integrated anonymous-public ARE documentation/chat candidate on its own
  canonical host. The browser-facing page is `/`; `/are/` redirects to `/`, while
  the isolated runtime keeps `/are/api/are/*` internally. Its edge, chat, broker
  and provider gateway keep separate networks and no host ports.

Only Caddy publishes ports 80/443. KELD, worker, PostgreSQL, Keycloak and all
four ARE services have no host-published ports. Keep SSH key-based and
restricted at the VPS firewall.
Supply three DNS names (`KELD_DOMAIN`, `AUTH_DOMAIN`, and `ARE_DOMAIN`) pointing
to the VPS. Caddy obtains public TLS certificates.
The Keycloak admin UI uses its normal authenticated HTTPS endpoint; restrict
administrative access according to the VPS access policy before accepting customers.

The web application still rejects live payment credentials. This setup does not
approve commercial release delivery, refunds, production payments or launch.

## 1. Prepare the source bundle

From the repository root:

```sh
VITE_ARE_PUBLIC_ORIGIN=https://are.example.com/ npm --prefix keld-project/web run build
python3 keld-project/deploy/build_bundle.py
docker build --pull=false -t keld-sandbox:candidate keld-project/deploy/.bundle
docker build --pull=false -f keld-project/deploy/Caddy.Dockerfile \
  -t keld-caddy:2.11.4-security-plan-20260920-r2 keld-project/deploy
```

Set `VITE_ARE_PUBLIC_ORIGIN` to `https://` plus the exact `ARE_DOMAIN` used by
Compose. The build rejects credentials, paths, query strings, fragments, custom
ports, and non-HTTPS destinations. The reviewed KELD deployment defaults to
`https://are.keld.studio/`, but reusable deployments should always pass their
explicit host so the storefront links and edge topology cannot drift.

The bundle contains allowlisted runtime source and the unchanged Auth Foundation
package. It excludes .runtime, secrets, the secret-store vault/key and ARE archives.
Existing .bundle output is refused; explicitly remove that generated directory
when rebuilding after code changes. Application code uses Node 26.8.1; the image
uses the digest-pinned Alpine 3.24 base in `Dockerfile`, upgrades its installed
packages, and provides Alpine Python for the ledger. The final image removes
npm/npx and runs as UID/GID `10001:10001`. Treat `Dockerfile` as a release input:
scan the exact built image without hiding unfixed findings, capture its SBOM and
license triage, and bind both its image ID and Dockerfile hash in the release
evidence before promotion. The operator secret-store tooling needs
Python 3.12+ and the exact pinned SOPS/age binaries listed in its README.

The Caddy build uses `Caddy.go.mod` and `Caddy.go.sum` generated with the pinned
Go toolchain and builds with `-mod=readonly`; it must not resolve or rewrite
module versions during an image build. Verify the complete module checksum set,
scan the resulting exact image, and record its image ID before changing the
Compose tag. A matching Caddy version string alone is not image identity.

The integrated Compose file intentionally does not rebuild ARE. First run the
ARE package, seccomp and runtime verification in
`../are-documentation`, then publish each approved image through the separately
authorized registry workflow. Set `ARE_EDGE_IMAGE`, `ARE_PUBLIC_CHAT_IMAGE`,
`ARE_INFERENCE_BROKER_IMAGE` and `ARE_PROVIDER_GATEWAY_IMAGE` to immutable
registry references containing `@sha256:`. Mutable tags and local image IDs are
test evidence, not production references. The Compose file also consumes the
reviewed sibling `../are-documentation/deploy/seccomp-node.json`; transfer that
exact file with the deployment candidate and verify the digest documented in
`../are-documentation/deploy/SECCOMP-PROFILE.md`.

## 2. Create a dedicated KELD sandbox vault

Run on the trusted operator workstation, where the pinned tools are installed.
Use absolute private paths chosen for KELD; do not select the personal default vault.

```sh
python3 keld-project/deploy/seed_infrastructure.py \
  --vault /PRIVATE/keld-sandbox/vault.yaml \
  --key /PRIVATE/keld-sandbox/age-key.txt
```

This initializes a new store if needed and creates missing database passwords,
OIDC client secret, session encryption key and Keycloak bootstrap password.
It never replaces existing records or prints material. Back up the age identity
offline, separately from the ciphertext; verify recovery before relying on it.

Add these six provider inputs using the copied store's hidden prompts:

- stripe: Stripe test API secret
- mercadopago: Checkout Transparente **Orders** test access token (`APP_USR-…`) from the application’s test credentials; never a real seller token
- paypal_client_id: PayPal sandbox client ID
- paypal_secret: PayPal sandbox client secret
- stripe_webhook: Stripe endpoint signing secret
- mp_webhook: Mercado Pago endpoint signing secret

Command pattern (repeat with the corresponding logical name):

```sh
PYTHONPATH=keld-project/vendor/secret-management python3 -m secret_management \
  --vault-file /PRIVATE/keld-sandbox/vault.yaml \
  --key-file /PRIVATE/keld-sandbox/age-key.txt \
  put stripe --purpose keld-sandbox
```

Create sandbox webhook registrations for /events/stripe, /events/mercadopago and
/events/paypal at the storefront origin. Their secrets/IDs must correspond to
those exact endpoints. For Mercado Pago select **Order (Mercado Pago)**, not the legacy Payments topic. See [Orders acceptance](../docs/MERCADO-PAGO-ORDERS-IMPLEMENTATION.md) before activating Pix. Registration and genuine event delivery are still
operator/provider steps; no registrations have been made by this implementation.

## 3. Prepare configuration and private runtime files

Copy settings.example.json to a private operator file. Set domains/issuer,
test merchant IDs, `mercadopagoApplicationId`, PayPal webhook ID, the PayPal
presentment currency (`BRL` for the validated Brazilian sandbox merchant),
explicit BRL quote policy (fixed or expiring), and a
synthetic artifact path. The quote example is intentionally invalid.

Generate a bounded proposal from the official BCB PTAX API without changing the
runtime:

```sh
python3 fetch_bcb_ptax.py --as-of YYYY-MM-DD --lookback-days 7
```

The command selects the latest USD sell quote in the window, preserves it as an
exact integer ratio, and records the source timestamp. It intentionally does not
choose a policy or apply anything. After the operator reviews the source, use
the separate atomic command with exactly one of `--expires-at` (one hour to
seven days in the future) or `--fixed`, then recreate only `web` and `worker`.
Never turn a successful fetch into automatic price activation. For the current
merchant-directed fixed 5.10 BRL/USD policy:

```sh
python3 quote_config.py /PRIVATE/keld.json \
  --numerator 510 \
  --denominator 100 \
  --reference merchant-fixed-5.10 \
  --fixed
python3 quote_config.py /PRIVATE/keld.json --status
```

`--fixed` writes `expiresAt: null`; status must report `fixed: true`, no expiry,
no remaining seconds, and `refreshRequired: false`. Existing checkout attempts
retain the quote frozen at creation time. Any rate change therefore affects only
new attempts and requires a new immutable release manifest after deployment.

```sh
python3 keld-project/deploy/prepare.py \
  --vault /PRIVATE/keld-sandbox/vault.yaml \
  --key /PRIVATE/keld-sandbox/age-key.txt \
  --settings /PRIVATE/keld-settings.json \
  --output keld-project/deploy/.runtime
```

Output includes plaintext runtime secret files, a private initial realm import
and a private initial database SQL file. These are deliberate provisioning outputs
and are ignored by Git; they must travel only over the authenticated deployment
channel. The original vault/key are not copied. Existing output is refused.

Install one separate model-provider credential at
`.runtime/secrets/are_model_api_key`; do not put it in `.env`, KELD's settings,
or the browser bundle. The file must be a regular non-symlink file and contain
only the credential. `install-permissions.sh` assigns it exclusively to the ARE
provider-gateway UID along with the other service-specific runtime permissions.

Copy `.env.example` to `.env`. Set the public domain/email/version fields, the
four immutable ARE image references, the owner-approved positive idle-retention
and spend ceilings, and the operator-verified positive provider rates. The
example deliberately leaves those policy/rate values blank; Compose rejects an
unset or empty value. Before transfer, run the production-input verifier shown
below. It rejects mutable/malformed image references, reused role-image digests,
and numeric values outside the runtime's syntax and implementation bounds. It
does not choose or approve policy values and does not print them. The domains
must agree with settings.json. Securely
transfer the deployment files, the exact sibling ARE seccomp profile,
source-only `.bundle` (or built KELD image), and `.runtime` to the VPS. Do not
transfer the operator's age identity or entire vault.

Optional workstation preflight after populating `.env`:

```sh
node --env-file=.env verify-production-inputs.mjs
```

## 4. Set permissions and start on the VPS

When upgrading an existing root-run Caddy container to the non-root edge image,
back up both named Caddy volumes before changing ownership. With the edge stopped,
run the bounded migration against the two exact Docker volume data directories,
then verify it before recreating the edge:

```sh
sudo ./migrate-caddy-storage.sh apply \
  /var/lib/docker/volumes/keld-staging_caddy_data/_data \
  /var/lib/docker/volumes/keld-staging_caddy_config/_data
sudo ./migrate-caddy-storage.sh verify \
  /var/lib/docker/volumes/keld-staging_caddy_data/_data \
  /var/lib/docker/volumes/keld-staging_caddy_config/_data
```

The script accepts only Docker named-volume `_data` directories, refuses
symlinks, stays on each volume filesystem, and verifies every entry is owned by
UID/GID `1001:1001`. The prior root-running Caddy image remains a compatible
rollback because root can read the migrated files; restore the volume archives
only if file contents, rather than ownership, changed.

Run inside the deployment directory after verifying the target machine:

```sh
sudo sh install-permissions.sh
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --build
docker compose --env-file .env ps
```

Ordinary Compose startup runs the same verifier as the hardened, networkless
`are-production-inputs` one-shot service. Every ARE service directly requires
its successful completion, so a mutable/malformed image reference, reused role
digest, or invalid numeric input prevents the ARE graph from starting. Use
`docker compose up` after changing these inputs; an operator-forced `--no-deps`
run or direct container invocation deliberately bypasses dependency controls
and is outside this deployment contract.

The permission script changes only .runtime and rejects symlink entries.
Files are assigned to the pinned images' service UIDs: KELD 10001, ARE 65532,
Keycloak 1000 and PostgreSQL 70. Do not change images/users without revisiting
those permissions. Run Compose through a trusted Docker operator account.

Keycloak performs its initial build/import/migrations and can take several minutes.
KELD readiness currently confirms its listener/session schema, not issuer
readiness. Verify issuer discovery at /realms/keld/.well-known/openid-configuration
on the auth domain before attempting login. Web starts before any customer is
admitted; public readiness details are hidden by the Caddy route.

Realm import and database initialization apply to empty state only. Re-running
prepare or replacing initial files does not rotate passwords in existing
databases or update an existing realm. Rotation requires coordinated changes
at the provider/database/issuer and service restart. Preserve the session key;
changing it makes old session ciphertext unreadable.

`Keycloak.Dockerfile` is an experimental downstream Bouncy Castle 1.85
candidate and is deliberately absent from every Compose file. Build and scan it
by exact image ID before using either rehearsal harness. The first harness
restores only Keycloak state and proves read-only health/discovery without a
published port:

```sh
./rehearse-keycloak-candidate.sh \
  keld-keycloak:26.7.4-bc185-candidate-r2 \
  /ABSOLUTE/PRIVATE/BACKUP \
  /ABSOLUTE/PRIVATE/EVIDENCE.json
```

The second harness restores Keycloak and session state, copies the commerce
database, assigns only disposable client/session secrets, and runs the exact app
behind a private TLS proxy for browser PKCE, renewal, logout, and two-buyer
isolation. It publishes no Docker port and waits for a bounded, schema-checked
browser receipt before recording evidence and cleaning up:

```sh
KELD_REHEARSAL_BROWSER_RECEIPT=/ABSOLUTE/PRIVATE/browser.json \
  ./rehearse-keycloak-app-candidate.sh \
  keld-keycloak:26.7.4-bc185-candidate-r2 \
  keld-sandbox:fixed-brl-5.10-20260920-r12 \
  /ABSOLUTE/PRIVATE/BACKUP \
  /ABSOLUTE/PRIVATE/sandbox.bin \
  /ABSOLUTE/PRIVATE/evidence.json
```

Both scripts are evidence tools, not promotion commands. See
[the candidate assessment](../docs/KEYCLOAK-BC185-CANDIDATE-2026-09-20.md)
for exact identities, results, and owner gates.

The candidate-specific
[`keycloak-bc185-candidate-r2.openvex.proposed.json`](keycloak-bc185-candidate-r2.openvex.proposed.json)
is an **unapproved review proposal**, not a scan input or deployment waiver. It
binds the two configuration-based `not_affected` proposals and the disputed
OpenJDK `under_investigation` record to the exact candidate SBOM subject. Verify
that binding and the absence of operational consumption with:

```sh
node verify-keycloak-bc185-candidate-vex-proposal.mjs
```

Do not pass the proposed file to `trivy --vex`, add it to Compose, or describe
the candidate as clean unless the security owner accepts and promotes an
approved exact-subject document. The raw scan remains the authoritative scan
record while review is pending.

License review must compare equivalent full-license scans, not report totals
from different scan modes. After scanning the exact stock and candidate images
with Trivy 0.74.0 using `--scanners license --license-full`, generate the
exact-image delta with:

```sh
python3 compare-keycloak-license-reports.py \
  /PRIVATE/licenses-keycloak-stock-full.json \
  /PRIVATE/licenses-keycloak-bc185-candidate-full.json \
  --output /PRIVATE/keycloak-bc185-license-delta.json
```

The comparator requires both OS-package and loose-file results, binds both
expected image IDs and the scanner version, refuses to overwrite its output,
and exits nonzero on any classifier delta. A zero delta is not legal clearance;
the license owner still decides notices, source-offer, and distribution duties.

Before exposing a newly imported realm, apply and verify both reversible realm
hardening steps from the deployment directory:

```sh
./harden-keycloak-realm.sh apply
./harden-keycloak-crypto-surface.sh apply
./harden-keycloak-realm.sh verify
./harden-keycloak-crypto-surface.sh verify
```

The first command enforces the reviewed brute-force policy. The second disables
the two unused WebAuthn registration required actions and refuses to proceed if
an external identity provider, enabled non-OIDC client, X.509-configured client,
unexpected active-flow binding, enabled WebAuthn execution, or enabled X.509
execution outside the guarded built-in client-authentication flow is present.
The Caddy configuration separately blocks public dynamic client registration
before the realm wildcard route. Normal password signup, OIDC, OTP, and
profile/account behavior remain available. Each script records separate private
rollback state and refuses to overwrite it. Run `rollback` only after reviewing
the saved state and the security consequence. This hardening narrows exposed
cryptographic input paths; it is not by itself a VEX acceptance or clean image
scan.

## 5. Acceptance and operational work

Verify real browser login/callback/logout, then one authenticated sandbox purchase,
verified webhook and exact download per provider. Self-registration is enabled
for the staging realm through the OIDC `prompt=create` flow. Registration uses
unique email addresses and the realm password policy. No user/password is
shipped in the realm. Email verification, password reset, SMTP delivery and the
production customer-onboarding policy remain unconfigured.

Separately verify that the ARE host `/` serves the page, `/are/` redirects to
`/`, `/are/api/are/status` reports the approved retention value, and
`/api/are/status` and `/area` do not reach ARE. Also verify that the storefront
host does not serve the ARE page at `/are/`, and no ARE backend has a
host-published port. A status/readiness response does
not authorize a model call. Public chat remains anonymous for now and has no
commerce privileges; deployment-wide abuse identity and the review trigger for
that temporary choice remain owner decisions.

Before production: approve license/release and refund/dispute behavior, configure
off-server encrypted backups and prove restoration, choose monitoring/alerting,
test rollback and recovery, and review the exact VPS exposure. No backup
scheduler is installed by this package. The bounded backup/restore procedure is
documented in [FULL-STATE-BACKUP-RESTORE.md](../docs/FULL-STATE-BACKUP-RESTORE.md);
it does not upload, retain, rotate, or delete backups. Do not run
`docker compose down --volumes` against state you need to preserve.

New full-state backups run `verify_full_state_backup.py` before publication.
After decrypting or transferring a recovery point, run the same secret-silent
verifier again; it checks the exact private member set, image-ID syntax, seven
checksums, two PostgreSQL custom-dump signatures, runtime JSON shape, and SQLite
integrity without displaying configuration values:

```sh
python3 /opt/keld-staging/verify_full_state_backup.py \
  /PRIVATE/decrypted/full-state-YYYYMMDDTHHMMSSZ
```

Before the release capture, record the source payloads from the exact ARE image
IDs. This operation uses `docker create` and `docker cp`; it never starts the
images or reads runtime-mounted secrets. The output directory must not already
exist:

```sh
./capture_are_source_provenance.py \
  /opt/are-keld-presentation/source-provenance \
  --edge-image sha256:EXACT_IMAGE_ID \
  --public-chat-image sha256:EXACT_IMAGE_ID \
  --inference-broker-image sha256:EXACT_IMAGE_ID \
  --provider-gateway-image sha256:EXACT_IMAGE_ID
```

The receipt preserves each package's declared manifest and an independently
hashed observed `/srv` tree. Build-generated missing, additional, or changed
files are recorded as differences instead of being silently accepted. This
evidence binds image contents; it is not a clean-room rebuild or production
approval.

Capture the complete current custom-image set by exact local image ID. Repeat
`--image` once per unique custom image; do not include two services that share
the same image ID:

```sh
./capture_custom_image_archive.py \
  /PRIVATE/images/keld-custom-images-YYYYMMDDTHHMMSSZ \
  --image keld-app=sha256:EXACT_IMAGE_ID \
  --image keld-edge=sha256:EXACT_IMAGE_ID \
  --image keld-postgres=sha256:EXACT_IMAGE_ID \
  --image are-edge=sha256:EXACT_IMAGE_ID \
  --image are-public-chat=sha256:EXACT_IMAGE_ID \
  --image are-inference-broker=sha256:EXACT_IMAGE_ID \
  --image are-provider-gateway=sha256:EXACT_IMAGE_ID
```

The command refuses mutable references and existing outputs, validates each
local image ID, saves a deterministic private gzip archive, and verifies every
OCI blob digest plus the expected index/manifest image counts. It does not read
runtime secrets. Verify recovery against a dedicated empty Docker engine using
the containerd snapshotter image store:

```sh
python3 verify_custom_image_archive_recovery.py \
  --docker-host unix:///PRIVATE/empty-engine/docker.sock \
  --archive /PRIVATE/images/keld-custom-images-YYYYMMDDTHHMMSSZ/images.tar.gz \
  --capture-receipt /PRIVATE/images/keld-custom-images-YYYYMMDDTHHMMSSZ/receipt.json \
  /PRIVATE/recovery/keld-custom-images-YYYYMMDDTHHMMSSZ.json
```

The verifier requires zero starting images and containers, validates both input
hashes, loads the archive, and requires every exact manifest ID with zero
containers before and after. A classic graphdriver such as `vfs` can return
success while exposing config IDs instead; that is not equivalent evidence and
is rejected. Required retagging, service restore, fresh release manifest, and a
traffic drill remain separate admission gates.

The genuine Mercado Pago and PayPal webhook gate uses the phased, read-only
evidence verifier documented in
[`PROVIDER-WEBHOOK-RECOVERY-ACCEPTANCE.md`](../docs/PROVIDER-WEBHOOK-RECOVERY-ACCEPTANCE.md):

```sh
python3 ./capture_webhook_recovery_evidence.py begin \
  /opt/keld-staging/.runtime/commerce/commerce.db \
  /opt/keld-staging/.runtime/artifacts/sandbox.bin \
  /PRIVATE/webhook-run.json \
  --provider mercadopago
```

The tool does not control services or contact providers. It binds the worker
name plus immutable Docker container and image IDs across a healthy baseline,
an explicit stopped checkpoint before
delivery, stopped receipt, and healthy processing/redelivery phases; compares
keyed, privacy-safe ledger snapshots; and fails on concurrent commerce. Mercado Pago
uses full settlement-recovery mode. PayPal uses idempotent-replay mode because
capture is intentionally initiated only by an authenticated KELD action. The
separate post-capture/pre-ledger crash window is not claimed without an approved
fault-injection test.

Run the opt-in public browser acceptance from a trusted Playwright runtime with
an absolute package path, browser executable, and new private output directory:

```sh
KELD_LIVE_BROWSER_TEST=1 \
PLAYWRIGHT_MODULE=/ABSOLUTE/TRUSTED/playwright-core \
CHROMIUM_EXECUTABLE=/ABSOLUTE/TRUSTED/chromium \
node ./live_public_browser_acceptance.mjs /PRIVATE/NEW/browser-evidence
```

The verifier visits only the three public KELD hosts, enters but does not submit
the PKCE registration form, sends one synthetic ARE chat turn, exercises
preference inspection/forget and session reset, and checks route isolation plus
mobile layout. It creates no account or checkout and stores no response text,
cookies, credentials, or authorization headers. Its receipt and screenshots are
created with mode `0600`; the receipt is browser evidence, not a release manifest
or production authorization.

Capture a privacy-safe receipt of completed provider-paid deliveries from the
live ledger before freezing the release manifest:

```sh
./capture_paid_delivery_evidence.py \
  /opt/keld-staging/.runtime/commerce/commerce.db \
  /opt/keld-staging/.runtime/artifacts/sandbox.bin \
  /opt/keld-staging/security-evidence/provider-paid-delivery-YYYYMMDDTHHMMSSZ.json
```

The command reads SQLite without mutating it, refuses an existing output, and
requires at least one provider-confirmed paid journey with a consumed grant for
each of Stripe, Mercado Pago, and PayPal. Every row must bind the exact artifact
hash and byte count. The mode-`0600` receipt excludes customer, account, order,
remote-payment, and payer-email identifiers. It proves paid ledger state and
consumed delivery grants; it does not prove browser rendering, signed webhook
delivery/replay, refund policy, or production authorization. Install the reviewed
receipt as `baseline/current-provider-paid-delivery.json` before manifest capture
so schema v3 binds it with the capture tool.

Capture the exact running KELD and ARE release only after both Compose projects
are healthy and the ARE source-provenance directory has been verified:

```sh
./capture_release_manifest.py capture \
  /PRIVATE/release-manifests/staging-release-YYYYMMDDTHHMMSSZ.json \
  --keld-dir /opt/keld-staging \
  --are-dir /opt/are-keld-presentation \
  --keld-app-context /opt/keld-staging/EXACT-APPLICATION-BUILD-CONTEXT
./capture_release_manifest.py verify \
  /PRIVATE/release-manifests/staging-release-YYYYMMDDTHHMMSSZ.json
```

The schema-v3 command refuses an existing output, missing/symlinked inputs, an unexpected
running service set, a stopped/unhealthy service, or invalid Docker inspection
data. It records hashes for an explicit non-secret input allowlist plus exact
image IDs, configured image references, Compose config hashes, users, read-only
roots, capabilities, security options, PID limits, networks, and published
ports for all nine KELD/ARE services. It also binds every regular file, mode,
byte count, and SHA-256 in the explicitly selected application build context,
as well as the ARE declared/observed source manifests and their receipt.
Unexpected top-level entries, symlinks, dependency directories, credential-like
files, and unbounded trees fail closed. Existing schema-v2 manifests remain
verifiable during migration, but new captures require the exact build context.
It never reads `.env`, Keycloak realm
imports, database initialization, rollback state, or secret files. `verify`
recomputes the same evidence and fails on any drift. Treat the manifest as
private operational topology even though its schema excludes secret material.

Install the local fail-closed monitor by linking the reviewed units from the
deployment directory, then enable the timer:

```sh
systemd-analyze verify \
  /opt/keld-staging/keld-staging-monitor.service \
  /opt/keld-staging/keld-staging-monitor.timer
systemctl link \
  /opt/keld-staging/keld-staging-monitor.service \
  /opt/keld-staging/keld-staging-monitor.timer
systemctl daemon-reload
systemctl enable --now keld-staging-monitor.timer
systemctl start keld-staging-monitor.service
```

Every five minutes it verifies the newest immutable manifest, all expected
container health/configuration, service-specific storefront/issuer/ARE response
content, private readiness denial, and dynamic-client-registration denial. A
generic HTTP 200 from the wrong page fails the positive probes. Requests are
limited to the three explicit HTTPS hosts and refuse redirects, URL credentials,
fragments, and custom ports. Its mode-`0600` state
also includes a no-model-call semantic ARE chat-status probe. That probe requires
the chat to be configured, live, conversation-only, process-memory backed,
available, and set to the expected 1,800-second retention. The state also
includes the non-secret BRL quote status; expiry or entry into the
24-hour refresh window fails the run. Its mode-`0600` state is
`/var/lib/keld-staging-monitor/state.json`; failures make the oneshot unit
fail and remain in the journal/systemd state. The unit uses a strict filesystem
sandbox and retains only `CAP_DAC_READ_SEARCH`, required to hash the reviewed
private runtime config/artifact without granting mutation. Docker-socket access
is nevertheless operator-equivalent privilege; keep the script and unit under
trusted root-owned release custody. This is local detection only. Configure and
prove an owner-approved external alert receiver before production.

The release also stages a credential-safe HTTPS success-heartbeat sender, but
does not activate it or invent an alert destination. The receiver must alert on
a missed heartbeat; the sender deliberately refuses unhealthy/stale state,
non-HTTPS URLs, redirects, and non-2xx responses. It sends only the monitor
timestamp, release-manifest digest, quote expiry, and health flag. After the
owner chooses a receiver and places its URL in a private local file, install it
without putting the URL in shell history:

```sh
install -d -o root -g root -m 0700 /etc/keld-staging-monitor
install -o root -g root -m 0600 /PRIVATE/heartbeat-url \
  /etc/keld-staging-monitor/heartbeat-url
install -d -o root -g root -m 0755 \
  /etc/systemd/system/keld-staging-monitor.service.d
install -o root -g root -m 0644 \
  /opt/keld-staging/keld-staging-monitor-heartbeat.conf.example \
  /etc/systemd/system/keld-staging-monitor.service.d/heartbeat.conf
systemctl daemon-reload
systemctl start keld-staging-monitor.service
```

Confirm both the unit success and receipt at the external receiver, then leave
the existing timer enabled. Configure the receiver to alert the named incident
owner after the approved missed-heartbeat interval. Until that observation and
recipient test exist, external alerting remains an open gate.

Temporary archive snapshots have a per-request 256 MiB ceiling and two concurrent
slots. Scratch tmpfs is capped at 600 MiB; memory and disk pressure must be monitored.
KELD reads secrets directly; Keycloak's wrapper reads files and exports only its
two required credentials into its own process environment. These are not secret
values in Docker's configured environment, but privileged process access can
still read them.

## Validation

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s keld-project/vendor/secret-management/tests -p 'test_*.py'
PYTHONDONTWRITEBYTECODE=1 python3 keld-project/deploy/test_prepare.py
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest \
  keld-project/deploy/test_full_state_backup.py
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest \
  keld-project/deploy/test_keycloak_crypto_surface.py
node --test keld-project/deploy/test-production-inputs.mjs
npm --prefix keld-project/integrations test
PYTHONDONTWRITEBYTECODE=1 python3 keld-project/deploy/smoke.py
```

The container smoke requires the four locally built ARE security-candidate
images, existing pinned infrastructure images, the built KELD image, Docker
Compose supporting `!override`, and ubuntu:24.04 for temporary permission setup.
It creates a synthetic vault and disposable stack, publishes only a random
loopback HTTP port, verifies exact `/are/` routing plus ARE runtime/network
isolation and successful enforcement of the production-input dependency, and
removes its containers/volumes/private files. It makes no model
or merchant call and does not test public TLS or browser OIDC. Never use its
synthetic credentials, prices, limits, or retention value in deployment.

## Infrastructure-only staging

Use `compose.infrastructure.yaml` before merchant configuration exists. It starts
only PostgreSQL, Keycloak and Caddy, returns 503 for the staging storefront, and
proxies only the test realm and Keycloak resources. Public administration and the
master realm are blocked. Operator administration uses a controlled internal
connection, not an exposed admin console. Automatic HTTPS needs no invented
contact email in this bootstrap configuration.

Run `prepare.py --infrastructure-only` with the same explicit vault/key arguments
as above and settings containing only `origin` and `issuer`. This consumes the six
generated infrastructure secrets and writes no merchant configuration or fixture.
Validate with `python3 deploy/smoke_infrastructure.py` from the KELD project root.

On this VPS the stable deployment directory is `/opt/keld-staging` and the command is:

```sh
sudo sh install-permissions.sh --infrastructure-only
docker compose -p keld-staging -f compose.infrastructure.yaml --env-file .env up -d
```

Infrastructure-only permission mode rejects an ARE model key and does not
require merchant or ARE inputs. Full deployment mode (no flag) still requires
the dedicated gateway model key and assigns it only to UID 65532.

Keep the dedicated operator vault at an explicit private workstation path, for
example `/PRIVATE/keld-staging-operator/vault.yaml`; keep its age identity at
`/PRIVATE/keld-staging-operator/identity/age-key.txt`. Neither is transferred to
the VPS. Do not infer these files from the checkout user's home directory after
a repository or account move. Add Stripe through hidden prompts from the
repository root:

```sh
PYTHONPATH=keld-project/vendor/secret-management python3 -m secret_management \
  --vault-file /PRIVATE/keld-staging-operator/vault.yaml \
  --key-file /PRIVATE/keld-staging-operator/identity/age-key.txt \
  put stripe --purpose keld-staging
```

Repeat with `stripe_webhook` for its signing secret after registering the sandbox
endpoint `https://staging.keld.studio/events/stripe`. While maintenance is active,
that endpoint returns 503; no event delivery is claimed until app activation.
Use the same vault for later full provisioning so database/client secrets match
the initialized services. Prepare full output into a new directory and transfer
only new app settings, payment files and artifact into the stable runtime;
never replace live commerce data or reinitialize database volumes.
The full application still requires all three merchant configurations.

## Open Questions

VPS address/operator, domains, merchant sandbox values, issuer administration,
BRL quote ownership, ARE registry digests, model credential, retention and
spend/rate values, anonymous-public abuse identity/review trigger, backup targets,
customer onboarding and production policy remain owner/operator inputs. The
[deployment design](../docs/VPS-AND-SECRETS.md)
and [integration contract](../docs/SDK-INTEGRATION.md#open-questions) own the
remaining release requirements.
