# Framework Integration — DomainSpec Framework × Arcanum/Lean Foundry

> **Start here.** This is a *design* artifact (a SEED), not a built capability. It
> maps how the DomainSpec **framework** (taxonomy, typed edges, vault graph, specs,
> the spec→test→…→verify pipeline, `@biz`/`@sys` code tags, register-dispatch)
> plugs into the foundry already designed in the sibling `DESIGN.md`/`README.md`.
> The foundry is the **horizontal** axis (intent→artifact). The framework adds the
> **vertical** axis (business→system→code). Residue is the common currency at every
> boundary of both axes. Nothing here is promoted to any registry. Read §2 for the
> naming disambiguation (it is load-bearing), §5 for the test that decides if this
> is real, and §6 for the only thing to build first.

## 1. Objective & output (the guiding pair)

- **Objective.** Give the capability foundry a *second axis*. The sibling packet
  accounts residue **horizontally** along the foundry lifecycle (intent→artifact).
  The framework accounts residue **vertically** along the ontology tower
  (business→system→code). The fused tool is one grid where every cell is a
  transformation boundary that must book what it fails to preserve — and the
  framework's typed edges are a candidate to give those bookings a **type** rather
  than prose.
- **Output artifact (this packet).** The two-axis fusion grid + the honest-typing
  line + the seam-filler thesis + the layered build path. The *first real output*
  is one wired boundary (§6), not this doc.

## 2. What each side actually is (anchored)

| Side | Role | Evidence anchor |
| --- | --- | --- |
| **The foundry (Arcanum × Lean)** | Horizontal axis: lifecycle machine (intent→sigil→spell) + typed-residue epistemic core. Already owns the residue currency, the Pass/Flag/Block gate vocabulary, the dispatch ontology, and the OPEN seams this packet targets. | sibling `DESIGN.md §3` (four boundary moves); `DISPATCH-COMPOSITION-MODEL.md` (Dispatch/Wave/Layer/Agent ontology, typed edges, strategy=(role-set,grader)); TO-VLAD.md + TO-VLAD4.md (residue has no type at any layer; note: there is no `TO-VLAD1.md` — the series is `TO-VLAD.md` then `TO-VLAD2`..`8`) |
| **The DomainSpec framework** | Vertical axis: the ontology tower. Spec-layer taxonomy + typed edges, the vault graph schema, the spec→test→code→running pipeline with residue ledgers that fire at spec→test and spec→code today (business/system-floor ledgers OPEN — §7), `@biz`/`@sys` code tags, register-dispatch. | `TAXONOMY.md` (Backend + UI meta-types, "Primary Layer" column); `RELATIONSHIPS.md` (typed edges incl. cross-layer); `README.md` "The Pipeline at a Glance" (10-stage table); `governance/tags/CODE-TAG-SCHEMA.md`+`.json` (`concept.concern:biz\|sys`, `spec_ref`, `edges[]`); `ontology-conventions.md` Appendix B/C |

**One-line thesis.** The foundry runs lifecycle **across** (intent→artifact); the
framework runs ontology **down** (business→system→code); residue is the currency
of both. The framework's **typed edges + taxonomy + ontology-view** are the
strongest candidate to give a *type* to the residue that the sibling packet's
central blocker (sibling `DESIGN.md §7`) leaves OPEN — but only at the boundaries
where the type *mechanically fires a gate* (§5), not where it narrates one.

**Naming disambiguation (load-bearing — do not skip).** In `MAP.md` and the
view documents, the bare token **"domainspec" means the theorem + core** — the
epistemic conscience (subset rule, typed-residue object, Brier scoring). **This
packet's subject is the FRAMEWORK** — the taxonomy/vault/pipeline tooling, a
*different* artifact that collides on the same token. Throughout this packet,
"the framework" = the vertical-axis tooling; when
`MAP.md`/views say "domainspec" they mean the theorem+core. Conflating them
imports the theorem's guarantees onto the framework's prose — exactly the move
§4 and the sibling §4 reject.

