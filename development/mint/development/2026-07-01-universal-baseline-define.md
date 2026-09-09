---
node_type: define
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-07-01
authored_by: invoke (mode=define)
target_artifact: Mint (cyberAlchemy-v2/development/mint/) — a NEW addition category
target_owner_cycle: sigil-development lifecycle
supersedes_partially: the 2026-07-01 inheritance audit's implicit "all cav2 definitions → localize" verdict
note: Paths repo-root-relative from domainspec-core/.
---

# Mint addition — Universal Governance Baseline (define)

## The finding (why the audit was incomplete)
The 2026-07-01 inheritance audit used a **binary**: inherit-machinery (the *how* — rules/formats/
lifecycles) vs localize-object-content (the *what* — the domain's own kinds/definitions/rules). Under
that binary it swept **all 50 `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` entries into
"localize"** — the domain authors its own cards. **That is wrong for a subset.** A third bucket exists:

- **Universal method / invariant / primitive definitions** — definitions that describe *how any
  governed repo must act*, not cav2's specific content. Worked example: **CAV2-D21 Four-Facet Action
  Method** — "every governed action must bind/create/record-residue-for classification, schema,
  human-view, and machine-view before it can govern downstream work" (`DEFINITIONS.md:1105-1145`). That
  is a baseline action-admissibility rule for *any* repo, exactly as the owner observed — a **basic
  constitution of every repo**.

A mint currently seeds **none** of these; the constitution template inherits only ~5 meta-rules
(claim≤evidence, anti-laundering, status-non-collapse, finding-to-development, load-bearing-term). D21
and its class fall through the gap.

## The sharpened test (three-way, replacing the binary)
For each cav2 definition, ask:
1. **Universal method/invariant/primitive** → describes how *any* governed repo acts/structures/proves
   (D21, D32–D40, D16/D18/D22/D24/D28/D29/D30, …). **INHERIT as baseline** (seed a reference or a
   baseline constitution rule). Passes the circularity guardrail: it is a *method* (how), not cav2's
   object rows — seeding it does not re-fuse the two System-5 levels.
2. **cav2-object-specific** → about cav2 itself / cav2's own repo (D9 CyberAlchemy-v2, D1 Stable-
   Repository, D6 Stewardship, D41 cav2 Authority-Model, D42 Governed-Artifact-Tree, D45–D47 UX
   experience, D19 cav2 Ontology, D50 cav2 Discipline). **LOCALIZE / do not seed** (the domain authors
   its own; seeding cav2's instance re-fuses levels).
3. **Already inherited** (post-additions) → D38 claim-proof, D48 promotion-lifecycle, D49 closure-rule,
   D22 non-collapse (partial), narrowest-owner/derivation (additions #1/#2).

**Guardrail reconciliation:** this does NOT contradict Gödel's audit demotions. He demoted cav2's
*rule instances* (STABLE-REPO C-rules, the 8 posture rows) — cav2's populated object rows. A universal
*method definition* (D21) is the opposite: a rule *form* that applies to the domain's own actions. Seed
the method, never cav2's instances.

## Contract — what the "Universal Governance Baseline" addition seeds
A minted repo gets a baseline pack that makes the universal methods live in ITS OWN authority:
- a `authority/constitutions/<DOMAIN>-BASELINE-CONSTITUTION.md` (or a section) that **binds the
  universal-method set as baseline rules the domain's actions must satisfy** — starting with the
  Four-Facet Action rule (D21), typed-residue (D18), provenance-first (D24), claim-proof (D38, already
  present), append-only for its ledgers (D26), value-cycle guard (D28);
- each baseline rule is **referenced to its cav2 primitive by ID for provenance** but **owned locally**
  (the domain's actions are what it governs — cav2 is cited precedent, per the existing Obs-B no-leak rule);
- the domain may extend/override a baseline rule through its normal constitution route, but cannot
  silently drop one (a dropped baseline is typed residue naming why).

## Partition — FROZEN 2026-07-01 (the first-pass below is SUPERSEDED, kept for provenance)
> **Authoritative partition:** [research/2026-07-01-universal-baseline-partition/findings.md](./research/2026-07-01-universal-baseline-partition/findings.md)
> — a 4-agent tensioned + gated dispatch froze it: **27 inherit-as-baseline** (24 clean + 3 seed-form-strip-bindings:
> D11/D31/D40) + **2 SPLIT-format** (D15 firm, D42 deferred) + **12 localize** + **9 already-inherited**
> (incl. D41-as-format). The design + plan below consume the FROZEN set, not this first-pass.

## Candidate partition of the 50 (FIRST-PASS — SUPERSEDED by the frozen partition above)
- **Inherit-as-baseline (the gap, ~15):** D16, D17, D18, D20, D21, D22, D24, D25, D26, D28, D29, D30,
  D32, D33, D34, D35, D36, D37, D40 — *candidate*; each needs the per-item test confirmed.
- **Localize / cav2-object (~12):** D1, D6, D9, D19, D41, D42, D45, D46, D47, D50, D12, D15 — *candidate*.
- **Already inherited (~5):** D38, D48, D49, D22(partial), D2/D4/D5 (source-spine/promotion machinery
  the core templates already carry).
- **Contested (need a read each):** D26 Append-Only-Event-Ledger (universal discipline vs cav2 infra?),
  D19 Ontology (method vs cav2-object?), D40 Challenge-Contract (audit localized it in the ontology
  package #14 — reconcile: the *contract protocol* may be universal even if the ontology *package* is not).

## Residue (claim ≤ proof — do NOT skip this time)
- The partition above is **title-level + one grounded example (D21)**. The audit's original error was
  under-analyzing; the fix must NOT repeat it. **Validation gap:** a per-definition pass that reads each
  of the 50 and applies the three-way test + the circularity guardrail, resolving the Contested set.
- Recommended validation route: a **research/review dispatch** (the audit pattern, done properly) —
  partition all 50, skeptic-check each "inherit-as-baseline" call against the circularity guardrail and
  each "localize" call against "is this actually universal?". Owner: domainspec-subagents-strategy →
  research/review. Only after that partition is frozen does the baseline template get built.

## Dispatch technique trace
- `artifact_contract_bridge` → the addition binds the universal-method definitions to a baseline
  constitution the domain's actions must satisfy.
- `owner_boundary_check` → invoke authors this define; sigil-development builds the baseline template +
  EMIT-PROCEDURE step; the partition validation is a research/review dispatch.
- `residue_ledger` → the per-item partition + the Contested set are the named open gaps.
- `concrete_path_evidence` → D21 grounded at `DEFINITIONS.md:1105`.
- Skipped `distill` full pass → the unit is one addition category, locally bounded; the partition is the
  distill-flagged gap already recorded.

## Route
`decision-gate` (confirm the addition + whether to run the partition-validation dispatch) →
research/review (freeze the 50-partition) → `sigil-development --update` (build the baseline template +
EMIT-PROCEDURE step, like the other additions) → `experiment-harness` (smoke it, as with mint-smoke-01).
