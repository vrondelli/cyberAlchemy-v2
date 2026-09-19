# Authentication lifecycle audit — 8 September 2026

The audit found additional session-transition failures, onboarding gaps and incomplete invalidation coverage. It did not change product source or user credentials. The running prototype remains available. All 694 inputs of candidate `224b66895a413dc6887b55c3280fac7934f43a802a77b40481a85c9e20236c13` were verified before and after the audit.

## Confirmed findings, in recommended repair order

Priority expresses repair urgency for this prototype, not a CVSS score or an adopted policy decision.

### AUTH-A01 — Failed silent renewal does not recover to fresh login (high)

A disposable user's stored token deadline was expired, and its issuer sessions were actually revoked through the admin API. Foundation's “Sign in again” path made two consecutive authorization requests with `prompt=none`, returned “Sign in required” each time, and never displayed a password form. Body War automatically made nine `prompt=none` authorization requests in approximately 1.2 seconds. The audit closed the disposable browser to stop the loop.

Root cause: `store.begin` chooses renewal solely from an expired stored token deadline. `core.start` has no explicit fresh-login mode. A terminal renewal failure does not revoke/clear the old local family. Body War's API error handling redirects to StartOidc on `session_renewal_required`, repeating that same decision.

Sources: [shared OIDC boundary](../../../session-core/src/index.mjs), [store](../../../session-core/src/store.mjs), [Foundation handler](../../src/foundation.mjs), [Body War UI](../../../../../body-war-v2-auth-mfa/app/ui/app.js). Evidence: [Foundation](renew.json), [Body War](renew-bodywar.json).

Repair: distinguish renewal from explicit sign-in. On terminal issuer errors such as login-required, invalidate the failed local renewal state and begin at most one fresh state/nonce/PKCE transaction. Do not convert temporary issuer outages into an unbounded redirect loop. This probe used targeted expiry injection into only the disposable user's encrypted local record; it did not wait for its JWT to expire. AUTH-A04 below separately exercises real token expiry.

### AUTH-A02 — Group-based MFA-role changes do not revoke old sessions (high policy gap)

Adding the disposable user to a group carrying `auth-privileged` made that role effective, but its existing password-only app session continued returning HTTP 200. Assigning the same role directly to the user revoked that session (HTTP 401). A subsequent fresh privileged login required enrollment.

Root cause: [SecurityEvents](../../security/src/auth/foundation/SecurityEvents.java) covers direct `/users/{id}/role-mappings` changes but ignores group membership and group role-mapping changes. This is incomplete effective-policy invalidation. It does not prove that an unrelated application administrator permission was gained: `auth-privileged` currently controls MFA classification, not application authorization.

Evidence: [role transitions](role-transitions.json). Repair: define and enforce invalidation for effective MFA-policy changes, including group membership and inherited role changes. Extend the event boundary for affected users, with tests for direct and inherited changes.

### AUTH-A03 — Re-enabling an account restores its old session (high policy decision)

Disabling the disposable user immediately denied its existing app session (401). Re-enabling that same user made the identical old session usable again (200), without a new password/MFA ceremony.

Root cause: introspection reflects the current enabled flag, while disabling the user does not cause this custom listener to revoke its existing sessions. A user update at `/users/{id}` is outside the listener's covered resource paths.

Evidence: [role/status transitions](role-transitions.json). This is confirmed behavior, but whether temporary suspension should preserve sessions was not defined by the candidate contract. Recommendation: revoke sessions when disabling an account, particularly for compromise response, so re-enabling requires fresh authentication. This needs an explicit policy rather than treating a temporary introspection denial as permanent revocation.

### AUTH-A04 — Account security fails after access-token expiry (medium)

After a real 310-second wait, with app idle lifetime still valid, both apps returned HTTP 401 and “Security settings unavailable” at their security page. Visiting Foundation's home page renewed the same session successfully and returned 200.

Root cause: [shared security handler](../../../session-core/src/security.mjs) calls `core.authenticate` and renders all session errors as unavailable. It has no renewal handoff for `session_renewal_required`, unlike Foundation's home handler.

