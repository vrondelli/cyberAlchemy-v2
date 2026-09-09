# Authority Lifecycle Source Cluster

Status: candidate source cluster
Owner: definitions-governance
Tower: to be assigned by definitions-governance (authority / governance cluster)
Tower map: [../DEFINITION-TOWERS.md](../DEFINITION-TOWERS.md)
Canonical local definitions: [../DEFINITIONS.md](../DEFINITIONS.md)

## Authority Rule

This cluster stages a generalization of the promotion-lifecycle shape that
already recurs across CyberAlchemy v2. It is **not canonical definition
authority**. These terms become normative only if definitions-governance
promotes them into [../DEFINITIONS.md](../DEFINITIONS.md) (term: stable ID,
complete voices, index sync, drift review) and — for the binding rule —
constitution-governance authors the enforceable constitution rule and validator.
This staging follows the explicit route in the inventory synthesis
([scientific-authority-lifecycle-synthesis.md](../../../../.arcanum/inventory/entries/scientific-authority-lifecycle-synthesis.md)):
"if this becomes load-bearing, route the term through definitions-governance and
constitution-governance."

## Candidate Rows

| Local candidate ID | Source term | Evidence basis | Local posture | Next action |
| --- | --- | --- | --- | --- |
| `CAV2-CAND-LIFECYCLE-001` | `authority promotion lifecycle` — **canonical-track term (per CR-2)**; aliases: `scientific authority lifecycle`, `promotion lifecycle` (NOT `pattern authority lifecycle` — that is `CAV2-D43`'s) | Inventory synthesis [scientific-authority-lifecycle-synthesis.md](../../../../.arcanum/inventory/entries/scientific-authority-lifecycle-synthesis.md); [promotion-policy.md](../../promotion-policy.md) Promotion Ladder; [AUTHORITY-MODEL.md](../../AUTHORITY-MODEL.md) Core Flow; instances `CAV2-D43` (pattern), `CAV2-D46` (experience), `CAV2-D23` (lifecycle axis), `CAV2-D5`/`CAV2-D13`; Arcanum Discipline Growth Rule ([arcanum/disciplines/DISCIPLINES.md](../../../../arcanum/disciplines/DISCIPLINES.md)). | **PROMOTED → `CAV2-D48`** (2026-06-23); was the general lifecycle *object* candidate | Promote only as the **generalization** the existing ladder exhibits — a build-from-owned **generalization inference** (the parent object is named in no owned source; owner-gated, not a mechanical lift). Register `CAV2-D43`/`CAV2-D46`/Growth-Rule as instances, not rivals. |
| `CAV2-CAND-LIFECYCLE-002` | `closed authority-kind enumeration` (default-deny for unenumerated kinds) — **re-scoped 2026-06-23 per review CR-1** from `no authority without a lifecycle` (which collapsed into the Authority Rule) | AUTHORITY-MODEL Authority Kinds table (closed enumeration, no catch-all) + Authority Rule; **live instance** = OQ-2 (`invariant`/`axiom` govern from *outside* the table); template invariants `CAV2-D16`/`D29`/`D38`; review dispatch `2026-06-23-authority-lifecycle-artifacts-review`. | **PROMOTED → `CAV2-D49`** (2026-06-23); the binding *closure rule* (definition), references `-001`; enactment `CAV2-C16` still blocked | Route the **term** through definitions-governance (with the OQ-2 decision); the **enforceable rule + validator** through constitution-governance. Carries the re-scoped collapse-test below. |

## Candidate Voice Sketches

Pre-canonical sketches. They preserve the candidates' intended shape for a later
definitions-governance pass without letting this cluster redefine CAV2 authority.

### Authority Promotion Lifecycle (`CAV2-CAND-LIFECYCLE-001`)

**Canonical-track name (per review CR-2):** `authority promotion lifecycle`.
Aliases: `scientific authority lifecycle` (the scientific-method framing) and
`promotion lifecycle`. **NOTE (post-merge cleanup 2026-06-24):** `pattern authority
lifecycle` is **NOT** a `D48` alias — it belongs to `CAV2-D43 pattern promotion
lifecycle` (the merge surfaced an alias collision; resolved in D43's favor).

Scientific/formal sketch: the single staged path by which any authority-bearing
candidate may acquire authority — `source evidence → candidate → owner-routed
review → promoted authority → (optional) invariant/constitution pressure` — with
per-stage gates, an owner route, and a stopping/demotion rule. It is the
generalization that [promotion-policy.md](../../promotion-policy.md)'s ladder
already instantiates and that `CAV2-D43` (patterns), `CAV2-D46` (experience), and
the Arcanum Discipline Growth Rule (disciplines) are **instances** of.

Plain-language sketch: nothing gets to "count" by appearing, being useful, or
being repeated. It has to walk a known path — candidate, evidence, challenge,
owner decision — and only then becomes authority.

Domain-context sketch: in CAV2 this is the parent of the per-kind lifecycles
already promoted (pattern `D43`, experience `D46`) and the disciplines ladder. It
names the common shape so a new authority *kind* inherits a lifecycle by default
instead of inventing a private one.

Boundary sketch: this is **not** "everything has a lifecycle." It is scoped to
**authority-bearing** kinds. Evidence (`D34`/non-collapse rule 1), residue
(`D18`), ledger events, one-off logs, and generated projections are inputs or
terminal artifacts — they are governed, not promoted-by-proximity, and do not
each carry their own promotion ladder.

Purpose served (non-normative). This lifecycle is the mechanism for CyberAlchemy v2's
**knowledge-condensation function**: it condenses operational/source evidence into
canonical, owner-routed authority (the descriptive thesis recorded in
[scientific-authority-lifecycle-synthesis.md](../../../../.arcanum/inventory/entries/scientific-authority-lifecycle-synthesis.md)).
"Condense knowledge" is therefore framed as **the purpose this lifecycle serves, NOT a
separate primitive term**. It overlaps `CAV2-D2` (source-ledgered amalgamation), `CAV2-D18`
(residue), `CAV2-D19` (ontology), and the `distill` discipline, so it is deliberately **not
staged as its own `CAV2-D`** — staging it would trip the definitional-soundness (re-skin)
gate. If a project-purpose statement is wanted, its home is the value/philosophy surface
([VALUE-AND-PHILOSOPHY-PROPOSITION.md](../../../VALUE-AND-PHILOSOPHY-PROPOSITION.md)) under the
project / decision-gate owner — not definitions-governance.

### Closed Authority-Kind Enumeration (`CAV2-CAND-LIFECYCLE-002`)

**Re-scoped 2026-06-23 per review CR-1.** The prior framing — "no authority
without a lifecycle" — was found to **re-skin the Authority Rule** (AUTHORITY-MODEL
"authority moves by owner route, not by proximity/usefulness/repetition"). This is
the survivable, non-redundant core that the review left standing.

Scientific/formal sketch (invariant): the set of authority **kinds** is a **closed
enumeration** (the AUTHORITY-MODEL Authority Kinds table). An artifact whose kind
is **not** in that enumeration MAY NOT acquire or exercise authority — it defaults
to **blocked** pending an owner decision that adds the kind to the enumeration with
its declared lifecycle (`-001`) and owner route. Adding a kind is itself
owner-gated. Derivation: invariant = "the kind enumeration is closed; unenumerated
⇒ default-deny"; axiom = "an un-typed, un-owned kind cannot govern" — this
**extends** `CAV2-D41`'s owner-route rule to the case it assumes away (no
owner/kind exists yet); `constitution rule` + `validator` are the enforceable
downstream.

