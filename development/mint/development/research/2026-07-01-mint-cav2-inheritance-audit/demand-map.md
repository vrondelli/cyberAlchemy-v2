---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — Mint development research; intended-not-shipped
created: 2026-07-01
authored_by: research subagent ("Ashby, W. Ross"), demand-side requisite-variety deriver
angle: demand-side — derive what a MINTED domain NEEDS to author its own authority, not what cav2 HAS
grounding:
  - cyberAlchemy-v2/development/mint/experiment-foundry-boundary/run/product/ (minted product #1 — API-contract)
  - projects/domainspec-v2/authority|definitions (minted product #2 — first REAL mint)
  - cyberAlchemy-v2/development/mint/development/handoffs/2026-06-29-first-real-mint-domainspec-v2.md
  - cyberAlchemy-v2/development/mint/{ARCHITECTURE-BUNDLE,SPEC}.md, templates/EMIT-PROCEDURE.md
  - cyberAlchemy-v2/authority/AUTHORITY-MODEL.md, ontology/PACKAGE-MODEL.md (+ NODE/RELATION/LIFECYCLE)
note: Paths are repo-root-relative from domainspec-core/. claim ≤ proof; every load-bearing claim cites a path.
---

# Mint ↔ cav2 Inheritance Audit — the DEMAND-SIDE requisite-variety map

## Method (the lens, stated so the verdicts are falsifiable)

Ashby's **Law of Requisite Variety**: a regulator can hold a system in its goal region only if the
regulator has at least as much variety as the disturbances it must absorb — and no *system-theoretic*
gain from carrying more. A minted domain's `authority/` **is** that regulator: the disturbances it must
absorb are the domain's own authorship events (a new term goes load-bearing; a rule must constrain
future artifacts; a governance function has no owner yet; a claim outruns its proof). I do **not** ask
"what does cav2 have?" I ask, per surface: **does the domain's authority regulator need this variety to
govern its own authorship — and if so, at day-1 (mint) or later?**

Three classes:
- **LOAD-BEARING-AT-MINT** — the domain cannot self-author authority on day 1 without it (under-inheritance if absent).
- **NEEDED-LATER** — needed once the domain *grows*, not at mint; inheriting it at mint is ceremony (over-inheritance).
- **CAV2-INTERNAL-BOOKKEEPING** — a domain never needs it; it is cav2's own governance overhead. Inheriting it is pure ceremony.

Evidence base: **two minted products actually exist.** API-contract (`.../run/product/`, 7 files) and
domainspec-v2 (`projects/domainspec-v2/`, the first REAL mint, handoff §Identity). I read what a real
mint *actually shipped into a domain* and what it *left behind* — that is the demand signal, not the catalog.

---

## (1) Per-surface demand classification

Surfaces are cav2's authority machinery (`cyberAlchemy-v2/authority/AUTHORITY-MODEL.md`,
`ontology/PACKAGE-MODEL.md`, `ontology/{NODE,RELATION,LIFECYCLE}-MODEL.md`, `authority/promotion-policy.md`,
`boundaries.md`). Each verdict cites what the two minted products did with the surface.

