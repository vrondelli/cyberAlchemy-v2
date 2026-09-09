---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template; intended-not-shipped, non-executed
created: 2026-06-29
authored_by: task-session (SWU-2)
swu: SWU-2 (emit-template set)
source_artifact: resonantos-economy-research/authority/promotion-policy.md
emits_to: <TARGET_REPO>/authority/promotion-policy.md
leak_strip: |
  The precedent's promotion-policy carried NO cav2 leak (the ladder + gates resolve
  internally). This skeleton inherits that structure and localizes the rungs/gates. Obs-B
  preserved: EVERY gate resolves to <DOMAIN>'s OWN authority surface — no gate routes to
  cav2. At least one gate/block SHOULD be domain-originated (Obs-A rule-level support).
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the promotion-ladder FORMAT (State |
  Meaning | May promote to), the required-gates FORMAT (Gate | Required when | Standard),
  the promotion-blocks shape. LOCALIZES: the rungs, gates, blocks. Every gate resolves to
  THIS repo's own authority — never to a framework. Replace placeholders at emit.
-->

# Promotion Policy

Status: active local policy
Owner: <DOMAIN> owner

<DOMAIN> promotes by evidence and owner route, not by elegance.

## Promotion Ladder

<!--
  INHERITED: the no-automatic-promotion ladder. LOCALIZED: the rung labels for THIS domain.
  Each "May promote to" target is a <DOMAIN>-local state — promotion never crosses into a
  framework authority.
-->

| State | Meaning | May promote to |
| --- | --- | --- |
| Imported / staged source | A harvested source recorded in `authority/imports/` — staged, not yet relied on (**addition #7**, import before promotion). | Source evidence, once admitted for local use. |
| Source evidence | Original source material in its own context. | Source record. |
| Source record | Path, date, source kind, and boundary captured. | Source claim ledger. |
| Source claim | A claim with evidence and local reading separated. | <DOMAIN> synthesis. |
| <DOMAIN> synthesis | Bounded reading with source-kind labels. | Candidate <DOMAIN_PROPOSAL_UNIT>, workflow witness, or open residue. |
| Candidate <DOMAIN_PROPOSAL_UNIT> | A proposed condition <DOMAIN> should preserve. | Validation request after collapse test and witness. |
| Workflow witness | A concrete scenario for testing behavior. | Evidence harness or external review. |
| <DOMAIN> recommendation | A source-backed proposal with risks and gates. | External owner decision. |

## Required Gates

<!--
  INHERITED: the gate FORMAT + the source-kind / authority gate (these are meta-machinery —
  keep). LOCALIZED: the domain-specific gates. The AUTHORITY GATE routes to THIS repo's
  `authority/` (never a framework). At least one gate SHOULD be domain-originated (a gate
  cav2 has no analog for) to support Obs-A at the rule level.
-->

| Gate | Required when | Standard |
| --- | --- | --- |
| Source-kind gate | A new source is added or cited. | Primary, supporting, related, analogy, inference, or residue is explicit. |
| Authority gate | A claim could affect <DOMAIN_POLICY_DECISIONS>. | Route to **this repo's `authority/`** and mark non-policy until external owner review. *(Resolves locally — never to a framework.)* |
| **<DOMAIN_ORIGINATED_GATE_1>** ⟵ *domain-originated* | <a trigger specific to this domain — a gate cav2 has no analog for>. | <its standard>. |
| **<DOMAIN_ORIGINATED_GATE_2>** ⟵ *domain-originated (optional)* | <a second domain-specific trigger>. | <its standard>. |
| <DOMAIN_GATE_3 — domain risk control> | <when>. | <standard>. |

## Promotion Blocks

<!-- INHERITED: the block-list shape. LOCALIZED: the domain's specific block conditions. -->

Block promotion when:

- <DOMAIN_BLOCK_1 — e.g. "the metric becomes governance authority without human review;">
- <DOMAIN_BLOCK_2>;
- the claim depends on an analogy without a bridge decision;
- the proposal skips <DOMAIN_REQUIRED_PRECEDENT_CORPUS>;
- the recommendation has no witness, falsifier, or audit route;
- **the promotion would resolve by traversing into a framework attachment** (no framework
  edge is a promotion path — Obs-B at the promotion level).

## Stop / Demotion Rule (addition #12)

<!-- INHERITED: the D48 stop_rule shape — a lifecycle needs a way DOWN, not only up. LOCALIZED: the
     domain's demotion triggers. -->

Promotion is not one-way. An **active** artifact or a **ratified** kind may be **demoted / superseded** when:

- its evidence is withdrawn or falsified;
- a superseding artifact/kind is ratified (record `supersedes` / `superseded-by`, **never delete**);
- a validation gate it depended on is retracted.

Demotion route: `stop` → move the item to `superseded` (or back to `candidate`) via a **decision record**
(`authority/decisions/`); update the kinds table + `DEFINITIONS-INDEX`. A demotion is a decision, not
ambient. A ratified kind with **no reachable stop state** is a lifecycle defect — D48 requires a `stop_rule`.
