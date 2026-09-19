---
node_type: research
is_session: false
status: candidate
created: 2026-07-07
authored_by: domainspec-subagents-strategy (review dispatch 2026-07-07-metatype-method-carving-soundness)
final_approver: parent
note: >
  Conceptual-soundness RED-TEAM (dispatch_type review) of the meta-type + edge DEFINITION METHOD
  and CARVING — NOT the implementation. Scope: is the method of defining meta-types by
  machine-checkable structural criteria + edge-participation signatures sound, and does the
  carving of 25 types + 31 edges make sense. Verdicts below are POST-VERIFICATION: two
  independent verifiers (empirical + definitional) refuted or downgraded the most dramatic
  solo-pass findings. Companion transcript: research.md.
---

# Findings — Meta-Type Method + Carving Soundness (review-2026-07-07)

## Bottom line

The foundation is **not rotten — it is over-claimed, and has one real carving error.** The
method is sound **at the bar it set for itself** (shape-level validation, meaning explicitly
disclaimed by the moat). The two most catastrophic solo-pass findings did **not survive
verification** — they attacked a promise `DEFINE.md` explicitly renounces. What remains is
actionable and honest, not existential.

**The verification is the result.** Adversarial refutation prevented an inflated verdict:

- *"Rule/Policy/Calculation is structurally unkeepable — the true fault line"* → **REFUTED.**
  `DEFINE.md` fires FALSIFIED only if a type "cannot be made checkable **without running the
  implementation**" (L47-50). The declared-attribute check (D15) *is* a decidable predicate
  that runs without the engine. The promise is met — at shape level. The residue (the tag is
  not verified against the Formal cell) is the conceded moat, verbatim.
- *"Vacuous discrimination" (CRITICAL)* → **downgraded to a transparency finding.** `DEFINE.md`
  states "Passing = the meta-type is a checkable type, NOT proof of meaning" (L52). The pos/neg
  tag-flip fixture satisfies the SURVIVED condition as written. Nothing is broken; the honest
  residue is that the fixture proves "the validator reads the declaration," not "a mistyped
  concept is caught."

## Verdicts

**(1) Is the definition METHODOLOGY sound? → FIX (sound at the bar it set).**
Sound at the **edge** layer (DS-D8 endpoint-typing genuinely reads structure — which is why
adding edges is non-vacuous by construction). The real defect is single and structural (see
ROOT). The Rule/Policy/Calculation trio is a *declared limitation*, not a defect.

**(2) Does the CARVING (25 types + 31 edges) make sense? → FIX, mostly KEEP (~90% correct).**
Entity/VO, Operation/Query, Rule/Policy all survive (distinct edge-participation = distinct
composition). Two errors of **opposite sign**: Saga over-cut (−1) and the time genre under-cut
(+1) → net ~24 nodes.

## Surviving findings (post-verification, most-severe first)

