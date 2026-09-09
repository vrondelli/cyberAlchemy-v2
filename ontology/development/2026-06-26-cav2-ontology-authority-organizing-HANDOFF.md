# Handoff: CAV2 Ontology↔Authority Organizing (resume packet)

- **Observed capability:** invoke (handoff mode) — authoring only; does not own the target lifecycle
- **Target:** organizing the cav2 authority corpus by the **instantiation relation**, across the **ontology** (structure) and **authority** (meaning) levels
- **Source session:** 2026-06-26 — the apex/import-direction → upward-promotion → build-from-owned → ontology/authority thread
- **Split reason:** workflow continuation (resume the organizing work) + new lifecycle idea (build-from-owned gate, already handed off separately)
- **Full synthesis:** `.arcanum/inventory/entries/cav2-ontology-authority-organizing-synthesis.md` (read this first)
- **Sibling handoff:** `cyberAlchemy-v2/disciplines/development/2026-06-26-build-from-owned-validator-HANDOFF.md`

## Where we are (one paragraph)
We set out to define "upward promotion of generic authority" and discovered (via a sweep) that
it is **already mostly owned**: `CAV2-D23` (the hypothesis→axiom strength axis), `CAV2-D43` (the
cross-context promotion path), and `CAV2-D48` (the generalized lifecycle). The real gap is that
`D48` is **context-blind**. Rather than define more, the user redirected to **organize the corpus
first** — by the **instantiation relation** — because the relation has a *structural* facet
(ontology) and a *governance-meaning* facet (authority), and those live in different folders.

## The settled model (don't re-derive)
- **Ontology = structure/map** (`ontology/`: AUTHORITY-KINDS, NODE-MODEL, RELATION-MODEL,
  LIFECYCLE-MODEL, POSTURES). Classifies + routes; never makes canonical.
- **Authority = lifecycle/governance/territory** (`authority/`: definitions, constitutions,
  decisions, promotion-policy, AUTHORITY-MODEL). Where authority is promoted + counts.
- **Bridge:** AUTHORITY-KINDS `owner_route` + `authority_surface` columns point ontology kind → authority surface.
- **Three orthogonal axes per definition** (never merge): **kind** (`instantiates: concept.X`, G2) ·
  **meta/instance** (`specializes: <id>`, the gap) · **tower/subject** (DEFINITION-TOWERS).
- **Two orthogonal authority axes:** epistemic strength (D23) × context-scope (new on D48).

## The pilot (designed, NOT built) — D48 cluster
Produce **two coordinated, cross-linked candidate outputs**:
1. **Ontology output** — extend the instance-node contract (schema proposal `§3`, gap G2) with a
   **`specializes: <concept_id>` edge**; record the DAG:
   ```
   CAV2-D48 (meta) ← specializes ← {CAV2-D43 patterns, CAV2-D46 experience,
                                     Discipline Growth Rule, promotion-policy ladder}
   ```
2. **Authority output** — a rule in `authority/AUTHORITY-MODEL.md` for what `specializes` *means*:
   **reference/derive, NOT inherit** (each instance earns its own posture; prevents authority-
   laundering). This is the **import-up / reference-down** principle at the meta/instance edge.

Both **candidate**; both feed **OQ-1** (schema stabilization → unblocks the 3 SMT validators).

## IMMEDIATE next action (do this first)
**Read `cyberAlchemy-v2/ontology/RELATION-MODEL.md`** to check whether an `instantiates` /
`specializes` edge already exists. Build-from-owned applied to the edge itself: extend it if
present, author it only if absent. (Earlier grep checked TOWERS/SCHEMAS, **not** RELATION-MODEL.)

## Then
1. Lock **D8** — `specializes` = reference/derive vs inherit (recommend reference/derive; may need decision-gate).
2. Build the two pilot outputs (ontology edge shape + authority meaning rule), cross-linked, candidate.
3. Sweep the rest of the corpus into the instantiation DAG once the shape holds.
4. Define the **context-scope axis** + gate property (term: context-invariant), build-from D48 — definitions-governance.

## Owner routes (so the next thread does not trespass)
| Step | Owner |
|---|---|
| `specializes` edge shape | ontology route (RELATION-MODEL / NODE-MODEL / schema proposal) |
| `specializes` meaning (reference vs inherit) | authority (AUTHORITY-MODEL) + decision-gate |
| context-scope axis + gate property / context-invariant term | definitions-governance (build-from D48) |
| build-from-owned + non-collapse + closure validators | sigil-development / tools (OQ-1-gated, shared adapter) |
| instantiation map = OQ-1 evidence | ontology route, feeding decision-gate to declare schema stable |

## Residue carried
- "Context controls everything" = functor-over-context frame; rigorous but must not collapse the
  two axes (`D29`). Keep 2-axis unless disproven.
- Pre-session carry-overs still open: `ledger` promotion HELD (4/5 conditions); `tracking`
  validating-constitution rule pending; SMT validators OQ-1-gated.

## Dispatch technique trace
- `frame_handoff` — frames the organizing decision + settled model as the next thread's input.
- `owner_boundary_check` — routes each step to its owner; invoke owns none of these lifecycles.
- `residue_ledger` — carries R1–R5 + the functor/context residue forward.
- `handle_handoff` — names native owner-route handles (ontology route, AUTHORITY-MODEL, definitions-governance, decision-gate, sigil-development).
- `concrete_path_evidence` — cites RELATION-MODEL, schema proposal §3/G2, D23/D43/D48 by path/ID.
- Full dispatch JSON: not needed (single capability, no subagents, no protected context).

## Recommended next route
`ontology route` — start by reading `RELATION-MODEL.md` (the immediate action), then build the
two-level pilot. Definitions-governance follows for the context-scope axis + term.
