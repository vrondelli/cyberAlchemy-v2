# Explorer Simon — UNIFIER (near-decomposable authority-harness)

Angle: **ONE authority-harness with pluggable per-entity profiles + ONE reusable
ledger-spec + an ontology tie (concept = node, movement-envelope = promotion_record,
ledger = subgraph) is sound, owned, and buildable.** Held honestly: where the case
depends on something not yet proven, it is named as a gap with the fact that would zero it.

Discipline used throughout: **claim ≤ proof**. Each keystone claim carries a "zeroed by"
line — the single fact that would kill it.

---

## 0. The architecture in one sentence (Simon's near-decomposability)

A near-decomposable system has subsystems whose **internal** interactions are dense and
**cross-subsystem** interactions are sparse and pass through a thin shared interface. The
claim of this report is that authority governance in this repo is *already* near-decomposable
and merely un-factored: the three governance skills (definitions / disciplines / constitutions)
are the dense subsystems; the promotion record + the candidate→owner-gate→record lifecycle is
the thin shared interface; the ontology is the atemporal index over the records. A harness is
the act of naming the thin interface once and letting each subsystem plug into it — **not**
collapsing the subsystems into one. The opposing "three STANDALONE skills" view is correct that
the subsystems must stay separable; it is wrong only if it claims the *interface* must also be
triplicated. Near-decomposability says: separable modules, shared seam.

---

## 1. The shared seam is already there (build-from-owned, not net-new)

### 1a. All three governance skills are isomorphic at the section level

The three SKILLs are not three unrelated shapes. Read side by side they instantiate the
**same section spine** — this is the structural fact the harness factors out:

| Section role | definitions-governance | discipline-governance | constitution-governance |
| --- | --- | --- | --- |
| objective | `definitions-governance/SKILL.md:20-22` | `discipline-governance/SKILL.md:20-22` | `constitution-governance/SKILL.md:20-22` |
| logic-type (Arcana) | `:24-26` | `:24-26` | `:24-26` |
| modes / process | process `:71-106` | modes `:28-35` + process `:93-109` | modes `:28-36` + process `:80-120` |
| applicability / boundary | authority-boundary `:46-69` | applicability `:37-46`, chain-boundary `:70-80` | applicability `:38-48`, non-applicability `:50-57` |
| validation-model | (drift audit `:96-104`) | validation-model `:139-149` | validation-model `:141-150` |
| quality-bar | `:117-131` | `:151-162` | `:152-164` |
| anti-patterns | `:133-147` | `:164-174` | `:166-177` |
| output-contract | `:168-187` | `:190-208` | `:194-213` |

**Keystone claim 1:** the three skills share one interface and differ only in per-entity payload
(definitions own normative semantics; disciplines own recurring practice; constitutions own
structural form). *Zeroed by:* a section in one skill that has no counterpart role in the other
two **and** is load-bearing for authority movement. (I did not find one — the closest is
definitions' `concept-registry-aggregation` `:149-166`, which is a DomainSpec wedge extension,
not an authority-movement layer, so it does not zero the claim.)

### 1b. All three already share ONE promotion gate and ONE record

The promotion policy lists definitions-governance, discipline-governance, and
constitution-governance as **three gates feeding the same ladder and the same record type**
(`cyberAlchemy-v2/authority/promotion-policy.md` Required-Gates table; mirrored in the
refinement RESULT `…20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:18-24`
and the lifecycle-authority findings
`…/2026-06-21-ontology-knowledge-lifecycle-authority/findings.md:28`). The ladder
`source → import → inventory candidate → ontology candidate → definition|constitution|decision|spec
→ local authority → implemented` is **one ladder** with **per-kind terminal owners**
(`promotion-policy.md` Promotion-Ladder table; `…ontology-knowledge-lifecycle-authority/findings.md:28`).

