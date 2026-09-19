# Findings — OQ-6 open questions: exception-lane permanence + edge-witness reading

Dispatch: `2026-07-08-open-questions-noncollapse` · type: research · exit: **resolved**
Final approver: Vlachopulos (auditor) — **ACCEPT**. 8 agents (4 explorer / 1 synthesizer / 2 skeptic / 1 auditor), 1 zig-zag loop.
Source questions: the two open questions left by [2026-07-08-d6-node-noncollapse.md](../../../../definitions/reviews/2026-07-08-d6-node-noncollapse.md).

> **One-line answer to both.** Neither question is a fact of nature and neither is "mostly an
> owner decision with a small residue" — **the residue is the structure.** Both answers are
> owner-decidable *only given today's bijections*, and those bijections are the fragile,
> unmonitored, load-bearing part. Two draft claims were **refuted/withdrawn** under review; what
> survives is smaller, mechanically testable, and louder about its own fragility.

---

## The reconciling fact both questions share (verified)

The checker claims to implement DESIGN-SPEC-v2, whose W-edge witness has **four clauses** —
(1) an edge *exercised in a real instance* (NOT the schema's `edge_participation` declaration),
(2) DS-D8 resolution, (3) non-laundering, (4) owner-admitted. The **shipped `wEdge`
([meta-type-noncollapse.ts:105-107](../../../../impl/tools/lib/meta-type-noncollapse.ts#L105-L107))
implements clause 2 alone** — a `setEq` over DS-D8-resolved source/target sets. Clause 1 and
clause 3 are **not in code**; clause 3 is *proxied* by `DEFAULT_EXCEPTION_ALLOWLIST =
{rule,policy,calculation}` ([:21](../../../../impl/tools/lib/meta-type-noncollapse.ts#L21)),
which short-circuits the trio to `exception-lane` at
[:115](../../../../impl/tools/lib/meta-type-noncollapse.ts#L115) *before* the witnesses run.
Both open questions turn on this gap: the spec mandates a certified/exercised witness; the
implementation ships a proxy because the certified form is either un-computable under the moat
(OQ-A) or un-populatable without a corpus (OQ-B). **Auditor-confirmed against source.**

---

## OQ-A — can mechanical detection replace the owner-enumerated exception lane?

| | |
|---|---|
| **Corrected answer** | The honest core is an **induction / identifiability limit — mechanically testable, NOT a moat/undefinability limit.** The question "is `formal_return_type ↦ (verb,target)` a *law* or an *accident of the current rows*?" is decidable by inspecting the registry; it never requires reading a value's meaning. |
| **Max defensible modal** | **"Stable while D15 and the owner's laundering-judgment hold, over the registry as it stands."** Not "permanent," not "conditionally permanent" — *axiom-relative and registry-relative.* |
| **Owner decision (crisp)** | Keep D15's moat AND keep judging the trio's `enforces/applies/calculates` edges as laundered correlates of `formal_return_type`? If yes → the allowlist stands. If a trio-separating edge with an endpoint typing *provably independent of* `formal_return_type` ever appears → the lane dissolves for that pair. |

**Withdrawals / demotions forced by review:**
- ❌ **WITHDRAWN — "certification is moat-forbidden."** Testing the functional dependency
  `value ↦ verb` treats the value as an **uninterpreted equality key** — exactly what
  `attribute-equals` already does opaquely — and never parses meaning. Co-variation is
  **shape-detectable without a moat read**; the claim was self-refuting (Gödel, construction A).
  An owner-provenance annotation (`derived-from` / `independent-of`) also makes certification
  architecturally available via the owner gate the design already ships (construction B).
- ⬇️ **DEMOTED — the keystone total function `{boolean↦enforces, strategy↦applies,
  value↦calculates}` is FALSE at n=3.** Calculation sources **two** verbs with **different
  targets** — `calculates→Operation`
  ([relationships.yml:100-102](../../../../definitions/relationships/relationships.yml#L100-L102))
  and `queries→Entity`
  ([relationships.yml:229](../../../../definitions/relationships/relationships.yml#L229)). So the
  edge carries information *beyond* the return sort; where a sort maps to multiple `(verb,target)`
  with distinct targets, shape-detection certifies "clean" outright (Taleb; **auditor-verified
  against source**).
- ❌ **STRUCK — "permanent."** D15 is an amendable owner-decision convention carrying a misuse
  warning ([DEFINITIONS.md:591](../../../../definitions/DEFINITIONS.md#L591)), not a theorem.

**The genuinely hard residue narrows to one case:** a hypothetical type byte-identical in
`(verb, target, formal_return_type)` to Rule (Taleb's "Scenario A2"), separable only by author
self-declaration. That is an **identifiability gap** (law vs. artifact), not undefinability — and
it is the *only* thing the lane irreplaceably covers.

**Two independent defeaters — preserved, do not collapse:**
- **Gödel (MODAL):** "permanent" fails even in a **frozen** registry — it rests on a repealable
  axiom with no backing theorem.
- **Taleb (EMPIRICAL):** the bijection is **fragile to the 15th meta-type** and unmonitored — and
  *already leaking* via Calculation.
- A registry-relative impossibility proof can be **sound AND fragile at once**; neither defeater
  subsumes the other.

**Hidden antecedent (elevated from footnote):** the collapse-resistance holds only while *each
`formal_return_type` sort maps to exactly one `(verb,target)` pair* — **unmonitored, and already
violated.**

---

## OQ-B — is the edge witness "authority-resolved" the right permanent reading, or must it tighten to "exercised instance"?

| | |
|---|---|
| **Corrected answer** | **The closure invariant that would make authority-resolution permanently sound is ILL-POSED** (upgraded from "unsound now"). It quantifies over "composes into different code" — Rice-undecidable in general — rescued to decidable only by pinning to D3's finite 4-axis proxy. **Proxy and target diverge exactly on D3's own clean-widening corollary.** |
| **The static contradiction** | [DEFINITIONS.md:111](../../../../definitions/DEFINITIONS.md#L111) — admissible IFF *composes into different code*; [:115](../../../../definitions/DEFINITIONS.md#L115) — *"widen a SOURCE endpoint (same target, same semantics) = clean"* admits a type **because it does NOT compose into different code.** Present at **N=14, no new type needed** (Gödel; **auditor-confirmed**). |
| **Owner decision (crisp)** | Adopt "every DS-D8 signature endpoint must be backed by an exercised, D3-witnessed edge" as a **promotion gate**? If yes → authority = exercised by construction, `wEdge` (clause 2) is a permanently-sound cache. If no → build the instance corpus and flip `wEdge` to clause 1, eating the collapse until coverage lands. |

**Withdrawal:** ❌ **"closure invariant → memoized cache → converge."** A cache memoizing an
ill-defined key does not converge; it stabilizes on the proxy's blind spot. And clean-widening is
the move the edge-law economy **prefers** ([:119-120](../../../../definitions/DEFINITIONS.md#L119-L120)),
so ghost endpoints are a **permanent generator**, not a one-time audit — the corpus already shows
`queries`=3 sources, `exposes`/`applies`=2 targets.

**The 28× / 8→1 collapse claim carries two silent assumptions — surface both:**
1. **It keys DS-D8 resolution on `feature_scope`.** Saga and Workflow both source `orchestrates`
   ([relationships.yml:148-177](../../../../definitions/relationships/relationships.yml#L148-L177)),
   two rows differing by `source_type` and `feature_scope`. **Key on verb-id alone and Saga~Workflow
   collapse today** — no new type needed. Any collapse count must ship *with its resolution key.*
2. **It conflates transient-collapse** (types whose distinction the corpus *will* exercise) **with
   structural-collapse** (genuinely vacuous types that *should* merge). Reporting one aggregate
   hides the signal that some types ought to be retired.

---

## Verdict table

| # | Question | Verdict | Owner / evidence |
|---|---|---|---|
| OQ-A | Can mechanical detection replace the exception lane? | **Not within the moat by certification — but "moat-forbidden" and "permanent" are WITHDRAWN.** Honest limit = finite-corpus identifiability; hard residue = Scenario-A2 author-declaration case only. Owner-decidable, but on a *fragile unmonitored bijection*. | internal (checker + DEFINITIONS + relationships.yml); external (nominal/structural typing, Tarski, Rice — all **demoted to analogy, none load-bearing**) |
| OQ-B | Is authority-resolution the right permanent reading? | **No by the design's own lights (spec already mandates exercised) — and the invariant that would rescue authority-resolution is ILL-POSED.** Resolvable by one owner decision (closure-as-promotion-gate) OR forced-tighten if the clean-widening audit finds a zero-composition membership. | internal (wEdge, D3, DS-D8, clean-widening corollary); external (functorial semantics / Spivak; coalgebraic behavioral equivalence / Jacobs) |

---

## Deciding tests — now runnable (no new corpus needed)

- **T-A1 (identifiability):** enumerate `formal_return_type ↦ {(verb,target)}` over active rows;
  any sort → ≥2 pairs means the total function is an accident. **Already TRUE for `value`.**
- **T-A2 (co-variation as opaque key):** run `value ↦ verb` as an equality-key check across
  instances — a covariation that holds is shape-*certifiable*, one that breaks is *detected*;
  either way no moat read. This is the concrete refutation of "moat-forbidden."
- **T-A3 (A2 probe):** search for two active types sharing an identical
  `(verb,target,formal_return_type)` triple → a genuine author-declaration-only distinction.
- **T-B1 (proxy divergence):** compute D3's 4-axis proxy per edge; flag pairs identical on all 4
  axes but distinct as types → clean-widened phantoms (expect `orchestrates` under verb-id keying).
- **T-B2 (resolution-key sensitivity):** recompute the collapse count under key = verb-id /
  (verb-id, feature_scope) / (verb-id, source, target). The count is meaningful only *with its key.*
- **T-B3 (transient/structural split):** partition each collapse set by "does any pending corpus
  row add a distinguishing axis-value?" → transient; else structural (escalate for merge).

---

## Implications for the D6 residue note

1. Replace "conditionally permanent" with **"stable while D15 + owner laundering-judgment hold,
   registry-relative"** — a live promotion-gate obligation, not a property.
2. Record **both defeaters separately** (Gödel-modal, Taleb-empirical); do not let one absorb the other.
3. Move the **bijection antecedent** (each `formal_return_type` sort ↦ one `(verb,target)`) into the
   D6 claim — and note it is **already violated** (Calculation).
4. Strike **"certification is moat-forbidden"** → "certification is architecturally available
   (opaque equality-key test + owner-provenance annotation); the surviving limit is finite-corpus
   identifiability."
5. State the **OQ-B antecedent as ill-posed** (Rice-undecidable, proxy-pinned; diverges on the
   clean-widening corollary).
6. Every collapse count ships **with its resolution key** and a **transient/structural split.**

## Implications for the checker — instruments review forced

| Instrument | What it does | Fires on |
|---|---|---|
| **Bijection-monitor gate (OQ-A)** | maintains `formal_return_type ↦ {(verb,target)}`; **warn** when a sort maps to ≥2 pairs (target already separates them → lane unnecessary), **escalate** when a `(verb,target,return)` triple hosts ≥2 types (Scenario A2 hard collapse) | already warns on `value` |
| **Clean-widening non-separation fix (OQ-B)** | mark clean-widened endpoints (same target, same semantics, widened source) **non-separating in `wEdge`** so they cannot manufacture phantom distinctions | `orchestrates`, `queries`, `exposes`, `applies` |
| **Declare the resolution key** | the checker must state whether DS-D8 resolution keys on verb-id / +feature_scope / +endpoints — Saga~Workflow collapse depends on it | `orchestrates:148-177` |
| **Transient-vs-structural split** | partition every collapse set; never report a bare aggregate | the 28× set |
| **Annotate `wEdge` + allowlist** | docstrings currently read as if `wEdge` is the full a1 fix — it is clause-2-only; the allowlist is a clause-3 proxy | `meta-type-noncollapse.ts:21,105-107` |

---

## Verification pass — the three declared-open items, now CLOSED (strategist, 2026-07-09)

All three ran. Two confirmed the synthesis; **one inverted it, and it changes the D6 blocker.**

**1. Magnitudes — CONFIRMED exactly.** `npx tsx tools/validate-meta-types-noncollapse.ts --report`:
14 meta-types, **91 pairs = 36 exception-lane + 27 W-edge-only + 27 W-struct+W-edge + 1 no-witness**
(Saga ~ Workflow). Jacobs' "27 survive solely on the authority-resolved edge witness" is exact. The
projected 28× (flip `wEdge` to exercised-instance → all C(8,2)=28 pairs among the 8 attestation-only
types collapse) follows by construction: those 8 have empty `structKeys`, so removing the edge witness
leaves them with none. **Sound as a projection.**

**2. DS-D8 resolution key — CONFIRMED, and the synthesis had it BACKWARDS.**
[validate-meta-types-noncollapse.ts:109-112](../../../../impl/tools/validate-meta-types-noncollapse.ts#L109-L112)
`buildEdgeMaps` adds **`edgeId` alone**; `feature_scope` is never read. And `orchestrates` is **two
rows with the same id** — `source_type: Workflow, feature_scope: [same-feature]` and `source_type:
Saga, feature_scope: [cross-feature]`. Both types therefore receive `{orchestrates}` in `sourceE`,
the sets compare equal, `wEdge` returns false, and — both being attestation-only — the pair collapses.

> ⚠️ **The synthesis claimed the 28× story "silently keys on `feature_scope`." It does not. The
> checker keys on verb-id ONLY — and that is precisely WHY Saga~Workflow collapses.** Taleb's
> conditional ("key on verb-id alone and they collapse today") is not a hypothetical: it is the
> shipped behaviour.
>
> **Consequence for `DEC-DSV2-SAGA-MERGE` (the sole blocker on D6 promotion):** the one live collapse
> is **an artifact of the resolver discarding `feature_scope`**, not a demonstrated semantic
> redundancy. The authority *already* distinguishes Saga from Workflow (`cross-feature` vs
> `same-feature`); `wEdge` throws that field away before comparing. Corroborating tell: the session's
> own merge plan was "apply Saga → Workflow **+ a `scope` flag**" — i.e. the merge *reintroduces the
> very distinction it erases*, which is a rename, not an elimination.
>
> **Recommendation (owner call, not applied): do not treat the default `merge` as licensed by the
> checker.** Either (a) make `wEdge` key on `(edgeId, feature_scope)` and re-run — if Saga~Workflow
> then separates, the collapse was spurious and D6's third challenge fires zero times; or (b) rule
> explicitly that `feature_scope` is *not* a distinguishing axis under D3, and merge on that stated
> ground. What is not defensible is merging on the strength of a collapse the resolver manufactured.

**3. `attribute-equals` opaque-token semantics — substance CONFIRMED, citation was WRONG.**
`relationships.yml:17` is `"signature_count": 31`, not `attribute-equals`; the reviewer's locator was
bad. The real evaluator is
[validate-content.ts:203-219](../../../../impl/tools/validate-content.ts#L203-L219): it lowercases the
declared cell and does a **string equality compare** — an opaque token test that never parses meaning.
So **Gödel's construction A stands** (co-variation is shape-detectable without a moat read), on a
different locator than he gave. The `ATTESTATION` set he meant sits at
[meta-type-noncollapse.ts:17](../../../../impl/tools/lib/meta-type-noncollapse.ts#L17).

Auditor's two copy-edit notes, still applicable: "D15 is an amendable misuse-warning" is a loose gloss
(D15 is the declared-attributes *convention* that *contains* a misuse warning); "Saga & Workflow differ
only by feature_scope" omits their `source_type` difference. Neither touches a load-bearing inference.

**Net after verification:** OQ-A's and OQ-B's answers stand as written. The new fact is that the
**single collapse gating D6 promotion is resolver-manufactured**, which promotes a fourth instrument —
*fix or explicitly defend the `wEdge` resolution key* — to the top of the checker worklist.
