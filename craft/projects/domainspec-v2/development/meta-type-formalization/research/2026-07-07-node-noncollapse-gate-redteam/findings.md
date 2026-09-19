# findings.md — node-noncollapse-gate-redteam

Review dispatch `2026-07-07-node-noncollapse-gate-redteam` (`dispatch_type: review`, `meta: true`).
Target: the **proposed** node non-collapse gate — `domainspec-v2-D-node` + a D18 amendment ([DESIGN-SPEC.md](DESIGN-SPEC.md)). Attacker record: [attacks.md](attacks.md).
Method: 3 attackers (vacuity/Taleb · definitional/Tarski · counter-example/Turing, `robot_talks`) → synthesizer (Mac Lane) → 2 verifiers zig-zag (Gödel/definitional · Sattler/counter-example) → coverage auditor (Vlachopulos, `final_approver`).
Verdict: **FIX** — 5 CRITICAL + 3 MAJOR survive verification; 2 findings dropped on refutation; 1 tightened.

**Overall shape.** The design has one *structural spine* error and one *load-bearing mechanical* hole, and they must be fixed in order:
1. **Spine (b1):** the gate is amended onto the wrong card — node formation is D6's, not D18's. Fix this FIRST; the rest is being debugged on the wrong authority until it moves.
2. **Hole (a1):** `edge_participation` is attestation masquerading as structure, so W2 — the gate's only claimed non-attestation witness — is not an independent witness at all. This directly produces the internal contradiction c1.

---

## Target (a) — D-node rule & admissibility witnesses (§1) — verdict: **FIX**

| # | file | evidence | severity | verdict | proposed fix |
|---|------|----------|----------|---------|--------------|
| a1 | DESIGN-SPEC §1 W2 + collapse-test cond. 2; `saga`/`workflow`.schema.yml | Collapse test reads DS-D8 slices (`source_of ∪ target_of`) as raw sets; §3A never re-runs D3. Sattler constructed the rescue: append any registered edge (e.g. `contains`) to Saga's declared list → slices differ → W2 clause 1 holds, clause 2 ("edge passed D3") holds because `contains` is a registered type — the gate **passes it**. DS-D8 law: "do not use schema `edge_participation` slices as independent authority; they are evidence checked against DS-D8." | **CRITICAL** | CONFIRMED | W2 counts only if it yields a **separating, exercised instance**, with every distinguishing edge resolved through an **active DS-D8 signature** — never raw slice set-inequality. |
| a2 | DESIGN-SPEC §1 W1; `entity`/`value-object`.schema.yml | W1 fires on rule-*keyword* alone. Entity and Value Object carry a byte-identical `typedness: {rule: all-nonempty, column: Type}` — vacuously true for any well-formed table, separating nothing, yet credited as a structural witness. | **CRITICAL** | CONFIRMED | W1 must demand a **separating table** (accept-A / reject-B) that discriminates against the *paired* type, not mere presence of a structural keyword. |
| a3 | DESIGN-SPEC §1 W3 | "Provably semantic and non-constructible under D15" is not machine-decidable — D15 forbids the parse that would verify it; the validator can only confirm a reason string exists. | MAJOR | CONFIRMED | W3 = **closed owner-enumerated allow-list**; each entry a resolved D15 challenge-contract row, not free prose. |
| a4 | DESIGN-SPEC §1 verdict; DEFINITIONS §D17 | D17's write-authority proviso — "no modeling surface may write directly to a node's promotion-status" — exists verbatim (verified). A node authoring its own W1/W2/W3 witness is a modeling surface participating in its own promotion. Tightened: the write is **indirect** (the gate reads the witness), so "directly" is not literally met. | MAJOR | **PLAUSIBLE** | Route witness admission through an owner gate; the node may not author the artifact that clears its own gate. Frame, not a standalone mechanism. |

## Target (b) — card ownership / D18 amendment (§2) — verdict: **FIX**

| # | file | evidence | severity | verdict | proposed fix |
|---|------|----------|----------|---------|--------------|
| b1 | DESIGN-SPEC §2; DEFINITIONS §D18, §D6 | **THE SPINE.** D18's boundary: "governs relationship promotion, **not DS-D1 meta-type formation**." Node admissibility is D6's (challenge contract: "fits no meta-type, or needs two"). Non-collapse ("do two reduce to one") is a **missing third D6 challenge**. Amending D18 mutates a card that disclaims the subject. | **CRITICAL** | CONFIRMED | Add the non-collapse challenge to **D6**, not D18. Resolve this before the mechanics — a1–a4 / c1–c2 are otherwise debugged on the wrong card. |

*(Dropped: b2 "provenance overreach" — REFUTED. "Built-from-owned … cites cav2, transfers no cav2 authority" is exactly the no-transfer provenance locution Obs-B permits; no authority-transfer claim is made.)*

## Target (c) — validator & rule classification (§3) — verdict: **FIX**