**Keystone claim 2:** the candidate→owner-gate→promotion_record→projection spine is already a
single shared mechanism the three skills route into, not three parallel mechanisms. *Zeroed by:*
evidence that any one governance skill bypasses the promotion_record / owner-gate and adopts
authority by its own internal rule. (The definitions authority-rule `:108-115`, the discipline
Growth-Rule `:122`, and the constitution promotion mode `:35` all gate on owner + evidence +
validation surface — i.e. they converge on the same gate shape, so the claim holds.)

---

## 2. The proposed default interface (the harness contract)

The harness is **one envelope** + **one gate** + **one record** + **per-kind profile hooks**.
The envelope is *already authored* as `authority_artifact_lifecycle_envelope`
(`…20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58-87`) and the longer
`authority_movement_envelope` (`…ontology-knowledge-lifecycle-authority/findings.md:34-80`).
The harness adopts the placement-RESULT envelope as the default contract because it is the
tighter of the two and already names the per-kind owner field:

```yaml
# authority-harness default interface (build-from-owned: RESULT.md:58-87)
artifact_id:
artifact_kind:   definition | discipline | constitution        # the profile selector
authority_owner: definitions-governance | discipline-governance | constitution-governance
current_status:  source-evidence | import-candidate | review-candidate
               | blocked | active | drift-flagged | superseded | deprecated
sources: [ {source_id, source_path, source_authority_posture,
            origin_role, semantic_delta, public_private_posture, confidence} ]
promotion: { gate_route, promotion_record, verdict, decided_by, decided_at }
conflicts: [ {source_id, conflict_kind, resolution_status} ]
drift_owner:
ontology_refs: { candidates, projections }     # the ontology tie, section 4
# --- per-profile hook (the ONLY part that varies by kind) ---
profile_payload:   # definitions: 3 voices; disciplines: card+catalog row+route; constitutions: scope/selectors/rules
```

**The single varying part is `artifact_kind` + `profile_payload`.** Everything else — sources,
gate, record, status ladder, drift owner, ontology refs — is shared. This is the
near-decomposable seam made concrete.

### Per-profile instantiation (each skill plugs one payload into the shared envelope)

| Profile | `profile_payload` it supplies | Lifecycle states (per-kind) | Owner gate |
| --- | --- | --- | --- |
| **definition** | 3 colocated voices (scientific/plain/domain-context) + stable ID + index sync (`definitions-governance/SKILL.md:28-44`, `:84-95`) | source→import→review candidate→queue→active-local→drift-flagged→superseded (`RESULT.md:97`) | definitions-governance authority-rule `:108-115` |
| **discipline** | discipline card + catalog row + hardening route + steward (`discipline-governance/SKILL.md:82-91`, card model `:111-123`) | candidate→active-pattern→implemented→canonical→deprecated (`RESULT.md:99`; status ladder `discipline-governance/SKILL.md:114-120`) | discipline Growth-Rule `:122` |
| **constitution** | scope/owner/authority-level/selectors/rules/examples/validation-mode/promotion-boundary (`constitution-governance/SKILL.md:94-104`) | source→import→rule-candidate→candidate-local→active-local→split/derived→superseded (`RESULT.md:98`) | constitution promotion mode `:35` + validation-model `:141-150` |

