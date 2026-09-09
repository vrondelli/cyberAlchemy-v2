---
to: Vlad
from: Victor
re: deterministic-validation-for-all-cav2-synthesis — every inconsistency found in adversarial review, for revision
date: 2026-07-01
status: draft for revision
note: findings from a 3-agent adversarial review (angles: cross-document contradiction / referential integrity / engineering feasibility) dispatched 2026-07-01. Line numbers marked "~" are approximate. Reviewed target: .arcanum/inventory/entries/deterministic-validation-for-all-cav2-synthesis.md and its cited corpus.
---

# To Vlad — inconsistencies in the deterministic-validation plan

The synthesis holds up as a direction. It does not hold up as written: its own sources
contradict several of its claims, two of its cited mechanisms do not exist anywhere in the
corpus, and its residue section admits less than half of its real gaps. Everything found is
listed below so you can revise once. Ordered by what it costs if left standing.

For calibration: these references were checked and **hold** — `CAV2-D22`, `D26`, `D30`,
`D38`, `D40`, `D48`, `D49`, `C17` (exists as STABLE-REPOSITORY-CONSTITUTION.md:371, candidate
pending number-confirm), `G2`, `OQ-1`, `OQ-2`, `forbidden_collapse`, and the 7 AUTHORITY-MODEL
non-collapse rules (exactly 7, at AUTHORITY-MODEL.md:122–133). You do not need to re-audit those.

## A. The one finding all three reviewers converged on

**A1. The queries' vocabulary is not in the schema the plan waits on.**
Every specced query quantifies over axes (`∃ axis. cand.axis ≠ D43.axis`, synthesis ~L36;
same shape in both validator HANDOFFs), and build-from-owned needs `specializes`. But the
Instance-Node Contract in `ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md`
§3 defines `node_id, instantiates, status, owner_route, governed_ref, lifecycle_log, provenance,
confidence, residue, challenge_contract` — **no axes field, no `specializes`**. Clearing OQ-1 by
executing that proposal as-is would stabilize a schema on which non-collapse is vacuous and
build-from-owned has no parent chain to walk. Nobody has defined what an "axis" is as a field.
*Revision needed:* amend the schema proposal to type axes and `specializes` (or state where they
live instead), before OQ-1 is declared clearable.

## B. Contradictions between documents

**B1. The moat claim re-inflates what its own parent demoted.**
Synthesis frontmatter ~L9: "determinism = attestation moat"; body ~L62: "the moat (attestation +
governance-data)". Its listed source `cav2-authority-and-determinism-synthesis.md` ~L96–98:
determinism is "an *optimization, not a necessity* — the real requirement is provenance + a
citable referent (auditors attest non-deterministic processes routinely)", and the moat is
"attestation + governance-data + **vertical**" — the third component is silently dropped.
*Revision needed:* either re-demote the claim in the synthesis or record a decision that
reverses the parent's demotion.

**B2. "Three specced siblings" overstates the validators' status.**
Synthesis ~L41 counts build-from-owned (`C17`) as specced. The
`2026-06-26-build-from-owned-validator-HANDOFF.md` ~L10–12 states its objective as future work:
"Develop a way to validate 'build-from-owned' before authoring", and its roadmap marks the
design as "(this handoff)". "Specced" throughout means proposal-grade: G2 schema non-executed
(proposal §8), OQ-1 OPEN, C17 candidate. The synthesis's "zero validators exist today" flag
covers implementation but not this quieter design-status inflation.
*Revision needed:* per-sibling status line (designed / drafted / handed-off), not one word.

**B3. The kind enumeration disagrees with itself — and the closure check needs it closed.**
AUTHORITY-MODEL ~L50–61 (and the parent synthesis): **9** authority kinds including
`runtime_contract`. `ontology/NODE-MODEL.md` ~L63–76: **12** concepts, with **no**
`concept.runtime_contract`. The schema proposal's §4 asserts the `concept_role` **enum** is
"complete, no change" and "covers the 9 kinds", yet §5 (gap G1) adds the missing
`concept.runtime_contract` to the retained 12-concept set — so the "covers the 9 kinds" claim and
the concept table it points at do not line up. (The §4 claim is about the *role* enum, not the
concept set — but the mismatch is real either way.) "Every `instantiates` must hit an enumerated
kind" is undecidable while the two enumerations disagree: a promoted runtime contract would be
default-denied by the concept table.
*Revision needed:* one canonical kind table, one owner, others reference it.

