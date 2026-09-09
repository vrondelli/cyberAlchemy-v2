# Refined Design — Authority-Harness / Ledger / Ontology Unification (zig-zag loop 1 of 2)

Synthesizer: Spivak. Role: resolve the unifier↔separatist tension into one buildable design.
Discipline: claim ≤ proof; every load-bearing claim cites an explorer return, a skeptic return, or a
source file. Both explorer returns are pasted verbatim in `research.md`. The three skeptic returns
(Quine/definitional-soundness, Popper/non-vacuity, Lakatos/precedent) are this revision's authority.

## What the skeptics changed (honest concession)

The skeptics did NOT overturn the *shape* — they overturned the *deliverable framing*. Loop-0 sold
"build a new authority-harness object + a movement-envelope object." Quine proves that object is the
**existing `authority_artifact_lifecycle_envelope` re-drawn field-for-field** — so building a parallel
harness IS the identity-collapse failure the separatist warned about, committed by the synthesizer.
The corrected deliverable is **EXTEND the existing envelope**, not author a rival. Concretely:

- **C1 COLLAPSES under identity.** My "rails" (`artifact_id, artifact_kind, authority_owner,
  current_status, sources[], conflicts[], drift_owner, ontology_refs, promotion{}`) are the
  `authority_artifact_lifecycle_envelope` field-for-field (`RESULT.md:54-99`). There is no new rail
  object to build — the rail already shipped. (Quine)
- **C6 COLLAPSES under identity.** The "movement-envelope = record-core + drift_owner + ontology_refs"
  IS the existing envelope: that envelope ALREADY carries `drift_owner` and `ontology_refs:{candidates,
  projections}` (`RESULT.md:73,84-86`). Nothing net-new; Popper independently confirms the homeless
  fixture fields land on projection metadata exactly as predicted (witnessed, see below).
- **C3 COLLAPSES under identity.** "Typed projection + bridge" is the **already-shipped vault event-
  sourcing split** — atemporal nodes + append-only `ontology_events`, audit views JOINing
  `EventTable`+`Vault` (`ontology-architecture-draft.md:99-107,138-141`) — renamed. The vault already
  runs this. (Quine)
- **C5 COLLAPSES under identity AND is a no-witness KILL.** "Movement edges inherit the session carve-
  out" is the existing forward-only session carve-out (`ontology-conventions.md:314-318`) renamed —
  AND it does not actually apply (see KILL-until-amendment below). (Quine + Popper)

**The ONLY net-new identity that survives Quine is the TYPED-HOLE CONTRACT** (loop-0 C2's structural
form): *the rail produces a `promotion_record` but never sees the `verdict`; the per-kind owner profile
is the sole judgment producer.* Survivors C2/C4/C7 survive as RULINGS (a contradiction proof, an axis
taxonomy, an orthogonality placement), not as objects to build. Lakatos confirms: all 7 candidates are
owned → build-from-owned; the value is **assembly of owned parts + the typed-hole contract**, never a
new object; net-new surface is narrow (dialect-selector tag, emit-hook, the forward-only-movement edge
generalization — which is gated, see KILL).

## The bridge edge is KILL-until-amendment (Popper)

Popper is a PARTIAL witness: the node/envelope end is non-vacuous, but the **bridge edge (C3/C5) is a
NO-WITNESS KILL against the current constitution.** The constitution has exactly two forward-only
carve-outs, both keyed on a concrete fact, and the skip list is explicitly **closed** at those two
(`ontology-conventions.md:295-320`):
1. target under `.claude/skills/**` or `.claude/agents/**` (`:295-312`), OR
2. source has `is_session: true` (`:314-320`).

A promotion-movement edge matches **neither**: source is `is_session:false`; target under
`arcanum/development/**` is the OPEN question OQ-C (`:312`). No `node_type` value (event/movement/
promotion) exists that would let the record be a vault node carrying a lawful inverse (`:56`). So
**neither a forward-only NOR a bidirectional movement edge can be hand-built today.** My C5 premise
("inherits the carve-out because same temporal logical type") is NOT encoded — the carve-out is keyed
on the `is_session` boolean, not on a logical-type judgment. **The ontology-tie cycle has exactly one
open link today.**

**Exact amendment required** (one of, via the schema-evolution gate at `:476`, authored as a
discovery node):
- (A) a **third forward-only carve-out** keyed on the movement-event's logical type (so a promotion-
  movement edge is forward-only-by-source like a session), OR
- (B) a **`promotion-event` (or `movement`) `node_type`** with a lawful catalog forward/inverse pair
  (Appendix C), so the record is a real vault node carrying a well-typed inverse.

