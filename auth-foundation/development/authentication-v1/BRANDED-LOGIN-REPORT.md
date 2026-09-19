# Branded login implementation

Date: 2026-09-07. Status: ready for human live testing. 12 unit tests, 9 live scenarios, scoped EVF and independent verification passed. Local prototype only.
Authority effect: none. This is the successor implementation of
[the approved implementation plan](BRANDED-LOGIN-PLAN.md), bounded by
[the route contract](BRANDED-LOGIN-CONTRACT.json).

Opening http://localhost:13000 starts OIDC directly when a session is needed.
The native Keycloak sign-in form uses Auth Foundation branding. Opening
`/document` first returns to that document after successful authentication.
The server owns the destination identifiers; caller-supplied return URLs are
rejected. Machine API responses remain JSON with their existing service profile.

Successful logout reaches `/signed-out`, which waits for explicit Sign in.
The app retains Origin and CSRF validation. Chromium applies `form-action` to
redirects from the logout form, so the policy permits the fixed, validated
Keycloak logout endpoint in addition to the app itself. Failed callbacks are
terminal branded pages with explicit retry and no raw provider error details.
A bounded issuer availability check handles outages before login/logout
redirects. Local logout remains effective when the issuer is unreachable, and
the page explicitly says issuer sign-out could not be confirmed. A network
failure after that check can still interrupt the cross-origin navigation;
this prototype cannot guarantee an issuer logout acknowledgement in that race.

The theme inherits `keycloak.v2` from the pinned Keycloak 26.7.3 image and adds
CSS and English message overrides only. Native forms, hidden inputs, password
visibility, error messages and accessibility markup remain inherited. Setup
mounts the theme read-only, selects it only for the application realm and
updates the existing browser client's exact logout destination. Theme caching
is disabled for local iteration, as described in the
[Keycloak theme documentation](https://www.keycloak.org/ui-customization/themes).
The master administration realm retains its existing theme.

## Validation and evidence

Candidate input digest: `30f6b695de672a4c73f473ea933f6b5a7ec1c7f958a93c4e8795e0fb5f5dfaa8` (149 files).

The final run passed 12 unit tests and 9 live scenarios. These cover fresh browser
entry, direct document return, existing app/SSO sessions, successful callback
replay rejection, wrong state, cancellation, expired transaction cookie, invalid
credentials, safe destinations, logout CSRF and old-cookie rejection, current
policy, disabled service clients, issuer outages at API/callback/entry/logout,
repeated setup preserving identity state, and malformed request URLs without
crashing the application. Desktop and 320px screenshots
were inspected; keyboard login and autocomplete attributes were checked.

[Desktop sign-in](../../implementation/authentication-prototype/evidence/screenshots/branded-login-desktop.png),
[mobile sign-in](../../implementation/authentication-prototype/evidence/screenshots/branded-login-mobile.png),
[authenticated app](../../implementation/authentication-prototype/evidence/screenshots/branded-app.png),
[signed-out page](../../implementation/authentication-prototype/evidence/screenshots/branded-signed-out.png).

The prior approved authorization candidate's 222 input files still match their
recorded hashes. Existing-state setup and container recreation were tested; a
new empty-database bootstrap was not rerun in this UX revision.

Scoped EVF passed all 13 stages, one check, six hostile-input mutations and two
repetitions. The independent verifier returned `passed` for all stages.
[EVF evidence](../../implementation/authentication-prototype/evidence/evf/runs/sha256/f94b3209760421f5e266be5339bbbab9cea028490f327416104cfc4ab3fb0623/authentication-branded-login-003/EVIDENCE.json)
and [independent verification](../../implementation/authentication-prototype/evidence/evf/INDEPENDENT-VERIFICATION.json).
Evidence digest: `f94b3209760421f5e266be5339bbbab9cea028490f327416104cfc4ab3fb0623`.

DAG nodes A–F are complete for this bounded prototype. G is the live handoff at
http://localhost:13000; human feedback and candidate approval remain separate.
The [test transcript](../../implementation/authentication-prototype/evidence/live-test.txt)
and [machine-readable result](../../implementation/authentication-prototype/evidence/TEST-RESULT.json)
record the final passing unit/live run and current EVF status. Unit and offline EVF checks exercise
the real JWT verifier and compiled Rust authorization bridge. Separate Chromium
and live-provider scenarios establish the visible login/logout behavior; EVF
does not claim to prove the theme or live OIDC integration.

The original 144-input authentication prototype and all its evidence were
preserved before edits in the
[historical snapshot](history/2ca2c2da173c8b1f42ca0b2770b485e65f16908304a36a28427dd10b58f5334c/README.md).
That archive stores input bytes by content hash and retains original evidence
unchanged. Historical absolute paths describe the original workspace and are
not asserted current after this change. The separately approved authorization
engine remains a predecessor; no approval is extended to this new candidate.

## Open Questions

Human live feedback and exact candidate approval remain pending. This build is
loopback-only HTTP in Keycloak development mode; production hostname/TLS,
Secure cookies, administration, key custody, recovery, passkeys/MFA and broader
security assurance remain in [the requirements](REQUIREMENTS.v1-candidate.md).
Full successor DomainSpec compilation and formal correspondence remain outside
this hand-authored integration. Screen-reader behavior and actual third-party
password-manager integration have not been exhaustively evaluated; browser
checks cover labels, inherited live errors, autocomplete hints and keyboard use.
