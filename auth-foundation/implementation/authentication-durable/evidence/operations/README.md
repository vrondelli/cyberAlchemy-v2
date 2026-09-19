# Testable self-hosted operations prototype

All 18 required verification suites passed against candidate **7dcac8a813cb03188b9a2a8cc63e17b55af2737d827d7343d73e7488ba42a3f3** (726 inputs). The original 163 HTTPS source inputs remain unchanged. See [exact verification](../VERIFICATION.json), [candidate](../CANDIDATE.json), and the [implementation DAG and operator commands](../../operations/README.md).

| Step | Implemented and tested | Remaining boundary |
| --- | --- | --- |
| Restart recovery | Current-user service; issuer and database readiness; cold start with databases stopped; recovery after worker death; installed Windows logon launcher executed and kept WSL running | An actual Windows hardware reboot was not performed |
| Backups | Daily AES-256-GCM backups; separate private key; isolated PostgreSQL restore; tamper/wrong-key rejection; restored session/recovery-code removal; account/MFA data retained | Operator must escrow encrypted copies and the key off this PC; production restore promotion needs credential-change reconciliation |
| Stable HTTPS | Stable private CA; 90-day leaves renewed within 30 days of expiry; CurrentUser Windows trust; native Edge login/security checks for both apps | Private localhost deployment; a public hostname is a separate decision |
| Recovery, rotation and passkeys | TLS-only external SMTP profile validation; local email-reset tests; app-secret rotation with old-secret rejection and provider-token preservation; nine passkey checks including user verification, password fallback and revocation | Real SMTP service/sender/delivery remain unconfigured; physical Windows Hello/security-key testing is still a user live test |

## Live testing

- [Body War](https://body-war-durable.localhost:16443/)
- [Auth Foundation](https://auth-durable.localhost:15443/)

Use the existing account. Open **Account security → Set up a passkey** to test enrollment. The operator's password and OTP credential were preserved. Secret rotation intentionally requires fresh sign-in.

## Regression evidence

The suite receipts cover Body War, durable storage, MFA/recovery, account access, credential deletion, account-console actions, lifecycle behavior, MFA buttons, passkeys, native Windows Edge, backup/restore, rotation, restart, SMTP validation, proxy limits, evidence integrity, and two EVF runs. EVF covers 28 finite policy cases and their negative controls; it is not whole-system security certification.

Native Edge used normal certificate verification. The private CA fingerprint is 3A:00:4F:AF:65:2F:4C:97:26:60:AE:0B:0C:73:3C:FB:8E:63:2B:B4:F1:7F:C3:21:F9:66:AB:EE:68:3A:91:FB; its validity ends Sep  5 02:45:55 2036 GMT. The application-secret rotation preserved 1 existing provider-token record(s), checking plaintext equality without recording token values.

## Additional proxy repair

The frozen predecessor rejected 69 of 120 static-asset requests and then returned 429 for authentication metadata. The successor separates asset traffic from the unchanged authentication limit. Its 120-asset burst passes while excess authentication requests still receive 429. Public admin access and spoofed forwarding headers remain blocked. Proxy failure logs exclude URLs, queries, cookies, credentials and user identifiers.

## Open Questions

Real email delivery, off-machine backup/key custody, physical authenticator testing, hardware reboot and any future public hostname are owned by the [operations plan](../../operations/README.md#open-questions). Earlier intermittent callback/account-console failures are retained in [diagnostics](diagnostics/README.md). The proxy defect was reproduced and fixed, but individual historical failures are not retroactively assigned an unrecorded cause. No current required suite is failing.
