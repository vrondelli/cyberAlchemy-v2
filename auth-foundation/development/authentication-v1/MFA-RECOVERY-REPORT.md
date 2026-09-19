# MFA and recovery prototype result

The [authorized plan and DAG](MFA-RECOVERY-PLAN.md) are implemented as a local successor. Keycloak owns passwords, OTP enrollment and validation, email verification/reset and single-use recovery codes. Privileged identities carry the operator-assigned `auth-privileged` role; regular accounts may opt in. That role selects MFA policy and does not grant application or Keycloak administration permissions.

## Try it

- Auth Foundation: https://auth-durable.localhost:15443
- Body War: https://body-war-durable.localhost:16443
- Local test inbox: http://localhost:18025
- Mandatory-MFA demo: `mfa-admin`; optional-MFA demo: `mfa-regular`. Passwords are in the private [handoff](../../implementation/authentication-durable/.runtime/security/TEST-LOGIN.txt). The existing `alice` password remains unchanged.

Use the account-security link in either app. First login verifies the demo email through the local inbox. The privileged demo then enrolls an authenticator and saves recovery codes. Existing application permissions remain separate from sign-in: the privileged demo role does not automatically grant access to Auth Foundation's protected document.

For a lost authenticator, sign in with the password and a saved recovery code using **Try another way**. Configure a replacement through Account security, then use its Keycloak credential-manager link to remove the lost device. Password reset requires the email link plus an existing second factor for enrolled users. It never removes MFA. No outbound email relay is configured.

## Implementation and evidence

Security actions validate the active app/issuer session, exact origin, session-bound CSRF and a fixed action allowlist. They require fresh authentication and never silently renew or issue an app session on completion. Credential changes commit a Keycloak user-token revocation timestamp. Code exchange checks the signed authentication time against the issuer's directly received not-before policy, and a small version-bound event listener removes pre-change issuer sessions after commit. This avoids deleting a session while Keycloak is still updating it. Recovery-code login revokes other existing sessions. The shared session store remains encrypted PostgreSQL with separate application roles and keys.

Final candidate: `1fc94d6c2a4ca111fceed090adc5f0f3b06c0c9f0f8a11a3e63e34505cee5b7e`, binding 685 source/runtime files.

- **19 MFA/recovery browser checks passed:** verified-email login; mandatory and optional enrollment; wrong/replayed OTP; idle expiry requiring password and MFA in both apps; CSRF/action rejection; fresh security actions; recovery-code reuse rejection; email-only reset bypass rejection; reset-link reuse rejection; password changes preserving MFA and revoking pre-change sessions across apps/workers.
- **20 durable-session live checks passed:** including actual token renewal, two-worker restarts, local authorization, provider persistence, logout races, database restart/outage and issuer-session revocation.
- **10 real PostgreSQL session-store tests passed.**
- **22 Body War validation stages have passing evidence.** The first isolated run lacked its browser executable. The browser stage was rerun with the existing pinned browser; source and compiled artifacts were verified unchanged. The original failed report remains preserved, with the effective result composed in `bodywar-revalidation.json`.
- **Two EVF campaigns independently verified:** 12 session-policy cases and 16 security-action/revocation-time cases, each with a rejected bypass mutation. These finite checks do not prove Keycloak or the distributed system.
- **Issuer recreation and recovery startup passed.** Verified HTTPS probes reached both workers of both apps; the loopback inbox is available. `npm run recover` restores the local fixture.

[Candidate manifest](../../implementation/authentication-durable/evidence/CANDIDATE.json), [verification summary](../../implementation/authentication-durable/evidence/VERIFICATION.json), [MFA live evidence](../../implementation/authentication-durable/evidence/security-live.json), [Body War revalidation](../../implementation/authentication-durable/evidence/bodywar-revalidation.json), and [startup evidence](../../implementation/authentication-durable/evidence/security-startup.json).

Another task edited and rebuilt Body War during this work. Auth integration changes remain in `body-war-v2`, while the running consumer uses the stable sibling `body-war-v2-auth-mfa` snapshot. Its input manifest preserves 407 captured source files; unrelated concurrent cleanup was not reverted. The durable predecessor and its evidence are archived under `history/durable-before-mfa/`. All 163 original HTTPS prototype source inputs remain unchanged. Shared realm runtime policies were intentionally updated as described in the plan. No commit, push, submodule pointer change or production deployment occurred.

## Open Questions

This is a local, synthetic-Strava prototype. Passkeys, production email/domain/HTTPS, backup and secret custody, load/rate qualification, broader administrator-role classification and production release assessment remain separate milestones. If all authenticators and saved recovery codes are lost, self-service recovery remains unavailable until an identity-proofing/support policy is defined. Further qualification is needed for concurrent in-flight issuer authentication during credential change and operational recovery of post-commit cleanup; current live guarantees concern pre-change sessions. The [plan](MFA-RECOVERY-PLAN.md#open-questions) owns this residue. Test success is candidate evidence, not production security certification or owner approval.
