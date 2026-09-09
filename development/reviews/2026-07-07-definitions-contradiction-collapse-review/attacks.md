# attacks.md — DEFINITIONS.md contradiction + collapse review

Dispatch: `2026-07-07-definitions-contradiction-collapse` · dispatch_type: review · closed corpus = `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` (CAV2-D1..D50).

This file is the verbatim attacker (and, below, verifier) record. Both attackers' **initial** and **post-confrontation (final)** positions are preserved so any premature convergence in the `robot_talks` round is detectable.

Attack lanes:
- **G1/A1 — Russell, Bertrand** — contradiction lens, counter-example vector.
- **G1/A2 — Bourbaki, Nicolas** — collapse/redundancy lens, definitional vector.

---

## A1 — Russell — INITIAL position (contradiction findings)

Read all 50 entries + Authority Rule header + Open Questions footer. Findings, most load-bearing first; every finding quotes literal text from both entries.

### 1. D5 (Promotion Gate) vs D13 (Authority Promotion Queue) — the promotion decision has two different verdict sets. MAJOR
- **D5 Boundary:** "The gate may return pass, flag, or block. A flag is not a silent pass; it carries named risk and follow-up."
- **D13 Boundary:** "An authority promotion queue is not a promotion gate result. Items in the queue remain candidate-only until the responsible owner records a pass, flag, block, deferral, or rejection."
- **Witness:** A queue holds a candidate; the owner wants to **reject** (or **defer**) it. D13 admits five verdicts incl. reject/defer; D5, the gate that resolves that promotion, enumerates only three and offers no reject/defer. Recording a rejection is a legal D13 outcome D5's gate has no verdict for.

### 2. D5 (Promotion Gate) vs D37 (Gate) — D5's verdict set is strictly below D37's declared minimum, though D37 names D5 as an instance. MAJOR
- **D37 Normative:** "Unless a narrower gate defines otherwise, the minimum verdict vocabulary is `pass`, `flag`, `block`, and `defer`."
- **D37 Domain-Context:** "gate is the generic primitive under `CAV2-D5` promotion gate, … and the pass/flag/block behavior".
- **D5 Boundary:** "The gate may return pass, flag, or block."
- **Witness:** D37 mandates ≥4 verdicts incl. `defer` and names D5 as an instance; D5 offers 3 and cannot `defer`, without claiming to "define otherwise." Read literally D5 falls below the parent's stated minimum. (Internal wobble: D37's own Domain-Context says "pass/flag/block behavior" — 3 — while its Normative mandates 4.)

### 3. D32 (Method) vs D50 (Discipline) — Craft method (D20) assigned two mutually-exclusive genera/owners. MAJOR
- **D32 Normative:** "A method may be instantiated by a narrower named method, such as `CAV2-D17` …, `CAV2-D20` Craft method, or `CAV2-D21` …".
- **D50 Domain-Context:** "`CAV2-D20` Craft method is itself **a** discipline (an instance), not the genus."
- **D50 Boundary:** "A discipline is **not** a canonical term (definitions-governance owns terms) … a discipline can recommend a route, but it cannot define a term or author a constitution."
- **Witness:** D20 is a canonical definition/term owned by definitions-governance. D32 types it as an instance of *method*; D50 types the same D20 as a *discipline* which "cannot define a term" and is "not a canonical term." Same object → two owners, one class excludes a property (canonical-term-hood) D20 already holds.

### 4. D16 (Typed Coupling Invariant) vs D29 (Axis Orthogonality Invariant) — coupling must be a typed relation (D16) vs may be a gate/validator/owner-decision (D29). MAJOR (invariant-vs-invariant)
- **D16 Invariant:** "if `A` and `B` cannot vary independently for the decision being made, then CyberAlchemy v2 must record a typed relation `R(A, B)` before the coupling can influence authority, routing, validation, or implementation."
- **D29 Normative:** "treated as independently variable unless an explicit typed relation, **gate, schema rule, validator, or owner decision** relates them."
- **Witness:** Two non-orthogonal axes related only by an owner decision (or gate/validator), no `R(A,B)`. D29 lets the coupling govern; D16 blocks it ("must record a typed relation `R(A,B)` **before** the coupling can influence authority"). D22 sides with D16 ("its dependency must be represented through `CAV2-D16`") — the corpus is internally split.

### Pairs Russell attacked that HELD
- D16 vs D22: held — D22 explicitly subordinates to D16.
- D19 Ontology boundary vs D23 Authority Lifecycle Axis: held — D19 cedes lifecycle to D23.
- D41 Authority Model vs D49 Closed Authority-Kind Enumeration: held — D49 "extends D41".
- D40 Challenge Contract vs D23: held — D40 disclaims a third confidence axis.
- D48 "single staged path" vs D43/D46 differing stage counts: held (softest) — D48 defends via genus/instance.

