# Smallest Witnesses and Negative Controls

## W1 — Free wiring category

Take vertices:

- `D = DocKindHead`
- `C = ContradictionGuard`
- `W = WorkingMemory`

and generating arrows `f:D→C`, `g:C→W`, following the source chain (PDF
pp. 1, 27). The free category has `id_D,id_C,id_W,f,g,g∘f`. Composition is path
concatenation, so identity and associativity hold by construction.

**What it witnesses:** wiring syntax can be categorified.

**What it does not witness:** the actual payload types, runtime behavior, shared
backbone as functor, or semantic hierarchy.

## N1 — Shared-space negative control

Construct two components whose internal vectors are both 384-dimensional but
whose external records differ:

- producer emits `{kind, confidence}`;
- consumer requires `{claims[], provenance}`.

Reject the edge despite equal latent width. This falsifies “common semantic
space alone guarantees composition.”

## W2 — Associativity runtime fixture

For three total, pure, typed functions `A:X→Y`, `B:Y→Z`, `C:Z→Q`, compare
`(C∘B)∘A` and `C∘(B∘A)` on a finite exhaustive `X`. Then repeat with one
stateful/failing component and explicit transaction semantics.

**Pass condition:** identical outputs, state transitions and failure traces
under the declared equality. A pass is scoped to that process category.

## W3 — Naturality square

Define old/new pipeline semantics functors `F,G` on the finite wiring category.
For every generating arrow `f:A→B`, test:

`G(f) ∘ η_A = η_B ∘ F(f)`.

Node replacement that passes only direct examples but fails a downstream square
is the required negative control.

## W4 — Finite adjunction witness

For one claimed pair only, provide finite categories and total lookup tables for
`F`, `G`, every hom-set bijection and inverse. Exhaustively verify naturality and
both triangle identities. A paired API that reconstructs examples but fails one
triangle identity is the negative control.

## W5 — Proximity is not relation

Using a pinned encoder/metric/index, include:

- near-negative: two instances close in embedding space but not composable and
  not in the target semantic relation;
- far-positive: a genuinely typed relation whose endpoints are distant;
- direction reversal: near endpoints with the proposed predicate reversed;
- same-neighborhood/different-facet and same-facet/different-level examples.

This is the minimum falsification family before ANN output can feed typed
relation proposals. It preserves the existing bridge boundary.

## W6 — Order versus facet separation

Run two independent policies over stable IDs:

- `dependency-order/v0`: positive parent pairs, non-pairs, reversed edge, and an
  injected cycle;
- `semantic-facets/v0`: multi-label memberships and nonmemberships, including
  one facet spanning multiple operational levels.

Composition wiring may be evidence for the first only under an explicit policy.
It cannot populate either view by itself.

## W7 — Curiosity/training loop

Freeze a gap corpus with positive, negative, adversarial and privacy-sensitive
cases. Compare each strategy against `DEFER` and random acquisition using
label quality, downstream generalization, cost, privacy violations and
calibration. Include synthetic-label collapse and teacher-disagreement controls.

## W8 — Minting

Freeze a tiny two-specialist category and compare the live composition with the
minted checkpoint on:

- held-out in-distribution cases;
- composition-order counterexamples;
- state carry/reset cases;
- out-of-distribution and abstention cases;
- latency/size;
- provenance and rollback loss.

Report componentwise results and N/A values. Do not call finite agreement
categorical equivalence.
