---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #7, SWU-8 seed-format); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--new, Tier-2 additions build)
swu: SWU-8 (seed-format batch) — addition #7
source_artifact: cyberAlchemy-v2/authority/imports/ + STABLE-REPOSITORY-CONSTITUTION CAV2-C11 (import-before-promotion)
emits_to: <TARGET_REPO>/authority/imports/README.md
rationale: >
  The import/inventory rung in the promotion flow (audit #7). A minted domain gets an imports/ ledger so
  a harvested source is STAGED before it is used as local authority (import-before-promotion). Seeded as
  an empty ledger; the single framework import is already carried by the source-spine row.
leak_strip: |
  The import ledger stages sources for the DOMAIN's own use; being imported never makes a source authority.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the import-ledger FORMAT + the import-before-
  promotion rung. LOCALIZES: the import rows. Emitted as an EMPTY ledger (the framework import lives in
  source-spine); the domain appends as it stages new sources.
-->

# <DOMAIN> Authority Imports

Status: active local import ledger
Owner: authority import (domain-local)
Rule: **import before promotion** — a source must be staged here before it is relied on as local
authority. Being imported is not being promoted.

| Import | Source | Posture | Staged date | Promotion handle |
| --- | --- | --- | --- | --- |
| <the domain appends one row per staged source; the framework import is carried by source-spine.md> | ... | imported | ... | <route> |

<!-- Empty-but-live: the rung exists so a new source can be staged the moment the domain harvests one. -->
