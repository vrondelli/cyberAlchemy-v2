# Account deletion completion repair

## Product frontier and causal finding

Deleting an authenticator from Keycloak's account console succeeded at the issuer but produced “Server responded with an invalid status.” The live reproduction recorded a successful action callback, HTTP 400 from the token endpoint, the generic error screen, and only the password remaining in the disposable user's credential metadata. The credential-change listener intentionally revokes pre-change issuer sessions and fences old tokens; the account console then tried to exchange the action code using that revoked session.

The previous five account-console tests covered permission migration and opening credential management, not completing credential removal. This successor adds the missing destructive-action lifecycle coverage using disposable identities only.

DAG: reproduce deletion → preserve exact 688-input predecessor → wrap account-console action completion → install local theme → verify deletion/cancellation/revocation/fresh login → retain testable local services.

## Construction change

The auth-foundation-security account theme inherits Keycloak's keycloak.v3 account UI. Its pinned 26.7.3 index template changes only the production entry-script tag, calling a small wrapper before importing the stock console. Ordinary authentication and cancelled actions use the unmodified console entry module. A returned action URL containing success, code and state shows a neutral “Sign in to continue” screen instead of attempting an exchange that is invalid after credential revocation. It removes the consumed query/fragment from browser history and links to the clean current account path.

Callback fields are untrusted presentation hints. The screen does not assert deletion success, mint tokens, access account APIs, set authentication cookies, or grant a session. Its link starts the real issuer login flow. A forged completion URL is explicitly tested to yield no authenticated access. Existing credential revocation, token fencing, MFA verification, TLS, and CSRF controls are unchanged.

Theme files are mounted read-only in the local issuer overlay. setup-security selects the account theme on every recovery. Upstream template provenance and its original hash are in [theme README](../../implementation/authentication-durable/security/themes/README.md). The previous exact product and evidence are archived in [history/account-before-delete-repair](history/account-before-delete-repair/README.md).

## Validation

Run `node scripts/test-delete.mjs` against the running local durable cluster. [Live results](../../implementation/authentication-durable/evidence/delete-live.json) cover cancellation preserving the factor/session, fresh password and existing MFA before deletion, successful deletion with the new completion screen, invalidation on both workers of both apps, fresh sign-in showing the factor removed, and forged completion parameters granting no authentication. The test reads no actual user's secret and deletes only its disposable user.

The earlier account-console link and permission regression is rerun separately. Prior broader MFA/durable/EVF campaigns remain inherited predecessor evidence and are not represented as rerun for this UI completion repair. Source/template inputs and scoped evidence are bound in the current CANDIDATE.json and VERIFICATION.json.

## Operational tasks and owners

The user can open https://localhost:18443/realms/auth-https/account/account-security/signing-in, sign in freshly, and review the actual saved credentials. If their earlier deletion already succeeded, it does not need repeating. The issuer was recreated locally to mount the theme; the durable workers remain running. Production packaging, email, passkeys, and Windows CA installation remain separately owned follow-up work and do not block this local repair.

## Open Questions

The copied account template and callback wrapper must be reviewed when upgrading Keycloak. The prototype intentionally requires a new sign-in after successful account actions; a richer verified action-result UX would require a separate authenticated completion design. Other action types can reuse the wrapper but need their own live acceptance coverage before claiming complete account-console lifecycle validation. Intermittent stale required-action-page errors during application-initiated enrollment remain a separate diagnostic; this repair targets the reproduced account-console token-exchange failure after deletion.
