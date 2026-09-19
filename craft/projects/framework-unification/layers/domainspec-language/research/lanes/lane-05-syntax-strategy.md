# Lane 05 — Syntax Strategy (Decision Gate)

## Summary

The first syntax surface for the DomainSpec Language is a blocker-level decision the handoff explicitly forbids resolving silently: `DOMAINSPEC-LANGUAGE-HANDOFF.md` Non-Goals (lines 119–120) bar choosing "YAML-only, DSL-only, or dual-surface syntax without a recorded decision," and the Suggested Route (line 129) routes this exact choice through `decision-gate`. This lane frames that gate rather than picks for the owner. The dominant evidentiary fact is that **every** structured artifact in the current corpus is already YAML for machine-checkable shape (`dispatch.schema.yml`, `CRAFT-INTERFACE-LEDGER-SCHEMA.yml`, `CRAFT-INTERFACE-EXAMPLE.yml`) and Markdown for semantic contract narrative (`CRAFT-INTERFACE.md`, `invoke/handoff.md`) — there is zero DSL in the corpus, and the contract/schema split already runs along the `.md`/`.yml` line (see Lane 02). Four options are scored against six criteria. The recommended provisional option is **D — YAML-canonical with an optional DSL projection deferred**: it validates the existing corpus on day one, reuses the JSON-Schema tooling dispatch-spec already depends on, keeps the contract (`.md`) vs schema (`.yml`) surfaces separated as the handoff demands (lines 33–62, 119–123), and preserves a one-way door to a DSL later without paying DSL cost now. This recommendation is provisional and must be ratified by the user/owner at the gate before any implementation work pack proceeds.

---

## 1. Decision statement and why it blocks

**Decision to record:** _Which concrete syntax surface does the first validateable DomainSpec Language slice validate — canonical YAML, a dedicated DSL, dual-surface YAML+Markdown front-matter, or YAML-canonical with a deferred DSL projection?_

This is a true blocker, not a preference, for four reasons grounded in the seed docs:

1. **The handoff bars proceeding without it.** Non-Goal line 119–120 forbids choosing any of these "without a recorded decision," and Completion Criteria (line 153) require the next pass to "identify a first syntax strategy." Implementation cannot start (`DOMAINSPEC-LANGUAGE-HANDOFF.md` line 113: "Do not implement a parser before this design exists") until the surface is fixed.
2. **It is upstream of the first work pack.** Suggested Route steps 4–5 (lines 130–131) — "Produce a first work pack" then "Build the smallest validateable language surface" — both depend on knowing what to validate. A validator and a parser have entirely different shapes for YAML vs a DSL.
3. **It carries a one-way-door cost in the wrong direction.** Picking a bespoke DSL first means writing a grammar, parser, and editor support before any contract can be validated, and stranding the existing corpus (`CONTEXT-PACK.md` lists ten existing artifacts, all YAML/MD). Picking YAML first is the cheaply reversible direction — a DSL can later compile _to_ the canonical YAML model.
4. **It interacts with the contract/schema separation invariant.** The handoff (lines 33–62) and `CONTEXT-PACK.md` design risks (lines 163–172) demand that semantic contracts not collapse into structural schemas. The syntax choice can either preserve or erase that boundary (a single DSL surface tends to fuse them; the current `.md`+`.yml` split keeps them apart — see Lane 02).

The gate must therefore be resolved **before** the first implementation work pack (Suggested Route step 4) and before any parser/validator code.

---

## 2. Options

All options share the same underlying language _model_ (contract / schema / iteration / use_case families per `CONTEXT-PACK.md` lines 134–145). They differ only in the concrete authoring + validation _surface_.

### Option A — YAML-first with a canonical schema dialect

**Description.** Define the language as a set of YAML document kinds validated by a canonical JSON-Schema dialect (the dispatch-spec pattern), with semantic contract content also expressed as YAML fields rather than prose. One surface (YAML) for everything.

