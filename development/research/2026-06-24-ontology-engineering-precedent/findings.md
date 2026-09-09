---
node_type: research
title: "Ontology Engineering — Precedent Findings & Presentation Guidance"
dispatch_id: 2026-06-24-ontology-engineering-precedent
status: resolved
created: 2026-06-24
nature: research-synthesis
final_approver: parent
---

# Ontology Engineering vs CAV2 — Findings & Presentation Guidance

**One-line answer to the dispatch goal:** Almost everything in CAV2's ontology apparatus is
**already owned by the 30-year-old field** — the honest verdict is *build-from-owned* or
*already-deployed* on ~9 of 11 candidates; the **only** defensible spine to claim as a real
contribution is the **Non-Collapse thesis** (ontology models but cannot decide authority),
and even that holds **only under a write-authority proviso**. The presentation should cite
generously, drop every "we invented this" framing, and stake novelty on **one narrow, named,
still-open delta**: a *typed per-node challenge contract* coupled into a *traceable-authority*
loop.

Provenance: explorer returns in `research.md` (Tarski/Simon/Alexander); adversarial revision by
two skeptics (Kuhn = external precedent; Quine = internal definitional-soundness). Every
load-bearing cell cites its source. Claim ≤ proof: where a skeptic refuted a novelty claim, the
cell is demoted, not defended.

---

## 1. Verdict matrix (post-skeptic, final)

Ownership is a **label, not a verdict** — being owned is a GO (`build-from-owned`/
`already-deployed`), never a KILL. KILL is reserved for no-witness or definitional collapse.