Until (A) or (B) ships through the gate, the node/envelope end is buildable and the bridge edge is
**KILL**. Do not hand-build the edge against the current constitution.

## C4 downgraded (Popper)

C4 was a 2-point claim sold as 3. The append-only authority-movement row has **NO in-repo validating
schema**: register's appender rejects unknown keys (it is not a ledger schema), craft is edit-in-place,
and the signals surface is **still UNREAD**. So the ledger-spec is a **selector over TWO validated
profiles (craft edit-in-place, register append-only) + ONE unread (signals) + a MISSING append-only
authority-ledger validator that must be BUILT** before the movement ledger has any contract. The
selector taxonomy is sound as a *naming* of profiles; it does not yet *validate* the authority row.

---

## (SUPERSEDED loop-0 detail retained for trace) 1. ONE (rails) vs PER-ENTITY (profiles)

### 1.1 The shared layer STOPS before the validate/promote judgment

Simon keystones 1–2 accepted: the three skills share a section spine and route into one
`candidate → owner-gate → promotion_record → projection` mechanism (`promotion-policy.md`
Required-Gates; placement `RESULT.md:18-24`; `…ontology-knowledge-lifecycle…/findings.md:28`; all
gate on owner+evidence+validation, Simon §1b). But Bateson §3 wins the cut line: definitions'
single-normative rule (plain voices "must not override" canonical,
`definitions-governance/SKILL.md:108-115`) and constitutions' conflict-preservation ("preserve both
rules… do not silently let the larger override the narrower", `constitution-governance/
SKILL.md:122-139`) are **contradictory at the policy level** — one forbids competing authority, the
other requires it. A single default validate+promote interface cannot hold both. Therefore:

> The harness owns intake, evidence, record-shape, status-ladder, and projection-emission rails. It
> does NOT own the validate-and-promote JUDGMENT. That judgment is a per-kind profile callback the
> rail calls but never defaults.

This is the protocol review's own finding — each kind routes to its own owner
(`…authority-movement…/findings.md:83-91`) — made structural. Simon §5 already lists "separate owner
routes" as an invariant (`RESULT.md:48-49`); the refinement makes it the boundary: shared interface
= everything up to `gate_route`; `verdict` is produced by the profile, never by a shared default.

### 1.2 The three layers

| Layer | Owns | Shared/per-entity | Source |
| --- | --- | --- | --- |
| Rails (ONE) | intake, `sources[]`, `current_status` ladder, record-shape, `ontology_refs`, drift_owner field, emit-hook | SHARED | `RESULT.md:58-87`; `…lifecycle…/findings.md:163-173` |
| Profile (PER-ENTITY) | the `validate+promote` judgment and the payload it judges | PER-KIND (3 incompatible) | `definitions…:108-115`; `discipline…:29-31,:122`; `constitution…:122-139` |
| Bridge/Projection | forward-only witnessed-movement edges + atemporal node | SHARED mechanism, owner-gated emission | §2 |

The profile is a *typed hole* in the rail. The rail guarantees a `promotion_record` is produced; it
never sees *how* the verdict is reached. definitions plugs a single-voice validator; constitutions
plugs a conflict-preserving validator; the rail never reconciles them because it never sees the
judgment — only the verdict the profile returns. The contradiction is dissolved by never
co-locating the two judgments in one function.

---

## 2. Ledger↔ontology: BRIDGE + TYPED PROJECTION, not collapse

Verdict: KILL the literal "ledger = ontology subgraph" identity; REPLACE with a typed projection
joined by forward-only witnessed-movement bridge edges. Bateson's atomicity+mutability evidence is
dispositive; Simon concedes the literal-enum form (§4c "structural yes, literal-enum no"). Three
facts:

1. Atomicity / OQ-6 OPEN. A promotion is multi-write — file move + frontmatter + N inbound-edge
   rewrites + audit append + discovery citation (`epistemic-chain.md:321-327`), edge consistency
   **unsolved, OQ-6 Open** (`:440-456`). Identity asserts atomicity the repo lacks; a bridge claims
   only witness, sound under open atomicity. Single most load-bearing reason to reject collapse.
2. Two opposite mutability laws. craft edit-in-place w/ prohibited-transition validators
   (`ledger.schema.yml:5-8,:906-924`); register append-only, close = second row
   (`register-dispatch/SKILL.md:11-12,:188-203`). The vault already runs this split internally:
   atemporal nodes + append-only `ontology_events` (`ontology-architecture-draft.md:138-141`).
3. Audit views need the JOIN. Computed from `EventTable` + `Vault` as two inputs
   (`ontology-architecture-draft.md:99-107`); collapsing either way destroys an axis.

### 2.1 What the claim BECOMES

> The authority ledger is the append-only event-log of promotion movements. The ontology is the
> atemporal typed current-state. A promotion_record is the bridge object: it emits (a) an
> owner-gated current-state update to its concept-node, and (b) an append-only movement event. The
> "subgraph" is a TYPED PROJECTION — a read model JOINING the node's current-state to the
> witnessed-movement edges pointing at it. The ledger is NOT a subgraph of the vault; the
> projection is a view OVER both.

Bridge edges already exist as accepted *witness* language — `emits_when_gate_allows`,
`witnesses_cross_branch_authority_movement`, and vault analogs `derives-from/validates/codified-as/
supersedes`, with "none equals promotion or a gate verdict" (`…authority-movement…/findings.md:78,
:54-55`). The bridge witnesses; it never promotes.

### 2.2 Directionality / well-typedness fix (answers Bateson leaks §2)

Movement-event edges are **forward-only by source**, inheriting the vault carve-out that temporal
actors get: session edges are forward-only because "sessions are transient activity records… not
stable graph nodes" (`ontology-conventions.md:314-318`). A promotion-movement event is the same
logical type — temporal activity — so it inherits the carve-out and does NOT trip the
bidirectionality auditor (`:291-293`). This dissolves leak §2.1 (directionality) and §2.4 (append-
only ledger "has no graph"): the append-only ledger is the event source; bridge edges are forward-
only events into the node — no inverse, well-typed. Leak §2.3 (status-enum) honored by keeping
`current_status` (workflow) on the record/ledger and `status` (5-rung maturity,
`ontology-conventions.md:60`) on the node — different questions, separated per orthogonality
(`:332-345`).

---

## 3. The three concrete artifacts

### 3.1 Default interface (RAIL contract — judgment held out)

```yaml
# authority-harness RAIL (build-from-owned: RESULT.md:58-87; spine: …lifecycle…/findings.md:163-173)
artifact_id:
artifact_kind:   definition | discipline | constitution | spec | decision | other   # profile selector
authority_owner: definitions-governance | discipline-governance | constitution-governance | decision-gate
current_status:  source-evidence | import-candidate | review-candidate
               | blocked | active | drift-flagged | superseded | deprecated          # workflow axis
