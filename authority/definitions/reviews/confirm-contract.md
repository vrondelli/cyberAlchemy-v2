---
node_type: definition-proposal
is_canonical: false
status: candidate
represented_as: pre-canonical review artifact (not a promoted definition)
term: confirm contract
proposed_id: CAV2-D<TBD>   # owner-assigned on ratification — do NOT treat this file as canonical
symmetric_to: CAV2-D40 (Challenge Contract)
owner_route: definitions-governance
date: 2026-07-02
source_evidence:
  - projects/domainspec-v2/development/meta-type-definitions/ (CANDIDATES.md, DEFINE.md — DS-D1 meta-type vocabulary promotion)
  - DomainSpec v2 session 2026-07-02 (meta-type-definitions work)
builds_on:
  - CAV2-D5 (Promotion Gate — owner gate / authority gate) — the deciding gate
  - CAV2-D23 (Authority Lifecycle Axis — status + evidence_confidence + commitment_confidence split) — the status axis + confidence split
  - CAV2-D40 (Challenge Contract — validation_edges) — validation increases evidence support
  - candidate_status / instance status vocabulary (authority-object-schema-proposal 2026-06-23)
guardrails:
  - protocol-only (names the confirm path; owner routes and gates still decide movement)
  - NOT a third confidence axis (confidence stays evidence_confidence + commitment_confidence per CAV2-D23)
  - NOT a verdict, score, or proof of truth
---

# Proposal: Confirm Contract (symmetric to CAV2-D40 Challenge Contract)

Status: **candidate proposal** — pre-canonical review artifact. This is NOT a
promoted definition. A term becomes normative only after definitions-governance
promotes it into [../DEFINITIONS.md](../DEFINITIONS.md) and syncs the index. The
`CAV2-D<TBD>` number is a placeholder; the **owner assigns the real number** on
ratification.

