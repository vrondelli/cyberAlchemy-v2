# Research transcript — OQ-6 open questions (verbatim returns)

Dispatch: `2026-07-08-open-questions-noncollapse`. This file is the raw record; the usable
synthesis is in [findings.md](./findings.md). Returns pasted verbatim (lightly trimmed of tool
chatter). Topology: E1 ∥ E2 (explorers) → synthesizer ◀zig-zag(loop_cap 1)▶ reviewers → auditor.

---

## E1 — OQ-A · Church, Alonzo (explorer, OPTIMIST — a shape discriminant exists)

Verdict: a computable shape-layer discriminant EXISTS — two, both on disk, one already computed by
the shipped checker (`wEdge`). Neither parses the Formal cell, so neither crosses D15's *literal*
moat; so the exception lane is not mechanically necessary to make the separation fire. BUT no
discriminant is simultaneously (a) mechanically available AND (b) mechanically provable-clean.
**Discriminant A** — declared-value inequality over the `attribute-equals` value cells
(boolean/strategy/value differ across the trio). **Discriminant B (already shipped)** —
authority-resolved edge-signature inequality: Rule sourceE={enforces}/targetE={mirrors}, Policy
{applies}/{}, Calculation {calculates,queries}/{applies}; all pairwise distinct, so `wEdge` *would*
separate the trio today. The only reason it doesn't: the allowlist short-circuit at
`meta-type-noncollapse.ts:115` returns `exception-lane` before `wStruct`/`wEdge` run. Key retrieved
fact: the lane doesn't cover a *gap* in mechanical discrimination — it *suppresses a witness the
code already produces* (residue note :48). D15 *literally* blesses reading the declared value
(DEFINITIONS.md:578-579); the moat is only "do not parse the Formal cell" (:591). **KEYSTONE
collapse-test:** on the registry there is a total function {boolean↦enforces, strategy↦applies,
value↦calculates} with no counterexample, so the edge carries zero info beyond the attestation —
separating on it is separating on `formal_return_type` in an edge costume (a1 defect generalized,
§8). This survives the checker's own §6 permutation guard (permuting only the value cell leaves
`edge_participation` untouched → `wEdge` invariant → passes §6). Detecting the co-variation
verb=f(value) requires reading the value the moat brackets — a moat-respecting validator cannot run
its own laundering check. Theory: the trio are structurally identical, differ only *nominally*; a
shape checker cannot separate structurally-identical inputs. **Honest boundary:** the optimist wins
the *literal* D15 claim (a moat-legal discriminant exists on disk) and loses the *operative* one
(it is nominal, reads declared meaning, and its cleanliness is not mechanically certifiable).
Mechanical detection can OPERATE the separation but cannot CERTIFY it clean — certification is the
only thing the lane ever provided. Sources: Nominal type system (Wikipedia); arXiv 1401.2567.

> *Note (established later by Taleb + auditor): the keystone total function is FALSE at n=3 —
> Calculation sources {calculates→Operation, queries→Entity}. Church's "no counterexample" is
> refuted.*

---

## E1 — OQ-A · Tarski, Alfred (explorer, PURIST — the lane is a permanent necessity)

