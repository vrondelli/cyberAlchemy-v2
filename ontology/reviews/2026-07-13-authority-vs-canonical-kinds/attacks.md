# attacks.md — authority-kind vs canonical-kind

Dispatch: `2026-07-13-authority-vs-canonical-kinds` (`dispatch_type: review`)
Question: is the Tier-1 (`canonical_kind`) / Tier-2 (`authority_kind`) split load-bearing, or a disguised duplication?
Topology: `attackers` (3 × explorer, `robot_talks: true`) --sequential--> `verifiers` (2 × skeptic). `final_approver: parent`.
`anti_bias_global: attack-vector`. check-tension gate: both agents PASS.

This file is the **verbatim** record of the attacker returns. Each attacker's **initial**
position and **final** (post-discussion) position are both preserved, so premature
convergence in the `robot_talks` round stays detectable.

---

## Attacker angles

| agent | attack-vector | assigned position |
|---|---|---|
| Lawvere, F. William | definitional | the coarse tier is vacuous outside `Evidence`; the two enumerations name the same objects twice |
| Bénabou, Jean | counter-example | the rollup is a real, non-trivial, **partial** indexing; the split IS load-bearing and a merge destroys information |
| Ashby, W. Ross | scope / ownership | the two-tier model is an artifact of the governance layout, not of the domain |

---

# ROUND 1 — INITIAL POSITIONS (independent, parallel)

## Lawvere — initial

**F1 — The Tier-2 field's own birth name was `coarse_group`; the rename to `authority_kind` was declared semantics-preserving, which means "authority kind" *means* "grouping attribute on a canonical kind."**
`cyberAlchemy-v2/authority/definitions/DEFINITION-DRIFT-AUDIT.md:231-238`:
> "### Field rename — `fine_type`→`canonical_kind`, `coarse_group`→`authority_kind`. 2026-07-08. Status: pass. … **Names only** — no change to the term's meaning, the record shape, or the rollup invariant"

The repo's own drift audit certifies that `authority_kind` denotes exactly what `coarse_group` denoted: a coarse grouping of the fine type. A grouping of a type is an **attribute of that type**, not a second type. The two-tier architecture is the reification of a column.
**CRITICAL.** *Fix:* accept the audit at its word — restore `authority_kind` to an attribute of the single enumeration (`group`/`authority_bearing`), or produce a definition card showing what the rename added.

**F2 — Neither tier's head term has a definition card. Both are defined ostensively, by pointing at the other's table.**
`DEFINITIONS.md` has no `authority kind` card and no `canonical kind` card (D1–D56 checked). What exists:
- `CAV2-D49:3256` — "the set of authority **kinds** is a closed enumeration (the `../AUTHORITY-MODEL.md` Authority Kinds table)" — defines the *closure* of a set whose element-term is undefined, by naming the table.
- `CAV2-D51:3387` — "an artifact instance whose **kind is a member of the canonical-kind enumeration**" — defines the *instance*, by naming the other table.

So the entire split rests on two tables each of which is the sole definition of its own term. There is **no intensional criterion** anywhere that admits an object to Tier-2 and excludes it from Tier-1. A distinction with no defining predicate cannot be load-bearing; it can only be enumerated.
**CRITICAL.** *Fix:* write one card giving the necessary-and-sufficient condition for being an authority kind that a canonical kind fails — or concede there is none and collapse.

**F3 — The predicate the whole split hangs on — `authority-bearing` — is undefined, and is enumerated in the definitions tower, not in either table.**
`CANONICAL-KINDS.md:35` — "`authority_reachable` | Whether an instance can *ever* become authority (true only if `authority_kind` is authority-bearing)."
`CAV2-D48:3234` (Boundary) — "scoped to **authority-bearing kinds**. Evidence (`CAV2-D34` / non-collapse rule 1), residue (`CAV2-D18`), ledger events, one-off logs, and generated projections are inputs or terminal artifacts, not lifecycle-bearing."
`authority-bearing` has no card; D48 lists its complement extensionally. **The one bit Tier-2 supposedly carries is already owned by D48.** Tier-2 is a materialized view of a predicate defined upstream of it.
**MAJOR.** *Fix:* promote `authority_bearing` to a card, then carry it as a boolean on one enumeration; D48 already supplies the values.

**F4 — Seed 6 partially fails, and the failure is worse for Tier-2 than the seed was.** `CANONICAL-KINDS.md` OQ-5 says of `projection`/`residue`'s reachability: *"Neither is stated."* **That is false.** D48's boundary states both (F3). So Tier-1 did not merely parse Tier-2's prose cell — it parsed the *wrong document*, while the authoritative answer sat in an ACTIVE definition card. Tier-2's prose column was used as a source of typed values it was never authorized to supply.
**MAJOR.** *Fix:* close OQ-5 by citation to D48; strike the "inferred" markers.

**F5 — `CAV2-D51`'s formal clause asserts the two tiers are the same objects, and is false on exactly one element.**
`CAV2-D51:3402`:
> `CanonicalKinds  superset-of  AuthorityKinds   (every authority-kind is a canonical-kind; not every canonical-kind bears authority)`

Check: Definition, Constitution, Discipline, Decision, Spec, Runtime contract, Projection, Residue are all canonical kinds (name-identical rows). **`Evidence` is not** — there is no `evidence` row in `CANONICAL-KINDS.md`. So the inclusion holds on 8 of 9 and fails on 1. An ACTIVE card states a set relation its own registry refutes. And note what the *true* part says: the coarse kinds **are** fine kinds. Tier-2 is 8/9 a sub-enumeration of Tier-1, not a different sort of thing.
**CRITICAL.** *Fix:* either add an `evidence` canonical kind (making the inclusion total, and the split provably vacuous), or strike the clause and state what Tier-2 is instead.

