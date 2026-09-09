---
node_type: experiment-criterion
status: FROZEN — validity-checked (Lakatos VALID after F1–F4)
dispatch_id: mint-foundry-boundary-criterion
phase: propose
boundary: INTERNAL — propose-only, run deferred
designer: Popper, Karl
skeptic: Lakatos (validity-check — rendered INVALID-with-fixes on the loop-1 draft; F1–F4 applied here)
loop: 2 (revision)
created: 2026-06-29
frozen: 2026-06-29
grounding:
  - cyberAlchemy-v2/development/mint/SPEC.md (§Outputs — the `<date>-mint.md` signed record; §Inputs — `--source <framework-path>` + `--attach`; §Boundaries — D49 owner-gate; §Inheritance — seed-don't-bind, circularity guardrail)
  - .arcanum/inventory/entries/machine-map-and-moat-synthesis.md
  - cyberAlchemy-v2/authority/AUTHORITY-MODEL.md (D49 closed enumeration — the MOLD; rows = the kind-identity set)
  - PRECEDENT (the hand-done mint, for design grounding only — NOT a scored repo):
      resonantos-economy-research/authority/decisions/2026-06-26-standalone-repository.md
        (mint-act output: names "CAV2 as external method authority for source posture and promotion discipline")
      resonantos-economy-research/authority/decisions/2026-06-29-method-authority-localized.md
        (LATER, separate owner act, triggered by review finding MI4 — superseded the 06-26 clause; this is
         what produced autonomy, NOT the mint)
note: |
  This is a FROZEN pre-registration authored BEFORE any run exists. SURVIVED and
  FALSIFIED are NOT rendered here — they are rendered LATER, at the run, by a separate
  adjudicator reading this file read-only. This document renders only INVALID (if the
  skeptic knocks down internal validity). It passed the design-time validity gates
  (confounds / non-discrimination / reproducibility) after the loop-2 fixes F1–F4. Any
  edit after this freeze is a NEW criterion, never an in-place mutation.
---

# criterion.md — Mint Foundry-Boundary (pre-registration) — FROZEN

## What is being pre-registered

The inventory synthesis `machine-map-and-moat-synthesis` claims cav2 is a **foundry
that manufactures domain authorities**, resting on a **load-bearing but candidate**
(analogy-not-fact) boundary: **meta-authority (inherited) vs object-authority
(localized)** — the "two System-5s one recursion apart" (synthesis line 37; SPEC
line 66). **Mint** (`cyberAlchemy-v2/development/mint/`) is the apparatus that would
instantiate this by casting the cav2 authority spine onto a domain.

A later run will mint repos and check this criterion. This file freezes the success/
failure rule **before** that run, so the run cannot move its own goalposts.

**Loop-2 revision note (validity defects repaired).** Lakatos rendered the loop-1
draft **INVALID-with-fixes**. The four design-time defects and their repairs:
- **F1 — Obs-C was non-discriminating.** "cav2's D49 enumeration stays byte-identical"
  is true by construction (a conforming mint never edits cav2's file) → could never
  FAIL → tested nothing. Obs-C is rebuilt around a failure mode that *can* occur (the
  casting demands the mold change to be operable).
- **F2 — Obs-B was confounded.** It must be scored against the **mint act's own output
  state** (the signed `<date>-mint.md`), *before* any later owner-localization act. In
  the precedent, autonomy arrived only via the **separate** `2026-06-29` decision; the
  mint act itself (the `2026-06-26` record) named CAV2 as method authority — a leak. The
  criterion must not credit the mint for the later human fix.
- **F3 — three fuzzy terms operationalized** into deterministic, re-adjudicable checks.
- **F4 — Obs-A cosmetic-rename hole closed** via the F3(c) membership test (a re-skin of
  a cav2 kind by owner-route is not autonomous localization).

---

## 1. Hypothesis (ONE falsifiable claim)

> **H — Autonomy of the casting.** In a repo produced by Mint, the meta/object
> boundary **holds**: the minted artifact is an **autonomous object-authority** —
> it localizes governance it owns, and it stands in a **non-circular, non-binding**
> relation to cav2 (cav2 is harvested precedent, not a runtime parent, and is not
> mutated into a casting of itself).

This is a single claim about **autonomy of the minted authority**. It is NOT a
conjunction of independent claims: the multiple observables in §3 are jointly the
**falsification condition for this one claim** — each is a way the boundary would be
shown not to hold. Autonomy is the property; the observables are its tests.

**The circularity it is built against.** Mint is *built from* the machine-map model,
so "Mint runs / emits files in the right folders" is **self-confirming and worthless**
as evidence (a model-shaped tool trivially scaffolds model-shaped files). H is
therefore framed so that file-shape conformance alone does NOT satisfy it: the
observables in §3 demand *autonomy* and *non-circularity*, properties a mere scaffolder
would fail. If a later run tries to claim SURVIVED on the basis of "files exist in the
expected shape," that is an automatic **non-satisfaction** of Obs-A and Obs-B below.

**The confound it is built against (F2).** "The minted repo turned out autonomous" is
worthless if autonomy was produced by a **post-mint human act**, not by the mint. In
the hand-done precedent, the mint's own output (`2026-06-26-standalone-repository.md`)
named "CAV2 as external method authority for source posture and promotion discipline";
autonomy appeared only three days later via a **separate, review-triggered owner
decision** (`2026-06-29-method-authority-localized.md`, finding MI4). H is therefore
scored against the **mint act's own output state** and nothing downstream of it.

---

## 2. Non-goals (what this probe explicitly does NOT test)

Stated to keep H a single claim, not scope decoration. The run may NOT take a verdict
on any of these, and a failure of any of these is NOT a falsification of H:

- **N1 — the VSM / "two System-5s" interpretation itself.** Whether the meta/object
  split *is* Beer's System-5 recursion is out of scope; it remains a candidate analogy
  (synthesis line 75). H tests only whether the *boundary as operationalized in §3*
  holds — not whether the VSM reading is correct.
- **N2 — commercial value / the moat.** Attestation-vs-provability, board-WTP, vertical
  (synthesis line 40) are not tested here.
- **N3 — generality beyond the tested domains.** H is checked over the pre-registered
  domain set in §5 only. SURVIVED claims nothing about untested domains.
- **N4 — the AUTHORITY-MAP / GOVERNANCE-ATTENUATION internal contradiction**
  (synthesis line 76; SPEC line 66). That cav2-internal "CONSTITUTION exists vs S5
  missing" contradiction is a separate owner-decision; the run neither resolves nor
  is blocked by it.
- **N5 — whether Mint *should* exist or is shipped.** Mint is intended-not-shipped
  (SPEC line 5). This experiment pre-registers a test; it does not assert the apparatus
  is built.
- **N6 — whether a post-mint owner act can later make a leaky casting autonomous.** Per
  F2, the precedent's `2026-06-29` localization decision *did* repair the `2026-06-26`
  leak. That a human can fix a leak afterward is true and out of scope — H tests the
  **mint act**, scored at its own output state, never the later fix.

---

## 3. Falsification condition (the observables) — all conditions mechanical

For EACH minted repo in the pre-registered domain set (§5), the run evaluates three
observables **against the mint act's frozen output state** (defined in §5: the
post-mint commit whose head includes the signed `authority/decisions/<date>-mint.md`
record and NOTHING authored after it). Each resolves to **HOLDS** or **FAILS**
mechanically by the sub-rules below; the three fuzzy terms are operationalized in §5.

### Obs-A — Autonomous localization (object is genuinely localized — NOT a re-skin)
The minted repo authors **≥ 1 domain-originated authority KIND** AND **≥ 1
domain-originated promotion-policy / constitution rule**, where "domain-originated" is
the F3(c) **membership test** (§5): *neither lexically nor by-owner-route identical to a
cav2 D49 row*.

- **HOLDS** iff the minted repo's authority-kinds table contains at least one kind row
  that **fails the F3(c) membership test against every cav2 D49 row** (i.e. is
  domain-originated — not lexically identical AND not owner-route identical to any cav2
  kind), **and** the minted promotion-policy/constitution contains at least one rule
  that is domain-originated by the same test (not a verbatim, renamed, or
  owner-route-identical copy of a cav2 rule).
- **FAILS** if **every** minted kind and **every** minted rule passes the F3(c)
  identity test against some cav2 D49 row — i.e. each is lexically OR owner-route
  identical to a cav2 kind/rule. The casting is then just cav2 re-stamped, **including
  the semantic-re-skin case**: a row relabeled "Method authority" / "research-credibility
  constitution" whose owner route is `constitution-governance` is **owner-route identical
  to cav2's `Constitution` kind** → does NOT count as domain-originated (F4). (This is
  the precedent's exact pattern — see §5, F3(c).)
- **Anti-circularity / anti-re-skin teeth:** seeding from cav2's tables (SPEC line 65,
  "seed, don't bind") does NOT satisfy Obs-A; a kind/rule that is *new under the F3(c)
  test* must exist. A pure scaffold (cav2 rows copied or relabeled into a new folder)
  FAILS.

