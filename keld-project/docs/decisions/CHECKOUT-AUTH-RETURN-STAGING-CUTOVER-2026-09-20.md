---
title: Checkout Authentication Return Staging Cutover Decision
status: executed-pending-authenticated-callback
updatedAt: 2026-09-20
owner: KELD product owner
scope: staging web and worker only
---

# Checkout Authentication Return Staging Cutover Decision

## Decision question

Should staging replace the current r24 checkout image with the exact tested r2
authentication-return repair?

## Options

### 1. Deploy exact r2 candidate now — recommended

- Benefit: checkout login, registration, and session renewal return to the
  exact allowlisted checkout instead of the storefront home.
- Cost/risk: recreates `web` and `worker`; a new backup, browser receipt,
  release manifest, and monitor run are required.
- Downstream impact: W11 can test the real checkout without manually navigating
  back after authentication.
- Rollback: restore the current r1 tag and recreate only `web` and `worker`.

### 2. Hold current r24 staging

- Benefit: no live mutation.
- Cost/risk: the known login-return defect remains and interferes with buyer
  testing.
- Downstream impact: W11 should remain paused or testers must manually reopen
  checkout after login.

## Current decision state

- Selected option: option 1, approved by the owner in the active task.
- Recommendation: option 1 because the repair is bounded, reversible, fully
  tested, scanned, and preserves the existing payment-authority boundary.
- Source of decision: owner response in the active Codex task.
- Exact effect envelope:
  [CHECKOUT-AUTH-RETURN-STAGING-CUTOVER-2026-09-20.md](../CHECKOUT-AUTH-RETURN-STAGING-CUTOVER-2026-09-20.md).
- Execution: r2 is healthy on staging for `web` and `worker`; schema-v3 r25,
  direct monitoring, scheduled monitoring, route isolation, fixed quote, unsafe
  return rejection, and anonymous Chrome checkout-to-Keycloak handoff pass.
- Remaining acceptance gate: complete one real credentialed OIDC callback and
  prove it returns to `/checkout?amount=200` without creating a payment.

## Embedded checkout boundary

The checkout review, Pix instructions, verification, recovery, and delivery
remain first-party KELD UI. Stripe and PayPal credential/approval surfaces
remain provider-hosted. Their existing hosted pages must not be placed in a
generic iframe; changing to provider-specific embedded SDKs would be a separate
integration and security task.