Plain-language sketch: a new *type* of authority can't start governing just because
it appeared. Until it is on the official list of kinds — with its lifecycle and
owner — anything of that kind is blocked.

Domain-context sketch: the live case is **OQ-2** — `invariant` and `axiom` already
govern (`CAV2-D16`/`D29`/`D38` are cited invariants) yet sit **outside** the
Authority Kinds table. This rule turns OQ-2 from an open note into a default-deny
obligation: add them to the table (resolve OQ-2) or their governing-as-a-kind use
is out of bounds.

Boundary sketch: scoped to authority **kinds** (the enumeration), **not**
individual artifacts and **not** the per-artifact promotion path (that is the
Authority Rule + `promotion-policy.md` ladder, already owned). It does not restate
"authority moves by owner route"; it handles the case the Authority Rule assumes
away — a kind with no enumerated owner/ladder yet.

**Collapse-test (binds the headline; tested against the RIGHT baseline per CR-1).**
Tested against the AUTHORITY-MODEL **Authority Rule + Promotion Ladder** (not just
the per-kind lifecycles `D43`/`D46`/Growth Rule): this rule reduces to the Authority
Rule **unless** (a) the kind table is genuinely closed with no catch-all row, AND
(b) a real unenumerated-but-governing kind exists. Both hold today (no catch-all;
OQ-2's `invariant`/`axiom`). It folds to zero the moment a catch-all
"any-other-kind ⇒ default-deny" row is added to the kind table — because that row
*would be* this rule.

## Promotion Gate

Canonical promotion requires, per [promotion-policy.md](../../promotion-policy.md)
and [AUTHORITY-MODEL.md](../../AUTHORITY-MODEL.md):

1. definitions-governance update to [../DEFINITIONS.md](../DEFINITIONS.md) for
   `-001` (and, if promoted as a term, `-002`), with all three voices, stable
   IDs, index sync, and drift-audit entry;
2. constitution-governance authoring of the enforceable rule + validator for
   `-002` (the binding invariant) — this is the owner route definitions-governance
   cannot perform;
3. a decision-gate record if the scope (closed kind-enumeration) or the
   stand-alone-rule-vs-fold-into-the-kind-table framing is contested;
4. resolution dependency: the generic `invariant`-as-authority-kind question
   (AUTHORITY-MODEL OQ-2) does **not** block promotion — `-002` can land as a
   specific invariant definition exactly as `CAV2-D16`/`D29`/`D38` did.

## Candidate Constitution Rule (DRAFT — SUPERSEDED by the kind-table catch-all row, 2026-06-23)

**Status update 2026-06-23 (decision-gate):** the "fold into kind table" fork was
chosen — closure is now enacted as a **default-deny catch-all row** in the
[AUTHORITY-MODEL Authority Kinds table](../../AUTHORITY-MODEL.md#authority-kinds)
(review-mode), per decision record
[2026-06-23-authority-kind-closure-catchall-row.md](../../decisions/2026-06-23-authority-kind-closure-catchall-row.md).
So a **stand-alone `CAV2-C16` rule is no longer the path**; the only remaining piece
is the **deterministic validator** (the automated kind-enumeration scan), still
pending under OQ-1 / sigil-development. The draft below is retained as the
rule-text of record for that validator's spec
([validation/authority-kind-closure-validator-SPEC.md](../../validation/authority-kind-closure-validator-SPEC.md) — candidate; build blocked by OQ-1).

Authored by constitution-governance (2026-06-23) to operationalize invariant
`CAV2-CAND-LIFECYCLE-002` (now `CAV2-D49`). Drafted in the candidate cluster; not an
active stand-alone rule. Proposed number was `CAV2-C16` (max was `CAV2-C15`).

### CAV2-C16 (proposed). Closed Authority-Kind Enumeration (default-deny for unenumerated kinds)

**Re-scoped 2026-06-23 per review CR-1** from "No Authority Without a Lifecycle"
(which re-skinned the Authority Rule). Validation mode: hybrid — deterministic
adapter **none-yet** (promotion-blocked until built).

The set of CyberAlchemy v2 authority **kinds** is a **closed enumeration** (the
AUTHORITY-MODEL Authority Kinds table). An artifact whose kind is **not** in that
enumeration **may not acquire or exercise authority**; it defaults to **blocked**
pending an owner decision that adds the kind to the enumeration with its declared
lifecycle (`CAV2-CAND-LIFECYCLE-001`) and owner route. Adding a kind is itself
owner-gated (constitution-governance + decision-gate).

Before an unenumerated kind may govern, the owner decision must name:

- the new kind and why the existing kinds do not already cover it,
- its promotion lifecycle (states + gates + owner + stop rule),
- its owner route and validation mode,
- the table amendment as a schema amendment witness (`CAV2-D25`).

Live instance (the rule's reason to exist): **OQ-2** — `invariant` and `axiom`
govern (`CAV2-D16`/`D29`/`D38`) yet sit outside the Authority Kinds table. Under
this rule they are either added to the table or their governing-as-a-kind use is
blocked.

Scope: authority **kinds** (the enumeration), not individual artifacts. The
per-artifact "no governance by proximity/usefulness/repetition" is the Authority
Rule (`CAV2-D41`), already owned; this rule covers the case the Authority Rule
assumes away — a kind with no enumerated owner/ladder.

Examples:

- A newly-invented "score" or "signal-authority" kind cannot govern until it is
  added to the kind table with a lifecycle + owner.
- `invariant` / `axiom` (OQ-2): blocked from governing-as-a-kind until the table
  is amended or they are mapped to an existing kind.

Non-examples:

- An artifact of an **already-enumerated** kind (definition, constitution, ...) —
  governed by its existing ladder/owner, not by this rule.
- Evidence / residue / generated projections — not authority kinds (Non-Collapse
  Rule 1); out of scope.

**Collapse-test (binds the rule; against the right baseline per CR-1).** Tested
against the Authority Rule + Promotion Ladder: collapses to the Authority Rule
**unless** the kind table is closed with no catch-all AND a real
unenumerated-but-governing kind exists — both true today (OQ-2). Folds to zero if a
catch-all default-deny row is added to the kind table (that row *is* this rule).

Composition / precedence: composes with `CAV2-C4` (Inventory/Ontology
Non-Promotion), `CAV2-C11` (Import Before Promotion), and the Authority Rule — it
is the **closure over the kind enumeration**, not a per-artifact gate. Resolves /
relates to OQ-2 and the `invariant`/`axiom`/`constitution` role-split review.

Validator impact (mode hybrid, adapter none-yet):

- deterministic (to build): scan that every governing artifact's kind is in the
  `AUTHORITY-MODEL` kind table; flag any artifact whose kind is unenumerated; check
  the table carries no silent catch-all;
- review: judging whether a borderline kind is genuinely new vs an existing kind.

Promotion gates (all required before this becomes `CAV2-C16`):

1. definitions-governance promotes `CAV2-CAND-LIFECYCLE-002` (closure) and decides
   the `invariant`/`axiom` kind status (OQ-2);
2. the deterministic adapter above is built (route: sigil-development / tools);
3. decision-gate confirms: stand-alone closure rule vs fold into the
   AUTHORITY-MODEL kind table as a catch-all `default-deny` row;
4. assign the canonical number and edit it into STABLE-REPOSITORY-CONSTITUTION.md.
