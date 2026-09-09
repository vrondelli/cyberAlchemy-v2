---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #8, SWU-5); intended-not-shipped, non-executed
created: 2026-07-01
authored_by: sigil-development (--new, Tier-1 additions build)
swu: SWU-5 (definitions-lifecycle equipment) — addition #8
source_artifact: cyberAlchemy-v2/authority/definitions/DEFINITION-DRIFT-AUDIT.md (cav2 machinery, shape reference)
emits_to: <TARGET_REPO>/definitions/DEFINITIONS-INDEX.md
closes: the "fires-into-void" self-inconsistency — the constitution's C(meta-4) Load-Bearing Term
  Tracking rule requires a "tracked authority entry (a canonical definition ID)"; THIS index is that
  registry, and definition-drift-audit.md reconciles against it.
leak_strip: |
  Pure machinery (a registry FORMAT). No cav2 object rows are copied — the index is EMPTY at emit
  (seeded with the DEFINITIONS.md cards only). It inherits the index shape, localizes the rows.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the definition-index FORMAT (the registry the
  load-bearing-term rule means by "a tracked authority entry"). LOCALIZES: the rows (one per emitted
  DEFINITIONS.md card; the domain owner appends as the card set grows). This is emitted ALONGSIDE
  DEFINITIONS.md at stage 2 so the constitution's C(meta-4) rule resolves against a real target.
-->

# <DOMAIN> Definitions Index

Status: active
Owner: definitions-governance (domain-local)
Reconciled by: [DEFINITION-DRIFT-AUDIT.md](./DEFINITION-DRIFT-AUDIT.md)

The canonical registry of every <DOMAIN> definition card. A **load-bearing term** (constitution rule
`<DOMAIN>-C(meta-4)`) is "tracked" iff it has a row here that resolves to a card in
[DEFINITIONS.md](./DEFINITIONS.md). A load-bearing term cited with no row here is a **drift defect** the
drift audit must flag.

| Definition ID | Term | Status | Source kind | Card |
| --- | --- | --- | --- | --- |
| `<DOMAIN>-D1` | <DOMAIN_TOP_LEVEL_TERM> | active | operator-reading; local-inference | [DEFINITIONS.md#<domain>-d1](./DEFINITIONS.md) |
| `<DOMAIN>-D2` | <DOMAIN_ORIGINATED_TERM> | active | local-inference | [DEFINITIONS.md#<domain>-d2](./DEFINITIONS.md) |
| `<...>` | <the domain owner appends one row per new card> | candidate\|active\|deprecated | <source kind> | <card link> |

## Status vocabulary
- `candidate` — first-cited, carries an `Open / to-ground:` field; not yet validation.
- `active` — a full three-voice card exists and its load-bearing terms resolve.
- `deprecated` — superseded; keep the row with its supersedes/superseded-by link (never delete).

<!-- The domain owner maintains this index through the definitions lifecycle. Every row must resolve to
     a card; the drift audit flags any load-bearing term missing a row. -->
