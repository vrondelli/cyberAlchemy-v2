# Durable session policy
The exact shared runtime policy denies equality at idle and absolute boundaries, revoked/missing sessions, stale/future/malformed authentication times. Twelve finite cases are evaluated. A mutation allowing equality at both deadlines must fail two cases. This does not certify SQL concurrency, OIDC or whole application security; separate real-database/browser tests supply those bounded witnesses.

## Open Questions
See ../README.md#open-questions.
