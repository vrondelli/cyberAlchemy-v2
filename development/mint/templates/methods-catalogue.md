---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #13, SWU-7); intended-not-shipped, non-executed
created: 2026-07-01
authored_by: sigil-development (--new, Tier-1 additions build)
swu: SWU-7 (governance-function → methods catalogue) — addition #13
source_artifact: projects/domainspec-v2/ (the first real mint grew a Methods catalogue by hand; = handoff L2)
emits_to: <TARGET_REPO>/authority/METHODS-CATALOGUE.md
rationale: >
  Audit finding G2 — "a kind without its methods is a name with no actuator." Each proposed
  domain-originated authority kind (AUTHORITY-MODEL) needs its methods: the operations that actuate the
  governance function. domainspec-v2 grew this by hand; the template emits the stub so every mint carries it.
leak_strip: |
  Methods resolve to the DOMAIN's own owner routes; cav2 appears nowhere. Inherits the catalogue FORMAT,
  localizes the methods.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the governance-function → methods FORMAT.
  LOCALIZES: the methods per kind. One block per DOMAIN-ORIGINATED authority kind in AUTHORITY-MODEL.
  A method = a named operation that actuates the kind's governance function (intake, route, decide,
  record, demote). Emitted at stage 2 alongside AUTHORITY-MODEL so no proposed kind is a name-without-actuator.
-->

# <DOMAIN> Governance Methods Catalogue

Status: active local catalogue
Owner: <DOMAIN> owner (per-kind owner routes below)
Binds: [authority/AUTHORITY-MODEL.md](./AUTHORITY-MODEL.md) — one section per domain-originated kind.

For each domain-originated authority kind, its **methods** = the operations that actuate its governance
function. A kind with no methods is a name with no actuator (audit G2).

## <DOMAIN_ORIGINATED_KIND_1> — methods
Owner route: **<DOMAIN_NEW_OWNER_ROUTE_1>**

| Method | What it does | Input → output | Gate | Evidence |
| --- | --- | --- | --- | --- |
| `intake` | admit a candidate of this kind | candidate → staged record | source-posture named | <where staged> |
| `route` | send it to its owner route | staged → owner queue | narrowest-owner rule | owner-routing table |
| `decide` | owner ratifies / rejects / defers | queued → verdict | D49 owner-gate | decision record |
| `record` | persist the decision | verdict → `authority/decisions/` | claim ≤ evidence | decision card |
| `demote` | supersede/retire an active instance | active → superseded | `stop_rule` | promotion-policy |

## <DOMAIN_ORIGINATED_KIND_2> — methods
Owner route: **<DOMAIN_NEW_OWNER_ROUTE_2>**

| Method | What it does | Input → output | Gate | Evidence |
| --- | --- | --- | --- | --- |
| <...> | <the owner authors the methods for each kind> | ... | ... | ... |

<!-- The domain owner adds one section per domain-originated kind. Every kind in AUTHORITY-MODEL that
     carries an owner route must have a methods block here (emit self-check #6). -->
