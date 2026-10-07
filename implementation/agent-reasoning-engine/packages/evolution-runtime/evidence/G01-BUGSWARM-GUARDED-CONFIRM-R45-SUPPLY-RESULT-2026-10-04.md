# G01 BugSwarm guarded confirmation r45 — untouched supply result

Status: terminal source/log supply deficit. The frozen r32 queue tail supplied
23 admissible repositories against the predeclared requirement of 24.

The protocol SHA-256 is
`5e66a2288e65bcb20131629c965e75955ce645bb5c5b66fc5ef44158acf744b4`.
The runner SHA-256 is
`0997a71c5579fbed3cf93f827e851d01c4fb6a22f135f1ccf74cedfe6a2c90d5`.
The private result SHA-256 is
`26e9de47e18b74d5baf6737ef70fbc06f63b66c7a85940d76fca5c85e3798f09`.

All 29 untouched Python repositories at frozen queue indices 11–39 were
attempted once and in order. The run made 114 network calls, used no automatic
retry, and retained 1.2 MiB of compressed receipts. Twenty-three passed exact
failed-source and failed-log authentication.

Six failed:

- four source-valid cases returned only 32,577 log bytes despite authenticated
  raw-log lengths of 202,701–987,494 bytes;
- two failed-commit source archives returned HTTP 404.

The denominator was not reduced. No label, passing source, patch, ranking,
provider, model, score, or gold target was accessed. No confirmation benchmark
was run and no accuracy or superiority claim follows.

## Research follow-up

BugSwarm's official documentation exposes a separate REST API method,
`get_build_log(job_id)`, specifically for retrieving original build logs. A
separate protocol must validate that method uniformly across all 29 candidates,
including byte-for-byte comparison against every already-authenticated HTTPS
log, before it can repair this availability boundary.

## Open Questions

- Does the official REST representation decode to the exact HTTPS log bytes for
  all 23 admitted cases?
- Does it return complete logs matching the authenticated HTTPS length for the
  four transport-truncated cases?
- Will at least 24 source-valid repositories remain after uniform REST
  validation and the later target-existence census?