## 3. The fused tool

Run the foundry lifecycle as-is (sibling `DESIGN.md §3`). The framework adds a
**vertical drop** at each foundry boundary: every horizontal transformation now
also has to say *which ontology floor it lives on* and *what it failed to carry
down to the next floor*. The grid:

```
                 VERTICAL axis (framework: ontology tower)
                 business ──────► system ──────► code ──────► running
HORIZONTAL  intent  │ intent→spec    (no home)     @biz/@sys     —
axis        │       │ gate: spec-     [SEAM 1]      tags          —
(foundry:   ▼       │ feature+        weakest       CODE-TAG-     —
lifecycle)  artifact│ taxonomy        floor         SCHEMA        OBSERVABILITY
                    │ residue:thin    aspirational  drift report  report
```

What the framework contributes **at each foundry boundary** (each anchored, each
with its own status):

1. **intent→spec.** Gate = `domainspec-spec-feature` + `TAXONOMY.md`; residue
   lands in `domain_knowledge/<project>/discovery/` + vault `layer:market`/
   `layer:domain` nodes. **[PARTLY OWNED]** — the business floor is realized by a
   *single* example (`lean-code-validator`); vault `layer:domain` is self-described
   "Specs will be migrated here" and `layer:application` "Not yet used —
   forward-looking" (`ontology-conventions.md` App. B → ASPIRATIONAL).
2. **spec→test.** Strongest gate. `TEST-PIPELINE.md` maps each spec aspect file to
   test types *deterministically* (`states.md`→transition/negative/invariant;
   `operations.md`→rule/calc/postcondition/error; `interfaces.md`→contract).
   Residue = the `@source` traceability map: a spec aspect with no `@source`
   back-pointer is a **dropped** obligation, grep-auditable. **[LIVE]** — this is
   the most concrete vertical-Δ ledger the framework owns.
3. **spec→code.** Gate = code tags. Residue/drift = `CODE-TAG-DRIFT-REPORT*.md` +
   `code-tag-waivers.yaml` (waivers = *accepted* residue). `concept.concern:biz\|sys`
   types the code floor; `edges[]` carries `RELATIONSHIPS.md` labels and `spec_ref`
   points a code symbol at a SPEC row. **[LIVE]** — most realized vertical artifact.
4. **code→running.** Gate = `OBSERVABILITY.md` + `otel-verify`, which produces
   `OBSERVABILITY-REPORT.md` **change-requests** (not a verdict); the PASS/FLAG/BLOCK
   verdict is emitted one stage later by `domainspec-verify-feature`. Residue =
   uninstrumented spec'd behavior. **[LIVE]** — and that PASS/FLAG/BLOCK alphabet is
   **owned by `DISPATCH-COMPOSITION-MODEL.md §6`** (which records the kill of
   `pass|fail|mixed`); this boundary *inherits* it rather than coining it, so the two
   axes share a verdict alphabet natively. [point, don't re-derive]

**Killer feature — the two-axis residue ledger (marked: bookkeeping, not proof).**
Today the foundry's residue ledger accumulates **along the lifecycle** (runs→loss
map). The framework's per-boundary ledgers (`@source` map, drift report,
observability report) accumulate **down the tower**. Fused, every artifact carries
*both* coordinates: "what this transformation dropped horizontally" AND "what it
dropped across the floor below it." This is honest only because it is
**bookkeeping** — a navigable loss map keyed by (lifecycle-boundary,
ontology-floor) — **not** a correctness proof. Calling it a proof imports the
theorem (§2 naming hazard, §4). **Constructibility caveat:** the full two-coordinate
ledger is **not yet buildable** — its ontology-floor coordinate is undefined for the
system floor, which has no home (§7 BLOCKER). It is constructible **today only at the
LIVE floors** (spec→test, spec→code); the complete grid is blocked on §7.

## 4. Honest typing (subset rule applied to this doc)

