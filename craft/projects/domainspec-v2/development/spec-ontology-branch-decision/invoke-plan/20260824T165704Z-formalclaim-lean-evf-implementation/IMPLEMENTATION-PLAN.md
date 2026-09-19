# Implementation Plan — FormalClaim Lean/EVF

This is a navigation view. The executable planning authority is
`WORK-PACK.md`, `work-pack/SWU-MANIFEST.json`, the split task/wave files,
per-SWU validation contracts, and `EXECUTION-ENTRY.json`.

## Outcome

Implement the accepted @3 contracts as a distinct Lean theorem-provider lane
inside EVF while preserving the single-source FormalClaim boundary, the FOL
profile, the closed graph-law provider family, and the separation among theorem
evidence, runtime conformance, business correspondence, and lifecycle authority.

## Ordered delivery

1. L0 contract discrimination: source, Lean profile, translation/binding,
   category model, provider manifest, and theorem request/receipt.
2. L1 trust substrate: all planned adversarial witnesses and exact deterministic
   source/import/environment/type identity.
3. L2 runtime: Lean build/inspection provider, then the distinct EVF adapter.
4. L3 closure: runtime-conformance contract, candidate-only migration,
   integrated replay, and C12 pre-merge preparation.

The canonical one-shot frontier is sequential. A later execution owner may use
only the declared routes and must stop on the first failed acceptance-critical
validation. Optional parallelism is limited to different tasks in the same wave
after their dependencies pass; it does not change the canonical successor
chain or permit concurrent writes to a shared target.

## Success boundary

Implementation success means every SWU has a passing Task Session terminal
receipt and a joined Invoke Refresh closeout, the integration replay passes on
the exact candidate, and the pre-merge preparation unit produces a complete
freeze package. Merge remains blocked until Rondelli assigns the C12
verification level, Victor directly approves the exact frozen candidate, the
validator passes, and the merge owner independently confirms that the response
came directly from Victor.

## Non-goals

No new theorem proof, no proof-obligation discharge, no canonical ontology
promotion, no theorem-as-runtime claim, no change to GraphLaw receipt semantics,
no provider admission by planning, no publication, no release, no deployment,
and no merge.
