# Persistent login failure analysis

Date: 2026-09-07. Scope: local HTTPS prototype and its HTTP predecessor.
Status: diagnosis completed; user confirmation of successful manual login pending.
Authority effect: none. No application source, password or global trust changes.

## Findings

The latest reported failures occurred at Keycloak credential validation, before
the app callback. Sanitized issuer events at 17:08:56, 17:10:54, 17:11:22 and
17:11:27 UTC record LOGIN_ERROR / invalid_user_credentials with username alice.
At inspection Alice was enabled, had no required actions, was not temporarily
disabled, and had four recorded failures. Those events establish the failure
stage; they do not reveal which password the user typed or an autofill source.

The HTTPS and HTTP prototypes have separate generated passwords. A controlled
attempt with the HTTP password against auth-https reproduced exactly “Invalid
username or password.” Replacing it with the HTTPS password on the same form
completed login. Two additional independent fresh Chromium contexts each
completed the app callback (303), reached the signed-in page and retrieved the
protected document (200). The app health endpoint returned 200.

This identifies an incomplete credential handoff as the leading explanation:
the assistant supplied a username and URL and repeatedly opened prefilled windows,
but did not provide an accessible credential for use in another browser. It does
not prove which credential was submitted in the user's attempts.

## Distinct failure paths

| Stage | Evidence / result | Implication |
| --- | --- | --- |
| Browser TLS | Existing disposable frontend certificate is valid Sep 7–21; a request with an empty trust store rejects its chain | Normal browsers need their own trust setup; the isolated Chromium trust does not propagate |
| Username/account | alice exists, enabled, no required actions, not disabled at inspection | No account reset was required |
| Password | Current HTTPS password succeeds; old HTTP password reproduces the reported error | Use the credential belonging to auth-https |
| OIDC callback | Two fresh contexts return 303 and obtain app sessions | No callback failure reproduced with current credentials and fresh transactions |
| Protected resource | Document returns 200 after login | Authentication and the current authorization grant work together |
| Stale login form | Source stores a single-use app login transaction for 180 seconds | A long-open form or saved login-actions URL is not a durable entry link |
| App session | Separate 900-second idle and 28800-second maximum | This policy applies after successful login; it does not cause invalid credential events |

The expired-form path follows from the inspected source; it was not identified
as the cause of the latest credential-rejection events. Historical PKCE errors
at 16:53 UTC came from the recorded adversarial regression tests, not evidence
of the later user's credential failure.

## Concrete handoff correction

A mode-0600 file, `implementation/authentication-https/.runtime/TEST-LOGIN.txt`,
contains only the local disposable Alice username/password, the correct app URL
and entry instructions. It does not expose client, database or operator secrets.
The password is intentionally absent from this durable report. No password was
changed and no certificate validation bypass was introduced.

Open that private file locally. In the isolated trusted Chromium browser, start
at https://localhost:13443, use Sign in again if shown, and enter the HTTPS
credential. Start a new attempt if the form has been sitting for more than three
minutes. Do not reuse a saved Keycloak login-actions URL.

## Verification and limits

All 163 frozen inputs still match candidate
`e4e209bcab9be67f6176b712b6bc20c2c13c72e5ca30b54f550207d328f3e7b5`.
No new implementation candidate or EVF run is needed for this diagnosis and
private credential handoff. Existing broader test results are in
[SESSION-LIFECYCLE-REPORT.md](SESSION-LIFECYCLE-REPORT.md).

A negative-control diagnostic first waited on an error-element ID absent from
this Keycloak theme and timed out. Reading the displayed error text reproduced
the expected rejection, followed by successful correction on the same form.
This was a diagnostic selector failure, not an application source change.

## Open Questions

- Which exact browser and current message does the user see after using the
  verified HTTPS credential? No claim of successful user testing is made yet.
- Is the user reusing the HTTP password, browser autofill, or another value?
  Issuer events cannot establish this.
- Should a later local developer interface provide a clearer credential handoff
  and explain stale login attempts without requiring this private file?
- Persistent real-user hosting still needs a proper certificate/domain and
  credential onboarding policy; these remain outside this disposable prototype.
