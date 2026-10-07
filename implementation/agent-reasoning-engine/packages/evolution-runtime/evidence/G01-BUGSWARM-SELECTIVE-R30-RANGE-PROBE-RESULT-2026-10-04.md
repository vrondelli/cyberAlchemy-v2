# G01 BugSwarm selective-GLM r30 — byte-range probe result

Status: failed; exact byte ranges are unsupported or unverifiable on the tested
BugSwarm raw-log endpoint. Do not construct a chunked downloader from this
mechanism.

The fixed row-10 probe made exactly one request for `bytes=0-16383`. BugSwarm
returned HTTP 200 rather than 206, supplied no `Content-Range`, and began a
whole-body response. The probe retained 16,385 bounded bytes and stopped. The
final URL remained on the expected HTTPS BugSwarm path.

Protocol SHA-256:
`d8315486d62be20fa476ce296085cdf4afd1670b662e4dbe313de96ca781ce9c`.
Runner SHA-256:
`0d860b4b7bce90ef7a06ce05fd6f7f166b6b0d9dd9be45b5b514058ee9c6948a`.
Private result SHA-256:
`cf2dd60d247d86dfc6938f0f8dc7c2fa1c0a1dcac3e06a49768e9fb849135e40`.

No retry, label, passing source, patch, ranking, provider call, model call, or
score occurred. The next bounded transport hypothesis is one alternate HTTPS
client attempt per seven r29 transport-only failures; unresolved rows then
require score-blind replacement.

## Open Questions

- Can an alternate standards-compliant HTTPS client complete any of the seven
  within-cap logs without retry or range support?
- If not, should the admission policy standardize on immediate score-blind
  replacement after one preserved transfer failure?