| # | cav2 machinery surface (cite) | Class | Demand evidence (what a mint actually did) |
|---|---|---|---|
| S1 | **Authority-Kinds table FORMAT** (4-col closed table; `AUTHORITY-MODEL.md:50-62`) | **LOAD-BEARING-AT-MINT** | Both products emit their OWN kinds table verbatim in format (`.../product/authority/AUTHORITY-MODEL.md:57-67`; `projects/domainspec-v2/authority/AUTHORITY-MODEL.md:54-64`). This IS the regulator's variety inventory — no domain governs authorship without it. |
| S2 | **D49 closure / default-deny RULE** (the *rule*, not cav2's *rows*; `AUTHORITY-MODEL.md:63-69`, `DEFINITIONS.md:3247`) | **LOAD-BEARING-AT-MINT** | Every PROPOSED kind carries a default-deny Blocked-use cell (EMIT-PROCEDURE §7 check-2). The rule applied to the domain's OWN table is exactly the requisite-variety guard: unenumerated authorship is blocked. Inheriting the *rule* (meta) not the *rows* (object) is the load-bearing design move (SPEC §Inheritance boundary test). |
| S3 | **D48 authority-promotion-lifecycle** (staged path + stop rule; `DEFINITIONS.md:3184-3238`) as a *shape* | **LOAD-BEARING-AT-MINT** | Both products emit a promotion-ladder that instantiates D48 (`.../product/authority/promotion-policy.md:13-24`; the domain's source-movement pipeline). A domain that can name a kind but not how it earns authority cannot self-author — it would freeze at candidate forever. |
| S4 | **Non-collapse rule STRUCTURE** ("X is not Y"; `AUTHORITY-MODEL.md:122-134`) | **LOAD-BEARING-AT-MINT** | Both localize real conflation risks in this shape (`.../product/authority/AUTHORITY-MODEL.md:98-113`; `projects/domainspec-v2/...:149-162`). Distinguishing evidence-from-authority is the domain's core disturbance to absorb — day 1. |
| S5 | **Gate vocabulary** (`pass/flag/block/defer`; `AUTHORITY-MODEL.md:135-142`) | **LOAD-BEARING-AT-MINT** | Copied verbatim by both (EMIT-PROCEDURE §54 "inherited verbatim"). Minimal control alphabet; a regulator with no `block` cannot stop bad authorship. |
| S6 | **Narrowest-owner rule / owner-route routing** (`AUTHORITY-MODEL.md:90-104`) | **LOAD-BEARING-AT-MINT** | Both products assign a NEW owner route per domain-originated kind (`lifecycle-scheduling`, `validation-governance`, etc.). Ashby-critical: the domain's variety comes precisely from having distinct regulators for distinct disturbances. |
| S7 | **claim ≤ proof (D38)** | **LOAD-BEARING-AT-MINT** | Inherited as constitution rule in both (`API-CONTRACT-CONSTITUTION.md:32 APIC-C2`; domainspec-v2-CONSTITUTION). Bounds the domain's self-claims to its evidence — a day-1 disturbance (over-claiming). |
| S8 | **build-from-owned (C17) + precedent sweep** | **LOAD-BEARING-AT-MINT** | The triage front-door sweeps `cyberAlchemy-v2/authority/` before a KIND is called domain-originated (EMIT-PROCEDURE Step1.2). Without it the domain re-skins cav2 kinds (the precedent's exact leak). |
| S9 | **Source-posture table** (`AUTHORITY-MODEL.md:74-88` Postures) as the source-family format | **LOAD-BEARING-AT-MINT** | Both emit a source-spine with allowed/blocked-use per family (`.../product/authority/source-spine.md:13-18`). The domain must classify what may be *relied on* before promotion — day 1. |
| S10 | **decision-gate as a governance ACT** (signed record; `AUTHORITY-MODEL.md:55`) | **LOAD-BEARING-AT-MINT (as attributional record)** | Both emit `authority/decisions/<date>-mint.md` (`.../product/authority/decisions/2026-06-29-mint.md`). Minting IS a governance act (SPEC §Boundaries). BUT the *cryptographic* seal is NOT load-bearing at mint — L0-attributional placeholder is honest and sufficient (decision `2026-06-29-mint-signer-and-boundary.md`). |
| S11 | **definitions-governance three-voice card FORMAT** (`AUTHORITY-MODEL.md:52`) | **LOAD-BEARING-AT-MINT (seed only) / NEEDED-LATER (the rest)** | Both seed 1–2 cards (`.../product/definitions/DEFINITIONS.md` APIC-D1/D2). Seeding the domain-originated term is day-1 (it names the new kind); authoring the full tower is growth work (EMIT-PROCEDURE Step5.1 "owner authors the rest"). |
| S12 | **constitution-governance rule FORMAT + meta-rules** (`constitutions/`; anti-laundering, load-bearing-term tracking) | **LOAD-BEARING-AT-MINT** | The constitution IS the localized home of method authority (EMIT-PROCEDURE Step4.1). Both emit it (`API-CONTRACT-CONSTITUTION.md`; `domainspec-v2-CONSTITUTION.md`). Anti-laundering (Obs-B control) is a day-1 guard against cyclic-citation authority. |
| S13 | **RELATED-FRAMEWORK-CROSSWALK** (borrow/block/analogy/promotion-candidate) | **NEEDED-LATER (adopt-back rows) / LOAD-BEARING-AT-MINT (the boundary row)** | Both emit it, but the ONE load-bearing row is the cav2 `borrow-carefully` boundary that keeps cav2 off the resolution path (Obs-B). The `promotion-candidate` rows are proposals for a *separate downstream* act (EMIT-PROCEDURE Step6 sequencing) — growth, not mint. |
| S14 | **discipline-governance / `disciplines/`** (`AUTHORITY-MODEL.md:54`) | **CAV2-INTERNAL-BOOKKEEPING → NEEDED-LATER** | NEITHER minted product emits a discipline or a `disciplines/` dir (verified: product has 7 files, none a discipline). A domain needs a discipline only once a *recurring cross-artifact practice* emerges — pure growth. Inheriting it at mint is ceremony. |
| S15 | **ontology PACKAGE-MODEL: candidate-record shape, RELATION-MODEL predicates, NODE-MODEL concepts** (`PACKAGE-MODEL.md:90-121`, `RELATION-MODEL.md`, `NODE-MODEL.md`) | **CAV2-INTERNAL-BOOKKEEPING** | Zero trace in either product. These model *cav2's own* authority-as-ontology for its ontology route; a domain governs its authorship with the kinds table + ladder, not with `classifies_authority_kind` predicates. Explicitly candidate/flag even in cav2 (`PACKAGE-MODEL.md:149`). A domain never needs them. |
| S16 | **LIFECYCLE-MODEL workflow-state machine** (`source-evidence→…→deprecated`; `LIFECYCLE-MODEL.md:23-35`) | **CAV2-INTERNAL-BOOKKEEPING → NEEDED-LATER** | The domain's promotion-*ladder* (S3) is the demand-facing lifecycle; the 9-state candidate FSM is cav2's ontology-route read-model, not something a fresh domain must run. Needed only if the domain later builds a live authority-ledger validator (deferred even in cav2, `LIFECYCLE-MODEL.md:58-62`). |
| S17 | **`imports/` ledger + import-before-promotion** (`boundaries.md:23-32`) | **NEEDED-LATER** | Empty in cav2 today; neither product emits an `imports/`. A mint's ONE import (the harvested framework) is handled by the source-spine row (S9), not an import ledger. A domain needs import ledgers only when it later consolidates *scattered* external corpora — growth. |
| S18 | **`promotion-requests/` + `projections/` + `views/` dirs** | **CAV2-INTERNAL-BOOKKEEPING** | All empty in cav2 (verified `ls`); zero in either product. Staging dirs for cav2's own ontology→authority pipeline. A domain does not need them to author authority. |
| S19 | **VAULT-CONCEPT-ADOPTION-CONSTITUTION / vault node_type / `## Connections` edges** (`PACKAGE-MODEL.md:47-54` out-of-scope) | **CAV2-INTERNAL-BOOKKEEPING** | Vault/schema machinery — out of scope in cav2's own package. No mint touches it. |
| S20 | **STABLE-REPOSITORY-CONSTITUTION** (15.4K; standalone-extraction, layer separation) | **NEEDED-LATER** | Not emitted by either mint. Its concern (readiness for standalone extraction, `promotion-policy.md` OQ-1) is a *maturity* gate — the domain is already standalone at birth; it needs extraction-readiness rules only when it seeks stable-asset status. |
| S21 | **public/private boundary scrub** (`boundaries.md:7-15`) | **NEEDED-LATER (blocked at mint by decision)** | Deliberately deferred: MVP mints are private-only (`2026-06-29-mint-signer-and-boundary.md` Decision 2; `BLK-CAV2-PUBLIC-PRIVATE-001`). A domain needs scrub variety only when it emits a public artifact — not at a private mint. |
| S22 | **attestation / L2 cryptographic seal** | **NEEDED-LATER (net-new dependency)** | Blocked for BOTH products (`.../product/authority/decisions/2026-06-29-mint.md` §Blockers; ratify decision §PENDING). Not required to *author* authority (L0-attributional suffices); required only for tamper-evidence. See NET-NEW. |
| S23 | **owner-ratification of proposed kinds (D49 owner-gate CLOSING act)** | **LOAD-BEARING-AT-MINT** | This is the demand-side discovery. domainspec-v2 CLOSED the loop with `decisions/2026-06-29-ratify-governance-kinds.md` (owner ratifies the 3 kinds). API-contract did NOT — its kinds sit "PROPOSED — pending owner ratification" forever (`.../product/authority/decisions/2026-06-29-mint.md`). A domain whose kinds stay proposed has a regulator with *asserted* but not *live* variety. See NEEDED-BUT-ABSENT. |

---

## (2) NEEDED-BUT-ABSENT — real gaps (variety the domain needs that a mint does not reliably give it)

- **G1 — A ratification-closing step is not part of the mint (S23).** The D49 owner-gate has two halves:
  Mint *proposes*, owner *ratifies*. The proposal half is emitted; the **ratify half is left to the domain
  owner as an unscheduled follow-up**. Proof: domainspec-v2 has a separate `ratify-governance-kinds.md`
  (the first mint that closed it), but the API-contract product's kinds are still `PROPOSED — pending`
  with no ratify record. Under-inheritance: a domain's kinds carry *asserted* not *live* variety until
  ratified, and nothing in the mint flow forces or even templates the closing act. **Fix candidate:** a
  `ratify` template + an EMIT-PROCEDURE stage-3b (owner-gate close), or a §7-style check that flags an
  unratified spine. (Consistent with handoff L1's "existing-target needs its own L0" gap-finding style.)

- **G2 — No "governance function → methods" prompt in the emit path, though the strong framing demands it
  (handoff L2).** The first real mint discovered that the domain-originated KIND *is a governance function*
  and each already-built capability is a *method* that exercises it; domainspec-v2 grew a **Methods
  catalogue** section (`projects/domainspec-v2/authority/AUTHORITY-MODEL.md:66-73`) the template does not
  emit. The API-contract product has NO methods catalogue. A domain needs to know *which instruments
  discharge each governance* to actually operate its regulator; absent, the kind is a name without an
  actuator. **Fix candidate:** EMIT-PROCEDURE Step-1 governance-function prompt + a Methods-catalogue
  template slot (exactly handoff L2's proposed fix — still unimplemented as of both products).

- **G3 — No stop/demotion rule is localized, only the ladder's forward arrows (S3).** D48 requires a
  `stop_rule` (`DEFINITIONS.md:3204`), and cav2's model says a later state can be "blocked, deferred,
  demoted, or re-routed" (`AUTHORITY-MODEL.md:44`). Both minted promotion-policies list Promotion *Blocks*
  (forward guards) but neither localizes a **demotion / drift-flag → supersede** path for an *already-active*
  domain kind. A regulator that can promote but not demote loses variety as the domain's authority ages.
  **Fix candidate:** a demotion-rule slot in the promotion-policy template (drift-flagged → superseded,
  cf. `LIFECYCLE-MODEL.md:31-34`, scoped to the domain's OWN ladder, not the cav2 FSM).

## (3) ABSENT-AND-CORRECTLY-SO — variety a domain genuinely does not need at mint (absence is right)

- **A1 — The ontology PACKAGE-MODEL** (candidate-record shape, RELATION-MODEL predicates, NODE-MODEL
  concepts; S15). Correctly absent: these model *cav2's own* authority-as-ontology read layer; the domain
  regulates authorship with its kinds table + ladder. Inheriting them would be over-inheritance (ceremony).
- **A2 — `promotion-requests/`, `projections/`, `views/` staging dirs** (S18). Empty even in cav2; pure
  internal-pipeline bookkeeping. Correctly zero in both products.
- **A3 — The 9-state LIFECYCLE workflow FSM** (S16). The domain's demand-facing lifecycle is its own
  promotion-ladder; the FSM is cav2's ontology-route read-model. Correctly absent.
- **A4 — Vault / schema / `node_type` / `## Connections` machinery** (S19). Out-of-scope even in cav2's
  package; a domain authoring authority never touches it.
- **A5 — `disciplines/` and discipline-governance** (S14). Correctly absent at mint: a discipline formalizes
  a *recurring* practice, which cannot exist on day 1. NEEDED-LATER, not at-mint.
- **A6 — `imports/` ledger** (S17). The mint's single framework import is handled by the source-spine
  family row; a full import ledger is for later multi-corpus consolidation.
- **A7 — STABLE-REPOSITORY-CONSTITUTION / standalone-extraction gate** (S20). A maturity concern; the
  minted repo is standalone at birth and needs extraction-readiness only when pursuing stable-asset status.
- **A8 — public/private scrub machinery** (S21). Correctly deferred — MVP mints are private-only by decision.
- **A9 — Cryptographic attestation seal** (S22). Correctly absent for *authoring* authority; L0-attributional
  is honest and sufficient to author + ratify. (Its *presence* is a separate strategic bet — see NET-NEW.)

## (4) NET-NEW-NEED — something a minted domain needs that cav2 itself lacks

- **N1 — Verifiable attestation of the governance act (the L2 seal).** cav2 signs its own decisions
  *attributionally* (committed markdown, `2026-06-29-mint-signer-and-boundary.md` Option A description) —
  it has **no tamper-evident attestation capability**. Both minted products carry an explicit
  `signed_record: PLACEHOLDER (L0-attributional) — L2 attestation pending` (`.../product/authority/decisions/2026-06-29-mint.md`;
  domainspec-v2 ratify decision §PENDING). The demand is real *only* under the operator's "attestation IS
  the moat" bet (Decision 1, Option B selected): if a minted domain is to prove *to a third party* that its
  authority spine was cast and ratified by the named owner (not forged), it needs a seal cav2 does not
  possess. This is NET-NEW: the domain's demand exceeds cav2's current supply. **claim ≤ proof:** absent the
  moat bet, L0-attributional meets the *authoring* demand (see A9); N1 is a genuine gap only for the
  tamper-evidence use, which is a strategic initiative with its own lifecycle, not a mint sub-task.

- **N2 (candidate, lower confidence) — A "temporal-commitment" authority kind.** The API-contract product's
  Deprecation-schedule kind PASSED F3(c) as genuinely new — cav2 has NO schedule/timeline/temporal-commitment
  kind and no owner for time-indexed obligations (`.../product/authority/AUTHORITY-MODEL.md:61`). This is a
  domain *discovering* a variety cav2 lacks. It is correctly a domain-local kind + a `promotion-candidate`
  back to cav2's D49 (a separate downstream act, not the mint). Listed as NET-NEW-adjacent: the *pattern* —
  minted domains surface authority kinds cav2 lacks — is the adopt-back demand cav2's import surface (S13,
  deferred stage-5) will have to absorb.

---

## Residue (open, honestly flagged)

- **R1 — N=1 for the ratify-close signal.** Only domainspec-v2 (the *real* mint) closed the D49 owner-gate;
  the API-contract product is a foundry-boundary *experiment* run and may have intentionally stopped at
  PROPOSED to freeze the Obs-A scoring state (criterion §5). G1's "reliably" claim rests on 1 real mint +
  1 experiment, not a fleet. Confidence: G1 is a real gap in the *flow* (the mint does not template the
  close); how *often* it bites needs the deferred N=3 run (handoff §Gaps).
- **R2 — G3 (demotion) is inferred from the D48 stop_rule requirement + the FSM, not from an observed
  failure.** No minted product has yet had an active kind go stale, so the *demand* is derived from the
  lifecycle spec, not witnessed. Lower confidence than G1/G2.
- **R3 — The requisite-variety framing itself is an analogy** (Ashby's regulator ↔ the domain's `authority/`).
  It is a productive lens, not a repo-cited law; the classifications stand on the two products' actual
  contents, which is the load-bearing evidence — the Ashby framing organizes them.
- **R4 — I did not read every cav2 constitution rule** (STABLE-REPOSITORY is 15.4K); S20's verdict rests on
  its stated scope (standalone-extraction) + its absence from both products, not a full read.
