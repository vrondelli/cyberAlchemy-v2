# Collected Returns — Authority-Harness / Ledger / Ontology Unification

Verbatim explorer summaries, pasted for the auditor. Synthesizer's refined design is in `findings.md`.

---

## Explorer Simon — UNIFIER (verbatim)

# Explorer Simon — UNIFIER (near-decomposable authority-harness)

Angle: **ONE authority-harness with pluggable per-entity profiles + ONE reusable
ledger-spec + an ontology tie (concept = node, movement-envelope = promotion_record,
ledger = subgraph) is sound, owned, and buildable.** Held honestly: where the case
depends on something not yet proven, it is named as a gap with the fact that would zero it.

Discipline used throughout: **claim ≤ proof**. Each keystone claim carries a "zeroed by"
line — the single fact that would kill it.

### Keystone claims (collected)

1. The three governance skills share one interface and differ only in per-entity payload
   (definitions own normative semantics; disciplines own recurring practice; constitutions own
   structural form). Section-spine isomorphism table:
   `definitions-governance/SKILL.md`, `discipline-governance/SKILL.md`,
   `constitution-governance/SKILL.md` (objective / logic-type / modes / applicability /
   validation-model / quality-bar / anti-patterns / output-contract all role-aligned).
   *Zeroed by:* a load-bearing section in one with no role-peer in the other two. Not found.
2. The candidate→owner-gate→promotion_record→projection spine is already a single shared
   mechanism the three skills route into, not three parallel mechanisms
   (`cyberAlchemy-v2/authority/promotion-policy.md` Required-Gates; placement
   `RESULT.md:18-24`; `…ontology-knowledge-lifecycle-authority/findings.md:28`).
   *Zeroed by:* a skill that adopts authority bypassing the owner-gate/record. Not found —
   definitions authority-rule `:108-115`, discipline Growth-Rule `:122`, constitution promotion
   mode `:35` all gate on owner+evidence+validation.
3. The per-kind lifecycle matrix is already authored (`RESULT.md:93-99`); the harness tables it,
   not invents it. *Zeroed by:* a 4th kind whose owner ≠ the three and can't share the envelope.
   Extends, doesn't break (`RESULT.md:60` already lists spec|decision|other).
4. The three ledger shapes (craft edit-in-place graph; register-dispatch append-only 2-row;
   signals append-only JSONL) are the same ledger-spec under a 3-value policy axis
   (row_identity / mutability / graph). craft cites `ledger.schema.yml:5-8,:50-54,:558-613`;
   register `register-dispatch/SKILL.md:8-13,:190-194`. *Zeroed by:* a signals-JSONL field
   structurally inexpressible in the row model. **WEAKEST CITE — signals schema unread; read
   before build.**
5. The movement-envelope adds no field the canonical promotion_record lacks — it is a view of
   the record, not a competing record (CAOL fixture
   `promotion-record-fixture.md:18-34`). *Zeroed by:* an envelope field with no record home.
   **Partial dent:** `drift_owner` + `ontology_refs` (`RESULT.md:83-86`) have no fixture column;
   they are projection-side extras absorbed by §4c.
6. craft's row+relation model and the vault's node+edge model are the same typed-graph structure
   under two vocabularies, so a ledger can be authored as an ontology subgraph
   (`ledger.schema.yml:122-128,:558-613`; vault edge catalog `ontology-conventions.md:568-584`;
   `…authority-movement-ontology-relations/findings.md:78`). *Zeroed by:* a vault edge
   inexpressible as a craft relation row required for movement. **Structural yes, literal-enum
   no** — craft's 6-enum ≠ vault's 22-edge catalog; adopt vault vocabulary, not craft's enum.
7. The harness is mostly assembly of owned parts (envelope, promotion_record, craft ledger
   machinery, vault edges, three skills' promote modes) with only a dialect-selector and an
   emit-hook net-new. *Zeroed by:* a required capability no owned part supplies. The two gaps
   (signals schema, craft-vs-vault enum) are the only candidates; both first-build checks.

Honest blocks Simon KEEPS as harness invariants: separate owner routes (`RESULT.md:48-49`);
authority-by-proximity killed (`…authority-movement…/findings.md:77,:100`); ARR must not become a
vault edge by assertion (`…/findings.md:57-64`); ontology is not the lifecycle authority
(`…ontology-knowledge-lifecycle…/findings.md:9`; `RESULT.md:11-16`).

Verdict: ONE harness is sound (preserves every block as invariant), owned, and buildable
(assembly + dialect-selector + emit-hook). Two real risks: unread signals JSONL schema, craft-vs-
vault edge-enum mismatch.

---

## Explorer Bateson — SEPARATIST via logical-typing (verbatim)

# Explorer — Bateson (SEPARATIST via logical-typing)

> Angle: the ledger (temporal/event/append, with **three** distinct mutability modes) and the
> ontology (atemporal/typed-graph) are **different logical types**. "ledger = ontology subgraph"
> is a category error that must be *paid for*, not waved through. Forcing
> definitions/disciplines/constitutions under one default interface erases the per-entity judgment
> that is the actual value. The repo's existing **complementary** split (vault = record-of-belief,
> ontology_events = audit-trail) is the correct shape.
>
> Discipline: Claim ≤ proof. The unifier's near-decomposition is real; granted where seams are clean.

