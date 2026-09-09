# SPEC-LITERALIST — The Enforced Account of CAV2 Authority

Angle: only what the `cyberAlchemy-v2/authority/` spec files **literally** codify
counts. Inventory narrative is unproven until found in spec text. I did not read
the `.arcanum/inventory/` syntheses. Claim ≤ proof.

---

## 1. The Authority Model As Written

**What "authority" is.** Per `AUTHORITY-MODEL.md` and the canonical term
`CAV2-D41` (`DEFINITIONS.md:2627`), an authority model is "the governed structure
that classifies candidate material by authority kind, reliance posture, owner
route, admissible movement, gate vocabulary, validation surface, and non-collapse
rule" so the project can "decide what may count for which purpose without letting
evidence, ontology, research, generated projections, implementation success, or
narrative repetition silently become authority."

**Who/what decides — the owner route.** The load-bearing rule
(`AUTHORITY-MODEL.md:25`, the "Authority Rule"): *"Authority moves by owner route,
not by proximity, usefulness, or repetition."* If a fragment "would change what
CyberAlchemy v2 is allowed to rely on, it must be routed to the narrowest
responsible owner before it governs work" (`:27-29`). The **Narrowest Owner Rule**
(`:90`) maps movements to owners: load-bearing term → definitions-governance; rule
constraining future artifacts → constitution-governance; recurring practice →
discipline-governance; contested promotion/scope/naming → decision-gate; bounded
mutation → task-session; source staging → authority import; candidate meaning →
ontology route.

**Core flow** (`:31`, explicitly "a review flow, not an automatic pipeline"):
`source evidence -> import candidate -> inventory/ontology candidate ->
owner-routed local authority -> implemented/validated behavior -> stable
repository asset`. A later state can be blocked, deferred, demoted, or re-routed.

**Authority Kinds table** (`:48`): nine enumerated kinds — Definition,
Constitution, Discipline, Decision, Spec, Runtime contract, Projection, Evidence,
Residue — each with owner route, where it counts, and "must not collapse into."
A tenth **catch-all row** makes any unenumerated kind **default-deny / blocked**
pending decision-gate + constitution-governance (cites `CAV2-D49`). Closure is
"review-mode today; the deterministic kind-enumeration scan is pending (OQ-1)"
(`:63-68`).

**Authority Postures** (`:74`): Original authority, Evidence, Template, Research,
Generated projection, Private evidence, Public framework, Unknown — each with an
allowed and a blocked use. Posture says how a thing "may be relied on before
promotion."

**Promotion-policy mechanics** (`promotion-policy.md`). Status: **"candidate local
policy"** (not active). A 7-state **Promotion Ladder** (`:8`): source evidence →
import candidate → inventory candidate → ontology candidate → local authority →
implemented behavior → stable repository asset, each row naming what it may
promote to. Six **Required Gates** (`:21`): definitions-governance,
discipline-governance, constitution-governance, authority import, decision-gate,
task-session. **Pass/Flag/Block** verdicts gate movement.

---

## 2. The Actual Definitions Present

`DEFINITIONS-INDEX.md` enumerates **CAV2-D1 … CAV2-D49** (contiguous; verified).
Key authority definitions:

- **CAV2-D41 Authority Model** (`:2627`, active) — quoted above.
- **CAV2-D48 Authority Promotion Lifecycle** (`:3182`, active). *"the single
  staged path by which any authority-bearing candidate may acquire authority —
  source evidence -> candidate -> owner-routed review -> promoted authority ->
  (optional) invariant/constitution pressure — with per-stage gates, an owner
  route, and a stopping/demotion rule."* It is "the generalization that
  promotion-policy's ladder instantiates" and that `D43` (patterns), `D46`
  (experience), and the Arcanum Discipline Growth Rule are instances of.
  **Promoted** 2026-06-23 from a source cluster "per review CR-2; build-from-owned
  generalization inference" — its Domain-Context Voice explicitly calls naming it
  **"build-from-owned … a generalization inference — owner-gated, not a mechanical
  lift."** Boundary: scoped to **authority-bearing kinds**, NOT "everything has a
  lifecycle"; evidence/residue/ledger events/projections are explicitly excluded.
- **CAV2-D49 Closed Authority-Kind Enumeration** (`:3245`, active). The invariant
  that the set of authority **kinds** is closed; an unenumerated kind
  "defaults to **blocked**." Enacted **in review mode** via the catch-all row;
  deterministic enforcement (`CAV2-C16`) "still pending (OQ-1)." Its provenance
  line: **"re-scoped per review CR-1 from 'no authority without a lifecycle',
  which re-skinned the Authority Rule."**
- Invariant definitions present as `Definition`-kind: **CAV2-D16** Typed Coupling
  Invariant (`:644`), **CAV2-D29** Axis Orthogonality Invariant (`:1792`),
  **CAV2-D38** Claim-Proof Bound (`:2428`), plus D49. `AUTHORITY-MODEL.md:70`
  states these "govern **as the `Definition` kind** — not blocked."
- **CAV2-D37 Gate** (`:2364`) backs the pass/flag/block/defer vocabulary.

