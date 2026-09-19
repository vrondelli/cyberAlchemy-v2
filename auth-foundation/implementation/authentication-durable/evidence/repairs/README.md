# Auth lifecycle repair verification

This report follows the [audit](../audit-20260908/README.md) and the authorized [construction DAG](../../../../development/authentication-v1/LIFECYCLE-REPAIRS-PLAN.md). The audited 694-input predecessor was verified and archived before changes. The successor input manifest covers current implementation, tests, runtime build artifacts and repair plan; the two earlier account repair plans remain historical evidence in the predecessor archive.

## Implemented behavior

| Finding | Repair | Current witness |
| --- | --- | --- |
| A01 | Explicit sign-in is fresh; terminal silent renewal revokes its family and makes one fresh handoff. Transient errors stop rather than retrying automatically. | Both apps: exactly `none, login` after fixture issuer-session revocation, then successful fresh sign-in. |
| A02 | Direct user role/membership changes revoke that user. Group and role-graph edits conservatively revoke realm sessions, including client role graph administration. | Existing group gains privileged role; user joins privileged group; direct privileged role grant. |
| A03 | Disabling revokes sessions permanently; enabling does not restore them. | Old cookies remain rejected in both apps after re-enable. |
| A04 | GET security navigation renews and returns to a fixed server-selected security path. Changes retain origin, CSRF and fresh-authentication requirements. | Both apps return to security settings after controlled expiry of the disposable family's stored token deadline. |
| A05 | Interactive transactions/cookies and issuer action/login limits are 600 seconds. Token, idle and absolute limits remain 300/900/28800 seconds. | Real 190-second enrollment delay and database rejection at the exact 600-second boundary. |
| A06 | A consumed callback redirects only after independent authentication of the current cookie. | Email link opened in a second tab leaves both tabs signed in. |
| A07 | Privileged recovery-code enrollment is offered again until completed, even after OTP was saved. | Abandon recovery screen, authenticate again with password/OTP, complete codes before app session issuance. |
| T01 | Normal deletion-test enrollment no longer navigates to a stale action URL or duplicates its OTP timestamp. | Clean enrollment plus deletion regression. |
| T02 | Test receipts bind the exact command, pre/post source identity, output and result artifact hashes; freeze rejects stale or failed evidence. | Nine receipt-policy checks, including stale source, mutation during test, failed command and changed/missing results. |

## Evidence boundary

[VERIFICATION.json](../VERIFICATION.json) owns the completed suite inventory and exact candidate digest. Each `*-receipt.json` in this directory binds its log and result artifacts to the same source digest. The live issuer provider jar was compared to the local build; issuer action/login limits were read back as 600/600. Final health and totals are recorded in RESULTS.json after completion.

Browser regressions use trusted Chromium in WSL and disposable accounts. Group/role graph policy tests run separately because graph administration intentionally signs out realm users. The 190-second scenario uses a real wait; token-renewal scenarios alter only the encrypted deadline of a verified disposable subject and exercise real issuer requests. Prior durable pilot checks are explicitly inherited, not represented as new runs. EVF covers 28 finite policy cases with negative controls and independent verification; it is not proof of the whole authentication system.

## Open Questions

Windows-native browser validation, production certificate operations, scalable targeted invalidation for group graphs, and handling exhausted recovery codes remain deferred in the repair plan. Group/role graph invalidation is deliberately broad in this local prototype. Recovery-only accounts retain the previous factor policy. Test receipts are local integrity evidence, not signed attestations or an approval to deploy.

## Test execution notes

An initial simultaneous run of the account and console suites timed out at 15 seconds while deletion passed. Their unchanged-source diagnostic runs passed individually. Initial failed receipts/logs are retained under `development/`; only the subsequent normal, source-bound suite runs count toward VERIFICATION.json. Resource or harness timing under simultaneous browser suites remains an open question; the timeouts were not reproduced in isolated runs and are not silently counted as passes.