sources: [ {source_id, source_path, source_authority_posture, origin_role,
            semantic_delta, public_private_posture, confidence} ]
conflicts: [ {source_id, conflict_kind, resolution_status} ]
drift_owner:
ontology_refs:   { candidates, projections }            # bridge handle, NOT the node itself
# --- typed hole: rail calls profile.validate_and_promote(payload), never defaults it ---
profile_payload:                                        # supplied + judged ONLY by the owner profile
promotion: { gate_route, promotion_record, verdict, decided_by, decided_at }  # verdict ← profile
```

Per-profile judgment (cannot be defaulted into one — Bateson §3):

| Profile | validate_and_promote judgment | Source |
| --- | --- | --- |
| definition | single normative voice; 3 colocated voices; plain must not override canonical | `definitions…:28-44,:108-115` |
| discipline | public-safe vs private-parent routing (never private→public) + Growth Rule | `discipline…:29-31,:105,:122` |
| constitution | preserve BOTH conflicting rules; narrowest-scope-first; never silently override | `constitution…:122-139` |

### 3.2 Reusable ledger-spec (policy axis + dialect)

A SELECTOR over two validated profiles, not one schema (no in-repo schema governs both modes;
register hard-codes a non-craft schema — Bateson §1.2):

```yaml
ledger_spec_axis:
  mutability:    edit-in-place | append-only
  row_identity:  stable-id | two-row(open+close) | event-append
  graph:         typed-rows+relations | flat+json-column | flat-event