**F6 — The rollup is the identity on 8 of its 19 resolved rows; its entire non-trivial content is one bucket and one stray edge.**
Counting `CANONICAL-KINDS.md`'s 23 rows: **8 identity** (definition, constitution, decision, spec, discipline, runtime contract, projection, residue → their namesakes); **10 → Evidence**; **1 non-identity elsewhere** (`readme → Projection`); **4 unresolved**. Seed 1 survives and hardens: the map is an inclusion-retraction. My thesis needs one honest amendment — `readme → Projection` is a second non-identity assignment, so "no information outside the Evidence row" is **false as stated**. It is: *no information outside the Evidence fibre and one contested `readme` edge* — and that edge is itself suspect (Projection's surface is "`ontology/projections/` or generated read model"; `readme`'s process is *"no single producer — authored beside what it describes"* — a hand-authored file is not a generated read model).
**MAJOR.** *Fix:* re-route `readme` (Evidence, or a new kind) and then note that the coarse tier's residual content is a single label over 10 kinds — expressible as one attribute value.

**F7 — Rule 1 is falsified by its own table; the file's own count of the violation is stale by 4×.**
`CANONICAL-KINDS.md:123` — "**Rollup is a typed coupling**: every canonical-kind names exactly one authority-kind."
`OQ-2:379` — "the one row that does not yet name exactly one authority-kind".
Actual rows reading `unresolved`: `axiom`, `premise`, `invariant`, `implementation-plan` — **four**. `rollup` is a **partial** function on 19/23 of its domain. A rollup that is not total is not a typed coupling under `CAV2-D16` ("must be represented as an explicit typed relation with named endpoints, direction, relation kind, owner, evidence"): four edges have no target.
**MAJOR.** *Fix:* restate Rule 1 as a goal, not a rule, and fix OQ-2's "one row" to "four rows"; or decide the four.

**F8 — `must not collapse into` violates `CAV2-D16`, the primordial rule the spine claims to run on.** Its codomain is untyped — it mixes Tier-2 kinds, Tier-1 kinds, Arcanum objects, events, and non-kinds:
`AUTHORITY-MODEL.md:52-60` — Definition → "glossary usage, ontology naming, source wording" (non-kinds); Discipline → "canonical term, sigil, spell, implementation task" (**Arcanum** objects, out of enumeration); Spec → "research finding or interface idea" (`findings` is a **Tier-1 kind**); Runtime contract → "successful generation or projection" (an **event**, plus a kind); Evidence → "authority by itself" (a **posture**); Residue → "defect by default" (a **default-interpretation rule**, not a collapse).
Seed 4 survives intact. Per D16 a governing relation needs "direction, relation kind, owner, evidence, effect" — this column has none. **The one column that is unique to Tier-2 is the one that is not a field.**
**CRITICAL.** *Fix:* type the relation (`forbidden_collapse: kind_id[]`) and move the non-kind cells to prose, or delete the column and rely on Non-Collapse Rules 1–7, which already say the same things in typed form.

**F9 — The same field carries two names *and two different value-sets* across the two kind tables — this is drift already realized, not a risk.**
`ontology/AUTHORITY-KINDS.md` (`forbidden_collapse`) vs `AUTHORITY-MODEL.md` ("Must not collapse into"):
- Discipline — MODEL: "canonical term, sigil, spell, implementation task" · KINDS: "Not one-off work style." **Zero overlap.**
- Evidence owner route — MODEL: "source, inventory, validation, or observability owner" · KINDS: "source/inventory owner" (**drops two owners**).
- Constitution — MODEL: "preference, one-off review comment, hidden validator" · KINDS: "Not any structural preference." (**drops two**).
Seed 5 survives and understates: the divergence is in the *values*, not just the field name. `AUTHORITY-KINDS.md` also omits the default-deny catch-all row that `CAV2-D49` says enacts closure — an ontology "view" of an ACTIVE table that silently drops the closure the definition depends on.
**MAJOR.** *Fix:* one table. Delete `ontology/AUTHORITY-KINDS.md` or generate it.

**F10 — `AUTHORITY-KINDS.md`'s Purpose is the only sentence in the corpus asserting the tiers name different objects, and the 2026-07-13 decision falsifies it.**
`AUTHORITY-KINDS.md:9-10` — "They are not vault `node_type` values and do not make anything canonical."
`decisions/2026-07-13-canonical-kind-one-label.md:26` — "`node_type` is hereby the **old name of the same field**" (i.e. `node_type` ≡ `canonical_kind`).
Substituting: *authority kinds are not canonical_kind values.* But `definition`, `constitution`, `decision`, `spec`, `discipline`, `runtime contract`, `projection`, `residue` **are** canonical_kind values *and* authority-kind labels (F5). The load-bearing separation claim is false.
**CRITICAL.** *Fix:* strike the sentence; then nothing in the corpus asserts a separation.

**F11 — `process` (producer) and `owner_route` (promoter) are two concepts sharing seven identical strings; the file itself calls the column "malformed."**
Contracts: `CANONICAL-KINDS.md:31` — "`process` | The governed process whose output is this kind." vs `AUTHORITY-KINDS.md:19` — "`owner_route` | Governance route that owns promotion." **Different concepts.** Values on 7 rows: identical or near-identical ("definitions-governance", "decision-gate", "task-session after owner gates"). Only `residue` diverges — and it diverges into a contradiction: Tier-1 says *"no producer of its own"*, Tier-2 says owner route *"route named by residue type"*. Seed 2 survives. And `CANONICAL-KINDS.md:355` already admits it: "Conflating (1) and (2) is the same error that **malformed the `Process` column above**."
**MAJOR.** *Fix:* keep `owner_route` (promotion) as the attribute; make `producer` a separate, honestly-empty column (7 rows already read `none`).

**F12 — Tier-2's Evidence row — the one row that supposedly earns the tier — has an `Owner route` that is a restatement of its `Counts where`, and a `Residue` row whose owner route is a variable, not a value.**
`AUTHORITY-MODEL.md:59-60`:
> `| Evidence | source, inventory, validation, or observability owner | source, inventory, validation, observability | authority by itself |`
> `| Residue | route named by residue type | gap ledger, Craft, or owner route | defect by default |`
Evidence's owner route = its location + the word "owner". Residue's owner route names no route. 2 of 9 rows carry no routing information in the routing column. Separately, `Evidence` is *also* a row in the **Authority Postures** table 20 lines down ("Evidence | Support candidates and gates. | Replace owner decision."). — the same word, same content, two taxonomies, one document.
**MAJOR.** *Fix:* give Evidence a real owner route or admit it is a posture, not a kind.