Bottom line: the exception lane is a **permanent shape-layer necessity RELATIVE TO the D15 moat** —
but not a hard computability impossibility. The trio is separable in bytes on disk (edges differ);
what is not separable is the trio *using only witnesses the moat admits*. The three schemas are
byte-identical in every field the validator may read (required_structure `[Attribute,Value]`; same
`attribute-equals` rule; same key `formal_return_type`), differing only in the VALUE
(boolean/strategy/value) the validator may not read. Three composing locks: (1) D15 forbids the read;
(2) the checker mechanically enforces blindness (`deriveFacts` populates `structKeys` only for
`STRUCTURE_READING` rules; `attribute-equals ∈ ATTESTATION` → all three `attestationOnly=true`,
empty `structKeys` → `wStruct=false`); (3) the edge differences look like an escape but are
*laundered meaning* (§8: endpoint typing assigned by author from the same `formal_return_type`
attestation under test → crediting as independent W-edge launders attestation as structure).
**Load-bearing:** the *implemented* checker does NOT contain the §2.2 clause-3 non-laundering test —
`evaluatePairs` short-circuits allow-list pairs to `exception-lane` before `wEdge` runs. So the lane
is the only thing preventing a laundered "distinct via W-edge" false positive; it converts a
would-be laundered "distinct" into an honest "shape-unresolvable" — a structural role, not a
placeholder. **Formal mapping:** Tarski undefinability = *tight architectural analogy* (validator =
object language restricted to shape; engine/moat = metalanguage) but NOT the theorem (Tarski's is
diagonalization-forced; D15's boundary is a governance decision — the validator is *forbidden* to
credit `value:boolean`, not *unable* to read it → deontic). Rice = *loose/heuristic* (the
discriminator is a declared attestation value, decidable in one lookup if reading were permitted;
citing Rice as proof would overclaim). **KEYSTONE collapse-test:** the permanence claim dies the
moment the on-disk schema carries a `STRUCTURE_READING` clause that fires differently across the
trio — a genuinely different table/section shape per type. Does not exist today. Weaker second
refuter the design concedes (§8 deferred): an owner-admitted *exercised* edge whose endpoint typing
is provably independent of `formal_return_type`. **Honest verdict:** CONDITIONAL permanence —
permanent as long as (i) D15 forbids reading return-meaning [Tarski-legitimate] AND (ii) the owner
keeps judging the trio's edges as laundered correlates [a governance call, not a theorem — the
counterpart's only real opening]. Sources: Rice's theorem, Tarski undefinability (Wikipedia).

---

## E2 — OQ-B · Spivak, David (explorer, AUTHORITY-READING IS PERMANENT)

