# G01 BugSwarm guarded confirmation r47 — failed-source acquisition protocol

Status: frozen private score-blind source protocol.

## Objective and cohort

Acquire and validate the exact failed-commit source archives for the 24 r46
selected repositories, fixed as queue indices 11–34. Selection order and
membership cannot change in this stage.

Frozen r46 result SHA-256:
`9fc37dd17929e486e9d2ba347ef66ca9fa37aef80a29b8ee84b384ea1bb9e451`.
Frozen r45 result SHA-256:
`26e9de47e18b74d5baf6737ef70fbc06f63b66c7a85940d76fca5c85e3798f09`.

## Rule

For each case, in queue order, make one HTTPS GET to GitHub codeload for the
exact failed commit. Preserve the archive and require:

- HTTP 200 on the expected HTTPS codeload origin;
- complete transport and at most 256 MiB compressed;
- a safe single archive root matching repository basename and commit prefix;
- at most 250,000 members and 4 GiB declared regular-file bytes;
- at least one `.py` member, with individual projected files capped at 1 MiB
  and total projected Python capped at 64 MiB.

Use the already-audited r35 archive inspection implementation without changing
its limits. There are no retries or replacements. If any case fails, stop before
projection and record the exact deficit.

No build log content, label, passing source, patch, gold target, ranking, or
model call is allowed in this stage.

## Claim ceiling

Exact failed-source availability only; no accuracy, efficiency, or superiority
claim.

## Open Questions

- Will all 24 source archives pass the frozen safety and size bounds?
- What projected corpus size will the later code-only stage produce?
