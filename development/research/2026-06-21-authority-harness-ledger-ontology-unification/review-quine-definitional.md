# Quine Review — DEFINITIONAL-SOUNDNESS gate (identity-collapse)

Reviewer: W.V.O. Quine. Single gate held: **DEFINITIONAL-SOUNDNESS** — "no entity without
identity." A refined construct that, after refinement, names nothing the canon does not already
name is TAUTOLOGICAL → terminal KILL, with the exact entity it collapses to. A construct that adds
genuine new identity survives.

Scope: I tested each of C1–C7 in `findings.md §5` against the named canon. I read the canon
verbatim — the lifecycle envelope (`…20260621T043600Z-authority-artifact-lifecycle-placement/
RESULT.md:54-99`), the promotion-record fixture (`…/first-slice/promotion-record-fixture.md:16-34`),
the authority-movement findings (`…2026-06-21-authority-movement-ontology-relations/findings.md`),
ontology-conventions (carve-outs `:289-320`, status `:60`, orthogonality `:330-345`),
ontology-architecture-draft (vault↔`ontology_events` split `:99-107,:138-141`), craft schema
(`ledger.schema.yml:1-12,:111-121`), register-dispatch (`SKILL.md:8-13,:188-203`), and the two
contradicting governance rules (`definitions-governance/SKILL.md:102-115` vs `constitution-
governance/SKILL.md:122-139`).

---

## Identity table