Evidence: [real expiry](expired.json). Repair: give navigation to security settings the same bounded renewal handling as other authenticated pages, followed by the required fresh authentication for an actual credential change. Keep the idle and absolute session limits intact.

### AUTH-A05 — MFA setup outlives the app login transaction (medium)

A disposable user waited a real 190 seconds on initial OTP setup. Keycloak accepted and saved the authenticator, but the application callback returned “Sign in required” with HTTP 401. A fresh password-plus-OTP login then succeeded.

Root cause: app login transactions and their cookies expire after 180 seconds, while the issuer allows a longer interactive required-action window. There is no setup-specific deadline or useful completion message once the app transaction has expired.

Sources: [policy](../../../session-core/src/policy.mjs), [Foundation login cookie](../../src/foundation.mjs), [security-action cookie](../../../session-core/src/security.mjs). Evidence: [slow enrollment](slow.json).

Repair: define a bounded interactive setup budget and align its browser/server transaction lifetimes with the relevant issuer action lifetime. Show expiry/restart guidance and distinguish an already-saved credential from an uncompleted setup. Do not extend access-token, idle or absolute session lifetimes merely to make setup longer.

### AUTH-A06 — Email verification in another tab produces contradictory UI (medium)

Opening the verification email in a second tab completed sign-in there. The original tab automatically returned to `/callback` and displayed “Sign in required,” even though the shared browser session was authenticated and `/status` returned 200.

Root cause: the second callback encounters an already-consumed/missing login transaction. The generic callback error page does not distinguish that case from a browser that has no valid current session.

Evidence: [two-tab email verification](email-tabs.json). Repair: preserve one-use callback validation, but check the independently verified current session before presenting a sign-in error. Never authenticate from an old code or an untrusted callback status.

### AUTH-A07 — Interrupted privileged onboarding skips recovery-code completion (medium onboarding gap)

The privileged user enrolled OTP and reached the recovery-code screen. Closing that context before confirming codes, then signing in again with password plus OTP, succeeded with no recovery-code credential present.

Root cause: [MfaEnrollment](../../security/src/auth/foundation/MfaEnrollment.java) attaches both required actions to the current authentication session only when neither factor exists. On the next attempt the existing OTP credential suppresses the setup branch, so the unfinished backup step is not resumed.

Evidence: [interrupted enrollment](interrupted.json). This does not bypass MFA: the next login required OTP. The candidate contract defines enrollment as OTP **or** recovery codes, so mandatory backup-code completion is not yet a persistent policy requirement. The current full-path test and setup UI imply a stronger onboarding experience than interrupted flows deliver. Decide whether privileged backup completion is mandatory; if so, persist and resume that required action independently of OTP existence.

## Test and evidence problems

### AUTH-T01 — Stale-page behavior leaked into a normal test helper

`test-delete.mjs` contains a copied `enroll()` helper that revisits the saved setup URL after successful enrollment. It also writes `lastStep` twice. This was inherited from an earlier diagnostic and can manufacture stale-page errors during otherwise normal tests. The deletion assertions can still pass because the separately established app session remains valid.

For this audit, a temporary copy used the original, clean enrollment helper from `test-security.mjs`; all six deletion checks passed. Product/test source was left unchanged for the requested analysis. Repair: keep one clean enrollment helper and make stale/replay navigation explicit in dedicated tests. Do not attribute those helper-induced errors to ordinary user behavior.

### AUTH-T02 — The generic freeze script can reuse stale results (static review)

[freeze.mjs](../../scripts/freeze.mjs) hashes current inputs but accepts already-existing passing test/EVF result files without requiring them to be bound to that current input digest. Its broad MFA check count is also still hard-coded to the earlier milestone. A later source change can therefore be stamped with historical passing evidence if that script is used without actually rerunning the relevant checks.

The recent scoped repair manifests distinguish inherited evidence and actual reruns; this finding does not mean the observed live checks were fabricated. Repair the reusable tooling to verify before/after source identity and test-to-candidate bindings, with explicit validation inheritance. This was a static review finding; the audit did not run a fake freeze or alter a candidate to demonstrate it.

