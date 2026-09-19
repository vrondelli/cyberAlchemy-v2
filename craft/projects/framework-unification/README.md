# framework-unification

Workspace for unifying three adjacent layers of the **CyberAlchemy agentic-system** (the
machine that turns user intent into finished code) into one coherent high-level view, and
then deciding how to join the pieces — assigning a **single owner** to each concept that is
currently defined in more than one place.

This is **engine work**, not an application: the three folders under `layers/` are facets of
the motor itself, not products built with it.

## Structure

```
framework-unification/
├── SCOPE.md         scope, division of labor (novelty=Lean / here=operationalization), conventions
├── research/        Phase 1 — RESEARCH.md (synthesis) + domainspec-findings.md. DONE.
├── discovery/       Phase 2 — discovery.md (one map: decisions, alternatives, open questions). DONE.
├── IMPROVEMENTS.md  prioritized, honestly-typed improvement map
├── review/          red-team of discovery/findings (attacks.md + findings.md)
└── layers/          the three layers being unified (moved here, history preserved)
    ├── domainspec-language/            representation — the contract/schema language
    ├── dispatch-composition-attack/    communication / observability — dispatch made visible
    └── cyber-alchemy-lean-fusion/      epistemology / gate — claim ≤ proof + typed residue
```

## The layers at a glance

| Layer | Owns | Status |
|---|---|---|
| **representation** (`domainspec-language`) | the language for contracts/schemas that validate pipeline artifacts | design |
| **communication** (`dispatch-composition-attack`) | making multi-agent dispatch an observable signal in the ledger | Phase 1 ready, Phase 2b blocked |
| **epistemology** (`cyber-alchemy-lean-fusion`) | the subset-rule gate (claim ≤ proof) + typed residue | operationalization; the typed-residue *type* is Lean-owned/deferred (see [SCOPE.md](SCOPE.md) §1), not a blocker here |

## Path (pipeline)

`research → discovery → paired-views (ontology-view / system-view / engineer-view) → unification plan`

- **research/** — complete. See [research/RESEARCH.md](research/RESEARCH.md) + [research/domainspec-findings.md](research/domainspec-findings.md).
- **discovery** — complete. See [discovery/discovery.md](discovery/discovery.md) (red-teamed: [review/findings.md](review/findings.md)).
- **paired-views** — **next**: assign a single owner to each duplicated concept ("dispatch
  composition" and the `obligation_id` bridge). Gated by **OQ-5** (init the `arcanum` submodule vs
  description-only — undecided).
- Scope, division of labor, and the open-questions convention: [SCOPE.md](SCOPE.md).

## Open decisions to resolve

1. **"Dispatch composition" has two homes** — analytical ontology (cyber-alchemy View 03) vs
   executable schema (dispatch-composition-attack); both wait on the same `v0.5.2` typed-DAG
   ratification.
2. **"Type of residue" / `obligation_id` bridge (B-1)** — the residue *type* is Lean-owned and
   deferred ([SCOPE.md](SCOPE.md) §1); what remains here is assigning a single owner to the
   `obligation_id` bridge. One decision, two faces.
3. **Observability producer gap** — the central ledger has a writer but no producer; building
   it unblocks the feedback loop.
