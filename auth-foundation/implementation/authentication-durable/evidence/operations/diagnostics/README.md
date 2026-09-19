# Recovery callback investigation

The first operations regression run failed once with an application 401 immediately after an accepted recovery-code login. Its candidate digest was c529bcbe959917b94e82d50d8aa711fba5cc8472a40a92e13228acb33666566f. The original output/result are retained here rather than silently discarded.

A separate disposable-user reproduction passed. The subsequent full run passed that same recovery-code login and replay-rejection stage. Safe callback reason logging was added; no credential values or tokens are logged. No authentication check was weakened. Switching the passkey resident-key configuration to Keycloak's current field and updating security-page wording are separate changes; they do not establish a cause for the earlier failure.

## Open Questions

The original rejection's precise cause was not captured. Retain this as a monitoring item if it reappears; do not describe it as a proven repaired bug. Current test admission is owned by ../..//VERIFICATION.json and the current suite receipts. External deployment questions remain in ../../../operations/README.md#open-questions.

## Confirmed proxy defect

A later controlled replay against the unchanged predecessor proxy demonstrated quota starvation: static assets and authentication consumed one shared limit. See ../proxy-baseline.json for the rejected-asset count and subsequent authentication 429. The successor gives static assets a separate allowance, retains the authentication limit, and passes the 120-asset burst / authentication-limiting / public-admin / spoofed-forwarding checks in ../proxy.json. This fixes a demonstrated cause of load-sensitive failures; the precise error from the original callback was not recorded, so individual historical failures are not retroactively assigned a proven cause.

The account-console timeouts are retained alongside the callback evidence. Current test receipts determine the final candidate's admission.

## Resource-pressure run

On 2026-09-08 around 03:42 UTC the issuer database logged a backend exit (code 2), restarted its backend processes and recovered. Keycloak subsequently returned a database-related 500. Host swap was full and memory-pressure measurements showed substantial stalls. This establishes the database interruption and host pressure; it does not prove the backend was killed by the OOM killer.

The final candidate caps Keycloak at 2 GiB with a 1 GiB maximum heap. Security, console and lifecycle browser tests close contexts after their last assertion, instead of retaining all historical tabs until the suite ends. Assertions, OTP reuse prevention and timeout values remain unchanged. Form-fill values are redacted from error diagnostics. Resource limits do not guarantee availability if unrelated host workloads exhaust the machine.