**F13 — `candidate_inputs` is contracted and never populated — and it is the one field that would have made Tier-2 informative.**
`AUTHORITY-KINDS.md:20` declares "`candidate_inputs` | Evidence or candidates that may feed the kind." The table below it has **no such column**. That field is precisely the fibre structure (which fine kinds feed which coarse kind) that Tier-1 later re-derived as `rollup`. The coarse tier declared the field that would have justified it, left it empty, and the fine tier built it again from scratch as a separate enumeration.
**MINOR** (empty field) / **MAJOR** as evidence of duplication-by-abandonment. *Fix:* populate it and observe that `rollup` becomes its inverse — one relation, stored twice.

### Lawvere — initial verdict

**The split is a disguised duplication, and the strongest proof is written by the repo itself.** Three sentences settle it: the drift audit certifies `authority_kind` is the renamed `coarse_group` with *"no change to the term's meaning"* (F1); `CANONICAL-KINDS`'s own Kind Contract says the row "has **three free values** (`process`, `authority_kind`, `durability`) and two functions of them" — i.e. Tier-2 is modeled *as a column of Tier-1* (F6); and `CAV2-D51` formally asserts `CanonicalKinds ⊇ AuthorityKinds` (F5). A free value on a row is an attribute. A superset relation between two "tiers" means one enumeration with a marked subset. Neither term has a definition card (F2), so no criterion exists that could distinguish them; the only predicate that does real work (`authority-bearing`) is undefined and lives in D48, upstream of both tables (F3). The rollup is the identity on 8/19 resolved rows, sends 10 to one bucket, one to a contested target, and simply fails on 4 (F6, F7) — a partial function that is mostly an inclusion is not an abstraction, it is a copy with a hole. **Collapse to one enumeration plus `owner_route`, `authority_bearing: bool`, `durability` — and one extra attribute the two-attribute proposal is missing: `group` (or `posture`), the label that names the Evidence fibre.** That is the honest residue of Tier-2: one label over ten kinds, not a tier.

### Lawvere — initial "what I attacked and failed to break"

**The Evidence fibre is a real quantification domain, and contracts are already written over it.** `CANONICAL-KINDS.md`'s Instance Contract opens: *"Status: **candidate.** Scoped to `authority_kind: Evidence` (owner, 2026-07-13); the other authority kinds have no instance contract yet."* One frontmatter contract, one `authority_layer` field, one non-concession clause — all stated **once**, over ten fine kinds, because the coarse name exists to be quantified over. The same is true of Non-Collapse Rules 1–7 and of `CAV2-D48`'s Boundary, both of which are written in coarse vocabulary. I tried to break this by arguing `authority_bearing: bool` suffices — and it does not, quite: a boolean cannot distinguish the *Evidence* contract from the *Projection* contract, and both are `authority_bearing: false`. You need a **name for the fibre**, not just a flag. So the coarse tier is not empty: it is a **grouping label carrying contracts**, and any collapse must keep that label. What it is *not* is a *kind* — nothing in the corpus gives it kind-hood beyond the word — and it is not a *tier*, because 8 of its 9 members are already members of the fine enumeration under the same names. Keep the label. Delete the tier.

---

## Bénabou — initial

**1. The rollup's entire non-trivial content is the `Evidence` partition — and it is 10 rows, not 9.**
The map `canonical_kind → authority_kind` is name-identical on 8 rows. It is `unresolved` on 4. Everything the rollup *tells you that the row's own name does not* is: (a) which rows are `Evidence` — `discovery`, `research`, **`findings`**, `session`, `ledger`, `review`, `handoff`, `audit`, `conceptual`, `backlog` = **ten**, 43% of a 23-row table; (b) `readme → Projection`. That is the whole payload. It is small, but it is not zero, and it is not derivable from the row name.
`cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md:55` — `| **findings** | research dispatch **·** review dispatch — *first multi-producer row* | Evidence | ephemeral | tolerated | no |`
**MAJOR** (pro-split). Fix: state in the Kind Contract that the rollup's job is the Evidence/Projection grouping, not the identity rows; the identity rows are noise the merge critique is right about.

**2. CRITICAL — the predicate the entire rollup exists to compute is recorded nowhere.**
`authority_reachable` is defined as `true only if authority_kind is authority-bearing`. **No file marks any authority kind as authority-bearing.** `AUTHORITY-MODEL.md`'s Authority Kinds table has no such column; `AUTHORITY-KINDS.md` has none; CAV2-D49 has none. The value is guessed row-by-row, and the file admits it: OQ-5 says `projection` and `residue` are `no` *"by **inference**… Neither is stated."*
**CRITICAL.** Fix: add an `authority_bearing` column to the AUTHORITY-MODEL table (6 true / 3 false) — which is, note, exactly the merge proposal's field, arriving at Tier-2.

**3. `Evidence ≠ ¬authority_bearing`, so the merge as literally worded is lossy.**
The instance contract is *quantified over the coarse label*, owner-ratified and dated: **"Status: candidate. Scoped to `authority_kind: Evidence` (owner, 2026-07-13)"** (`CANONICAL-KINDS.md:146`), and `authority_layer` is **"The one field that exists only on Evidence"** (`:192`). But `{authority_bearing: false}` = the 10 Evidence rows **plus** `projection`, `residue`, `readme` = 13 rows. A bool cannot name the 10. The merge recovers them only if `owner_route` is a 9-valued categorical taking the *authority kind's* owner route — at which point `owner_route` **is** `authority_kind` renamed. It cannot be filled from `process`: seven Evidence rows have `process: none`.
**MAJOR** (pro-split, and the sharpest one). Fix: if merging, keep the 9-valued column and admit it is the coarse kind under a new name; do not replace it with a bool.

**4. `backlog` falsifies the Kind Contract's own derivation function.**
The contract declares `contradictions` a *function* of durability, and insists *"the row has three free values… and two functions of them. Storing a derived value is how a table rots"*. Then: `| **backlog** | *none…* | Evidence | perennial | tolerated *(a list of open items is not a contradiction)* | no |`. Perennial **and** tolerated. `ledger` emits a third, un-enumerated value: `resolve-required (live); temporal supersession allowed`.
**MAJOR.** Fix: `contradictions` is a free value, not derived.

