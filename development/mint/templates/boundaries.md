---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #6, SWU-8 seed-format); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--new, Tier-2 additions build)
swu: SWU-8 (seed-format batch) — addition #6
source_artifact: cyberAlchemy-v2/authority/boundaries.md (cav2 machinery, shape reference)
emits_to: <TARGET_REPO>/authority/boundaries.md
guardrail: >
  Seed the boundary SKELETON (the boundary kinds a governed repo declares). LOCALIZE the engine /
  free-paid / withholding clause — that clause is domain-specific (audit #6), NOT cav2's. A minted repo
  is private-only in the MVP (BLK-CAV2-PUBLIC-PRIVATE-001), so the public/private row is seeded conservative.
leak_strip: |
  The boundaries are the DOMAIN's own; cav2 appears only as a harvested-precedent source posture (citation).
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the boundary kinds a governed repo declares
  (public/private, source/read-model, generated/canonical, research/spec, and any withholding boundary).
  LOCALIZES: the domain's own sides of each boundary, and especially the withholding clause. Replace
  <DOMAIN>/<...> at emit. MVP mints PRIVATE-only.
-->

# <DOMAIN> Boundaries

Status: candidate local boundaries
Owner: <DOMAIN> owner (public/private contested → decision-gate)

| Boundary | This side (allowed) | Other side (blocked without a decision) |
| --- | --- | --- |
| Public / private | **private-only** (MVP; a public surface needs a decision-gate scrub) | any public-attached artifact until the boundary is resolved |
| Source / read-model | authored source | generated read-models are not source |
| Generated / canonical | canonical authored authority | generated projections are not canon |
| Research / spec | research findings | a finding is not a spec until promoted |
| **<DOMAIN_WITHHOLDING_BOUNDARY>** *(localize — domain-specific)* | <what this domain openly publishes> | <the domain's withheld surface — e.g. a proprietary mechanism / free-vs-paid line; author this per the domain, do NOT copy cav2's engine clause> |

<!-- Seed-format guardrail: the withholding row is LOCALIZED (audit #6) — the domain authors its own
     free/paid/withholding boundary; cav2's engine-mechanism clause is NOT copied here. -->
