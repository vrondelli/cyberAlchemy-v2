# CyberAlchemy × Lean Residue — Fusion Design Packet

> **Start here.** This is a *design* artifact, not a built capability. It maps how
> Arcanum (`arcanum/`, `cyberAlchemy/`) and the sibling repo
> `domainspec-lean-formalization` compose into one tool for *creating things*,
> marks what is honest engineering vs. aspirational metaphor, and routes the
> smallest next build. Nothing here is promoted to any registry. Read §6 for the
> only thing to build first, and §5 for the test that decides if this is real.

## 1. Objective & output (the guiding pair)

- **Objective.** A *capability foundry* where every act of creation (intent →
  artifact) is **residue-accounted**: the lifecycle machinery fabricates and
  promotes capabilities, and an epistemic core refuses inflated claims and books
  what each transformation fails to preserve.
- **Output artifact (this packet).** The fusion map + the honest-typing line +
  the layered build path. The *first real output of the program* is one sigil
  (§6), not this doc.

## 2. What each side actually is (anchored)

| Side | Role | Evidence anchor |
| --- | --- | --- |
| **Arcanum / CyberAlchemy** | Lifecycle & governance **machine**: intent → reusable sigil/spell, with observability, experiment harness, installer, Pass/Flag/Block gates. Tension/quality is **prose-governed** (qualitative). | `arcanum/framework/CYBERALCHEMY-METHOD.md`; `arcanum/registry/SIGILS.md` (e.g. `residuality-spec` asks "desired residue/degradation" in prose) |
| **domainspec-lean-formalization** | Formal epistemic **conscience**: subset rule (claim ≤ proof), **typed residue**, adversarial precedent gates, collapse-test, Brier scoring, Lean verification. | `lean-formalization/FunctorialResidueStructure.lean:121` (monotonicity DERIVED from functor action); `:286` (`functorial_strictly_dominates_count`); its `CLAUDE.md` (subset rule + stop-triggers); its `research` skill (explorer→skeptic→writer→auditor); its `predict` skill |

**One-line thesis.** Arcanum has the skeleton and organs (fabricate + promote);
the Lean repo has the immune system (refuse inflation + book the loss with a
type). The fusion fills empty slots on each side — it is **not** metaphor at the
engineering layer.

## 3. The fused tool

Run the CyberAlchemy loop as-is. At **every transformation boundary**
(intent→artifact, source-skill→sigil, sigil→spell, schema→instance) add four
moves neither side does alone:

1. **Typed residue record** — what the transformation provably does *not*
   preserve from its input. The typed version of `residuality-spec`'s
   "desired residue", anchored on the residue object in
   `FunctorialResidueStructure.lean`.
2. **Subset-rule gate** — claim ≤ evidence over the sigil output → **Pass / Flag
   / Block**. Mechanizes Arcanum's prose rule "avoid silent promotion".
3. **Collapse-test + precedent dispatch** — any novelty/keystone claim must carry
   its inline falsifier and pass the `research` skeptic gates (ownership /
   non-vacuity / definitional-soundness) before registry promotion.
4. **Brier-scored forecast** — log "will this sigil survive validation?" into
   `predict`, giving Arcanum's reflection/observability loop a *quantitative*
   spine (it logs signals today but does not score its own forecasts).

**Killer feature — the residue ledger.** Every artifact carries the typed account
of what it does *not* preserve from its source; these accumulate into a navigable
"loss map" across the whole creation lineage. This unifies Arcanum's
observability (runs→evidence) with the Lean repo's north star (typed residue of
every translation). Honest because it is **bookkeeping**, not a correctness proof.

## 4. Honest typing (subset rule applied to this doc)

- **Transferable, honest engineering:** the four gates in §3. Portable today with
  no unproved claim. The subset-rule gate + three skeptic gates are literally
  Arcanum's `Balancer`/`robot-talks` *typed* instead of one undifferentiated critic.
- **Metaphor — must stay marked, never built as proved:** typed residue on *agent
  artifacts* is a bookkeeping discipline *inspired by* the formal object — it is
  **not certified by it**. The Lean theorem is about Lan/colimits over presheaves
  (`FunctorialResidueStructure.lean`), not LLM synthesis. Any narrative that says
  "the Lean proof certifies an Arcanum run is lossless/correct" is rejected here
  by the subset rule.

## 5. Collapse-test of the central claim

> **Claim:** the residue ledger is a genuine unification, not a rename.
> **Collapse-test:** if the artifact "residue" is free-text "what we dropped" with
> no type that *mechanically* fires the subset-rule gate, then it is Arcanum's
> existing `residuality-spec` renamed — **contribution zero.** The fusion is real
> only if the residue carries a typed signature (a morphism / functor-action
> shape) that triggers Pass/Flag/Block automatically. If it is prose, it collapses.

## 6. Smallest coherent unit (build this first)

Do **not** write a manifesto or build the full ledger first. Build **one** sigil
that attacks the collapse-test directly:

- **`subset-rule` gate sigil** — takes the output of an existing Arcanum sigil,
  extracts its claims, checks claim ≤ supplied evidence, returns Pass/Flag/Block.
  Smallest unit that proves the immune system ports into the lifecycle machine.
- If it survives the collapse-test (verdict is type-driven, not prose), *then*
  layer up: residue record → residue ledger → Brier-scored reflection.

**Layered proof progression** (each layer must unlock a distinct decision):
`subset-rule gate` → `typed residue record per boundary` → `residue ledger / loss
map` → `Brier-scored reflection loop`.

## 7. Open / unresolved (blockers vs non-blockers)

- **(BLOCKER for the residue-ledger — layer 2+)** What *type* does an
  artifact-level residue actually carry such that it forces the gate? This is the
  load-bearing question of the whole project. Candidate owned machinery to mine
  for the type: information-loss / MI (resource theories), codensity / nucleus,
  Grothendieck-fibration Σ-fibre, refinement types / proof-carrying code, Galois
  connections, residuality theory (Hopkins/Cook). Until answered concretely, only
  layer 1 (subset-rule gate) is honest to build. **Resolve via a `research`
  dispatch in the Lean repo** (explorer→skeptic→writer→auditor), not by hand-waving.
- **(Non-blocker)** Home for the fused sigils — `arcanum/` (native packet format)
  vs. a project-local `development/` here. Decide at prototype time.
- **(Non-blocker)** Whether to reuse Arcanum's observability JSONL ledgers as the
  physical store for the residue ledger (likely yes).

## 8. Trace

- Venue: this packet lives in `domainspec-core/projects/cyber-alchemy-lean-fusion/`
  (moved here from a first draft in the Lean repo's `research-tooling/`, per
  decision to host the fusion as a core project).
- Considered routes: bridge (rejected — not a domain→category contact), conjecture
  (rejected — no prize statement), tooling design packet (**chosen**).
- Rejected framing: "Lean residue theory certifies Arcanum correctness" — killed by
  subset rule (§4).
- Pushback recorded: a request to fan subagents straight at "writing the
  residue-ledger" was redirected — the ledger has an unresolved type blocker (§7);
  building it now would produce exactly the prose §5 kills. The honest dispatch
  targets the type question, not ledger prose.

## 9. Next route

1. Run a `research` dispatch (in the Lean repo) on the §7 blocker: *does an
   artifact-level residue type exist and is it un-owned?* — verdict-per-candidate,
   collapse-tested. Do NOT write the ledger.
2. If a usable type lands → prototype the `subset-rule` gate sigil (§6) and run it
   against the collapse-test (§5).

Owner: Victor. This packet stays a candidate until step 1 returns a type-driven
verdict.
