# Auth cutover plan

Owner request: “plan and execute”, 2026-09-19. Local checkpoint only; no push.
Authority effect: none. Preserve existing behavior and identities, not activate
new security/product profiles. Body War remains in DomainSpec-core.

## Execution DAG

`A inventory -> B private backup + baseline -> C local bindings -> D preflight`

`D -> E stop supervisor -> F relocate state + recreate affected services`

`F -> G health/identity/session verification -> H retire old Auth -> I checkpoint`

- A: inspect containers, user services, startup hooks, mounts and source paths.
- B: preserve unit files and exact container metadata privately; obtain consistent
  database dumps, key/certificate fingerprints and identity counts. Do not log
  credentials. Keep PostgreSQL containers and named volumes unchanged.
- C: external operator-state home under `~/.local/share/cyberalchemy/`, local
  source bindings and explicit Body War integration path. No setup, key rotation,
  policy creation or new identity profile during cutover.
- D: validate source, resolved Compose configuration and mount paths. Preserve
  current image digests, users, ports, networks and database-volume identities.
- E/F: stop the failing supervisor and maintenance timer; preserve their enabled
  state. Copy operator state with permissions and hash verification; exclude live
  sockets. Recreate only Keycloak/proxy if the preflight comparison permits it.
  Run existing-state recovery, not provisioning/setup scripts.
- G: check verified TLS discovery, application health, issuer identity invariance,
  session persistence and focused authorization tests. No destructive live tests.
- H: only after G, scan remaining active consumers and relocate the original Auth
  directory to a private recoverable archive, never broad-delete it. Retain frozen
  provenance identities unchanged; classify historical reproduction separately.
- I: checkpoint exact migration paths, exclude private state and unrelated work.

## Rollback

Before F, failures leave live containers untouched. After F, restore saved user
units and old-source mounts using preserved runtime files and unchanged database
volumes. Do not restore database dumps over newer data automatically. A dump is
recovery insurance, not a routine rollback step. Preserve both state copies until
verification and do not delete volumes, identities, users or credentials.

## Current frontier and operational boundaries

Source relocation already passes focused tests; historical receipts are not new
admission. Operational owner: current user, with execution delegated in this
request. Service restart is authorized; changing auth/security behavior is not.
Unexpected security, policy or data decisions stop the affected stage.

Audit found a pre-existing restart loop: the running service's Compose env lacks
the newly required profile keys, and its application readiness fails. The running
proxy user also differs from today's Compose source. Preserve the actual live
configuration; do not silently apply the newer privilege layout.

## Open Questions

None about the requested scope. Any newly discovered identity/security decision
must be returned to the owner before the affected cutover stage proceeds.
