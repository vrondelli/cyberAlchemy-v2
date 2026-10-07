---
title: KELD Checkout Authentication Return Staging Cutover Envelope
status: deployed-pending-real-oidc-return
updatedAt: 2026-09-20
owner: KELD product owner and staging operator
scope: replace staging web and worker with the exact checkout authentication-return repair
authorityEffect: none
---

# KELD Checkout Authentication Return Staging Cutover Envelope

This is the exact reversible staging envelope for the checkout login-return
repair. It proposes no payment-provider, identity-provider, database, quote,
ARE, edge, DNS, firewall, or production change. Execution requires explicit
owner approval of this candidate and effect set.

## Frozen identities

| Role | Identity |
| --- | --- |
| Current live application and worker | `keld-sandbox:checkout-redesign-20260920-r1` |
| Current live image ID | `sha256:ea28cdcc35e5ceb3e65be5612fb048468eaf6d40906e8eeab3f087091cc4f705` |
| Candidate application and worker | `keld-sandbox:checkout-auth-return-20260920-r2` |
| Candidate image ID | `sha256:fe87c5dda8a6dfc70c32e826071fde2781f84f9e8dea006a020f1379dfd365bf` |
| Candidate source context | 84 files; 2,701,451 bytes |
| Context file-entry digest | `sha256:9f85b323dfe06c95b5b2e28c98bd2cf567c55491665cfd07c9cbf32e6d8f2d77` |
| Private image archive | `keld-checkout-auth-return-r2.tar`; 88,204,800 bytes |
| Archive SHA-256 | `089d47ac8881d9abf9e98bd3a2bc8e67c0b42346074345c35f962c46f2aa8bfe` |

The private context, archive, and scan report are mode-restricted operator files
under `/home/vlad_/.local/share/keld-staging-operator/`. All 15 OCI blob names
match their content digests, and the archive index names the exact candidate
image ID.

## Admitted behavior and security evidence

- checkout login and registration preserve `/checkout?amount=...`;
- the callback consumes and clears an HttpOnly, Secure, SameSite=Lax return
  cookie;
- only `/`, `/checkout`, `/purchase/return`, `/purchase/cancel`, and
  `/signed-out` are eligible return paths;
- `/checkout` permits only one validated `$50.00` to `$1,000.00` `amount`
  parameter; other return routes carry no query or fragment;
- external origins, protocol-relative URLs, API paths, duplicate parameters,
  fragments, and invalid amounts fail closed;
- session renewal preserves the same checked checkout target;
- frontend tests: 20/20;
- integration tests: 96/96;
- deployment/security tests: 76/76;
- production build and Chrome 153 generated-link check: passed;
- exact-image UID/GID `10001:10001`, read-only, no-network smoke: passed;
- digest-pinned Trivy 0.74.0 exact-image scan: zero High/Critical
  vulnerabilities and zero secret findings; report SHA-256
  `21e5934c55e96048923fe38c2d03308f96347500a5768d6dfecdcf0ed7601cf1`.

The reusable disposable full-stack smoke was not rerun because its unrelated
local `ubuntu:24.04` helper image is absent. The candidate-specific constrained
runtime smoke, full suites, production browser check, and exact-image scan are
the bounded substitutes. This gap must remain visible rather than being treated
as a passed full-stack rehearsal.

## Authorized effects if approved

The cutover may:

1. verify the current r24 manifest, monitor, target image IDs, and service
   health;
2. create and independently verify one new online full-state backup;
3. transfer and hash-verify the exact private candidate archive and 84-file
   source context;
4. load and tag the exact candidate image;
5. change only `KELD_VERSION` to `checkout-auth-return-20260920-r2`;
6. recreate only `web` and `worker`;
7. test anonymous checkout -> login -> callback -> same checkout, without
   creating a provider payment;
8. capture and verify one successor schema-v3 release manifest and private
   browser receipt;
9. restore `KELD_VERSION=checkout-redesign-20260920-r1` and recreate only
   `web` and `worker` if a rollback trigger fires.

It may not modify Keycloak configuration or image, PostgreSQL, Caddy, ARE,
provider credentials or webhooks, quote policy, commerce or identity records,
DNS, firewall rules, production infrastructure, or repository Git history. It
may not delete r24, either image, or any recovery point.

## Rollback triggers

Rollback immediately if either target service is unhealthy, another service
changes identity, any public route or monitor check fails, the candidate asset
is absent, login does not return to the exact checkout, an unsafe return target
is accepted, the fixed quote changes, or successor manifest capture or
verification fails.

## Close condition

The repair cutover is complete only when the exact candidate is healthy, the
real OIDC checkout-return journey passes without a payment, the successor
manifest and scheduled monitor pass, non-target services remain unchanged, and
the r1 image plus verified backup remain available. W11 provider acceptance and
all production decisions remain separate.

## Execution result

The owner approved this exact envelope in the active task. On 2026-09-21 UTC,
staging changed only `KELD_VERSION` and recreated only `web` and `worker`. Both
targets are healthy on the exact r2 image. Edge, PostgreSQL, Keycloak, and all
four ARE container identities remained unchanged. The new independently
verified online recovery point is
`/opt/keld-staging/backups/full-state-pre-checkout-auth-return-20260921T021824Z`.

Anonymous Chrome 153 reached `/checkout?amount=200`, exposed the exact login and
registration return targets, navigated to the KELD realm, and observed the
`__Host-keld_return` cookie as HttpOnly, Secure, SameSite=Lax, path `/`, with no
page or console errors. External, API, duplicate-amount, fragment, and
out-of-range targets returned 400. No identity, checkout, or payment was
created. The privacy-safe browser receipt SHA-256 is
`eac5e438d65c840d6305cebb7bec2f1d582328f7305da40ee84291444aad0138`.

The corrected schema-v3 successor manifest is
`staging-r25-checkout-auth-return-20260921T0225Z.json`, SHA-256
`7c492262653e5ca0edb7b23f3387a27eb803560d5720d73f546acb46359fc25b`.
It binds 84 files, 2,701,451 bytes, and the frozen context digest
`9f85b323dfe06c95b5b2e28c98bd2cf567c55491665cfd07c9cbf32e6d8f2d77`.
Direct and scheduled monitor runs pass, the timer is active, and the fixed
5.10 quote is unchanged. An initial structurally valid manifest captured the
transferred context after an accidental mode normalization; it was rejected,
preserved under private security evidence, and replaced only after the exact
`0644` context modes and frozen digest were restored.

The real credentialed callback and return to the same checkout is still
untested because this run had no test-account credential. That is not recorded
as a failed login, but it means the close condition is not yet met. The r2
candidate remains live as a staging test candidate; r1 and the verified backup
remain the immediate rollback path.
