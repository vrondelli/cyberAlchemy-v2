---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — Mint is intended-not-shipped
created: 2026-07-01
authored_by: research subagent (SKEPTIC, "Gödel, Kurt")
gate: DEFINITIONAL-SOUNDNESS / CIRCULARITY
note: Paths are repo-root-relative from domainspec-core/. claim ≤ proof throughout.
---

# Mint ↔ cav2 inheritance — circularity attack (definitional-soundness gate)

## The one test I apply

The recursion boundary I enforce is stated in
`development/machine-map/findings.md:23,36-39`: **there are TWO System-5s one VSM
recursion apart — cav2 = S5 of the authority-MANUFACTURING system; the domain's
AXIOMS/CONSTITUTION = S5 of a MANUFACTURED authority. The inner system's PRODUCT
is the policy the outer governs.** Mint's own guardrail
(`ARCHITECTURE-BUNDLE.md:57-58`, `SPEC.md:66`): inheriting cav2's *object* content
"re-fuses the levels (the mold becomes a casting of itself)."

So the discriminator is **format vs fill**:

- **SAFE-TO-INHERIT (meta):** the empty table + its column contract, a routing
  *pattern*, a derivation *pattern*, a *rule* the domain applies to its OWN table,
  a lifecycle FSM, a schema shape. Mint hands the domain a **tool to author its own**.
- **CORRECTLY-LOCALIZED (object):** cav2's actual populated ROWS/instances — its 9
  kinds, 8 postures, 7 non-collapse rules, C1–C17, D-numbered definitions, SC-1..6
  source contracts, the `concept.*` set, the DISCIPLINES catalog rows. Seeding these
  hands the domain **cav2's own S5 self-model as the domain's governing base** → re-fusion.

**Re-fusion test (one line, reused):** *Does the seed carry cav2's own object rows/
instances (its self-model) rather than an empty format the domain fills?* If YES →
CORRECTLY-LOCALIZED (demote). A subtle trap the prompt flags: cav2's ontology
*package* (`ontology/*`) is cav2's **own read-layer/self-model** — its `concept.*`
rows and `SC-*` source contracts are object, even though the *record shape* is meta.

---

## Per-candidate verdict table