---

## A2 — Bourbaki — INITIAL position (collapse findings)

Read all 50 entries + Open Questions. Single lens: definitional redundancy under the file's own D22 orthogonality test.

### Finding 1 — D37 swallows D5 — CRITICAL
- D5: "A promotion gate is an explicit owner route that decides whether evidence, candidate meaning, a recurring practice, or a structural rule may become local authority, implementation work, or standalone repository material."
- D37: "A gate is an explicit checkpoint that decides or routes whether a candidate term, rule, artifact, relation, method, claim, mutation, or execution may continue, must continue with named risk, must stop, or must defer to another owner." Names D5 as instance: "gate is the generic primitive under `CAV2-D5` promotion gate." Verdicts: D5 "pass, flag, or block"; D37 "`pass`, `flag`, `block`, and `defer`."
- **Merge:** D37 survives; D5 folds in as the promotion-scoped example. D5 adds no field/verdict/owner-route D37 lacks → fails D22 admission.

### Finding 2 — D48 absorbs D43 and D46 — CRITICAL
- D48: "the single staged path by which any authority-bearing candidate may acquire authority … the generalization that … `CAV2-D43` (patterns), `CAV2-D46` (experience) … are instances of." (`instances = { CAV2-D43, CAV2-D46, Discipline Growth Rule }`)
- D43/D46 carry the identical skeleton `hypothesis → evidence → candidate → cross-context exercise → challenge → owner promotion → authority`; only domain-local stage nouns differ.
- **Merge:** D48 survives; D43+D46 fold in as named instances. Genus itself declares the redundancy.

