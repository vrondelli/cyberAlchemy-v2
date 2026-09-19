# MFA button repair

User authorization: reported unreadable Cancel and unclickable Submit on the MFA setup screen. The prior 701-input lifecycle candidate was verified and archived in development/authentication-v1/history/before-mfa-button-repair before edits.

## Bounded construction plan

Preserve predecessor → inspect native template and computed styles → repair successor login theme → verify both actions and responsive hit targets → capture current evidence. Operational owner: local prototype operator. No operational blocker; existing mounted successor theme and realm settings are sufficient. No issuer restart, credential changes to real accounts or public deployment is required.

Cancel inherited near-white text (`rgb(233,238,232)`) on a near-white native background (`rgb(239,239,239)`). The successor login theme now uses the secondary button class and explicit dark background with readable text, hover and active colors. Native Keycloak templates and submission handlers remain inherited and unchanged. The live predecessor check showed Cancel already worked on an empty form; no functional Cancel defect is claimed.

Submit could not be reproduced as unclickable. Trusted Chromium checks at desktop and mobile widths verified both button hit targets, enabled state and Cancel focus. Actual submissions verified visible errors for empty/incorrect OTP and successful enrollment for a valid OTP. Cancel on an empty form saved no credential. Two apps × six checks = twelve current checks; screenshots exclude the QR/setup secret. Earlier lifecycle and EVF evidence is explicitly inherited for this presentation-only repair.

## Open Questions

The user's Windows-browser Submit report remains unreproduced; whether a code was entered or an error appeared is pending clarification. Old open pages can retain the former theme; begin a fresh sign-in to test the updated screen. The shared login theme still requires review when upgrading Keycloak. No production-security claim follows from these button tests.
