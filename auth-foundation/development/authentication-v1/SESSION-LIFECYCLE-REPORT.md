# Session lifecycle prototype

Date: 2026-09-07. Status: local implementation, tests, scoped EVF and independent verification passed.
Authority effect: none. Human review of this successor is pending.

## Result

The app now locks after 15 minutes without a successful home/document request.
The next request shows “Your session expired”; “Sign in again” requires fresh
Keycloak authentication even if issuer SSO is still active. Activity can extend
idle time but cannot extend the eight-hour app maximum. Five-minute access tokens
renew through a bounded code-flow SSO round trip while the parent app session
remains active. Renewal rotates the app cookie and preserves its deadlines.

Logout invalidates local state first and cancels related login transactions,
including callbacks already waiting on token validation. Old cookies, duplicate
callbacks and callbacks arriving after the parent expires cannot restore access.
A missing/unknown app cookie takes a fresh-authentication path too. Keycloak may
show only a password field when it already knows the user; the launcher handles
both that form and the normal username/password form.

The [plan and contract](SESSION-LIFECYCLE-PLAN.md) contain the DAG, defaults,
activity rules, operational owners and deferred work. They supersede the baseline
HTTPS contract's access-token-bound app session maximum.

## Test it

Use the separate Chromium window opened by `npm run open` from
`implementation/authentication-https`; its isolated trust store contains the local
CA. The URL is `https://localhost:13443`. Regular browsers do not trust this CA.
Alice is prefilled; click Sign in.

1. Open the protected document successfully.
2. After five minutes but before 15 minutes of inactivity, navigate to the app
   or document. Token renewal should return you without asking for credentials.
3. Leave the app alone for 15 minutes, then navigate again. It must show the
   expired-session page and require authentication after Sign in again.
4. Sign out. Returning with the old cookie must not restore access.

These are server request checks: an already rendered page is not erased by a
client-side timer. Background health/style requests do not count as activity.

## Evidence

Exact candidate: `e4e209bcab9be67f6176b712b6bc20c2c13c72e5ca30b54f550207d328f3e7b5`,
163 input files. The [machine result](../../implementation/authentication-https/evidence/TEST-RESULT.json)
owns the current aggregate verification status.

| Check | Result |
| --- | --- |
| Unit checks | 15 passed |
| HTTPS regression scenarios | 10 passed |
| Real HTTPS/Keycloak session scenarios | 6 passed |
| Fresh CA/credentials/empty database rehearsal | Passed; disposable resources removed |
| Scoped EVF and independent verifier | Passed: 13 stages, 8 hostile mutations, 2 repetitions |

Session scenarios use an in-process controlled clock through the real proxy and
issuer. They cover two-tab idle lock, health not resetting idle time, fresh login
with live SSO, cookie deletion, SSO renewal, absolute expiry, logout before and
during callback validation, expiry during renewal and concurrent callback replay.
No HTTP or environment endpoint can change the production clock.

Run unit and normal live checks with `npm test` and `npm run test:live`.
The clock-controlled session suite requires the normal app stopped, because it
binds the same owner-only socket. Run it from the implementation directory:

```bash
NODE_EXTRA_CA_CERTS="$PWD/.runtime/tls/ca.crt" LD_LIBRARY_PATH="$PWD/.runtime/browser-libs/root/usr/lib/x86_64-linux-gnu" node --test test/session-live.test.mjs
```

Then restore the normal app with `npm start`. Fresh rehearsal is
`npm run test:fresh`; it temporarily uses the HTTPS proxy ports and restores them.

The original 158-file HTTPS baseline is preserved under
[its archive](history/3bc71dc0fd1ba87984103586714f642afb38393920923d44ebbe655c88cde609/README.md).
All 149 files of the approved HTTP predecessor remain unchanged. A superseded
session candidate is retained with its failed test-helper result; its EVF pass
is not reused for this successor.

## Open Questions

Sessions remain single-process memory. Restart requires fresh login. Persistent
shared storage, global revocation, multi-app session inventory and a trusted
initial cross-app SSO handoff remain future work. Numeric defaults are candidate
policy, not production security certification. Scoped EVF does not establish
full ASVS compliance, formal correspondence or deployment readiness.

Policy ownership and later gates remain in [the plan](SESSION-LIFECYCLE-PLAN.md#open-questions).
