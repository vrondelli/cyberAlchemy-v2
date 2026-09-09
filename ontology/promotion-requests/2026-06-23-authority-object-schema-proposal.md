# Proposal: Authority-Object Schema (NODE-MODEL evolution)

Status: **candidate proposal** (non-executed define artifact; routes to ontology-route promotion)
Authored-by: `invoke` (define mode)
Target artifact: [`ontology/NODE-MODEL.md`](../NODE-MODEL.md) — owned by the **ontology route** (invoke authors; it does not amend the canonical schema)
Source: refine seed 2026-06-23 (gaps G1–G6) + [AUTHORITY-MODEL Authority Kinds](../../authority/AUTHORITY-MODEL.md#authority-kinds) + `CAV2-D49` closure
Purpose: make the authority-object schema **complete enough to stabilize** (the AUTHORITY-MODEL OQ-1 precondition for building the closure validator).

---

## 1. The structural fix: two layers (gap G2 — the validator keystone)

Today NODE-MODEL defines **concepts** (kinds) but has no way for a real **artifact** to declare which kind it is. Split the schema into two layers:

- **Concept layer (meta)** — defines the authority *kinds* as concepts. (= today's Node Concept Contract.)
- **Instance layer (NEW)** — a real artifact (e.g. `CAV2-D49`) declares `instantiates: <concept_id>`. That declaration **is** the machine-readable kind the validator reads.

Without the instance layer, the validator cannot answer "what kind is this artifact?" no matter how complete the concept set is.

## 2. Concept Contract (meta layer) — fields

Unchanged from NODE-MODEL: `concept_id`, `label`, `concept_role`, `source_refs`, `owner_route`, `candidate_status`, `challenge_contract`, `forbidden_collapse`.

**G6 clarification:** the link from a promoted concept to its governed artifact + promotion record is an **edge** (RELATION-MODEL: `promotes` / `governed_by` / `recorded_by`), **not** a contract field. State this explicitly so `governed_ref` is not mistaken for a concept field.

## 3. Instance-Node Contract (NEW — gap G2)

Every real authority artifact recorded as a node declares:

| Field | Required | Meaning |
| --- | --- | --- |
| `node_id` | yes | the artifact's id (e.g. `CAV2-D49`, `CAV2-C16`). |
| `instantiates` | yes | the `concept_id` it is an instance of (= its **authority kind**). **The kind-declaration keystone.** |
| `status` | yes | vault maturity (`candidate` / `active` / `superseded` …) — distinct from the concept's `candidate_status`. |
| `owner_route` | yes | the owner that promoted/governs it. |
| `governed_ref` | yes-if-promoted | path to the governed artifact (e.g. `DEFINITIONS.md#cav2-d49-...`). |
| `lifecycle_log` | yes-if-promoted | **append-only** list of authority-movement record refs (`CAV2-D26`) — every promote/demote/deprecate/supersede event, not just promotion (G9). |
| `provenance` | yes | source refs / candidate lineage. |
| `confidence` | yes | **node property** — this node's own confidence: `evidence_confidence` + `commitment_confidence`, each `high\|medium\|low`. NOT a challenge threshold. |
| `residue` | optional | **node property** — what this node leaves unresolved. |
| `challenge_contract` | yes | the challenge **protocol** (`CAV2-D40`): `valid_challenge_modes`, contradiction/validation edges, `resolution_gate`, blocking questions. It does **not** contain or re-point at `confidence`/`residue` — those are sibling node fields, read directly. |

**Placement rule (gap G8):** `confidence` and `residue` are **top-level node properties**, not fields inside `challenge_contract`. Nesting the node's own confidence inside the "how-to-challenge-me" contract conflates *the node's confidence* with *the bar to challenge it* — they are different. No pointer from `challenge_contract` is needed: `confidence` is a sibling node field, directly readable, and D40's "not a third confidence axis" is satisfied because `confidence` appears exactly once (at node level).

A kind not resolvable to an enumerated `concept_id` → **default-deny** (`CAV2-D49` closure).

## 4. Enums

- **`concept_role`** (authority / evidence / workflow / projection / residue object) — **complete**, no change (covers the 9 kinds + workflow).
- **`candidate_status`** (concept layer): **add `superseded`** (gap G3) → `candidate, reviewed-candidate, deferred, blocked, projected, superseded`. (`superseded` is the home for killed candidates / banked typed-negatives — which `blocked` does not cover.)
- **instance `status`** (vault maturity, separate axis): `candidate, active, superseded, deprecated`.
- **`valid_challenge_modes`**: **add `validation`** (gap G4) → `evidence, contradiction, owner_review, validation`. (`validation` = a challenge by failing a validator — aligns with the closure validator. Optional further: `supersession`.)
- **confidence axes (gap G7 — canonical fields, legacy dropped; owner decision 2026-06-23):** the canonical schema uses **`evidence_confidence`** and **`commitment_confidence`** as direct fields holding `high|medium|low` (no role→key indirection). The legacy imported Portuguese keys **`veracidade`/`convicção` are NOT carried forward** — existing frontmatter that uses them is **grandfathered** (legacy, not re-validated against this schema). **Supersession (must be recorded):** this reverses the `CAV2-D40` decision that preserved `veracidade`/`convicção`, so it requires a **decision-gate record** and a follow-up note on `CAV2-D40`/`CAV2-D23`. **Definitions-governance follow-up:** promote `evidence confidence` + `commitment confidence` as canonical `CAV2-D` definitions (Portuguese keys listed only as legacy aliases, not preserved-canonical).
- **authority-movement record (gap G9 — bidirectional lifecycle):** **generalize** `concept.promotion_record` → an **authority-movement record** with `event_kind: promote | demote | deprecate | supersede | retire | reject`, plus `from_status → to_status`, `owner_route`, `rationale`, `replaces`/`replaced_by`. Demotion/deprecation are recorded with the **same rigor as promotion** (demote/promote protocol). A node's lifecycle is the **append-only log** of these records (`CAV2-D26`), not a single promotion. Per `CAV2-D22`, this is **one** record type — **not** a parallel `demotion_record`.

## 5. Concept set additions

- **`concept.runtime_contract`** (gap G1) — Runtime Contract; role `authority object`; owner `task-session after owner gates`; forbidden_collapse *"not authority until owner-gated; not a successful generation or projection."* (Closes the gap `concept.spec` already points at: "Not a runtime contract until promoted.")
- **`concept.invariant`** (gap G5 — **DEFERRED, OQ-2**) — role `authority object`; owner `definitions-governance + constitution-governance`; forbidden_collapse *"not a single constitution rule; not a bare constraint."* Named as deferred so the schema is honest about the open kind.
- **`concept.axiom`** (gap G5 — **DEFERRED, OQ-2**) — role `authority object`; owner `constitution-governance`; forbidden_collapse *"not a definition; not a constitution rule."* Deferred.
- The existing 12 concepts are retained, with **one generalization (G9): `concept.promotion_record` → `concept.authority_movement_record`** — covers promote/demote/deprecate/supersede/retire/reject via `event_kind`, subsuming the old promotion-only record (honors `CAV2-D22`: not a separate `demotion_record`).
- **Closure note:** adding any new concept routes through `CAV2-D49` + decision-gate (the kind enumeration is closed).

## 6. Worked example (the requested example)

`CAV2-D49` expressed as an **instance node** in the proposed schema:

```yaml
node_id: CAV2-D49
instantiates: concept.definition        # authority_kind = Definition (enumerated -> validator PASS)
label: closed authority-kind enumeration
status: active                           # vault maturity: promoted 2026-06-23
owner_route: definitions-governance
governed_ref: authority/definitions/DEFINITIONS.md#cav2-d49-closed-authority-kind-enumeration
lifecycle_log:                           # append-only authority-movement records (CAV2-D26)
  - event_kind: promote                  # candidate CAV2-CAND-LIFECYCLE-002 -> CAV2-D49
    to_status: active
    owner_route: definitions-governance
    record: authority/definitions/DEFINITION-DRIFT-AUDIT.md   # promotion entry
  # a later deprecate/supersede of CAV2-D49 would append another record here, never overwrite
provenance:
  - source-clusters/authority-lifecycle.md (CAV2-CAND-LIFECYCLE-002)
  - review dispatch 2026-06-23-authority-lifecycle-artifacts-review (CR-1 re-scope)
confidence:                      # NODE property — this node's OWN confidence (CAV2-D23/D40); values high|medium|low
  evidence_confidence: high      # how well-evidenced THIS node is
  commitment_confidence: high    # how committed we are to it
  # legacy keys veracidade/convicção not carried forward (grandfathered) — see G7
residue:                         # NODE property — what this node leaves unresolved
  - deterministic closure validator pending (OQ-1)
challenge_contract:              # "how to disagree with me" (CAV2-D40) — challenge PROTOCOL only; confidence/residue live at node level above
  valid_challenge_modes: [evidence, contradiction, owner_review, validation]
  contradiction_edges: []        # nodes this would contradict
  resolution_gate: decision-gate
```

**Why this unblocks the validator:** it reads `instantiates: concept.definition` → kind `Definition` ∈ the enumerated table → **pass**. If some artifact declared `instantiates: concept.score` (not in the table) → **default-deny** by `CAV2-D49`. The OQ-2 case is now expressible: an `invariant`-kind artifact would declare `instantiates: concept.invariant`, which is **deferred** → flagged until OQ-2 promotes it or it maps to `concept.definition`.

## 7. Dispatch technique trace

- `sequence` — the 7 sections in order (concept → instance → enums → concepts → example).
- `frame_handoff` — refine seed (G1–G6) → this define artifact.
- `artifact_contract_bridge` — bridges the concept (meta) and instance contracts.
- `owner_boundary_check` — invoke authored; **ontology-route owns** the NODE-MODEL amendment; **decision-gate** owns the stabilize/closure call.
- `residue_ledger` — deferred `concept.invariant`/`concept.axiom` (OQ-2); G6 field-vs-edge resolved to edge.
- No full dispatch JSON (single-capability authoring, no subagents, no protected context).

## 8. Gaps / next route

- **Non-executed.** This proposal does not amend NODE-MODEL.
- **Open:** OQ-2 (`invariant`/`axiom` as live kinds) stays deferred; the instance `status` ↔ concept `candidate_status` two-axis split must be confirmed by the ontology route.
- **Next route:** **ontology-route** pass to amend NODE-MODEL from this proposal (with `CAV2-D25` schema-amendment-witness), then **decision-gate** to declare the schema stable → OQ-1 clears → build the closure validator.
