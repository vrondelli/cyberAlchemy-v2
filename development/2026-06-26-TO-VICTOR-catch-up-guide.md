# To Victor — Catch-Up Guide (CAV2 authority + determinism)

A human onboarding guide, written 2026-06-26, so you can catch up on where we are and why.
Read this top-to-bottom once; then follow the **reading path** at the end for depth.
Boundary: INTERNAL — explains the governance + determinism *concepts* freely; the engine *algorithm*
itself is the moat and is deliberately not written down anywhere, here included.

## 60-second picture
We're building **a system that builds systems**. Three pillars:
- **DomainSpec** — the *what* (typed intent → implementation). Private.
- **Arcanum** — the *how* (sigils/spells; the public capability framework).
- **Saturn** — the *loop* that closes intent↔reality with evidence (intended, mostly unbuilt).

**`cyberAlchemy-v2/` (CAV2)** is the private **authority spine** — the canonical vocabulary + the
promotion gates. **CAV2 is the highest context (the apex).** The engine: domain work produces
authority; whatever proves it holds *beyond its origin domain* gets promoted **up** to CAV2, which
accretes what survives. *Use domain authority to grow apex authority.*

## The CAV2 machine map (read this before the details)
Think of the whole thing as a **foundry that manufactures and maintains "domain authorities"** —
governed bodies of knowledge a client/domain can trust and build on. Four parts, by role:

```
   DomainSpec ......... the BASELINE   — typed intent → implementation (the substrate)
   Arcanum ............ the HANDS      — does the work: sigils/spells/ops      (PUBLIC)
   CAV2 ............... the HEAD/MOLD  — decides what counts; owns the vocabulary,
                                         the kinds, the gates, the promotion lifecycle
   Saturn ............. the NERVES     — the feedback loop closing intent↔reality
                                         with evidence            (intended, MOSTLY UNBUILT)
```
*(Underlying frame, if useful: Beer's Viable System Model — Arcanum = operations, CAV2 = the
governing "System-5", Saturn = the regulator loop. Source: the `machine-map-and-moat-synthesis`
inventory entry.)*

**The conveyor — follow one piece of knowledge through the machine:**
```
  domain work (Arcanum)                                 ┌─ promote UP to CAV2 (apex)
        │ produces                                      │   IF it holds beyond its
        ▼                                               │   origin domain (context-invariant)
   evidence ─► candidate ─►【 OWNER GATE 】─► promoted authority object ──┘
                              ▲               (typed · frozen · citable)
                              │                         │
                    deterministic validators            ▼
                    check every move:            CAV2 accretes the
                    · non-collapse (D29)          invariant  →  the apex
                    · closure (D49)               grows the trustworthy core
                    · build-from-owned (C17)
```
Three lenses on the same machine:
- **Ontology = the machine's MAP of itself** (the parts catalog: kinds, fields, relations). Describes; never decides.
- **Authority = the machine's DECISIONS** (what's allowed to count, by owner route). Decides; this is where things get promoted.
- **Determinism = the machine's QUALITY-CONTROL gates** (the validators above) — today hand-operated (review), being made automatic.

**The moat** is not any single clever algorithm — it's **attestation + governance-data + the vertical**:
the machine produces cheap, repeatable *proof* that its outputs followed the rules. (Determinism matters
because it drives that proof cost toward zero. Formal provability is an amplifier on top, not the moat.)

**Honest caveat for Victor:** the *mold works but is hand-operated* — CAV2 governs in **method/posture,
not yet automated enforcement**. Saturn (the feedback loop) is **mostly unbuilt**. So most of this map is
**the design we're building toward**, not a running system. The first real build is the deterministic
validation layer (below).

## The mental model (4 things to internalize)
1. **Ontology vs Authority — map vs territory.**
   - *Ontology* (`cyberAlchemy-v2/ontology/`) = the **structural model** of authority objects (kinds,
     fields, relations, lifecycle *shape*). It **classifies and routes; it never decides or promotes.** The map.
   - *Authority* (`cyberAlchemy-v2/authority/`) = the **actual authority + governance** (definitions
     D1–D50, constitutions, decisions, promotion-policy). Where things get promoted and **count.** The territory.
   - Bridge: the `AUTHORITY-KINDS` table points each kind → its owner route + authority surface.
2. **One promotion lifecycle (`CAV2-D48`).** `source evidence → candidate → owner-routed review →
   promoted → (optional) invariant/constitution pressure`. Patterns (`D43`), experience (`D46`),
   disciplines, and the promotion-policy ladder are all *instances* of it.
