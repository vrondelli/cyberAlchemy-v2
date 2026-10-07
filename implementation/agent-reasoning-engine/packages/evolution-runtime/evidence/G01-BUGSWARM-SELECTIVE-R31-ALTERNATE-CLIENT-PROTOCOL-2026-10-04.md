# G01 BugSwarm selective-GLM r31 — alternate-client log repair

Status: fixed before requests. R29 rows 7, 10, 12, 15, 18, 19, and 21 passed
exact failing-source availability and BugSwarm page identity, but their one
curl raw-log transfer ended with exit 56. R30 established that byte ranges are
not honored on the tested endpoint.

Bind r29 result SHA-256
`f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017`
and r30 result SHA-256
`cf2dd60d247d86dfc6938f0f8dc7c2fa1c0a1dcac3e06a49768e9fb849135e40`.
For each of the seven fixed rows, issue exactly one HTTPS GET with Python's
standard HTTP client, no redirect, no range, no retry, and read at most the
sealed declared content length plus one byte. Preserve the status, headers,
body or partial body, and any incomplete-read error.

A row is repaired only when status is 200, the final URL is the exact expected
BugSwarm raw-log URL, `Content-Length` equals the r29 sealed value, the body
length equals that value without an extra byte, and the complete body is strict
UTF-8. The stage passes only if all seven rows repair. Partial success remains
usable source/log availability evidence for those exact rows; unresolved rows
join the separately frozen score-blind replacement queue.

Do not access labels, passing source, patches, rankings, provider APIs, model
outputs, or scores.

## Open Questions

- Is the curl exit-56 pattern client-specific or endpoint-specific?
- How many of the seven rows can be retained without repository replacement?
- After this final bounded transport attempt, how many language-matched
  replacement slots remain?
