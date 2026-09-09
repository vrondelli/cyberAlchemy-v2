---
to: Vlad
from: Victor
re: cyberAlchemy-v2 — how to TYPE a structure-side residue, and how to do it AUTOMATICALLY during code generation
date: 2026-06-22
status: draft for discussion
note: replaces an earlier structure-side draft (deleted) that overclaimed "type defined"; this version is reviewed for overclaim, actionability, and data-model consistency.
---

# To Vlad — typing residue, and automating it during generation

Practical memo, no theory. (1) the procedure, (2) the one structural thing the framework must add
to make it mechanical and WHERE it legally lives, (3) the payoff: in a deterministic **code
generator** that thing is nearly free, so residue can be typed automatically, inline, as code is
generated.

The one piece actually built so far (Lean side, build-from-owned, no novelty) is a 3-zone
classifier for the **structure register only** — a model of the math, *not* a proof that any
running generator obeys it. Everything about generation below is a **design proposal**, reasoned
from that classifier, not a built or proven system.

## 1. What "typing a residue" means

A residue is what a transformation `F: source → target` failed to carry. On the **structure
side** ("did the form survive?"), a residue gets exactly one of three types, by two questions:

- **Q1 — can the original be reconstructed from the output alone?**
  No unique original (two sources collapse to the same output, info destroyed, or no source at
  all) → **irrecoverable**. Treatment: `climb` (seed a new layer, CAV2-D17) or `accept`.
- **Q2 (only if Q1 yields a unique original) — re-run F on the reconstruction; identical?**
  Identical → **clean** → **no residue entry** (this is *not* a D18 treatment value; the case
  simply never enters the ledger — the guard against over-logging).
  Changed → **recoverable-with-loss** → treatment `type` a coupling (CAV2-D16); the change *is*
  the residue.

Verdict fills D18 `residue type`; treatment uses only D18's vocabulary (repair/type/gate/climb/
accept/defer); `concept.residue.owner_route` ("route named by residue type", NODE-MODEL.md:41)
resolves per verdict.

## 2. The honest boundary, and where the fix legally lives

Q2 (round-trip) is genuinely checkable. **Q1 (reconstructibility) is not — not inside CAV2 as it
stands.** Q1 needs a notion of *the ways a source can map into a record*. RELATION-MODEL has flat
predicate edges (8 mandatory fields, fixed Allowed-Relations table), not a space of derivations.
So today Q1 is judgment — and a ledger whose verdict is judgment with no checkable witness is prose
(the DESIGN.md §5 failure); worse, with no working Q1 everything defaults to recoverable-with-loss
and the three types go decorative.

**The minimal fix:** declare, per record TYPE, a **finite, enumerable set of "admissible
derivations into it"** — for each candidate source, the permitted ways it can produce that record.
Then Q1 becomes a count: 0 matches → irrecoverable; 1 → unique (go to Q2); ≥2 → ambiguous →
irrecoverable.

**Where it lives (do NOT just "add it to RELATION-MODEL").** A set of admissible derivations is a
per-node-type *schema facet*, not a flat predicate edge — it has no legal home in RELATION-MODEL as
an open container. Route it as a **schema amendment (CAV2-D25 Schema Amendment Witness)** attaching
the derivation set to the record's node-type schema (CAV2-D21 Four-Facet Action Method is the
natural carrier). *If* you ever realize a derivation as an actual edge, it must (a) enter the
Allowed-Relations table with all 8 fields and the edge-acyclicity constitution, and (b) be
**value-constraining AND acyclic** — the permitted quadrant. The sibling memo's invariant ("no
edge may be simultaneously value-constraining and non-acyclic", TO-VLAD.md) goes live the moment a
derivation can be mutually-constraining/cyclic; a source→record derivation is justification-like
(acyclic), so it is safe — but state that explicitly when you add it.

## 3. The payoff: in a code generator the finite set is (nearly) free

Picture someone using the framework to **generate code** from a domain spec (entities, relations,
constraints, lifecycle → data models, APIs, validators). The residue is what the generated code
can't carry back. Here the derivation set is nearly free: **the generator's rules ENUMERATE the
admissible derivations — one rule = one derivation.** That gives the finite *list* for free. What
is *not* free is each rule's residue content; you author it once.

**Author once, per generation rule — its `residue_profile`:**

```
residue_profile (declared once per rule):
  rule_id:      stable id of the rule/template
  consumes:     spec construct path(s) read         (e.g. entity.field, constraint.unique)
  emits:        emitted code location(s)            (e.g. file:symbol, file:line-region)
  drops:        list of {spec_path, reason}         (read but NOT carried to emits)
  injective:    true | false | unknown              (does emits uniquely identify consumes?)
  synthesizes:  true | false                        (emits with no consumes ancestor)
```