# craft    = edit-in-place / stable-id / typed-rows+relations  (ledger.schema.yml:5-8,:558-613)
# register = append-only / two-row / flat+json-column          (register-dispatch/SKILL.md:8-13)
# signals  = append-only / event-append / flat-event           (UNREAD — collapse-test C4)
```

Authority uses: movement ledger = **append-only** dialect (events never rewritten → bridge sound
under OQ-6); current-state = vault node (edit-in-place maturity). The harness needs BOTH on two
objects — exactly why they stay two profiles, not one collapsed schema.

### 3.3 Concept-node / movement-envelope / promotion-record tie

- concept = node: vault node w/ `node_type`, atemporal role (`ontology-conventions.md:56,:75`).
- movement-envelope = canonical promotion_record CORE + 2 projection fields. CAOL fixture supplies
  the core (`promotion-record-fixture.md:18-34`); `drift_owner`+`ontology_refs` have no fixture
  column (Simon keystone 5 dent) → bridge/projection metadata, not record fields.
- ledger = bridge-projection, NOT subgraph (§2.1).

---

## 4. Refined design in ~12 lines (corrected by skeptic loop 1)

1. **Do NOT author a new authority-harness or movement-envelope.** EXTEND the existing
   `authority_artifact_lifecycle_envelope` (`RESULT.md:54-99`) — the rail already shipped (C1/C6).
2. The net-new contribution is the **TYPED-HOLE CONTRACT**: the rail guarantees a `promotion_record`
   is produced but **never sees the `verdict`**; `validate_and_promote` is a per-kind profile callback
   the rail calls and never defaults.
3. The cut line is forced by a REAL contradiction (survives as a ruling, C2): definitions forbid
   competing authority (`definitions-governance/SKILL.md:108-115`); constitutions preserve it
   (`constitution-governance/SKILL.md:122-139`). They cannot share one validate+promote default.
4. Add ONE tag to the envelope: a **`ledger_spec_axis`** (mutability / row_identity / graph) naming
   which dialect the artifact's movement record uses — a selector, not a unifying schema.
5. C3 ("typed projection") is NOT net-new — it is the shipped vault event-sourcing split
   (`ontology-architecture-draft.md:99-107,138-141`). Reuse it; do not re-describe it as a new object.
6. **The bridge movement-edge is KILL-until-amendment** — the ontology-tie cycle has one open link.
   Required amendment: a third forward-only carve-out OR a `promotion-event` node_type with a lawful
   inverse, via the schema-evolution gate (`ontology-conventions.md:476`). Until then, no edge.
7. C7 survives as a RULING (net-new placement): `current_status` (9-value workflow) lives on the
   record/ledger; maturity `status` (5-rung) lives on the node — Popper witnessed this
   (`ontology-conventions.md:60` vs `ledger.schema.yml:111-121`; orthogonality `:332-345`).
8. C4 downgraded: selector over two validated profiles + one UNREAD (signals) + a MISSING append-only
   authority-ledger validator to BUILD before the movement row has a contract.
9. Every loop-0 invariant still holds as a convention-amendment, not a new object (owner routes
   separate; authority-by-proximity killed; ARR not a vault edge by assertion).
10. Record C5/C7 as **conventions-amendments** to `ontology-conventions.md`, not as engine objects.
11. First slice (buildable today): the typed-hole `validate_and_promote(payload)→verdict` signature on
    the existing envelope + the `ledger_spec_axis` tag + READ the signals JSONL schema + BUILD the
    append-only authority-ledger validator.
12. Second slice (gated): author the schema-evolution-gate discovery for the bridge edge (option A or
    B); only after it ships does the movement-edge / full ontology-tie cycle close.

---

## Final verdict matrix

| # | Candidate | Owner (already exists?) | Witnessed? | Sound (distinct)? | Verdict | What to build |
|---|---|---|---|---|---|---|
| C1 | Stratified harness (rails shared) | `authority_artifact_lifecycle_envelope`, `RESULT.md:54-99` | yes (envelope shipped) | NO — identity-collapse, field-for-field | **EXTEND-OWNED** | nothing new; extend the existing envelope |
| C2 | Contradiction dissolved by cut line (typed-hole) | definitions vs constitution SKILLs `:108-115`/`:122-139` | n/a (proof) | YES — the one net-new identity | **GROUND** (net-new) | typed-hole `validate_and_promote` callback signature |
| C3 | Ledger↔ontology = typed projection + bridge | vault event-sourcing `ontology-architecture-draft.md:99-107,138-141` | yes (vault runs it) | NO — renamed shipped split | **EXTEND-OWNED** | reuse vault split; do not re-author |
| C4 | Ledger-spec = selector over profiles | craft `ledger.schema.yml`, register `register-dispatch/SKILL.md`; signals UNREAD | partial (2 of 3) | PARTIAL — 2-pt claim sold as 3 | **EXTEND-OWNED + BUILD** | `ledger_spec_axis` tag; READ signals; BUILD append-only authority-ledger validator |
| C5 | Movement edges inherit session carve-out | session carve-out `ontology-conventions.md:314-320` | NO witness | NO — not encoded; matches no carve-out | **KILL-until-amendment** | schema-evolution-gate discovery: 3rd carve-out OR `promotion-event` node_type+inverse (`:476`) |
| C6 | Envelope adds only projection metadata | envelope already carries `drift_owner`/`ontology_refs`, `RESULT.md:73,84-86` | yes (homeless fixture fields land here) | NO — identity; fields already present | **EXTEND-OWNED** | nothing new; fields already on envelope |
| C7 | workflow `current_status` vs maturity `status` split | `ledger.schema.yml:111-121` vs `ontology-conventions.md:60`; orthogonality `:332-345` | yes (Popper confirmed) | YES — distinct axes, distinct objects | **GROUND** (ruling) | conventions-amendment recording the two-object placement |

**Net-new contribution (the only things to build):** (1) the **typed-hole contract** (C2 — GROUND);
(2) the **`ledger_spec_axis` tag** on the existing envelope (C4 partial); (3) the **C7 orthogonality
placement** as a conventions-amendment. **Everything else is EXTEND-OWNED** (C1/C3/C6) or
**KILL-until-amendment** (C5 — one open link in the ontology-tie cycle, fixable only through the
schema-evolution gate). Building a parallel harness or movement-envelope object would itself be the
identity-collapse failure.

---

## 5. STAGED CANDIDATES (claim · anchor · inline collapse-test)

C1 — Stratified harness (rails shared, judgment per-profile).
Claim: one harness shares intake/record/status/emit rails while validate+promote is a per-kind
callback, never a shared default. Anchor: `…lifecycle…/findings.md:163-173`; `RESULT.md:58-87,:48-49`.
Collapse-test: a rail step that must read/reconcile two profiles' judgment payloads to function
(rail cannot stay judgment-blind). → seam is below the judgment, contradiction re-fuses.

C2 — The contradiction is dissolved, not held, by the cut line.
Claim: definitions' single-voice rule and constitutions' conflict-preservation never co-occupy one
function. Anchor: `definitions…:108-115` vs `constitution…:122-139`.
Collapse-test: a SHARED rail field whose validation must choose globally between "forbid competing
authority" and "preserve competing authority." → contradiction is back inside the shared layer.

C3 — Ledger↔ontology is a typed projection + bridge, NOT an identity.
Claim: forward-only witnessed-movement bridge + join-view is sound under open atomicity. Anchor:
OQ-6 Open `epistemic-chain.md:440-456`; audit-join `ontology-architecture-draft.md:99-107`;
"none equals promotion" `…authority-movement…/findings.md:78`.
Collapse-test: a closed owned mechanism making the full premise→axiom move transactional under one
record (OQ-6 already Closed). → identity becomes defensible, bridge is needless indirection.

C4 — One ledger-spec is a SELECTOR over two validated profiles, not one schema.
Claim: craft (edit-in-place) and register/signals (append-only) stay two profiles named by one axis;
authority uses the append-only dialect for the movement ledger. Anchor: `ledger.schema.yml:5-8,
:906-924` vs `register-dispatch/SKILL.md:11-12,:188-203`; signals JSONL UNREAD (Simon keystone 4).
Collapse-test (two kills): (a) one in-repo schema already validates both an edit-in-place and an
append-only family under one contract → over-separation; OR (b) signals JSONL carries a field
inexpressible as an append-only event row → axis does not cover the third surface. (b) = mandatory
pre-build read.

C5 — Bridge edges are forward-only temporal, inheriting the session carve-out.
Claim: movement-event edges are forward-only (no inverse) like session edges → well-typed, no
bidirectionality violation. Anchor: session carve-out `ontology-conventions.md:314-318`;
bidirectionality `:291-293`.
Collapse-test: a constitution clause requiring movement/provenance edges to be bidirectional, with
the auditor flagging forward-only movement edges as bugs. → bridge is malformed, leak §2.1 reopens.

C6 — promotion_record stays canonical; envelope adds only projection-side metadata.
Claim: the envelope = record-core + drift_owner + ontology_refs, not a competing record. Anchor:
fixture core `promotion-record-fixture.md:18-34`; missing columns = Simon keystone 5 dent.
Collapse-test: an envelope field beyond drift_owner/ontology_refs with no promotion_record home AND
load-bearing for the promotion DECISION. → envelope is a rival record, "canonical" weakens.

C7 — current_status (workflow) and status (maturity) stay on different objects.
Claim: 9-value workflow status on record/ledger; 5-rung maturity on node → honors orthogonality,
resolves status-enum leak. Anchor: craft `ledger.schema.yml:111-121` vs vault
`ontology-conventions.md:60`; orthogonality `:332-345`.
Collapse-test: a consumer (projection/gate/audit view) requiring a SINGLE status field spanning both
workflow and maturity → forces the two axes onto one object (forbidden redundancy's dual).