**Keystone claim 3:** the per-kind lifecycle matrix is already authored — the harness does not
invent it, it tables it (`RESULT.md:93-99`). *Zeroed by:* a fourth authority kind whose owner
route is none of the three governance skills and that cannot share the envelope. (The envelope's
`artifact_kind` already includes `spec | decision | other` `RESULT.md:60`, so additional kinds
extend the same selector rather than break it — claim holds, with the honest note that
spec/decision owners are out of this harness's three-skill scope.)

---

## 3. The ledger-spec sketch (one reusable shape, three existing shapes as its dialects)

The dispatch context names three real ledger shapes that differ on **mutability / identity /
graph-ness**: craft (edit-in-place, graph, stable IDs), register-dispatch (append-only, 2-row
identity, flat), signals (append-only JSONL). The unifier claim is **not** "make them one file" —
it is "one ledger-spec with a small policy axis, of which these three are instances." Evidence
that the spec axis is real and small:

- **craft** declares its ledger as *machine-readable authority with derived human views*,
  *stable IDs preserved across regeneration*, an explicit *row-family + relation* graph, and an
  index contract (`craft/templates/ledger.schema.yml:5-8`, `:50-54`, `row_families` `:372-831`,
  `relations` family `:558-613`, `index_contract:65-93`). Mutability = edit-in-place; identity =
  stable per-row IDs; graph = yes (relations family).
- **register-dispatch** declares **append-only, exactly two appends per dispatch (dispatch row +
  close row), never edited in place** (`register-dispatch/SKILL.md:8-13`, `:190-194`), idempotent
  on `dispatch_id` / `close_of` (`:49`, `:207`). Mutability = append-only; identity = 2-row
  (open+close) keyed by dispatch_id; graph = flat with JSON `connections` column `:88-96`.
- **signals** (JSONL) is named as the append-only telemetry dialect; same append-only +
  idempotent-write family as the dispatch ledger
  (`…ontology-knowledge-lifecycle-authority/findings.md:102-103`, `:116`).

These three are the **same ledger-spec under three policy settings**:

```yaml
# reusable ledger-spec (the axis the three dialects vary on)
ledger_spec:
  row_identity:    stable-id | two-row(open+close) | event-append   # craft | register | signals
  mutability:      edit-in-place | append-only                      # craft | register+signals
  graph:           typed-rows+relations | flat+json-column | flat-event  # craft | register | signals
  index:           required (by_id, open_*, active_*, by_path)       # craft index_contract:65-93
  validation:      block/flag rules over rows                        # craft validation_rules:832-904
  derived_views:   human view + rebuildable index from rows          # craft :5-8, :43-46
```

The harness's **authority ledger** is the *craft dialect* of this spec (it needs the graph and
edit-in-place status transitions), while its **audit trail** is the *append-only dialect*
(promotion events never rewritten). This is exactly the "complementary systems" resolution the
grounding already reached (vault = record, ontology_events = append-only audit) — restated as
**two policy settings of one spec**, not two unrelated systems.

**Keystone claim 4:** the three ledger shapes share enough structure (rows with stable identity,
an index contract, validation rules, derived views) that one spec with a 3-value
mutability/identity/graph axis covers all three. *Zeroed by:* a field that is load-bearing in one
shape and **structurally inexpressible** in the spec's row model — e.g. if signals JSONL carried
a primitive that craft's row-family schema cannot host. (I did not verify the signals JSONL field
set directly — **this is the weakest cite in the report**; the claim rests on the dispatch
context's own characterization plus the append-only/idempotent family evidence at
`…ontology-knowledge-lifecycle-authority/findings.md:102-103`. A direct read of the signals
schema is the next required step before building.)

---

## 4. The ontology tie (concept = node, movement-envelope = promotion_record, ledger = subgraph)

This is the load-bearing unification and it is **the most owned** of the three claims.

### 4a. Each authority concept is an ontology node — already true

The vault gives every authority artifact a node with `node_type` (axiom / premise / constitution
/ discovery / spec / …) — `ontology-conventions.md:56`, role table `:79-96`. A definition,
constitution, or discipline is, in vault terms, a node. The promotion lifecycle premise→axiom is
the node's own lifecycle: `ontology-conventions.md:125` ("discovery → implementation-plan → spec";
axiom-gate strictness `…ontology-knowledge-lifecycle-authority/findings.md:90`). So
**concept = node** is build-from-owned: the vault already nodes-everything.

### 4b. The movement-envelope IS the node's promotion record — already canonical

`promotion_record` is CANONICAL (Ontology Vault, per dispatch grounding) and is realized by the
CAOL fixture with the exact field set the harness envelope needs: `id, claim, sourceInputs,
provenance, status(candidate), evidenceConfidence, commitmentConfidence, reviewOwner, gateResult,
useScope, contradictionPath, rollbackOrRetirement, routeImpact, bridgeValidation, expiresWhen`
(`arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md:18-34`).
Map that against the harness envelope (§2): `sourceInputs` = `sources`, `gateResult` = `promotion.verdict`,
`reviewOwner` = `promotion.decided_by`, `status` = `current_status`, `contradictionPath`/`rollbackOrRetirement`
= the drift/superseded states. **The promotion_record and the movement-envelope are the same object
viewed from the two axes** — the record is the temporal/event view; the envelope is the
artifact-state view. They are one canonical thing.

