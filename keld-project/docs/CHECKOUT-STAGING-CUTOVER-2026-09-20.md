---
title: KELD Checkout Redesign Staging Cutover Envelope
status: deployed-staging-test-candidate
updatedAt: 2026-09-20
owner: KELD product owner and staging operator
scope: replace staging web and worker with the exact checkout-redesign candidate
authorityEffect: staging
---

# KELD Checkout Redesign Staging Cutover Envelope

This is the exact reversible publication envelope for the checkout redesign.
The product owner explicitly approved this candidate and effect set, and the
bounded staging deployment completed on 2026-09-21 UTC. The authorization did
not extend to production or to any service or state outside the effect set
below.

## Frozen identities

| Role | Identity |
| --- | --- |
| Current live application and worker | `keld-sandbox:fixed-brl-5.10-20260920-r12` |
| Current live image ID | `sha256:ce4f9a238238d2a36ec0c1a5c97f3eccd24fd2b13e7415bcedb7f9430e4fee3e` |
| Candidate application and worker | `keld-sandbox:checkout-redesign-20260920-r1` |
| Candidate image ID | `sha256:ea28cdcc35e5ceb3e65be5612fb048468eaf6d40906e8eeab3f087091cc4f705` |
| Candidate source context | 84 files; 2,699,315 bytes |
| Context file-entry digest | `sha256:3cd3271d3290d9bdaf5a2d958369288cc396a158a2d5031708273e1eff7ade6b` |
| Private image archive | `keld-checkout-redesign-r1.tar`; 88,204,288 bytes |
| Archive SHA-256 | `b042f1fc39c978c41a40985ed682d2e14e6253d607f526a80422721fda657db7` |
| Archive receipt SHA-256 | `5d131252df015e44158ae03a6214f0fca3b2f046fd2a4400a94b2a6cc6d80732` |

The archive and receipt are private mode-`0600` operator files under
`/home/vlad_/.local/share/keld-staging-operator/security-evidence/checkout-redesign-r1-20260920/`.
All 15 OCI blob names match their content digests and the OCI index names the
exact candidate image ID.

## Already-passed admission evidence

- frontend tests: 19/19;
- integration tests: 96/96;
- deployment/security tests: 76/76;
- portable staged runtime: passed;
- Chrome 153 production-bundle journey: passed at 1440, 1024, 768, 390, and
  320 pixels with zero page errors and no horizontal overflow;
- one create across reload, one confirmation, exact fixture download,
  terminal-only restart, and logout: passed;
- exact-image non-root, read-only, no-network smoke: passed;
- digest-pinned Trivy 0.74.0 exact-image scan: zero High/Critical
  vulnerabilities and zero secret findings.

These checks admit a staging candidate. They do not substitute for genuine
provider acceptance on the deployed image.

## Executed staging result

- The verified online recovery point is
  `/opt/keld-staging/backups/full-state-pre-checkout-redesign-20260921T012840Z`.
  Its standalone verifier passed all archive membership, checksum, SQLite,
  PostgreSQL catalog, image-ID, and private-mode checks.
- The candidate archive and exact 84-file source context were hash-verified on
  the VPS before the exact image was loaded.
- Only `web` and `worker` were recreated. Caddy, PostgreSQL, Keycloak, and ARE
  retained their pre-cutover container identities.
- Two initial browser-gate attempts safely exercised the documented rollback
  after the harness looked for the obsolete `#main-nav` selector. Captured
  diagnostics showed the rendered accessible navigation was `#primary-nav`,
  with no page, console, request, or server errors. The selector was corrected
  to the accessible `Shop` link before the final bounded retry.
- The final live Chrome 153 gate passed at 1440, 1024, 768, 390, and 320 pixels.
  Storefront entry, checkout focus, cancellation preservation, return-route
  non-authority, no-overflow, and zero-error checks passed without creating a
  provider payment.
- The successor schema-v3 manifest is
  `staging-r24-checkout-redesign-20260921T0148Z.json`, SHA-256
  `cbbe3be0a46041df993f6d9a9ddeb61e4e5a1ceff32abcac6476787526ab24b9`.
  Its VPS and private off-VPS copies match, and both direct and scheduled
  monitor runs passed.