### Obs-B — No runtime governance leak, scored at the MINT ACT's output state (F2)
**No cav2 rule is BINDING ON the minted repo at the mint act's own output state.**
Scored on the post-mint commit (§5) — **explicitly before any later owner-localization
decision**. "Operable after attachment removal" is the mechanical test (F3a/F3b).

- **The exact attachment-removal operation (pre-registered, F2/F3).** Delete the
  `--source` framework attach as emitted by the mint (SPEC §Inputs `--attach
  submodule|copy|symlink`): *de-init/remove the submodule, OR delete the copied
  framework tree, OR remove the symlink* — leaving the minted repo's own `authority/`,
  `definitions/`, `constitutions/`, and decision records in place.
- **HOLDS** iff, evaluated on the mint-act output commit:
  (i) **[F3a operable]** every governance rule the minted repo *enforces on its own
  artifacts* resolves to an owner/citation **inside the minted `authority/` surface**,
  with **ZERO unresolved references pointing into the removed cav2 attachment**; AND
  (ii) **[F3b reachability]** for **every** decision on the pre-registered runtime-
  governance-decision list (§5), resolving that decision does **not** traverse an edge
  into the removed cav2 attachment (cav2 appears only as cited harvested precedent /
  provenance, never on the resolution path).
- **FAILS** if, at the mint-act output state, **any** listed runtime governance
  decision resolves by traversing an edge into the cav2 attachment (a live dependency,
  not a citation), OR if removing the `--source` attach leaves any minted enforced rule
  with an unresolved reference into the removed attachment (dangling). **The precedent's
  `2026-06-26` mint output FAILS this** (it names CAV2 as the method authority resolving
  source-posture/promotion/non-collapse decisions); the later `2026-06-29` localization
  is downstream of the output state and is **not** read by Obs-B.

