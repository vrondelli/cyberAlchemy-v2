# KELD sandbox VPS deployment

This is a deployment candidate for a fresh Linux VPS. It uses the copied
[secret store](../vendor/secret-management/README.md) for operator-side custody;
the application gets individual files, not the vault or age identity.
No VPS was contacted and no real merchant credentials were provisioned.

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
- An integrated anonymous-public ARE documentation/chat candidate at the exact
  `/are/` and `/are/api/are/*` surface, behind the same Caddy ingress. Its edge,
  chat, broker and provider gateway keep separate networks and no host ports.

Only Caddy publishes ports 80/443. KELD, worker, PostgreSQL, Keycloak and all
four ARE services have no host-published ports. Keep SSH key-based and
restricted at the VPS firewall.
Supply two DNS names pointing to the new VPS. Caddy obtains public TLS certificates.
The Keycloak admin UI uses its normal authenticated HTTPS endpoint; restrict
administrative access according to the VPS access policy before accepting customers.

The web application still rejects live payment credentials. This setup does not
approve commercial release delivery, refunds, production payments or launch.

## 1. Prepare the source bundle

From the repository root:

```sh
python3 keld-project/deploy/build_bundle.py
docker build --pull=false -t keld-sandbox:candidate keld-project/deploy/.bundle
```

The bundle contains allowlisted runtime source and the unchanged Auth Foundation
package. It excludes .runtime, secrets, the secret-store vault/key and ARE archives.
Existing .bundle output is refused; explicitly remove that generated directory
when rebuilding after code changes. Application code uses Node 26.8.1; the image
provides Debian's Python for the ledger. The operator secret-store tooling needs
Python 3.12+ and the exact pinned SOPS/age binaries listed in its README.

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
explicit BRL quote policy/expiry, and a
synthetic artifact path. The quote example is intentionally invalid.

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

## 5. Acceptance and operational work

Verify real browser login/callback/logout, then one authenticated sandbox purchase,
verified webhook and exact download per provider. Self-registration is enabled
for the staging realm through the OIDC `prompt=create` flow. Registration uses
unique email addresses and the realm password policy. No user/password is
shipped in the realm. Email verification, password reset, SMTP delivery and the
production customer-onboarding policy remain unconfigured.

Separately verify that `/are/` serves the ARE page, `/are/api/are/status` reports
the approved retention value, `/api/are/status` and `/area` do not reach ARE,
and no ARE backend has a host-published port. A status/readiness response does
not authorize a model call. Public chat remains anonymous for now and has no
commerce privileges; deployment-wide abuse identity and the review trigger for
that temporary choice remain owner decisions.

Before production: approve license/release and refund/dispute behavior, configure
off-server encrypted backups and prove restoration, choose monitoring/alerting,
test rollback and recovery, and review the exact VPS exposure. No backup
scheduler or full restore procedure is installed by this package. Do not run
docker compose down --volumes against state you need to preserve.

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

The dedicated operator vault is at
`/home/vrondelli/.local/share/keld-staging-operator/vault.yaml`; its identity is
`identity/age-key.txt` under the same private directory. Neither is transferred
to the VPS. Add Stripe through hidden prompts from the repository root:

```sh
PYTHONPATH=keld-project/vendor/secret-management python3 -m secret_management \
  --vault-file /home/vrondelli/.local/share/keld-staging-operator/vault.yaml \
  --key-file /home/vrondelli/.local/share/keld-staging-operator/identity/age-key.txt \
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