**5. The closure asymmetry is real, load-bearing, and dated — it is what made `findings` legal.**
`AUTHORITY-MODEL.md:63` — *"**Closure (default-deny).** This enumeration is **closed**…"* (CAV2-D49, ratified `decisions/2026-06-23-authority-kind-closure-catchall-row.md`). Tier-1 is open: OQ-1, *"keep it **candidate/open** during design"*. On 2026-07-13 `findings` was added on an **owner instruction** — no decision record. Under a merged closed table that addition is a CAV2-D49 amendment requiring **decision-gate + constitution-governance**. Likewise `attacks.md` (OQ-9: *"`attacks` is a shape this enumeration does not contain"*) exists today, unenumerated and *not blocked* — which is only coherent because default-deny bites at Tier-2, not Tier-1. **A single table cannot be closed and open at once.** This is the one capability the merge cannot have for free.
**MAJOR** (pro-split — my strongest surviving case).

**6. …but the openness has already de-synced Tier-1 from the decision that ratified it.**
`decisions/2026-07-13-canonical-kind-one-label.md:41` — **"## The enumeration (22 values)"**, and `findings` is not among them. The table now has **23 rows**. `CANONICAL-KINDS.md:416` still reads *"Seven of twenty-two kinds have no producer."*
**MAJOR** (anti-split — the price of openness, paid within 24 hours of the decision).

**7. CRITICAL — the tiers *host* a live contradiction about `axiom` instead of forcing it.**
`AUTHORITY-MODEL.md:70` — *"(Existing invariant definitions `CAV2-D16`/`D29`/`D38`/`D49` govern **as the `Definition` kind**…)"*.
`CANONICAL-KINDS.md:58` — `| axiom | … | unresolved — OQ-2 *(provisionally governs as `Definition`, but the term's boundary holds axiom ≠ definition)* |`
Tier-2 asserts a rollup; Tier-1 refuses it. Both files are live. **The two-tier structure is what lets this sit undetected — a merged table would have one cell and would have to be *wrong in one place*, visibly.**
**CRITICAL** (anti-split). Fix: decision-gate OQ-2 now.

**8. The duplication that is actually in the repo is Tier-2 against *itself*, not Tier-2 against Tier-1.**
`ontology/AUTHORITY-KINDS.md` is a second copy of the coarse table — `status: candidate`, owner *ontology route* — against `AUTHORITY-MODEL.md`'s `status: active`. It already drifts, and has **no catch-all row** — the closure invariant is absent from the candidate copy.
**MAJOR.** Fix: strike `AUTHORITY-KINDS.md`. This is the merge the corpus actually needs.

**9. `AUTHORITY-KINDS.md` declares a `candidate_inputs` field its table does not have.** **MINOR.**

**10. Tier-1 and Tier-2 have *different consumers* — and this, the split's real functional basis, is stated in no file.**
`promotion-policy.md` never mentions a canonical kind, and re-enumerates authority kinds informally and **incompletely**: *"| Local authority | Definition, constitution rule, discipline, decision, or promoted spec. |"* — 5 of 9, silently omitting Runtime contract, Projection, Evidence, Residue. Tier-2 is consumed by promotion, closure, and the non-collapse rules; Tier-1 by the frontmatter contract, edges/hom-sets, and residue detection. Two tables, two readers. That is the argument for the split, and it appears nowhere.
**MAJOR** (load-bearing omission).

**11. Case-5 hunt: NEGATIVE. I found no pair of canonical kinds under one authority kind requiring differential *authority* governance.**
I found differential *contract* governance (`research` vs `findings`; `conceptual` vs `ledger`). Those prove the **fine** tier is load-bearing. Nobody disputes that. They say nothing about whether the **coarse** tier must be a separate table. Durability is explicitly *not* the discriminator — the file demotes it itself: *"`durability` does not predict the instance contract — it is a proxy, and it gets `conceptual` wrong"*.
**Reported as a negative result.** Case 4 (durability) is **abandoned**.

### Bénabou — initial verdict

The split is **not** a disguised duplication, but it is defended by exactly one thing: **closure asymmetry** (Finding 5). The Evidence fan-out (Finding 3) is a real, non-recoverable partition *if* the merge uses `authority_bearing: bool`. So the merge **as literally proposed** loses information. But — and I concede this at full strength — a merge that keeps a **9-valued categorical column** and predicates the closure on `authority_bearing = true` loses **nothing**, and it would have caught Findings 2, 4, 7 and 8 by construction. My defensible position is therefore narrower than my assignment. Fix Findings 2 and 7 and the split's remaining justification is one sentence long: *the coarse set is closed, the fine set is not.*

### Bénabou — initial "what I attacked and failed to break"

**The strongest argument for the merge, which I could not defeat: the split is a contradiction-hiding machine, and it is already hiding one.** Two documents currently assert incompatible rollups for `axiom` (Finding 7). A merged table has **one cell** for that fact. The disagreement would be a diff, not a discovery made by a red team eight months later. The same structure produced Finding 6, Finding 8, and Finding 2 — a bool that exists only in the gap *between* the tables. **Four of my eleven findings are defects that exist only because there are two tables.** Against that, the split buys precisely one capability — conditional closure — which a merged table can simulate with a predicate. I do not think that trade is obviously good, and I will not pretend it is. **The honest ledger: the split buys one thing and costs four.**

---

## Ashby — initial

**1. The repository's front-door router points every agent at the candidate copy, not the active authority.** — CRITICAL
`AGENTS.md:36-41` / `CLAUDE.md:36-41` (identical), route 3:
> "Routing: `cyberAlchemy-v2/SOURCE-MAP.md`, `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md`."

`AUTHORITY-MODEL.md` — the file whose header says `Status: active local authority model` — is **not named anywhere in the router**. Neither is `CANONICAL-KINDS.md`. The only kind table an agent is routed to is the one whose header says `Status: candidate` and whose own owner is forbidden to decide. This is not a stale pointer; it is the causal mechanism of the whole defect — agents arrive at the candidate table, find it insufficient, and author a new one.
*Fix:* repoint route 3 at `authority/AUTHORITY-MODEL.md`; delete the `AUTHORITY-KINDS.md` pointer.