### Finding 3 — D29 absorbs D22; keep D16 as dual — MAJOR
- D29: "Advancing one axis must not silently advance … another axis. If a decision depends on such co-change, the dependency must be represented through `CAV2-D16`…" names D22 as its specialization ("`CAV2-D22` specializes it for classification admission").
- D22: same rule with "classification" for "axis"; unique sliver = mutual-information/retrieval-entropy admission evidence (itself D27's domain).
- **Merge:** D29 survives; D22 folds in (retaining entropy note). Keep D16 as the distinct dual (independence-by-default vs coupling-when-not).

### Finding 4 — D11 genus; D14/D15 its two halves — MAJOR
- D11: "a project, source, or execution area that can own, supply, consume, or route content for one or more definition towers…"; groups as "project spaces, source spaces, and Craft execution spaces."
- D14 = "outside the … authority surface"; D15 = "inside … with a declared project-local role." Distinction = one bit internal/external.
- **Merge:** D11 survives; D14+D15 fold in as a `space posture: internal/external/craft-execution` field.

### Finding 5 — D38 absorbs D47 — MAJOR
- D38: "a claim's asserted strength … must not exceed the proof, evidence, witness, validation result, owner decision, or accepted premise cited for it."
- D47: "UX/UI claims must state which kind of evidence can support them and what that evidence cannot prove" and discharges to D38 ("`CAV2-D38` requires downgrading…").
- **Merge:** D38 survives; D47 folds in as the UX instance. (Notes D45/D46/D47 as a UX domain-specialization trio instantiating D41+D48+D38.)

### Finding 6 — D42 vs D44 — MAJOR (contestable)
- D42 = the governance-interface obligation on a load-bearing artifact tree; D44 = the threshold at which a concept earns such a tree. "What" vs "when" of one governance move.
- **Merge:** D42 survives; D44 folds in as D42's admission threshold. (Defensible to keep D44 as the pure threshold rule.)

### Finding 7 — D35 Provenance vs D36 Traceability — MINOR
- Both typed link-chains over one graph; file pre-empts merge ("Traceability is not the same as provenance"). Genuinely distinct (origin-audit vs navigability) but thin. Keep both, flag overlap.

### Suspicion clusters Bourbaki REFUTES (genuinely distinct)
- Authority (D3/D23/D34/D41/D49): distinct object-types (right vs surface vs routing-model vs closure-invariant). D41/D49 close but D49 "extends" D41 → keep, MINOR. D23 misfiled under authority — really an orthogonality rule (belongs by D29).
- Residue (D18/D27): distinct — D27 is a numeric measure over D18.
- Craft (D12/D20): distinct — surface (workbench) vs method (procedure).
- Tower (D10/D11/D17): distinct objects despite overloaded "tower".
- D13 Authority Promotion Queue: distinct — the waiting line, self-separates from gates.

**Initial count estimate: 50 → ~42** (folds: D5→D37; D43,D46→D48; D22→D29; D14,D15→D11; D47→D38; D44→D42). Dominant defect: **genus-authored-after-species** — D37, D48, D29, D11 name their own children as instances yet every child was left standing as a peer entry.

---

## robot_talks confrontation round (final positions)

### A2 — Bourbaki — FINAL position
Governing concession: **a verdict-set difference IS an operational distinction** — where Russell's contradictions bite, a fold would silently rewrite semantics and must downgrade to escalation.

1. **D5 → D37: BLOCKED-BY-CONTRADICTION (conceded).** D5 {pass,flag,block} ⊊ D37 {…,defer}. Fold would enlarge D5's verdict set → semantic edit. Either D5 is a deliberate narrower-verdict species (HOLDS distinct) or an authoring slip (reconcile verdict set under owner sign-off, then fold). Cannot assert which from text → merge blocked pending adjudication.
2. **D43, D46 → D48: HOLDS.** No verdict/predicate conflict; D48 self-declares them instances. Clean fold.
3. **D22 → D29: HOLDS, sequenced.** Fold only AFTER the D16↔D29 admissible-bridge set is reconciled (else the fold inherits the instability).
4. **D14, D15 → D11: HOLDS.** internal/external is one axis value, no contradicting predicate. Clean fold.
5. **D47 → D38: HOLDS.** D47 discharges its own rule to D38. Clean fold; UX class list survives as example.
6. **D44 → D42: UNCHANGED (contestable).** No contradiction raised; threshold-vs-interface overlap.
7. **D35/D36: UNCHANGED.** Distinct; no contradiction pressure.
- **D16 + D29 keep-both: HOLDS but NEEDS-RECONCILIATION** — the sufficiency contradiction must resolve before either is cited as settled.
- **D20 double-typing:** not a collapse — a **coupling defect** handed to Russell's lane; D20 needs a typed relation recording one object with two authority-kind memberships, or the double-typing is an unresolved owner conflict.
- **Net:** 50 → ~43 (D5 stays until verdict set adjudicated). Confrontation sharpened, not overturned, the genus-after-species thesis.

### A1 — Russell — FINAL position
Governing test: a merge is legitimate only if it dissolves the contradiction without silently rewriting either term.

1. **D5 vs D13 (reject/defer gap) — SURVIVES.** Merge target D37 *also* lacks `rejection`; folding D5→D37 relocates the conflict to D37-vs-D13 rather than dissolving it. Real gap in gate verdict vocabulary.
2. **D5 vs D37 (missing defer) — DISSOLVED-BY-MERGE (reclassify as collapse).** Concede: if D5≡D37, D5 inherits `defer`. Caveat: the fold *broadens* D5 (genus-absorbs-instance), not proof D5 was already D37.
3. **D32 vs D50 (Craft-method genus over D20) — SURVIVES.** No merge possible; contradiction *proves* Method and Discipline are different kinds and D20's authority-kind is mis-assigned. Contradiction-as-non-identity.
4. **D16 vs D29 — SURVIVES.** Keeping both preserves both incompatible sentences; the D22→D29 merge *concentrates* the tension into D29 (becomes intra-entry). Merge worsens, not weakens, the finding.
- **Net:** three of four survive; #2 handed to the collapse lane as legitimate merge-evidence. Pattern: exactly one contradiction was a disguised collapse; the other three are defects any merge leaves standing or actively worsens.

---

## Convergence audit (for collapse detection)
The two lanes did **not** collapse to a single voice. They exchanged concessions in opposite directions on the SAME pair (D5/D37): Bourbaki gave up the merge; Russell gave up one of two contradiction sub-findings. Both independently arrived at the same operative rule — *verdict-set / admissibility-predicate differences are load-bearing* — from opposite starts (collapse-first vs contradiction-first). Residual genuine disagreement: none blocking; both flag D16↔D29 and D5-family and D20-typing as the load-bearing items.

---

## Verifier returns (G3) — appended after the zig-zag

The synthesizer's candidate set (C1–C4 contradictions, M1–M5 collapses) was attacked by three verifiers. **Result: all nine candidates REFUTED, unanimously.** Convergent reason: every candidate contradiction omitted an escape/subordination clause the file carries; every candidate collapse misread an explicit genus/instance relation as redundancy. Each verifier surfaced only local residuals (polish, not restructuring).

### G3/V1 — Gödel — literal lane

- **C1 REFUTED.** D37 Normative literally reads *"Unless a narrower gate defines otherwise, the minimum verdict vocabulary is `pass`, `flag`, `block`, and `defer`."* D5 is a narrower gate; the escape clause licenses its 3-verdict set. The D37 Domain-Context "pass/flag/block" phrase is downstream-instance description, not a competing definition. **Residual:** D5 narrows by *silent* omission — it should literally state that `defer` is intentionally unused (MINOR hygiene). D37 Domain-Context wording is loose against its own 4-verdict Normative (MINOR wording).
- **C4 REFUTED (keystone falls).** D29 does not license a lighter relator: its relators are described *"with named endpoints, direction or symmetry, evidence, and effect"* and D29 twice routes governing co-change *"through `CAV2-D16`."* Relators are carriers of D16's type, not bypasses. **Residual (real):** D29's Formal `R_ij` enumerates only 4 fields, while `CAV2-D16`'s binding minimum is 7 (adds `owner route`, `relation type`, splits effect). D29 under-quotes the invariant it routes to — an intra-D29 consistency gap (MINOR-to-MAJOR; the most substantive survivor).
- **M1 REFUTED.** D48 literally lists `instances = { CAV2-D43, CAV2-D46, Discipline Growth Rule }`. D43/D46 carry load-bearing per-domain stage lists, owner routes, and evidence classes the genus abstracts away. Merge deletes content. No residual.
- Other candidates: consistent with the literal readings above; no independent literal defect found.

### G3/V2 — Quine — vacuity / charity lane

- **C2 REFUTED.** D37 says *"the minimum verdict vocabulary"* — a floor, not a ceiling; absence of `rejection` from the stated minimum does not forbid it. D13 self-declares it is *"not a promotion gate result."* No charitable reading yields a contradiction. **Residual:** whether D13's `rejection` maps to gate `block` or is an unmapped queue-terminal state is unstated (MINOR clarity).
- **C3 REFUTED.** Under charity, `method` (D32, a structural shape) and `discipline` (D50, an authority-kind) are orthogonal classification axes; the file explicitly names D20 an instance of each. Membership in two orthogonal axes is the file's own licensed pattern (cf. `CAV2-D29`), not a contradiction. **Residual:** none beyond an optional one-line cross-note on D20.
- **C4 REFUTED (concurs with Gödel).** Reading D29's relators as bypasses of D16 is the uncharitable reading the text does not force; D29 routes through D16. Concurs on the 4-vs-7 field residual as the real remainder.
- **M3 REFUTED.** D47 carries a UX claim-class taxonomy (*hard gate / soft flag / screenshot review / human study / not automatable*) and browser-evidence limits that D38 cannot carry; D47 discharges to D38 for enforcement only. "Discharges-to" ≠ "is." No residual.
- **M4 REFUTED.** D29 explicitly *"specializes it for classification admission"* and names `CAV2-D22`; the two answer different questions (should a label exist vs does moving axis A move axis B). No residual.
- **M2 — redundancy pressure noted (still REFUTED).** D14/D15 overlap is thin, but they carry opposite authority postures; not vacuous. Style-call, not a defect.

### G3/V3 — Wittgenstein — scope / altitude lane

- **C1/C2 REFUTED.** The gate/queue verdict language sits at the right altitude: D37 is the primitive with a declared narrowing license; D5 is a scoped instance; D13 is a queue that self-separates from gate results. No cross-altitude contradiction. Concurs on the C1 silent-omission and C2 rejection-mapping residuals (both MINOR).
- **C3 REFUTED.** `method` and `discipline` occupy different scopes (structural vs authority-kind); collapsing them into a single-membership expectation is an altitude error in the *attack*, not the file. A cross-note would aid navigation only.
- **M2 REFUTED — PARTIAL.** D14 (*"outside … authority surface,"* candidate-only) vs D15 (*"inside … may hold authority when its role permits"*) is more than one bit — it is an authority-posture opposition. Thin enough that a co-editor could merge into D11 with an inside/outside posture field, but the merge would forfeit the posture statement. **Style-call residual.**
- **M5 REFUTED — closest call.** D44 is a threshold predicate on a concept (*does it earn a view*); D42 is an interface obligation on a tree (*what it must expose*). Complementary, at different altitudes. Weakest independent-existence case in the corpus but not redundant. **Style-call residual.**

### Convergence of the verifier round

All three lanes independently reached the same verdict on all nine candidates: **REFUTED.** No contradiction survived; no clean merge survived. Surviving yield is five local residuals (R1 D29 field-count gap = the substantive one; R2 D5 silent-omission; R3 D37 wording; R4 D13 rejection-mapping; R5 D20 cross-note) plus two style-call thin merges (D14/D15→D11, D44→D42) that are owner-preference simplifications, not defects. Per-artifact verdict: **KEEP**; `50 → N` resolves to ~50 (48 if the owner takes both style-call merges).
