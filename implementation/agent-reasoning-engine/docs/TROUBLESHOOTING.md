# Troubleshooting

## `doctor` reports a runtime mismatch

Use Node `26.8.1`. The exact version is part of the candidate profile. Re-run
`node bin/are.mjs doctor --json` after switching runtimes.

## Candidate inspection reports source drift

The current product closure differs from the frozen closure. Read the reason
codes, compare `node bin/are.mjs closure --json` with
`evidence/product-candidate.018.json`, and decide whether the change belongs in
a successor candidate. Never overwrite Candidate 018 with different bytes.

## Candidate 013 cannot be reconstructed from current sources

Candidate 013 binds workspace inputs outside the ARE Git commit: 1,554
DomainSpec files and 215 ignored Alch compiler files. The latest explicit
recoverability snapshot finds 465 frozen files unavailable from current sources
or selected commits. Use self-contained
Candidate 018 for current packaging. The historical artifact preflight records
Candidate 013's limitation.

## `decide` rejects a request

Validate the request against
`implementation/agent-reasoning-engine/schemas/cli-request.schema.json` (the
runtime copy, checked for drift against the repository-facing schema). Check schema version,
unique session/request IDs, field postures, and the exact predecessor receipt.
Engine or source failures are diagnostics. Do not select a fallback route.

## The effect operation exits 3

Exit 3 means the proposal crossed a consequence or owner gate. Check whether
the current conversation already contains exact authorization. Otherwise ask
the named owner for the smallest missing decision. The directive itself grants
nothing.

## Gateway reconnect fails

Check the socket path and permissions, resume token, runtime epoch, client
identity, acknowledgement position, and whether the session expired. Treat an
unknown crash-time request as blocked rather than redispatching it.

## Product tests leave temporary directories

Successful isolated runs remove themselves. A failed isolation run retains its
directory in the system temporary location and includes that path in the error.
Inspect it, preserve necessary evidence, then remove it deliberately.

## Disk space drops during research

Stop new dispatch. Inspect `.cache/are` and the research run roots. Retain
reviewed decisions and hash-bound manifests. Remove reconstructible caches
according to the research storage policy. Product evidence and benchmark caches have
different lifecycles.

## Open Questions

- Should `doctor` report missing non-Git closure inputs individually before
  candidate inspection?
