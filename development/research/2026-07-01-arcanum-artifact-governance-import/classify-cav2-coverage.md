# Arcanum Artifact-Governance Import — cav2 Coverage Classification

Status: research finding (candidate)
Owner: import-classifier subagent (coverage/boundary angle)
Date: 2026-07-01
Angle: COVERAGE/BOUNDARY-FIRST, corpus = the CAV2 AUTHORITY
Verdict rule: lean ALREADY-OWNED; justify each GENUINE-GAP. claim <= proof.

## Question

The owner wants to import Arcanum's (public) framework artifact-governance
constitutions into cav2 (private) authority, and asked whether "maybe this
import is already mapped in cav2". This doc classifies, for each Arcanum
candidate rule-family, whether cav2 ALREADY-OWNS / ALREADY-MAPS / has a
GENUINE-GAP.

## One-line answer to "is the Arcanum import already mapped in cav2/authority/imports/?"

YES — path-level. `cyberAlchemy-v2/authority/imports/constitutions/MANIFEST.md`
(scan date 2026-06-19, lines 63-69) already stages the six Arcanum framework
files (`ANTI-PATTERNS`, `ARTIFACT-CONSTITUTION`, `ARTIFACT-METADATA-CONSTITUTION`,
`GITIGNORE-CONSTITUTION`, `MARKDOWN-LINKING-CONSTITUTION`, `QUALITY-BAR`,
`SCHEMA-CONSTITUTION`) as import candidates, and
`cyberAlchemy-v2/authority/constitutions/CONSTITUTION-IMPORT-PACK.md` names
"Arcanum framework constitutions" as the "first public-safe rule pattern source".
So the *staging* is done, but promotion is NOT: all are "candidate only,"
none has been extracted into a cav2 local constitution rule. Three of the
parent's named candidates are NOT in the 2026-06-19 manifest at all:
`DEVELOPMENT-TO-CANONICAL-PROMOTION.md`, `RECEIPT-ID-LEGEND-CONSTITUTION.md`,
and `tools/validate-artifact-constitution.sh` (the validator) — these are
un-staged (post-dating or missed by the scan).

## Coverage Table

Legend: **OWNED** = a cav2 constitution/model rule already covers the intent
(cite). **MAPPED** = staged in `imports/` but not promoted (cite). **GAP** =
cav2 has no equivalent rule or model, staged or promoted.

