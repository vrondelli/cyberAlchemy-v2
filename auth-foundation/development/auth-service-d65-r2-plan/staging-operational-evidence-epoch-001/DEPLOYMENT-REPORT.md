# Auth local staging deployment report

The exact Auth V3-bound source set was deployed to the existing supervised local
Auth environment. All 222 frozen inputs match current bytes. The
service is active under `auth-foundation.service`; issuer, Auth Durable, and Body
War Durable health endpoints returned 200 over verified HTTPS.

## Runtime evidence

- Locked Rust bridge rebuild: passed.
- Unit verification: 15 passed, 0 failed.
- Autonomous service authorization: retry returned HTTP 200 and `ALLOW`.
- Cold start and worker failure recovery: 4 checks passed.
- Proxy isolation and fault controls: 5 checks passed.
- Static requests: 120; expected authentication rate-limit rejections: 29.
- V3 author and independent replay manifests: verified.

The incompatible predecessor HTTPS campaign is retained as diagnostic evidence;
it is not counted as a durable staging pass. Its execution exposed a real harness
composition defect and the durable overlay was restored before acceptance checks.

## Claim boundary

This is local staging-rehearsal evidence from one WSL host. Production evidence
requires a separately isolated production environment or an explicitly admitted
production canary, production-shaped traffic, monitoring and retention, and a
separate owner decision.

`authority_effect: none`

## Open Questions

See [README.md](README.md#open-questions).
