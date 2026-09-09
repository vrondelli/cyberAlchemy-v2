# Categorical Deep Learning — CAV2 Research Tower

Status: **local research; no authority promotion**

Source: Bruno Gavranović et al., *Position: Categorical Deep Learning is an
Algebraic Theory of All Architectures*, arXiv:2402.15332v2.

## Answer

The paper adds a strong external formal reference for a narrow bridge from
neural-architecture constraints to parametric implementations. It combines
inherited categorical machinery—monad algebras, (co)algebra homomorphisms,
free monads, geometric equivariance, and the established `Para`
construction—into a position-paper program with worked recursive and recurrent
examples.

It adds **research value** and a **compiled Lean feasibility seed**. It adds no
CyberAlchemy-v2 definition, ontology kind, schema, authority, or implementation
obligation. The paper's mathematical bridge is not the CAV2
evidence/owner/promotion bridge.

## Read order

1. [Source record](sources/source-record.md)
2. [Tower map](TOWER.md)
3. [Findings](findings.md)
4. [Notation bridge](notation/notation-bridge.md)
5. [Claim ledger](claims/claim-ledger.md)
6. [Smallest witnesses](examples/smallest-witnesses.md)
7. [CAV2 bridge decisions](bridge/bridge-decisions.md)
8. [Open residue](residue/open-residue.md)
9. [Learning pack](LEARNING-PACK.md)

Raw explorer returns are preserved separately in [research.md](research.md).

## Hard boundary

- “Architecture construction” means unrolling a selected functor and cell; it
  does not mean discovering an architecture from trained artifacts.
- The Lean witness formalizes reparameterisation and diagonal copying in
  `Type`; it does not formalize `Para(C)` as a 2-category or the paper's
  parameter-comonoid theorem.
- Every term defined in this tower is local and unpromoted.
- No change is made to the adjacent 2026-07-22 categorical-learning tower or
  the existing functor-stack tower.