- The live quote remains fixed at `510/100`, reference
  `merchant-fixed-5.10`, with no expiry. Signup entry redirects to the expected
  KELD realm registration surface.

The candidate is now the controlled staging test release. W11 genuine sandbox
journeys remain open and are not inferred from the non-payment browser gate.

## Authorized effects if approved

The cutover may:

1. transfer and hash-verify the exact private candidate archive and source
   context to `/opt/keld-staging`;
2. create one new verified online full-state backup without stopping services;
3. load and tag the exact candidate image;
4. change `KELD_VERSION` to `checkout-redesign-20260920-r1`;
5. recreate only the `web` and `worker` services;
6. capture a successor schema-v3 release manifest and a private browser receipt;
7. restore `KELD_VERSION=fixed-brl-5.10-20260920-r12` and recreate only `web`
   and `worker` if a rollback trigger fires.

It may not modify provider credentials, webhooks, quote policy, commerce or
identity data, Keycloak, PostgreSQL, Caddy, ARE services, DNS, firewall rules,
production infrastructure, or repository Git history. It may not delete the
current image, existing recovery points, or current r23 evidence.

## Ordered execution

1. Re-read the live `web` and `worker` image IDs and health; stop if either no
   longer matches the frozen baseline above.
2. Run the current release-manifest verifier and staging monitor; stop on drift
   or any failed route, quote, ARE, identity, or health check.
3. Create a new `backup-full-state.sh online` recovery point and run the
   standalone verifier. Preserve its exact path and checksums.
4. Transfer the candidate archive, receipt, and exact application build context
   over the authenticated operator channel. Require matching local and remote
   SHA-256 values before loading anything.
5. Load the archive and require the candidate image ID above. Verify UID/GID
   `10001:10001`, runtime controls, and the expected compiled checkout payload.
6. Update only the staging `KELD_VERSION`, render Compose, and confirm that only
   `web` and `worker` will change.
7. Recreate only `web` and `worker`. Wait for both health checks; do not restart
   any other service.
8. Run public route, authentication entry, `/checkout`, return/cancel,
   fixed-5.10 quote, ARE isolation, semantic status, and full monitor checks.
9. Run a fresh private browser journey for storefront-to-checkout navigation,
   focus, mobile overflow, refresh/idempotency, cancellation preservation, and
   absence of browser errors. Do not create a provider payment in this smoke.
10. Capture and verify the successor schema-v3 release manifest against the
    transferred exact application build context. Copy the private receipt
    off-VPS and verify its hash.
11. After the non-payment gate passes, run W11 with a deliberate sandbox buyer:
    one Stripe, Mercado Pago, and PayPal journey through server verification and
    exact-artifact delivery. Preserve privacy-safe evidence and do not infer
    payment from provider return URLs.

## Immediate rollback triggers

Rollback before provider testing if any of these occurs:

- `web` or `worker` is unhealthy or restarts unexpectedly;
- `/`, `/checkout`, `/purchase/return`, `/purchase/cancel`, authentication
  entry, readiness, or the full staging monitor fails;
- the browser reports a KELD-origin failed request, uncaught page error,
  horizontal overflow at 320 pixels, missing checkout focus, or duplicate
  checkout creation after refresh;
- the configured fixed quote differs from `510/100`, reference
  `merchant-fixed-5.10`, or reports an expiry;
- any service other than `web` or `worker` changes identity or runtime state;
- release-manifest capture or verification fails.

Rollback means restoring only `KELD_VERSION=fixed-brl-5.10-20260920-r12`,
recreating `web` and `worker`, requiring both healthy, and rerunning the current
monitor. Do not restore mutable state unless a separately diagnosed state
failure requires it; the UI-only candidate is not expected to migrate state.

## Close condition

The bounded deployment portion is complete: the exact candidate is healthy,
browser acceptance passes, the successor release manifest verifies, and
rollback evidence remains available. Full staging acceptance remains open until
all three genuine sandbox provider journeys complete through KELD server
verification and exact-artifact delivery.