- **Pros:** Single parser/validator stack; directly reuses the `$schema: .../2020-12/schema` approach already in `dispatch.schema.yml` (lines 1–2); fully machine-checkable; agents author it reliably.
- **Cons:** Pushes semantic obligations into free-text YAML fields, exactly the collapse dispatch-spec already shows — `boundary.contract: { type: string }` (`dispatch.schema.yml` lines 589–591) is a validator-opaque string. Risks violating the handoff's anti-collapse Non-Goal (lines 124, "Do not treat prose documentation as enough for validation" inverts here into "do not bury contract meaning in unvalidatable strings"). Loses the readable `.md` contract narrative humans currently use (`CRAFT-INTERFACE.md` is 382 lines of human-facing method semantics).
- **Cost:** Low–moderate (schema authoring only; no new parser).
- **Reversibility:** High.
- **Evidence fit:** Partial. Matches every `.yml` artifact but discards the `.md` contract layer that carries authority/invariants today.

### Option B — Dedicated DSL

**Description.** A purpose-built DomainSpec grammar (e.g. block syntax for `contract`, `schema`, `iteration`) with its own parser and validator.

- **Pros:** Best long-term authoring ergonomics for a mature language; can encode the contract/schema/iteration distinction as first-class keywords; can enforce semantics the YAML validator cannot.
- **Cons:** Highest upfront cost (grammar + parser + error reporting + editor support) before a single existing artifact can be validated; **strands the entire current corpus** — all ten sources in `context-index.json` are YAML/MD and would need migration before the first live test (Suggested Route step 6, lines 132–133, expects Craft _and_ a non-Craft fixture to run). Highest risk of premature lock-in the handoff warns against (`CONTEXT-PACK.md` line 167: "Choosing syntax too early could hide the deeper model question").
- **Cost:** High.
- **Reversibility:** Low (a grammar, once authored and adopted, is expensive to walk back).
- **Evidence fit:** Poor. No DSL exists in the corpus; everything would be net-new and migrated.

### Option C — Dual-surface YAML + Markdown front-matter

**Description.** Authoritative semantic contracts live as Markdown documents carrying a YAML front-matter header; schemas remain standalone YAML. Validation reads both: front-matter for machine-checkable contract metadata, prose body for human narrative, separate `.yml` for structural schema.

- **Pros:** Closest match to **what the corpus already is** — `CRAFT-INTERFACE.md` already opens with quasi-front-matter (`Status: candidate-local`, `Date:`, `Task:`, `Storage model:`, lines 3–6) and `invoke/handoff.md` carries an Identity block (lines 3–6). Preserves the contract(`.md`)/schema(`.yml`) split the handoff demands (lines 33–62) and that Lane 02 documents. Humans keep readable contracts; validators get a checkable header.
- **Cons:** Two parsers/validators (front-matter YAML + standalone YAML) and a rule for which surface owns a given fact; risk of drift between prose body and front-matter; "dual-surface" is the term the handoff names as needing a recorded decision (line 120), so this option must be explicitly justified, not defaulted into.
- **Cost:** Moderate (front-matter extraction + two schema validators; no grammar).
- **Reversibility:** High.
- **Evidence fit:** Strong. Formalizes the existing `.md`+`.yml` convention with minimal change.

### Option D — YAML-canonical with optional DSL projection later (RECOMMENDED, provisional)

**Description.** The canonical, validated artifact is YAML (schemas) plus Markdown contracts with a small **required** YAML front-matter block (the machine-checkable contract metadata: id, kind, status, authority, lifecycle, `requires_schemas`). The validator's authority is the YAML model. A dedicated DSL is explicitly named as a **deferred, optional projection** that, if ever built, must compile _to_ the canonical YAML model — never the reverse. First validateable slice ships against the existing corpus.