| Construct | Verdict | Distinguishing identity (DISTINCT) / exact re-skin (COLLAPSES) | Cite |
| --- | --- | --- | --- |
| **C1** stratified harness (rails shared, judgment per-profile callback) | **COLLAPSES → `authority_artifact_lifecycle_envelope`** (the rail half); the *typed-hole* framing is the only DISTINCT remainder | The "rails" the synthesizer names — `artifact_id`, `artifact_kind` selector, `authority_owner` route, the `current_status` ladder, `sources[]`, `conflicts[]`, `drift_owner`, `ontology_refs{candidates,projections}`, and the `promotion{gate_route, promotion_record, verdict, decided_by, decided_at}` block — are **already the envelope, field-for-field**. The rail names no field the envelope lacks. What the envelope does NOT already encode is the explicit declaration that `validate_and_promote` is a *callback the rail must never default* — the envelope leaves `verdict` blank but never states "the rail is judgment-blind by construction." That single contract sentence is the only new identity. The "harness" qua field-set is the envelope re-skinned. | rail fields `findings.md:108-122` vs envelope `RESULT.md:58-87`; per-kind owner routes already in `RESULT.md:95-99`,`:48-49` |
| **C2** contradiction dissolved by the cut line (rail holds neither single-voice nor conflict-preservation; each profile supplies its own judgment) | **DISTINCT** | This is not a field — it is a *proof of placement*: the claim that definitions' single-normative-voice rule and constitutions' conflict-preservation rule are policy-contradictory and therefore CANNOT co-occupy one defaulted `validate+promote` function. I verified both poles are real and opposed: definitions — interpretive voices "must not override, weaken, or silently expand the scientific/formal voice" (`definitions-governance/SKILL.md:108-115`); constitution — "preserve both rules… do not silently let the larger constitution override the narrower" (`constitution-governance/SKILL.md:122-139`). One forbids competing authority; the other mandates it. The canon **routes** each kind to its own owner but nowhere states the *reason* is an irreducible contradiction that forbids a shared default. The cut-line theorem names a constraint the canon enforces operationally but never identifies. New identity. | `definitions…:108-115`; `constitution…:122-139`; routing-only (no reason stated) `RESULT.md:11-24,:48-49`; `authority-movement…/findings.md:83-91` |
| **C3** ledger↔ontology = typed projection + forward-only bridge edges (NOT identity) | **COLLAPSES → the existing vault ↔ `ontology_events` split + InfoKeeper join-view** | The synthesizer's "authority ledger = append-only event-log; ontology = atemporal current-state; projection = a read model JOINING node-state to witnessed-movement edges" is **exactly** the canon's already-shipped architecture: atemporal `Vault` + append-only `ontology_events` SQL Data Ledger, with the audit/consumption view (`InfoKeeper`) computed by JOINING both stores (`Vault -.-> InfoKeeper`, `EventTable -.-> InfoKeeper`). The "two logs, never one" discipline is already authored as the Event Sourcing section. C3 renames `ontology_events`→"authority movement ledger" and `InfoKeeper`-join→"typed projection." Same two stores, same join, same forward-only event source. The witness-edge vocabulary it cites (`emits_when_gate_allows`, `witnesses_cross_branch_authority_movement`) is also pre-existing. No new entity — a re-skin of the vault/event-table split. | `ontology-architecture-draft.md:99-107` (join), `:138-141` (two logs); witness edges `authority-movement…/findings.md:54-55,:78` |
| **C4** ledger-spec = selector over two profiles (append-only authority ledger + edit-in-place vault node), not one schema | **DISTINCT** (narrowly — the *axis/selector*); but the "reusable ledger-spec" framing is misleading | The two profiles themselves are pure canon: craft = edit-in-place/typed-rows (`ledger.schema.yml`), register = append-only/two-row (`register-dispatch/SKILL.md:8-13,:188-203`); authority simply *reuses register's append-only dialect* — for the authority movement ledger this collapses to "use register-dispatch's append-only model as-is," no new ledger. What is genuinely new is the explicit `ledger_spec_axis` (`mutability` × `row_identity` × `graph`) that NAMES the two as points in one classification space. No in-repo schema does this — register hard-codes a non-craft schema; no contract spans both. The axis is a new naming entity (orthogonal-information test passes: it predicts neither profile from the other). Caveat: the third point (signals JSONL) is UNREAD, so the axis is a 2-point claim presented as 3; that does not collapse it, but the "reusable spec" word over-promises a contract that does not exist — only a *taxonomy* does. | axis `findings.md:138-145`; craft `ledger.schema.yml:1-12`; register `register-dispatch/SKILL.md:8-13`; signals unread (Simon keystone 4) `research.md:42-43` |
| **C5** bridge edges forward-only temporal (inherit the session carve-out) | **COLLAPSES → the session-node forward-only carve-out** | The construct asserts movement-event edges are forward-only-by-source like session edges, so they don't trip the bidirectionality auditor. I verified the carve-out is already exactly this: "Edges originating from a session node (`is_session: true`) are forward-only by source… the auditor skips bidirectionality checks for edges whose source has `is_session: true`," because "sessions are transient activity records… not stable graph nodes" (`ontology-conventions.md:314-318`). A promotion-movement event IS a temporal activity record — it is the *same logical type already carved out*. C5 adds no new edge-typing rule; it observes that movement events fall under the existing session/temporal carve-out. The identity is the carve-out, re-skinned for a movement event. Sound, but not new. | carve-out `ontology-conventions.md:314-320`; bidirectionality `:289-295`; "none equals promotion" `authority-movement…/findings.md:78` |
| **C6** promotion_record canonical; envelope adds only projection metadata (`drift_owner`, `ontology_refs`) | **COLLAPSES → `promotion_record` (core) + the already-authored `drift_owner`/`ontology_refs` envelope fields** | This is the strongest collapse. The "movement-envelope" = promotion_record core + `drift_owner` + `ontology_refs`. But the lifecycle envelope ALREADY carries `drift_owner` and `ontology_refs{candidates,projections}` (`RESULT.md:83-86`) AND already embeds the promotion_record (`promotion.promotion_record`, `:75`). So "movement-envelope" names nothing the lifecycle envelope does not already name — it IS the lifecycle envelope, which already = promotion_record + those two projection fields. The fixture confirms the record core is canonical and that `drift_owner`/`ontology_refs` have no fixture column (Simon's keystone-5 dent) — i.e. they live on the envelope, not the record. "Movement-envelope" is a third name for the authority_artifact_lifecycle_envelope. Terminal: it re-skins an entity authored in the same canon the synthesizer cites. | envelope already has the two fields `RESULT.md:83-86` and embeds the record `:73-78`; fixture core `promotion-record-fixture.md:16-34`; dent `research.md:46-48` |
| **C7** `current_status` (workflow record) vs `status` (maturity node) on different objects | **DISTINCT** | Two enums on two objects, each already canon individually — workflow `current_status` (8 values) lives on the envelope/record (`RESULT.md:62`), maturity `status` (5 rungs: draft/exploratory/active/consolidated/evergreen) lives on the node (`ontology-conventions.md:60`). What is new is the *separation verdict*: the explicit ruling that these are orthogonal axes that must NOT be merged onto one object, justified by the orthogonality principle (collapsing them is "the dual of the forbidden redundancy," `ontology-conventions.md:330-345`). The canon defines each enum but nowhere adjudicates their relationship or forbids the merge. Naming the orthogonality and the placement is new identity (mutual-information-zero test passes). | workflow `RESULT.md:62`; maturity `ontology-conventions.md:60`; orthogonality `:330-345` |

---

## Gate summary

- **DISTINCT (survive the identity gate):** C2, C4 (the axis only), C7. Each names a *constraint
  or taxonomy* the canon enforces operationally but never identifies as an entity — a contradiction
  proof (C2), a classification axis (C4), an orthogonality/placement ruling (C7).
- **COLLAPSES (terminal KILL):** C1 → `authority_artifact_lifecycle_envelope` (rail = envelope
  field-for-field); C3 → vault ↔ `ontology_events` split + InfoKeeper join; C5 → session-node
  forward-only carve-out; C6 → `authority_artifact_lifecycle_envelope` (= promotion_record +
  `drift_owner`/`ontology_refs`, already authored).

## The load-bearing finding

The four constructs the prompt asked me to scrutinize most all collapse, and they collapse to the
**same two pre-existing entities**:

1. **"authority-harness rails" (C1) and "movement-envelope" (C6) are both the
   `authority_artifact_lifecycle_envelope`** — not a near-miss, a field-for-field re-skin. The
   envelope already carries every rail field including `drift_owner` and `ontology_refs`, and
   already embeds `promotion_record`. The synthesizer treats the envelope as raw material for a new
   "harness," but the harness-as-fieldset *is* the envelope. Calling it a harness names no new
   entity.
2. **"typed projection + bridge edge" (C3) is the vault ↔ `ontology_events` split**, and **the
   forward-only bridge edge (C5) is the session carve-out** — both already shipped in the ontology
   canon the synthesizer cites for them.

What genuinely survives the gate is *not* a buildable harness object — it is three **rulings**:
the contradiction that forbids a shared validate+promote default (C2), the ledger-spec *axis* as a
taxonomy (C4), and the workflow/maturity orthogonality placement (C7). These add identity because
they name constraints the canon obeys but never states.

Definitional consequence: the design's net new entity is **the typed-hole contract** — "the rail
guarantees a promotion_record is produced but never sees the verdict; the per-kind owner profile is
the only producer of the judgment." Strip that one sentence and C1+C3+C5+C6 dissolve back into the
envelope and the ontology split, and the "cycle-closing harness" is the lifecycle envelope plus a
routing table that already exists in `RESULT.md:95-99`. The contract sentence (C2's structural
form) is the whole of the new identity; everything else is canon under new names.

Recommendation to the synthesizer: do not author a new "authority-harness" or "movement-envelope"
object. EXTEND the `authority_artifact_lifecycle_envelope` with the one thing it lacks — the
explicit `profile.validate_and_promote(payload)` typed-hole contract (C2) and the `ledger_spec_axis`
tag (C4) — and record C5/C7 as conventions-amendments, not new constructs. Building a parallel
harness would itself be the identity-collapse failure: a second name for an entity the repo already
owns.
