# OTP reuse investigation

Reported observation: a code that has not refreshed can be submitted again to log in after a flow. Diagnostic scope: disposable users, real Keycloak browser requests, same 30-second step checks. No implementation or real-user credentials changed.

## Findings

The live realm has otpPolicyCodeReusable=false, period=30 and look-ahead window=1. The main account has one OTP credential; duplicate entries were not observed.

All eight observations passed: setup-code reuse was rejected in Foundation and Body War after app-initiated enrollment and again after native account-console enrollment (four rejections); a successful login code was rejected by the other app and at security reauthentication; a security reauthentication code was rejected at login after recovery-code setup completed; the next code successfully logged in. Each rejection was checked while the original code's time step was still current, so these results do not merely demonstrate expiry.

The installed Keycloak CredentialHelper bytecode calls normal credential validation after creating OTP credentials. This agrees with [Keycloak 26.7.3 CredentialHelper](https://github.com/keycloak/keycloak/blob/26.7.3/server-spi-private/src/main/java/org/keycloak/utils/CredentialHelper.java). Its [OTP credential provider](https://github.com/keycloak/keycloak/blob/26.7.3/services/src/main/java/org/keycloak/credential/OTPCredentialProvider.java) uses the single-use store when code reuse is disabled.

## Evidence

probe.json: app-initiated enrollment. account-probe.json: native account-console enrollment. security-flow.json: cross-app login, security reauthentication and subsequent login. Diagnostics contain no OTP values, setup secrets or passwords. Source remains the unchanged 704-input candidate ac622c2e20c09702e515ef87e9a832994b98369906e8952ec83230f1a86b0ba6. Existing CANDIDATE.json and VERIFICATION.json remain unchanged; this is supplementary diagnostic evidence.

## Open Questions

The reported acceptance remains unreproduced. The exact user flow, where the code was first accepted, and whether the second screen performed a new verification or resumed an authenticated session remain pending clarification. These bounded tests do not prove all authentication flows or restart/cluster behavior. No security policy was weakened or altered to accommodate reuse.

## Authenticator-path follow-up

The user confirmed authenticator setup. The scoped main-account timeline (authenticator-timeline.json) shows OTP saved at 01:51:39 UTC, a failed sign-in at 01:51:55, and a successful sign-in at 01:52:05 on 2026-09-08. Success was after the next time-step boundary. This is consistent with a refreshed code, but neither the entered digits nor the credential responsible for the failed login is recorded. Identical-code acceptance remains unproven and unreproduced; this narrows, rather than resolves, the open question above. No implementation or account credentials changed.
