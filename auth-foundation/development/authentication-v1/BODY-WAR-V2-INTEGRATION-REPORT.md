# Body War v2 integration result

The approved second-consumer prototype is implemented in [Body War v2](../../../body-war-v2/OIDC-PROTOTYPE.md). Open https://body-war.localhost:14443 in the trusted test browser. Sign in as `alice` using the private [Body War handoff](../../../body-war-v2/.runtime/oidc/TEST-LOGIN.txt), then select **Conectar Strava**. Provider data is synthetic.

## Completed DAG

Baseline preservation → canonical identity/storage/UI model → generated contracts → OIDC and provider ownership adapters → dedicated client and isolated HTTPS fixture → real browser/session/PostgreSQL tests → bounded EVF → local reviewable prototype. Source baseline preservation is linked from the approved [integration plan](BODY-WAR-V2-INTEGRATION-PLAN.md) and prototype guide.

All 23 pilot validation stages passed, including 51 unit tests, eight legacy UI tests and seven PostgreSQL integrity scenarios plus the existing end-to-end flow. Ten real Keycloak/browser checks and six real-issuer session checks passed. The existing 33 finite EVF checks and a separate twelve-case OIDC session/freshness policy audit passed independent verification. The new audit rejects a compiled mutation allowing equality at the expiration deadlines. These are bounded executable witnesses, not formal proof or production certification.

The integration fixes callback redirect-origin handling, gives the confidential Body War backend an explicit introspection audience, requires authenticated CSRF-protected provider linking, rejects cross-owner provider upserts under concurrent PostgreSQL access, cancels pending links on logout, and handles expired-session logout idempotently. The UI renews active sessions through OIDC and requires fresh sign-in after inactivity. Unsafe actions are not automatically replayed after renewal.

The existing Auth Foundation app process remains alive and all 163 frozen input files remain unchanged. Its browser session was not used by this campaign. No source commits, public deployment, global logout or real Strava migration occurred. Body War's isolated memory fixture was restarted after testing and a final trusted-browser login/logout smoke check left it unlinked for the user's test.

## Exact evidence

- Candidate digest: `70fd7de7cd79e87fbc4957621995c5fee632b671f6169f7b14b7db81c387e157`.
- [Integration evidence and artifact digests](../../../body-war-v2/evidence/oidc-integration.json).
- [Pilot validation](../../../body-war-v2/evidence/validation.json).
- [Live OIDC](../../../body-war-v2/evidence/oidc-live.json) and [session checks](../../../body-war-v2/evidence/oidc-session.json).
- [Pilot EVF](../../../body-war-v2/evidence/evf.json) and [OIDC policy EVF](../../../body-war-v2/evidence/oidc-evf.json).

## Open Questions

[The prototype guide](../../../body-war-v2/OIDC-PROTOTYPE.md#open-questions) owns unresolved distributed persistence, real-provider adoption, operational hardening and production deployment questions. Full ORODI readiness and general formal discharge remain explicitly incomplete. Missing-cookie first arrival deliberately requires fresh authentication; seamless initial cross-app SSO needs a later trusted handoff design.