| # | file | evidence | severity | verdict | proposed fix |
|---|------|----------|----------|---------|--------------|
| c1 | DESIGN-SPEC §1 verdict vs §3 acceptance vs §3A emit | **Internal contradiction, gaming-independent (constructed).** Real slices: Rule {enforces,mirrors} / Policy {applies} / Calculation {calculates,queries,applies} all differ → §1 clears the trio via W2, W3 never demanded; but §3 says "MUST demand W3 for Rule/Policy/Calculation" and §3A emits `attestation-only-node`. Three spec halves, opposite verdicts, same 3/14 types. No validator satisfies all three. | **CRITICAL** | CONFIRMED | Follows from a1: once W2 requires DS-D8 resolution, the raw-slice rescue of the trio closes and §1/§3/§3A reconcile. |
| c2 | `value-object.schema.yml`, `enum.schema.yml` (+ all 14) | **Classifier non-total (constructed).** 7 distinct `rule` keywords on disk — `at-least-one`, `all-nonempty`, `attribute-equals`, `attribute-present`, **`none`**, **`section-contains`**, **`table-has-column`**; §1 classifies only 4. `table-has-column` is **Enum's ONLY criterion** → the classifier is undefined on Enum → over-rejection risk. | **CRITICAL** | CONFIRMED | Ship a **total** rule→{structural,attestation} map over all 7 keywords before the validator runs; classify `none`/`section-contains`/`table-has-column` explicitly. |

## Target (d) — anti-tautology fixture (§3C) — verdict: **FIX**

| # | file | evidence | severity | verdict | proposed fix |
|---|------|----------|----------|---------|--------------|
| d1 | DESIGN-SPEC §3C | The meta-test perturbs one variable (`scope`). The a1 (declared-slice) and a2 (vacuous-structural-rule) channels are orthogonal and untouched → passing proves only that `scope` is ignored, not that the gate reads structure. Advertises coverage it lacks. | MAJOR | CONFIRMED | Quantify tautology-freeness over **all** declared attestation values (every `attribute-equals`/`attribute-present` key), not the single `scope` flip. |

---

## Dropped on verification (claim ≤ proof)

- **b2 — provenance overreach.** REFUTED (Gödel): Obs-B expressly permits "built-from-owned" provenance citation; D3 carries the identical no-transfer framing.
- **Over-rejection vs D15 (Tarski F2 residual).** REFUTED (both verifiers): D15 sanctions attestation for *typing*, not for *earning a distinct node slot* (Turing wins the literal reading); and Sattler proved the residual class is **empirically empty** — the only slice-colliding pair on the entire 14-registry is Saga~Workflow, which is the *intended* merge, not an over-rejection.

## Reframed (mechanism corrected, defect survives)

- **D3 source-widening (Taleb a).** The specific mechanism — "add `compensates` to Saga's `source_of`; D3 blesses the widening → W2 fires" — is REFUTED: D3's corollary makes source-widening the *clean / no-new-type* case, which yields **no** W2 distinction. The defect survives under a1 via a different mechanism (reuse any registered edge; the current spec reads raw slices with no DS-D8 resolution).

## Residue — the meta-finding to carry forward (not a defect, a design limit)

All three attackers converged on "require a **separating witness**." That restores the gate's *soundness* but not its *decidability without the engine moat*. **Taleb's unresolved flag:** a separating witness for a *semantic* discriminator (Rule vs Policy = boolean vs strategy) may exist only behind the engine moat that D8/D15 forbid the validator to cross. The honest consequence: a residual class (the `formal_return_type` trio) may be **non-collapse-checkable at the shape layer** — this should be authored as a **declared, owner-owned exception**, not laundered through a self-certifiable W3. A correct fix must not silently reintroduce the moat-crossing it claims to avoid.

## Change-request list (by severity, spine-ordered)

1. **b1 (CRITICAL)** — re-seat the gate on **D6** (add non-collapse as its third challenge); withdraw the D18 amendment. *Do first.*
2. **a1 (CRITICAL)** — W2 must require a separating, exercised instance resolved via active DS-D8 signatures; forbid raw-slice set-inequality.
3. **c1 (CRITICAL)** — reconcile §1/§3/§3A on Rule/Policy/Calculation (falls out of a1).
4. **c2 (CRITICAL)** — make the rule→class map total over all 7 on-disk keywords; define Enum's `table-has-column`.
5. **a2 (CRITICAL)** — W1 must separate the paired type, not merely present a structural keyword.
6. **a3 (MAJOR)** — W3 → closed owner-enumerated allow-list.
7. **d1 (MAJOR)** — anti-tautology test → quantify over all attestation values.
8. **a4 (MAJOR, PLAUSIBLE)** — route witness admission through an owner gate per D17; the node cannot self-author its clearing artifact.

**And carry the residue:** design an explicit declared-exception lane for shape-un-checkable semantic discriminators, instead of assuming W3 can witness them.