Claim 1: what is shipped already IS the authority-resolved reading and it is the **a1 fix**, not a
placeholder (`wEdge` builds sets from DS-D8 `signaturesById`, never raw schema slices; DS-D8 misuse
warning DEFINITIONS.md:1146-1147 forbids using schema `edge_participation` slices as independent
authority). The exercised-instance reading (§2.2 clause 1) is a *further* tightening on top of the
a1 fix. Claim 2: a DS-D8 signature IS the semantics at the schema/functorial level; an instance is
only a model. In functorial semantics the theory is a category, meaning logically prior to and
independent of any model (nLab; Spivak arXiv:1009.1166 "a database schema is a small category and an
instance is a set-valued functor on it"). Two objects with different declared hom-profiles are
different objects whether or not any functor populates the distinguishing arrow; identifying them
because no current model separates them is a category error. Claim 3: parent law D3 is type-level
("an edge TYPE is admissible IFF composes into different code" :111), so its node mirror must be too;
requiring an exercised instance for the node witness while the edge law is satisfied by declaration
makes the node gate strictly stronger than the gate it mirrors — unjustified asymmetry. Claim 4: the
instance reading is UNSOUND in the load-bearing direction — over-rejection = declaring two genuinely
distinct types collapsed, forcing a real merge that destroys a type, on instance-corpus
incompleteness not semantics (review :51). Ghost worry answered: (a) the gate is schema-level
irredundancy; downstream code branches on declared capability *before* any instance — the
declaration IS the branch. (b) a vacuous ghost edge cannot exist in the authority — an edge is in
DS-D8 only if it passed D3 admissibility and D18 non-collapse, so any distinguishing edge is already
owner-admitted as compositionally load-bearing. Honest residue: "load-bearing somewhere" is weaker
than "load-bearing at the A-vs-B boundary." **KEYSTONE:** IF a meta-type can enter a signature's
source/target set by a move admissible WITHOUT composing into different code, the authority is no
longer a sound proxy → must tighten. This is not hypothetical — D3's own corollary is the crack:
"widen a SOURCE endpoint (same target, same semantics) = clean" (:115). Since `wEdge` reads
`source_types→sourceE`, a clean-widened type is separated from a peer — a separation D3 itself
certifies composes into NO different code. Load-bearing position: authority reading correct
permanently; the one break is the keystone. Sources: nLab Functorial Semantics; Spivak
arXiv:1009.1166; Lawvere TAC reprint.

---

## E2 — OQ-B · Jacobs, Bart (explorer, MUST TIGHTEN TO EXERCISED)

`wEdge` today: participation = signature-declared endpoint eligibility, not realized use. Claim 1:
D3 makes "code actually differs" the bar; a signature endpoint set is a *disposition* ("an Operation
WOULD be a valid source IF one ever produced"); a disposition no instance realizes produces no
different code. Claim 2: the design already specifies the sound reading and it is instance-level —
§2.2 clause 1: "there exists a concrete edge x--verb-->y EXERCISED in the active spec/registry (an
aspect file/instance/fixture — NOT the schema's `edge_participation` declaration)." Current `wEdge`
implements clause 2 alone and drops clause 1. Claim 3: DS-D8's misuse warning forbids treating
declaration as realized authority; authority-resolution reintroduces the a1 defect one level up
(treats the *signature's* declared endpoint set as realized — same ghost, higher shelf). Claim 4
(external, load-bearing): "no distinction without a distinguishing observation" is the standard
soundness discipline and it is behavioral/exercised (observational equivalence; coalgebraic
behavioral equivalence — non-bisimilar states separated by a concrete distinguishing observation;
Wikipedia Observational equivalence; arXiv:2002.11459; Jacobs, *Intro to Coalgebra*). A difference
living only in the signature table, never realized by an observation, is a ghost. **Transition
cost (checker run):** 91 pairs, 1 collapse today (Saga~Workflow); **27 pairs survive SOLELY by the
authority-resolved edge witness** (tag `(W-edge)`, no `W-struct`) = the pairwise combos among the 8
attestation-only-not-exempt types {Operation, Query, Saga, Workflow, Event, Interface, Mapping,
State Machine}, C(8,2)=28 minus Saga~Workflow. None backed by an exercised instance (no aspect files
exist; the 14 `.instance.yml` are self-tests generated *from* schemas; `financial-settlement/SPEC.md`
exercises only a handful of typed edges). Flip to clause 1 today → all 28 collapse → the 8 annihilate
into ONE class → 14 → ~7 classes, a 28× jump. So the mandated reading is SOUND BUT NOT OPERATIONAL.
**KEYSTONE:** authority-resolution is correct permanent IFF DS-D8 is closed under "no signature
endpoint admitted unless a real exercised D3-witnessed edge already composes into different code" →
authority sets extensionally = exercised distinctions → memoized cache → converge. Test against repo:
FALSE today (nothing checks each of 31 active signatures is backed by an exercised instance; D18
checks relationship-type non-collapse, not endpoint-exercise). Honest hinge: the keystone is
OWNER-DECIDABLE — adopt it as a promotion gate and the readings converge by construction; absent that,
the observational discipline forces tightening.

---

## Synthesizer draft — Leinster, Tom (pre-review)

*[Draft produced the shared reconciling fact (four-clause W-edge; shipped `wEdge` = clause 2 only;
allowlist = clause-3 proxy). OQ-A: NO within the moat — mechanical detection can OPERATE the
separation but cannot CERTIFY it clean; conditionally permanent on (i) D15 + (ii) owner judgment;
Tarski demoted to analogy, Rice not-as-proof. OQ-B: the spec already decided "exercised";
authority-resolution is an interim clause-2 cache; both explorers converged on the closure-invariant
keystone from opposite directions; 28× collapse if flipped today → sound-but-not-operational;
deciding test = clean-widening audit of relationships.yml. Framed both as "mostly an owner decision
with a non-owner residue." The full draft was handed to the reviewers verbatim.]*

---

## Reviewer — Gödel, Kurt (skeptic, FORMAL-LIMITS gate)

**INITIAL.** The draft's honesty about not overclaiming Tarski/Rice is fatal to its own modal
vocabulary. (1) "Conditionally permanent": both conditions are governance choices; D15 is a misuse
warning (DEFINITIONS.md:591), amendable through the same gate that authored it → correct modal is
*axiom-relative*; strike "permanent." (2) "Certification is moat-forbidden" is FALSE — testing the
functional dependency value↦verb treats the value as an *uninterpreted equality key* (what
`attribute-equals` already does opaquely), never parsing meaning; so the co-variation the keystone
relies on is shape-detectable WITHOUT a moat read → self-refuting. An owner-provenance annotation
also makes certification architecturally available. The real surviving limit is finite-corpus
*identifiability* (law vs. accident), NOT undefinability. (3) OQ-B's invariant quantifies over
"composes into different code" = Rice-undecidable in general, decidable only via D3's finite proxy;
proxy and target diverge on clean-widening → the keystone's needed extensional identity is
*ill-typed*, not just empirically false → upgrade to "ill-posed." The 91/28/28× numbers are out of
my lane.
**FINAL.** Taleb sharpens OQ-A's induction residue — value↦verb is 3 rows (already leaking via
Calculation's `queries`); a new type breaks totality → a live promotion-gate check, not a permanent
property. He does NOT move me on: "permanent" fails *modally* even in a frozen registry (repealable
axiom) — my objection bites where his goes silent; keep both as independent defeaters. Clean-widening
is a *static* incoherence at N=14, zero new types — a proof-level defect, survives any "robustify vs
new types" hardening. Net: withdraw "certification is moat-forbidden"; OQ-B's honest core is that the
closure invariant is ill-posed; strike "permanent" — max modal is "stable while D15 + owner
laundering-judgment hold."

---

## Reviewer — Taleb, Nassim (skeptic, VACUITY/FRAGILITY gate)

**INITIAL.** Both answers are fit to today's bijections and mislabel the fitting as peripheral
residue. **OQ-A keystone is already FALSE at n=3:** Calculation sources TWO verbs — `queries`
(relationships.yml:229, source_types ["Query","Calculation","Operation"], example GenerateSettlement
--queries--> SettlementTransaction) plus `calculates` → Calculation={calculates,queries}; the
`queries` membership is orthogonal to `formal_return_type`, so "edge carries zero info beyond
attestation" is already false, papered over by cherry-picking one verb per type. Scenario A1 (add
`Invariant`: returns boolean, sources `constrains→Entity`): boolean now maps to two (verb,target) →
`wEdge` separates Rule from Invariant by DIFFERENT TARGET = genuinely different code, NOT laundering
→ mechanical detection certifies clean without a return-parse. Scenario A2 (add `Enforcer`: boolean +
`enforces→Operation`, byte-identical to Rule): `wEdge` does NOT separate → collapse the lane cannot
rescue (discriminator value identical). Hidden condition (iii): each `formal_return_type` sort ↦
exactly one (verb,target) pair; nothing monitors it. **OQ-B:** the closure invariant CONTRADICTS the
clean-widening corollary (:115), which admits a source type *because* it does not compose into
different code; corpus already has these (queries=3 sources, exposes/applies=2 targets). Edge-law
economy PREFERS widening → permanent ghost generator, not one-time audit. The 28→8 story assumes
DS-D8 keys on `feature_scope`: Saga & Workflow both source `orchestrates` (relationships.yml:148-177,
differing only by feature_scope) → key on verb-id alone and they collapse TODAY. The 28 is BOTH
transient AND structural, unseparated — hiding the signal that some types should genuinely merge.
**FINAL.** Gödel sharpens my OQ-A verb — "conditionally permanent" is also unproven in the only form
that matters (quantify over all future registries; a covariation on 3 leaking points can't support
that quantifier). With Tarski/Rice gone there is NO remaining engine of permanence, only the
unguarded bijection. He does NOT move me to accept a relative-to-today impossibility proof as closure
— a theorem whose antecedent dissolves at the 15th type is valid and worthless; a proof can be SOUND
AND FRAGILE at once. My ADDs (bijection-monitor; clean-widening non-separation fix) survive unchanged.

---

## Synthesizer final — Leinster, Tom

*[The final synthesis — with the keystone refutation confirmed against source, "certification is
moat-forbidden" and "permanent" withdrawn, OQ-B upgraded to "ill-posed antecedent," both defeaters
preserved, and the checker instruments listed — is reproduced as [findings.md](./findings.md).]*

---

## Auditor — Vlachopulos, Ioannis (final_approver): ACCEPT

Opened every load-bearing citation. **Keystone refutation CONFIRMED** — relationships.yml:229 lists
`Calculation` in `queries.source_types` (target Entity); `calculates` (100-102) targets Operation →
Calculation = {calculates→Operation, queries→Entity}; the draft's total function is genuinely false
at n=3. **Clean-widening contradiction CONFIRMED** (DEFINITIONS.md:111 vs :115). **Shipped `wEdge`
CONFIRMED** clause-2-only, allowlist as clause-3 proxy. **Saga/Workflow `orchestrates` split by
feature_scope CONFIRMED at the data level**, and the synthesis honestly declares it did NOT locate
the resolver to confirm keying. All four audit criteria pass; withdrawals move claims *below* the
prior proof line; both defeaters survive into the conclusion; still-open magnitudes declared, not
asserted. Two non-blocking copy-edit imprecisions noted ("D15 is a misuse-warning" is a loose gloss;
"Saga/Workflow differ only by feature_scope" omits the source_type difference). **Verdict: ACCEPT;
treat the three declared still-open items as the required next verification pass.**