**B4. The plan may violate the layer separation it enforces.**
`AUTHORITY-KINDS.md` ~L39–40: "Use authority kinds to route a candidate to the correct owner.
Do not use them to decide the candidate." Non-Collapse rule 2: ontology describes, it cannot
decide. The synthesis wires kind-typed queries into **blocking pre-authoring gates** (~L27–28,
~L73) — ontology-layer typing producing authority-layer verdicts. Maybe defensible (the gate as
owner-route machinery that *consumes* ontology), but the reconciliation is nowhere stated.
*Revision needed:* an explicit owner-route framing for the gates, or the plan self-collapses
under its own rule 2.

**B5. Rule ownership disagrees.**
Synthesis ~L79–80: rules owned by "definitions/constitution-governance". Build-from-owned
HANDOFF owner table ~L115: gate rule owned by "definitions-governance + promotion-policy"
(constitution-governance absent). AUTHORITY-MODEL's own routing rule ("smallest authority
owner") makes an ambiguous route a blocker for the promotions the plan depends on.
*Revision needed:* name one owner per rule family.

**B6. The apex "context-invariant promotion" frame is asserted as machinery but flagged as
unresolved in the same session's HANDOFF.**
Parent synthesis ~L47–49 presents "domain authority promotes up to CAV2 when it proves
context-invariant" as the engine. The HANDOFF ~L96–98, ~L130–131 records the preference for
the "epistemic strength ladder" frame instead, suggests demoting context-invariance to a
derived property, and notes `CAV2-D48`'s body "has not been read yet this session".
*Revision needed:* mark the apex model as open, or reconcile it against D48 after actually
reading it.

## C. References that do not hold as cited

**C1. `CAV2-D29` is cited for something it does not say.**
Canonical D29 (DEFINITIONS.md:1792) = **Axis Orthogonality Invariant** — advancing one axis
must not silently advance another (axis-vs-axis). The synthesis uses "non-collapse (CAV2-D29)"
for *object-pair* distinctness — closer to D22 (Orthogonal Classification, DEFINITIONS.md:1224).
The corpus itself flags this: DEFINITION-DRIFT-AUDIT.md:79 — non-collapse is an umbrella
(D22 + D29 + 7 rules + forbidden_collapse) with "no standalone term". The mislabel is inherited
from the 2026-06-26 HANDOFF.
*Revision needed:* either promote a standalone non-collapse definition or cite the umbrella
precisely per query family.

**C2. The migration ladder `review → mixed → validator` is unattested.**
The corpus's actual `Validation mode:` enum, everywhere it appears
(STABLE-REPOSITORY-CONSTITUTION.md, VAULT-CONCEPT-ADOPTION-CONSTITUTION.md), is
**{review, hybrid}**. Grep finds no "mixed" and no "validator" as validation-mode values
anywhere in `authority/`. Additionally the field lives as prose lines on rules — and rules are
prose sections, **not typed records**, so a per-rule tracking field has no substrate. The plan
silently requires a second schema (rules-as-records) it never mentions.
*Revision needed:* align the ladder with the real enum (or amend the enum), and decide whether
rules become typed objects.

**C3. "The catalog" as a consolidated artifact does not exist.**
Synthesis ~L50–51: "The catalog shows which rules are review vs validator → coverage is
visible." There is no such catalog: `disciplines/DISCIPLINES.md` catalogs disciplines, not
governance rules, and has no validation-mode column. The per-rule `Validation mode:` lines *do*
exist inline on each constitution rule (greppable across `authority/constitutions/`), so coverage
is **scattered, not impossible** — what is missing is the single consolidated view the plan leans on.
*Revision needed:* add "build the rule catalog" (compile the inline per-rule modes into one view)
as an explicit build-order step with an owner.

**C4. The Lean anchor is outside the corpus.**
`functorial_strictly_dominates_count` (the "FOL shadow" basis of the non-thinness boundary)
exists in **no** tracked `.lean` file in domainspec-core; it is cited second-hand in prose
(`2026-06-23-non-collapsing-discipline-validator-HANDOFF.md:81`, repo-primitives sweep
research.md:17) pointing at an external lean repo.
*Revision needed:* import/cite it under the corpus's own import rules, or restate the boundary
without leaning on an artifact this repo cannot verify.

