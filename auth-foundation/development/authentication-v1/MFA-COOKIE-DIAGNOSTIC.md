# MFA completion cookie diagnostic

The live issuer recorded Alice's OTP credential creation at 2026-09-07T22:43:19.415Z, successful login at 22:43:19.496Z, then CUSTOM_REQUIRED_ACTION_ERROR / cookie_not_found at 22:43:19.750Z. A metadata-only credential check confirmed one saved OTP credential. No user password, OTP seed, recovery code, or session identifier is included here.

Fresh optional enrollment completed through both the QR screen and manual-key screen using disposable users. Reopening the consumed required-action URL after completion reproduced the exact reported error. The issuer session revoked by the security change cannot resume that completed setup transaction. This establishes a reproducible cause, not proof of which browser action generated the user's second request. Existing issuer logs do not identify that action.

The safe recovery is a fresh application sign-in with the existing password and saved authenticator. Do not resubmit the old setup page or remove the authenticator entry. No session lifetime, cookie security setting, or issuer revocation policy was relaxed. Application code and the frozen MFA candidate remain unchanged.

## Evidence

- [Live reproduction log](../../implementation/authentication-durable/evidence/cookie-diagnostic.txt)
- [Disposable-user diagnostic](../../implementation/authentication-durable/evidence/cookie-diagnostic.mjs)
- [Preserved predecessor](history/mfa-before-cookie-repair/README.md)
- [Pinned Keycloak session checks](https://github.com/keycloak/keycloak/blob/26.7.3/services/src/main/java/org/keycloak/services/resources/SessionCodeChecks.java)

The diagnostic uses the running local cluster, confirms enrollment remains saved after the stale-page error, and checks fresh password-plus-OTP login in both apps. It deletes only its disposable test users. Run from implementation/authentication-durable with `node evidence/cookie-diagnostic.mjs`.

## Open Questions

What caused the browser to request the consumed setup URL immediately after completion: back/reload, a second tab, or another navigation? A clarification was requested. If this recurs on a single fresh submission, capture a sanitized navigation trace before choosing a code repair. The error alone does not establish that browser cookies are disabled.
