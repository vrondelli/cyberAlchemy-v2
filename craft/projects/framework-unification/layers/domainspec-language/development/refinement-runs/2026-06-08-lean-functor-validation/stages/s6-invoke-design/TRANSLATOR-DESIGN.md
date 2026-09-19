---
tags: [lean-code-validator, translator, stage-b, functor-validation, presheaf-lan, fdm, refinement-run, design]
node_type: design
is_session: true
layer: [domain, application]
nature: design
status: draft
version: 0.1.0
last_updated: 2026-06-08
---

# TRANSLATOR-DESIGN — the deterministic translator `T` (s6)

> Role: `translator-designer`. Design-only, no code.
> Frame (already decided, not re-litigated): `presheaf-lan` with `fdm` (Spivak
> functorial data migration) as the implemented core. The spec is a σ-typed
> quiver already in Lean (`sigmaValid`, `EdgeRow.wellTyped`, Theorem 1). Validation
> of code = decidable functor/migration obligations over that σ-quiver. Residue is
> **named**, not eliminated. No `Functor.Full` claim.
> Honesty ladder (DISTILL §"Skeptic constraints"): only operational + formal
> claims are assertable.

`T` is the **Stage-B source-category builder**. The existing `MarkdownToSpec` /
`SpecToLean` pipeline translates *markdown spec → Lean `Spec`* (VALIDATOR-XRAY §4,
§6 "Missing"). `T` is the missing dual: *LLM-produced code → Lean `Spec`* (the
source category `C`), so Lean can run Stage B (`#eval gradeFor`). `T` reuses the
**identical output type** `Spec` (`Richness.lean:58`) — it is a second front-end
onto the existing emitter format that `gradeFor` (`Report.lean:136`) consumes.

---

## 0. Position in the two-category picture

- `S` = the spec category: the σ-quiver instance Stage A certifies
  (`ConceptSpace` + `metaOf` + `EdgeRow.wellTyped`, `Richness.lean:29/45/58`).
- `C` = the **code category** `T` builds from the implemented codebase.
- `T` does not emit a separate `C`-type; it emits `C` **as a `Spec`** (object set
  = code-derived concepts colored by `metaOf` into `Meta`; arrows = `EdgeRow`
  candidates). The functor `F : C → S` that Stage B grades is then realized as the
  **migration check** between `T`'s emitted `Spec` and the Stage-A `Spec`:
  per-edge σ-admissibility (Theorem 1, free), reference closure (P1), order DAG
  (P5), and (gated) obligation/ambiguity (P3/P4). This is the `fdm` core: each σ
  edge is a sanctioned migration span; Theorem 1 is the migration-law witness.

`T` is **pure structural lift**. It assigns `Meta`/`EdgeType`/`EdgeProvenance`
from code signals and nothing else. It never asserts `F` is full, total, or
correctness-preserving (DISTILL F1/F2; VALIDATOR-XRAY §5 "Lan-faithful, not full").

---

## 1. INPUTS and their mapping into the spec category

`T` consumes four code signals, in strict precedence order (§3). Each signal
contributes an object-coloring (`metaOf`) and/or an edge candidate with a
provenance tag. All vocabulary below is the canonical 25 `Meta` / 29 `EdgeType`
from `Sigma.lean:13/28`, the taxonomy in `TAXONOMY.md`, and the relationship cards
in `architecture/ARCHITECTURE-PATTERN-LIBRARY.md`.

### (a) DomainSpec source tags in code → `Meta` / `EdgeType` (PRIMARY)

The `domainspec-tag-code` annotation contract (`governance/tags/CODE-TAG-SCHEMA.md`)
already carries everything `T` needs, declared by a human/implementer:

- `domainspec.concept.id` → the `Concept` constructor name (object identity).
- `domainspec.concept.type` → `metaOf(concept)` directly. The schema mandates
  `concept.type` "must match taxonomy labels from `TAXONOMY.md`", which are exactly
  the 25 `Meta` constructors. Mapping is the identity rename below.