**Keystone claim 5:** the movement-envelope adds no field the canonical promotion_record lacks —
so the envelope is a *view of* the record, not a competing record. *Zeroed by:* an envelope field
with no promotion_record home. (Checking: `drift_owner` and `ontology_refs` `RESULT.md:83-86`
have no exact column in the fixture `:18-34`. **This partially dents the claim** — the envelope is
a near-superset, not an exact view. Honest verdict: the record is the canonical core; the harness
envelope adds two *projection-side* fields (drift_owner, ontology_refs) that belong on the
ontology-projection layer, not the record. So §4b holds for the *record core* and the two extra
fields are legitimately new projection metadata, which §4c absorbs.)

### 4c. The ledger is an ontology subgraph — the impedance is dissolved, not papered over

The dispatch's stated impedance is ledger(temporal/event) vs ontology(atemporal/graph). The
unifier resolution: the **ledger rows ARE the graph nodes+edges**. craft already proves a ledger
*is* a typed graph — its `row_families` are nodes and its `relations` family is typed edges with a
fixed `relation_type` enum `contains|blocks|enables|depends_on|informs|supersedes`
(`craft/templates/ledger.schema.yml:122-128`, relations family `:558-613`). The vault's edge
catalog is the *same idea* with a richer vocabulary — `derives-from, validates, codified-as,
governed-by, operationalized-by, supersedes, contradicts` (`ontology-conventions.md` Appendix C
`:568-584`; the authority-relations findings confirm these vault edges "can witness movement"
`…/2026-06-21-authority-movement-ontology-relations/findings.md:78`). Therefore:

> **authority ledger = the promotion-record rows (nodes) + their typed relations (edges) = a
> subgraph of the vault ontology, where each node carries its own promotion lifecycle.**

The temporal axis is preserved by the *append-only audit dialect* (§3) running alongside; the
atemporal axis is the current-state edit-in-place craft dialect. Same spec, two policies, one
graph — the impedance is a policy choice on one ledger-spec, not two irreconcilable systems.

**Keystone claim 6:** craft's row+relation model and the vault's node+edge model are the same
typed-graph structure under two vocabularies, so a ledger can be authored *as* an ontology
subgraph. *Zeroed by:* a vault edge whose semantics cannot be expressed as a craft relation row
AND that is required for authority movement. (craft's enum is narrower than the vault's 22-edge
catalog `ontology-conventions.md:556`, so a *direct* 1:1 reuse is false — the harness must adopt
the **vault edge vocabulary**, not craft's six. The structural shape (typed source→target rows)
transfers; the specific enum does not. Claim holds at the structural level, fails at the
literal-enum level — stated honestly.)

---

## 5. Where the opposing "three STANDALONE skills" view is right (held honestly)

The grounding's KEEP-with-fixes and the placement RESULT both **block** premature unification, and
those blocks are correct and survive this report:

- The three skills must keep **separate owner routes** — collapsing them would let public/private
  review be bypassed and let definitions/constitutions/disciplines "lose their different owner
  routes" (`RESULT.md:48-49`). The harness honors this: it shares the *seam*, never the *owner*.
- **Authority-by-proximity is killed** — co-locating things near a record does not promote them
  (`…/2026-06-21-authority-movement-ontology-relations/findings.md:77`,
  `:100`). A harness that auto-promotes because rows sit in one ledger would re-introduce exactly
  this failure. The harness must keep the owner-gate between candidate-row and promoted-row.
- The `authority_relation_record` / ARR must **not** become a vault edge by assertion
  (`…/2026-06-21-authority-movement-ontology-relations/findings.md:57-64`). The harness's "ledger
  = subgraph" tie therefore uses **existing** vault edges (§4c), never a coined ARR family.
