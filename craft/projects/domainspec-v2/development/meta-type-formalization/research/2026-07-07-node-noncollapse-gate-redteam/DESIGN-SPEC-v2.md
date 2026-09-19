<!--
  DESIGN-SPEC-v2 — corrected design for the DomainSpec v2 node non-collapse gate.
  This is a PROPOSED design, not authored law. It resolves the 8 change-requests + residue from
  findings.md (verdict: FIX). It touches NO live authority — it does not edit DEFINITIONS.md, the D6
  card, meta-types.yml, or the 14 schemas. It is a design document only; promotion is a separate,
  owner-gated act via definitions-governance.
  Claim discipline: every "exists on disk" fact is grounded in a cited file.
-->

# DESIGN-SPEC-v2 — Meta-Type Non-Collapse Admissibility, seated on D6 (proposed)

Status: **revised proposal** (supersedes [DESIGN-SPEC.md](DESIGN-SPEC.md); not authored, not promoted)
Resolves: the 8 spine-ordered change-requests + the residue in [findings.md](findings.md) (verdict FIX)
Seats on: **`domainspec-v2-D6`** (meta-type) — as its THIRD challenge. The v1 `domainspec-v2-D18`
amendment is **WITHDRAWN** (see §9).

---

## What changed from v1, and why — section → change-request map

| v1 defect (findings id) | severity | where it lived in v1 | fixed in v2 § |
|---|---|---|---|
| **b1** — gate amended onto the wrong card (D18 disclaims meta-type formation) | CRITICAL | §2 (D18 amendment) | **§1** (re-seat on D6 third challenge) + **§9** (withdraw D18) |
| **a1** — edge witness read raw `edge_participation` slices as authority; Saga "reuse `contains`" rescue passed | CRITICAL | §1 W2, collapse cond. 2 | **§2.2 W-edge** |
| **c1** — §1 verdict / §3 acceptance / §3A emit gave three opposite verdicts on Rule/Policy/Calculation | CRITICAL | §1 vs §3 vs §3A | **§2.3 + §5 + §7** (one consistent verdict: exception lane) |
| **c2** — classifier covered only 4 of 7 on-disk keywords; Enum undefined | CRITICAL | §1 rule classification | **§4** (total 7-keyword map) |
| **a2** — structural witness fired on keyword *presence*, not separation; shared `typedness` credited | CRITICAL | §1 W1 | **§2.1 W-struct** |
| **a3** — W3 was a self-applied "provably semantic" predicate | MAJOR | §1 W3 | **§2.3 + §7** (closed owner-enumerated allow-list) |
| **d1** — anti-tautology test perturbed only `scope` | MAJOR | §3C | **§6** (quantify over all 7 attestation values) |
| **a4** — a node could author its own clearing witness | MAJOR | §1 verdict | **§2.4** (owner gate per D17 proviso) |
| **residue** — semantic `formal_return_type` trio not shape-checkable; must not be laundered through a self-certifiable exception | design limit | §4/§5 | **§7 + §8** (declared-exception lane + honest residual limits) |

The two ordered fixes findings.md names as load-bearing: **b1 first** (move to the right card, §1),
then **a1** (make the edge witness independent, §2.2). c1 falls out of a1; everything else composes on top.

---

## 0. The asymmetry this closes (grounded, unchanged from v1)

- **Edges HAVE an admissibility gate.** `domainspec-v2-D3` (Edge-Law Admissibility, active): *"an edge
  TYPE is admissible IFF it composes into different code (adds a non-redundant distinction over
  {concept-type, relation-kind, composition-shape, feature-boundary})."* Source:
  [definitions/DEFINITIONS.md](../../../../definitions/DEFINITIONS.md) §domainspec-v2-D3.
- **Nodes DO NOT — yet.** D6's challenge contract tests only *coverage* ("fits no meta-type, or needs
  two"), never *collapse* (do two types reduce to one). This proposal adds that third challenge.
- **The live collision on disk.** Saga and Workflow have **identical** `edge_participation`
  (`source_of: [orchestrates]`, `target_of: []`) and both criteria are `attribute-equals` on the same
  key `scope`, differing only in value (`cross-feature` vs `intra-feature`). Sources:
  [saga.schema.yml](../../../../impl/spec/meta-types/behavioral/saga.schema.yml),
  [workflow.schema.yml](../../../../impl/spec/meta-types/behavioral/workflow.schema.yml). Per the review's
  own empirical sweep, this is the **only** slice-colliding pair on the 14-type registry.