3. **Non-collapse + claim≤proof are the discipline.** Every kind/axis stays orthogonal (`D22`/`D29` +
   the 7 AUTHORITY-MODEL Non-Collapse Rules); never say more than the evidence carries (`D38`).
4. **CAV2 is a reflexive meta-authority MOLD; each domain authority is a casting.** Today the mold is
   **hand-operated** (review-mode), not yet a machine.

## What we're actually building next: deterministic validation
The thesis: **every governance rule reduces to an SMT query over schema-typed records.** Once each
authority object is a *typed record*, "are these two distinct?", "is this kind allowed?", "does an owner
already exist?" become **decidable checks with a yes/no + a counter-witness** — instead of a human squinting.
- **Three specced validators** (siblings, one shared SMT adapter): **non-collapse** (`D29`), **closure**
  (`D49`), **build-from-owned** (`C17`).
- **Gated by OQ-1 / `G2`:** nothing deterministic works until the corpus is typed (the *instantiation
  chain* — `instantiates` + `specializes`). So **step 0 is organizing the corpus**, not coding validators.
- **Honest boundary:** the machine decides *given an encoding*; the *encoding choice* and *absolute
  non-thinness* (the "is this a real distinction or a thin re-skin" question — the count-collapse frontier
  from the Lean work) stay human review. Deterministic core + review shell.
- **Why it matters:** it collapses the attestation surface toward zero (the moat = attestation +
  governance-data + vertical; provability is an amplifier, not the moat), catches drift/redundancy *every
  time before authoring*, scales governance past human review, and turns the mold into a self-validating
  machine. **Intended, not shipped** — zero validators exist today.

## Where we are right now (2026-06-26)
Decided this session (mostly candidate, not enacted):
- CAV2 = apex; import-up / reference-down.
- The upward-promotion engine is **build-from-owned** of existing `D23`/`D43`/`D48` (don't reinvent;
  `D48` just needs a *context dimension* added).
- **build-from-owned = the dual of the non-collapse test** (same SMT core, opposite polarity).
- Organizing the corpus = the **instantiation chain** (`D48` meta → `D43`/`D46` specialize it → records),
  on three orthogonal axes (kind / meta-instance / tower).
- The `specializes` relation needs *two* homes: ontology (its shape) + authority (its meaning =
  reference/derive, **not** inherit). Pilot designed, **not built**.

Findings worth knowing:
- `non-collapse` and `build-from-owned` are **load-bearing but under-defined**: `non-collapse` has no
  canonical term (it's an umbrella over `D22`/`D29` + rules); `build-from-owned` is constitution rule
  `CAV2-C17` (candidate) but has no definition. Both are now **queued** in `DEFINITION-DRIFT-AUDIT.md`.

## The queue / next actions (in order)
1. **Read `cyberAlchemy-v2/ontology/RELATION-MODEL.md`** — check if a `specializes`/`instantiates` edge
   already exists before building (build-from-owned applied to the edge itself). *Immediate next step.*
2. Build the **D48-cluster instantiation pilot** (ontology edge + authority meaning rule), candidate.
3. **Define** `build-from-owned` (+ `non-collapse`) and **promote `C17`** candidate→canonical.
4. Stabilize the authority-object schema (`G2`) → clears OQ-1 → then build the SMT adapter + 3 validators.
5. Still open from before: `ledger` promotion HELD (4/5 conditions); `tracking` validating-constitution rule.

## Reading path (depth, in order)
1. `cyberAlchemy-v2/CLAUDE.md` (routing) → `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md` (kinds + non-collapse rules).
2. Inventory syntheses (candidate read-models, in `.arcanum/inventory/entries/`):
   - `cav2-authority-and-determinism-synthesis.md` — the integrated picture.
   - `deterministic-validation-for-all-cav2-synthesis.md` — the validation build plan.
   - `cav2-ontology-authority-organizing-synthesis.md` — the organizing decisions (9-row table + residue).
   - `non-collapse-and-build-from-owned-definitions-map-synthesis.md` — where these terms live + the gaps.
3. The technical handoffs (`cyberAlchemy-v2/.../development/2026-06-26-*`): the build-from-owned validator
   + the ontology↔authority organizing resume packet.

## Ground rules (so you don't trip the wires)
- **Claim ≤ proof.** Most of the above is *candidate / intended*, not shipped. Say so.
- **Public/private boundary.** `arcanum/` is public; never leak private cav2 prose or the engine algorithm into it.
- **Propose before mutating** authority artifacts; the owner route decides, not proximity or usefulness.
- **Submodule discipline:** submodule first, parent last; `make bump-check` before pushing.