- **Transferable, honest engineering.** The framework's spec→test boundary
  (`TEST-PIPELINE.md` deterministic mapping + `@source` ledger) and spec→code
  boundary (`CODE-TAG-SCHEMA.json` typed `edges[]` + drift report + waivers) port
  *today* with no unproved claim. They are real typed-residue ledgers for *their*
  boundaries — `@source` absence and drift rows fire **mechanically** (grep /
  report), which is exactly what §5 demands. `register-dispatch`'s two-append
  discipline (`subagents-dispatch.yaml`, dispatch row + close row) is the
  envelope-producer that `DISPATCH-COMPOSITION-MODEL.md §12.3` already assigns to the
  observability seam (View 04) — point at DCM, don't restate the wiring.
- **Metaphor — must stay marked, never built as proved.** Treating the framework's
  *typed edges* as a residue **type** for the foundry's open seam (the sibling §7
  blocker) is a **candidate**, not a certification. `RELATIONSHIPS.md` edges type
  *spec/code relationships*; they are not the Lan/colimit residue object of
  `FunctorialResidueStructure.lean`. Any narrative that says "the framework's typed
  edges *certify* a foundry residue is lossless" is rejected here by the subset
  rule — same kill the sibling `DESIGN.md §4` applies to the Lean theorem.

## 5. Collapse-test of the central claim

> **Claim:** the framework FILLS the foundry's open seams — its taxonomy + typed
> edges + ontology-view give the OPEN residue-type seam (sibling `DESIGN.md §7`;
> View 01) a real, mechanical type.
> **Collapse-test:** if the framework's contribution at a seam is a typed edge that
> *names* a relationship but never **mechanically fires** a Pass/Flag/Block gate —
> if it is `layer:domain` prose, an aspirational floor, or a reserved dispatch type
> with no populated mechanism — then it collapses to a **residuality-spec the
> sibling `DESIGN.md §5` already kills**: prose "what we dropped" with no type that
> triggers the gate. **Contribution zero.** The fill is real only where the
> framework's residue ledger fires automatically — i.e. at spec→test (`@source`
> grep-audit) and spec→code (drift report / waivers), which *do* fire. It is
> aspirational everywhere the floor has no home (§7 BLOCKER).

## 6. Smallest coherent unit (build this first)

Do **not** wire the whole grid or write a tower manifesto. Build **one** boundary
that already fires mechanically, against the collapse-test directly:

- **The spec→test `@source` residue gate, landed on a foundry sigil's output.**
  Take an existing Arcanum sigil's claimed behavior, express it as spec aspects,
  run `TEST-PIPELINE.md`'s deterministic mapping, and treat any aspect with no
  `@source` back-pointer as a typed `Flag`. This is the smallest unit *that
  exercises the vertical axis* — **not** the project's smallest unit overall: it sits
  **on top of** the sibling's smaller `subset-rule` gate (sibling `DESIGN.md §6`,
  claim ≤ evidence), which is a prerequisite. It proves the framework's vertical
  ledger ports into the foundry *and* survives §5 (verdict is grep-driven, not prose).
- If it survives → layer up to spec→code (drift report as residue) and only then
  attempt the OPEN business/system floors.

**Layered proof progression** (each layer must unlock a distinct decision):
`spec→test @source gate (LIVE)` → `spec→code drift/waiver ledger (LIVE)` →
`code→running observability residue (LIVE)` → `business floor type (PARTLY OWNED)`
→ `system-ontology floor (OPEN — has no home)`. Build down the LIVE floors first;
the OPEN floors are forecast, not work-ready.

## 7. Open / unresolved (blockers vs non-blockers)

