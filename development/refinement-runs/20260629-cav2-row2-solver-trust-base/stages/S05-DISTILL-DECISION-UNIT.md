# S05 — Distill the coherent decision unit

**Stage:** Distill · **capability:** distill · **mode:** standard · **status:** pass

## Smallest coherent unit

> **Pick the engine that runs the Gödel-witness `governs`-acyclicity check (the Row-2 first step), and name
> its trust base — choosing among Lean-native / Cedar+Datalog / Alloy-Z3 — with a staged fallback if the
> first choice proves ergonomically costly.**

This is the minimum unit that:
- is decidable now (the fixture is concrete and tiny),
- discriminates all three engines (via the transitive-closure gate),
- recomposes into the larger Row-2 obligation (whole-constitution satisfiability) without re-deciding it,
- defers the A1–A6 axiom-encoding seam (a separate, thinner unit).

## Rejected alternatives (residue)

- *Decide the whole Row-2 program at once* — too broad; the witness check is the load-bearing first step and
  carries the engine signal.
- *Skip the engine choice and "just use Lean"* — that is the very assumption under test; would beg the question
  the findings §5d left open.
- *Pick by trust base alone* — ignores the expressiveness gate, which may eliminate an option outright.

## Handle to Design

Carry the three engines + the six criteria + the toy-game fixture into the dialectic/tournament (S06), with the
falsifier's capability matrix (S08) as the discriminating evidence.
