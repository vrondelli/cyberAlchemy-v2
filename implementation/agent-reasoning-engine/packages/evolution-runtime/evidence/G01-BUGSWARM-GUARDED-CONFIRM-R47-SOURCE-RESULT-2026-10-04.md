# G01 BugSwarm guarded confirmation r47 — failed-source result

Status: all 24 sealed failed-source archives admitted.

The private result SHA-256 is
`5b1428bbf4626ce657efccca225847d2271689fe74ac9d4b92b0389ee76d8d2d`.

Every queue-index 11–34 source archive returned HTTP 200 from GitHub codeload,
completed within the frozen 256 MiB bound, passed safe-root/member inspection,
and contained admissible Python source. There were no retries or replacements.

No log content, label, passing source, patch, gold target, ranking, model call,
or score was opened. This is source-availability evidence only.

## Open Questions

- Do all 24 archives materialize into bounded, hash-bound code-only roots?
- Does every root contain at least one changed Python path from its complete
  failed-to-passed comparison?
