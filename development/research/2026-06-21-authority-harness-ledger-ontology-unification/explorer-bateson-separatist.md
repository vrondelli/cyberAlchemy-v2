# Explorer — Bateson (SEPARATIST via logical-typing)

> Angle held honestly: the ledger (temporal / event / append, with **three** distinct
> mutability modes) and the ontology (atemporal / typed-graph) are **different logical
> types**. "ledger = ontology subgraph" is a category error that must be *paid for*, not
> waved through. Forcing definitions / disciplines / constitutions under one default
> interface erases the per-entity judgment that is the actual value. The repo's existing
> **complementary** split (vault = record-of-belief, ontology_events = audit-trail) is the
> correct shape — it is a discipline the repo already enforces in writing, not an accident.
>
> Discipline: **Claim ≤ proof.** For every keystone claim I name the one fact that would
> zero it. I do not strawman the unifier — the unifier's near-decomposition is real and I
> grant it where the seams are clean.

---

## 0. The honest grant to the unifier

The unifier is not wrong that a *shape* recurs. The two prior-art findings both converge on
the same chain spine:

```
raw source → selector → InventoryEvidence → OntologyCandidate
  → PromotionRecord draft → owner route decision → authority artifact → gated projection
```
(`../2026-06-21-ontology-knowledge-lifecycle-authority/findings.md:163-173`;
`../2026-06-21-authority-movement-ontology-relations/findings.md:11-34`)

And `promotion_record` *is* canonical, owning "transition state, owner, verdict, scope,
blocks, and projection permission"
(`../2026-06-21-authority-movement-ontology-relations/findings.md:29-34`). So a **shared
spine** exists. My claim is narrower and survives that grant: a shared *spine* is not a
shared *type*, and the places where the spine forks are exactly the places where collapse
destroys information. The unifier wins the abstraction; the separatist wins the cost
accounting — and the cost accounting is what decides whether you build one harness or three.

---

## 1. The logical-type argument (Bateson / Russell): ledger ≠ ontology

A **logical type** confusion is treating a thing and a statement-*about*-the-thing as the
same kind. The ledger and the ontology sit at different logical types on **four independent
axes**, and the repo's own constitution documents both sides separately.

### 1.1 Time: event-ordered vs atemporal-typed

The ontology is explicitly **atemporal by role**. `ontology-conventions.md` makes role
*intrinsic and time-independent*:

> "The role is intrinsic and does not change with maturity: an axiom stays an axiom whether
> it's `draft` or `evergreen`." (`implementation/domainspec/vault/ontology-conventions.md:75`)

A node's identity does not advance in time; its *labels* do, but the node "almost never
changes" (`ontology-conventions.md:117`). The vault even pushes time *out* of the graph:
sessions (the temporal actors) are explicitly **not** graph nodes that anchor structure —
"Sessions are transient activity records … not stable graph nodes"
(`ontology-conventions.md:317`), and edges *from* sessions are forward-only, deliberately
kept off the stable nodes so the graph does not "accumulate noise on stable docs over time"
(`ontology-conventions.md:318`).

The ledger is the **opposite type**: it is constituted *by* time-ordering. A dispatch is
"who was dispatched … and **how did it close**"
(`implementation/domainspec/internal_tools/subagents-dispatch-hooks/docs/LEDGER-MODEL.md:25-26`),
and the *two-append discipline* — dispatch row at dispatch, close row at termination — is a
strict before/after event pair (`LEDGER-MODEL.md:39-46`;
`.claude/skills/register-dispatch/SKILL.md:8-13`). The ontology's own audit-trail (the
`ontology_events` SQL ledger) is described in exactly these temporal terms: an immutable
ledger of "**every mutation**" that lets you "**time travel** to see when a specific belief
entered the company" (`implementation/domainspec/vault/ontology-architecture-draft.md:138-141`).

**The repo already split these on purpose.** The architecture draft names *two distinct
logs* for the vault and assigns them different jobs:

> "The Narrative Log (`/close-session`): Human-readable context … The Data Ledger
> (`ontology_events` SQL Table): A strict machine-readable ledger of every mutation."
> (`ontology-architecture-draft.md:138-141`)

The vault = record-of-belief (atemporal typed nodes); `ontology_events` = audit-trail
(temporal event ledger). They **coexist**; collapsing one into the other was never the
design.

**One fact that would zero §1.1:** a citation showing the vault treats node identity as
event-sourced (i.e., the node *is* its event stream, replayed) rather than as a typed
atemporal artifact whose events are a separate audit log. I find the opposite: events are a
*separate* table the graph projects onto, never the graph itself.

### 1.2 Mutability: edit-in-place vs append-only — and **the ledger is not even one mode**

This is the sharpest leak. "One reusable ledger-spec" presumes ledgers share a mutability
contract. They do not — the three named ledgers hold **three incompatible** ones:

| Ledger | Mutability mode | Identity | Graph-ness | Citation |
| --- | --- | --- | --- | --- |
| **craft** `ledger.schema.yml` | **edit-in-place**, graph-like | stable row IDs preserved across regeneration; rows mutated by lifecycle | typed-graph (contexts/artifacts/relations/decisions, typed edges) | `.claude/skills/craft/templates/ledger.schema.yml:1-8`, `:52-53`, `:558-613` |
| **register-dispatch** YAML | **append-only**, 2-row | dispatch_id + close_of; rows *never* edited | flat denormalized doc, JSON columns, no inter-row edges | `register-dispatch/SKILL.md:8-13`; `LEDGER-MODEL.md:39-51` |
| **signals** JSONL | **append-only stream** | per-signal line, no cross-line identity | none (pure event stream) | repo signal surface `docs/signals/` (observability append model) |

The craft ledger is explicitly an **edit-in-place** authority: "The ledger is
machine-readable authority; human views and generated indexes are **derived from it**"
(`ledger.schema.yml:5-8`), and its blocker lifecycle *mutates a row through states*
`raw → typed → refined → resolution_proposed → resolved` with **prohibited transitions**
enforced as block-severity rules (`ledger.schema.yml:906-924`, VAL-020 at `:890-892`). A
single blocker row is **updated** through its life — that is edit-in-place by definition.

The register-dispatch ledger is the **negation** of that: "The ledger is append-only — rows
are never edited in place" (`register-dispatch/SKILL.md:11-12`), and a hook *mechanically
blocks* in-place edits (`LEDGER-MODEL.md:46-48`). Closing is not a row mutation; it is a
**second appended row** (`SKILL.md:188-203`). The same lifecycle (`raw…resolved` for craft;
`dispatch…close` for dispatch) is expressed by **mutating one row** in craft and by
**appending a second row** in dispatch. Those are opposite physics.

A "reusable ledger-spec" that must cover both either (a) picks one mode and breaks the other,
or (b) becomes a meta-spec so loose ("a ledger is rows with IDs") that it constrains nothing —
which is the tautology the Quine gate is built to catch.

**One fact that would zero §1.2:** a single existing schema in-repo that governs **both** an
edit-in-place row family and an append-only row family under one validated contract. I find
the craft schema explicitly scopes itself to the *Craft* ledger only (`schema_id:
craft.recursive_ledger`, `ledger.schema.yml:1`) and the register-dispatch appender hard-codes
a *different*, non-craft schema (`append-dispatch.cjs:95-135`). No unifying schema exists; two
were authored apart.

### 1.3 Atomicity: a promotion is one event that spans many writes

The proposal "movement-envelope = that node's promotion_record" treats a promotion as a
single record. But a *promotion event* is not atomic at the ledger level — it is a
**multi-write transaction across heterogeneous stores**, and the repo says so.

D-10 of the epistemic chain defines premise→axiom promotion as a **file move plus frontmatter
edit plus reindex**, authorized by a discovery, all in one commit:

> "The promotion/demotion operation is a single git commit that (a) moves the file between
> `vault/premise/` and `vault/axiom/`, (b) updates frontmatter (`node_type`, `veracidade`),
> and (c) cites the authorizing discovery"
> (`implementation/domainspec/vault/discovery/domainspec-vault-foundations/epistemic-chain.md:321-327`)

That single logical event is: 1 file move + 1 frontmatter mutation + N inbound-edge rewrites
(OQ-6 is *open* precisely because the edge rewrites are unsolved —
`epistemic-chain.md:440-456`) + 1 ontology_events append (audit) + 1 discovery citation. A
`promotion_record` is the **decision authorizing** that event; it is **not** the event's
atomicity boundary and cannot be. If you make the promotion_record the ontology node's
movement-envelope *and* the ledger row, you have claimed atomicity for an operation the repo
has an **open question** about how to make consistent at all (OQ-6, `epistemic-chain.md:440`).

**One fact that would zero §1.3:** a closed, owned mechanism in-repo that makes the full
premise→axiom move (file + frontmatter + all inbound edges + audit) transactional under a
single record. OQ-6 being **Open** (`epistemic-chain.md:456`) is the fact that keeps this
alive.

### 1.4 Projection: compliance/audit views require the split, not the collapse

The repo treats *generated indexes and projections* as a separate, derived layer that is
explicitly **not** source authority:

- Craft: "Generated indexes are rebuildable lookup surfaces, **not source authority**"
  (`ledger.schema.yml:46`), and the generated index carries a `ledger_sha256` +
  `stale_status` so a projection can be known-stale vs the ledger
  (`ledger.schema.yml:83-92`).
- Ontology: the Information Keeper / Graph-Dropping RAG is a **read layer** over the graph
  *and* the event table — "`Vault -.-> InfoKeeper` … `EventTable -.-> InfoKeeper`"
  (`ontology-architecture-draft.md:99-107`) — i.e., the audit view is a *projection that joins
  two stores*, not a single store.
- Authority prior art: governed projections "emit only **after** the gate permits use"
  (`../2026-06-21-authority-movement-ontology-relations/findings.md:43`), and the lifecycle
  envelope keeps `generated_projection` as a *separate field* requiring a
  `canonical_source_trace` (`../2026-06-21-ontology-knowledge-lifecycle-authority/findings.md:73-75`).

