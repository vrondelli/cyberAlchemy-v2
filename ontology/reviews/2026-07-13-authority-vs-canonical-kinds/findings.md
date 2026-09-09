# findings.md — authority-kind vs canonical-kind

Dispatch: `2026-07-13-authority-vs-canonical-kinds` · `dispatch_type: review` · `final_approver: parent`
Agents: 3 attackers (`explorer`, `robot_talks: true`) → 2 verifiers (`skeptic`). Gate: `check-tension` (2, both PASS).
`exit_reason: resolved` · `agents_spawned: {explorer: 3, skeptic: 2, helpers: 2 (gate)}` · `loops_used: 1`

**Question.** Is the Tier-1 (`canonical_kind`) / Tier-2 (`authority_kind`) split load-bearing, or a
disguised duplication?

**Answer.** The tiers *are* a duplication — but this review's own case for that was **partly built on
text that does not exist**, and the duplication **governs nothing today**. The one finding with a live
daily consumer is not about the tiers at all. Read §0 before anything else.

---

## §0 — READ FIRST: three quotes the attackers used do not exist in the corpus

Both verifiers, independently and on different attack-vectors, found the same fabrications. The
parent (strategist) then re-verified each by direct grep. **Confirmed.**

| # | Quote used by attackers | Attributed to | Reality |
|---|---|---|---|
| Q1 | *"Under lookup, that lie is not merely forbidden — it is **inexpressible**. Structure beats prose."* | `CANONICAL-KINDS.md` §"The law: type-level is looked up, never decided" | **Zero hits** for `inexpressible`, `Structure beats prose`, or that heading — worktree AND `HEAD`. Cited with line numbers by Ashby, Lawvere (N1) and Bénabou (N1). |
| Q2 | *"Status: candidate. Scoped to `authority_kind: Evidence` (owner, 2026-07-13); the other authority kinds have no instance contract yet."* | `CANONICAL-KINDS.md:146` | **Actual text (`:100-101`):** *"Status: candidate. **Written for `discovery`, `research`, and `findings`. Every other kind is deferred — no contract is asserted, and none may be inferred from these three.**"* |
| Q3 | *"Storing a derived value is how a table rots"* / *"`findings` — added 2026-07-13 (owner instruction)"* | `CANONICAL-KINDS.md` Kind Contract / row note | Neither string exists. The file's `(owner instruction)` note is at **OQ-6**, about the `process: none` widening — a different edit. |

**Why this matters more than any single finding.**

- **Q2 destroys the pro-split case.** Bénabou's one surviving hold — *"the coarse label carries an
  owner-ratified instance contract quantified over `authority_kind: Evidence`, so a `bool` cannot
  name the ten"* — rests entirely on Q2. The real contract quantifies over **three fine kinds** and
  **expressly forbids** inferring anything to the other Evidence kinds. **The coarse label carries no
  contract.** The split's last defense is not weakened; it is absent.
