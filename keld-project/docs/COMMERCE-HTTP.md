# Local commerce HTTP boundary

2026-09-17. Candidate loopback sandbox only; not a production service.

`commerce/http_app.py` connects checkout, authenticated order status, signed Stripe
webhook intake, download grants, binary download and logout over WSGI. Sessions
use random bearer tokens with only hashes stored, explicit expiry and revocation.
There is no public session minting, signup or identity recovery. Trusted callers
must verify identity before issuing a session. The API rejects non-loopback peers,
unexpected Host/Origin, query tokens, oversized bodies, duplicate JSON fields and
browser-supplied customer/release identity. Artifact paths are never served.

Five new tests use a real ephemeral loopback HTTP server. The combined suite has
44 distinct tests, including checkout → signed webhook → explicit processor call
→ authenticated grant → exact fixture-file download. These checks include buyer
isolation, expiry/revocation, forged events and corrupted artifact rejection.
Provider API responses and identity issuance are fixtures; no Stripe-issued
payment, user signup, production deployment or background worker is proven.

## Current direction

The owner requested research into established ecommerce platforms during this
implementation. Finish validation of this local work, then compare reuse before
building further custom commerce infrastructure. Preserve the tests as acceptance
scenarios; they do not require keeping the custom implementation.

## Open Questions

Platform selection, merchant country, sign-in/recovery, worker operations,
refund policy and release approval remain unresolved. See
[commercial handoff](COMMERCIAL-HANDOFF.md) and [Stripe integration](STRIPE-INTEGRATION.md).
