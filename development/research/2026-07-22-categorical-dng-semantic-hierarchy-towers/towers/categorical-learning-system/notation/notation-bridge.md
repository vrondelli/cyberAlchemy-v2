# Notation Bridge

All entries are local audit notation, not promoted vocabulary.

| Mark | Mathematical obligation | Source usage | Audit reading |
| --- | --- | --- | --- |
| `C` | category: objects, hom-sets, identities, composition, laws | “category of thought” (p. 1) | intended category; incomplete |
| `A → B` | typed morphism in one category | wired output-to-input path (pp. 1, 11) | graph edge or executable connector until laws exist |
| `id_A` | arrow `A → A` satisfying both unit laws | pass-through/no-op instance (p. 1) | analogy: an instance is described where an arrow is required |
| `g ∘ f` | composition for `f:A→B`, `g:B→C` | chained instances (pp. 1, 11) | path concatenation is reconstructable; operational composition needs typed interfaces/effects |
| `F : A → B` | functor with object/arrow maps preserving identities/composition | frozen backbone mapping adapter space to semantic space (pp. 1, 5, 10–11) | architecture map, not a defined functor |
| `η : F ⇒ G` | natural transformation with components and naturality | swapping instance variants while preserving wiring (p. 1) | graph-rewrite analogy |
| `F ⊣ G` | adjunction between typed functors | LLM/JGS, Curiosity/Training, Encode/Decode (pp. 2–3) | claimed but undefined |
| `Hom_B(Fa,b) ≅ Hom_A(a,Gb)` | bijection natural in `a,b` | one LLM/JGS formula (p. 2) | syntactically suggestive but categories and terms are untyped |
| `η : Id_A ⇒ GF` | unit of an adjunction | ambiguity → JGS(LLM(ambiguity)) (p. 3) | component-shaped sketch; no naturality/triangle witness |
| `ε : FG ⇒ Id_B` | counit of an adjunction | LLM(JGS(input)) → resolution (p. 3) | component-shaped sketch; endpoint varies from `input` to `resolution` |
| `τ` | chosen scalar threshold | ANN/gate branching (pp. 5, 8–9) | model/config parameter; not semantic truth |
| `α…ζ` | curiosity-policy weights | value/cost terms and update (pp. 18–20) | proposed RL parameters; `ε` is reused for saturation and label cost |
| `π(strategy | gap)` | strategy policy conditional on gap state | policy-gradient sketch (p. 19) | incomplete objective/update interface |
| `CLV` | category latent vector | one-vector category encoding (pp. 17, 24–25) | proposed learned representation, not a categorical invariant |
| `DNG` | dynamic neural graph encoder/decoder | architecture/weight graph generation (pp. 14–17, 23–25, 32) | underdefined model family; “DNG-style” has no citation or training contract |
| `≅` | isomorphism or natural bijection, depending context | hom-set display and reassociation (pp. 2, 11) | no isomorphism maps/inverses given; do not read as proof |

## Safe translation

- “Object” → proposed specialist node.
- “Morphism” → proposed typed wiring edge or path.
- “Composition” → graph-path concatenation first; executable pipeline only after
  interface and effect laws are supplied.
- “Morphism gap” → observed coverage/uncertainty record, not absence of a
  categorical arrow.
- “Functor” → shared representation mapping until both categories and the arrow
  map are defined.
- “Adjunction” → bidirectional workflow intuition until the full adjunction
  obligations are witnessed.
- “Category grows” → graph/schema state is extended; categorical closure must be
  reconstructed and checked separately.
