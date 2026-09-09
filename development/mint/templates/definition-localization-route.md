---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #9, SWU-9 meta); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--new, Tier-2 additions build)
swu: SWU-9 (meta-pattern batch) — addition #9
source_artifact: cyberAlchemy-v2/authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md (cav2 machinery, shape reference)
emits_to: <TARGET_REPO>/definitions/DEFINITION-LOCALIZATION-ROUTE.md
rationale: >
  How a domain imports a harvested term and canonicalizes its OWN definition (import → represent →
  canonical) with a local-posture vocabulary and a reviews/ staging area. This is meta machinery (a
  route the domain applies to its own terms), so it is inherited whole.
leak_strip: |
  The route canonicalizes the DOMAIN's own definitions; a harvested cav2 term is provenance, never the
  canonical authority (consistent with definitions.md Obs-B note).
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the import→represent→canonical ROUTE + local-
  posture vocabulary + the reviews/ staging convention. LOCALIZES: nothing structural (route is meta);
  the domain applies it to its own terms. Emitted alongside DEFINITIONS.md + INDEX + DRIFT-AUDIT (SWU-5/9).
-->

# <DOMAIN> Definition Localization Route

Status: active local route
Owner: definitions-governance (domain-local)
Staging: `definitions/reviews/` (pre-canonical review area)

## The route (inherited)
```text
harvested / cited term (posture: imported)
  -> represented locally (posture: represented — a local card citing the source as provenance)
  -> reviewed in definitions/reviews/ (pre-canonical)
  -> owner canonicalizes (posture: canonical — indexed in DEFINITIONS-INDEX, tracked by DRIFT-AUDIT)
```
No arrow is automatic. A term can stay `represented` indefinitely; only the owner promotes to `canonical`.

## Local-posture vocabulary (inherited)
- `imported` — cited from a source; **not** local authority (provenance only).
- `represented` — a local card exists that cites the source; the meaning is being localized.
- `canonical` — owner-canonicalized; indexed; the only posture that counts as domain definition authority.

## Reviews staging
`definitions/reviews/<term>.md` holds a term while it is pre-canonical. A `represented` term used as
authority before canonicalization is a drift defect (DRIFT-AUDIT flags it).

<!-- Meta route (inherited whole): the domain applies it to its own terms; cav2 terms enter only as
     `imported` provenance, never `canonical`. -->
