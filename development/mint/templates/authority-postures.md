---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #3, SWU-8 seed-format); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--new, Tier-2 additions build)
swu: SWU-8 (seed-format batch) — addition #3
source_artifact: cyberAlchemy-v2/ontology/AUTHORITY-POSTURES.md (cav2's OWN 8 postures — shape reference ONLY, rows NOT copied)
emits_to: <TARGET_REPO>/authority/AUTHORITY-POSTURES.md
guardrail: >
  SEED THE EMPTY CONTRACT, NEVER cav2's ROWS. cav2 has 8 specific postures; those are cav2's own
  reliance taxonomy (object content). This template seeds the posture-CONTRACT (the columns + the
  posture≠confidence rule) and leaves the domain to declare the postures ITS OWN sources need. Copying
  cav2's 8 rows would re-fuse the two System-5 levels (audit #3 / circularity guardrail).
leak_strip: |
  No cav2 posture rows are emitted. The domain's postures classify the domain's own sources.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the posture-CONTRACT (Posture | Allowed use |
  Blocked use columns + the posture≠confidence rule). LOCALIZES: the posture ROWS. DO NOT copy cav2's 8
  postures — the domain declares the postures its own source families need (seed the format, not the rows).
-->

# <DOMAIN> Authority Postures

Status: candidate local posture contract
Owner: <DOMAIN> owner
Binds: [authority/source-spine.md](./source-spine.md) — each source family carries a posture from this table.

**Posture ≠ confidence.** A source's *posture* (how it may be relied on) is independent of *confidence*
(how strongly it is believed). A high-confidence source can still carry a `citation-only` posture.

| Posture | Allowed use | Blocked use |
| --- | --- | --- |
| <DOMAIN_POSTURE_1> | <how a source of this posture may be relied on> | <what it may never be used for> |
| <DOMAIN_POSTURE_2> | <...> | <...> |
| <the owner declares one posture per reliance mode its sources actually need> | ... | ... |

<!-- Seed-format guardrail (emit self-check): this file must contain ZERO of cav2's own posture rows
     (Original authority / Evidence / Template / Research / Generated projection / Private evidence /
     Public framework / Unknown). It carries the CONTRACT; the domain authors its own postures. -->
