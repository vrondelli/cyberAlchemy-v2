# G01 BugSwarm guarded confirmation r49 — target-existence census protocol

Status: frozen evaluator-only, score-blind census.

For each of the 24 sealed r48 roots, request the GitHub comparison between the
exact failed and passed commits from frozen BugSwarm 1.3.1 metadata. Require
HTTP 200, exact comparison identity, fewer than 300 returned files, no pagination
link, and at least one changed old-side `.py` path present in the failed-source
Git index. Renames use `previous_filename`; added-only files do not qualify.

Frozen inputs:

- BugSwarm 1.3.1 JSON SHA-256:
  `c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d`
- r45 result SHA-256:
  `26e9de47e18b74d5baf6737ef70fbc06f63b66c7a85940d76fca5c85e3798f09`
- r46 result SHA-256:
  `9fc37dd17929e486e9d2ba347ef66ca9fa37aef80a29b8ee84b384ea1bb9e451`
- r48 projection result SHA-256:
  `bcc866fdae18d163850bbaa530a410e071e0e6948ff62710da3d22b6b915413b`

Make one request per case, no retries, and continue through inadmissible cases.
Preserve responses and receipts privately in WSL. Gold paths must not be sent to
the VPS or model. If any case is inadmissible, do not silently replace it or
reduce the denominator; record the terminal cohort deficit for a separately
frozen repair decision.

## Claim ceiling

Target-existence eligibility only; no score, accuracy, or superiority result.

## Open Questions

- Are all 24 cases admissible under the exact failed-source rule?
- If not, can the three remaining r46-admitted repositories support a separately
  frozen fixed-order repair without weakening the 24-case denominator?
