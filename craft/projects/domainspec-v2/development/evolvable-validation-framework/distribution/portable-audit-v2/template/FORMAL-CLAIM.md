# What the included formal claims actually say

This package carries four checked claims about its small, supplied examples.
They show how to produce and inspect evidence with each adapter. They are
**not an audit of CRABS and not a proof that CRABS is correct**.

The machine-readable claims are in [FORMAL-CLAIM.json](FORMAL-CLAIM.json).
Their portable evidence projections are in `checked-examples/`. Those files
were exported only after real tool runs and EVF verification passed. Each
claim has two positive executions and two executions of a deliberately
incorrect case.

## The Lean theorem: a statement about every natural-number pair

The definition sorts two natural numbers into an ascending pair. The theorem
says that reversing the input order gives the same result:

```text
For every a and b in Nat:
  (min a b, max a b) = (min b a, max b a)
```

The actual proof is in [Pair.lean](formal-example/Pair.lean).
Lean 4.33.1 checked both the proof and the exact expected theorem type.
Its axiom audit reported `propext`, the standard propositional-extensionality
axiom. That dependency is allowed and recorded. There are no admitted proof
placeholders in this example.

This is a universal mathematical theorem, not a collection of example tests.
It depends on Lean's definitions, kernel, standard prelude, and the stated
axiom. It does not establish that a particular C implementation implements
this definition.

## The CBMC result: a statement about one C harness

The [C harness](formal-example/pair.c) supplies two nondeterministic unsigned
32-bit values, constructs ascending pairs in both input orders, and asserts
that the pairs agree. CBMC 6.11.0 reported success for the assertion and all
returned safety properties with the declared 32-bit model and unwind bound 4.
The harness is loop-free; unwinding assertions are enabled.

The deliberately wrong version keeps arrival order instead of sorting. CBMC
finds a counterexample for that assertion. This guards against an adapter that
reports success regardless of the property.

This result concerns exactly that harness and tool configuration. It is not a
proof about CRABS's merge logic, concurrency, deletion, or memory management.
There is no verified C-to-Lean refinement proof joining these two claims.

## Soufflé and Alloy: statements about one fixed graph

The [graph](formal-example/graph.json) has three nodes and the edges A → B and
B → C. The obligation is that A can reach C using one or more edges.

Soufflé 2.5 evaluates the generated Datalog rules and finds no violated
requirement. Alloy 6.2.0, using the recorded Java runtime and Sat4j solver,
finds no counterexample in its exact three-node model. Both reject the
negative graph, where the B → C edge is removed.

These claims cover this supplied graph. The Alloy result does not become an
unbounded theorem, and neither graph result establishes that an owner's
software accurately exports its state into that graph.

## How to check or reuse the package

Run `python3 check_examples.py` from the extracted directory to check the
shipped claims, input hashes, and native evidence projections. Its answer is
`snapshot-consistent`: it does not rerun tools or claim a current owner audit.

For fresh evidence, follow [README.md](README.md): initialize an audit, bind
the exact installed runtimes, run `formal-run`, then run `formal-verify`.
The owner's run produces its own full EVF receipts and FormalClaim bundle.
The shipped projections replace producer tool paths with symbolic names;
they are intentionally not presented as the original full receipts.

For an actual CRABS claim, the owner must supply the relevant CRABS bytes,
state the intended property, build an appropriate harness or model, and run
the checks locally. A Lean claim about CRABS also needs a justified connection
between the mathematical definitions and the real implementation.

Tool executable/JAR hashes and versions are recorded, but the full operating
system, dynamic libraries, and standard-library installation are not hashed
as a closed dependency set. These are trusted runtime assumptions. Package
hashes detect drift; they are not signed authentication or certification.

The reason to ship these claims is practical: the owner gets working adapters,
real positive and negative evidence, and an exact example of an honestly
bounded claim. The evidence stays useful only while those boundaries stay
visible.