## What passed

- 19 original MFA/recovery browser checks, including wrong/replayed OTP, recovery-code reuse, email reset requiring the enrolled factor, password-change invalidation, and idle reauthentication.
- 5 account-console permission/link checks.
- 6 deletion checks using the clean audit helper: cancellation, fresh password/MFA, successful completion, both workers of both apps rejecting old sessions, fresh sign-in, and forged completion parameters granting no authentication.
- 4 additional account-console lifecycle checks: OTP enrollment; recovery-code creation; regeneration rejecting an unused old code; password change retaining MFA and invalidating both apps even with the optional logout checkbox cleared.
- 10 PostgreSQL session-store tests.
- 12 session-policy and 16 security-boundary EVF cases, with independent verification and rejected bypass mutations.
- Cancelled app-initiated enrollment in both apps saved no OTP and allowed a subsequent fresh sign-in. Its intentional local sign-out was not classified as a new defect.

That is 34 passing browser/integration regression checks, 10 database tests and 28 finite EVF cases, plus the separate investigative probes above. Passing those controls does not negate the uncovered transition gaps.

## Recommended repair sequence

1. Bound silent renewal and make explicit fresh sign-in reliable in both apps.
2. Define and enforce permanent session invalidation for account suspension and effective MFA-role changes.
3. Handle access-token renewal before security-page navigation.
4. Align interactive setup deadlines and make callback outcomes consistent across tabs and expired transactions.
5. Decide/persist the recovery onboarding policy, remove diagnostic behavior from normal helpers, and bind validation receipts to exact candidates.

Use a shared outcome model for completed, cancelled, expired, revoked, already-completed and temporarily-unavailable flows. Add the reproductions here before modifying those transitions. This avoids another series of fixes that only tests the immediate success path.

## Reproduction and boundaries

The exact temporary audit scripts are preserved in [probes](probes/). They were executed from `.runtime` so their existing relative imports resolved correctly; copy a probe back to `.runtime` before rerunning it. `audit-lifecycle.mjs` accepts AUTH_AUDIT_CASE values interrupted, slow, expired, renew, email-tabs and app-cancel; use AUTH_AUDIT_APP=bodywar and AUTH_AUDIT_LABEL=renew-bodywar for the second renewal probe. Scripts create/delete disposable identities; the role probe also cleans up its unique group. The existing security test owns the app workers, so run it separately from a manually launched cluster. The audit uses the existing loopback issuer and local mail capture.

Source inputs and the prior evidence were preserved in [baseline-evidence](baseline-evidence/). Checks ran with trusted Chromium in WSL, not the user's actual Windows browser. The real three-/five-minute waits are distinct from the targeted stored-deadline injection used for the terminal-renewal probe. Production SMTP, load/DoS qualification, all browser engines, eight hours of wall-clock operation, and a complete independent penetration test were not covered. The original 20-case durable restart/outage suite was not rerun; its historical evidence remains separate. No new production-readiness or formal security certification is claimed.

## Sources

- [Pinned Keycloak 26.7.3 implementation](https://github.com/keycloak/keycloak/tree/26.7.3)
- [Keycloak required actions](https://www.keycloak.org/docs/latest/server_admin/#_required-actions)
- [OWASP MFA factor-change guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html#changing-mfa-factors)

These references informed the audit questions; observed behavior and root-cause claims are linked to the local source and live evidence above.

## Open Questions

- Should any disable/re-enable cycle permanently revoke old sessions? Recommended: yes.
- Must privileged users persistently complete backup-code enrollment, or is that step optional once OTP exists? The candidate's current factor definition permits OTP alone.
- What exact effective-role/group changes require immediate invalidation, including inherited composites and group hierarchy changes?
- What bounded interactive setup lifetime and expiry UX should be adopted without changing idle/absolute session policy?
- Windows-native browser verification and broader operational/security qualification remain separate follow-up validation.
