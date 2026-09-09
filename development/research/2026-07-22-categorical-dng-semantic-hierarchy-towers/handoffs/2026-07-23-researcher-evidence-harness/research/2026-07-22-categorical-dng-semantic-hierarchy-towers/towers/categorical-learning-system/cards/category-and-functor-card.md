# Definition Card — Category, Functor, Naturality

## Source claim

The proposal calls JGS instances objects, wired pathways morphisms, a no-op
instance an identity, chaining composition, the frozen backbone a functor, and
variant swapping a natural transformation (PDF p. 1). It later says shared
backbone guarantees associativity (PDF p. 11).

## Literal core available

Treat instances as vertices and declared typed wires as generating edges. The
free path category supplies:

- an identity: the empty path at each vertex;
- closure: every finite composable path is a morphism;
- associative composition: concatenation of paths.

This reconstruction is `local-inference`, not a source proof. It deliberately
does **not** use a no-op component as the identity.

## What remains missing

- endpoint interface types and compatibility;
- equality of paths or equations identifying two paths;
- semantics for state, nondeterminism, failures, latency and side effects;
- object/arrow maps for the backbone;
- identity/composition preservation;
- two functors and commuting squares for variant replacement.

## Failure mode

Suppose `A` outputs a 384-vector plus a confidence, `B` expects a document-kind
record, and `C` mutates persistent working memory. All share a 384-wide backbone,
yet `B∘A` may be undefined and the two bracketings of a stateful triple may have
different failure/commit behavior. Shared representation is neither typing nor
associativity.

## Verdict

- category: `local-inference` for wiring syntax;
- runtime category: `open-residue`;
- backbone functor: `analogy-only`;
- variant natural transformation: `analogy-only`.