Owner route: definitions-governance
Symmetric to: [`CAV2-D40` Challenge Contract](../DEFINITIONS.md#cav2-d40-challenge-contract)

---

## Proposed Definition Card (mirrors the CAV2-D40 structure)

Status: candidate (proposed)
Term: confirm contract
Aliases: confirm_contract, promotion contract, confirmation protocol

### Normative Definition

A confirm contract is the explicit promotion surface attached to a CyberAlchemy
v2 candidate node, claim, definition proposal, or authority artifact that states
what evidence and which owner gate promote the candidate from `candidate` to
`active` — without silently changing its meaning or confidence.

A confirm contract must declare the promotion condition, the owning promotion
gate, the required evidence posture, the validation links when present, the
status the candidate takes on confirmation, and the confirm residue route. It
does not contain the object's own confidence or residue and does not introduce a
third confidence axis. Object confidence remains a sibling posture using the
`evidence_confidence` and `commitment_confidence` split governed by `CAV2-D23`.

It is the exact symmetric counterpart of the challenge contract (`CAV2-D40`):
the challenge contract says *how to contest* an object; the confirm contract says
*what promotes* it. The two are the disagree/agree pair on the same candidate.

### Formal Interpretation

An admissible confirm contract has at least:

```text
ConfirmContract =
  (promotes_when, promotion_gate, required_evidence, validation_edges,
   status_on_confirm, confirm_residue_route)
```

where:

- `promotes_when` — the promotion condition/predicate (the trigger that makes
  promotion admissible), e.g. "criterion validator passes AND no open
  contradiction edge".
- `promotion_gate` — the owning gate that renders the decision. This is the
  existing `CAV2-D5` promotion gate (owner gate / authority gate); the confirm
  contract *names* it, it does not create a new gate.
- `required_evidence` — the evidence posture required to pass, expressed by
  reference to `CAV2-D23`'s `evidence_confidence` (and provenance). It is **not**
  a new confidence field — it points at the existing one.
- `validation_edges` — the `validates` edges that raise evidence support; the
  **same** edge set `CAV2-D40` already names, read here as promotion signal
  rather than challenge signal (shared, not duplicated).
- `status_on_confirm` — the status the candidate takes on a passing gate,
  drawn from the existing lifecycle/status vocabulary (typically `active`).
- `confirm_residue_route` — where unresolved confirmation residue (e.g. a gate
  `flag` per `CAV2-D5`, an unmet precondition) is handled. Symmetric to
  `CAV2-D40`'s `challenge_residue_route`.

The object's own confidence and residue are **not** part of the confirm
contract. When an object records confidence, active CyberAlchemy v2 uses
`evidence_confidence` for evidence support and `commitment_confidence` for
commitment posture (`CAV2-D23`).

### Operational Interpretation

Use a confirm contract when a candidate ontology node, definition proposal,
constitution proposal, research claim, or authority artifact needs to say what
it takes to be promoted and who signs off. A passing `promotion_gate` under the
stated `promotes_when` condition moves the candidate to `status_on_confirm`; a
gate `flag` carries named risk into `confirm_residue_route` rather than a silent
pass; a missing precondition defers promotion. It pairs with the challenge
contract on the same node: challenge = the review/contest path, confirm = the
promotion path.

### Plain-Language Intuition

It is the object's "how to agree with me correctly" field — what it takes to
promote me. (The challenge contract is the mirror: "how to disagree with me
correctly.")

### Domain-Context Voice

In CyberAlchemy v2, a confirm contract belongs on the candidate node shape
alongside its challenge contract, before candidate concepts become load-bearing.
It reuses the existing `CAV2-D5` promotion gate, the `candidate → active` status
axis (`CAV2-D23`), and the `validates` edges (`CAV2-D40`) rather than inventing
new machinery. Concretely, in the DomainSpec v2 meta-type-definitions work
(session 2026-07-02), the `DS-D1` meta-type candidates each carry a promotion
recommendation — e.g. the 14 backend meta-types (`DS-D1.1`..`DS-D1.14`) recommend
PROMOTE *because their `.schema.yml` formal criterion exists and validates*,
while the 11 UI meta-types (`DS-D1.15`..`DS-D1.25`) recommend DEFER *because their
criterion is pending (MT5)*. That "promote-when criterion-passes, defer-when-not"
condition is exactly a confirm contract: `promotes_when` = criterion validator
passes; `promotion_gate` = definitions-governance; `status_on_confirm` = active;
`confirm_residue_route` = the deferred/pending disposition. It is the
schema-level answer to: if this candidate is confirmed, what evidence and which
gate promoted it, and where does the confirmation residue go?

### Boundary

Confirm contract is not a verdict, not a confidence score, not proof of truth,
and not an ontology-owned override of the relevant owner route. It names the
promotion path; owner routes and the `CAV2-D5` gate still decide movement.

---

## Relationship to Owned Machinery (build-from-owned, not net authority)

The **content** of a confirm contract is already owned by existing cav2
machinery. This proposal does not invent that content — it only packages it into
a named, first-class, symmetric surface:

| Confirm-contract element | Already owned by | Net-new here? |
| --- | --- | --- |
| the deciding gate (`promotion_gate`) | `CAV2-D5` Promotion Gate (owner/authority gate) | no — referenced |
| `candidate → active` (`status_on_confirm`) | `CAV2-D23` status axis + `candidate_status`/instance-status vocab (authority-object-schema-proposal) | no — referenced |
| validation raises support (`validation_edges`) | `CAV2-D40` `validation_edges` / `validates` edge | no — shared, not duplicated |
| required evidence (`required_evidence`) | `CAV2-D23` `evidence_confidence` + provenance | no — pointer, not a new field |
| confirmation residue (`confirm_residue_route`) | `CAV2-D18` residue + `CAV2-D5` gate `flag` | no — routed, not redefined |
| **the named symmetric "confirm" primitive itself** | — nothing today names it as a first-class surface | **yes — this is the only net-new part** |

So the single thing being *added* is the **name and packaging** of a symmetric
promotion surface that sits next to `CAV2-D40` on the candidate node shape. Every
field it carries is a reference to, or a shared handle on, machinery that already
exists. It does not re-point or duplicate confidence or residue.

## Guardrails (mirrors CAV2-D40 exactly)

- **Protocol-only.** The confirm contract names the promotion path. It does not
  itself promote anything — the `CAV2-D5` owner gate does. It is the schema slot,
  not the decision.
- **NOT a third confidence axis.** Confidence stays the `evidence_confidence` /
  `commitment_confidence` split governed by `CAV2-D23`. `required_evidence`
  *references* `evidence_confidence`; it must not become a new confidence field,
  and the confirm contract must not contain the object's own confidence value.
- **NOT a verdict / score / proof.** A confirm contract is a protocol surface,
  not a truth claim, a promotion decision, or a quality score.
- **No duplication with `CAV2-D40`.** `validation_edges` are the same edges D40
  names; residue routing is symmetric to `challenge_residue_route`, not a second
  residue store. Confidence and residue appear exactly once, at node level.

## Provenance / Why Now

DomainSpec v2's meta-type-definitions work (session 2026-07-02,
`projects/domainspec-v2/development/meta-type-definitions/`) produces candidate
definitions (`DS-D1` meta-types, `domainspec-v2-D6+` method terms) that each want
**both** a challenge protocol (how to contest the candidate) **and** a confirm
protocol (what promotes the candidate from `candidate` → `active`). The
challenge half is already the canonical `CAV2-D40`. The confirm half is used
in practice (every CANDIDATES.md row carries a PROMOTE/DEFER recommendation
conditioned on whether its formal criterion validates) but has **no named
authority primitive**.

The parent flagged that naming this as a first-class primitive is **net-new
authority** — the individual pieces are owned, but christening the symmetric
"confirm" surface is an authority act. Per the definitions-governance route and
the public/private boundary (this is private cav2 work; nothing here leaks into
public `arcanum/`), it is routed to the cav2 authority spine as a proposal
rather than authored directly, and rather than mutating canonical
`DEFINITIONS.md`.

Claim ≤ proof: this is a **proposal awaiting owner ratification**. It asserts
only that (a) the challenge/confirm asymmetry is real and used, and (b) the
confirm side is assemblable entirely from owned machinery. It does not assert
that the primitive is promoted, numbered, or in force.

## Recommended Next Step (for the cav2 owner)

1. **Ratify or reject** the confirm-contract primitive via definitions-governance
   (and decision-gate if the symmetry with `CAV2-D40` needs a recorded call).
2. On ratify: **assign the real `CAV2-D<n>`** number, write the canonical card
   into [../DEFINITIONS.md](../DEFINITIONS.md) next to `CAV2-D40`, sync
   [../DEFINITIONS-INDEX.md](../DEFINITIONS-INDEX.md), and add the confirm
   contract slot to the candidate node shape in `ontology/NODE-MODEL.md`
   alongside `challenge_contract`.
3. Record the D40↔confirm symmetry note on `CAV2-D40` so the pair is
   discoverable from both sides.