- **Pros:** Validates the current corpus on day one (Suggested Route step 6 fixtures are already YAML/MD); reuses the JSON-Schema 2020-12 stack from `dispatch.schema.yml`; preserves the contract/schema separation (front-matter + body for `.md` contracts, standalone `.yml` for schemas) per handoff lines 33–62 and Lane 02; keeps the deeper model question primary as `CONTEXT-PACK.md` line 167 urges, by _not_ committing to a grammar; leaves a clean one-way door to a DSL (compile-to-canonical) so the DSL option is preserved, not foreclosed.
- **Cons:** Defers DSL ergonomics (acceptable — agents author YAML well today); requires a stated rule that front-matter, not prose, is the validation authority for contract metadata, so prose cannot silently become canonical (mirrors the Craft source-of-truth gate: `.craft/ledger.yml` authoritative, `CRAFT.md` a view — `CRAFT-INTERFACE-LEDGER-SCHEMA.yml` lines 5–12, `CRAFT-INTERFACE-EXAMPLE.yml` lines 5–6).
- **Cost:** Moderate (same validator work as C, plus a recorded "DSL compiles to canonical YAML" constraint; no grammar now).
- **Reversibility:** High, and _directionally correct_ — it is the only option that explicitly keeps the DSL door open while paying no DSL cost.
- **Evidence fit:** Strong. Identical corpus fit to C, plus an explicit deferral that satisfies the handoff's "first syntax strategy" requirement without overcommitting.

> Note: Options C and D are close cousins. The substantive difference is that **D adds an explicit canonical-authority rule (front-matter/YAML is the validated truth) and an explicit, governed deferral of the DSL**, turning "dual-surface" from an unbounded commitment into a bounded, reversible first slice. D is C made gate-safe.

---

## 3. Decision criteria

| #   | Criterion                                     | Why it matters (evidence)                                                                                                                                                                                                          |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Validator simplicity**                      | First deliverable is "the smallest validateable language surface" (handoff line 131). Reusing the existing JSON-Schema stack (`dispatch.schema.yml` lines 1–2) minimizes new machinery.                                            |
| C2  | **Authoring ergonomics — humans AND agents**  | Contracts today are human-readable Markdown (`CRAFT-INTERFACE.md`); agents already emit structured YAML reliably (the example fixture `CRAFT-INTERFACE-EXAMPLE.yml`). Both audiences must stay served (`CONTEXT-PACK.md` line 14). |
| C3  | **Reuse of existing YAML/MD corpus**          | Ten sources in `context-index.json`, all `.yml`/`.md`. The first live test uses Craft + one non-Craft fixture (handoff lines 132–133) — those fixtures exist _now_ only in YAML/MD.                                                |
| C4  | **Separation of contract vs schema surfaces** | The handoff devotes a whole section to this (lines 33–62) and lists collapse as a top design risk (`CONTEXT-PACK.md` lines 163–172). Lane 02 shows the split already runs on `.md` vs `.yml`.                                      |
| C5  | **Migration cost**                            | A DSL forces migrating the whole corpus before the first test; a YAML-canonical surface forces none.                                                                                                                               |
| C6  | **Reversibility / preserved options**         | The choice must not foreclose a future DSL (handoff line 167 warns against premature syntax lock-in).                                                                                                                              |

---

## 4. Scored comparison and recommendation

Scoring: 1 (poor) – 5 (strong), per criterion, evidence-grounded above.

| Criterion                             | A: YAML-only | B: DSL | C: Dual-surface | D: YAML-canonical + deferred DSL |
| ------------------------------------- | ------------ | ------ | --------------- | -------------------------------- |
| C1 Validator simplicity               | 5            | 1      | 3               | 4                                |
| C2 Authoring ergonomics (human+agent) | 2            | 4      | 4               | 4                                |
| C3 Corpus reuse                       | 4            | 1      | 5               | 5                                |
| C4 Contract/schema separation         | 1            | 3      | 5               | 5                                |
| C5 Migration cost (5 = lowest cost)   | 4            | 1      | 4               | 5                                |
| C6 Reversibility / preserved options  | 4            | 2      | 4               | 5                                |
| **Total (max 30)**                    | **20**       | **12** | **25**          | **28**                           |

**RECOMMENDED (provisional): Option D — YAML-canonical with an optional DSL projection deferred.**

**Rationale.**

