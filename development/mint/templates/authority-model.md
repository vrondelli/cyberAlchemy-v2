---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template; intended-not-shipped, non-executed
created: 2026-06-29
authored_by: task-session (SWU-2)
swu: SWU-2 (emit-template set)
source_artifact: resonantos-economy-research/authority/AUTHORITY-MODEL.md
emits_to: <TARGET_REPO>/authority/AUTHORITY-MODEL.md
leak_strip: |
  Precedent FAILED Obs-A: its "Method authority" kind (AUTHORITY-MODEL.md:31) is routed
  to the local constitution but is OWNER-ROUTE IDENTICAL to cav2's `Constitution` kind
  (F3(c) re-skin). This skeleton replaces it with a DOMAIN-ORIGINATED kind placeholder
  (lexical AND owner-route new). The method-authority role is localized to <DOMAIN>'s OWN
  constitution from emit-time; cav2 NEVER appears as the method authority.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). Domain-parameterized skeleton reverse-
  engineered from the resonantos precedent. INHERITS the meta-machinery (the table
  FORMAT, source-movement shape, non-collapse rule structure, gate vocabulary). LOCALIZES
  the object content (placeholders). Replace every <DOMAIN>/<...> placeholder at emit.
  Obs-B rule baked in: cav2 NEVER on a runtime resolution path — citation/precedent only.
-->

# Authority Model

Status: active local authority model
Owner: <DOMAIN> owner

## Purpose

This model decides what this standalone repository is allowed to claim while it
<DOMAIN_OBJECTIVE_SENTENCE — e.g. "researches a resilient X economy" / "designs the Y
product" / "operates the Z workflow">.

The model deliberately separates:

- <DOMAIN_PRIMARY_SOURCE> official source claims (what the governed subject says about
  itself);
- **repository-local method authority** — owned by *this repo's own* constitution
  (`constitutions/<DOMAIN>-CONSTITUTION.md`), NOT by any external framework;
- external evidence (related sources);
- local synthesis;
- policy or implementation authority, which this repo does not own.

