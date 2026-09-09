# Definition Card — Three Claimed Adjunctions

## Minimum obligations

For every claimed `F⊣G`, name categories `A,B`, functors `F:A→B`, `G:B→A`,
the natural hom-set bijection, and either its naturality proof or a unit/counit
with both triangle identities.

## Audit

| Claim | Source | What exists | Verdict |
| --- | --- | --- | --- |
| `LLM ⊣ JGS` | PDF pp. 2–3 | a suggestive hom display and escalation/compilation sketches | analogy-only |
| `Curiosity ⊣ Training` | PDF p. 2 | a data-acquisition/training feedback loop | analogy-only |
| `DNG-Encode ⊣ DNG-Decode` | PDF p. 2 | encode/decode names; later learned generation interfaces (pp. 14–17) | analogy-only |

The displayed `Hom(LLM(ambiguity), resolution) ≅
Hom(ambiguity, JGS(resolution))` resembles an adjunction schema, but
`ambiguity` and `resolution` are not typed as objects of named categories and
the `Hom` collections are undefined (PDF p. 2). The unit/counit sketches on
page 3 are component-shaped, not law witnesses.

## Negative controls

1. A pipeline `A→B→C` is not an adjunction.
2. An encoder and decoder trained together are not necessarily adjoint.
3. Approximate reconstruction `decode(encode(x))≈x` is not a triangle identity.
4. Bidirectional API calls do not yield a natural hom-set bijection.
5. “Slow model teaches fast model” is a compilation lifecycle, not a
   free/forgetful theorem.

## Smallest possible closure

Choose exactly one pair, define finite categories and complete functor tables,
enumerate both hom-sets for every object pair, give explicit forward/inverse
bijections, and mechanically check naturality and the triangle identities.
Until such a witness exists, use “feedback pair” or “encode/decode pair.”
