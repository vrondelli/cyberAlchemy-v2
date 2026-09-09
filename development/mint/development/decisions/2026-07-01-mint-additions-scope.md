---
node_type: decision
is_session: false
status: resolved
boundary: INTERNAL — intended-not-shipped
scope: development build-scope gate for the Mint skill (NOT a CAV2 authority-kind ratification)
created: 2026-07-01
decided_by: user (rondelli.vladimir@gmail.com) via /decision-gate
source_evidence: ../research/2026-07-01-mint-cav2-inheritance-audit/findings.md
note: Paths repo-root-relative from domainspec-core/.
---

# Decision — Mint authority-inheritance additions scope

## Decision question
Which of the audit's identified additions should the follow-on Mint task-session commit
to building, and how should the correctly-withheld set be handled?

## Source context
Research dispatch `2026-07-01-mint-cav2-inheritance-audit` (ledger:
`telemetry/agents/subagents-dispatch.yaml`); synthesis:
[findings.md](../research/2026-07-01-mint-cav2-inheritance-audit/findings.md). 4 agents /
2 tensioned groups, check-tension PASS, closed `resolved`. Every candidate survived both
skeptic gates (Gödel meta-vs-object; Meadows already-provided) before being counted.

## Considered options
1. **Tier 1 only** — #8, #11, #13. Smallest diff, fixes the two live defects + the witnessed
   methods gap. Defers the rest.
2. **Tier 1 + Tier 2** — all 13 buildable additions; completes the authoring-lifecycle
   inheritance.
3. **Tier 1+2 + close Tier 3** — all 13 additions AND formalize the 6 withheld items as
   disclosed non-seeds in Mint's design, so every omission reads as a decision, not an
   oversight. *(selected)*

## Selected option
**Option 3 — Tier 1+2 + close Tier 3.**

## Rationale
The owner chose maximal closure: build the full authoring-lifecycle inheritance and
explicitly record the withheld set, leaving no silent omissions in the Mint contract.

## The committed work

### BUILD — Tier 1 (fix live problems, meta-only)
- **#8** Emit `DEFINITIONS-INDEX` + `DEFINITION-DRIFT-AUDIT` (+ `DEFINITION-SCHEMAS`) stubs —
  the seeded load-bearing-term rule already requires the drift audit (`findings.md`; today
  it "fires into a void").
- **#11** Add a **ratify-CLOSE** step to the mint flow (D49 owner-gate close, not just
  propose) — kinds otherwise stay `PROPOSED` forever (witnessed:
  `projects/domainspec-v2/authority/decisions/2026-06-29-ratify-governance-kinds.md` was
  hand-authored post-mint).
- **#13** Emit a **governance-function → methods** catalogue prompt (= handoff L2).

### BUILD — Tier 2 (complete the authoring lifecycle)
- Full-meta (seed the rule/route/pattern): **#1** Narrowest-Owner routing table · **#2**
  invariant→axiom→constitution→validator derivation · **#5** table-level default-deny CLOSED
  declaration on the domain's own kinds table · **#9** DEFINITION-LOCALIZATION-ROUTE +
  `definitions/reviews/` staging · **#12** stop/demotion rule (D48 `stop_rule`).
- Seed empty format / localize the rows: **#3** posture-contract columns + posture≠confidence
  (not the 8 rows) · **#4** non-collapse rule-slot + `forbidden_collapse` (not the 7 rules) ·
  **#6** minimal private-only boundary skeleton (localize engine clause) · **#7** promotion-flow
  import/inventory rung (not the full ledger) · **#17** constitution-authoring route +
  `CONSTITUTION-IMPORT-PACK` template (not cav2's rule instances).
- Cheap: **#10** `decisions/README` + D36 decision-card schema · **#18** `authority/README` stub.

### CLOSE — Tier 3 (disclosed non-seeds; record, do not build)
- **#14/#15/#16** ontology/artifact package — cav2's own self-model; seeding re-fuses the two
  System-5 levels (`ontology/PACKAGE-MODEL.md:9`). Non-seed by circularity discipline.
- **#19** disciplines catalog — no recurring practice day-1.
- **#20** attestation seal — owner exists (`cyberAlchemy-v2/development/attestation-capability/`,
  L2-blocked); build-from-owned, not a Mint emit.
- **#21** adopt-back — Mint stage-5, explicitly deferred.
- Guardrail to preserve while building Tier 2: **seed the empty contract/format, never cav2's
  populated rows** (#3/#4/#5/#17), else the additions re-introduce the level-refusion Tier 3 avoids.

## Remaining blockers
None. Gate result **PASS**.

## Deferred decisions / assumptions
- **Deferred:** implementation layering of the 13 additions (which are one task-session vs.
  split) — an implementation-plan decision, made when the task-session is scoped.
- **Assumption:** the additions extend Mint's emit-template set + flow; they do NOT alter
  cav2's own authority machinery (consistent with inherit-meta / localize-object).
