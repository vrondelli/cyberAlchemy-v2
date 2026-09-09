---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — Mint dev research (precedent / already-provided audit)
created: 2026-07-01
role: SKEPTIC (precedent / already-provided gate)
agent: "Meadows, Donella H."
question: >
  For each of 21 candidate cav2 surfaces the owner suspects a minted domain LACKS,
  is it ALREADY-PROVIDED by an owned path (illusory gap) or GENUINELY-ABSENT (real gap)?
gate: PRECEDENT / ALREADY-PROVIDED — never a KILL; "already-provided" is a POSITIVE relabel.
note: Paths repo-root-relative from domainspec-core/. claim ≤ proof.
---

# Mint ← cav2 inheritance — precedent / already-provided audit

## What Mint actually emits (the load-bearing fact this whole audit turns on)

Mint's own emit-logic is fully specified and bounded. Per
`cyberAlchemy-v2/development/mint/templates/EMIT-PROCEDURE.md` and the buildable plan in
`EXECUTION-PACK.md`, the mint flow produces **exactly six template instantiations + one
decision record**:

1. `authority/AUTHORITY-MODEL.md` (from `templates/authority-model.md`)
2. `authority/source-spine.md` (from `templates/source-spine.md`)
3. `authority/promotion-policy.md` (from `templates/promotion-policy.md`)
4. `authority/constitutions/<DOMAIN>-CONSTITUTION.md` (from `templates/constitution.md`)
5. `definitions/DEFINITIONS.md` — a 1–2 card **skeleton** (from `templates/definitions.md`)
6. `RELATED-FRAMEWORK-CROSSWALK.md` (from `templates/crosswalk.md`)
7. `authority/decisions/<date>-mint.md` — L0-attributional placeholder record (EMIT §6)

The actual minted product confirms this exactly — walking
`cyberAlchemy-v2/development/mint/experiment-foundry-boundary/run/product/` yields **7 files**
and no more: AUTHORITY-MODEL, source-spine, promotion-policy, ONE constitution, DEFINITIONS,
RELATED-FRAMEWORK-CROSSWALK, decisions/2026-06-29-mint.md.

The **composed scaffolder** (`implementation/domainspec/.claude/skills/domainspec-new-repo/
SKILL.md`) is orthogonal to the authority spine: it emits the `knowledge/{domain_knowledge,
system_design_knowledge, vault}/ + implementation/ + research/ + sessions/ + schema/code-ontology/`
partition tree with README stubs, and — its own `L0-compose-contract.md` states verbatim — **"L0
does NOT produce the authority spine … no `authority/`, `definitions/`, `constitutions/`."** So the
scaffolder cannot provide any cav2 authority/ontology/disciplines surface; it provides navigation
**for the knowledge tree only**.

Therefore: a candidate is ALREADY-PROVIDED only if (a) a mint template/EMIT step emits it, (b) the
scaffolder emits it as part of the knowledge tree, or (c) an adjacent owned capability (attestation)
provides it. A surface that exists only in `cyberAlchemy-v2/authority|ontology|disciplines/` — cav2's
own spine — is NOT thereby provided to a minted domain; it must be re-emitted, and if no emitter
exists the gap is GENUINELY-ABSENT.

## Per-candidate verdict

