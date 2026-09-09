---
node_type: design
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-06-29
authored_by: invoke (mode=design)
supersedes: development/refinement-runs/20260629T0000Z-cav2-mint-feature/RESULT.md (its C1/C2 justification only)
note: Paths are repo-root-relative from domainspec-core/.
---

# Mint — ARCHITECTURE BUNDLE (design)

## Design decision
**Mint = a NEW cav2-native skill that COMPOSES `domainspec-new-repo`** — it *calls* the scaffolder
for the doc-tree (the smaller half) and **owns** the authority-spine casting (the core). It does
**not** extend `domainspec-new-repo`.

## Re-grounded justification (review C1 + C2 — the cracked legs are replaced)
The refine RESULT picked "B" on two legs the `mint-design-plan-review` cracked. They are dropped and
re-derived on repo-cited ground:

1. **Charter clash (repo-cited — replaces the two-System-5 analogy, C2).** `domainspec-new-repo` is
   by its own charter *"coins no edges, **enforces nothing**"* (`implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md:21`).
   Minting a domain authority spine **is** an enforcement/governance act — it installs a domain
   default-deny posture, a promotion policy, and a **signed** decision. A by-charter non-authority
   scaffolder **cannot be** the authority-casting act. Therefore the casting must be owned by a
   **cav2 authority owner**, not bolted into the scaffolder. *(The two-System-5 boundary is retained
   only as candidate motivating framing — its own source labels it "an analogy, not a repo-cited fact.")*
2. **Minting is a signed governance act (precedent-cited).** The resonantos precedent recorded the
   standalone-repo mint as a `decision-gate + constitution-governance` event with a signed
   `authority/decisions/` record — not a file drop. A scaffolder models no signer; a cav2-owned skill does.