| # | Target | Finding | Severity | Verification |
|---|--------|---------|----------|--------------|
| **R** | Method / D18 | **ROOT: D18 disciplines edges but EXEMPTS node formation.** No node-level non-collapse gate exists anywhere (D6/D7 carry only *coverage* tests, not collapse tests). A self-declared attribute can mint a type it never structurally earned — this is the mechanism behind both the Saga over-cut and the 11 tag-distinguishers. | CRITICAL | ✅ CONFIRMED (Popper: D18 promotion-boundary text excludes "DS-D1 meta-type formation"; no node non-collapse rule found) |
| **3** | Carving / Saga | **Saga = Workflow + `scope` tag.** `edge_participation` byte-identical in both schemas (`source_of: [orchestrates]`, `target_of: []`); compensation is in BOTH (not a discriminator). Survived only via the ROOT node-exemption. | CRITICAL | ✅ Simon (identical on disk) + OQ-1 RESOLVED ↓ |
| **1** | Method / nodes | **11 of 14 backend distinguishers are author-attestation, not structural checks** (`attribute-equals`/`attribute-present` string-compare on state_change, formal_return_type, scope, temporal, has_transitions, interface_kind, direction). The SURVIVED test is tautological (neg = pos with the tag flipped). Proves "the validator reads the declaration," not "a mistyped concept is caught." | MAJOR (was CRITICAL) | ⬇️ DOWNGRADED — within the conceded moat; the method should DECLARE this limitation |
| **5** | Carving / time | **No Schedule/Timer node.** A `billing_date`/cron trigger is unconstructible (Event requires temporal=past + an Operation/Entity producer; a clock has neither). The one genuinely cross-genre gap. | MAJOR | ✅ Simon (no valid typing under 25×31) |
| **8** | Edge / Rule→Query | **Card-vs-law contradiction:** the Query card lists "Authorization rules" but `enforces` targets Operation only (`reject_non_operation_target`) — the relationship is unconstructible. | MAJOR | ✅ Popper (both texts quoted) |
| **6** | Claim / genre | **"any domain" is literally on record** (TAXONOMY.md L3) but the 25 are visibly DDD/web-genre (Hook, Page, Saga, Adapter). Falsifiable over-claim — ironic in a system whose ethos is "no claim exceeds proof." | MEDIUM | ✅ Popper (quoted; DS-D6 even ships the closure-challenge hook) |
| **11** | Edge / contains | **VO-nesting:** widen `contains` source to `[Entity, Value Object]` (clean source-widen per D3). | MAJOR | ✅ stands (Popper misread this as an Entity→Entity widen and wrongly refuted it — corrected on P8 review; the VO-source-widen is clean) |
| **7 / 10** | New edges | `constrains` (Rule→Entity/Query — a new verb, NOT a target-overload of `enforces`) and `compensates` ([Workflow,Saga]→Operation) — admissible **iff** they cite a distinct D18 composition-path property. | MAJOR (cond.) | ⚠️ CONDITIONAL (Popper) |
| **12** | Edge / Interface→Event | Rejected as derivable (`exposes ∘ produces`). Sub-finding: the taxonomy's OWN example `ExternalGatewayToEvent` is unconstructible (Mapping can't target Event) — a minor card-vs-law inconsistency. | MINOR | ⬇️ NARROWED (Simon) |
| **14** | Method / mechanism | `attribute-present` checks only the key name: `interface_kind \| banana` passes (value column never read). | MINOR | ✅ Simon (traced) |

**Unresolved fork:** **#9 Projection/read-model** — its own node (Lawvere, via Quine's edge-participation test) vs collapses into View Model (Quine). Becomes an owner question (OQ-3).

## Root cause + highest-leverage change

**Root cause (single):** D18 reads structure for *edges* but **exempts node formation** — this one
asymmetry produces both the Saga over-cut (#3) and the 11 tag-distinguishers (#1).

**Highest-leverage change (single):** install a **node non-collapse gate** = Quine's *law* ×
Wittgenstein's *admission standard*: every node type must exhibit EITHER a structural-table
witness OR distinct edge-participation that reads structure — a self-declared tag alone is
inadmissible. This single gate forces Saga to prove structure or merge, forces Schedule to ship
subgraph structure (RRULE/BillingCalendar) or become an attribute, and makes the semantic trio
an **explicit declared exception** rather than a hidden one.

## Decidable owner questions

- **OQ-1 — `compensates` Saga-exclusive?** → RESOLVED by verification: **NO** (Workflow also
  compensates; `compensates` is absent from relationships.yml). Default is therefore **merge Saga**,
  unless the owner *decides* to make compensation Saga-exclusive.
- **OQ-2** — can feature-ownership be a *computed* graph property? If yes, Wittgenstein's
  conditional Saga-keep is admissible; if no, merge.
- **OQ-3** — is `Event→projects→` a target View Model cannot occupy? Decides whether Projection
  is a node.
- **OQ-4** — is Schedule a node (shared domain state: RRULE/BillingCalendar) or an attribute
  (literal cron)? The edge `Schedule→triggers→Operation` enters either way.
- **OQ-6** — does the method claim domain-universality or is it scoped to software/DDD? If
  universal, the time gap (#5) blocks; if scoped, drop "any domain."
- **OQ-7** — may the public validator parse the Formal cell to check return-sort, or is the D15
  moat absolute? If absolute, the Rule/Policy/Calculation trio is a **permanent declared exception**.

## Dispatch record

- Ledger: `2026-07-07-metatype-method-carving-soundness` (`telemetry/agents/subagents-dispatch.yaml`), `exit_reason: resolved`.
- Fan-out: 3 attackers (robot_talks) → synthesizer (Mac Lane) ↔ 2 verifiers (zig-zag) + 4 helpers (2 proposal-review, 2 check-tension gate). Anti-bias triangle: completeness (inflate) / parsimony (collapse) / foundation (anti-collapse); check-tension PASS on both gate agents.
- Attackers: Lawvere (completeness), Quine (parsimony), Wittgenstein (foundation). Verifiers: Simon (empirical), Popper (definitional/dominant filter).