A compliance/audit view ("show every promotion of term X, who decided it, when, with what
evidence, and whether it has since been superseded") is a **temporal projection** over the
event ledger, joined to the **atemporal** current-state of the ontology node. You need *both
shapes present* to compute it. Collapse the ledger into the ontology subgraph and you lose
the time axis the audit view is made of; collapse the ontology into the ledger and you lose
the typed current-state the meaning query is made of. The projection is the proof that they
must stay two types and be *joined*, exactly as the complementary split already does.

**One fact that would zero §1.4:** an in-repo audit/compliance view that is computed from the
ontology subgraph *alone* with no event-ledger join. I find the opposite — the audit view is
drawn from `EventTable` + `Vault` as two inputs (`ontology-architecture-draft.md:99-107`).

---

## 2. Where "ledger = ontology subgraph" leaks, concretely

Mapping the craft ledger families onto the vault edge catalog shows the impedance is not
abstract — the vocabularies do **not** line up, and forcing them creates silent corruption.

1. **Edge directionality clashes.** Vault edges are **bidirectional by constitution** —
   "Edges between vault nodes must be declared on **both** endpoints"
   (`ontology-conventions.md:291`), with an audit script that flags asymmetric edges as bugs.
   Craft `relations` are **single-row directed** with `source_id`/`target_id` and no
   both-sides rule (`ledger.schema.yml:558-613`). A craft relation projected as a vault edge
   is *malformed* until a synthetic inverse is fabricated on the target — fabrication the
   vault explicitly calls a bug, not freedom (`ontology-conventions.md:293`).

2. **Identity model clashes.** Vault claim-identity is "**one claim, identity preserved
   across a move**" between folders (`epistemic-chain.md:311-313`); craft identity is "stable
   row IDs … preserved across **view regeneration**" inside one ledger
   (`ledger.schema.yml:52-53`). One identity survives a *physical relocation across stores*;
   the other survives a *re-render in place*. These are different identity invariants; a
   single ID field cannot satisfy both.

3. **Status-enum clashes.** Craft `artifact_status` has nine values incl. `superseded`,
   `stale`, `blocked` (`ledger.schema.yml:111-121`); vault `status` is a five-rung *maturity*
   lifecycle `draft→…→evergreen` (`ontology-conventions.md:60`), which is a **different
   semantic axis** (maturity, not workflow state). `ontology-conventions.md` is emphatic that
   collapsing axes that "answer the same question" is the redundancy it forbids
   (`ontology-conventions.md:342-345`); collapsing axes that answer *different* questions into
   one field is the dual error and just as corrupting.

4. **Append-only ledger has no graph to be a subgraph of.** The register-dispatch ledger is a
   flat denormalized doc with `groups`/`connections` as JSON columns and **no inter-row
   edges** (`LEDGER-MODEL.md:53-69`). There is no graph structure for it to "be a subgraph
   of." For the dispatch ledger specifically, "ledger = ontology subgraph" is not even false —
   it is **not well-typed**.

---

## 3. What MUST stay per-entity (the value the default interface erases)

The three governance skills share a *spine* but carry **per-entity judgment that is the whole
point of having three skills**. A single default interface flattens these into config flags
and loses the judgment.

- **definitions-governance — the three-voice rule.** Every canonical definition must carry
  scientific/formal + plain-language + domain-context voices *together*, and the
  domain-context voice is **project-local and must be re-resolved per consuming repo**
  (`.claude/skills/definitions-governance/SKILL.md:28-44`, quality bar `:117-131`). This is a
  *semantic-completeness* gate. Nothing in disciplines or constitutions has a three-voice
  obligation; it cannot be a shared-interface default without becoming dead weight on the
  other two.

- **discipline-governance — public/private boundary + Growth Rule.** Every candidate is
  tagged `public-safe` or `private-parent` and a `private-parent` practice **must never** be
  routed into the public catalog (`.claude/skills/discipline-governance/SKILL.md:29-31`), and
  the Growth Rule promotes status *only* when the next route names "owner, evidence,
  validation surface, and mutation boundary" (`SKILL.md:105`, `:122`). This is an
  *open/private composition* judgment tied to the umbrella-submodule boundary
  (`CLAUDE.md` submodule discipline). Definitions and constitutions have **no** public/private
  routing gate; folding this into a shared promote step either imposes a boundary the other
  two don't have or drops the one disciplines critically need.

- **constitution-governance — conflict-preservation + minimal composition.** When two rules
  conflict: "**preserve both rules**", classify the conflict, and "do **not** silently let the
  larger constitution override the narrower one"
  (`.claude/skills/constitution-governance/SKILL.md:122-139`); composition is "narrowest
  applicable scope first" with a context budget (`:122-139`). This is a *non-monotonic,
  precedence-aware* judgment. It is the **opposite** of definitions' authority rule, where the
  canonical source is the *single* normative voice and plain-language voices "must not
  override" it (`definitions-governance/SKILL.md:108-115`). One skill **preserves conflicting
  authorities**; the other **forbids competing authorities**. A single "validate + promote"
  default interface cannot hold both stances — they are contradictory at the policy level, not
  just different parameters.

**The structural point:** these are not three configurations of one judgment; they are three
*different* judgments that happen to ride the same intake→record→gate→route rails. The rails
can be shared (and the prior art already shares them as the movement envelope). The
*judgments* cannot be defaulted without erasing them. The Authority Movement Protocol review
reached the same conclusion from the other side: it routes each kind to its **own owner** —
"Candidate → definition | definitions-governance", "Candidate → constitution |
constitution-governance", "Candidate → schema/relation | schema governance / decision-gate"
(`../2026-06-21-authority-movement-ontology-relations/findings.md:83-91`). Distinct owners is
the finding; one default interface contradicts it.

---

## 4. The correct shape: complementary split + bridge, not collapse

The repo already owns the right answer and applies it in three places:

1. **vault (record-of-belief) vs ontology_events (audit-trail)** — two logs, two jobs,
   coexisting (`ontology-architecture-draft.md:138-141`).
2. **ledger (authority) vs generated index (derived, rebuildable, can be stale)** — craft's
   own source-of-truth policy (`ledger.schema.yml:37-47`).
3. **The dispatch ledger is "deliberately distinct" from agents-telemetry and per-folder
   rosters — "The three coexist; they are not the same log"**
   (`LEDGER-MODEL.md:28-37`).

That third citation is the repo *stating the separatist principle as a discipline*: things
that look like ledgers are kept apart on purpose because they answer different questions. The
right close is a **bridge, not an identity**: the prior art's witnessed relations
(`witnesses_cross_branch_authority_movement`, `emits_when_gate_allows`) and the vault analog
edges (`derives-from`, `validates`, `codified-as`) **witness** movement across the two types
without claiming either *is* the other —
"none equals promotion or a gate verdict"
(`../2026-06-21-authority-movement-ontology-relations/findings.md:78`). A bridge preserves both
logical types and their distinct invariants; a collapse picks one and silently corrupts the
other.

---

## 5. Verdict (separatist lens)

- **ONE shared thing — GRANT:** the *movement envelope* / chain-spine and `promotion_record`
  as the canonical decision record. Already owned, already canonical. Build from it.
- **ledger = ontology subgraph — KILL (category error):** different logical types on time,
  mutability (three modes, mutually contradictory), atomicity (multi-write, OQ-6 open), and
  projection. For the append-only dispatch ledger it is not even well-typed.
- **one reusable ledger-spec across craft/dispatch/signals — KILL or vacuous:** no in-repo
  schema covers both edit-in-place and append-only; a spec that does is either broken or
  constrains nothing.
- **one default governance interface — KILL the *default*; KEEP the *shared rails*:**
  three-voice, public/private+Growth-Rule, and conflict-preservation are contradictory
  policies (definitions forbids competing authority; constitutions preserves it). Share the
  intake→record→gate→route rails; keep the judgment per-entity, routed to its own owner per
  the protocol review.

**Strongest three evidence points (with cites):**

1. **The repo authored two opposite mutability laws.** craft = "machine-readable authority …
   derived from it" with an in-place blocker lifecycle and prohibited-transition validators
   (`ledger.schema.yml:5-8`, `:906-924`); register-dispatch = "append-only — rows are never
   edited in place," closing is a *second appended row*
   (`register-dispatch/SKILL.md:11-12`, `:188-203`). One reusable spec cannot be both.

2. **Promotion is a multi-write event the repo can't yet make atomic.** premise→axiom = file
   move + frontmatter + inbound-edge rewrites, with edge consistency **Open** as OQ-6
   (`epistemic-chain.md:321-327`, `:440-456`). The promotion_record authorizes that event; it
   is not its atomicity boundary.

3. **The repo states the complementary-split as an explicit discipline.** vault vs
   ontology_events are two logs (`ontology-architecture-draft.md:138-141`); the dispatch
   ledger is "deliberately distinct … The three coexist; they are not the same log"
   (`LEDGER-MODEL.md:28-37`). The correct close is a *bridge* that witnesses movement
   (`../2026-06-21-authority-movement-ontology-relations/findings.md:78`), preserving both
   logical types — which is what unification would erase.
