---
node_type: spec
is_session: false
status: candidate
boundary: INTERNAL — Mint is intended-not-shipped; foundry/moat are candidate
created: 2026-06-29
owner_next: sigil-development
authored_by: invoke (mode=define)
lineage:
  - refine run: development/refinement-runs/20260629T0000Z-cav2-mint-feature/RESULT.md
  - review: mint-design-plan-review (ledger; FIX verdict — fixes applied here)
note: Paths are repo-root-relative from domainspec-core/.
---

# Mint — SPEC (define)

## Purpose
**Mint** is a planned cav2-native capability that **mints a new domain-specialized repository**
from the cav2 framework: it composes the doc-tree scaffolder (`domainspec-new-repo`) and then
**casts the cav2 authority spine** (authority kinds, definitions tower, constitutions, promotion
lifecycle — the MOLD) onto a specific domain/research/project. Precedent (hand-done):
`resonantos-economy-research`.

## Contract — what a mint produces
A new repo containing:
1. the framework **partition/doc tree** + a clone-safe framework attach (from `domainspec-new-repo`);
2. a **domain authority-model** with domain-local authority **kinds** (proposed, owner-ratified — see Gates);
3. a domain **source-spine**, **promotion-policy** (ladder + gates), a domain **constitution**, and a **definitions** skeleton;
4. a **framework crosswalk** (per-concept borrow / block / analogy-only / promotion-candidate);
5. a **signed decision-gate record** (minting is a governance act, not a file drop);
6. (deferred) a cav2 **import surface** for two-way adopt-back.

## Inputs
| input | meaning |
|---|---|
| `domain` | the target domain/research/project name |
| `target-repo-path` | where the minted repo is created (sibling of domainspec-core) |
| `--source <framework-path>` | the framework half to attach (cav2 + DomainSpec + Arcanum) |
| `--attach submodule\|copy\|symlink` | clone-safe attach mode (default submodule) |

## Outputs (owned by the minted repo)
The minted repo's `authority/`, `definitions/`, `constitutions/`, `RELATED-FRAMEWORK-CROSSWALK.md`,
plus an `authority/decisions/<date>-mint.md` signed record. Mint itself remains the *authoring*
capability; the minted artifacts belong to the new repo's lifecycle.

## Committed additions (decision 2026-07-01 — committed, NOT yet built)
Source signals: `development/research/2026-07-01-mint-cav2-inheritance-audit/findings.md` (audit) +
`development/decisions/2026-07-01-mint-additions-scope.md` (scope = **Tier 1+2 + close Tier 3**).
The audit found Mint casts authority *outputs* but under-inherits the authority *authoring lifecycle*.
The owner committed **13 buildable additions** to the mint contract (build owned by sigil-development):