### Obs-C — Non-circular: the casting does NOT demand the mold mutate to be operable (F1)
Rebuilt to test a failure mode that **can occur**. The non-discriminating loop-1 form
("cav2's `AUTHORITY-MODEL.md` D49 enumeration stays byte-identical") is **removed** — it
was true by construction (a conforming mint never edits cav2's file) and could never
FAIL.

- **HOLDS** iff the minted repo's authority surface is **operable on its own artifacts
  using only the minted repo's own kinds/rules** — i.e. every kind/rule the minted repo
  needs to exercise governance on its **own** artifacts is resolvable **without** adding
  a kind to, or altering an existing row in, **cav2's D49 enumeration**
  (`AUTHORITY-MODEL.md`). The casting stands as its own table; the mold is untouched and
  *un-demanded*.
- **FAILS** iff the minted repo's authority surface contains a kind/rule that **cannot
  be exercised on the minted repo's own artifacts unless cav2 ADDS a kind to, or ALTERS
  an existing row in, cav2's D49 enumeration** — i.e. the casting demands the mold change
  to be operable ("the mold mutated into a casting of itself"; meta and object re-fused).
  **Also FAILS** if a promotion / enumeration change to cav2's D49 set is triggered **as
  part of, or automatically by, the mint act** (the mint act opening cav2's closed set is
  itself the re-fusion).
- **Note vs SPEC's D49 owner-gate (line 47):** a *later, separate, owner-ratified*
  promotion of a domain kind back INTO cav2 is a distinct downstream governance act and
  is **not** the mint act — Obs-C does not read it. Obs-C FAILS only when operability of
  the casting *requires* a cav2 D49 change, or when the mint act *itself* effects one.

---

## 4. Mechanical verdict rule (deterministic; resolves ONLY to the three verdicts)

Let the domain set be the N = 3 repos pre-registered in §5. For each repo *r*, the run
records HOLDS/FAILS for Obs-A(r), Obs-B(r), Obs-C(r), **each scored at r's mint-act
output state (§5)**.

```
INVALID    ⟸ rendered NOW (propose), by the skeptic only, if the criterion is shown
             to not test H — e.g. an observable that HOLDS/FAILS regardless of H, a
             confound, or non-determinism in §3/§5. (Not rendered by the run.)
             STATUS: NOT rendered — the loop-2 criterion passed the validity gates
             (Lakatos VALID after F1–F4). See §8.

[ rendered LATER, at the run — NOT in this file: ]
FALSIFIED  ⟸ ∃ repo r in the domain set, ∃ observable X ∈ {A,B,C} : X(r) = FAILS.
             (ANY observable failing on ANY pre-registered domain falsifies H.)
SURVIVED   ⟸ ∀ repo r in the domain set, ∀ observable X ∈ {A,B,C} : X(r) = HOLDS.
             (All three observables hold on every pre-registered domain.)
```

The rule is total over {SURVIVED, FALSIFIED} at run time and admits no third run-time
outcome (no pass/flag/block). The domain set N and its members are frozen in §5 — the
run may NOT add, drop, or swap a domain to chase a verdict; doing so produces a NEW
criterion, not a result against this one.

**Reproducibility property.** A later adjudicator, given THIS frozen file plus a run
result (the per-repo HOLDS/FAILS table fixed at each repo's mint-act output state),
re-derives the verdict by the boolean rule above and reaches the **same** verdict
deterministically — no judgment call remains once the HOLDS/FAILS table is fixed by
§3's mechanical sub-rules and §5's operationalized terms. This is re-adjudication, not
re-execution.

---

## 5. Pre-registered categories (fixed NOW, before the run sees data)

- **Domain set — N = 3**, selected to span distinct authority shapes so a single-shape
  artifact cannot masquerade as general (still bounded by N3):
  1. **research** domain — precedent class of `resonantos-economy-research` (the named
     hand-done mint precedent, SPEC line 22);
  2. **product** domain — a domain whose object-authority governs a shipped artifact /
     feature set (distinct from research-claim authority);
  3. **process** domain — a domain whose object-authority governs a workflow / operating
     procedure (distinct from both above).
  The run MUST mint one repo per category; the three repos are the only repos scored.
  (The *identity* of the product and process domains is fixed by the run's instantiation
  record but each MUST be a genuinely distinct domain, not three flavors of research.)

- **"the mint act's output state" (the scoring boundary for ALL of Obs-A/B/C, F2)** =
  the commit of the minted repo whose head **includes** the signed
  `authority/decisions/<date>-mint.md` record (SPEC §Outputs) and **excludes** every
  artifact authored after it. No decision, prose change, or localization act dated/
  committed after the `<date>-mint.md` record is in scope. (In precedent terms: the
  `2026-06-26` standup record is in scope; the `2026-06-29` localization decision is
  NOT.) All three observables are evaluated against exactly this state.

- **"a cav2 rule binding at runtime" / "a cav2 rule resolves a runtime decision"
  (for Obs-B, F3b)** = there exists a member of the **pre-registered runtime-governance-
  decision list** below whose resolution, at the mint-act output state, traverses an edge
  into the `--source` cav2 attachment. The **runtime-governance-decision list** (fixed
  now; the set of decisions a minted repo makes about its *own* artifacts):
  1. **promote** — admit a candidate to a higher authority rung;
  2. **block** — refuse an artifact that fails a gate;
  3. **admit-kind** — decide whether an artifact's *kind* is allowed to hold authority;
  4. **source-posture** — decide how a source/artifact may be relied on before promotion;
  5. **non-collapse** — decide that evidence/ontology/inventory may not act as authority;
  6. **public/private boundary** — decide whether content may cross the public/private line.
  **Reachability check:** for each, identify the owner/rule that resolves it in the
  minted surface at the output state; mark FAIL if the resolution path includes any node
  inside the removed cav2 attachment. A cav2 reference that is **citation / provenance /
  harvested precedent only** (the minted decision stands unchanged after attachment
  removal) is NOT binding. Discriminator: *dependency vs citation* = does the resolution
  path traverse the attachment.

- **"coherent / operable" (for Obs-B/Obs-C, F3a)** = every governance rule the minted
  repo enforces on its own artifacts resolves to an owner/citation **inside the minted
  `authority/` surface**, with **ZERO** unresolved references pointing into the removed
  cav2 attachment. Operationalized as a reference-resolution scan over the minted
  `authority/`, `definitions/`, `constitutions/`, decision records at the output state.

- **"the cav2 D49 enumeration" (for Obs-C)** = the set of authority-kind rows in
  `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md` §Authority Kinds at the run's start
  commit (the rows: Definition, Constitution, Discipline, Decision, Spec, Runtime
  contract, Projection, Evidence, Residue, + the closure catch-all). Each row's
  **identity** = ⟨kind label, owner route⟩.

- **F3(c) — "domain-originated kind/rule" membership test (binds Obs-A; closes F4)** =
  a minted kind/rule is **domain-originated iff it is NEITHER lexically NOR by-owner-route
  identical to any cav2 D49 row.** Two parts, both must be non-identical for the kind to
  count as domain-originated:
  - **lexical identity** — the minted kind/rule label is a verbatim or trivially-renamed
    copy of a cav2 row label;
  - **owner-route identity** — the minted kind/rule is routed to the **same owner route**
    as a cav2 row AND governs the same authority function (e.g. a row labeled "Method
    authority" or "research-credibility constitution" routed to `constitution-governance`
    governing source-posture/promotion/non-collapse rules **is owner-route identical to
    cav2's `Constitution` kind** — this is the precedent's exact re-skin, and it is
    **NOT** domain-originated).
  A kind/rule is domain-originated only when it is **both** lexically new **and**
  owner-route new (a genuinely new owner route / new governance function, not a relabel
  of an existing cav2 one). Rename-only, copy-only, and owner-route-identical re-skins do
  not count.

- **"scaffold-only / re-skin (the disqualifier)"** = a minted repo whose entire authority
  + policy + constitution content is, for **every** row, lexically OR owner-route
  identical to a cav2 D49 row under F3(c). Such a repo FAILS Obs-A by construction — the
  explicit guard against the circularity-and-re-skin trap.

---

## 6. Discrimination check (both outcomes must be informative)

Pre-registered so the criterion cannot be a one-outcome instrument.

- **A SURVIVED teaches:** the foundry thesis has *empirical traction at the casting
  level* — Mint produces authorities that are genuinely localized and not re-skins
  (Obs-A), runtime-independent of cav2 **at the mint act's own output state** (Obs-B),
  and non-circular — the casting does not demand the mold change (Obs-C). The meta/object
  boundary is not merely asserted in prose; it survives instantiation across three
  distinct domain shapes **without a post-mint human repair**. (It still teaches nothing
  about N1–N6 — notably NOT that the VSM reading is correct, only that the operational
  boundary holds.)
- **A FALSIFIED teaches:** the boundary is **decorative, not load-bearing** — the
  "foundry" is a scaffolder that re-stamps or re-skins cav2 (Obs-A fail), or it smuggles
  cav2 as a runtime parent **in the mint act's own output** (Obs-B fail = governance leak,
  the exact Conant-Ashby re-fusion the synthesis warns of at line 38 — *and the
  precedent's `2026-06-26` mint output is exactly this*), or the casting cannot operate
  without the mold mutating (Obs-C fail = the circularity the whole pre-registration
  exists to catch). Any of these tells the cav2 authority owner that the "two System-5s"
  boundary cannot yet bear the foundry claim *without a manual post-mint fix*, and *which*
  leg cracked.

- **All three legs can now actually crack (F1 confirmation).** Before F1, Obs-C was
  true-by-construction and could never FAIL, so FALSIFIED could only ever come from
  Obs-A/Obs-B. After F1, Obs-C **can** FAIL (when the casting demands a cav2 D49 change to
  be operable, or the mint act itself opens cav2's closed set) — so the discrimination
  check is genuine across all three observables.

- **Most likely FALSIFIER (named concretely):** **Obs-B, runtime governance leak at the
  mint-act output state.** A Mint built *from* the machine-map model will most naturally
  emit a standup record that names cav2 as the method authority resolving source-posture/
  promotion/non-collapse decisions (inheriting the *mold* is cheap; authoring a genuinely
  self-standing object-policy in the mint act is the expensive part) — **this is exactly
  what the hand-done precedent did** (`2026-06-26`: "CAV2 as external method authority"),
  and it took a *separate later human decision* to fix. The predicted concrete failure: a
  minted repo whose promotion/admission/source-posture decisions, at the output state,
  resolve by traversing into the cav2 attachment, so removing the `--source` attach
  leaves them dangling. Obs-A (scaffold-only / re-skin re-stamp, incl. the owner-route
  re-skin) is the second most likely.

Both outcomes are informative and point to different owner actions ⇒ the criterion
passes its own non-discrimination axis by design.

---

## 7. Pre-registered names/categories — index

Every label the run will use is fixed above before it sees data:
domain set (research/product/process, §5); the mint-act output-state scoring boundary
(§5); the runtime-governance-decision list (6 members, §5); the cav2 D49 row-identity set
(§5); the F3(c) lexical+owner-route membership test (§5). No label, bucket, or threshold
is left for the run to coin post-hoc.

---

## 8. Validity gates passed (design-time, before freeze)

The skeptic (Lakatos) attacked the loop-1 draft and rendered **INVALID-with-fixes**; the
loop-2 criterion above repairs all four defects and now passes the three design-time
validity axes:

- **confounds (F2 closed)** — Obs-B is scored against the mint act's own output state
  (the `<date>-mint.md` commit), explicitly excluding any later owner-localization act;
  the precedent's post-mint `2026-06-29` fix can no longer be miscredited to the mint.
- **non-discrimination (F1 closed)** — Obs-C is rebuilt around a failure mode that *can*
  occur (the casting demanding a cav2 D49 change to be operable); all three legs can now
  actually FAIL, so the criterion genuinely tests H rather than passing regardless of it.
  Obs-A's re-skin hole is closed (F4) so a cosmetic rename of a cav2 kind cannot spoof a
  HOLD.
- **reproducibility (F3 closed)** — "coherent/operable", "a cav2 rule resolves a runtime
  decision", and "domain-originated kind/member of D49" are operationalized into a
  reference-resolution scan, a pre-registered decision list + reachability check, and a
  lexical-AND-owner-route identity test — so the frozen file + a run result yield the same
  verdict under re-adjudication.

**Verdict at this phase: not INVALID.** The criterion is **FROZEN — validity-checked
(Lakatos VALID after F1–F4)**. SURVIVED / FALSIFIED remain **deferred to the downstream
run**, which consumes this file read-only.

---

## 9. Freeze marker

**This criterion is propose-phase, INTERNAL, run-deferred, and FROZEN.** It passed the
design-time validity gates after F1–F4 and is now read-only. The run is a separate
downstream dispatch that consumes this file unchanged and renders SURVIVED or FALSIFIED.
**Neither verdict is rendered in this file.** Any edit after this freeze is a NEW
criterion, re-entering the P2 gate as a fresh proposal — never an in-place mutation.