| # | Candidate | Verdict | Provider path / absence note |
|---|---|---|---|
| 1 | Narrowest-Owner routing table (movement→owner) | **GENUINELY-ABSENT** | Exists only in cav2 `authority/AUTHORITY-MODEL.md` (§Narrowest Owner Rule) + `ontology/AUTHORITY-KINDS`. No mint template emits a movement→owner table; `templates/authority-model.md` emits only a Kinds table (Kind/Counts-as/Owner-route/Blocked-use) — per-kind owner routes, NOT the movement-routing table. |
| 2 | invariant→axiom→constitution→validator derivation pattern | **GENUINELY-ABSENT** | Exists only in cav2 `authority/AUTHORITY-MODEL.md` §Invariant, Axiom, Constitution. No template carries the derivation-pattern block; `templates/constitution.md` has no invariant→axiom→validator ladder. |
| 3 | Full 8-posture table (+ posture ≠ confidence) | **GENUINELY-ABSENT** | Exists only in cav2 `authority/AUTHORITY-MODEL.md` §Authority Postures + `ontology/AUTHORITY-POSTURES.md`. "posture" appears in mint templates ONLY as the phrase "source posture" inside prose (constitution.md:41, source-spine.md:13); no template emits the 8-row Posture/Allowed/Blocked table. |
| 4 | 7 canonical Non-Collapse Rules in full | **GENUINELY-ABSENT** (partial precedent) | Templates emit a non-collapse **rule STRUCTURE** ("X is not Y") with domain-localized rows + one verbatim Obs-B rule (`templates/authority-model.md` §Non-Collapse). But cav2's 7 canonical rules (evidence≠authority, ontology can't decide, inventory can't promote, discipline can't define, constitution≠source-proof, run≠redefine, public≠private-by-proximity) are NOT emitted — the template localizes AWAY from them. The generic non-collapse discipline is provided; the 7 canonical rules are absent. |
| 5 | Default-deny CLOSED-table declaration on the domain's own kinds table | **ALREADY-PROVIDED** | `templates/authority-model.md` + EMIT §7 check-2 require **every** proposed kind to carry a non-empty default-deny Blocked-use cell; the minted product's AUTHORITY-MODEL shows per-row "Default-deny: …" cells. NOTE (claim ≤ proof): the per-ROW default-deny is provided; cav2's explicit *closed-enumeration catch-all row* ("any unenumerated kind → default-deny", AUTHORITY-MODEL.md:62) is NOT templated — the table-level *closure declaration* is absent, only the per-row deny is present. |
| 6 | boundaries.md (public/private, source/read-model, generated/canonical, research/spec; + engine-withholding) | **GENUINELY-ABSENT** | Exists only in cav2 `authority/boundaries.md`. No mint template = `boundaries.md`; the 6-template set has no boundaries emitter. Public/private is enforced on Mint as a *blocker* (`BLK-CAV2-PUBLIC-PRIVATE-001`, SPEC §Boundaries) but the minted repo gets no boundaries.md artifact. |
| 7 | Import/inventory rung + authority/imports/ ledger (CAV2-C11) | **GENUINELY-ABSENT** | Exists only in cav2 `authority/imports/` + STABLE-REPOSITORY-CONSTITUTION §CAV2-C11. No template emits an imports rung; the first real mint (`projects/domainspec-v2/`) has **no** `authority/imports/` dir. (v2 has a root `IMPORT-MANIFEST.md`, hand-authored, not mint-emitted.) |
| 8 | Definitions lifecycle equipment: INDEX + DRIFT-AUDIT + SCHEMAS registry | **GENUINELY-ABSENT** | Exists only in cav2 `authority/definitions/DEFINITION-{INDEX,DRIFT-AUDIT,SCHEMAS}`. `templates/definitions.md:102` states explicitly the index+drift-audit "are seeded alongside (**not in this template**)" — named as a future need, NOT emitted. domainspec-v2 has no `authority/definitions/` equipment dir. |
| 9 | DEFINITION-LOCALIZATION-ROUTE + definitions/reviews staging | **GENUINELY-ABSENT** | Exists only in cav2 `authority/definitions/DEFINITION-LOCALIZATION-ROUTE.md` + `definitions/reviews/`. No template; no emit step. |
| 10 | decisions/README + CAV2-D36 decision-card schema | **GENUINELY-ABSENT** | Mint emits ONE decision record (`authority/decisions/<date>-mint.md`) but NO `decisions/README.md` index and NO D36 decision-card schema. cav2's `authority/decisions/README.md` (the index/schema) has no template. |
| 11 | Ratification-CLOSE as part of the mint flow (D49 owner-gate CLOSE) | **GENUINELY-ABSENT** | DECISIVE: `projects/domainspec-v2/authority/decisions/2026-06-29-ratify-governance-kinds.md` is a **separate** owner act the mint did NOT emit — Mint emits only the PROPOSE record (EMIT §6 "propose-not-ratify"; the mint-act output is scored at the *proposal* commit). The ratify-CLOSE was hand-authored after the mint. A2's claim holds. |
| 12 | Stop/demotion rule (D48 stop_rule — demote/supersede path) | **GENUINELY-ABSENT** | No template emits a stop_rule/demote/supersede path. `templates/promotion-policy.md` emits a forward Promotion Ladder + Blocks only; "demoted" appears once in the source-movement prose ("blocked, demoted, split") but no D48 stop/demotion RULE is cast. |
| 13 | Governance-function→methods catalogue | **GENUINELY-ABSENT** | The "Methods catalogue" in `projects/domainspec-v2/authority/AUTHORITY-MODEL.md:66` is hand-LOCALIZED (its own comment says so, cited to IMPORT-MANIFEST). No mint template has a methods-catalogue section — `templates/authority-model.md` has no such block. Not emitted by Mint. |
| 14 | Ontology candidate-staging: PACKAGE-MODEL Candidate-Record + NODE-MODEL challenge_contract (D40) + two-axis confidence | **GENUINELY-ABSENT** | Exists only in cav2 `ontology/PACKAGE-MODEL.md` (evidence_confidence/commitment_confidence, challenge_contract) + `NODE-MODEL.md` (D40). Mint emits NO `ontology/` at all; the scaffolder emits `schema/code-ontology/` (a code-tagging ontology), NOT the authority candidate-staging ontology. |
| 15 | Ontology structural models: RELATION + LIFECYCLE + BRANCH-AS-VIEW + views triad + projections + promotion-requests | **GENUINELY-ABSENT** | Exists only in cav2 `ontology/*`. Mint emits no ontology; scaffolder's `code-ontology/` is unrelated (TAXONOMY/RELATIONSHIPS for code tags, not the governance ontology). |
| 16 | ARTIFACT-TREE orientation map + crosswalks (TAXONOMY, RELATIONSHIP, SOURCE-SURFACE) | **GENUINELY-ABSENT** | cav2 `ontology/ARTIFACT-TREE.md` + `*-CROSSWALK.md` are the authority-artifact orientation map. NOT the same as Mint's `RELATED-FRAMEWORK-CROSSWALK.md` (a framework borrow/block table, candidate 21-adjacent). No template emits an artifact-tree. |
| 17 | STABLE-REPOSITORY-CONSTITUTION rules as minted-repo rules (C4–C15 + Validation-Adapters) + CONSTITUTION-IMPORT-PACK | **GENUINELY-ABSENT** (partial precedent) | Mint's `templates/constitution.md` emits a **credibility** constitution (claim≤evidence, non-collapse, anti-laundering, load-bearing-term tracking) — real inherited meta-rules, so the *credibility* half is provided. But cav2's structural STABLE-REPOSITORY rules (C6 projection-traceability, C7 navigable-work-surface, C10 standalone-extraction, C11 import, C12 entropy-register, C13 value-cycle-edge-guard, C14 governed-artifact-tree, C15 interface-evidence, Validation-Adapters) + CONSTITUTION-IMPORT-PACK are NOT emitted. The structural constitution is absent. |
| 18 | Navigation surfaces: authority/README + area READMEs (CAV2-C7) | **GENUINELY-ABSENT** for authority/ ; **ALREADY-PROVIDED** for knowledge-tree | Split: the scaffolder (`domainspec-new-repo` §target-tree) DOES emit README stubs for every knowledge-tree partition (`knowledge/`, `domain_knowledge/`, `vault/`, `implementation/`, `research/`, `sessions/`, `schema/`) — so knowledge-tree navigation is PROVIDED. But there is NO `authority/README.md` surface-index (cav2's, listing imports/definitions/constitutions/boundaries/decisions) — Mint emits authority/ files with no README, no area index. The C7 *authority* navigation surface is absent. |
| 19 | DISCIPLINES.md catalog + Growth Rule + cards | **GENUINELY-ABSENT** | Exists only in cav2 `disciplines/DISCIPLINES.md` + `cards/`. No mint template; no emit step. domainspec-v2 has no `disciplines/` dir. "discipline" in templates is only the phrase "promotion discipline" in prose. |
| 20 | Verifiable/tamper-evident attestation seal (N1) | **GENUINELY-ABSENT** (owned repair path exists) | The attestation capability EXISTS as an owned, in-development sigil (`cyberAlchemy-v2/development/attestation-capability/`, README status "in-development · intended-not-shipped") — so the PROVIDER is build-from-owned, not net-new. But it is NOT yet shipped: Mint's L2 seal is a `PLACEHOLDER (L0-attributional)`, explicitly BLOCKED on this capability's unbuilt L1 MVP (EMIT §6; ratify file "Attestation seal: PENDING"). The seal itself is genuinely absent today; the owner is known. |
| 21 | Adopt-back surface for domain-surfaced kinds cav2 lacks (N2) | **GENUINELY-ABSENT** (by design, deferred) | 5-stage flow row 5 "adopt-back (deferred)" — explicitly NOT MVP (ARCHITECTURE-BUNDLE; EXECUTION-PACK L3). The crosswalk template emits `promotion-candidate` rows (a proposal seam) but no adopt-back/import-registration surface is emitted. Named-and-deferred, not provided. |

## Honest self-read on the "already-provided" hunt

I hunted hard for illusory gaps. The scaffolder is the biggest candidate provider, and it DID
absorb one (candidate 18's knowledge-tree navigation) and partially another. The credibility
constitution (17) and per-row default-deny (5) are genuinely inherited meta-machinery. But the
suspected pattern holds: Mint's 6-template + 1-record emit is a **thin authority spine** (the Obs-A/B
core — kinds, source posture, promotion ladder, non-collapse, crosswalk), NOT cav2's **full**
governance surface. The rich equipment (postures table, narrowest-owner routing, definitions
lifecycle tooling, imports rung, ontology candidate-staging + structural models, ARTIFACT-TREE,
disciplines catalog, decisions index/schema, structural repository constitution, ratify-CLOSE,
stop/demotion, methods catalogue, adopt-back) is cav2-only and **has no emitter**. That these exist
in `cyberAlchemy-v2/` does NOT make them provided to a minted domain — they must be re-cast, and no
template or emit step casts them. The first real mint (`projects/domainspec-v2/`) proves it: the
surfaces it needed beyond the 6 templates (ratify file, methods catalogue, governance chain) were
**hand-authored after** the mint, and it still lacks imports/, definitions-equipment/, disciplines/.