Grant: a shared chain SPINE exists and `promotion_record` is canonical, owning "transition state,
owner, verdict, scope, blocks, projection permission"
(`…authority-movement…/findings.md:29-34`). A shared *spine* is not a shared *type*; the spine forks
exactly where collapse destroys information.

Logical-type argument on four axes:
- **Time:** ontology role is intrinsic/atemporal — "an axiom stays an axiom whether draft or
  evergreen" (`ontology-conventions.md:75`); sessions (temporal actors) are explicitly NOT stable
  nodes (`:317`). Ledger is constituted by time-ordering; two-append discipline is a strict
  before/after pair (`LEDGER-MODEL.md:39-46`). Repo split them on purpose: Narrative Log vs
  `ontology_events` SQL ledger (`ontology-architecture-draft.md:138-141`).
- **Mutability — the sharpest leak:** craft = edit-in-place, blocker row mutated through states
  with prohibited-transition validators (`ledger.schema.yml:5-8,:906-924`); register-dispatch =
  "append-only — rows never edited in place", close is a SECOND appended row
  (`register-dispatch/SKILL.md:11-12,:188-203`). Opposite physics. One reusable spec either picks
  one mode and breaks the other, or is so loose it constrains nothing (Quine vacuity). *Zeroed by:*
  one existing schema governing both an edit-in-place and an append-only family under one validated
  contract. Not found — two were authored apart.
- **Atomicity:** premise→axiom promotion = file move + frontmatter edit + N inbound-edge rewrites +
  audit append + discovery citation, all in one commit (`epistemic-chain.md:321-327`). Edge rewrites
  are **OQ-6 OPEN** (`:440-456`). A promotion_record is the decision *authorizing* the event; it is
  NOT the event's atomicity boundary. *Zeroed by:* a closed mechanism making the full move
  transactional under one record. OQ-6 Open keeps this alive.
- **Projection:** generated indexes/projections are a separate derived layer, explicitly NOT source
  authority (`ledger.schema.yml:46,:83-92`); the audit view joins TWO stores
  (`Vault -.-> InfoKeeper`, `EventTable -.-> InfoKeeper`, `ontology-architecture-draft.md:99-107`).
  An audit query needs both shapes present and *joined*. *Zeroed by:* an in-repo audit view computed
  from the ontology subgraph alone with no event-ledger join. Opposite found.

Concrete leaks of "ledger = ontology subgraph": (1) edge directionality — vault edges bidirectional
by constitution (`ontology-conventions.md:291`), craft relations single-row directed (`:558-613`);
(2) identity — vault identity survives physical relocation across stores (`epistemic-chain.md:311-313`),
craft identity survives in-place re-render (`ledger.schema.yml:52-53`); (3) status-enum — craft
9-value workflow status vs vault 5-rung maturity (`:111-121` vs `ontology-conventions.md:60`) are
different semantic axes; collapsing them is the dual of the forbidden redundancy (`:342-345`);
(4) the append-only dispatch ledger is flat with no inter-row edges (`LEDGER-MODEL.md:53-69`) — "ledger
= subgraph" is not even well-typed for it.

What MUST stay per-entity: definitions' three-voice single-normative rule (plain voices "must not
override" canonical, `definitions-governance/SKILL.md:108-115`); disciplines' public/private +
Growth Rule (`discipline-governance/SKILL.md:29-31,:105,:122`); constitutions' conflict-preservation —
"preserve both rules… do not silently let the larger override the narrower" (`constitution-governance/
SKILL.md:122-139`). **The last directly CONTRADICTS definitions' single-voice rule:** one skill
PRESERVES conflicting authorities, the other FORBIDS competing authorities. A single "validate+promote"
default interface cannot hold both — contradictory at the policy level, not parameters. Protocol review
already routes each kind to its own owner (`…authority-movement…/findings.md:83-91`).

Correct close: complementary split + **bridge, not collapse**. Repo states the separatist principle as
a discipline — "The three coexist; they are not the same log" (`LEDGER-MODEL.md:28-37`). Bridge uses
existing witness edges (`witnesses_cross_branch_authority_movement`, `emits_when_gate_allows`, vault
`derives-from`/`validates`/`codified-as`) that witness movement — "none equals promotion or a gate
verdict" (`…/findings.md:78`).

Verdict (separatist lens):
- ONE shared thing — GRANT: movement envelope / chain-spine + `promotion_record`.
- ledger = ontology subgraph — KILL (category error): four-axis type difference; not well-typed for
  the append-only ledger.
- one reusable ledger-spec across craft/dispatch/signals — KILL or vacuous: no schema covers both
  edit-in-place and append-only.
- one default governance interface — KILL the *default*, KEEP the *shared rails*: three-voice /
  public-private+Growth-Rule / conflict-preservation are contradictory policies. Share intake→record→
  gate→route rails; keep judgment per-entity, routed to its own owner.