- **Q1 guts the anti-split case's sharpest CRITICAL.** The lookup law *is* in the file
  (`:108-111` — *"Type-level facts are looked up, never declared… Were they declarable, an artifact
  could write `authority_kind: Definition` into itself and self-promote"*), so the substance stands.
  But the rhetorical "inexpressible" framing was invented, and both verifiers report a **mirror
  clause** in the same rule licensing an instance to carry `authority_kind` as frontmatter — which,
  if it holds, means the admission schema is not violating the law, only failing to constrain it.
- **The `robot_talks` round propagated the fabrication.** Q1 and Q2 appear in the *final* positions of
  agents who did not hold them initially. `attacks.md`'s convergence check reads the three-way
  agreement as evidence of soundness. **It is at least partly evidence of a shared fabrication moving
  through the discussion round.** This is a defect in the dispatch, not in the corpus, and it is
  recorded here so the convergence is never cited as independent confirmation.

**Method note.** `CANONICAL-KINDS.md` was **modified during this session** — 276 lines when the parent
first read it, 384 at verification time (190 insertions / 81 deletions vs `HEAD`). The attackers read a
newer state than the parent's opening framing. Some line-number mismatches trace to this; the
fabrications do not — those strings are absent from every state checked.

---

## §1 — Surviving findings

A finding survives only if neither verifier could refute it. Refuted findings are **dropped, not
softened**. 24 candidate findings entered verification; 9 survive.

### `CLAUDE.md` / `AGENTS.md`

| # | evidence | severity | proposed fix |
|---|---|---|---|
| 1 | `CLAUDE.md:42` and `AGENTS.md:42` (byte-identical), route 3: *"Routing: `cyberAlchemy-v2/SOURCE-MAP.md`, `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md`."* — **`authority/AUTHORITY-MODEL.md`, the file whose header reads `Status: active local authority model`, is named in neither router file.** Parent-verified by grep. | **CRITICAL** | Replace the `AUTHORITY-KINDS.md` pointer with `authority/AUTHORITY-MODEL.md` in both files. One line, two files. |

**This is the only finding in the set with a live, daily consumer** (Wittgenstein). Every agent that
routes to definitions/vocabulary governance is sent to the candidate copy. It is plausibly the causal
mechanism of the duplication: an agent arrives at the stale table, finds it insufficient, and authors
a new one. **Ship this regardless of what happens to the merge.**

**Verdict: FIX.**

### `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md`

| # | evidence | severity | proposed fix |
|---|---|---|---|
| 2 | Drifted from the active table: Evidence owner route reads *"source/inventory owner"* vs AUTHORITY-MODEL's *"source, inventory, validation, **or observability** owner"*; Discipline's `forbidden_collapse` has **zero overlap** with AUTHORITY-MODEL's. And it **omits the catch-all default-deny row entirely** — the row CAV2-D49 says enacts closure. | **MAJOR** | Delete the file, or reduce it to a one-line tombstone pointing at AUTHORITY-MODEL §Authority Kinds. |
| 3 | `git log --diff-filter=A`: this file is `7e776e65`, **2026-06-21**; `authority/AUTHORITY-MODEL.md` is `224331e4`, **2026-06-24**. AUTHORITY-MODEL calls it a *"candidate model view"* — a file cannot be a view of a table three days its junior. | **MAJOR** (demoted from CRITICAL: "view" is a status claim, not a derivation claim — Hacking) | Strike the "candidate model views" sentence; the tombstone in #2 subsumes the rest. |
| 4 | Declares a `candidate_inputs` field in its Kind Contract that its only table never renders. | MINOR | Subsumed by #2. |

An agent routed here (#1) mis-routes an Evidence candidate — the file drops two of Evidence's four
owners — and **never learns that unenumerated kinds are default-deny**.

**Verdict: FIX** (delete).

### `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`

| # | evidence | severity | proposed fix |
|---|---|---|---|
| 5 | **Neither `authority kind` nor `canonical kind` has a definition card.** Only CAV2-D49 (*closed authority-**kind** enumeration*) and CAV2-D51 (canonical **artifact**) exist — each defines a property of a set whose element-term is undefined, by pointing at the other's table. Verified by grep across D1–D56. **And the 2026-07-13 rebuild's proposed nucleus (D18/D34/D35/D38/D40/D49) does not add one either** — so both head terms will still be undefined after the rebuild lands. | **CRITICAL** | Write one card per head term, or concede there is no criterion distinguishing them and collapse (§2). This is a live Narrowest-Owner-Rule violation: the two most load-bearing terms in the spine have no owner-routed card. |

**Verdict: FIX.**

### `cyberAlchemy-v2/validation/artifact-admission/admission-record.schema.json`

| # | evidence | severity | proposed fix |
|---|---|---|---|
| 6 | `"canonical_kind": {"type": "string", "minLength": 1}` and `"authority_kind": {"type": "string", "minLength": 1}` — **no `enum` on either**, while `durability` and `authority_state` in the same schema **do** carry enums. **Neither enumeration is machine-enforced anywhere.** CAV2-D49's "closed, default-deny" exists in exactly one place: review prose. | **MAJOR** (demoted from CRITICAL — the "makes the lie a required field" framing rested on Q1; the README pre-declares *"validator not implemented"* and the schema is `candidate`) | Add `enum` to both fields; derive `authority_kind` from `canonical_kind` rather than requiring it on the instance. |

**Verdict: FIX.**

### `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md`

| # | evidence | severity | proposed fix |
|---|---|---|---|
| 7 | Header: *"Owner: CyberAlchemy v2 authority owner"* — a name that **appears nowhere in the file's own Narrowest Owner Rule table**. No movement row reads *"an artifact type is added, merged, split, or retired."* | **MINOR** (verifiers split — see §3) | Add the row: *"An artifact type is added, merged, split, or retired. → constitution-governance (gate: decision-gate)."* |
| 8 | The `Evidence` row's `Owner route` — *"source, inventory, validation, or observability owner"* — resolves to **no route in the Narrowest Owner Rule table**. The largest fibre (10 of 23 kinds) routes to a non-existent owner. | **MINOR** | Give Evidence a real owner route, or state that Evidence terminates and needs none. |

**Verdict: FIX** (both minor).

### `cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md`

| # | evidence | severity | proposed fix |
|---|---|---|---|
| 9 | **`OQ-8` does not exist.** Three rows (`implementation-plan`, `conceptual`, `readme`) route their unresolved status to it. The file's sections run OQ-1…OQ-7, then **OQ-9**, OQ-10. Three unresolved rows are tracked nowhere. (Wittgenstein's own finding, not an attacker's.) | **MAJOR** | Write OQ-8, or re-point the three rows. |

**Verdict: FIX.**

---

## §2 — The merge: what the review actually establishes

**The tiers are a duplication.** That verdict survives, but on a narrower base than the attackers
claimed:

- `authority_kind` was renamed from `coarse_group` and the drift audit certifies *"names only — no
  change to the term's meaning"*. **But** the renamed objects were CAV2-D51's **record fields**, and
  `canonical_kind` got the identical treatment (from `fine_type`) — so the inference proves Tier-1 is
  an attribute too, i.e. it proves nothing on its own (Hacking). **Demoted to a premise, not a
  finding.**
- CAV2-D51 formally asserts `CanonicalKinds ⊇ AuthorityKinds` — true on 8 of 9 rows, false only on
  `Evidence`. If the tiers were different *sorts*, that containment would be a **type error, not a
  theorem with one exception** (Bénabou's own concession). **But D51 is voted RETIRE by the rebuild
  and its arity mismatch is already flagged in the drift audit** — repairing a clause in a retiring
  card changes no act. **Demoted to MINOR.**
- The rollup is the identity on 8 of 19 resolved rows, sends ~10 to `Evidence`, one to a contested
  target (`readme → Projection`), and simply fails on 4. It records no *"validation, promotion, or
  blocking effect"*, so under CAV2-D16 **it is not a typed coupling — it groups rows in a document.**

**And the pro-split case is gone.** Q2 (§0) was its only load-bearing artifact. The coarse label does
not carry contracts. Closure asymmetry — Bénabou's last defense — was answered by Lawvere and conceded
by Bénabou: *"Closure is a property of a column's codomain, not of a table."* A single table can carry
an open, additive row-set and a closed 9-valued `authority_kind` column with default-deny. **That is
the repo's own CAV2-D29 axis-orthogonality invariant.**

**But the merge changes no governed act today.** No file carries a `canonical_kind:` field. The
validator is not implemented (`README:3`). The canonical branch of the admission schema has zero
instances. The 2026-07-13 decision says so itself and calls the non-conformance *"not defects to
fix"*. **Nothing reads either table.**

**Therefore: the merge is CHEAP AND URGENT, not a live defect** — the cost of delay, not the harm, is
the argument. Two clocks are running: (a) the AAV work-pack will compile `authority_kind` into a
validator's `required` list, at which point the merge stops being a text edit and becomes a data
migration; (b) the definitions rebuild retires D51, D52, D48, and D41 — deleting the rollup's only
formal carrier, `authority_bearing`'s only source, and downgrading D49.

**Recommended shape, if the owner merges** (all three attackers converged here, and the verifiers did
not refute the shape):

> ONE enumeration. `canonical_kind` open and additive over rows. `authority_kind` demoted to a
> **closed 9-valued column**, derived by lookup, never declared — **not** `authority_bearing: bool`
> (the parent's original proposal, rejected by his own red team). `AUTHORITY-MODEL`'s nine rows
> become the enum-domain dictionary for that column. `ontology/AUTHORITY-KINDS.md` is deleted. Both
> enums go into the admission schema. Owner: **constitution-governance**, gate: **decision-gate**.

**This review does not decide the merge.** It is a change-request set. The merge is an owner act, and
it must be sequenced against the definitions rebuild (§3).

---

## §3 — Refuted, and where the verifiers disagreed

**Dropped outright** (refuted; not softened):

- **The `axiom` "live contradiction"** — Bénabou's whole *"the split is a contradiction-hiding
  machine"* verdict, which Lawvere and Ashby converged onto. **Both verifiers killed it.**
  `AUTHORITY-MODEL:70-72` is about four **definition cards** not being blocked by default-deny, and
  **explicitly defers to OQ-2**; `CANONICAL-KINDS` says `unresolved — OQ-2 (provisionally governs as
  Definition)`. **The two documents agree**, and the 2026-06-23 decision books it verbatim. There was
  never a contradiction.
- **`promotion-policy.md` "re-enumerates 5 of 9 authority kinds incompletely"** — misread. That line
  is the **"Local authority" rung of a ladder**, not an enumeration. Evidence/Projection/Residue are
  `authority_reachable: no`; their absence from a *local-authority* rung is the rules being **obeyed**.
- **`process`/`owner_route` conflation** — already disclosed as OQ-6 and **already remedied by the
  owner on 2026-07-13** (seven rows set to `process: none`). The "malformed the `Process` column"
  self-indictment is about a *different* error (type-level vs instance-level), appropriated.
- **"definitions-governance certified a cross-boundary rename"** — the audit says *"(owner call)"* and
  *"No promotion gate (field-name change, not a term-semantics change)"*, and the renamed fields are
  D51's own. No boundary crossed.
- **"Four/five enumerations"** — `node_type` was overturned by decision-gate on 2026-07-13:
  *"`node_type` is hereby the old name of the same field. **It is not a second axis.**"* The residual
  (`concept_role` in NODE-MODEL + the two authority-kind copies) survives; the headline does not.
- **Rule-1 falsification, `backlog`/`ledger` durability, `must not collapse into` typing, `readme →
  Projection`, `candidate_inputs`** — all demoted to MINOR or refuted as disclosed OQs. A file that
  books its own defect as a numbered, owner-visible open question has **disclosed** it, not hidden it.

**Where the two verifiers disagreed — reported, not adjudicated:**

- **"No cav2 route was ever empowered to decide a type enumeration."** Wittgenstein: **survives** (who
  may amend is currently unanswerable). Hacking: **refuted** — two decision records show empowered
  routes (`2026-06-23`: *"Owner route: decision-gate + constitution-governance"*; `2026-07-13`:
  *"Owner: repository owner (Boscaro) · Route: decision-gate"*), and *"CyberAlchemy v2 authority
  owner"* is the declared **Steward** of `disciplines/cards/provisional-model-stewardship.md`. The
  narrow residual (finding #7) is what both would accept.
- **"The definitions rebuild already voted this merge."** Wittgenstein: **survives**. Hacking:
  **refutes the overclaim** — the rebuild decided **card status in the spine**, not table topology,
  and its own relocation map preserves *both* surfaces (*"`authority/AUTHORITY-MODEL.md` is itself the
  live control surface and should own its vocabulary"*). **The core question of this review is live.**
  What is true: findings on D51/D52/D48/D49 **restate the rebuild's published verdicts from one day
  earlier** — this dispatch is partly redundant with an in-flight review its own attackers were
  reading. Recorded as a dispatch defect.

**The "wip" commit.** Literally confirmed (`224331e4`, *"wip: … checkpoint in-progress work"*, carrying
the closure decision, the table it closes, and the catch-all row together). Both verifiers demote it: a
commit message is not a gate, and committing a decision record alongside its application is ordinary
for a doc repo. **MAJOR at most, and the remedy (re-ratify D49) is already in flight as the rebuild's
KEEP→REWRITE.**

---

## §4 — Change-request list, by severity

1. **[CRITICAL]** Fix route 3 in `CLAUDE.md` and `AGENTS.md`: point at `authority/AUTHORITY-MODEL.md`,
   not `ontology/AUTHORITY-KINDS.md`. *(Free, reversible, and the only finding with a live consumer.
   Ship independently of everything below.)*
2. **[CRITICAL]** Write definition cards for `authority kind` and `canonical kind`, or concede no
   criterion distinguishes them. Route: definitions-governance. Add to the rebuild's scope — its
   current nucleus omits both.
3. **[MAJOR]** Delete `ontology/AUTHORITY-KINDS.md` (drifted, omits the closure row, predates the file
   that calls it a view, and is where the router sends every agent).
4. **[MAJOR]** Add `enum` to `canonical_kind` and `authority_kind` in `admission-record.schema.json`;
   derive `authority_kind` rather than requiring it. *(Do this before the AAV validator ships.)*
5. **[MAJOR]** Write `OQ-8` in `CANONICAL-KINDS.md`, or re-point the three rows that cite it.
6. **[MINOR]** Add the movement row *"An artifact type is added, merged, split, or retired →
   constitution-governance (gate: decision-gate)"* to AUTHORITY-MODEL's Narrowest Owner Rule table,
   and resolve the phantom owner name in its header.
7. **[MINOR]** Give the `Evidence` row a real owner route, or state that it terminates and needs none.
8. **[OWNER DECISION, not a change request]** The merge itself (§2). Sequence it against the
   `2026-07-13-definitions-rebuild`; do not let two routes commit contradictory acts in the same week.
9. **[DISPATCH DEFECT]** Three fabricated quotes propagated through the `robot_talks` round and into
   three CRITICALs. The three-way convergence in `attacks.md` **must not be cited as independent
   confirmation.** Any future dispatch that reads `attacks.md` reads §0 first.