> **Localization invariant (Obs-B, the precedent's leak — stripped).** Method authority
> (source posture, promotion discipline, non-collapse rules, authority separation) is
> owned **locally** by this repo's constitution + this model. **No external framework
> (including CyberAlchemy v2) is named as the method authority.** CyberAlchemy v2 and any
> other framework appear ONLY as **harvested precedent (supporting source)** in
> `source-spine.md` — cited for provenance, never on a resolution path. This is the
> emit-time state; it does not require a later owner decision to become true.

## Core Rule

<DOMAIN_CORE_RULE — the one load-bearing non-promotion sentence. E.g.: "Research can
propose mechanisms, invariants, workflows, and gates. Research cannot promote them into
<DOMAIN_POLICY_SURFACE> without an external owner decision.">

## Authority Kinds

<!--
  INHERITED: the 4-column table FORMAT (Kind | Counts as | Owner route | Blocked use).
  LOCALIZED: the rows. AT LEAST ONE row MUST be DOMAIN-ORIGINATED per the criterion's
  F3(c) membership test — lexically AND owner-route new (a genuinely new owner route /
  governance function, NOT a relabel of a cav2 D49 kind). The precedent's "Method
  authority" row routed to constitution-governance is OWNER-ROUTE IDENTICAL to cav2's
  `Constitution` and does NOT count (Obs-A FAIL). Mark domain-originated rows; the D49
  owner-gate (SPEC §Boundaries) applies — Mint PROPOSES, the <DOMAIN> owner RATIFIES.
-->

| Kind | Counts as | Owner route | Blocked use |
| --- | --- | --- | --- |
| Primary source | What <DOMAIN_GOVERNED_SUBJECT> says about itself. | <DOMAIN_OFFICIAL_SOURCE_ROUTE>. | Treating local synthesis as official position. |
| **<DOMAIN_ORIGINATED_KIND_1>** ⟵ *domain-originated (PROPOSED; owner-ratify)* | <what this domain-specific authority counts as — a function cav2 has NO row for>. | **<DOMAIN_NEW_OWNER_ROUTE_1>** *(a genuinely new owner route, NOT `constitution-governance` re-skinned)*. | <its blocked use>. |
| **<DOMAIN_ORIGINATED_KIND_2>** ⟵ *domain-originated (PROPOSED; owner-ratify)* | <a second domain-specific authority function>. | **<DOMAIN_NEW_OWNER_ROUTE_2>**. | <its blocked use>. |
| Related evidence | <DOMAIN external source families>. | Relevant <DOMAIN_EVIDENCE_ROUTE>. | Treating analogy as proof. |
| Local synthesis | A repo-authored reading or hypothesis. | <DOMAIN> tower / lane owner review. | Becoming policy by proximity. |
| Candidate <DOMAIN_PROPOSAL_UNIT> | A proposed condition/mechanism that should hold. | Closure plan + validation route. | Becoming a rule before witness and gate. |
| Workflow witness | A concrete scenario that can test a candidate. | Evidence harness / validation route. | Being treated as general proof from one example. |
| External policy authority | <DOMAIN_POLICY_DECISIONS — the decisions this repo does NOT own>. | <DOMAIN external owner route>. | This repo cannot exercise it directly. |

> **D49 owner-gate (SPEC §Boundaries).** The bold rows above are **proposed** by the mint;
> the `<DOMAIN>` authority owner **ratifies** them. They are this repo's OWN domain-local
> kinds table — NOT a change to cav2's closed D49 enumeration. Seeded from cav2's table
> format, owner-authored thereafter (seed, don't bind).
>
> **Closed-with-default-deny (addition #5).** This kinds table is **CLOSED**: an artifact whose
> kind is not a ratified row above **defaults denied** — it acquires no authority until the owner
> adds it (a `ratify`/`defer` verdict in `authority/decisions/<date>-ratify-mint.md`). This is the
> D49 closure *rule* applied to the domain's OWN table, never cav2's enumeration.

## Source Movement

<!-- INHERITED: the no-automatic-arrow source pipeline. LOCALIZED: the node labels. -->

```text
source evidence
  -> source record
  -> source claim ledger
  -> <DOMAIN> subtower / lane synthesis
  -> candidate <DOMAIN_PROPOSAL_UNIT> or workflow witness
  -> validation request
  -> external owner decision
```

No arrow is automatic. A candidate can be blocked, demoted, split, or sent back to corpus
work.

## Non-Collapse Rules

<!--
  INHERITED: the non-collapse RULE STRUCTURE ("X is not Y"). LOCALIZED: the domain's own
  conflations to refuse. The LAST rule is the load-bearing Obs-B one — KEEP its shape:
  external harvested precedent supports credibility, it is NOT final domain correctness.
-->

1. <DOMAIN_NON_COLLAPSE_1 — e.g. "Contribution credit is not governance authority.">
2. <DOMAIN_NON_COLLAPSE_2>.
3. <DOMAIN_NON_COLLAPSE_3>.
4. <... as many as the domain's conflation risks require ...>.
N. **Harvested external method precedent (incl. CyberAlchemy v2) supports
   <DOMAIN> credibility — it is NOT final <DOMAIN> correctness, and it holds NO authority
   over <DOMAIN> decisions.** *(This is the Obs-B non-collapse rule — keep verbatim in
   shape; it forbids the precedent's leak at the rule level.)*

## Narrowest-Owner Routing (addition #1)

<!-- INHERITED: the movement→owner routing FORMAT. LOCALIZED: the owner-route labels. Route each
     movement to the NARROWEST owner that can decide it. -->

| Movement | Owner route |
| --- | --- |
| A term becomes load-bearing. | definitions-governance (domain-local) |
| A rule should constrain future artifacts. | constitution-governance (domain-local) |
| A promotion / scope / public-private choice is contested. | decision-gate |
| A candidate kind needs ratification. | `<DOMAIN>` authority owner (D49 owner-gate) |
| A source must be staged before use. | authority import (`authority/imports/`) |

## Invariant → Axiom → Constitution → Validator (addition #2)

<!-- INHERITED derivation pattern; the domain fills the chain for its own invariants. Not a law —
     some constitutions encode invariants directly; some invariants stay diagnostic until promoted. -->

```text
invariant (what must stay true / what counts as drift)
  -> axiom (the load-bearing principle that explains why)
  -> constitution rule (operationalizes it) [constitutions/<DOMAIN>-CONSTITUTION.md]
  -> validator / gate (review | hybrid | deterministic)
  -> artifact behavior
```

## Gate Vocabulary

<!-- INHERITED verbatim in shape — the pass/flag/block/defer vocabulary.
     Non-collapse slot (addition #4): each Non-Collapse rule above may carry a `forbidden_collapse:`
     field naming the exact X→Y collapse it forbids, so the rule is checkable. Seed the SLOT + field,
     never cav2's 7 specific rules — the domain adds rules as its own conflation risks require. -->


- `pass`: evidence, source kind, owner route, and validation surface are adequate for the
  next move.
- `flag`: work may continue with named risk and follow-up.
- `block`: stop until a source, authority, witness, or boundary gap closes.
- `defer`: not rejected, but the route or timing is not ready.