- Ontology is **not the lifecycle authority** — it represents/projects/requests, the owner route
  decides (`…/2026-06-21-ontology-knowledge-lifecycle-authority/findings.md:9`,
  `RESULT.md:11-16`). The harness's ontology tie is a **projection/index** over records, with the
  owner-gate retained — it does not make the graph the decider.

These are not objections to the harness; they are its **invariants**. A near-decomposable harness
that violated them would be the bad "one big system." The unifier case is precisely that you can
have the shared seam *and* keep every one of these blocks.

---

## 6. Buildability — smallest sound first slice

Everything above is build-from-owned except two genuinely-new, small pieces. The first sound
slice:

1. **Adopt the placement-RESULT envelope as the harness contract** (no new authoring — it exists,
   `RESULT.md:58-87`).
2. **Declare the ledger-spec axis** (§3) as a craft-schema profile: two dialects (authority =
   edit-in-place graph; audit = append-only) — reuse `ledger.schema.yml` row+relation+index+validation
   machinery (`:372-904`).
3. **Map promotion_record ↔ envelope** as the harness's record core (§4b) — canonical fixture
   already supplies the fields (`promotion-record-fixture.md:18-34`).
4. **Profile hooks**: each governance skill supplies only its `profile_payload` (§2 table). No
   skill is rewritten; each gains one "emit harness envelope row" step at its promote mode.
5. **Ontology tie as projection** (§4c): author authority rows using the **vault edge vocabulary**
   (`ontology-conventions.md:568-584`), owner-gate retained.

Genuinely new (small): (a) the dialect-selector on the ledger-spec, and (b) the harness's
"emit-row-at-promote" hook in each skill. Both are thin; neither re-decides authority.

**Keystone claim 7:** the harness is mostly assembly of owned parts (envelope, promotion_record,
craft ledger machinery, vault edges, the three skills' existing promote modes), with only a
dialect-selector and an emit-hook as net-new. *Zeroed by:* a required harness capability that none
of the cited owned parts provides and that is not the dialect-selector/emit-hook. (The two honest
gaps from §3 and §4 — the unread signals JSONL schema, and the craft-enum vs vault-enum mismatch —
are the real risks; both are characterized, neither is fatal, both are first-build checks.)

---

## 7. Honest gaps (the facts that would zero the keystones, collected)

| # | Keystone | The one fact that zeroes it | Status |
| --- | --- | --- | --- |
| 1 | three skills = one interface | a load-bearing section in one with no role-peer in the others | not found |
| 2 | one shared gate/record | a skill that adopts authority bypassing owner-gate/record | not found (all gate on owner+evidence+validation) |
| 3 | per-kind lifecycle already tabled | a 4th kind whose owner ≠ the three and can't share the envelope | extends, doesn't break (`RESULT.md:60`) |
| 4 | one ledger-spec, 3 dialects | a signals-JSONL field inexpressible in the row model | **unverified — read signals schema before build** |
| 5 | envelope = view of canonical record | envelope field with no record home | partial dent: drift_owner + ontology_refs are projection-side extras (absorbed by §4c) |
| 6 | ledger = ontology subgraph | a required vault edge inexpressible as a craft relation row | structural yes, literal-enum no (adopt vault vocab) |
| 7 | mostly assembly of owned parts | a required capability no owned part supplies | the two gaps above are the only candidates |

---

## 8. Verdict

ONE authority-harness is **sound** (it preserves every grounding block as an invariant),
**owned** (envelope, promotion_record, craft ledger machinery, vault nodes/edges, and the three
skills' shared section spine + promote modes are all pre-existing), and **buildable** (first
slice = assembly + two thin net-new pieces). The near-decomposable framing is what makes the
unifier and standalone views compatible: **separable owner-routed subsystems sharing one thin
seam — the candidate→owner-gate→promotion_record→ontology-projection envelope, carried on one
ledger-spec.** The two real risks are the unread signals JSONL schema (claim 4) and the
craft-vs-vault edge-enum mismatch (claim 6); both are characterized and are first-build checks,
not refutations.
