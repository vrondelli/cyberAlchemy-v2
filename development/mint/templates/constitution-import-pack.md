---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #17, SWU-8 seed-format); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--new, Tier-2 additions build)
swu: SWU-8 (seed-format batch) — addition #17
source_artifact: cyberAlchemy-v2/authority/constitutions/ (cav2's OWN rule instances — NOT copied)
emits_to: <TARGET_REPO>/authority/constitutions/CONSTITUTION-IMPORT-PACK.md
guardrail: >
  Seed the constitution-AUTHORING ROUTE + import pack (how the domain authors/imports its own
  constitution rules), NEVER cav2's 11 STABLE-REPOSITORY rule instances. Those rules carry cav2 selectors
  (cyberAlchemy-v2/**) and are cav2's own policy; copying them installs cav2's System-5 in the domain
  (audit #17 / circularity). The domain authors its OWN rules via this route.
leak_strip: |
  No cav2 rule instances are emitted. The pack is the route + the rule-slot format only.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the constitution-authoring ROUTE (how a candidate
  structural rule becomes a local constitution) + the rule-slot FORMAT. LOCALIZES: the rules themselves.
  DO NOT copy cav2's STABLE-REPOSITORY-CONSTITUTION rule instances — the domain authors its own.
-->

# <DOMAIN> Constitution Import Pack

Status: candidate local route
Owner: constitution-governance (domain-local)

## How the domain authors a constitution rule (the route, inherited)
```text
candidate structural rule
  -> constitution-governance intake
  -> rule-slot drafted (see format below)
  -> validation mode named (review | hybrid | deterministic)
  -> owner decision (decision-gate if contested)
  -> active local constitution rule in constitutions/<DOMAIN>-CONSTITUTION.md
```

## Rule-slot format (inherited; the domain fills it)
<!-- FILL-LATER FORMAT SPECIMEN — the fenced block below is a format the DOMAIN fills when it authors a
     rule; its <...> tokens are intentional and are EXEMPT from EMIT-PROCEDURE §7 check #10 (zero dangling
     placeholders). Do NOT resolve these at mint-emit; they are the slot the domain fills later. -->
```md
### <DOMAIN>-C<n>. <Rule name>
Validation mode: <review | hybrid | deterministic>
<the rule — a structural constraint on future domain artifacts>
Examples: <conforming>. Non-examples: <violating>.
```

## What to IMPORT vs AUTHOR
- **Import (route only):** the authoring route above + the four inherited meta-rules already in
  `<DOMAIN>-CONSTITUTION.md` (claim≤evidence, anti-laundering, status-non-collapse, load-bearing-term).
- **Author locally (do NOT copy cav2):** every structural rule the domain needs (public/private,
  navigability, extraction, entropy, value-cycle, artifact-tree, interface-evidence, …). If the domain
  needs a rule cav2 also has, **author the domain's own version** — never copy cav2's instance.

<!-- Seed-format guardrail (emit self-check): this file emits ZERO cav2 CAV2-C* rule bodies — the route
     and the slot only. -->