| Arcanum candidate (rule-family) | cav2 coverage | Cite | Note |
| --- | --- | --- | --- |
| **ARTIFACT-CONSTITUTION** — artifact classes (source / durable-evidence / generated / local-runtime), classify-before-commit, generated-ignored-unless-promoted | **MAPPED** (staged, not promoted); intent PARTIALLY-OWNED at model level | manifest L64; `AUTHORITY-MODEL.md` §Authority Kinds "Evidence" row + §Authority Postures "Generated projection/Template/Evidence"; `STABLE-REPOSITORY-CONSTITUTION.md` CAV2-C6 (generated projection traceability), CAV2-C2 (authority-layer separation) | cav2 governs *authority-kind* separation, not file *retention-class* (source vs generated vs runtime tracking). The 4-class file taxonomy + `.gitignore`-coupled retention is a GAP at rule level; only the promotion-boundary intent is owned. |
| **ARTIFACT-CONSTITUTION → Promotion Boundary Rule** (`artifact.promotion.development-to-canonical`) | **OWNED** | `STABLE-REPOSITORY-CONSTITUTION.md` CAV2-C11 (import-before-promotion), CAV2-C3 (research-before-spec); `AUTHORITY-MODEL.md` §Core Flow + §Narrowest Owner; `promotion-policy.md`; `CAV2-D48` authority-promotion-lifecycle | cav2 fully owns "development evidence -> canonical only via named promotion patch/owner route." Same intent, cav2 vocabulary. |
| **ARTIFACT-CONSTITUTION → Rendering Rules** (no literal `\n` in charts; HTML `<br>`) | **GAP** | none in cav2 authority | Deterministic render hygiene; no cav2 equivalent. Low value to cav2 (no chart-rendering surface staged). |
| **ARTIFACT-METADATA-CONSTITUTION** — YAML-frontmatter tags (`artifact_type`, `constitution_selectors`, `validation_profile`) that select constitutions from declared intent, not path | **GAP** (staged: MAPPED) | manifest L65; gap: cav2 authority files use plain-header convention (`# Title` + `Status:`/`Owner:`/`Selectors:` prose), NOT `---` YAML frontmatter (grep: only `imports/house_project/**` uses `---`) | cav2 has **no metadata-driven constitution-selection layer**. Selectors exist as prose (`Selectors: cyberAlchemy-v2/**`) but there is no typed frontmatter, no `validation_profile`, no `constitution_selectors` machinery. Genuine gap; would need a cav2 frontmatter decision (decision-gate) before adoption. |
| **SCHEMA-CONSTITUTION** — canonical machine-readable schema = `.schema.yml`, prose-boundary, legacy-migration | **GAP** (staged: MAPPED) | manifest L69; nearest cav2 touch is `PACKAGE-MODEL.md` "Out of scope: schema amendment" + `AUTHORITY-MODEL.md` "Schema/edge change -> schema governance" | cav2 defers all live-schema work (OQ, "deferred") and has NO format rule for schema files. cav2 governs *when* schema may change (owner route), Arcanum governs *what format* a schema file takes. Complementary; genuine gap on format. |
| **MARKDOWN-LINKING-CONSTITUTION** — local links resolve, entrypoint required, source-claims cite, typed-edge vocabulary, non-authority notice | **PARTIALLY-OWNED** + MAPPED | manifest L67; `STABLE-REPOSITORY-CONSTITUTION.md` CAV2-C1 (source-ledgered: cite paths or label synthesis), CAV2-C7 (navigable work surface: entrypoints/owner/role/source-links), CAV2-C8 (open-questions residue); validation adapter CAV2-C1 = "Markdown link check"; `ontology/RELATION-MODEL.md` (edge semantics) | cav2 OWNS the *intent* (cite-or-label + navigable surface + link check as the named first deterministic rule, OQ-1). GAP = the **controlled typed-edge vocabulary** (`cites`/`governs`/`supersedes`/`depends-on`/`blocks`...) and the `## Connections` edge-table shape. cav2 CAV2-C13 governs edge *acyclicity* but not a link-edge *label vocabulary*. |
| **DEVELOPMENT-TO-CANONICAL-PROMOTION** — 9-step promotion process; dev-artifact = evidence, canonical = authority, cross only via promotion patch | **OWNED** | `STABLE-REPOSITORY-CONSTITUTION.md` CAV2-C3, CAV2-C11; `AUTHORITY-MODEL.md` §Core Flow, §Non-Collapse Rules (esp. #1, #5, #6), §Narrowest Owner; `promotion-policy.md`; `PACKAGE-MODEL.md` §Authority Law + §Core Package Model | This is the single most-owned family. cav2's entire authority-by-owner-route model IS this process, restated. NOT in the 2026-06-19 manifest (un-staged), but functionally already-owned — do not re-promote. |
| **GITIGNORE-CONSTITUTION** — ignore generated/runtime/secrets, keep source tracked; narrow evidence-backed ignore rules | **GAP** (staged: MAPPED) | manifest L66; adjacent: CAV2-C6 (generated projections), ARTIFACT-CONSTITUTION class model (also unpromoted) | cav2 authority has no `.gitignore`/tracked-tree retention rule. Repo-level `SUBMODULE-DISCIPLINE.md` handles boundary, but cav2 authority itself does not own retention. Genuine gap; low cav2 value while cav2 is a doc-only staging area. |
| **RECEIPT-ID-LEGEND-CONSTITUTION** — sigil/spell receipts must gloss cited ids inline (self-contained receipts) | **GAP** (NOT staged) | none; not in manifest | Arcanum-runtime-specific (sigil/spell receipts, `dispatch_id`, run ids). cav2 has no receipt surface. Genuine gap but out-of-scope for cav2 authority unless cav2 gains a runtime. |
| **ANTI-PATTERNS** — sigil misuse guardrails (wrong trigger, overreach, under-spec) | **GAP** (staged: MAPPED) | manifest L63 | Sigil-lifecycle guardrail doc, not a structural artifact rule. cav2 has no sigil authority. Genuine gap, but this is Arcanum-capability material, weak fit for cav2 structural authority. |
| **QUALITY-BAR** — sigil execution success criteria (observable completion) | **GAP** (staged: MAPPED) | manifest L68 | Same as ANTI-PATTERNS: sigil-execution quality, not artifact-tree governance. Genuine gap, weak fit. |
| **tools/validate-artifact-constitution.sh** — deterministic validator (schema format, generated/runtime path checks, visual `\n`, markdown links) | **GAP** (NOT staged) | none; cav2 `AUTHORITY-MODEL.md` OQ-1 + `STABLE-REPOSITORY-CONSTITUTION.md` OQ-1 both admit "review-mode today, deterministic scan pending" | cav2 is explicitly review-first with NO deterministic validator. This validator is the single highest-value genuine gap: it would let cav2 close OQ-1 (make Markdown-link + schema-format rules deterministic first, exactly as both OQs recommend). |

## GENUINE-GAP list (what cav2 truly lacks)

1. **Metadata-driven constitution selection** (ARTIFACT-METADATA-CONSTITUTION):
   cav2 has no YAML-frontmatter `artifact_type`/`constitution_selectors`/
   `validation_profile` layer; its files use plain prose headers. Adopting it is
   a convention change (decision-gate).
2. **File retention-class taxonomy + `.gitignore` coupling** (ARTIFACT-CONSTITUTION
   4-class model + GITIGNORE-CONSTITUTION): cav2 governs authority-kind separation,
   not source-vs-generated-vs-runtime *file tracking*.
3. **Schema file FORMAT rule** (`.schema.yml`): cav2 defers all schema work and
   has no format constraint.
4. **Typed link-edge vocabulary + `## Connections` table shape** (from
   MARKDOWN-LINKING): cav2 owns cite-or-label + acyclicity (CAV2-C13) but not a
   controlled edge-label set for Markdown relations.
5. **Deterministic validator** (`validate-artifact-constitution.sh`): cav2 is
   review-first; both OQ-1s want deterministic checks — this is the highest-value gap.
6. **Chart rendering hygiene** (no literal `\n`): trivial, low cav2 value.
7. **Sigil/receipt runtime rules** (ANTI-PATTERNS, QUALITY-BAR,
   RECEIPT-ID-LEGEND): weak fit — Arcanum-capability material, not cav2 structural
   authority, unless cav2 gains a runtime.

## ALREADY-OWNED list (do NOT re-promote — build-from-owned)

- **DEVELOPMENT-TO-CANONICAL-PROMOTION** (whole process) — owned by CAV2-C3 +
  CAV2-C11 + AUTHORITY-MODEL Core-Flow/Non-Collapse + promotion-policy + CAV2-D48.
- **ARTIFACT-CONSTITUTION Promotion Boundary Rule** — owned by CAV2-C11/CAV2-C3.
- **MARKDOWN-LINKING intent** (cite-or-label, navigable surface, link check) —
  owned by CAV2-C1 (+ its "Markdown link check" adapter), CAV2-C7, CAV2-C8.
- **Generated-projection traceability** (shared by ARTIFACT + METADATA) — owned by
  CAV2-C6.

## ALREADY-MAPPED list (staged in imports/, not promoted)

Per `imports/constitutions/MANIFEST.md` (2026-06-19, L63-69):
ANTI-PATTERNS, ARTIFACT-CONSTITUTION, ARTIFACT-METADATA-CONSTITUTION,
GITIGNORE-CONSTITUTION, MARKDOWN-LINKING-CONSTITUTION, QUALITY-BAR,
SCHEMA-CONSTITUTION. Plus `CONSTITUTION-IMPORT-PACK.md` names the family as the
"first public-safe rule pattern source" (posture: Public framework).

NOT staged (missed/post-date the scan): DEVELOPMENT-TO-CANONICAL-PROMOTION.md,
RECEIPT-ID-LEGEND-CONSTITUTION.md, tools/validate-artifact-constitution.sh.

## Open Questions

### OQ-1. Refresh the 2026-06-19 manifest before promotion?

Context: the manifest predates DEVELOPMENT-TO-CANONICAL-PROMOTION and
RECEIPT-ID-LEGEND and omits the validator. Recommendation: constitution-governance
re-scans `arcanum/framework/` + `arcanum/tools/` before any extraction pack.
Status: OPEN.