- It is the only option that scores 4–5 on every criterion. It does not win C1 outright (pure YAML-only A is marginally simpler because it has one fewer surface), but it pays a small validator-complexity cost to _keep the contract/schema separation_ the handoff mandates — A's collapse of contracts into free-text YAML fields (the `dispatch.schema.yml` `contract: string` anti-pattern, lines 589–591) is precisely what Non-Goals (line 124) and design risks (`CONTEXT-PACK.md` lines 163–172) warn against, so A's C4 score of 1 disqualifies it as a _first_ surface even though it is cheap.
- It validates the existing corpus on day one (C3, C5), satisfying Suggested Route step 6's requirement to live-test Craft and a non-Craft fixture (handoff lines 132–133) without a migration project.
- It explicitly preserves the DSL as a future _projection that compiles to canonical YAML_ (C6), honoring "Choosing syntax too early could hide the deeper model question" (`CONTEXT-PACK.md` line 167) — the DSL is deferred, not denied.
- It formalizes the source-of-truth discipline the corpus already practices: structured YAML is authoritative, human view is derived (`.craft/ledger.yml` source vs `CRAFT.md` view — `CRAFT-INTERFACE-LEDGER-SCHEMA.yml` lines 5–12). Front-matter/YAML is the validation authority; prose is a view, not canon.

**This recommendation is provisional and not adopted.** Per `DOMAINSPEC-LANGUAGE-HANDOFF.md` lines 119–120 and Suggested Route step 3, the owner/user must ratify the chosen option at the decision-gate before the first implementation work pack (step 4) is authored.

---

## 5. What this gate does NOT decide (deferred)

- **The DSL grammar itself.** D defers all DSL design; only the _constraint_ that a future DSL compiles to canonical YAML is recorded now.
- **The canonical YAML schema dialect details** (exact `$id` conventions, version field shape, `$defs` reuse). That is downstream schema-design work, informed by Lane 02 (contract↔schema references) and Lane 01 (document kinds).
- **Which contract metadata is mandatory in front-matter vs prose body.** D requires _that_ front-matter be the validated authority; the exact required-field list is work-pack scope.
- **Iteration-record attachment** (how change records bind to contracts/schemas) — owned by Lane 03.
- **Promotion/lifecycle gating** (candidate → canonical) — `context-index.json` `required_next_questions[4]`; not a syntax question.
- **Editor/tooling support, error-message format, and round-trip rendering** of `.md` views from canonical YAML.

---

## 6. Open questions and risks

1. **Front-matter authority drift (D, C).** If the prose body of a contract and its YAML front-matter disagree, which wins, and how does the validator detect drift? Mitigation: declare front-matter canonical and add a validator rule that flags prose claims not represented in front-matter — analogous to the Craft "Markdown view is not source of truth" gate (`CRAFT-INTERFACE-EXAMPLE.yml` lines 5–6).
2. **Free-text fields remain validator-opaque (all options).** Even canonical YAML carries narrative strings (dispatch-spec `contract` / `condition` fields). The gate does not solve "validate the _meaning_ of an obligation," only its shape and presence — a known limit to record, not close.
3. **Non-Craft fixture coverage.** The recommendation rests on `dispatch.schema.yml` and `invoke/handoff.md` being representative non-Craft surfaces. `handoff.md` is currently prose-only with a thin Identity block (lines 3–6); confirm a front-matter contract can capture its Output Contract / Mode Gates (lines 93–122) without losing fidelity before ratifying D.
4. **Two-validator maintenance (C/D).** Front-matter YAML + standalone schema YAML means two validation paths and a surface-ownership rule; weigh against A's single path. Recorded as the price of preserving C4.
5. **Premature-lock-in residue (B).** If the owner later wants DSL ergonomics, D's "compile-to-canonical" rule must actually hold; if a future DSL is allowed to add semantics the YAML model cannot express, the one-way door breaks. Record as a constraint on any future DSL lane.
6. **Scope creep into the model question.** `CONTEXT-PACK.md` line 167 warns syntax can mask the deeper "what agreement is represented?" question. Risk: ratifying D is read as "the model is settled." It is not — D is a _surface_ decision; Lanes 01–03 own the model.
