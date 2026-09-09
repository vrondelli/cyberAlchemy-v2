---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (addition #8, SWU-5); intended-not-shipped, non-executed
created: 2026-07-01
authored_by: sigil-development (--new, Tier-1 additions build)
swu: SWU-5 (definitions-lifecycle equipment) — addition #8
source_artifact: cyberAlchemy-v2/authority/definitions/DEFINITION-DRIFT-AUDIT.md (cav2 machinery, shape reference)
emits_to: <TARGET_REPO>/definitions/DEFINITION-DRIFT-AUDIT.md
closes: >
  The self-inconsistency the 2026-07-01 audit found (#8): the emitted constitution's C(meta-4)
  Load-Bearing Term Tracking rule states "Citing one with no tracked entry is a drift defect the
  definition-drift audit MUST flag" — but no template emitted a drift audit, so the rule fired into a
  void. THIS is the audit the rule names.
leak_strip: |
  Pure machinery. The audit checks the DOMAIN's own terms against the DOMAIN's own index; cav2 never
  appears. Inherits the audit procedure, localizes the term rows.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the drift-audit PROCEDURE + report FORMAT that
  the constitution's load-bearing-term rule references. LOCALIZES: the audited terms. Emitted ALONGSIDE
  DEFINITIONS.md + DEFINITIONS-INDEX.md at stage 2 (SWU-5) so C(meta-4) resolves against a real target.
-->

# <DOMAIN> Definition Drift Audit

Status: active (review-mode; the deterministic scan is a domain follow-up)
Owner: definitions-governance (domain-local)
Reconciles: [DEFINITIONS.md](./DEFINITIONS.md) against [DEFINITIONS-INDEX.md](./DEFINITIONS-INDEX.md)
Authority: this audit is the enforcement target named by constitution rule
  `<DOMAIN>-C(meta-4) Load-Bearing Term Tracking`.

## What this audit checks
A **load-bearing term** = a symbol/named quantity in a formal expression, a fixture FAIL-region, a
candidate invariant, a decidable rule, or the normative content of a claim-ledger entry. For every
load-bearing term used anywhere in the repo's authority/definitions surface:

1. **tracked?** — does it have a row in `DEFINITIONS-INDEX.md` resolving to a card in `DEFINITIONS.md`?
2. **grounded?** — if the card is `candidate`, does it carry an `Open / to-ground:` field?
3. **non-collapsed?** — `candidate` status is not treated as validation.

A term failing (1) is a **drift defect** — create it as a `candidate` card + index row, do not use it as
authority until grounded.

## Audit ledger
| Load-bearing term | First cited in | Tracked (index row)? | Card status | Verdict | Route |
| --- | --- | --- | --- | --- | --- |
| <DOMAIN_TERM_1> | <file:section> | yes → `<DOMAIN>-D1` | active | `pass` | — |
| <DOMAIN_TERM_2> | <file:section> | **no** | — | **drift** | create candidate card + index row → definitions lifecycle |
| <...> | <the owner appends one row per audited term> | ... | ... | ... | ... |

## Gate
- `pass`: every load-bearing term resolves to a tracked, grounded entry.
- `block`: a load-bearing term is used as authority with no tracked card — stop until it is created.

<!-- Emitted empty-but-live: the audit runs the moment the domain has terms; until then it is the
     resolvable target the constitution rule requires (closes the fires-into-void defect, #8). -->