| # | Candidate | Owner / precedent (citation) | Sound? | Verdict | Use-mode |
|---|---|---|---|---|---|
| 1 | B-op typed node/edge schema ≈ TBox/ABox | DL Handbook (Baader et al. 2003); W3C OWL 2 (2009) — **no RBox, no reasoner** | Structural-signature, **not** a DL TBox; "read-only" is operational not semantic | GO | build-from-owned |
| 2 | 9 Authority-Kinds as type meta-properties | OntoClean meta-properties (Guarino & Welty 2002, *CACM* 45(2)) | **PARTIAL** — Quine: the 9 inflate to ~5–6 real types | GO | build-from-owned *(+definitional fix)* |
| 3 | Promotion-states ≈ OntoUML **Phases** | Guizzardi 2005 (PhD, U. Twente); UFO 2021 | Sound **iff** states form a complete disjoint partition (CAV2 doesn't assert it) | GO | build-from-owned |
| 4 | Per-**term** promotion gate, evidence-separated-from-approval | **Wikidata Property Proposal** (proposer ≠ creator); **OBO term tracker** (IAO:0000233); schema.org `pending`; ISO 25964 `status` | Witnessed at per-term granularity — **novelty refuted (Kuhn)** | GO | **build-from-owned** *(was novel-attempt)* |
| 5 | "Evidence is not approval" as a **named principle** | **GRADE** (Guyatt et al., *BMJ* 2008; *J Clin Epidemiol* 2011) — quality-of-evidence ≠ strength-of-recommendation is its *defining feature*; Toulmin 1958; nanopublications (Groth et al. 2010) | Named, citable, operationalized — **most overclaimed draft cell (Kuhn)** | GO | **build-from-owned** *(was novel-attempt)* |
| 6 | Per-node **epistemic** confidence / evidence / promotion-status | Adjacent: Gangemi O²/oQual (ESWC 2006), OntoQA (2005) — but these are **density**, not epistemic; SEPIO (ICBO 2016) carries evidence lines | Per-term *epistemic* confidence is thin precedent; adjacent owners exist | GO | build-from-owned *(narrow residue)* |
| 7 | `forbidden_collapse` / `challenge_contract` | OntoClean subsumption prohibition + challenge protocol (Guarino & Welty 2002); "semantic obstacle" (Bergamaschi et al. 1999) | Sound; CAV2 **extends** OntoClean additively | GO | build-from-owned |
| 8 | "Governed map of meaning **with receipts**" | SHACL shapes graph + validation report (W3C 2017); **RDF + PROV-O** (W3C 2013) | **COLLAPSES** to RDF+PROV-O with no remainder (Quine) | GO **as use** / **KILL the novelty** | already-deployed |
| 9 | Business four-tuple (rule/constraint/signal/test) | SHACL `rule→constraint→sh:severity→SPARQLConstraint` (W3C 2017); XBRL closed hypercube (CoreFiling 2015) | Direct architectural analog | GO | already-deployed |
| 10 | **Non-Collapse** (ontology models, cannot decide authority) | DL/OWL have **no deontic semantics**; authority = institutional fact (Searle 1995); Gruber 1993 (spec ≠ governance) | **SOUND — conditional on the write-authority proviso** (§3); the one irreducible distinction | GO | build-from-owned *(the defensible spine)* |
| 11 | **The integration** (constraints + lifecycle gate + per-node challenge) | **TopBraid EDG / TopQuadrant** already couples per-node SHACL + lifecycle (Uncommitted→Under review→Approved→Committed, role-gated) + "request further changes" | Core **already-deployed (Kuhn)**; residual novelty = *typed per-node challenge contract* + named emergent property | GO | already-deployed *(+ narrow novel-attempt, **OPEN**)* |

**No row reaches a terminal KILL.** The two closest things to negatives are *novelty* kills, not
*use* kills: Row 8's "with receipts" novelty collapses to RDF+PROV-O, and Rows 4/5's novelty
claims were refuted by external owners. In research terms these are **wins** — the field hands
CAV2 building material it can cite.

---

## 2. Two definitional repairs the presentation must absorb (Quine)

These are internal-coherence fixes, independent of who else owns the ideas:

**R1 — The 9 Authority-Kinds inflate to ~5–6 real types.**
- `definition`, `decision`, `projection` survive cleanly as rigid + identity-bearing (+R +I) types.
- `discipline` is a **role/cross-cutting practice** (anti-rigid, dependent), not a kind — it *ranges over* the other types. (CAV2's own discipline-governance calls it "a recurring cross-capability practice.")
- `evidence` is a **role any artifact can play** (+D, ~R: a spec is evidence in one gate, the governed object in another), not a kind. → This is the same point Row 5 makes from the precedent side.
- `residue` is **ambiguous**: either "not-yet-classified remainder" (a *status field*, defined by absence — forbidden as a type) **or** "deliberately-preserved non-authoritative learning" (a positive type). CAV2 must pick one.
- `constitution` / `spec` / `runtime-contract` collapse on the *normativity* axis but separate cleanly on a **binding-target** axis (constitution binds artifact *form*; spec binds *intended* behavior; runtime-contract binds *executing* behavior). State the identity criterion as binding-target, or merge them.

**R2 — The three "forbidden overclaims" are two distinctions, not three.**
- `location ≠ meaning` and `meaning ≠ commitment` are both the **representation ≠ the-thing** schema (sign ≠ referent), applied at two layers — one distinction counted twice.
- `evidence ≠ approval` is genuinely different: **grounds ≠ verdict** (the is-ought / warrant-vs-commitment gap). This one stands alone.
- → Present **two** load-bearing separations, or justify why the layer difference is type-bearing. (This also de-duplicates Rows 4 and 5, which were the same claim as mechanism + slogan.)

---

## 3. The load-bearing proviso (keystone — carries its own collapse-test)

**Non-Collapse (Row 10) is the only irreducible contribution — and it self-destructs without one guard.**

> The map may **record** a node's `promotion-status`, but only an **external gate** may **write**
> that field. If any *modeling* operation can mutate `promotion-status`, the map both *means* and
> *commits* — Non-Collapse fails and Row 10 collapses into Row 8 (just RDF+PROV-O).

Collapse-test, same line: **find one code path where a modeling edit writes `promotion-status`
directly — if it exists, the thesis is false until it's closed.** PROV-O precedent supports the
fix: a node can carry `prov:wasGeneratedBy` an external activity (it *records* a verdict produced
elsewhere without *being* the authority for it). The proviso is the difference between "projection
of an authority decision into the map" and "the map deciding."

---

## 4. Presentation guidance

### CITE THESE (attribute; do not present as origination)
- **DL / TBox-ABox** (Baader et al. 2003; W3C OWL 2 2009) — for the typed-node/edge model, *with*
  the correction that CAV2's schema is a structural signature with **no reasoner** (Slide 2, the
  five-dimension core model).
- **OntoClean** (Guarino & Welty 2002, *CACM* 45(2)) — for type-level meta-properties,
  `forbidden_collapse`, and the challenge protocol (Slides 2, 4, 6).
- **OntoUML Phases** (Guizzardi 2005) — for promotion-states; add the complete-partition obligation.
- **SHACL** (W3C 2017) + **RDF/PROV-O** (W3C 2013) — for "governed map with receipts," permission
  boundaries in nodes (`sh:closed`), and the rule/constraint/signal/test four-tuple (Slides 5, 6).
- **XBRL closed hypercube** (CoreFiling 2015) — for node-level permission at regulatory scale
  (business-philosopher variant).
- **GRADE** (Guyatt et al., *BMJ* 2008) — for "evidence is not approval" (Slide 7, the decision
  surface). This is the citation that most strengthens the talk: a 15-year-old, widely-adopted
  framework whose *defining feature* is exactly the separation CAV2 forbids collapsing.
- **Searle 1995** + **Gruber 1993** — as *support* for the Non-Collapse spine (Slide 3, authority
  boundary; Slide 8, handoff).

### DON'T CLAIM AS NOVEL (owned; a novelty claim here is falsifiable on the spot)
- "Governed map of meaning with receipts" — **= RDF + PROV-O** (Quine KILL). Use it as a *framing*,
  never as an invention.
- The rule/constraint/signal/test four-tuple — **= SHACL architecture**.
- Per-term gate with evidence-separated-from-approval — owned (Wikidata, OBO term tracker, GRADE).
- "Evidence is not approval" — owned (**GRADE**, primary).
- Promotion-state lifecycle + per-node constraints + request-changes — **already shipped in
  TopBraid EDG**.

### WHERE CAV2 GENUINELY DIVERGES (claim only this — narrow, named, and partly OPEN)
1. **Non-Collapse as an enforced architectural invariant** (Row 10) — not just the *observation*
   that ontology ≠ authority (Searle/Gruber own that), but **enforcing** it via the write-authority
   proviso (§3). First obligation: prove no modeling path writes `promotion-status`.
2. **Traceable authority** as the emergent property of the integration (Row 11) — any binding
   commitment **back-chains to its evidence AND forward-chains to the meaning-node it governs, in
   one structure**. No single owned part has this (the map means-without-committing; the gate
   commits-without-locating; the lifecycle sequences-without-meaning). First obligation: name this
   property in the deck and show the chain end-to-end — otherwise it's a packaging claim.
3. **Typed per-node challenge contract** (Row 11 residue) — distinct from EDG's free-form "request
   further changes." **OPEN**: not yet checked against PoolParty / Metaphacts / data-mesh
   governance (Kuhn declared this un-searched). Do **not** assert this divergence in the
   presentation until that sweep runs.

---

## 5. Open items (banked, not closed)
- **PoolParty / Metaphacts / data-mesh** sweep for a typed per-node challenge/dispute contract —
  needed before claiming divergence #3.
- **XBRL element-level governance** and **nanopublication retraction/dispute** workflows — Kuhn
  declared these un-searched this round.
- CAV2 action item (not research): resolve the `residue` ambiguity (R1) and verify the
  write-authority proviso (§3) holds in code.

---

## 6. Verdict in one paragraph
The research did its job by **finding owners**, not novelty. CAV2 has independently rebuilt a large
slice of ontology-engineering practice (DL typing, OntoClean discipline, SHACL/XBRL governance
maps, GRADE-style evidence/approval separation, EDG-style lifecycle gates) — which is a *credible*
position, not a weak one, *provided the presentation cites it as such*. The defensible, citable
spine is **Non-Collapse enforced by a write-authority boundary**, composing into **traceable
authority**. Everything else is build-from-owned. The single highest-leverage edit to the deck:
replace any "novel" framing on Slides 5–7 with citations (especially **GRADE** on Slide 7), and
move the novelty weight onto the Non-Collapse invariant (Slide 3) where it actually holds.
