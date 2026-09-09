---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (Universal Governance Baseline, SWU-B1); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--update, universal-baseline L1 build)
swu: SWU-B1 (baseline rule-constitution)
source_artifact: cyberAlchemy-v2/authority/definitions/DEFINITIONS.md (the cited cav2 primitives; FORMS only, no cav2 object rows)
emits_to: <TARGET_REPO>/authority/constitutions/<DOMAIN>-BASELINE-CONSTITUTION.md
partition: development/research/2026-07-01-universal-baseline-partition/findings.md (bucket A rule-baselines)
guardrail: >
  Every rule is a FORM the domain's OWN actions must satisfy - never cav2's object content. Each cites its
  cav2 D-ID for PROVENANCE only (cav2 is cited precedent, never a resolution path). Emitted PROPOSED; the
  owner ratifies via the mint ratify-CLOSE (#11) before any baseline governs.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). The UNIVERSAL rule-baselines every governed repo's actions
  must satisfy (frozen partition bucket A). INHERITS the rule FORMS; LOCALIZES nothing structural (the
  domain's actions are what they govern). cav2 appears only as a `Provenance: CAV2-D<k>` tag. Emitted
  alongside <DOMAIN>-CONSTITUTION.md (which holds the domain-authored meta-rules) - kept SEPARATE so the
  universal baseline is visibly distinct and not editable-away.
-->

# <DOMAIN> Baseline Constitution (Universal Governance Baseline)

Status: **PROPOSED** — pending owner ratification (mint ratify-CLOSE, `authority/decisions/<date>-ratify-mint.md`)
Owner: constitution-governance (domain-local)
Authority level: repository-local baseline constitution
Scope: every governed <DOMAIN> action (any action that creates/changes/routes/validates/promotes/interprets load-bearing artifacts, state, meaning, or authority)

These rules are the universal governance baseline inherited by every minted repo. They are FORMS the
domain's own actions satisfy; the domain may extend a rule but may not silently drop one (a dropped
baseline is typed residue naming why).

### <DOMAIN>-B1. Four-Facet Action  *(keystone)*
Validation mode: hybrid · Provenance: CAV2-D21
Every governed action must bind or create — or record typed residue for — all four facets before it
governs downstream work: (1) classification/taxonomy, (2) schema, (3) human-continuation view,
(4) machine-checkable view. A missing facet → typed residue naming the facet, reason, owner, evidence, and effect (continue/defer/block).

### <DOMAIN>-B2. Typed Coupling
Validation mode: review · Provenance: CAV2-D16
For any two local objects A, B that cannot vary independently, record a typed relation. No hidden coupling.

### <DOMAIN>-B3. Residue Discipline
Validation mode: hybrid · Provenance: CAV2-D18
Every transformation with a preservation condition exposes its typed remainder as an actionable record
(missing facet, reason, owner route, evidence, effect) — never a silent drop.

### <DOMAIN>-B4. Lifecycle-Axis Separation
Validation mode: review · Provenance: CAV2-D23
Authority posture keeps kind / status / evidence / commitment / provenance / owner separate; no axis stands in for another.

### <DOMAIN>-B5. Provenance-First Navigation
Validation mode: review · Provenance: CAV2-D24
Governed lookup starts from entrypoints / indexes / manifests, not raw sessions; every load-bearing hop is a typed link.

### <DOMAIN>-B6. Schema-Amendment Witness
Validation mode: hybrid · Provenance: CAV2-D25
Any schema / frontmatter / taxonomy change that affects validation carries an amendment record + an enforcement witness (or typed residue).

### <DOMAIN>-B7. Append-Only Ledger
Validation mode: hybrid · Provenance: CAV2-D26
State-changing or authority-affecting operations append to a ledger of registered event kinds (deterministic subject, idempotent) — append, never rewrite.

### <DOMAIN>-B8. Value-Cycle Edge Guard
Validation mode: review · Provenance: CAV2-D28
No edge may both value-constrain AND permit a cycle without a named acyclicity review.

### <DOMAIN>-B9. Bounded Recursive Self-Application
Validation mode: review · Provenance: CAV2-D30
A governed process applied to its own artifacts is admissible only when it declares altitude / owner / gate / residue / recompose / stop.

<!-- Emit self-checks (EMIT-PROCEDURE §7): #12 all 9 baseline rules present; #13 each carries a
     `Provenance: CAV2-D<k>` tag and NO cav2 object content / resolution path. -->
