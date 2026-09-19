---
node_type: research
is_session: false
status: candidate
created: 2026-07-02
authored_by: research subagent (Curry, Haskell) — proof / dependent-types angle
dispatch: governed research dispatch — meta-type formalism & primitives
corpus: domainspec-lean-formalization/ (owned AgentPermissionKernel) + Lean 4 / Mathlib idiom
target_artifact: meta-type formalization — should primitives + criteria be Lean defs with machine-checked properties?
claim_discipline: claim <= proof; owned foundations labelled and cited; residue marked where unreadable
---

# Formalism angle — Lean / dependent types over the OWNED AgentPermissionKernel

**Bottom line up front.** The six primitives (identity, field-existence, typedness,
boolean-predicate, purity, edge-signature) can each be written as a Lean predicate over a
typed record, and each meta-type criterion composes as a conjunction of those predicates.
But — candor, binding every line below — for **spec-time content validation**, the load-bearing
Lean asset is **`Decidable` instances / `deriving DecidableEq`, not proof**. Every one of the
six primitives is a *structural* check (does this field exist? is its declared type in the
enum? does this Formal cell parse to Bool?), and structural checks are decided by
`decide`/`rfl`, not proved by hand. Lean *proof* buys exactly one thing the YAML validator
cannot get for free: a machine-checked **soundness bridge** between an executable `Bool`
matcher and a declarative relational spec — and that is worth paying for on at most two
primitives (boolean-predicate parsing, edge-signature). Elsewhere Lean is overkill for what
is a schema-shape check. The engine `src/rules` δ-derivation stays private; the validator +
its Lean twin are the public contract — a Lean formalization does not change that boundary.

---

## 1. What the OWNED kernel already gives (build-from-owned — concrete reuse)

The sorry-free `AgentPermissionKernel` (repo: `domainspec-lean-formalization/lean-engineer/`,
`sorry`=0 verified across all 14 `AgentPermissionKernel*.lean` + `PermGuard.lean` +
`cav2-governance/GovernsAcyclicity.lean`) is *not* about meta-types — it is a reference
monitor for agent tool-use. But its **idiom is exactly the one this task needs**, and it is
owned, so we reuse the *pattern*, not the domain. Four reusable pieces:

| Owned artifact (cited) | Reusable pattern | Which primitive it seeds |
|---|---|---|
| `Decision`/`Effect` `inductive … deriving DecidableEq, Repr` (`AgentPermissionKernel.lean:50–59`) | closed enum with **free** decidable equality | typedness (type ∈ enum), edge-signature (endpoint kind ∈ enum) |
| `StructuredArgs` `structure` with typed fields `tool/path/command/scheme/host` (`AgentPermissionKernelArgs.lean:50–59`) | a **typed record** modelling a domain object; some fields `Option`, some `List` | the record we validate (Entity's field table, Rule's Formal row) |
| Relational spec `Satisfies` (Prop) + executable `decidePolicy` (`decide`-shaped) + **soundness biconditional** `decidePolicy_allow_iff` (`AgentPermissionKernel.lean:99–164`) | spec/executable split with `X = allow ↔ Spec X` as a *theorem*, not `rfl` | the template for "the checker agrees with the declarative criterion" |
| `matchesGlob` (Bool, well-founded) + `GlobMatches` (inductive Prop) + `matchesGlob_iff` (`AgentPermissionKernelGlobSpec.lean:42–107`) | a **recursive parser/matcher** proved equal to a named relation via functional-induction | boolean-predicate (Formal cell → Bool), any string/pattern field check |
| `governs : CNode → CNode → Prop` + `DecidableRel governs` + `HasCycle`/`Reach` (Mathlib `TransGen`) + **`acyclicity_not_unary`** (`cav2-governance/GovernsAcyclicity.lean:46–142`) | edge relation, decidable per-edge, transitive-closure cross-graph property, and the **inexpressibility separation** (a unary/node-local predicate provably *cannot* state a cross-edge property) | edge-signature (per-edge, decidable) **and** the honest boundary between per-edge vs cross-graph checks |