**Non-Collapse rule.** Codified at `AUTHORITY-MODEL.md:122` as seven numbered
"Non-Collapse Rules." Rule 1: *"Evidence can support authority, but it is not
authority by itself."* **Rule 2: *"Ontology can model authority, but it cannot
decide authority."*** (Rules 3–7 cover inventory, discipline, constitution,
implementation runs, and public/private inheritance.)

---

## 3. The Boundaries / Gates Actually Enforced

**`boundaries.md`** enforces four boundary classes: Public/Private (private
DomainSpec material "must not be copied into public artifacts without owner
review"); Source/Read-model ("They do not promote themselves"); Generated/Canonical
(projections must trace canonical source); Research/Spec ("Specs own contracts
only after a promotion decision"). Plus the Free/Paid + engine-mechanism withhold
(by decision record) and the Saturn/DomainSpec public-disclosure carve-out.

**`promotion-policy.md`** enforces the ladder + the six required gates + pass/flag/
block — but is **candidate**, not active, and admits no deterministic validator.

**`STABLE-REPOSITORY-CONSTITUTION.md`** (status: **candidate**) is the rule
surface: C1–C15 + C17 (C16 is a retired/superseded number). Load-bearing for
authority: **C2** Authority Layer Separation, **C4** Inventory/Ontology
Non-Promotion, **C3** Research Before Specification, **C11** Import Before
Promotion, **C17** Precedent Sweep Before Net-New (build-from-owned;
"Derives from: CAV2-D48"). Validation modes are **review or hybrid** — most rules
have no deterministic adapter ("future … validator"); OQ-1 admits this.

**Enforcement posture, stated plainly:** every authority surface is review-mode.
`AUTHORITY-MODEL.md` closure is review-mode (OQ-1 pending), `promotion-policy.md`
is candidate, the constitution is candidate with review/hybrid adapters. **No
deterministic gate is live in spec text today.**

---

## 4. Adversarial Adjudication of Inventory Headlines

| Inventory headline | Verdict | Spec basis |
| --- | --- | --- |
| "CAV2 is a reflexive meta-authority mold" | **NOT-FOUND-IN-SPEC** | `grep` for `reflexive`/`meta-authority`/`mold`/`self-applies` across all of `authority/` returns **zero hits**. The spec calls the model a "governed structure" / "traffic map" (`D41`), never reflexive or a mold. Inventory-only framing. |
| "no authority without a lifecycle" (stated invariant) | **NOT-FOUND-IN-SPEC** — actively rejected | The literal phrase appears ONLY as a **demoted candidate**: `DEFINITIONS.md:3250` and `DEFINITION-DRIFT-AUDIT.md:145,155` record it was **"re-scoped per review CR-1"** because it **"re-skinned / collapsed into the Authority Rule."** It is *not* a codified invariant; the spec promoted the *narrower* `CAV2-D49` (closed kind enumeration) instead. As a stated invariant it is **disproven by spec text**. |
| "build-from-owned is already authority (CAV2-D48)" | **PARTIALLY SPEC-CODIFIED** | `CAV2-D48` exists and its Promoted line + Domain-Context Voice literally invoke build-from-owned: *"Naming it is **build-from-owned**… a generalization inference — owner-gated"* (`:3187,:3226`). C17 also "Derives from CAV2-D48." But "is **already** authority" overstates: `D48` is the *lifecycle definition*, and its own Boundary says *"Naming this lifecycle does **not** enact a binding rule; the binding form is CAV2-D49 + the proposed CAV2-C16"* (`:3235`). So: build-from-owned is codified as the **method by which D48 was promoted**, not as a standing "already-authority" claim. |
| "ontology models but cannot decide" (Non-Collapse rule 2) | **SPEC-CODIFIED** | `AUTHORITY-MODEL.md:124-125`, Non-Collapse Rule 2 **verbatim**: *"Ontology can model authority, but it cannot decide authority."* Reinforced by constitution **C4** and `D41` Domain-Context Voice ("ontology can model authority… but each promotion still needs the responsible owner route"). |
| "authority = decision by owner route" | **SPEC-CODIFIED** | `AUTHORITY-MODEL.md:25` Authority Rule **verbatim**: *"Authority moves by owner route, not by proximity, usefulness, or repetition."* `D41` formal interpretation: *"Movement is admissible only when the responsible owner_route records a gate verdict."* `README.md:28`: "Authority lives in the narrowest responsible surface." |

---

## Literalist bottom line

Two inventory headlines are codified verbatim (Non-Collapse rule 2; authority =
owner route). One is a method-citation that the inventory **overstates** into a
standing claim (build-from-owned / D48). Two are **inventory-only**: "reflexive
meta-authority mold" has zero spec support, and "no authority without a lifecycle"
is not merely absent — the spec **explicitly rejected and re-scoped it** (CR-1) as
a re-skin of the Authority Rule. The enforced reality is narrower and more
defensive than the narrative: a review-mode, candidate-status, owner-routed
classification model whose only *live* teeth are review gates; every deterministic
validator (`C16`/kind-scan, ladder enforcement) is pending. Claim ≤ proof.