**2. Inverted provenance: the "candidate view" is the ancestor, and the "active authority" is the copy.** — CRITICAL
`git log --diff-filter=A`: `ontology/AUTHORITY-KINDS.md` created **2026-06-21** (`7e776e65`); `authority/AUTHORITY-MODEL.md` created **2026-06-24** (`224331e4`), three days later. Yet `AUTHORITY-MODEL.md:151` says they "remain **candidate model views** under the ontology route." A file cannot be a "view" of a table that did not exist when it was written.
*Fix:* strike line 151; replace `AUTHORITY-KINDS.md` with a one-line tombstone.

**3. The two copies have already drifted — copy-rot is not hypothetical here.** — MAJOR
Evidence · owner — MODEL: "source, inventory, validation, or observability owner" · KINDS: "source/inventory owner". Runtime contract · must-not-collapse — MODEL: "successful generation or projection" · KINDS: "Not generated mirror output." Decision · surface — MODEL: "`authority/decisions/`" · KINDS: "`authority/decisions/` **when created**".
Two owners now hold two answers to "who owns Evidence".

**4. There is not a second kind table. There are four, spanning three tiers nobody declared.** — CRITICAL
`ontology/NODE-MODEL.md:63-76` carries **`## Initial Node Concepts`** — the same members, the same **`Owner route`** column, the same **`Forbidden collapse`** column — under a *fourth* axis: "`concept_role` | yes | **Authority object, evidence object, workflow object, projection object, or residue object.**" That is a *coarser* tier above Tier-2. And `ontology/TAXONOMY-CROSSWALK.md:29` re-types the whole thing a fourth time into Arcanum's DS-D1 meta-types. So the corpus holds: `concept_role` (5) → `authority kind` (9, ×2 files) → `canonical_kind` (22) → `node_type` (16, vault). **Four enumerations of "what kind of thing is this", each in a file owned by a different route, each declaring it is "not" the other one.** The number of tiers tracks the number of routes that wanted a table.

**5. Five owners are claimed over one model, and one of them does not exist.** — CRITICAL
"CyberAlchemy v2 authority owner" appears **nowhere in AUTHORITY-MODEL's own Narrowest Owner Rule table**. The active authority table is owned by a route its own routing table does not recognise. Meanwhile non-collapse rule 2 — *"Ontology can model authority, but it cannot decide authority"* — leaves the ontology route holding three of the four tables it may not decide.

**6. The only machine consumer contradicts Tier-1's own normative law.** — CRITICAL
`CANONICAL-KINDS.md` §"The law: type-level is looked up, never decided": *"If `authority_kind` were declarable, an artifact could write `authority_kind: Definition` into a discovery and promote itself. Under lookup, that lie is not merely forbidden — it is **inexpressible**."*
`validation/artifact-admission/admission-record.schema.json:293-328`: `"required": [ …, "canonical_kind", "authority_kind", "process_origin", "durability", "authority_state" ]`, with `"authority_kind": { "type": "string", "minLength": 1 }`.
The validator **requires the instance to declare** the three things the law says must be looked up, and constrains none by enum. The lie is not inexpressible; it is a **required field**.

**7. Provenance: the fine tier was born inside a definitions commit, its motivating definitions are now slated for retirement, and its rows were agent-authored.** — MAJOR
`CANONICAL-KINDS.md` created **2026-07-08** in commit `314f4700` *"feat: promote canonical-artifact and durability definitions (CAV2-D51/D52)"*. On 2026-07-13 the definitions rebuild **retires both**. The file has outlived the cards it was created to carry. Only **two** edits to Tier-1 carry an owner gate; the 2026-07-09 bold rows are agent work, and the file concedes one was overturned.

**8. `SOURCE-MAP.md` — the router of record — does not route the type question at all.** — MINOR

**9. `AUTHORITY-KINDS.md` cannot even satisfy its own contract** (declares six fields, renders five columns). — MINOR

### Ashby — initial verdict

The two-tier split is **not load-bearing as a two-tier split, because it is not two-tier**. Four enumerations exist under four owners, four statuses, and three folders, and each new one was minted *within* a route that wanted a type table and found the existing one owned by someone else. The granularity is a **function of the governance layout, not of the domain**. **Merge Tier-1 into Tier-2 tomorrow and the merged table still has four claimed owners, two live copies, a router pointing at the stale one, and a validator that ignores it.** Concretely: *no route in this repository is permitted to own the type model.*

### Ashby — initial "what I attacked and failed to break"

**The rollup column is the one thing in Tier-1 that no other file contains, and one closure asymmetry genuinely forbids the merge.** Tier-2 is closed, default-deny; Tier-1 explicitly is not. **One table cannot be simultaneously closed-by-default-deny and open-and-additive.** So the *tiering* has a defensible reason to exist even though the *layout* does not, and my thesis does not reach it. Two further things survived: `disciplines/cards/provisional-model-stewardship.md` already names this exact pathology as a governed discipline and cites `AUTHORITY-KINDS.md` as the case — the repo diagnosed the disease before I did. And Tier-1 is not inert: `validation/development/artifact-admission-validator/` reads `CANONICAL-KINDS.md` as its contract, so "governs nothing" would be an overclaim.

---

# ROUND 2 — `robot_talks`: FINAL POSITIONS (after confrontation)

## Lawvere — final

**CONCEDES:** (C1) closure asymmetry is real and he under-weighted it; (C2) `Evidence` ≠ ¬`authority_bearing` — **the merge as the review question literally worded it is lossy**, without reservation; (C3) `AUTHORITY-KINDS.md` predates `AUTHORITY-MODEL.md`, inverting his F9's drift arrow; (C4) the ownership question is *procedurally* upstream of his.

**HOLDS — the crux (H1):** *"A closed enumeration and a grouping attribute are not in contradiction: a closed enumeration IS the type of an attribute.* `coarse_group: enum{Definition … Residue}` is simultaneously (i) a grouping column and (ii) a closed domain carrying default-deny — 'a value outside the enum is blocked' is *the definition of a closed enum*. **Closure is a property of a column's codomain, not of a table.** So a single table can be both: `canonical_kind` open and additive over rows; `authority_kind` a closed 9-valued column; unknown value ⇒ blocked. Bénabou's own witness proves it — `findings` was addable **because** its `authority_kind` was drawn from the closed 9. My F1 and his closure asymmetry are compatible, and their compatibility is fatal to *the split*, not to *closure*. The word 'kind' adds nothing to `enum`."

