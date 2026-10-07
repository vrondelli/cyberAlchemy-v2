# Alpine application-image promotion evidence

Date: 2026-09-20

This record covers the application and worker image only. It is staging
deployment evidence, not production approval, a security certification, or a
license clearance.

## Candidate identity

- Source promoted to canonical `deploy/Dockerfile`, SHA-256
  `8d16fa81190e54d9fd0cdec6f2d30c446e4966249259d9a7251cb2396eb4283d`.
- Base: Node 26.8.1 on the exact Alpine 3.24 manifest
  `sha256:ad6400dee476b06e82d0ee3a088e2d7555f6e6569c346e61d69e14d0f19e8c2b`.
- Build candidate: `keld-sandbox:alpine-security-candidate-20260920-r1`.
- Promoted staging tag: `keld-sandbox:security-plan-20260920-r11`.
- Exact image ID:
  `sha256:426ccdeb6c033a5f21f9bb841e2fd9d5e0b384373a2934059ab63138f5b337d3`.
- Runtime identity: UID/GID `10001:10001`; npm and npx are absent from the
  final image.

The final stage upgrades Alpine packages, installs only CA certificates and
Python in addition to the Node runtime, installs production npm dependencies,
removes npm/npx, and retains the existing read-only Compose runtime controls.

## Pre-promotion evidence

- `deploy/test_security_plan.py`: 9/9 passed, including the Alpine image
  invariants.
- The complete deployment test discovery passes 46/46, including the canonical
  Dockerfile and release-manifest input assertions.
- A no-network container check observed Node 26.8.1, Python 3.14.7, the expected
  non-root identity, the application runtime, and no npm binary.
- Trivy 0.74.0, pinned by digest, scanned the exact image without
  `--ignore-unfixed`: zero vulnerability records and zero secret records.
  Private report:
  `/opt/keld-staging/security-evidence/trivy-app-alpine-candidate-r1-20260920T1124Z.json`,
  SHA-256
  `ee1c81ad0b6028fb9109763853df4e1c9c633b9cce563d9fa3cfff6ab32eecfc`.
- A CycloneDX 1.6 SBOM contains 93 components. Private report:
  `/opt/keld-staging/security-evidence/sbom-app-alpine-candidate-r1-20260920T1128Z.cdx.json`,
  SHA-256
  `ca607d04781667e79e2269550d1d0da6898e35585d8abf4bd5b3fec485a61417`.
- The full license classifier produced 109 repeated file/header matches.
  Private report:
  `/opt/keld-staging/security-evidence/licenses-app-alpine-candidate-r1-20260920T1128Z.json`,
  SHA-256
  `dde29a3b68d668d3f898dd750e3efe5e0cf48cc3085eb8d3fda9d4b55b55e655`.
  These matches are triage input, not 109 unique obligations or legal approval.
- All three reports were copied, hash-verified, and restricted to mode `0600`
  off the VPS under
  `/home/vlad_/.local/share/keld-staging-operator/security-evidence/alpine-candidate-r1-20260920T1128Z/`.

The disposable Compose rehearsal passed all 15 checks: database migrations,
issuer discovery, backend-TLS exclusion, web and public-readiness behavior,
ARE host and route isolation, host rejection, worker secret separation,
production-input enforcement, ARE network/runtime hardening, and absence of
published backend ports. It used synthetic credentials and policy values over
a loopback HTTP proxy; it did not prove public TLS, browser OIDC, merchant
services, model invocation, or production deployment.

## Staging promotion and rollback boundary

Before cutover, the existing online state was captured and independently
verified at
`/opt/keld-staging/backups/full-state-pre-alpine-r11-20260920T1135Z/`.
The prior `security-plan-20260920-r10` image remains available as the immediate
application rollback input.

Only the `web` and `worker` services were recreated. Both became healthy on the
exact image above. The old r13 manifest then failed verification on the
intentional image drift. The immediate post-image replacement manifest was:

`/opt/keld-staging/release-manifests/staging-r14-alpine-app-20260920T1132Z.json`

SHA-256:
`d834e7bca432670ddeca321caad5eee2b552095b646a2ac7da990443b5e10073`.
Its mode-`0600` off-VPS copy matches. The full monitor passed at
`2026-09-20T11:31:15Z` with no failures, all seven HTTP checks, semantic ARE
availability and retention, quote validation, and exact-release verification.
All nine KELD/ARE containers were running and every health-checked service was
healthy after the cutover.

The implementation review then found that canonical rebuild provenance still
pointed at the old Debian Dockerfile. The tested Alpine file was promoted to
`deploy/Dockerfile` without changing its SHA-256, and that input was added to
the release-manifest allowlist. The r14 manifest correctly detected this source
drift. The 27-input, nine-container r15 manifest was:

`/opt/keld-staging/release-manifests/staging-r15-app-provenance-20260920T1137Z.json`

SHA-256:
`79e3fffe248492b0d6be9974f4844b386d360847c0b278be0f8b28be9848bf1e`.
It records the canonical Dockerfile hash above, has a matching mode-`0600`
off-VPS copy, and passed the full monitor at `2026-09-20T11:36:58Z` with seven
HTTP checks and no failures. This closes the rebuild-regression gap without
recreating any container.

The persistent timer independently repeated the exact r15 manifest, quote,
semantic ARE, and seven-route checks at `2026-09-20T11:42:22Z`; it was healthy
with no failures.

A later provenance audit found that r15 still did not bind the build context.
The preserved context has zero Trivy secret findings, and all 82 runtime-source
files match the exact deployed image byte-for-byte. The schema-v3 successor
binds the 27 deployment inputs plus all 84 context files and their modes, byte
counts, and hashes:

`/opt/keld-staging/release-manifests/staging-r16-app-source-provenance-20260920T1255Z.json`

SHA-256:
`10cd917694eb71401b083e668d910eeabe5f8af3a4cc369a02b856946c83577e`.
The full monitor passed r16 at `2026-09-20T12:55:07Z`; the timer remains active.
This manifest-only upgrade did not rebuild or restart the application.

A post-cutover real-Chromium journey then loaded the storefront with zero
console errors, opened the shop, added the USD 200 sandbox item, reached the
anonymous checkout sign-in gate, and followed account creation to the KELD
realm registration form with PKCE S256. In a separate tab, ARE loaded at `/`,
opened the session-preferences panel, completed one bounded live chat turn
without `intent-output-invalid`, reported one route decision and two context
messages, and returned to zero context/fresh routing after **Start fresh**.
The browser session was closed; the consumed demo allowance correctly remained
at 19 turns because clearing context does not refund provider usage.

## Decision impact

The old r10 Debian application report remains valid historical evidence for
that rollback image. It is no longer the live application dependency
inventory. The exact r11 application image has zero raw vulnerability and
secret records in its recorded scan. It is now the immediate rollback input for
the r12 fixed-rate successor, whose exact scan has zero High/Critical and zero
secret findings. Production remains on hold for the live
Keycloak findings, owner-controlled payment/account/chat policies, external
alerting, recovery ownership, artifact/license/support approval, and the final
canary/go-no-go gates.