`drops` is a list of `{spec_path, reason}` (not a boolean) because the dropped path is the *source
endpoint* of the coupling D16 requires. `injective: unknown` is mandatory — an author who can't
decide says so and falls to the collision index rather than guessing `true` and producing a false
`clean`. (Note: the per-firing verdict below is a mechanical *lookup* against this declared
profile; the correctness of the declaration is the author's judgment, not machine-checked.)

**At each firing**, with `(construct C, emitted code E)` in hand, the generator reads
`residue_profile[rule_id]`, instantiates each `drops.spec_path` against C, and writes a residue
entry:

- `synthesizes` → **irrecoverable** (no ancestor).
- `injective` AND `drops` empty AND emits to ONE location → **clean** (no entry).
- `injective` AND emits to **≥2 locations from one construct** (fan-out) → **recoverable-with-loss**;
  the coupling is the emit set. (This case has `drops` empty yet is still lossy — the single
  construct now lives in several places. Do not mis-verdict it as clean.)
- `drops` non-empty → **recoverable-with-loss**; the coupling is the dropped paths.
- `injective: false`, or a **collision** in the emitted-output index → **irrecoverable / ambiguous**.

**Emitted-output index** (catches collisions): a map `normalize(E) → [(rule_id, consumes)]`,
written on every firing. Before writing, look up `normalize(E)`; if it already maps to a *different*
`(rule_id, consumes)`, emit an irrecoverable/ambiguous residue whose locus is E and whose evidence
is both colliding pairs. `normalize` must be defined (e.g. `file:symbol`) so cosmetically-different
emits of the same target actually collide — pick the normal form in the generator's own design.

**Verdict → the D18 seven actionable fields** (so the emitter is a direct field-fill):

```
D18 field                     auto-filled from
----------------------------  ----------------------------------------------
source operation              rule_id (the firing rule)
expected preservation         the rule's declared "carries consumes -> emits"
observed remainder / locus    the matched drops entry / the fan-out emit set / the collision
residue type                  clean | recoverable-with-loss | irrecoverable
evidence reference            rule_id + emit location(s) E  (+ collision key, if any)
owner route                   resolved per residue type (concept.residue.owner_route)
treatment                     recoverable->type coupling(D16); irrecoverable->climb/accept; clean->no entry
```

**Sink:** append to the **CAV2-D26 Append-Only Event Ledger**, idempotency key = `rule_id + emit
location`, so a re-run of the generator does not double-log.

Net: the ledger *would* self-populate, and every entry *would* carry a checkable witness (the
rule's declared profile + the binding + the collision index) — so the design is built **to pass**
the §5 anti-prose test. It is not yet built; this is the design.

## 4. Worked example — a uniqueness constraint (the fan-out case)

```
Spec construct:  constraint.unique on Entity.email
Rule R_uniq fires, emits TWO locations:
   E1 = validators/email.ts:assertUnique   (runtime validator)
   E2 = migrations/0007.sql:UNIQUE(email)  (DB index)
residue_profile(R_uniq): consumes=[constraint.unique(Entity.email)], emits=[E1,E2],
   drops=[], injective=true, synthesizes=false.

Firing: injective, drops empty, BUT emits to 2 locations from one construct => fan-out
   => recoverable-with-loss (reconstructing the single spec constraint requires knowing
      E1 and E2 are the same fact).
Auto entry:
   source-op    = R_uniq
   obs. locus   = {E1, E2}
   residue type = recoverable-with-loss
   coupling(D16): R(E1,E2) "co-derived-from constraint.unique(Entity.email)"
   evidence     = R_uniq + [E1,E2]
   treatment    = type the coupling (so edits to E1 and E2 stay in sync)
```

## 5. Honest caveats — read before generalizing

- **Structure side only.** Whether the code *behaves* like the intent (semantic/behavioral
  residue) is a separate register with its own test — not covered here.
- **The whole code-gen mechanization is a design proposal, not built or proven.**
- **Deterministic, rule-based generation only.** ML-generated or hand-written code has no finite
  known rule set → Q1 is back to judgment. (A deterministic generator is typeable; a neural one is
  not, without extra instrumentation.)
- **"Reconstruct" is a borrowed, standard notion** (a best faithful pre-image where one exists) —
  build-from-owned, no novelty; the contribution is the typed packaging + the inline wiring.
- **Do not fuse the registers.** Whether the structure verdict and an information verdict ever
  coincide is open and partly refuted by prior work. Keep the fused residue type blocked.

## 6. What I'd do

1. **General ontology:** add "admissible derivations into a record" as a **node-type schema facet
   via a CAV2-D25 amendment** (CAV2-D21 carrier) — NOT as a free RELATION-MODEL edge. This turns
   Q1 from opinion into a count and unblocks the structure-side residue *type* (not just the
   procedure), but only once it lands.
2. **Code generator:** give each generation rule a `residue_profile` (§3) and instrument the
   generator to emit residue entries inline, sinking to the CAV2-D26 ledger. The rule set is the
   finite derivation enumeration for free; the profiles are the authored part.
3. **New field via amendment:** add `register: {structure | information}` to the residue record
   through a CAV2-D25 amendment, and pass the CAV2-D22 orthogonal-classification gate (show
   `register` is orthogonal to `residue type`, not redundant). Make it mandatory on every entry so
   the open cross-register question stays visible.
4. **Keep blocked:** the fused / cross-register residue type. This memo unblocks the structure side
   of BLK-CAV2-SOURCE-TRUTH-001, mechanically only once (1) lands.

So the honest, buildable version of "the residue is typed": buildable, not yet built, and — for
structure-side residues during deterministic generation — *self-populating* once the rules carry
their residue profiles and the admissible-derivations facet lands.