**HOLDS (H2):** the residual disagreement with Bénabou is now *only about what to call the result* — Bénabou calls a closed 9-valued categorical column *a tier*; Lawvere calls it *a column*. "He should not be scored as having defended the split — he defended a **closed-domain attribute**, which is the merge."

**HOLDS (H3), against Ashby:** D41's retirement rationale decides *where* the term lives, not whether two enumerations name the same objects. "Apply it consistently and you get the opposite of a fix: AUTHORITY-MODEL owns `authority kind` **and** CANONICAL-KINDS owns `canonical_kind`, two live control surfaces each ostensively defining its own vocabulary, over **8 name-identical labels**… Ashby's layout move makes the duplication **ownerless at the term level**."

### Lawvere — final verdict

**One enumeration. `authority_kind` survives as a closed 9-valued column on it, not as a tier.** The correct target is `canonical_kind` (open, additive, owner-gated) + `authority_kind: enum{9}` (closed, default-deny, **derived by lookup, never declared**) + `owner_route` + `durability`, with the instance contract quantified over `authority_kind = Evidence` exactly as the owner ratified it. **The review question's own proposed attribute set (`authority_bearing: bool`) is rejected — Bénabou broke it and he is right.** But the two-tier split is still a duplication: closure is a column property, the rollup is an inclusion-retraction on 8 of 19 resolved rows, neither head term has a definition, and the definitions rebuild has *already voted the merge* by retiring D51/D52 while preserving their columns. **The split buys one thing — a closed codomain — and one thing does not need a second table.**

### Lawvere — NEW findings from the confrontation

**N1 — CRITICAL. The only executable artifact touching both tiers implements NEITHER closure NOR rollup: it requires the instance to declare two unconstrained strings.**
`cyberAlchemy-v2/validation/artifact-admission/admission-record.schema.json:294-317`:
> `"required": [ "status", "artifact_id", "canonical_kind", "authority_kind", "process_origin", "durability", "authority_state" ]`
> `"canonical_kind": { "type": "string", "minLength": 1 },`
> `"authority_kind": { "type": "string", "minLength": 1 },`

**No `enum` on either.** If Tier-2 were a closed enumeration, `authority_kind` would carry `enum: [9 values]` — that is the *machine form of default-deny*, and it is absent. If `rollup` were a typed coupling, `authority_kind` would be **derived, not required on the instance**. The schema implements the exact lie `CANONICAL-KINDS.md` calls **"inexpressible"** — and makes it a **required field**. The sharper point beyond Ashby's: the schema also fails to constrain `canonical_kind`, so it implements *neither* tier. **The tier was not implemented. It was transcribed.**
*Fix:* one edit closes both defects — put `enum` (9 values) on `authority_kind`, drop it from `required`, derive it from a `canonical_kind` enum. **That edit *is* the merge, in JSON.**

**N2 — CRITICAL. The definitions rebuild of 2026-07-13 has already voted this review's verdict, and nobody noticed.**
`authority/definitions/reviews/2026-07-13-definitions-rebuild/attacks.md:142-143`:
> `| RETIRE/LOCALIZE | D51 | Preserve the artifact-kind/admission rules locally; retire the colliding and blocked "canonical artifact" term. |`
> `| RETIRE/LOCALIZE | D52 | Preserve the executable durability enum/default/override/effect in admission and canonical-kind schemas; no spine term is proven necessary. |`

**"Preserve the executable columns, retire the terms" is the merge, stated by the definitions review, one day before this review was convened.** D51 is the *only* formal statement of `authority_kind = rollup(canonical_kind)`; retire it and the rollup's sole surviving carrier is a table column — i.e. an attribute. The collapse is arriving by attrition. **This review is being asked to decide something the definitions tower has already decided by deletion, in the other room.**
*Fix:* do not decide the tiers independently of the rebuild. Sequence: rebuild lands → rollup exists only as a column → ratify it as a column.

**N3 — MAJOR. Bénabou's "ratified default-deny law" is downgraded and orphaned by that same review.**
`attacks.md:167`: *"D49 changes from `KEEP` to `REWRITE`: the current definition speaks more strongly than its review-mode enactment, the deterministic C16 path remains blocked, and **its lifecycle language depends on retired D48**."*
D48 — the card that supplies `authority-bearing`, the predicate the entire split rests on — is **RETIRE**. So the closure law is (i) review-mode only, (ii) flagged as overclaiming, and (iii) parented on a retired card.
*Fix:* re-promote `authority_bearing` as a standalone predicate before D48 goes, or closure loses its ground term.

---

## Bénabou — final

**CONCEDES (C1) — his last structural defense falls.** *"A column's value set and a table's row set are independent closures. That is not a concession to Lawvere — it is **CAV2-D29**, the repo's own axis-orthogonality invariant: closing `authority_group ∈ {Definition … Residue}` under CAV2-D49 while leaving the row set open-and-additive is a single table with one closed column and an open extent. Nothing breaks."* The 9 values need a ratification home carrying `owner_route`, `counts where`, and `must not collapse into` — but that is an **enum-domain dictionary for a column**, not a tier of artifact-types. Which is verbatim what `ontology/AUTHORITY-KINDS.md` already says it is: *"They help route review… do not make anything canonical."*

**CONCEDES (C2) — D51 refutes the tier.** *"If Tier-2 were a different sort, the containment `CanonicalKinds ⊇ AuthorityKinds` would be a **type error**, not a theorem with one exception. Asserting it at all concedes they are the same sort. And the single failing element is the tell in the wrong direction: **`Evidence` is missing from the fine table because you cannot instantiate an `Evidence`** — you instantiate a discovery. That is the signature of a *group label*, not of a coarser kind. Six of the nine groups are singletons; one holds ten. That is a lopsided partition of one enumeration, not two enumerations."*

**CONCEDES (C3) — the rollup is not a typed coupling.** CAV2-D16 requires a typed relation to record *"validation, promotion, or blocking effect"*. `rollup` records none. **"It groups rows in a document. It is information; it is not a coupling with force."**