The last row is the sharpest reuse. `GovernsAcyclicity.acyclicity_not_unary`
(`:135–140`) proves that **no predicate over node data alone can decide a cross-edge
property** (acyclicity), because a cyclic and an acyclic graph share the same node data. For
meta-types this is the owned proof that the **edge-signature primitive** (per-edge: does
`enforces` have `source.type=Rule ∧ target.type=Operation`?) is a *different, strictly
weaker* check than any cross-graph obligation (e.g. no cyclic `depends-on`). The per-edge
signature is decidable and cheap; a cross-graph obligation is not node-local and must be
stated on the relation. We inherit both the pattern *and* the "don't conflate them" theorem.

**What is NOT reusable:** none of the kernel's *content* (permission decisions, glob
paths, taint) maps to meta-types. We reuse structure classes and the spec↔executable↔soundness
discipline, and we cite the kernel as precedent that these proofs are cheap and land
sorry-free — not as a dependency the meta-type validator imports.

---

## 2. Per-primitive Lean-def sketch (predicate/typeclass over a typed record)

Model an aspect-file concept as a typed record (mirroring `StructuredArgs`'s shape):

```lean
-- the node alphabet (mirrors Decision/Effect enums; deriving gives DecidableEq FREE)
inductive MetaType | entity | valueObject | rule | policy | operation | «...» -- 25
  deriving DecidableEq, Repr

inductive FieldType | string | int | bool | ref (t : MetaType) | «...»
  deriving DecidableEq, Repr

structure Field where           -- one row of an Entity's field table
  name       : String
  type       : FieldType
  isIdentity : Bool
  required   : Bool
  deriving DecidableEq, Repr

structure Concept where         -- what the validator checks (mirrors StructuredArgs)
  id     : String
  type   : MetaType
  fields : List Field
  formal : Option String        -- the Rule/Policy "Formal" cell, unparsed
  deriving Repr
```

**P1 — identity.** `def hasIdentity (c : Concept) : Bool := c.fields.any (·.isIdentity)`.
Decidable by construction (`List.any` is Bool). Owned twin: the `List.any` shape of
`layerForbidsB` (`AgentPermissionKernel.lean:108–109`).

**P2 — field-existence.** `def hasFields (c : Concept) : Bool := ¬ c.fields.isEmpty` (or a
named-field lookup `c.fields.any (·.name == n)`). Same `List.any`/`beq` shape as
`matchesGlob`'s literal arm (`Args.lean:80`).

**P3 — typedness.** Every field's declared type is a real member of the `FieldType` enum.
Because `FieldType` is an `inductive`, *parsing to a `FieldType` value at all* IS the
typedness check — an un-typed field simply fails to parse into the record. Residual runtime
check: `def allTyped (c : Concept) : Bool := c.fields.all (fun f => decide (f.type ∈ validTypes))`,
decidable via `deriving DecidableEq`. This is the primitive where dependent types *could*
express "the type is one whose referent exists in the same file" (`ref t` with `t` a real
node) — a `Σ`-type / index — but see §3: that richness is not needed at spec time.

**P4 — boolean-predicate (Rule's Formal cell).** This is the one primitive that is a real
*parser*. Sketch: `parseFormal : String → Option (BoolExpr Inputs)` returning an AST whose
top type is Bool, and `def parsesToBool (c : Concept) : Bool := (parseFormal <$> c.formal).getD none |>.isSome`.
The owned twin is exact: `matchesGlob` + `GlobMatches` + `matchesGlob_iff`
(`GlobSpec.lean:54`) is a recursive matcher proved sound against a declarative relation. We
reuse that shape: define `BoolExprEval : BoolExpr → Env → Bool` and, *if* we want the
soundness bridge, prove `parseFormal s = some e ↔ ParsesBoolean s e` by functional induction —
the same `.induct` technique cited at `GlobSpec.lean:56`.

**P5 — purity (no state mutation).** A *structural* property of the parsed AST: the
`BoolExpr` grammar simply has no assignment/mutation constructor. `def isPure (e : BoolExpr) : Bool`
is then either `true` by construction (if the grammar excludes effects) or a syntactic walk
`e.all (fun n => ¬ n.isMutation)`. Decidable. No proof needed unless we want
`isPure e = true ↔ NoMutation e` (a relational restatement) — low value, see §4.

**P6 — edge-signature.** Per-edge endpoint typing. Owned twin: `governs : CNode → CNode → Prop`
+ `DecidableRel` (`GovernsAcyclicity.lean:46–53`).
```lean
structure Edge where kind : EdgeKind; src : MetaType; tgt : MetaType deriving DecidableEq
def edgeAdmissible : Edge → Bool
  | ⟨.enforces, .rule, .operation⟩ => true      -- the given criterion
  | ⟨.enforces, _,     _⟩          => false
  | «... other 28 edges ...»
```
Fully decidable by pattern match. The companion honest boundary — `acyclicity_not_unary`
(`GovernsAcyclicity.lean:135`) — tells us this per-edge check **cannot** be extended to
cross-graph obligations (cycles, reachability) without moving to the *relation*, exactly as
in the owned file.

**Criterion composition.** A meta-type criterion is a **conjunction of primitives** over the
record — the same `∧`/`&&` composition the kernel uses for `Satisfies` (`∀ forbid ∧ ∀ permit`,
`AgentPermissionKernel.lean:102–103`):

```lean
def isEntity (c : Concept) : Bool := (c.type == .entity) && hasIdentity c && allTyped c
def isRule   (c : Concept) : Bool := (c.type == .rule)  && (c.formal.map parsesToBool).getD false
                                                          && (isPureFormal c)
```

Each is `decide`-able; a positive fixture reduces to `true` by `rfl`/`decide`, a negative to
`false` — giving exactly the DESIGN.md positive/negative fixture pair per type
(`DESIGN.md:44,51`) as *checked* Lean `example`s, the way `Args.lean:181–194` bakes its
own path fixtures as `by simp`/`by decide` lemmas.

---

## 3. Expressiveness: what dependent types would add (and whether it's needed)

Dependent types capture the *richest* properties: `ref t` where `t : MetaType` is a genuine
node in the same file (a `Σ (t : Node), InFile t`), "this Formal cell's free variables are a
subset of the declared inputs" (a proof-carrying `Fin`-indexed env), "this edge is admissible
*and* its endpoints are typed" as one indexed value. In principle a criterion could be a
**type** whose inhabitants are *exactly* the well-formed concepts, so ill-formed content is
un-representable (the "make illegal states unrepresentable" idiom).

**Honest assessment: for spec-time validation this is expressiveness we do not need and
should not pay for.** The criteria in DESIGN.md (`:40–51`) are *structural shape* checks over
a text/YAML artifact — has-identity-field, fields-are-typed, Formal-parses-to-Bool,
edge-endpoints-match. None of them is a deep semantic property that needs a dependent
witness; each is a decidable Bool over a finite record. Dependent types earn their cost when
you want a *value that carries its own proof* through further computation — but the validator
does not compute *with* validated concepts; it *accepts or rejects a file*. The accept/reject
verdict wants **`Decidable`, not `Σ`/`Π`**.

---

## 4. Proof vs decidable-instance — the crux

The task's crux question: **does spec-time validation need PROOF, or just
type-checking / `Decidable` instances?** Answer, per primitive:

| Primitive | Needs proof? | What actually discharges it |
|---|---|---|
| P1 identity | No | `List.any` : Bool; `decide` |
| P2 field-existence | No | `List.any`/`isEmpty` : Bool; `decide` |
| P3 typedness | No (parsing into the enum *is* the check) | `deriving DecidableEq` on `FieldType`; `decide` |
| P4 boolean-predicate | **Optional proof** — worth it | parser is Bool; the *soundness bridge* `parseFormal s = some e ↔ ParsesBoolean s e` is the one place a theorem adds meaning (twin: `matchesGlob_iff`, `GlobSpec.lean:54`) |
| P5 purity | No | grammar excludes mutation → `true` by construction, or Bool walk |
| P6 edge-signature | No (per-edge); **proof only if cross-graph** | per-edge: `decide` on a pattern match; cross-graph (cycles): needs `TransGen` + a real relational argument (twin: `GovernsAcyclicity`) |

So: **four of six primitives need only `Decidable`/`deriving` — no proof.** The `deriving
DecidableEq, Repr` lines in the owned kernel (`AgentPermissionKernel.lean:53,59`;
`Args.lean:45,69`) are the entire mechanism; `decide` closes the goal. Proof is genuinely
useful on exactly **P4** (to make "the Formal cell is boolean" mean a named relation rather
than "this recursive Bool happened to return true" — the exact justification the owned
`GlobSpec.lean:20–23` docstring gives for its own existence) and on **P6 only if** we later
add cross-graph edge obligations (then we inherit `GovernsAcyclicity`'s `TransGen` machinery
*and* its `acyclicity_not_unary` warning that node-local checks can't see it).

**Proof cost (honest).** The owned kernel is the calibration: `decidePolicy_allow_iff` (the
soundness biconditional) is ~25 lines of `by_cases`/`simp`; `matchesGlob_iff` is ~55 lines
driven by functional induction (`.induct`), one arm per constructor. So a P4 soundness bridge
for a *real* Formal grammar (say 8–12 constructors) is a **~1–2 day, bounded, sorry-free**
proof of the same shape — not a research problem. The cheap part (P1–P3, P5, per-edge P6) is
**hours**: define the enums/records, `deriving`, write `decide` fixtures. The expensive-and-
optional part (P4 bridge, cross-graph P6) is the only place real proof engineering appears,
and even there the owned files are a copyable template, not a blank page.

---

## 5. Where Lean is overkill (candor)

- **P1, P2, P3, P5, per-edge P6** as *proofs*: overkill. These are schema-shape checks. A
  YAML `.schema.yml` validator (the DEF-D1 / DES-D3 resolved design, `DEFINE.md:75–78`)
  with a JSON-Schema-style `required`/`enum`/`type` already decides has-identity-field,
  fields-typed, edge-endpoints-in-enum. Writing them as Lean `decide` lemmas adds a
  machine-checked twin but **no new discriminating power** over the schema validator. Claim
  it as *rigor/documentation*, not as capability — the same honest framing the owned
  `GlobSpec.lean:21` uses ("included for rigor, not contribution").
- **Dependent-typed "well-formed concept as a type"**: overkill for accept/reject. The
  verdict is a Bool; a `Σ`-type buys nothing the validator consumes (§3).
- **Any Lean claim of "validated ⇒ engine-correct"**: out of scope and a boundary risk. A
  Lean-checked *criterion* is not proof the private δ-derivation is correct
  (`DEFINE.md:51–52` says this explicitly). Keep them separate.

**Where Lean is NOT overkill:** (a) the **P4 soundness bridge** — turning "Formal parses to
Bool" into a named-relation theorem, so the public validator's guarantee is declarative not
incidental; (b) **cross-graph edge obligations** if/when they enter scope — the owned
`GovernsAcyclicity` proves per-rule/per-edge lints *provably cannot* catch them, which is a
real result the YAML validator cannot state about itself; (c) as a **public-contract
artifact** — a small sorry-free Lean twin of the validator is a credible, checkable statement
of the public criteria that does not leak the private engine (consistent with the moat
boundary, `DEFINE.md:14`).

---

## 6. Residue / boundaries

- The `domainspec-lean-formalization/` repo **was readable**; the AgentPermissionKernel files
  are the owned, sorry-free artifacts cited above (not residue).
- **NOT verified by build here.** All citations are by reading source + the in-file `sorry`=0
  grep; I did not run `lake build`. The repo's own README (`:55`) warns that a file pointer is
  not a verified-clean claim without the build gate — so treat the sorry-free status of the
  *kernel* files as read-confirmed (grep: 0 in each), and any *new* meta-type Lean file as
  requiring its own build check.
- A `BoolExpr`/`parseFormal` grammar for the Rule Formal cell **does not yet exist** — §2's P4
  sketch is a design, its proof cost estimated by analogy to `matchesGlob_iff`, not measured.
- No new Lean was written (read-only dispatch; single output = this file).