- **(BLOCKER — load-bearing)** The **system-ontology floor has no home.** There is
  no `system_design_knowledge/` in the framework repo; the system floor exists only
  as `@sys` tags + the `TAXONOMY.md` "Primary Layer" column. Until the middle floor
  of the tower has a real artifact home, the vertical axis has a *hole between
  business and code*, and any claim that the framework "completes the tower"
  collapses (§5). This is the framework-side mirror of the sibling §7 type blocker:
  there the residue has no type; here the middle floor has no home. **Resolve via a
  `research` dispatch** on whether the system floor should get a dedicated home or
  remain an edge-only (`@sys`) projection — do not scaffold by hand.
- **(BLOCKER for View 01 fill)** Whether the framework's typed edges
  *mechanically* fire a gate at the foundry's residue-type seam, or merely name it.
  `TO-VLAD2.md` owns only the *underlying* pattern — *Arcanum needs a typed
  node/edge surface like the framework's `TAXONOMY.md`+`RELATIONSHIPS.md`*; point at
  it for that. But the claim that this typed surface is a **second residue-type filler
  competing with the Lean type** is **this packet's own `[inference]`** (the novel
  View 01 contribution) — TO-VLAD2 does **not** make it. Keep it marked as inference,
  not dressed as an owned diagnosis, until a `research` dispatch in the Lean repo
  resolves whether the type fires a gate or only names one.
- **(Non-blocker)** Vault `layer:domain`/`layer:application` are self-described
  aspirational; the business floor is one example (`lean-code-validator`). Real but
  thin — populate, don't redesign.
- **(Non-blocker)** README count drift: README claims 24 meta-types / 26 edges;
  actual is **25** (14 Backend + 11 UI) / **29** (15+8+6). Fix the doc; it does not
  block the build.
- **(Non-blocker)** Reserved dispatch types `code`/`plan`/`suggestion`
  (subagents-strategy `SKILL.md`) are empty scaffolding; constitution authority is
  split (live vault v0.3.0 vs proposal v0.6.1). Note, don't lean on them.

## 8. Trace

- Venue: this packet lives in
  `domainspec-core/projects/cyber-alchemy-lean-fusion/framework-integration/`, a
  sibling to the foundry packet at the project root. No frontmatter, matching the
  sibling packets deliberately.
- Considered routes: "the framework IS the foundry's missing core" (rejected —
  overclaim; the framework is a *second axis*, not the conscience MAP.md already
  owns); "re-derive the residue type from the taxonomy" (rejected — TO-VLAD2 owns the
  typed node/edge *pattern*; the competing-type-filler thesis is this packet's own
  `[inference]`, marked as such in §7, not re-narrated); **"two-axis seam-filler
  design packet" (chosen)**.
- Rejected framing: "the framework's typed edges certify the foundry's residue is
  lossless" — killed by the subset rule (§4), same kill the sibling applies to the
  Lean theorem.
- Naming hazard held: "domainspec" in `MAP.md`/views = theorem+core; this packet's
  subject = the framework (§2). Stated explicitly so the disambiguation is not
  lost downstream.
- Pushback recorded: the honest new contribution here is **only** the
  framework-as-filler thesis for the OPEN seams. Most of the integration is already
  owned (TO-VLAD series, `DISPATCH-COMPOSITION-MODEL.md`) and is *pointed at*, not
  re-narrated. A request to treat the whole tower as built was redirected — two
  floors (system, business) are OPEN/aspirational (§7).

## 9. Next route

1. Run a `research` dispatch on the §7 BLOCKER: *should the system-ontology floor
   get a dedicated home, or stay an `@sys` edge-only projection?* — verdict-per-
   option, collapse-tested. Do NOT scaffold a floor by hand.
2. In parallel, route the View 01 fill question to sibling `DESIGN.md §7` +
   TO-VLAD2 — confirm whether the framework's typed edges fire a gate or name one.
3. If the LIVE floors hold under §5 → prototype the spec→test `@source` gate sigil
   (§6) against a real Arcanum sigil's output, and run it at the collapse-test.

Owner: Victor. This packet stays a SEED until step 1 returns a home-or-projection
verdict and step 3's gate fires mechanically rather than in prose.