| # | Candidate | meta/object | Verdict | One-line re-fusion test |
|---|---|---|---|---|
| 1 | Narrowest-Owner routing table (movement→owner), `AUTHORITY-MODEL.md:90-104` | **meta (format)** — but the 7 *rows* are cav2's owner set | **SAFE-TO-INHERIT (the pattern)** | Seed the movement→owner *schema* (empty), NOT cav2's 7 specific rows; if the domain gets cav2's owners as its owners → re-fusion. |
| 2 | invariant→axiom→constitution→validator derivation pattern, `AUTHORITY-MODEL.md:105-120` | **meta (pattern)** | **SAFE-TO-INHERIT** | It is explicitly "a routing pattern, not a law" (:118) — carries no cav2 instance; safe. |
| 3 | Full 8-posture table (+ posture≠confidence), `AUTHORITY-MODEL.md:79-88` / `ontology/AUTHORITY-POSTURES.md` | **object (the 8 rows)** | **CORRECTLY-LOCALIZED** (demote) | The 8 named postures ARE cav2's own reliance taxonomy (self-model rows); seed the posture-contract *columns* + the posture≠confidence *rule*, let the domain author its own posture set. |
| 4 | 7 canonical Non-Collapse Rules in full vs "structure+1", `AUTHORITY-MODEL.md:122-133` | **object (the 7 rules)** | **CORRECTLY-LOCALIZED** (demote) | The 7 rules are cav2's own layer-separation instances; seed the *non-collapse discipline* (a rule slot + `forbidden_collapse` field), the domain writes its own layers' rules. |
| 5 | Default-deny CLOSED-table declaration on the domain's OWN kinds table (D49 closure), `AUTHORITY-MODEL.md:63-72` | **meta (rule applied to own table)** | **SAFE-TO-INHERIT** | This is the load-bearing case: inherit the D49 *closure rule* + catch-all row *format* applied to the domain's **own** table — exactly the C1 resolution (`ARCHITECTURE-BUNDLE.md:54-56`); seeding cav2's D49 *enumeration* itself would re-fuse. |
| 6 | boundaries.md (public/private, source/read, gen/canon, research/spec; +engine-withholding), `authority/boundaries.md` | **mixed → format meta; engine clause object** | **SAFE-TO-INHERIT (the boundary skeleton); LOCALIZE the engine/free-paid clause** | The four boundary *categories* are meta; but the Free/Paid + engine-withholding rows (:46-65) are cav2's own product decisions — a domain must not inherit cav2's moat clause as its own. |
| 7 | Import/inventory rung + `authority/imports/` ledger (C11 import-before-promotion), `authority/imports/`, STABLE-REPO:177-205 | **meta (rung + ledger format)** | **SAFE-TO-INHERIT** | Seed the empty import-ledger + the before-promotion *rule*, NOT cav2's staged imports (house_project, resonantos, the 149 candidates); those rows are cav2's object corpus. |
| 8 | Definitions lifecycle equipment: INDEX + DRIFT-AUDIT + SCHEMAS registry, `DEFINITION-{INDEX,DRIFT-AUDIT,SCHEMAS}.md` | **meta (empty equipment) — self-inconsistent if omitted** | **SAFE-TO-INHERIT** | Seed the *empty* index/audit/schema equipment (the drift-audit *procedure*), NOT cav2's filled audit (D1–D50 findings); the self-inconsistency (a load-bearing-term rule that requires a drift audit) is fixed by seeding the *emitter*, not cav2's audit rows. |
| 9 | DEFINITION-LOCALIZATION-ROUTE + definitions/reviews staging (import→represent→canonical, local-posture vocab), `DEFINITION-LOCALIZATION-ROUTE.md` | **meta (route + posture vocab)** | **SAFE-TO-INHERIT** | Seed the localization *route* + the 6 local-posture values (a controlled vocab, not instances); NOT cav2's Arcanum-first slice / cluster fill (:50-92). |
| 10 | decisions/README + D36 decision-card schema (beyond the single mint decision), `authority/decisions/README.md` | **meta (schema + surface)** | **SAFE-TO-INHERIT** | Seed the decisions *surface* + card *schema*, NOT cav2's four decision rows (HMI, engine-moat, disclosure, resonantos). |
| 11 | Ratification-CLOSE in the mint flow (D49 owner-gate CLOSE, not just propose) | **meta (lifecycle step)** | **SAFE-TO-INHERIT** | A real G1 gap: the mint must emit the CLOSE *step* so the domain's own kinds ratify — this seeds a lifecycle *transition*, not any cav2 verdict; no re-fusion. |
| 12 | Stop/demotion rule (D48 stop_rule — demote/supersede path for an active domain kind) | **meta (lifecycle rule)** | **SAFE-TO-INHERIT** | Inherit the D48 demote/supersede *rule* applied to the domain's own kinds; carries no cav2 row. |
| 13 | Governance-function→methods catalogue prompt | **meta (prompt/format)** | **SAFE-TO-INHERIT** | Seed the *prompt that elicits* the domain's own function→method map (handoff L2), NOT cav2's own methods; the prompt is a mold. |
| 14 | Ontology candidate-staging package: PACKAGE-MODEL Candidate-Record-Shape + NODE-MODEL challenge_contract (D40) + two-axis confidence, `ontology/PACKAGE-MODEL.md:90-124`, `ontology/NODE-MODEL.md` | **object masquerading as meta** — the *shape* is meta but the package IS cav2's self-model | **CORRECTLY-LOCALIZED** (demote) | The record *shape* (YAML fields) is a safe format; but PACKAGE-MODEL is by its own words "the CyberAlchemy base repository's candidate authority model **package**" (:9-11) and NODE-MODEL's `concept.*` rows + SC-1..6 source contracts ARE cav2's read-layer/self-model — seeding the package hands the domain cav2's self-model, not a builder; seed the empty shape only. |
| 15 | Ontology structural models: RELATION-MODEL (+value-cycle guard) + LIFECYCLE-MODEL (4-axis FSM, Typed-Hole, Multi-Provenance) + BRANCH-AS-VIEW + views triad + projections + promotion-requests, `ontology/*` | **object (cav2's self-model read-layer)** | **CORRECTLY-LOCALIZED** (demote) | These model **cav2's OWN authority objects** (RELATION-MODEL predicates over cav2 concepts; LIFECYCLE-MODEL is cav2's D23 axis fill) — "empty even in cav2 / internal-bookkeeping" per the prompt; seed at most the FSM *format*, never cav2's populated relation/lifecycle rows. |
| 16 | ARTIFACT-TREE orientation map + crosswalks (TAXONOMY, RELATIONSHIP, SOURCE-SURFACE witness-mapping), `ontology/ARTIFACT-TREE.md`, `ontology/*-CROSSWALK.md` | **object (cav2's own tree/witness map)** | **CORRECTLY-LOCALIZED** (demote) | ARTIFACT-TREE "orients the CyberAlchemy v2 source tree" (:8) and SOURCE-SURFACE-CROSSWALK maps cav2's private-parent witnesses — pure cav2 self-orientation; the domain must author its own tree map. |
| 17 | STABLE-REPO-CONSTITUTION rules as minted-repo rules (11 uncarried: C4,C5,C6,C7,C10,C12,C13,C14,C15 +adapters) + CONSTITUTION-IMPORT-PACK, `constitutions/STABLE-REPOSITORY-CONSTITUTION.md` | **object (cav2's own C-rules)** | **CORRECTLY-LOCALIZED** (demote) | C1–C17 are cav2's own constitution *instances* (selectors `cyberAlchemy-v2/**`, :7); seed the *constitution-authoring route* + rule *schema* (import-pack = a template), NOT cav2's ruleset as the domain's ruleset — that literally installs cav2's S5 policy in the domain. |
| 18 | Navigation surfaces: authority/README + area READMEs (C7 navigable work surface) | **meta (the C7 rule) / object (cav2's READMEs)** | **SAFE-TO-INHERIT (the requirement)** | Inherit the C7 *navigability rule* (each area exposes entrypoint/owner/next-route) so the domain writes its OWN READMEs; do NOT copy cav2's README prose. |
| 19 | DISCIPLINES.md catalog + Growth Rule + cards, `disciplines/DISCIPLINES.md` | **mixed → Growth Rule meta; catalog rows object** | **SAFE-TO-INHERIT (Growth Rule + card schema); LOCALIZE the catalog rows** | Inherit the discipline *Growth Rule* + card *schema* (a promotion contract); the 3 catalog rows (stable-repository-stewardship, provisional-model, tracking) are cav2's own practices — seeding them gives the domain cav2's disciplines. |
| 20 | Verifiable/tamper-evident attestation seal (N1) | **net-new (neither)** | **NEITHER — net-new-need, not inheritable** | Not present in cav2 as machinery OR content (currently an attributional placeholder, BLOCKED per prompt); nothing to inherit or localize — it is a build-from-owned/net-new item, out of this gate's inherit/localize dichotomy. |
| 21 | Adopt-back surface for domain-surfaced kinds cav2 lacks (N2) | **meta (import-surface direction)** | **SAFE-TO-INHERIT** | This is the *reverse* movement (domain→cav2 import surface); it seeds a two-way *channel format*, carries no cav2 object row into the domain — deferred (mint stage 5) but non-fusing. |

---

## Note on the "structure+1 / partial-seed" candidates

Candidates 3, 4, 6, 14, 19 are the ones Mint's A1 already seeds "partial." My gate
sharpens *why* the partial line falls where it does: the safe fraction is always the
**format/rule** half, and the part that must NOT cross is always cav2's **populated
rows**. Where A2 lists these as "load-bearing," the load-bearing thing is the machinery
(inherit it); the rows are the trap (localize them). Candidate 5 is the inverse
poster-child: the *closure rule on the domain's own table* is the load-bearing SAFE
inherit, and it is exactly what dissolves the C1 self-contradiction — the domain never
touches cav2's D49 enumeration.

## Residue / open

- Claim ≤ proof: the two-System-5 grounding is, by its own source, "an analogy, not a
  repo-cited fact" (`findings.md:39`; echoed `SPEC.md:66`). My demotions therefore rest
  on the **format-vs-fill** operational test, which IS repo-cited (PACKAGE-MODEL:9-11
  self-labels as cav2's own package; STABLE-REPO selectors :7 scope C-rules to cav2), not
  on the analogy alone.
- The ontology package (14/15/16) is the highest-risk cluster: its *shapes* look like
  reusable meta but the *package as shipped* is cav2's self-model. Seed shapes, not the package.