## D. Gaps the plan does not state (its residue admits only OQ-1 + non-thinness)

**D1. "Every governance rule reduces to an SMT query" is false for use-constraint rules.**
Non-Collapse rules 1, 5, 7 ("evidence supports but is not authority", "a constitution does not
prove the source claim", "public-safe language must not inherit private evidence by proximity")
constrain how artifacts are *used in reasoning* — there is no record of reliance/proximity to
query. Honest claim: "rules over declared fields reduce to SMT."
*Revision needed:* shrink the claim, or scope a usage-event ledger as separate future work.

**D2. The Authority Rule's negative half is unencodable as stated.**
"Authority moves by owner route, **not** by proximity/usefulness/repetition" — proving a
movement did *not* happen by proximity quantifies over absent causes. Checkable weakening:
"no `active` status without a movement record." Someone must own that weakening explicitly.

**D3. Only the closure sibling has an engineering spec; the other two have none, and nothing is built.**
`cyberAlchemy-v2/validation/authority-kind-closure-validator-SPEC.md` (candidate, 2026-06-30)
*does* spec the closure check end-to-end: checks (C-1..C-3 deterministic + R-1 review), validation
mode, fixtures, and observability. But it covers **1 of the 3 siblings** — non-collapse and
build-from-owned have only their HANDOFFs (logical form + decidable fragment), with no input
format, no invocation contract, no counter-witness output format. Across all three: **no solver
choice** (no SMT/z3 code anywhere) and **no built validator** — `sigil-development/tools` is named
as owner but `cyberAlchemy-v2/tools/` does not exist. The validator home *does* exist
(`cyberAlchemy-v2/validation/`, holding the closure SPEC; `specs/` is a README stub) — the
unrelated poker app is at the **repo-root** `validation/poker-team/`, a different folder.
*Revision needed:* spec the other two siblings, choose a solver, define the invocation +
counter-witness contracts; the closure SPEC is the template.

**D4. "Pre-authoring gates" have no interception point.**
Authoring today is an LLM session editing markdown. No hook, CI, or authoring command exists
that a gate could block. "Lifecycle placement: before authoring" names a role, not a mechanism —
without one, the gate is enforced by habit/memory, the exact failure the HANDOFF documents.

**D5. Verdict vocabularies don't map.**
The adapter returns yes/no + counter-witness; the corpus's gate vocabulary is four-valued
(pass / flag / block / defer). Nothing says whether a found coincidence is flag or block, or
when corpus-coverage holes yield defer. Needs a mapping rule with an owner.

**D6. Build-from-owned is unsound without a corpus index — and no indexer is planned.**
The HANDOFF itself flags that an un-indexed owner produces a false "net-new" pass. Neither the
HANDOFF nor the synthesis's 5-step build order includes building the index/coverage log.
A pass verdict without coverage accounting is precisely the silent claim the plan forbids.

**D7. OQ-1 has no exit criterion.**
"Stable enough to avoid freezing the wrong shape" has no test; the schema proposal's exit is
"decision-gate declares stable". As written, a judgment call with no stated evidence bar gates
the entire plan. Decision-gate should define what clears OQ-1.

**D8. Zero artifacts are typed; retro-typing is unowned.**
No real artifact today declares `instantiates` (grep: only proposals/handoffs/research). Step 0
requires typing every authority object — roughly 50 `CAV2-D` entries plus constitutions.
Unowned: who types them, who reviews the axis assignments (the review-only "encoding choice"),
and what happens to grandfathered legacy frontmatter (`veracidade`/`convicção`, proposal §4).

## Suggested revision order

1. A1 (axes/`specializes` into the schema proposal) — everything else queries a vocabulary
   that must exist first.
2. B3 + C1 (one kind table; one precise non-collapse citation) — the closure and non-collapse
   checks are undecidable/mislabeled until then.
3. C2 + C3 (real validation-mode enum + build the rule catalog) — or the migration path has no
   substrate to run on.
4. B1, B2, B5, B6 (claim ≤ proof corrections) — text fixes, cheap, do them in one pass.
5. D1–D8 → move into the synthesis's Residue section so the plan's stated boundary matches its
   real one.