- **Tier 1 (fix live defects):** definitions-lifecycle equipment (INDEX + DRIFT-AUDIT + SCHEMAS stubs) [#8];
  a **ratify-CLOSE** record so proposed kinds become live, not stuck `PROPOSED` [#11]; a
  governance-function→**methods** catalogue [#13].
- **Tier 2 full-meta (seed the rule/route/pattern):** narrowest-owner routing table [#1];
  invariant→axiom→constitution→validator derivation [#2]; table-level default-deny **CLOSED**
  declaration on the domain's own kinds table [#5]; DEFINITION-LOCALIZATION-ROUTE + `definitions/reviews/`
  staging [#9]; stop/demotion rule (D48 `stop_rule`) [#12].
- **Tier 2 seed-format (seed the empty contract, NEVER cav2's rows):** posture-*contract* columns +
  posture≠confidence [#3]; non-collapse rule-*slot* + `forbidden_collapse` field [#4]; minimal
  private-only boundary skeleton [#6]; promotion-flow import/inventory **rung** [#7]; constitution-authoring
  route + `CONSTITUTION-IMPORT-PACK` template [#17].
- **Tier 2 cheap:** `decisions/README` + D36 decision-card schema [#10]; `authority/README` nav stub [#18].

**Self-inconsistency this closes (#8, claim ≤ proof):** the currently-seeded constitution's
load-bearing-term rule *requires* a definitions drift-audit the contract does **not** emit — today the
rule fires into a void. The INDEX + DRIFT-AUDIT stubs (Tier 1) close it.

## Disclosed non-seeds (Tier 3 — recorded decisions, not oversights)
Both audit skeptic gates (meta-vs-object; already-provided) agreed these are **correctly withheld**:
- **Ontology / artifact package** [#14/#15/#16] — candidate-record-shape, NODE/RELATION/LIFECYCLE
  models, ARTIFACT-TREE, cav2 crosswalks. This is cav2's **own self-model** (`ontology/PACKAGE-MODEL.md:9`);
  seeding it re-fuses the two System-5 levels. At most seed the *empty* record-shape as an optional tool.
  *(This was the motivating example — correctly localized, not a gap.)*
- **Disciplines catalog** [#19] — no recurring practice exists at mint-time (seed only the Growth-Rule + card schema, later).
- **Verifiable attestation seal** [#20] — build-from-owned; owner exists (`../attestation-capability/`, L2-blocked).
- **Adopt-back surface** [#21] — Mint stage-5, explicitly deferred.

## Boundaries / Gates (load-bearing)
- **D49 owner-gate (corrected per review C1).** A mint **proposes** the domain's authority kinds; the
  **cav2 authority owner ratifies**. The domain gets its *own* kinds table (a domain-local authority
  artifact); this is **not** a change to cav2's closed D49 enumeration (`authority/AUTHORITY-MODEL.md`).
- **Public/private (`BLK-CAV2-PUBLIC-PRIVATE-001`).** A mint that emits a *public-attached* repo is
  **blocked** until the public/private boundary is resolved. Arcanum is public; cav2/DomainSpec/Saturn private.
- **claim ≤ proof.** Mint is **intended-not-shipped**; it is *one casting organ* of the machine-map
  foundry, not the foundry. No stage may assume Saturn/the foundry/the moat is shipped.

## Inheritance / localization boundary (meta vs object)
A mint gives a domain repo a **base to grow on its own**: it **inherits the cav2 meta-authority
machinery** (the *how*) and **localizes the object authority** (the *what*). cav2 is **harvested
precedent**, not a governing parent (per `resonantos .../decisions/2026-06-29-method-authority-localized.md`).

| Inherited — the MOLD (how authority is made) | Localized — the casting (what this domain holds) |
|---|---|
| authority-lifecycle (`CAV2-D48`) + its `stop_rule`; the closure **rule** (`CAV2-D49`) applied to the domain's *own* table; non-collapse (D22/D29); claim ≤ proof (D38); build-from-owned (C17); the promotion-policy structure + source-movement + the Authority-Kinds-table **format**; the narrowest-owner routing table; the invariant→axiom→constitution→validator derivation pattern; the DEFINITION-LOCALIZATION-ROUTE; the definitions-lifecycle equipment (INDEX/DRIFT-AUDIT/SCHEMAS) *as machinery* (added 2026-07-01) | the domain's own **kind rows**, definitions, constitution rules, source families, decisions |

- **Boundary test:** defines *how* authority is made → **inherit**; *what* authority the domain holds → **localize**.
- **Seed, don't bind:** the domain's tables are **seeded** from cav2's (a starting point) but owner-authored thereafter.
- **Seed the format, not the rows (SPLIT items, decision 2026-07-01):** for the posture table, non-collapse rules, the closure declaration, and the constitution-import set, the domain inherits the *empty contract / slot / declaration / route*, **never** cav2's populated rows/rules/enumeration/instances — else the addition re-introduces the level-refusion the circularity guardrail forbids.
- **Circularity guardrail (machine-map `two-system-5s-recursion-boundary`):** never inherit cav2's *object* kinds as a governing base — that re-fuses meta and object (the mold becomes a casting of itself). claim ≤ proof: the two-System-5 grounding is a **candidate analogy, not a repo-cited fact** (open AUTHORITY-MAP/GOVERNANCE-ATTENUATION contradiction).

## Glossary
- **mint** — to cast the cav2 authority spine onto a domain, producing a new domain-specialized repo (a *casting* from the MOLD).
- **authority spine** — authority kinds + definitions tower + constitutions + promotion lifecycle (D48).
- **domain-local kinds table** — a minted repo's own authority-kinds enumeration; distinct from cav2's D49 enumeration.
- **scaffold half** — the ~30% doc-tree produced by `domainspec-new-repo`.
- **authority-casting half** — the ~70% governance act Mint owns (rough, by directory count — see RESULT/miner).

## Provenance
Design resolved by refine run `20260629T0000Z-cav2-mint-feature`; justification **re-grounded** here
per the `mint-design-plan-review` FIX verdict (the D49-alter and two-System-5 legs were cracked — see
ARCHITECTURE-BUNDLE §Re-grounded justification).

## Executable planning contract (refresh 2026-08-07)

Mint's first executable boundary is a deterministic **no-write planner**, before L0. Given a
machine-readable domain manifest, an explicit absent target path, and pinned template sources, the
planner validates admission, inventories the ordered prospective effects, and emits one canonical
JSON effect plan binding every allowlisted source-template digest. It does not render target bytes,
create the target, invoke a scaffolder, attach a framework, ratify kinds, or apply effects.

The manifest must bind: schema version, domain identity and objective, governed subject, target
root/path, privacy posture, framework source path and digest, template-set digest, domain-local
concept/authority bindings, and the fixed planning date used by date-bearing effects. The planner
rejects missing or unknown fields, source-digest drift, unsafe or colliding effects, existing targets,
path escape (including resolved symlink escape), public attachment, and any prospective output not
strictly below the normalized target path.

The effect plan binds the canonical manifest digest, template-set digest, planner version, ordered
prospective writes, source-template sizes and SHA-256 digests, validation results, and blockers.
Identical inputs and pinned sources must produce byte-identical stdout. The current templates mix
instructions, examples, and intentional angle-bracket specimens, so machine-safe rendering belongs
to a later typed render-IR SWU. This contract proves only planning; rendering, filesystem application,
journaling/recovery, L0/L1 acceptance, and a Zagr-derived casting remain later work.