3. **No D49 enumeration change (corrects C1's self-contradiction).** A mint **proposes** domain kinds
   for owner ratification; the domain gets its **own** kinds table (a domain-local artifact). This is
   *not* "altering cav2's D49 enumeration" — so the RESULT's "alters a KIND → B" trigger is void, and
   the conclusion now rests cleanly on (1)+(2). The mint and plan are consistent: propose, never unilaterally alter.

**Net:** the *mechanism* ("compose") was never in doubt; the corrected legs establish the *ownership*
(cav2) without the cracked claims.

## The real axis (review C6)
The genuine decision was **orchestrator ownership** — a cav2-side skill vs a `--profile` on
`domainspec-new-repo` — since "compose" is common to both candidate positions. Resolved to **cav2-side**
by (1): the orchestrator must be the authority owner.

## Inherit / localize boundary (meta vs object) — what a mint gives a domain to grow on
This is the non-circular form of the (demoted) two-System-5 point, and it's what makes the casting
autonomous. A mint **inherits the cav2 *meta-authority machinery*** (authority-lifecycle D48, the
closure *rule* D49, non-collapse, claim≤proof, build-from-owned, the promotion/source-movement/table
*format*) so the domain repo **knows how to author its own authority** — and **localizes the *object*
content** (its own kind rows, definitions, constitution rules). cav2 stays **harvested precedent**
(resonantos localized exactly this, 2026-06-29). Full contract + the boundary test in
[SPEC.md §Inheritance/localization boundary](./SPEC.md).
- **Why this is the load-bearing design move:** it is *also* the C1 resolution — the domain inherits
  the *rule* D49 (meta) and applies it to its **own** table (object), so it never touches cav2's
  enumeration. Meta-inherited + object-localized = casting, not mutation.
- **Circularity guardrail (machine-map `two-system-5s-recursion-boundary`):** inheriting cav2's *object*
  kinds as a governing base re-fuses the levels (the mold becomes a casting of itself). Keep meta inherited, object localized.
- **Audit corroboration (2026-07-01):** two independent skeptic gates (meta-vs-object; already-provided)
  confirmed the ontology/artifact package (candidate-record-shape, NODE/RELATION/LIFECYCLE models,
  crosswalks) is cav2's **own self-model** (`ontology/PACKAGE-MODEL.md:9`) — **correctly localized, not a
  gap**. The committed additions extend only the *meta* machinery; SPLIT items seed the empty format,
  never cav2's rows ([SPEC §Inheritance](./SPEC.md)).

## The 5-stage mint flow
| stage | act | owner | notes |
|---|---|---|---|
| 1 **scaffold** | call `domainspec-new-repo --source <fw> --attach submodule --mode plan` then `--mode apply` | composed | uses the scaffolder's clone-safe + single-sessions fixes (review C3/C8: `--mode`, not `--dry-run`; the `apply` call inherits its master gate) |
| 2 **authority-spine seed** (MVP core) | emit domain authority-model/kinds + source-spine + promotion-policy + constitution + definitions skeleton, via the **authority-triage** front-door | cav2 (Mint) | authority-triage used in **candidate/review-mode** (review C5 — passed its first corpus; "not promotion-ready" gates only the public arcanum write, not internal use) |
| 3 **decision-gate** | emit a **signed** `authority/decisions/<date>-mint.md`; the cav2 owner **ratifies** the proposed kinds | cav2 owner | actored gate — see EXECUTION-PACK §owner-gate (review C7) |
| 4 **crosswalk** | emit `RELATED-FRAMEWORK-CROSSWALK.md` (borrow / block / analogy-only / promotion-candidate) | cav2 (Mint) | template = resonantos as-built crosswalk |
| 5 **adopt-back** (deferred) | register cav2 import surface for two-way adoption | cav2 (Mint) | follow-on, not MVP |

**Committed expansion (audit + decision 2026-07-01 — committed-not-built).** Stage 2's emit-set grows
beyond the 6 templates to the 13 additions in [SPEC §Committed additions](./SPEC.md); and **stage 3
gains an explicit ratify-CLOSE artifact** — the audit found the flow *proposes* kinds but never *closes*
the owner-gate, so minted kinds stay `PROPOSED` (witnessed: domainspec-v2 hand-authored a ratify record
post-mint). Tier-1 additions (#8 definitions drift-audit stubs, #11 ratify-close, #13 methods catalogue)
close two live defects; Tier-3 surfaces are disclosed non-seeds. Build owned by sigil-development.

## Components & dependencies (review-verified)
- **Scaffolder:** `domainspec-new-repo` (owned). Compose via `--mode`; `apply` surfaces one human gate (review C3).
- **Front-door:** authority-triage sigil — `<repo-root>/development/authority-triage/` (review C9/C11: real path is repo-root, not cav2-local). Candidate, review-mode.
- **Emit-templates:** reverse-engineered from the **external sibling** repo `<repo-root>/../resonantos-economy-research/` — `authority/{AUTHORITY-MODEL,source-spine,promotion-policy}.md`, `definitions/DEFINITIONS.md`, `RELATED-FRAMEWORK-CROSSWALK.md`. **These are outside domainspec-core** (review C4); the cav2 import surface holds only README + a handoff.

## Review-fix ledger (what changed vs RESULT.md)
C1 re-grounded · C2 demoted · C3/C8 `--mode` + gate-inheritance · C4 external paths disclosed · C5 review-mode dependency · C6 orchestrator-ownership framing · C7 actored gate (EXECUTION-PACK) · C9 craft `ART-MINT-AUTHORITY-TRIAGE` added · C10/C11 hedge + repo-root paths.

**Audit-fix ledger (2026-07-01):** the Mint⟵cav2 inheritance audit
(`development/research/2026-07-01-mint-cav2-inheritance-audit/findings.md`) + scope decision
(`development/decisions/2026-07-01-mint-additions-scope.md`) committed 13 authority-authoring additions
+ 6 disclosed non-seeds. The emit-set expansion and the stage-3 ratify-close are recorded in
[SPEC §Committed additions](./SPEC.md); layer placement in [IMPLEMENTATION-LAYERING.md](./IMPLEMENTATION-LAYERING.md); SWUs in [WORK-PACK.md](./WORK-PACK.md).