**HOLDS (H1), against Ashby:** the layout defect does not dissolve the closure requirement. Fix the layout and you still must answer: closed on rows, or closed on the column? The answer is the column.

**HOLDS (H2), against Lawvere, on one word:** the label is not a *mere* label — the instance contract is owner-ratified as scoped to `authority_kind: Evidence`, and `authority_layer` is "the one field that exists only on Evidence". **A merged table must keep a 9-valued closed column — not `authority_bearing: bool`, which cannot name the ten (¬bearing = 13 rows). The merge proposal as the review question worded it is still lossy.** "That is the entire surviving content of my assigned position, and it is a correction to the merge, not a defense of the split."

### Bénabou — final verdict

**"The three of us have converged, and I will say so plainly rather than manufacture a residual disagreement."** Lawvere's *"keep the label, delete the tier"*, Ashby's *"the granularity is a function of the governance layout"*, and his own conceded *"a merge that keeps a 9-valued categorical column loses nothing"* are **the same proposal in three vocabularies**. His assigned thesis is **half true and the half that is true does not save the split**: the rollup does carry irreducible information (the ten-member `Evidence` class and `readme → Projection`), so the merge **as the review question worded it** — `owner_route` + `authority_bearing: bool` + `durability` — **is lossy and must be rejected in that form**. But the information is a **closed-value column**, not a tier. Every case he was sent to hunt failed: the Evidence fan-out is a grouping (D51 says so, and `Evidence`'s absence from the fine table proves it is a group name); the `unresolved` rows need a categorical with an escape value, not a second table; durability is an orthogonal column by CAV2-D29's own license; and he found **no pair of canonical kinds under one authority kind requiring differential *authority* governance**.

> **FINAL: collapse to ONE enumeration with a closed 9-valued `authority_kind` column (not a bool), `owner_route`, `durability`, and `contradictions` as a free value; keep `AUTHORITY-MODEL`'s nine rows as the enum-domain dictionary for that column; delete `ontology/AUTHORITY-KINDS.md`; and put both enums into the admission schema, because right now neither tier is enforced anywhere and the one executable surface permits exactly the lie the ontology says is inexpressible. The merge wins. I was assigned to break it and I could not.**

### Bénabou — NEW findings from the confrontation

**N1 — CRITICAL. The closure my defense rests on is *inexpressible* at the only machine surface that could carry it — and the lookup law is inverted there.**
`admission-record.schema.json:310-317` — both `canonical_kind` and `authority_kind` are **required, free strings, no `enum`, no cross-field constraint**. So (i) the instance *declares* `authority_kind`, and `CANONICAL-KINDS.md:167-169` claims the opposite with a boast: *"Under lookup, that lie is not merely forbidden — it is **inexpressible**. Structure beats prose."* Under the actual structure the lie **validates**. And (ii) — the part neither other attacker took, **and it cuts my own throat** — `canonical_kind` has no enum *either*, so **CAV2-D49's closed enumeration is equally unenforceable at the same surface**. The default-deny closure exists in exactly one place: **review prose**.
*Fix:* add `enum` to both fields and an `allOf`/`if-then` asserting `authority_kind = rollup(canonical_kind)` — at which point the rollup becomes a real typed coupling and the whole two-tier question reduces to a lookup table in a schema file.

**N2 — MAJOR. D49 itself is already downgraded, and it was my only load-bearing card.**
`reviews/2026-07-13-definitions-rebuild/attacks.md:167` — *"D49 changes from `KEEP` to `REWRITE`… The surviving rule is default-deny **review behavior** for unknown authority kinds, **not a claim of completed deterministic closure**."*
*Fix:* rewrite D49 to claim only review-mode default-deny, and stop citing it as if it enacted a closed set.

---

## Ashby — final

**CONCEDES to Lawvere — the concept.** `authority_kind` is an attribute, not a tier. *"A thing renamed from `coarse_group` is a group. I never contested the semantics and I do not now."*

**CONCEDES to Bénabou — the Evidence fibre**, but takes it *for* his own thesis: the instance contract is scoped *"to `authority_kind: Evidence` (owner, 2026-07-13); **the other authority kinds have no instance contract yet**."* — *"That is not a domain boundary — it is **the boundary of one owner's completed work**. The coarse label is being used as a jurisdiction marker. That is my case, in his evidence."*

**CONCEDES — his own causal claim is PARTIALLY FALSIFIED.** He claimed granularity tracks the number of routes that wanted a table. The record: `AUTHORITY-KINDS.md` **and** `NODE-MODEL.md` were authored by the **same route (ontology) in the same commit** — `7e776e65`, 2026-06-21. **"The claim as stated is 3/4, not 4/4, and the exception is intra-route. I withdraw the strong form."** The form that survives the record is narrower and worse:

| Enumeration | File | Authoring route | Date | Empowered to decide it? |
|---|---|---|---|---|
| `node_type` (16) | vault `ontology-conventions.md` | vault constitution (DomainSpec) | 2026-05-02 | Yes — but for the vault, not cav2 |
| `concept_role` (5) | `ontology/NODE-MODEL.md` | ontology route | 2026-06-21 | **No** (non-collapse rule 2) |
| `authority kind` (9) | `ontology/AUTHORITY-KINDS.md` | ontology route | 2026-06-21 | **No** |
| `authority kind` (9+1) | `authority/AUTHORITY-MODEL.md` | "CyberAlchemy v2 authority owner" | 2026-06-24 | **Route does not exist** |
| `canonical_kind` (22→23) | `ontology/canonical-kinds/CANONICAL-KINDS.md` | ontology route | 2026-07-08 | **No** |

> **Not one cav2 enumeration was authored by a route empowered to decide it.** That is stronger than my original claim and it is fully attested.

**HOLDS (1) — THE OWNER. A route IS admissible, and both merges leave it unnamed.**
`AUTHORITY-MODEL.md` §Narrowest Owner Rule: *"A rule should constrain future artifacts. → **constitution-governance**."* A closed, default-deny type enumeration is exactly a rule constraining future artifacts. And constitution-governance **already co-owns the only gated act in this corpus**: `decisions/2026-06-23-authority-kind-closure-catchall-row.md` — *"Owner route: **decision-gate + constitution-governance**"*.
**Answer: constitution-governance owns the merged type model; definitions-governance owns the head-term cards; the ontology route keeps projections and nothing else.** Required change: one row in the Narrowest Owner Rule table — *"An artifact type is added, merged, split, or retired. → constitution-governance (gate: decision-gate)"* — plus deletion of the phantom owner `"CyberAlchemy v2 authority owner"` from `AUTHORITY-MODEL.md:4`. **"Neither Lawvere's merge nor Bénabou's merge says which file the merged table lives in or who may amend it. That is the whole of my claim that the merge changes nothing, and it stands unanswered."**

**HOLDS (2) — closure asymmetry survives his critique and hands him the owner.** *"Bénabou's Finding 5 is the one thing with a proper owner… So the **closed** tier is the **well-owned** tier, and the **open** tier is the **orphaned** one. The asymmetry is real, and it is not a domain fact — it is **the shadow of the one place a real owner touched the model**. Give the whole table to that owner and the asymmetry becomes a policy setting (`closure: closed | additive`), not an architecture."* Predicate closure on **owner**, not on a bool.

**HOLDS (3) — THE ROUTER, confirmed verbatim.** `AGENTS.md:36-41` and `CLAUDE.md:36-41` (byte-identical), route 3: *"Routing: `cyberAlchemy-v2/SOURCE-MAP.md`, `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md`."* `AUTHORITY-MODEL.md` — the ACTIVE table — is named in neither router file.
**One-line fix, both files:** replace `` `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md` `` with `` `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md` ``. **"Ship this before any merge; it is free, it is reversible, and it stops the next agent from re-authoring a fifth table."**

### Ashby — final verdict

*"I move, and here is the reason: Lawvere and Bénabou converged on the same merge, so the concept question is **closed** and I accept their answer. I no longer say the merge changes nothing; it deletes a real duplication. I say it **does not touch the defect that produced the duplication**, and the record now proves that defect precisely: **no CyberAlchemy v2 route has ever been empowered to decide a type enumeration, and all five were authored anyway** — twice by the ontology route in a single commit, once under an owner name that does not exist in its own routing table, once inside a commit whose message is 'wip … checkpoint in-progress work'. Merge the tables tomorrow and the merged table has: a router pointing at the retired copy, a validator requiring instances to declare the very column the merge just made derived, a definitions route that renamed its fields without a gate, and no admissible amender. **The concept was never the load-bearing thing. `authority_kind` is a column; `canonical_kind` is a column; the tier was never the unit of ownership — the FILE was, and there are five of them.**"*

> **FINAL: merge as Lawvere specifies, then move the merged table into `authority/constitutions/` under constitution-governance with decision-gate as its amendment gate, retire `AUTHORITY-KINDS.md` and `NODE-MODEL.md`'s concept table to tombstones, and fix the router in the same commit. If the merge ships without the owner move, this review will be re-run in six weeks against six tables.**

### Ashby — NEW findings from the confrontation

**N1 — CRITICAL. The closure decision, the table it closes, and the catch-all row it adds all entered the tree in ONE commit — a "wip" checkpoint.**
`git log --diff-filter=A` and `git log -S'any unenumerated kind'` both return the same commit for `decisions/2026-06-23-authority-kind-closure-catchall-row.md`, for `authority/AUTHORITY-MODEL.md`, and for the catch-all row: **`224331e4` — *"wip: cav2 authority-lifecycle schema + inventory + governance-review spell; checkpoint in-progress work"* (2026-06-24)**. The decision is *dated* 2026-06-23, but **no version of the table exists in the repository that predates its own closure decision.** Decision-gate did not ratify an existing enumeration; the enumeration and its ratification were written together and committed as work-in-progress. **Bénabou's sole surviving defence rests on this act.**
*Fix:* re-ratify `CAV2-D49` closure against the current table, as a standalone gated decision, before the merge relies on it.

**N2 — CRITICAL. The ontology route amended an enumeration that a decision had already ratified — non-collapse rule 2, violated, dated, in the tree.**
`decisions/2026-07-13-canonical-kind-one-label.md`: *"## The enumeration (22 values)"*. `CANONICAL-KINDS.md`, ~24h later: *"**`findings` — added 2026-07-13 (owner instruction).**"* — a **23rd row**, decision never amended or superseded. `AUTHORITY-MODEL.md` Non-Collapse Rule 2: *"Ontology can model authority, but it cannot decide authority."* **Bénabou found the row; its significance is jurisdictional, not semantic — it is the first attested instance of the ontology route deciding authority. An owner *instruction* is not an owner *decision record*.**
*Fix:* supersede the 2026-07-13 decision with a 23-value version, or strike the row until it is.

**N3 — MAJOR. A fourth route mutates the type model with no gate from the two that claim to own it.**
`DEFINITION-DRIFT-AUDIT.md:231-237` (definitions-governance) certifies a **field rename inside the ontology route's table**, mirrored into the authority route's table. Whether or not the rename is semantically null, the *act* crossed two owner boundaries under a drift-audit heading. **"Lawvere reads this line as proof the tier is a column; I read it as proof that four routes can write to this model and none can decide it."**
*Fix:* type-model field renames route to the type-model owner (constitution-governance) with a decision record; **the drift audit reports, it does not certify.**

---

# Convergence check (collapse detection)

The three attackers converged on one merge. This is not premature convergence:

- Each **moved from a distinct starting position** and named its concessions explicitly.
- The defender (Bénabou) was assigned to break the merge, hunted five specific counter-example classes, and **reported four as negative results** before conceding.
- **Residual disagreement survived and is real**: Bénabou and Lawvere both **reject the merge as the review question worded it** (`authority_bearing: bool` is lossy — it names 13 rows where the owner-ratified instance contract needs 10). The question's proposer (parent) was wrong on this point and was corrected by his own red team.
- Ashby **partially falsified his own causal thesis** against the git record and withdrew the strong form.
- The convergence produced **six NEW findings** that no attacker held in round 1 (the admission-schema inversion, the definitions-rebuild pre-emption, the D49 downgrade, the `wip`-commit closure, the jurisdictional reading of the 23rd row, and the drift-audit boundary crossing).

Verifier round follows: Wittgenstein (vacuity) and Hacking (precedent).
