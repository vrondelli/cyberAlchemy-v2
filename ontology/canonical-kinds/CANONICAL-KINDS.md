# Canonical Kinds

Status: candidate
Owner: CyberAlchemy v2 ontology route (term authority: definitions-governance)

> ⚠️ **Uncited by construction.** Every definition-card citation was stripped from this
> file on 2026-07-13 because the definitions tower is being redone. The claims below are
> the ones the file already made — they now stand **without a cite backing them**. Do not
> read an unattributed claim here as ratified. Re-attach term authority when the tower lands.

## Purpose

Canonical kinds are the **fine artifact-types** the project recognizes: the
specific typed things a governed process produces (a discovery, a research, a
ledger, a spec). An artifact instantiating one of these is a **canonical artifact**
— typed and process-born, and *decoupled from authority*. An artifact whose kind is
not enumerated here is **non-canonical**: free working material.

This is a **Tier-1** enumeration. It is *finer than* and *rolls up into* the
coarse **Tier-2** [AUTHORITY-MODEL Authority Kinds](../../authority/AUTHORITY-MODEL.md#authority-kinds):
several canonical kinds (discovery, research, ledger, session) share one
`authority_kind` (`Evidence`). Membership here does **not** grant authority —
authority is earned separately, and only kinds whose `authority_kind` is an
authority-bearing kind can earn it at all.

## Kind Contract

| Field | Meaning |
| --- | --- |
| `canonical_kind` | The specific canonical-kind (local identifier). |
| `process` | The governed process whose output is this kind. |
| `authority_kind` | The Tier-2 authority-kind it rolls up to; a typed coupling. |
| `durability` | `ephemeral` or `perennial` — see [Durability](#durability) (overridable per instance with an owner note — *proposed; the carrier is [OQ-3](#oq-3-per-instance-durability-override--recorded-where)*). |
| `contradictions` | Derived from durability: `tolerated` (ephemeral) or `resolve-required` (perennial). |
| `authority_reachable` | Whether an instance can *ever* become authority (true only if `authority_kind` is authority-bearing). |
| `instance_fields` | The frontmatter contract every instance of this kind carries. See [Instance Contract](#instance-contract-frontmatter). |

`contradictions` and `authority_reachable` are derived, not primitive. The free values are
`process`, `authority_kind`, and `durability`.

### Durability

**`durability` answers one question: does this artifact claim to hold *now*?**

- **`ephemeral`** — a record of a moment. *This is what we found; this is what happened; this is
  what we planned.* It was true **then**. It does not assert itself against the present.
- **`perennial`** — a standing commitment or a current state. *This is what the word means; this is
  the rule; this is what is open.* It is maintained to be true **now**.

This is what `contradictions` derives from, and the derivation is exact. Two discoveries
contradicting each other is **not** a defect: they were written at different moments, from
different evidence, and neither claims the present. Two definitions contradicting each other **is**
a defect: both assert themselves *now*, simultaneously, and `P ∧ ¬P` is live.

**How an artifact mutates — revised in place, appended to, entries removable — is a third axis, and
it has no name.** See [OQ-11](#oq-11-a-third-axis-exists-and-is-unnamed).

## Enumeration (seed — candidate)

This seed carries only the kinds named or clearly implied in the 2026-07-07 design
session. **It is not closed yet**: adding a canonical-kind is owner-gated (route:
ontology route to propose, definitions-governance/decision-gate if it changes term
semantics or the coarse enumeration). Durability defaults marked `(review)` are
candidate assignments awaiting owner ratification.

| Canonical kind | Process | Authority kind | Durability | Contradictions | Authority-reachable |
| --- | --- | --- | --- | --- | --- |
| discovery | `domainspec-discovery-writing` | Evidence | ephemeral | tolerated | no |
| research | `domainspec-subagents-strategy` → research dispatch | Evidence | ephemeral | tolerated | no |
| **findings** | `domainspec-subagents-strategy` → research dispatch | Evidence | ephemeral | tolerated | no |
| session | `close-session` | Evidence | ephemeral | tolerated | no |
| ledger | *none — "append-only ledger" restated the kind, not a route (OQ-6)* | Evidence | perennial | resolve-required (live); temporal supersession allowed | no |
| axiom | *none — "axiom authoring" names no owner route (OQ-6)* | unresolved — OQ-2 *(provisionally governs as `Definition`, but the term's boundary holds axiom ≠ definition)* | perennial | resolve-required | deferred (OQ-2) |
| definition | definitions-governance | Definition | perennial | resolve-required | yes |
| constitution | constitution-governance | Constitution | perennial | resolve-required | yes |
| decision | decision-gate | Decision | perennial | resolve-required | yes |
| spec | spec owner + decision-gate | Spec | perennial | resolve-required | yes |
| **discipline** | discipline-governance | Discipline | perennial | resolve-required | yes |
| **runtime contract** | task-session after owner gates | Runtime contract | perennial | resolve-required | yes |
| **projection** | ontology route + source owner | Projection | ephemeral (regenerable) | tolerated | no *(inferred — OQ-5)* |
| **premise** | definitions-governance | unresolved — OQ-4 *(a bet is not evidence)* | perennial | resolve-required | deferred (OQ-4) |
| **invariant** | definitions-governance | unresolved — OQ-2 *(same fork as `axiom`)* | perennial | resolve-required | deferred (OQ-2) |
| **review** | review dispatch (`domainspec-subagents-strategy` → `review`) | Evidence | ephemeral | tolerated | no |
| **handoff** | `invoke handoff` | Evidence | ephemeral | tolerated | no |
| **implementation-plan** | `invoke plan` | unresolved *(prescribes execution; not Spec, not Decision — OQ-8)* | ephemeral | tolerated | deferred (OQ-8) |
| **audit** | *none — no audit route exists (OQ-6)* | Evidence | ephemeral | tolerated | no |
| **conceptual** | *no single producer — context authored in-place (OQ-8)* | Evidence | perennial | resolve-required | no |
| **backlog** | *none — "backlog maintenance" names no owner route (OQ-6)* | Evidence | perennial | tolerated *(a list of open items is not a contradiction)* | no |
| **readme** | *no single producer — authored beside what it describes (OQ-8)* | Projection | ephemeral (regenerable) | tolerated | no |
| **goal** | CyberAlchemy v2 goal lifecycle | Spec | perennial | resolve-required | yes |
| **experiment** | `experiment-harness` or an owner-approved project experiment process | Evidence | ephemeral | tolerated | no |
| **product-thesis** | CyberAlchemy v2 product-thesis lifecycle | Spec | perennial | resolve-required | yes |

## Rules

1. **Rollup is a typed coupling**: every canonical-kind names exactly one
   authority-kind. Changing a rollup is an authority-model change, not an ontology
   edit.
2. **Durability is orthogonal** to `authority_kind`, to maturity, and to mutability.
   Kinds under the same `authority_kind` may differ in durability (`discovery` and
   `ledger` are both `Evidence`); `perennial` kinds may be unable to bear authority
   (`ledger`, `conceptual`, `backlog`); and both `ephemeral` and `perennial` kinds may
   be edited. Durability answers one question only — see [Durability](#durability).
3. **Canonical =/= authority.** A row here makes an instance *canonical*, never
   *authoritative*. `authority_reachable = no` means instances of that kind are
   terminal evidence/records; they never earn authority — evidence, ledger events,
   and sessions are inputs or terminal, never promotable.
   Even for an authority-*reachable* kind, an instance is authoritative only at
   `authority_state: promoted` — `candidate` is proposed-not-yet-accepted and
   `demoted` is withdrawn/superseded. A candidate `definition` is still a definition,
   just not yet authority.
4. **Ledger contradiction.** A ledger is perennial but append-only: a later event
   overriding an earlier one is *temporal supersession*, not a live contradiction.
   Only a simultaneously-held `P and not-P` is a defect.
5. **Extension is owner-gated.** Adding a canonical-kind follows the same default-deny
   posture as the coarse enumeration: until a kind is enumerated with a process,
   `authority_kind`, and durability, an artifact of that kind is non-canonical.
6. **Residue is an attribute, not a kind.** It is carried by artifacts — `discovery`, `session`,
   possibly `findings` — never authored as a file of its own. There is no `residue.md`. An open
   question with no artifact to carry it stays in the producing artifact's `## Open Questions`
   section. Its shape as a field: [OQ-13](#oq-13-what-shape-does-the-residue-attribute-take).
7. **A goal does not authorize work.** A `goal` instance states an eventual
   outcome and its success evidence. Its `Spec` rollup makes owner promotion
   reachable; it does not grant execution, publication, deployment, or external
   effects. The candidate contract lives in
   [../../goals/GOAL-DOCUMENT-TYPE.md](../../goals/GOAL-DOCUMENT-TYPE.md).
8. **Research and experiment stay evidence.** `research` gathers an evidence
   aggregate and delegates synthesis to `findings`. `experiment` preserves a
   protocol and run evidence and delegates conclusions to `findings` or an owner
   decision. Neither kind can promote itself or authorize a run. The existing
   four-kind frontmatter contract below already governs `research`; the separate
   candidate Experiment carrier contract lives in
   [../../experiments/EXPERIMENT-DOCUMENT-TYPE.md](../../experiments/EXPERIMENT-DOCUMENT-TYPE.md).
9. **A product thesis commits direction without proving realization.** A
   `product-thesis` instance may carry a committed product proposition and still
   remain a candidate Spec artifact. Commitment does not prove implementation,
   outcomes, market demand, or product-market fit. Its contract lives in
   [../../product/PRODUCT-THESIS-DOCUMENT-TYPE.md](../../product/PRODUCT-THESIS-DOCUMENT-TYPE.md).

## Instance Contract (Frontmatter)

Status: candidate. Written for the four `Evidence` kinds: `discovery`, `research`, `findings`,
`session`. Every other kind is **deferred** — no contract is asserted, and none may be inferred
from these four.

### Rules

1. **The unit is the file** — *for the four kinds in scope*. One file, one artifact, one kind; a
   folder carries no frontmatter. This does not generalize: the `axiom` file holds many axioms, and
   `DEFINITIONS.md` holds many definitions. For those, state lives in the **entry**, and so would
   the frontmatter contract. Not applied here.
2. **The kind is the filename, and `canonical_kind` mirrors it in frontmatter.** `research.md` *is*
   a `research`, and it also carries `canonical_kind: research`. **On conflict the filename wins** —
   a filename is unique within a folder and cannot be silently duplicated, while a frontmatter
   string can be mistyped. The field is the machine-readable and greppable surface, not the source
   of truth; it never overrides the name.

   **`session` is the exception, and the only one.** A session record is named for *when* it
   happened (`sessions/2026-07-13-2225-<slug>.md`), so no filename carries its kind. **The path
   does** — `sessions/` — and `canonical_kind: session` states it in frontmatter. This is a named
   exception, not a hole: see rule 4. *(Outside the four kinds in scope the carrier varies again:
   [OQ-12](#oq-12-filename-as-kind-or-path-as-kind).)*
3. **`title` is the instance.** The kind says what sort of thing; the `title` says which one.
4. **Type-level facts are looked up, never declared.** `process`, `authority_kind`, `durability`,
   `contradictions`, `authority_reachable` are functions of the kind. An instance that could
   declare them could self-promote. `canonical_kind` is not one of them — it is the *key* to the
   lookup, not a result of it.

   **The mirror in rule 2 does not reopen the hole, because the carrier is always *outside* the
   frontmatter** — the filename for `discovery`/`research`/`findings`, the path for `session`.
   Either way something the file cannot edit about itself pins its type: a `research.md` cannot
   declare itself a `definition`, and neither can a file sitting in `sessions/`. **No instance can
   self-declare its kind.** The frontmatter field states the type; it never *decides* it.
5. **All four kinds here are `ephemeral`** — records of a moment, not claims on the present
   ([Durability](#durability)). They may be edited freely; editing does not make them current.
   Durability says **nothing** about how an artifact mutates — that is an unnamed third axis
   ([OQ-11](#oq-11-a-third-axis-exists-and-is-unnamed)), and no mutation contract may be inferred
   from a kind's durability.
6. **No Evidence kind carries `authority_state`.** `Evidence` ⟹ not authority-reachable ⟹ no state
   to hold. An absence, not a field valued `none`.
7. **No Evidence kind carries `status`.** Open-vs-closed is derivable from `question` + `outcome`;
   superseded is an edge.
8. **`outcome` requires `question`.** `question` without `outcome` is an open investigation — legal
   while open, residue once closed. **Exception: `research`.** Its `outcome` is delegated to the
   `findings`, so a closed `research` with no `outcome` is correct, not residue. Without this
   exception every research would be residue by construction.
9. **Residue is carried, never authored.** An open question with nowhere to land stays in the
   artifact's `## Open Questions` section. No artifact is created to hold it. *Whether it is also
   marked by a frontmatter field, and what shape that field takes, is
   [OQ-13](#oq-13-what-shape-does-the-residue-attribute-take) — the prose rule stands either way.*

### Core contract

| Field | Required | Notes |
| --- | --- | --- |
| `canonical_kind` | yes | Mirrors the filename (rule 2). The filename is authoritative on conflict. |
| `title` | yes | Which instance this is. |
| `description` | yes | **The retrieval surface. ≤ ~60 words.** See below — this field has a contract of its own. |
| `evidence_for` | yes | List. See below. |
| `created` | yes | |
| `last_updated` | yes | Starts equal to `created`; bumped on content edits. A coarse retrieval signal only — the event log is git, and nothing enforces the bump. |
| `tags` | yes | |

#### `description` — the retrieval surface

This string is what gets embedded and indexed. It is not navigation metadata about the retrieval
surface; it **is** the retrieval surface. Its job: let a reader decide whether to open the file
without opening it, and be the text a query matches against.

Four obligations, all enforceable:

1. **Discriminate.** If the sentence would serve equally well for another artifact of the same
   kind, it fails. *"Research on session edges"* is true and useless — it does not say why **this**
   one and not the other forty.
2. **Be dense.** ~60 words is not a ceiling on brevity; it is a budget to spend. Every word carries
   information or it takes the slot of a word that would.
3. **No filler.** *"This document is a research about…"* says what the filename already says
   (rule 2). Open on the substance.
4. **Be self-contained.** A retrieval index has no context. No outward pronouns, no "as above", no
   reference to a sibling file the query will never see.

It is **not** the `outcome` (what the artifact concluded — that is why you open it, not how you
find it), and **not** the body's `## Summary` (what happened — read *after* deciding to open).

The word *synthesis* is reserved: it names what a `findings` **is**, and nothing else.

### Per-kind

Residue is an attribute (rule 6); whether it is a **frontmatter field** is
[OQ-13](#oq-13-what-shape-does-the-residue-attribute-take). Every `residue` cell below is pending it.

| Kind | Adds | |
| --- | --- | --- |
| `discovery` | `question` *(opt)*, `outcome` *(opt)*, `residue` *(OQ-13)* | May be reconnaissance, with no question it was sent to answer. |
| `research` | `question` **(required)** | The **aggregate** of the investigation — everything gathered. Carries no `outcome` (rule 8 exception). |
| `findings` | `question` **(required)**, `outcome` **(required)**, `residue` *(OQ-13)* | The **synthesis**. Exists to state an outcome; the verdict-per-candidate table lives in the body. |
| `session` | `residue` *(OQ-13)* | Carries no `question`/`outcome`: a session is not sent to answer one thing. Its open questions live in `## Open Questions`. **Carries `evidence_for`, and typically several values** — a session touches whatever it touches, and the field is a list precisely so it can say so. Frontmatter beyond this: [OQ-14](#oq-14-session-instance-contract-is-incomplete). |

`research` and `findings` require the **same** `question` — the one the dispatch was sent to
answer. They differ in `outcome`: the research gathers, the findings decides. The synthesis rests
on the aggregate, so the edge runs `findings --derives-from--> research`
([Evidence edges](#evidence-edges)).

### `evidence_for`

Which authority kind this evidence intends to feed. Evidence kinds only. List-valued.
*(Owner decision, 2026-07-14: this field replaces `authority_layer`. It points at the target
**kind** directly instead of the surface the kind lives on — the layer was always an indirection
— and it stops referencing the contested layer enumeration entirely.)*

Legal values are the **authority-bearing** Tier-2 kinds of
[AUTHORITY-MODEL Authority Kinds](../../authority/AUTHORITY-MODEL.md#authority-kinds) — a closed,
default-deny enumeration ([CAV2-D49](../../authority/definitions/DEFINITIONS.md#cav2-d49-closed-authority-kind-enumeration)):

`Definition` · `Constitution` · `Discipline` · `Decision` · `Spec` · `Runtime contract`

Excluded on purpose: `Evidence` (evidence resting on evidence is the `derives-from` edge, already
owned), `Projection` (a regenerable view is generated, never researched toward), `Residue` (an
attribute, not a destination).

**The field is deliberately not named `authority_kind`.** An instance's own `authority_kind` is a
type-level fact — looked up from the kind, never written (rule 4). A frontmatter key of that name
valued `Definition` would read as a self-declared kind, which is exactly the self-promotion hole
rule 4 closes. `evidence_for` states a **target**, never an identity.

**Normative — non-concession.** `evidence_for` declares an intended destination and **grants
nothing**. It confers no standing and is not a promotion; promotion remains with the owner route
([Narrowest Owner Rule](../../authority/AUTHORITY-MODEL.md#narrowest-owner-rule)). Without this
clause the field is authority by self-declaration, which
[CAV2-C2](../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c2-authority-layer-separation)
forbids.

It is a forward declaration, and therefore not an edge: evidence is produced *before* the
authority artifact it feeds exists, and no edge can point at an unborn node. An evidence artifact
naming a kind it never produced an edge into is open residue.

> The [CAV2-D3](../../authority/definitions/DEFINITIONS.md#cav2-d3-authority-layer) (5 layers)
> vs [CAV2-C2](../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c2-authority-layer-separation)
> (10 layers) disagreement over the *authority layer* enumeration is real and remains open
> (route: definitions-governance) — but it is no longer this contract's problem: this field
> references the closed authority-kind enumeration, not the layer one.

## Edges

Status: **candidate — and in unresolved collision with a consolidated catalog. Do not
build on this section until that is settled.**

> ⚠️ **This section forks an existing owner.**
> [`implementation/domainspec/vault/ontology-conventions.md`](../../../implementation/domainspec/vault/ontology-conventions.md)
> (`node_type: constitution`, `status: consolidated`, **v2.3.0**) already owns a 22-edge
> catalog with typed endpoints, inverses, and a deprecation table. A 2026-07-09 review
> ([findings.md](../../authority/definitions/reviews/2026-07-09-post-correction-audit/findings.md))
> established that the section below:
> - **revives five edges that catalog explicitly deprecated** — `contextualizes` (→`cites`),
>   `depends-on` (→`derives-from`), `questions` (→`opens-question`), `updates` (→"use
>   `version:` frontmatter"), `exemplifies` (deferred) — and promoted `updates` to a
>   succession *morphism*. ⚠️ **`updates` has since been removed from the succession class and
>   re-minted as the session provenance verb** ([the session rule](#the-session-rule)) — so this
>   file and the catalog now use the same name for two different edges. **New collision, worse
>   than the old one;** it must be settled with the rest;
> - **omitted `created-by`** — the inverse of the producer edge (session → any, *"A produced B as
>   output"*). ✅ **Answered, not by importing it:** an inverse is a **read direction, not a
>   declarable edge** ([the session rule](#the-session-rule)), so `created-by` is nothing to omit.
>   The `process_origin` the spine kept trying to invent is `creates`, read backwards — and it is
>   **partial**, because a session file exists only if `close-session` ran;
> - **mis-cites `consumed-by`**: the catalog owns it as a *session* provenance edge that
>   explicitly carries **no** lineage; this section files it under *grounding*, sourced
>   from a definition card. Same name, opposite category. *(Moot for the session: `consumes` is
>   struck — reading is not doing. The grounding sense is untouched.)*
>
> The claim below that these verbs are *"already in use, not invented here"* is therefore
> **false as written** — several are in use only as tombstones. This section must
> supersede, import, or scope itself out of that catalog. It may not silently fork it.
> **Open. Route: decision-gate.**

### Evidence edges

Settled for all four Evidence kinds. The machine-readable schema is the authority:
[`ALLOWED-EDGES.yaml`](./ALLOWED-EDGES.yaml) (what is permitted — anything absent is forbidden) and
[`EDGES.yaml`](./EDGES.yaml) (what each verb means). The table below restates it; on any divergence,
the YAML wins.

Verbs are drawn from the consolidated catalog as vocabulary; that catalog is **not** the authority
for what they mean here, and it is not reconciled against this file
([Edges](#edges) carries the standing collision).

| Edge | From | To | Card. | Meaning |
| --- | --- | --- | --- | --- |
| `derives-from` | `research` | `discovery` | **0..1** | **`research` has no *mandatory* in-edge.** It may be dispatched cold — motivated by a bare `question`, which is a **field, not a node**, so nothing is there for an edge to point at. Or it may answer an **open question of a `discovery`**, and then the edge exists: the discovery framed the problem, named the terms and the alternatives, and the research inherits that. That is lineage, not just motivation. |
| `derives-from` | `discovery` | `research` | 0..N | A discovery draws its basis from a research. None, if it is reconnaissance. |
| `derives-from` | `findings` | `research` | **0..1** | The **synthesis rests on the aggregate**. Optional because a **single-agent (`n=1`) research dispatch** emits `findings.md` with no `research.md` beside it — nothing to point at. *A review dispatch is not the reason: a review emits `review.md` only and is forbidden from writing a `findings.md`.* |
| `contradicts` | `discovery` | `discovery` | 0..N | **Symmetric.** Two discoveries assert incompatible things. A CLAIM, so it lives between the artifacts — never on a session's arrow. |
| `creates` | `session` | any Evidence artifact | 0..N | A session produced the artifact as output. |
| `updates` | `session` | any Evidence artifact | 0..N | A session changed the artifact after it already existed. **One edge per (session, artifact) pair, not one per edit** — a relation, not an event log. The event log is git. |

No edge is mandatory. Nothing yet obliges a synthesis to point at what it synthesized.

### The session rule

**A session may only CREATE or UPDATE a file. Nothing else.**

A session records what it **did**, never what is **true**. Create and update are *acts*. Everything
else a session might want to say — *this is refuted*, *these two conflict*, *this question is open* —
is a **claim**, and a claim belongs in an artifact. A session bears no authority; a verb that let it
assert would let it assert without standing.

So `refutes`, `surfaces-conflict`, `opens-question`, `closes-question` and `revisits` are **struck** —
each was a claim wearing an act's clothes. `consumes` (reading is not doing) and `continues-from` (the
thread of the work — neither act nor claim) fall to the same rule. **Nothing is lost:** a question
already lives in an artifact's `## Open Questions` section, so opening one *is* updating the artifact;
and a conflict lives on `contradicts` between the two artifacts, with the session that noticed it
simply `updates`-ing one of them. The act stays with the session; the truth stays with the artifact.

**`creates` is not total, and cannot be made so.** A session file exists only if `close-session` was
run, so an artifact may legitimately have **no session claiming it**. Provenance is **partial by
construction** — a fact about how sessions come into being, not a hole to plug. Nothing may be
inferred from a missing `creates` edge.

**Inverses are read directions, not edges.** `derives`, `created-by`, `updated-by` name the reverse
reading of an arrow that is written once, at its source. None appears in
[`ALLOWED-EDGES.yaml`](./ALLOWED-EDGES.yaml) — there is nothing there to permit.

**`discovery → discovery` carries `contradicts` and nothing else.** `derives-from` and
`alternative-to` between two discoveries are *unruled* — denied by absence, not struck — and recorded
as such in [`EDGES.yaml`](./EDGES.yaml), each with the condition that would flip it.

**The type graph cycles here, and that is correct.** `discovery → research → discovery` is a
type-level 2-cycle, and type-level cycles are admissible.

The **instance** graph must still be acyclic (no document derives from itself, directly or by a
path), and in the normal flow it is: `D1 → R1 → F1 → D2`, with `D2 ≠ D1` — a spiral, not a loop.

⚠️ **But nothing enforces that.** A discovery is `ephemeral`, and ephemeral does **not** mean
frozen ([Durability](#durability)) — `D1` can be edited after `R1` exists. If someone adds
`D1 --derives-from--> R1` while `R1 --derives-from--> D1` already holds, the instance graph has a
2-cycle and the grounding relation becomes circular: each rests on the other. Instance acyclicity
is therefore an **unenforced constraint**, not a consequence of durability. It needs a check.
Open.

**Accepted gap.** The edge points at the `discovery`, not at the *question*. A discovery with five
open questions cannot say **which** of the five a research was sent to answer; that is matched on
the text of the research's `question` field. Giving open questions their own identity would make a
question a node, which it is not (rule: a question is a field). Coarse by decision, not by
oversight.

`creates` and `updates` belong to a **provenance** class that the four-class table below does not
have, so neither has a declared morphism status. Open.

---

The kinds above are the **types** of the repository's document schema. Edges are the
declared relations between typed documents. A schema is types + edges + hom-sets; the
hom-sets are **not settled** — see the next section.

Edges split into four classes, and the class determines what an edge *is*, not merely
how it reads:

| Class | Edges | Status in the schema |
| --- | --- | --- |
| **grounding** | `derives-from`, `implements`, `validates`, `depends-on`, `rollup`, `consumed-by` | **morphisms** (proposed). Directed and typed. **The type graph cycles.** Both `discovery → research` and `research → discovery` exist ([Evidence edges](#evidence-edges)), so the 2-cycle is real at the type level. Acyclicity is an **instance** constraint (no document derives from itself), never a type-level one — and **nothing enforces it**: `ephemeral` does not mean frozen, so a `discovery` can be revised into a back-edge after the research that cites it exists. It needs a check. Open. |
| **succession** | `supersedes`, `deprecates` | **morphisms** (proposed). Endomorphisms (`T -> T`, same kind both ends) — note a `T -> T` arrow **is** a type-level self-loop, which is admissible; the strict order holds over **instances**. ⚠️ `updates` was listed here; it is **removed** — the name is now the session provenance verb ([the session rule](#the-session-rule)), and the consolidated catalog had already deprecated the succession sense (→ "use `version:` frontmatter"). |
| **provenance** | `creates`, `updates` | **not morphisms** — the endpoints are a session and an artifact, and a session is not an object of this category. Morphism status is **open**. |
| **conflict** | `contradicts`, `alternative-to` | **not morphisms** — symmetric, so they do not compose. `contradicts` is nonetheless a **real, permitted edge** on `discovery ↔ discovery`. |
| **navigational** | `questions`, `refines`, `exemplifies`, `contextualizes`, `flags` | **not morphisms** (candidate) — carry no authority; annotations. |

Only the first two classes belong in the category. A symmetric edge admitted as a morphism makes
`Hom(A,B)` infinite (`A contradicts B contradicts A ...` is an endless family of distinct paths) —
so `contradicts` **does not compose**.

⚠️ **That is all it establishes.** "Not a morphism" never licensed "not an edge", and an earlier
version of this section made exactly that leap, ruling `contradicts` a *"defect marker to eliminate,
never a relation"*. It is struck. The conflict class holds real edges that simply do not compose,
and on the `ephemeral` Evidence kinds a contradiction is `tolerated` — never resolved, never
deleted, therefore **permanent**, which is precisely what belongs on a graph. It is a live defect
only on `perennial` kinds, where both sides claim the present.

Where these verbs appear. ⚠️ **Appearing is not being sanctioned.** Several appear in the
consolidated catalog only as **tombstones** — `questions` is deprecated (→ `opens-question`),
`depends-on` is deprecated (→ `derives-from`). Read each line below as "where this word occurs",
never as "this word is licensed".

- `rollup` is the `Authority kind` column above: `canonical_kind -> authority_kind`, a
  typed coupling.
- `consumed-by` is the `### Primary Consumers` list carried by every definition card.
- `validates` and `questions` appear verbatim in the `## Contradictions` section of
  session records (e.g. `2026-07-08-1520`: *"validates …/constitution-invariant-axiom-role-review.md"*,
  *"questions …/attacks.md"*).
- `flags` is what `DEFINITION-DRIFT-AUDIT.md` does to a definition.
- `supersedes` / `deprecates` is the demotion path (`demoted` ≈ withdrawn or superseded).

## Open Questions

### OQ-1. Is the canonical-kind enumeration closed (default-deny), like Tier-2?

Context: the Tier-2 authority-kind set is closed. Whether Tier-1 should also be
closed-with-default-deny, or stay open-and-additive, is unresolved.
Recommendation: keep it **candidate/open** during design, decide closure before
standalone extraction. Status: OPEN.

### OQ-2. Does `axiom` roll up to `Definition`, or become its own coarse kind?

Context: mirrors [AUTHORITY-MODEL OQ-2](../../authority/AUTHORITY-MODEL.md#oq-2-should-invariant-and-axiom-become-first-class-authority-kinds).
As of 2026-07-08 `axiom` is canonically defined with an explicit boundary that an axiom
is **not** a definition. Its `authority_kind` is therefore marked **`unresolved`** rather
than `Definition` — the one row that does not yet name exactly one authority-kind (an open
coupling, not a hidden assumption), pending the OQ-2 decision-gate call. If OQ-2 promotes
`invariant`/`axiom` to first-class authority kinds, set the rollup accordingly.
Status: OPEN (tracked upstream).

### OQ-3. Per-instance durability override — recorded where?

Context: durability defaults live per kind; an instance may override with an owner
note. The carrier for that override (frontmatter field, ledger entry, Craft state)
is not yet decided. Status: OPEN.

### OQ-4. What authority-kind does `premise` roll up to?

Context: a premise is a bet (`veracidade` low, `convicção` high), adopted to proceed and
*not* established true. It is therefore not `Evidence` — evidence reports, a premise wagers
— and not `Definition`. It provisionally grounds invariants and rules, which is
authority-shaped behaviour without authority-bearing standing. The companion question — may
a premise ground an invariant or constitution rule? — is open on the term side. Marked
`unresolved` rather than guessed. Route: decision-gate. Status: OPEN.

### OQ-5. Is `projection` authority-reachable? And what holds `Residue` now?

Context: the `projection` row is marked `no` by **inference** from the coarse enumeration's "must
not collapse into" column — `Projection` must not collapse into a promotion decision. It is not
stated. The inference is recorded so it is visible as an inference, not read as a ratified value.

Because `residue` is an attribute and not a kind (rule 6), the coarse `Residue` **authority-kind
has zero canonical-kinds rolling into it**. An authority-kind with an empty rollup either means the
coarse enumeration should lose the row, or that residue-as-attribute needs a home the rollup model
does not have. Route: owner ratification; AUTHORITY-MODEL / decision-gate for the empty rollup.
Status: OPEN.

### OQ-6. Six canonical-kinds have no producing process.

⚠️ **Mostly parked ground.** Five of the six (`ledger`, `axiom`, `audit`, `backlog`, `conceptual`)
sit outside the `Evidence` scope this contract covers. Nothing here is a ruling.

A `process` is real only if it names an **owner route**: an installed, governed route that can be
invoked and that owns the output. Naming the activity, or restating the artifact, does not count.
Under that test, six kinds have no producer at all, failing in three ways:

| Kind | Why there is no producer |
| --- | --- |
| `conceptual`, `readme` | **Diffuse.** No single producer; authored in place (OQ-8). |
| `axiom` | **No owner exists.** "axiom authoring" is the act, not a route; there is no `axiom-governance`. |
| `audit`, `backlog` | **No owner exists.** No audit route, no backlog route. |
| `ledger` | **Circular.** "append-only ledger" named the process after the artifact. |

The original inference holds a fortiori: if six kinds can be canonical with no producer at all,
**"produced by a declared process" was never the membership test for canonicity.** The `process`
column is a *property* of kinds, not a *condition* of the type — and the membership test is still
unnamed.

The six are not equally harmless. `conceptual`, `readme`, `audit`, `backlog` and `ledger` still
roll up to an authority-kind (`Evidence`, `Projection`), so an owner is reachable even without a
producer. **`axiom` is the only kind with no producer *and* no `authority_kind`** — no route makes
it, and no kind holds it. That is the row that actually blocks: the AUTHORITY-MODEL derivation
pattern has a promoted `constitution` deriving from it, which cannot satisfy the
standing-monotonicity constraint in [Hom-Sets](#hom-sets) — an axiom has no `authority_state` to
compare. Route: decision-gate, jointly with OQ-2.

Status: OPEN (narrowed).

### OQ-7. `session` — one label or two? SETTLED BY DECISION (not by this file).

**This question was previously marked RESOLVED/CLOSED by the same agent that wrote it,
within one session, with no owner gate, on the reasoning that `canonical_kind` (schema)
and `node_type` (role) are orthogonal. That reasoning was false and the self-closure was
improper.** Both are struck.

The owner settled it on 2026-07-13
([decision](../../authority/decisions/2026-07-13-canonical-kind-one-label.md)): **one label**,
named `canonical_kind`. A session record's `canonical_kind` is `session`; what the session
*did* becomes edges, not a second type label. `is_session` is therefore redundant as a type
axis.

Note the source of the original objection — that a session's role varies, so `session`
should not be a type — is `implementation/domainspec/vault/ontology-conventions.md`, a
**consolidated** constitution. This file never cited it. The decision supersedes it as to
the label's name and cardinality only; that catalog's **edges** remain authoritative.
Status: CLOSED by owner decision.

### OQ-9. `audit` may not be a file kind at all. *(The `review` half is CLOSED.)*

**The `review` half is settled and the premise it rested on was false.** This question used to read
*"a review dispatch emits no `review.md` — it emits `findings.md`"*. That is no longer true, and the
`review` skill now forbids it outright: *"Never write `attacks.md` or `findings.md` from a review"*
(`.claude/skills/review/SKILL.md`, §14). A review dispatch emits **exactly one artifact, `review.md`**
— optionally not a file at all, when the human picks `output_mode: inline`. So `review` **is** a file
kind, it names a file, and it has one producer. *(This also falsified the old OQ-10: `findings` has a
single producer, the research dispatch, and OQ-10 is deleted.)*

Remaining, and it is `inline` that makes it interesting: an `inline` review persists **no file**. A
canonical kind whose instances may exist only in a chat transcript is a shape this enumeration does
not contain. Is `review` then a kind with optional instantiation, or is `output_mode: inline` simply
outside the ontology? Unresolved.

`audit` sits in the same position with no producing process at all (OQ-6), and its drafted
instance contract came out identical to `review`'s. **Do `review` and `audit` collapse?**

Route: ontology route to propose; decision-gate if it strikes a row. Status: OPEN.

### OQ-11. A third axis exists, and is unnamed.

The Kind Contract names two independent axes and derives a value from each:

| Axis | Question | Derives |
| --- | --- | --- |
| `authority_kind` | Can an instance ever bear authority? | `authority_reachable` |
| `durability` | Does the artifact claim to hold **now**? | `contradictions` |

**How an artifact mutates is a third question, independent of both, and nothing names it.** It is
not `durability` — an `ephemeral` discovery may be edited and a `perennial` definition may be
edited, so durability does not discriminate. It is not `authority_kind` — `ledger` and `definition`
are both mutable and only one is authority-bearing.

The axis is real and it discriminates:

| Mutation mode | Kinds | Test |
| --- | --- | --- |
| **Revisable** | `definition`, `axiom`, `constitution`, `spec`, `decision`, and every `ephemeral` kind | Entries may be added, changed, and **removed**. |
| **Append-only** | `ledger` | A later entry supersedes an earlier one; nothing is ever removed (rule 4 of [Rules](#rules)). |

The discriminator is a single binary: **can an entry be removed?** Ledger: no. Everything else: yes.
A second, correlated fact rides along — for the multi-entry kinds (`definition`, `axiom`, `ledger`)
state lives in the **entry**, not the file, which is also what breaks
[rule 1](#rules-1) outside the four kinds in scope.

Three things this does not settle. **(a)** The axis has no name and no field. **(b)** Whether
`decision` is revisable in its *content* — which rewrites history, the thing `supersedes` exists to
prevent — or only in its *metadata*. **(c)** Whether the file-vs-entry fact is a consequence of
this axis or a fourth axis of its own.

**No mutation contract may be inferred from any kind's `durability`.** Route: ontology route to
propose; decision-gate if it adds a free value to the Kind Contract. Status: OPEN.

### OQ-12. Filename-as-kind, or path-as-kind?

Rule 2 puts the kind in the filename. That is consistent with the
[one-label decision](../../authority/decisions/2026-07-13-canonical-kind-one-label.md), which fixed
the label's *name and cardinality* but not its *carrier*, and it strengthens rule 4: an instance
that declares no type cannot self-promote.

But filename-as-kind is only true of three of the four kinds in scope — the dispatch-folder outputs
(`research.md`, `findings.md`, `discovery.md`). Elsewhere the kind is carried differently or not
at all:

| Artifact | Where the kind actually lives |
| --- | --- |
| `sessions/2026-07-13-1152-cav2-d56-….md` | The **path** (`sessions/`). The filename is a timestamp-slug. |
| `authority/decisions/2026-07-13-canonical-kind-one-label.md` | The **path**. Same shape. |
| `authority/definitions/DEFINITIONS.md` | Nowhere — many `definition` instances in one file, which also violates [the unit is the file](#rules-1). |
| `README.md` | The filename, coincidentally. |

Three readings: (1) the rule is **path**-as-kind, and filename-as-kind is the special case where
the folder holds one artifact per kind — but then a file's *type changes when it is moved*;
(2) the rule is filename-as-kind and every kind must eventually be named `<kind>.md`, forcing a
rename of `sessions/` and `decisions/`; (3) the carrier is per-kind, which reintroduces the
lookup problem the rule was meant to delete. Route: ontology route to propose; decision-gate.
Status: OPEN.

### OQ-13. What shape does the `residue` attribute take?

Residue is an attribute (rule 6), carried by `discovery`, `session`, and *possibly* `findings`. Its
shape is undecided: a boolean flag, a list of unclosed items, a count, or purely a
`## Open Questions` section with no frontmatter at all. Two sub-questions: **(a)** does `findings`
carry it? **(b)** if the open question already lives in a `## Open Questions` section, does a
frontmatter field add anything a query cannot get from the section? Route: ontology route.
Status: OPEN.

### OQ-14. `session` instance contract is incomplete.

`session` carries the core contract, carries `residue`, and carries **no** `question`/`outcome`.
**CLOSED (owner, 2026-07-14) — both halves.**

**`authority_layer`** *(since renamed `evidence_for` and re-valued with authority kinds — same
2026-07-14 owner session; the ruling transfers unchanged)*. A session **does** carry it, and **may
carry several values**. The objection was that *"a session supports no single surface"*, which was
never a reason to drop the field: it is **list-valued** exactly so an artifact can name every
target it touches. A session that moved definitions and decisions says both. It remains a forward
declaration that **grants nothing**.

**The three forward sections are CONTRACT, not convention.** `## Open Questions`, `## Next steps`
and `## Recommendation` are mandated by the producing process, `close-session`
(`.claude/skills/close-session/SKILL.md` — the body template at :68–84, the discipline rules at
:97–100, which hold them to three distinct registers: *undecided* / *decided labor* / *ranks across
them and asserts nothing new*). Residue therefore **has a guaranteed home**: `## Open Questions` is
contractual, which is what [rule 9](#rules-1) needs to stand.

⚠️ **But the same skill breaks [the session rule](#the-session-rule).** See
[OQ-19](#oq-19-close-session-emits-session-edges-the-schema-forbids).

### OQ-19. `close-session` emits session edges the schema forbids.

**The producer named in the `session` row contradicts [the session rule](#the-session-rule) — and it
does so by design, not by drift.**

`.claude/skills/close-session/SKILL.md:35`:

> **Contradictions** — only if a vault node was validated, contradicted, or questioned. **One bullet
> per edge.**

And :98 routes questions *into* that section: *"A question naming a vault/spec node is a
`questions {node}` edge → `## Contradictions`, not Open questions."*

So `close-session` has a session declare `validates`, `contradicts` and `questions` **against other
nodes**. Every one is a **claim**, and the session rule says a session may only `creates` or
`updates`. The whole corpus in `sessions/` is written this way — this file's own session records
carry `validates …` and `questions …` bullets.

Two readings, and they are not close:

1. **`close-session` must change.** The claims are real but they belong on the artifacts. A session
   that finds A contradicts B **updates** A to carry `contradicts → B`; the `## Contradictions`
   section becomes narration of acts performed, not a list of edges the session originates.
2. **The session rule is too strong.** A session that may not even record *"I noticed these two
   disagree"* has been stripped of the one thing a work-record is for, and the rule should carve out
   an observation class.

**The rule was derived from this file's own principle** (*"a session records what it DID, never what
is TRUE"*) and it closed OQ-16 and OQ-17 by doing so. The cost is only now visible: it invalidates
the producer and, read strictly, the existing corpus. Nothing is migrated either way — the decision
defines, it does not rewrite history.

Route: decision-gate. Status: **OPEN — the schema and its own producer disagree.**

### OQ-18. Where is an edge physically written, and in what syntax? *(DEFERRED — close after the kinds are defined.)*

**The schema says which edges are permitted and what they mean. It never says where one lives.**
[`ALLOWED-EDGES.yaml`](./ALLOWED-EDGES.yaml) and [`EDGES.yaml`](./EDGES.yaml) name the verbs, the
endpoints and the cardinalities; the [Instance Contract](#instance-contract-frontmatter) is
frontmatter-only and names no edge field and no edge section. So there is **no edge carrier**.

The consequence is concrete: the only statement of a carrier anywhere is `## Connections` in
`.claude/skills/custom/domainspec-discovery-writing.md` — a *skill*, not the schema. An operator can
therefore write a conforming `discovery.md` and **nothing else**: a `research.md` needs
`derives-from → discovery` and must invent the carrier; so must a `findings.md` and a session file.

It also undercuts every *"recovered by a query"* defence in this file — reading `creates` backwards
to find a producer presumes a declared format to read.

Candidate: one syntax, owned by the schema and binding on all four kinds — a `## Connections` block
of `- <verb> → <relative path>` lines. Frontmatter is the alternative and is worse for a list that
carries paths.

**Deliberately deferred** (owner, 2026-07-14): the kinds are still being defined, and a carrier
fixed before the things it carries are settled would be fixed twice. Route: ontology route.
Status: OPEN — **blocking for any operator, not for the design.**

### OQ-16 and OQ-17 — CLOSED by [the session rule](#the-session-rule).

Both asked what a session may assert. **A session asserts nothing** — it may only create or update
a file. That one rule answers both, and neither question survives it.

- **OQ-16 (*does `refutes` have force?*)** was hard only because a session that bears no authority
  was being allowed to take a position. Remove the verb and the question dissolves. `refutes` is
  **struck**.
- **OQ-17 (*three session edges are unruled*)** resolves in both directions: `modifies` is admitted
  as **`updates`** (one edge per session/artifact pair — a relation, not an event log); `consumes`
  (reading is not doing) and `continues-from` (the thread of the work — neither act nor claim) are
  **struck**, being neither create nor update.

Struck with them, under the same rule: `surfaces-conflict`, `opens-question`, `closes-question`,
`revisits`. Each was a **claim wearing an act's clothes**. What they were reaching for now lives
where it belongs — a question in the artifact's `## Open Questions` section, a conflict on
`contradicts` between the two artifacts.