- `domainspec.edges[].edge` → `EdgeType` (schema: "must be canonical labels from
  `RELATIONSHIPS.md`", the 29 edge labels). `domainspec.edges[].to` → the `tgt`
  concept id. Edge direction is "canonical and outbound from the tagged concept"
  (schema Semantics), so `src = tagged concept`, `tgt = edges[].to`.

Tag `type` → `Meta` (identity rename; `TAXONOMY.md` label ⇒ `Sigma.lean:13`):

| Tag `concept.type` | `Meta` |
|---|---|
| Entity / Value Object / Enum / Operation / Query / Calculation / Rule / Policy / Workflow / Interface / Event / Mapping / State Machine | `.Entity` / `.ValueObject` / `.Enum` / `.Operation` / `.Query` / `.Calculation` / `.Rule` / `.Policy` / `.Workflow` / `.Interface` / `.Event` / `.Mapping` / `.StateMachine` |
| Page / Layout / Component / View Model / Hook / Form / Action / Guard / Binding / Adapter / State Indicator | `.Page` / `.Layout` / `.Component` / `.ViewModel` / `.Hook` / `.Form` / `.Action` / `.Guard` / `.Binding` / `.Adapter` / `.StateIndicator` |
| Saga | `.Saga` (forces `profile := .compositionExtension`) |

Tag `edge` label → `EdgeType` (identity rename; `RELATIONSHIPS.md` ⇒ `Sigma.lean:28`).
Kebab-canonical → Lean camelCase: `produces-for → .producesFor`,
`triggers-cross → .triggersCross`, `enforces-cross → .enforcesCross`.

### (b) Architecture patterns → structural edges (SECONDARY)

When a symbol matches a pattern card in `architecture/ARCHITECTURE-PATTERN-LIBRARY.md`
but carries no tag, `T` infers `metaOf` from the "Functional Implementation Pattern"
column and edges from the relationship cards. These map to the *same* `Meta`/`EdgeType`
but with weaker provenance:

| Code shape (pattern card) | Inferred `Meta` / `EdgeType` |
|---|---|
| `makeX(deps) -> (input) => Promise<output>` use-case factory | `.Operation` |
| query factory `makeX(deps) -> (input) => Promise<view>` | `.Query` |
| pure predicate returning `boolean` | `.Rule` |
| pure deterministic formula fn | `.Calculation` |
| strategy-selection fn | `.Policy` |
| `type` + factory + transition fns | `.Entity` |
| immutable `type` + constructor | `.ValueObject` |
| transition table/map + guard + pure transition fn | `.StateMachine` |
| boundary handler (HTTP/RPC/module) calling use-cases | `.Interface` |
| `use{Name}()` hook wrapping TanStack Query | `.Hook` (or `.Binding` if it owns the endpoint config) |
| Zod schema + `useForm()` resolver | `.Form` |
| Badge/icon `Record<Value,Visual>` color map | `.StateIndicator` |
| (relationship cards) Rule→Operation gate, Operation→Event emit, Interface→Operation expose, etc. | `.enforces`, `.produces`, `.exposes`, … (the 29 cards, one per `EdgeType`) |

### (c) Composability / relationship rules → allowed σ-edges (CONSTRAINT, not a source)

`RELATIONSHIPS.md` / the relationship cards define which `(srcMeta, edge, tgtMeta)`
triples are *legal*. This is exactly `sigmaValid` (`Sigma.lean:56`), the paper
Tables 3/4 reification. `T` does **not** read composability rules to *invent* edges;
it uses them as the **admissibility filter**: a candidate edge from (a)/(b)/(d) is
emitted as a `wellTyped` `EdgeRow` only if `sigmaValid p edge srcMeta tgtMeta = true`.
Candidates that fail this filter are not silently dropped — they become
`sigmaFallback`/WARN residue or unresolved-ref residue (§5). R_U edges
(`renders`…`displays`) have **no** σ-triple under either profile (`Sigma.lean:83`,
catch-all), so any UI-intra edge is structurally WARN (D12), never `wellTyped`.

### (d) GitNexus graph (symbols / calls / flows) → candidate code morphisms (DISCOVERY)

The GitNexus index (`implementation/domainspec/CLAUDE.md`: 3157 symbols, 5367
relationships, 164 execution flows) is `T`'s **candidate-edge generator** when tags
and patterns are silent. It contributes structural facts only:

| GitNexus signal | Use in `T` |
|---|---|
| symbol (function/class/type) | candidate `Concept` object (id = qualified symbol name) |
| call edge `A → B` | candidate morphism: paired with `metaOf` of endpoints, filtered by `sigmaValid` to a typed `EdgeType` (e.g. `Binding` calling `Operation` ⇒ `.mutates`; `Query`→`Entity` read ⇒ `.queries`) |
| import / cross-layer reference | candidate cross-layer R_X edge candidate (subject to σ filter) |
| execution flow / process | ordering evidence for P5 codegen-DAG (sequence of codegen-dependency edges) |

GitNexus edges are **never** promoted above tag/pattern provenance; a call edge
only survives if a unique `EdgeType` makes it σ-valid for the endpoint metas
(deterministic resolution, §3). Ambiguous or σ-invalid call edges become residue.

---

## 2. OUTPUT — the exact `Spec`-shaped artifact

`T` emits one `.lean` file in the **existing `SpecToLean` format** (the de-facto
spec is `examples/ZagrMarketplaceGen.lean`), so `gradeFor` consumes it unchanged.
Structure (`Richness.lean:29/45/58`):

```lean
import LeanCodeValidator.Report
namespace <CodebaseName>Code
open LeanCodeValidator

inductive Concept where            -- objects of C = code-derived concepts
  | <ConceptId₁> | <ConceptId₂> | …
  deriving DecidableEq, BEq, Repr

def metaOf : Concept → Meta        -- object coloring C → MetaQuiver (the functor on objects)
  | .<ConceptId₁> => .<Meta₁>
  | …

def conceptSpace : ConceptSpace where
  Concept  := Concept
  decEq    := inferInstance
  beq      := inferInstance
  concepts := [ .<ConceptId₁>, … ]   -- explicit enumeration (P1/P3 input)
  metaOf   := metaOf

def spec : Spec where
  profile        := .paperBaseline      -- or .compositionExtension if any Saga / R_CF emitted
  conceptSpace   := conceptSpace
  edges          := [                    -- arrows: each an EdgeRow candidate with provenance + wellTyped
    { src := .<A>, edge := .<e>, tgt := .<B>, provenance := .declared,        wellTyped := by decide },
    { src := .<C>, edge := .<f>, tgt := .<D>, provenance := .contextInferred, wellTyped := by decide },
    …
  ]
  unresolvedRefs := [ "<dangling target name>", … ]   -- P1 input (§5)
  conceptCount   := <Nat>                              -- total declared concepts (P3 coverage)

#eval gradeFor spec
```

- **objects** = code concepts (ids from tag `concept.id`, else qualified GitNexus
  symbol name). `metaOf` is the object map per §1.
- **edges** = σ-admissible `EdgeRow` candidates. Each carries `provenance` (§4) and
  a `wellTyped` proof. Because `sigmaValid` is a decidable `Bool` literal table,
  `wellTyped := by decide` (or `rfl`) discharges every emitted edge — and is
  **unconstructible** for a σ-invalid edge, so `T` literally cannot emit one
  (`Richness.lean:50`; VALIDATOR-XRAY §1.2). σ-invalid candidates are diverted to
  residue before emission.
- **unresolvedRefs** = every edge target / referenced symbol with no `Concept`
  object (P1 closure input; `Report.lean:56`).
- **provenance per edge** = the §4 split, the load-bearing novelty over the current
  emitter (which writes `.declared` for everything — VALIDATOR-XRAY §6 "Missing").
- **profile** = `.compositionExtension` iff any concept is `.Saga` or any edge is
  R_CF (`producesFor`/`triggersCross`/`enforcesCross`); else `.paperBaseline`.

This lands byte-compatibly in the format `gradeFor` already grades; no validator
change is required for `T` to be ingested.

---

## 3. DETERMINISM contract — what makes `T` a function, not a heuristic

`T : Codebase → Spec` is a **total, deterministic function**. Same code input ⇒
identical `Spec` (same `Concept` order, same `metaOf`, same edge list, same
provenance). Guarantees:

1. **Total / defined-everywhere.** Every code symbol either (i) maps to a `Meta`
   via the §1 tables, or (ii) is recorded as **unspecified-behavior residue**
   (§5) and excluded from `concepts` — never an undefined `metaOf` branch.
   `metaOf` is a total function over the emitted `Concept` set by construction.
   Every candidate edge either becomes a `wellTyped` `EdgeRow`, an entry in
   `unresolvedRefs`, or named WARN residue. No input falls off the edge.

2. **Strict signal precedence (resolves disagreement).** When signals conflict on
   a concept's `Meta` or an edge's `EdgeType`, `T` takes the highest tier:
   `(a) source tag  ≻  (b) architecture pattern  ≻  (d) GitNexus graph`.
   Composability (c) is never a *source*; it is the σ-filter applied *after*
   resolution. A tag's `concept.type` overrides any pattern/graph inference; a
   pattern overrides a bare call-graph inference. Rationale: tags are
   human-declared intent at the Intent Wall (DISTILL F1), patterns are structural
   law, the graph is raw evidence.

3. **Tie-breaking inside a tier.** If two same-tier signals still disagree (e.g.
   two pattern cards both match a symbol): pick the candidate whose
   `(srcMeta, edge, tgtMeta)` is `sigmaValid` for the resolved profile; if still
   tied, order by the canonical `EdgeType` / `Meta` declaration order in
   `Sigma.lean:13/28` (lexical on constructor index); if a concept's `Meta` cannot
   be uniquely resolved, it is **unspecified-behavior residue** (§5), not a guess.

4. **Stable object/edge ordering.** `concepts` and `edges` are sorted by
   `concept.id` lexical order (the emitter already lists concepts alphabetically —
   `ZagrMarketplaceGen.lean`), making the `.lean` output reproducible regardless of
   filesystem traversal or GitNexus result order.

5. **No hidden state, no model calls.** `T` reads only: the tag annotations, the
   pattern-card table, the σ-table, and a *snapshot* of the GitNexus graph. Given a
   pinned GitNexus index, output is a pure function of inputs. (The index version
   is recorded in the emitted file header for reproducibility, mirroring the
   `audit_richness.py` provenance header in `ZagrMarketplaceGen.lean:2`.)

What makes it a function and not a heuristic: every decision is a **table lookup +
total precedence order + decidable σ-filter**, with no scoring, ranking threshold,
sampling, or natural-language judgment anywhere in the path.

---

## 4. PROVENANCE SPLIT (critical) — laundering guard

Reuse the existing `EdgeProvenance = declared | contextInferred | sigmaFallback`
(`Richness.lean:17`) so residue introduced **by `T`'s mapping table** is
distinguishable from residue in the **code itself** (DISTILL F3: "a deterministic
`T` can launder codegen residue into its own mapping table; split the two via
per-artifact `EdgeProvenance`"). Each input tier maps to exactly one provenance:

| Edge source (input tier) | `EdgeProvenance` | Meaning for P4 grading (`Report.lean:80`, `spec/rules.md:63`) |
|---|---|---|
| (a) DomainSpec source tag `domainspec.edges[]` | `.declared` | The **code asserted this edge**. Residue here is residue in the code/spec, not `T`. P4: ambiguity at a `declared` edge ⇒ FAIL. |
| (b) architecture-pattern structural inference | `.contextInferred` | `T` inferred the edge from structural position (pattern card), not an explicit tag. P4: ambiguity ⇒ FAIL (still a structural commitment). |
| (d) GitNexus call/import that only typed via the σ-filter | `.sigmaFallback` | `T`'s mapping table chose a σ-compatible `EdgeType` to make a raw graph edge land. This is **`T`-introduced** residue. P4: ambiguity ⇒ WARN only — never blamed on the code. |

This is the laundering firewall: a M6 ambiguity surfaced from a `sigmaFallback`
edge is `T`'s own inference noise (WARN), whereas the same ambiguity from a
`declared` edge is a genuine code defect (FAIL). The split makes the two residue
sources auditable per-edge instead of conflated. It also matches the intended (not
yet implemented) P4 grading wrapper verbatim (VALIDATOR-XRAY §2 P4:
`declared`/`contextInferred → fail`, `sigmaFallback → warn`).

---

## 5. Functor / migration obligations `T`'s output must satisfy, and residue

For Stage B to PASS, `T`'s emitted `Spec` must clear the four live obligation
checks (`gradeFor`, `Report.lean:136`; worst-component aggregation
`Report.lean:42`):

| Obligation | Lean check | Pass condition | Residue when it fails |
|---|---|---|---|
| **σ-typing (functor-on-arrows)** | `EdgeRow.wellTyped` + Theorem 1 (`Richness.lean:50/71`) — free | every emitted edge is a sanctioned σ-span (the `fdm` migration law) | edge `T` cannot σ-type ⇒ demoted to `sigmaFallback`→WARN or dropped to `unresolvedRefs` |
| **schema closure (P1)** | `gradeP1Closure` (`Report.lean:56`) | `unresolvedRefs = []` (every referenced target is a `Concept`) | dangling target ⇒ P1 FAIL = **unresolved-reference residue** |
| **codegen-order DAG (P5)** | `gradeP5Acyclic` (`Report.lean:116`) | codegen-dependency subgraph (`isCodegenDependency`, `Profiles.lean:77`) is acyclic | cycle ⇒ P5 FAIL = **cyclic-dependency residue** |
| **per-meta obligations (P3) / M6 ambiguity (P4)** | `gradeP3/4` — currently stubbed `.pass` (`Report.lean:71/80`) | (deferred; gated on DESIGN-PACKAGE B-1 / EX1 per DISTILL recomposition) | when landed: unmet obligation ⇒ residue; M6 witness graded by provenance (§4) |

**Two named residue directions** (DISTILL F2, the partial-lax map — `F` is NOT
strict/full/total):

1. **Unspecified-behavior residue** (code ∉ spec): a code unit with no `Meta`
   (un-tagged, no pattern match, no σ-typable graph role). `T` records it in a
   sidecar manifest and **excludes it from `concepts`**. It is named, never
   silently absorbed. This is the "code does things the spec never sanctioned"
   direction.
2. **Unimplemented residue** (spec ∉ code): a Stage-A `Spec` concept/obligation
   with **no corresponding code concept** in `T`'s output. Surfaced by diffing
   `T`'s `concepts` against the Stage-A `ConceptSpace.concepts` (and, once P3
   lands, the per-meta obligation table `spec/queries.md:45`). Named as
   unimplemented obligations.

Residue is **named, not eliminated** (frame contract). `T` never claims zero
residue, never claims `F` is full (no `Functor.Full`), never claims
fidelity/agreement (DISTILL honesty ladder).

---

## 6. What `T` explicitly does NOT do (the boundary)

- **No semantic / intent recovery.** `T` lifts *structure* (which `Meta`, which
  σ-edge) from tags/patterns/graph. It does not infer business intent, does not
  decide whether the code *means* what the spec says. Intent sits **above the
  Intent Wall**, owned by humans, never by `T` or Lean (DISTILL F1; VALIDATOR-XRAY
  §5 "Below the Claim B Wall — the spec is taken as given").
- **No LLM calls.** `T` is non-LLM and deterministic by construction (§3.5). The
  LLM produced the *code*; `T` only reads its structural fingerprint. (The
  `code.md` route in `implementation/domainspec/CLAUDE.md` keeps codegen and
  validation in separate lanes.)
- **No proof of code correctness.** Passing Stage B = the code's structure forms a
  σ-admissible migration over the spec category (internal/structural correctness
  only — DISTILL F1). It is **not** a proof the code behaves correctly, that tests
  pass, or that runtime semantics match. `EdgeRow.wellTyped` proves *typing*, not
  *behavior* (VALIDATOR-XRAY §7).
- **No category-law manufacture.** `T` emits a quiver instance; it does not assert
  composition/identity/associativity laws on the code (those are unbuilt —
  VALIDATOR-XRAY §6 "No composition or identity structure"). The `Lan`/M6-graph
  theorem stays an explicitly open conjecture (DISTILL recomposition tail).
- **No edge invention from composability rules.** `RELATIONSHIPS.md` is used only
  as the admissibility *filter* (§1c), never as a generator of edges the code does
  not exhibit.

---

## Evidence boundary

Vocabulary cited from in-tree source: `Sigma.lean:13/28/45/56` (Meta/EdgeType/
Profile/sigmaValid), `Richness.lean:17/29/45/58/71/85` (EdgeProvenance/ConceptSpace/
EdgeRow/Spec/Theorem 1/m6Witnesses), `Profiles.lean:77` (isCodegenDependency),
`Report.lean:56/71/80/116/136` (P1/P3/P4/P5/gradeFor), `examples/ZagrMarketplaceGen.lean`
(emitter output shape). Mapping vocabulary from `TAXONOMY.md` (25 meta-types),
`architecture/ARCHITECTURE-PATTERN-LIBRARY.md` (pattern cards + 29 relationship
cards), `governance/tags/CODE-TAG-SCHEMA.md` (tag contract). GitNexus capabilities
from `implementation/domainspec/CLAUDE.md`. Frame/skeptic constraints from
`stages/s5-distill/DISTILL.md` and `stages/s1-context-builder/VALIDATOR-XRAY.md`.
`audit_richness.py` / `SpecToLean` are referenced-but-absent upstream
(VALIDATOR-XRAY §4); `T`'s emitted format is specified against the in-tree output
file, not the absent emitter source.