---

## 1. The rule — seated on D6 as its THIRD challenge (closes b1)

**Where v1 went wrong (b1, THE SPINE).** v1 amended `domainspec-v2-D18`. But D18's promotion boundary
reads, verbatim:

> *"local DomainSpec v2 method vocabulary; **governs relationship promotion, not DS-D1 meta-type
> formation** and not full category-law authority."* — DEFINITIONS.md §D18

Amending the card that explicitly disclaims the subject is incoherent. **Node admissibility is D6's.**
D6's existing challenge contract reads, verbatim:

> *"Challenge contract (CAV2-D40, protocol-only): modes = contradiction / scope; edge = "a concept that
> fits no meta-type, or needs two" → challenges the 25-type closure; owner route = definitions-governance;
> gate = owner decision; blocking question = "does every concept map to exactly one of the 25?"; residue
> → `definitions/reviews/`."* — DEFINITIONS.md §D6

That single `edge` clause carries **two coverage challenges** already:

1. *"fits no meta-type"* — coverage-under (a concept the 25 do not cover).
2. *"needs two"* — coverage-over (a concept that needs two of the 25).

**The proposed third challenge (non-collapse), slotting into the SAME contract:**

> **edge (third clause):** *"two of the 25 meta-types that reduce to one — neither composes into
> different code from the other"* → challenges the 25-type **irredundancy** (distinct from closure).
> **blocking question (third):** *"does each of the 25 compose into different code, or do two collapse
> into one node?"*
> owner route = definitions-governance; gate = owner decision; residue → `definitions/reviews/` (all
> three unchanged — the third challenge reuses D6's existing route and gate).

This is a **card-shaped design proposal for D6's challenge contract**, authored here for review. It is
NOT written into the live card. If promoted, it is one added clause on D6, and **zero** change to D18.

**Criterion (mirror of D3's "composes into different code," lifted to nodes):**

> A meta-type earns its own slot IFF it composes into different code from every other meta-type —
> **witnessed by a *separating* structural criterion or a *separating, exercised, DS-D8-resolved* edge
> instance — never by a self-declared attestation value, a byte-identical structural clause, or a raw
> `edge_participation` slice.**

Provenance note (Obs-B, verified un-refuted in findings b2): this is *built-from-owned* on the same
CAV2-D22/D29/D16 non-collapse discipline D3 imports; it cites cav2, transfers no cav2 authority.

---

## 2. Admissibility witnesses (revised)

A meta-type A is admissible against every other meta-type B iff, for each B, it holds **≥1** of
W-struct / W-edge, OR the pair is owner-declared on the exception allow-list (W-except). Every witness
is **owner-admitted** (§2.4).

### 2.1 W-struct — structural *separating* witness (closes a2)

**v1 defect (a2).** v1 fired W1 on the *presence* of a structural keyword. Entity and Value Object both
carry a **byte-identical** clause `typedness: {rule: all-nonempty, column: Type}` (verified:
[entity.schema.yml](../../../../impl/spec/meta-types/structural/entity.schema.yml),
[value-object.schema.yml](../../../../impl/spec/meta-types/structural/value-object.schema.yml)). That
clause is vacuously true for any well-formed field table and **separates nothing**, yet v1 credited it.

**Revised rule.** A holds W-struct against B iff A's criterion contains a **structure-reading** clause
(one of the 5 keywords in §4) for which there exists a **separating table**: a concrete concept table
that A's clause **accepts** and B's clause **rejects** (or vice versa), decided purely by structure.
Presence of a structural keyword is necessary but **not sufficient** — the clause must *discriminate the
paired type*.

**Worked (Entity vs Value Object).** The shared `typedness` clause is byte-identical → **no**
separation, **not** a witness. Separation comes from the *identity* clauses:

- Entity: `identity: {rule: at-least-one, column: Identity, truthy: [yes,"true","✓"]}`
- Value Object: `no_identity: {rule: none, column: Identity, truthy: [yes,"true","✓"]}`

A table with one truthy `Identity` cell is **accepted by Entity, rejected by Value Object** → a genuine
separating table → W-struct holds. This is why the acceptance criterion "MUST NOT fire Entity ~ Value
Object" is satisfied **by the identity/no_identity pair, never by the shared `typedness` clause**.

### 2.2 W-edge — edge-participation *separating, exercised, DS-D8-resolved* witness (closes a1)

**v1 defect (a1).** v1's collapse condition 2 compared DS-D8 slices (`source_of ∪ target_of`) as **raw
sets**, and §3A never re-ran D3. Sattler's rescue: append any registered edge (e.g. `contains`) to
Saga's declared `source_of` → slices differ → v1's W2 "passes it." This directly violates DS-D8's own
misuse warning, verbatim:

> *"do not use schema `edge_participation` slices as independent authority; they are evidence checked
> against DS-D8."* — DEFINITIONS.md §DS-D8

**Revised rule.** A holds W-edge against B iff **all** hold:

1. **Separating, exercised instance.** There exists a concrete edge `x --verb--> y` **exercised in the
   active spec/registry** (an aspect file / instance / fixture — NOT the schema's own
   `edge_participation` declaration) whose **admissibility flips** between typing the endpoint as A vs B.
2. **DS-D8 resolution, never raw slices.** Each distinguishing `verb` resolves to an **active DS-D8
   signature** (per DEFINITIONS.md §DS-D8 `edge admissibility check`: verb is an active DS-D2 label AND
   `type(endpoint)` is in the signature's source/target set). Set-inequality of the schema slices is
   **not** evidence.
3. **Non-laundering.** The endpoint typing that produces the flip must **not itself be derived from the
   attestation discriminator under test** (else the "edge witness" is the same attestation wearing an
   edge costume — see §7/§8). If it is, the pair routes to the exception lane, not W-edge.
4. **Owner-admitted** (§2.4).

**Blocks the Saga rescue.** Append `contains` to Saga's `source_of`. Under the revised rule the gate
does **not** read that slice. It asks: is there an **exercised** `contains` edge from a Saga that
**resolves to an active DS-D8 signature**? `contains`'s active signature admits `source_of: Entity`
(Entity is the declared source; Value Object is `target_of: [contains]` —
[entity.schema.yml](../../../../impl/spec/meta-types/structural/entity.schema.yml),
[value-object.schema.yml](../../../../impl/spec/meta-types/structural/value-object.schema.yml)). **Saga
is not an admissible source of `contains`** → no such exercised edge resolves → **no separating
instance** → rescue fails. Saga~Workflow collapses, as intended.

### 2.3 W-except — declared exception (pointer; full spec in §7) (closes a3)

Not a self-applied predicate. A **closed, owner-enumerated allow-list**, currently exactly the three
`formal_return_type` sort members (Rule / Policy / Calculation), each backed by a resolved D15
challenge-contract row. Full specification and honesty framing in §7 and §8.

### 2.4 Owner gate on witness admission (closes a4)

**Basis.** D17's write-authority proviso, verbatim:

> *"write-authority proviso = no modeling surface may write directly to a node's promotion-status."* —
> DEFINITIONS.md §D17

A node that authors its own W-struct / W-edge / W-except artifact is a modeling surface participating in
its own promotion. findings.md tightened this to PLAUSIBLE (the write is *indirect* — the gate reads the
witness), so this is a **frame over the mechanism, not a standalone check**: witness **admission** routes
through the **definitions-governance owner gate** — the same gate D6's confirm contract already names
(*"gate = definitions-governance owner gate"*). Concretely: the validator (§5) may **read** an
owner-admitted witness, but a node's own `.schema.yml` slice is **evidence, never self-clearance**. The
node may not author the artifact that clears its own non-collapse challenge; the owner admits it.

---

## 3. The collapse test (revised)

A pair (A, B) **collapses** (B is redundant with A) iff **all three** hold:

1. **No structural separating witness (§2.1)** — no structure-reading clause where A accepts a table B
   rejects (or vice versa).
2. **No edge-participation separating witness (§2.2)** — no separating, exercised, DS-D8-resolved,
   non-laundered edge instance. Raw slice set-inequality does **not** count.
3. **Not on the owner-enumerated exception allow-list (§7).**

→ emit `collapse-candidate: A ~ B`.

**Verdict on failure.** A pair whose only distinguisher is an **attestation** clause
(`attribute-equals` / `attribute-present`), with no W-struct, no W-edge, and no W-except entry →
**inadmissible → merge** (become the other type + a declared flag). **Saga → Workflow + `scope` flag.**

**Saga ~ Workflow walk.** (1) Both criteria are `attribute-equals` on `scope` — **attestation, not
structure-reading** (§4) → no W-struct. (2) Identical slices; no exercised DS-D8-resolved edge flips
between them → no W-edge. (3) Not on the exception list → **collapse-candidate fires.** Correct.

---

## 4. Rule-keyword classification — TOTAL over all 7 on-disk keywords (closes c2)

**v1 defect (c2).** v1 classified only 4 keywords; `none`, `section-contains`, `table-has-column` were
unmapped. `table-has-column` is **Enum's ONLY criterion**
([enum.schema.yml](../../../../impl/spec/meta-types/structural/enum.schema.yml)) → the classifier was
**undefined on Enum** → over-rejection risk. This is the **total** map. Every keyword below is confirmed
present on disk by the cited schema.

| # | keyword | class | what it reads | on-disk sites (cited) |
|---|---|---|---|---|
| 1 | `at-least-one` | **structure-reading** | ≥1 truthy cell in a named column | Entity.identity — entity.schema.yml |
| 2 | `all-nonempty` | **structure-reading** | every cell in a named column non-empty | Entity.typedness, Value Object.typedness — entity/value-object.schema.yml |
| 3 | `none` | **structure-reading** | **no** truthy cell in a named column | Value Object.no_identity — value-object.schema.yml |
| 4 | `section-contains` | **structure-reading** | a named section/prose contains a literal pattern | Value Object.equality (`pattern: equal`) — value-object.schema.yml |
| 5 | `table-has-column` | **structure-reading** | a named column exists in the table | **Enum.value_table** — enum.schema.yml |
| 6 | `attribute-equals` | **attestation** | declared `Attribute\|Value` cell equals a value | Operation, Query, Calculation, Rule, Policy, Saga, Workflow, Event, State Machine |
| 7 | `attribute-present` | **attestation** | a declared key is present | Interface, Mapping |

**c2's explicit asks, discharged:**
- `none`, `section-contains`, `table-has-column` are each classified above → **structure-reading**.
- **Enum gets a defined witness class.** Its sole criterion `table-has-column` is structure-reading, so
  Enum is never "classifier-undefined." And it is a **separating** (non-vacuous) witness: a table with
  only `Value | Description` columns is **accepted by Enum, rejected by Entity/Value Object** (which
  require a `Type` column with `all-nonempty` and an `Identity` column). So Enum holds W-struct against
  the structural types → never over-rejected.

**Two-layer distinction (this is the a2 + c2 hinge).** *Classification* (structure-reading vs
attestation) is **total** — every keyword is mapped. *Witnessing* is **stricter** — a structure-reading
keyword can be **vacuous** (`all-nonempty` on `Type` is true for any well-formed table;
`table-has-column` is true whenever the required column exists). A vacuous clause is *structure-reading*
(class) but **not a separating witness** (admission). Keep these two layers apart: §4 is total; §2.1
demands separation on top of it.

---

## 5. Validator & acceptance criteria — made mutually consistent (closes c1)

**v1 defect (c1) — the internal contradiction.** The real slices differ:
Rule `{source: enforces, target: mirrors}` / Policy `{source: applies}` /
Calculation `{source: calculates, queries; target: applies}` (verified: rule/policy/calculation
schemas). In v1, differing slices **auto-cleared** the trio via W2 (raw set-inequality) → W3 never
demanded. But §3 acceptance said *"MUST demand W3 for Rule/Policy/Calculation"* and §3A emitted
`attestation-only-node`. **Three spec halves, opposite verdicts, same 3/14 types.** No validator could
satisfy all three.

**How a1 closes it.** Once W-edge (§2.2) requires a *separating, exercised, DS-D8-resolved,
non-laundered* instance, the raw-slice clearance of the trio **closes**. The only separators the trio
offers are the edges `enforces` / `applies` / `calculates`, whose **endpoint typing is assigned FROM the
`formal_return_type` attestation under test** — so they fail §2.2 clause 3 (non-laundering). The trio
therefore does **not** auto-clear, and is routed to the **declared-exception lane** (§7). Now all three
spec halves say the **same** thing:

- **§1 verdict:** the trio holds **no independent** W-struct and **no non-laundered** W-edge; it is
  admissible **only** via the owner-enumerated exception lane.
- **§5 acceptance criterion:** the validator **MUST route** Rule / Policy / Calculation to the
  declared-exception lane — **not** auto-clear, **not** `collapse-candidate`.
- **§5 emit:** for each trio member, emit `exception-lane: <type> (formal_return_type discriminator;
  shape-unresolvable per D15)` — an attestation-strength emit, not a silent clear.

One verdict, three consistent surfaces.

**Validator (`tools/validate-meta-types-noncollapse.ts`, proposed — sibling of
`validate-relationships.ts`).** For all 14 schemas: (a) classify every `rule` via the **total** §4 map;
(b) for each unordered pair compute `hasWStruct` (§2.1 separating table), `hasWEdge` (§2.2 exercised
DS-D8-resolved non-laundered instance), `onExceptionList` (§7); (c) emit `collapse-candidate: A ~ B`
iff none; (d) emit `exception-lane: T` for each allow-list member; (e) emit `attestation-only-node: T`
for any type whose sole distinguisher is attestation, that holds no witness, and is **not** on the
allow-list (today: none survive except the Saga~Workflow merge, which surfaces as the collapse-candidate).
All witness reads are **owner-admitted** (§2.4).

**Acceptance criteria (against today's 14-type registry):**
- **MUST** emit `collapse-candidate: Saga ~ Workflow` (§3 walk). A gate silent here is broken.
- **MUST NOT** emit `Entity ~ Value Object` — they hold W-struct via the **identity/no_identity**
  separating clause (§2.1), **never** via the shared byte-identical `typedness` clause.
- **MUST** route `Rule` / `Policy` / `Calculation` to the **declared-exception lane** (owner-enumerated,
  §7) — consistent with §1 verdict and the emit above.
- **Enum** classifier is defined (`table-has-column` = structure-reading, §4) and Enum holds W-struct
  vs the structural types → never over-rejected.

**Fixtures (type-pair level, mirroring the existing pos/neg convention):**
- `noncollapse-pass/` — Entity/ValueObject (identity clause), Entity/Enum, StateMachine/Enum: admissible.
- `noncollapse-fail/` — Saga/Workflow (live) + a synthetic byte-identical "Widget/Gadget" pair.
- `noncollapse-exception/` — Rule/Policy/Calculation appear ONLY as exception-lane entries; **remove the
  owner allow-list entry and they must flip to `collapse-candidate`** (proving the lane, not the tag,
  clears them).

---

## 6. Anti-tautology property — quantify over ALL attestation values (closes d1)

**v1 defect (d1).** v1's meta-test perturbed **one** variable (`scope`) and checked Saga~Workflow still
fires. The a1 (declared-slice) and a2 (vacuous-structural) channels are orthogonal to `scope` and were
left untouched → passing proved only "`scope` is ignored," not "the gate reads structure."

**Revised property (total over the 7 declared attestation values).** Let the attestation universe be the
**7 declared keys** on disk: `state_change`, `formal_return_type`, `scope`, `temporal`,
`has_transitions` (all `attribute-equals`), `interface_kind`, `direction` (`attribute-present`).

> **Anti-tautology invariance.** For every pair (A, B) and every re-assignment / stripping / permutation
> of **all 7** attestation keys on the witnessing concept(s): any admissibility verdict the gate
> **credits to W-struct or W-edge MUST be invariant.** Only verdicts that legitimately rest on
> attestation — `collapse-candidate` and `exception-lane` — may move. If a *claimed structural/edge*
> admissibility flips under **any** attestation permutation, that witness is **laundered attestation**
> and is rejected.

This subsumes the single-`scope` flip and adds the six other keys, closing the a1 and a2 channels the v1
test missed. Note the correct-detection direction: for Saga~Workflow and the trio, whose **only**
distinguisher is attestation, the collapse/exception verdict *should* move under attestation permutation
— that is the gate working, not a tautology, because those verdicts are **not** credited to W-struct/W-edge.

---

## 7. The declared-exception lane (closes a3; carries the residue's "owner-owned, stated limit")

**v1 defect (a3).** v1's W3 was a self-applied predicate — "provably semantic and non-constructible
under D15." That is not machine-decidable: D15 forbids the very parse that would verify it, so the
validator can only confirm a **reason string exists**. Gameable by any node.

**Revised lane — a CLOSED, OWNER-ENUMERATED allow-list.**

- **Membership is owner-authored, not self-claimed.** The list is authored/amended only through the
  definitions-governance owner gate (§2.4). A node cannot add itself.
- **Current membership: exactly the `formal_return_type` sort — {Rule, Policy, Calculation}.** These
  three, and only these three, share a discriminator (`formal_return_type`) whose *values* differ
  (`boolean` / `strategy` / `value`) but whose *separation requires reading the meaning* of the Formal
  cell — which D15 forbids the validator to parse. Sources: rule/policy/calculation schemas.
- **Each entry is backed by a resolved D15 challenge-contract row**, not free prose. D15's challenge
  contract, verbatim: *edge = "a discriminator decidable only by parsing the body, not declarable" …
  blocking question = "can the discriminator be a declared value, or does it need a semantic parse?"*
  (DEFINITIONS.md §D15). Each allow-list entry cites the resolved row: discriminator =
  `formal_return_type`; blocking-question answer = **"needs a semantic parse"**; owner-decided; residue
  → `definitions/reviews/`.
- **Stated as a known limit, never laundered.** The entry does **not** assert the trio is separable-if-
  only-we-looked. It asserts the opposite: this class is **non-collapse-checkable at the shape layer**,
  admitted by owner declaration as an explicit exception (§8), not by any self-certifiable predicate.

Removing an entry from the allow-list makes that type route to `collapse-candidate` (the
`noncollapse-exception/` fixture, §5) — the lane, not a tag, is what clears them.

---

## 8. Residual limits (the residue — stated honestly)

- **The `formal_return_type` trio is non-collapse-checkable at the shape layer.** Telling Rule
  (`boolean`) from Policy (`strategy`) from Calculation (`value`) requires reading the **meaning** of the
  Formal cell — the engine moat that D15 forbids the validator to cross (*"do not infer the
  discriminator by parsing the Formal cell — that crosses into the engine moat"* — DEFINITIONS.md §D15).
- **Their edge differences do NOT rescue this.** `enforces` (Rule) vs `applies` (Policy) vs `calculates`
  (Calculation) *look* like an independent structural separator, but each edge's **endpoint typing is
  assigned by the author from the same `formal_return_type` attestation under test.** Crediting them as
  an independent W-edge would **launder attestation as structure** — the exact a1 defect, generalized.
  §2.2 clause 3 forbids it, and §6's invariance test would catch it (the "separation" flips when
  `formal_return_type` is permuted).
- **Consequence, stated not hidden.** This class is an **owner-owned, declared exception** (§7), STATED
  as a permanent shape-layer limit — **not** laundered through a self-certifiable predicate. The gate
  does **not** claim to mechanically discriminate the trio. A correct fix must not silently reintroduce
  the moat-crossing it claims to avoid; this design does not.
- **Dependency on D3/DS-D8 soundness.** W-edge is trustworthy only if each distinguishing verb resolves
  to an **active** DS-D8 signature (§2.2 clause 2). The node gate inherits the edge gate's soundness.
- **The 11 attestation-discriminated types stay attestation-strength.** The gate does not convert
  attestation into structure; it makes the limit **explicit and bounded** (via the total §4 map and the
  closed §7 lane), and it correctly forces the one live collapse (Saga~Workflow) to the surface.
- **Deferred open question.** Whether an owner-admitted *exercised* edge could someday separate the trio
  without moat-crossing is left open; it would require the engine and a separate owner route, not this
  shape-layer gate.

---

## 9. The withdrawn D18 amendment (closes b1, negative half)

v1 §2 proposed amending `domainspec-v2-D18` to bring node formation under the gate. **This amendment is
withdrawn in full.** D18 governs *relationship* promotion and explicitly disclaims *"DS-D1 meta-type
formation"* (DEFINITIONS.md §D18, quoted in §1). Node non-collapse belongs to **D6** as its third
challenge (§1). **Zero** change to D18; **zero** change to any of D18's six non-collapse property cards
(D20–D25), which remain the relationship-side vocabulary. The only proposed card change is the one added
challenge clause on D6 — and even that is a **design proposal here**, not a write to the live card.
