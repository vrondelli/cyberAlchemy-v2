---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (additions #10 + #18, SWU-10 cheap nav/schema); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--new, Tier-2 additions build)
swu: SWU-10 (cheap nav/schema) — additions #10 (decisions/README + D36 card schema) and #18 (authority/README)
source_artifact: cyberAlchemy-v2/authority/README.md + authority/decisions/README.md + CAV2-D36 decision-card schema (shape reference)
emits_to:
  - <TARGET_REPO>/authority/README.md
  - <TARGET_REPO>/authority/decisions/README.md
rationale: navigable work surface (CAV2-C7) + a decision-card schema so the domain authors more decisions than the one mint record.
leak_strip: pure navigation + a schema FORMAT; no cav2 content.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). Two small navigation/schema stubs emitted at stage 2.
  INHERITS: the README navigation FORMAT + the decision-card schema. LOCALIZES: the domain's own links.
-->

## FILE 1 → `<TARGET_REPO>/authority/README.md`  (addition #18)

```md
# <DOMAIN> Authority

Navigation surface for this repo's authority (CAV2-C7 navigable work surface). Not itself authority.

- [AUTHORITY-MODEL.md](AUTHORITY-MODEL.md) — kinds, postures, owner routing, closure
- [source-spine.md](source-spine.md) — source families + postures
- [promotion-policy.md](promotion-policy.md) — ladder, gates, import rung, stop rule
- [boundaries.md](boundaries.md) — public/private + withholding boundaries
- [constitutions/](constitutions/) — local constitution + import pack
- [decisions/](decisions/) — signed decisions (incl. the mint propose + ratify records)
- [imports/](imports/) — staged sources (import before promotion)
- [../definitions/](../definitions/) — definition cards, index, drift-audit, localization route
```

## FILE 2 → `<TARGET_REPO>/authority/decisions/README.md`  (addition #10)

```md
# <DOMAIN> Decisions

Signed decision records. A decision is authority only after it is recorded here (never ambient consent).

## Decision-card schema (CAV2-D36, inherited)
```yaml
decision_id:            # <date>-<slug>
question:               # the decision resolved
options_considered:     # list
selected:               # the chosen option
rationale:              # why
source:                 # who decided + evidence
timestamp:              # ISO date
remaining_blockers:     # or none
```

Seeded records: `<date>-mint.md` (propose) + `<date>-ratify-mint.md` (close). The owner appends more.
```

<!-- Seed self-check: both files are navigation/schema only; zero cav2 object content. -->
