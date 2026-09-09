# Boundary / Duplication Verdict — Arcanum Artifact-Governance Import

Status: research finding (candidate) — SKEPTIC boundary/duplication gate
Owner: verify-boundary subagent (Wittgenstein — boundary/duplication angle)
Date: 2026-07-01
Role: OVER-IMPORT guard. Corpus = cav2 authority (verify already-owned cites) + Arcanum supply (verify strippable bindings).
Verdict rule: lean SKIP; only a clean-of-duplication candidate KEEPs; anything Arcanum-bound but genuine = IMPORT-WITH-STRIP. claim <= proof; every cite read.

## Gate summary

I verified every ALREADY-OWNED cite the coverage classifier made against the actual
cav2 files. **All already-owned cites hold.** The parent's merged list is mostly
sound, but it under-states duplication in two places:

- **#7 DEVELOPMENT-TO-CANONICAL-PROMOTION is fully duplicated** — DEMOTE to SKIP.
  The coverage classifier already flagged it OWNED; Bertalanffy's "promote" is a
  generality argument, not a gap. cav2 owns the whole 9-step process.
- **#2's Promotion-Boundary-Rule part is duplicated** (parent already conceded this)
  — the candidate survives only on its retention-class taxonomy; the promotion half
  must be stripped, not imported.

No public/private misfit found in either direction: every candidate is public Arcanum
framework text, and none carries cav2-private content that promotion would leak toward
Arcanum. The real boundary risk is **Arcanum-path hard-binding** (selectors + validator
predicates), not confidentiality — hence IMPORT-WITH-STRIP dominates over KEEP.

## Per-candidate verdict

| # | Candidate | Duplicates cav2 (cite)? | Boundary OK? | Arcanum-specific binding? | Verdict | One-line reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Deterministic VALIDATOR (`validate-artifact-constitution.sh`) | No — cav2 has NO deterministic validator; both OQ-1s admit review-only (AUTHORITY-MODEL OQ-1 L155-159; STABLE OQ-1 L436-440) | OK (public tool) | YES, heavy: `is_local_runtime_path`→`.arcanum/codex-home/*`,`.arcanum/runtime/*`,`tmp/*` (L28); `is_generated_path`→`*/development/runs/*`,`.arcanum/observability/*`,`benchmark/*` (L37-42); required-file pins `framework/ARTIFACT-CONSTITUTION.md`/`SCHEMA-CONSTITUTION.md` (L7-11) | **IMPORT-WITH-STRIP** | Genuine gap, closes cav2 OQ-1, but every path predicate + required-file check is Arcanum-hardcoded → port, re-point to `cyberAlchemy-v2/**` roots. |
| 2 | ARTIFACT-CONSTITUTION retention-class taxonomy (Source/Durable/Generated/Local-Runtime) + `.gitignore` coupling | Retention-class: No (cav2 governs authority-KIND not file-RETENTION — AUTHORITY-MODEL "Authority Kinds" L48-61). **Promotion-Boundary part: YES** — `artifact.promotion.development-to-canonical` (ARTIFACT-CONST L95) is owned by CAV2-C11 (STABLE L177-204) + CAV2-C3 (L52-66) | OK (public) | YES: Source selectors `arcana/**`,`spells/**`,`transmutations/**`,`framework/**`,`disciplines/**`,`registry/**`,`.codex/commands/**`,`tools/**` (L17-24); generated `.arcanum/observability/**` (L50-56); runtime `.arcanum/codex-home/**` (L67-69) | **IMPORT-WITH-STRIP** | Retention-class MODEL is domain-neutral and genuine; but STRIP the Arcanum source-selector list (→ cav2 authority roots) AND drop the Promotion-Boundary sub-rule (already CAV2-C11/C3). |
| 3 | GITIGNORE-CONSTITUTION (file-tracking classes) | No — cav2 authority has no `.gitignore`/tracked-tree rule; adjacent CAV2-C6 (STABLE L101-114) only touches generated projections | OK (public) | Light: examples only — `.arcanum/observability/**`,`.claude/worktrees/`,`development/runner-bundles/`; discipline xref `../disciplines/cards/gitignore.md` | **IMPORT-WITH-STRIP** | Genuine gap, lightest strip (examples + discipline xref); rules themselves domain-neutral. Low cav2 value while cav2 is doc-only — flag for owner. |
| 4 | ARTIFACT-METADATA-CONSTITUTION (YAML frontmatter + `constitution_selectors` + `validation_profile`) | No — cav2 files use prose headers (`Status:`/`Owner:`/`Selectors:`), no typed frontmatter machinery (verified: STABLE L1-6 is plain-header) | OK (public) but adoption = convention change | YES: example selectors `xray.visual-library`,`framework.artifact-metadata`,`owner: x-ray`; validation greps `framework arcana/constitution-governance arcana/x-ray` | **IMPORT-WITH-STRIP** | Genuine metadata-selection gap, but `status: candidate` in Arcanum AND needs a cav2 frontmatter decision-gate first. STRIP Arcanum capability-name selectors → cav2 namespace. |
| 5 | SCHEMA-CONSTITUTION (`.schema.yml` format rule) | No — cav2 defers all schema work (PACKAGE-MODEL "out of scope"; AUTHORITY-MODEL "Schema/edge change → schema governance") | OK (public) | Minimal: example paths only (`arcana/example/templates/*.schema.yml`); no selector binding in the rules | **IMPORT-WITH-STRIP** | Genuine format gap, `Status: canonical` + validator-backed in Arcanum, lowest-strip (swap example paths). Complementary to cav2's "when" governance. |
| 6 | MARKDOWN-LINKING typed-edge vocabulary + `## Connections` table | Link-hygiene INTENT: YES — cite-or-label owned by CAV2-C1 (STABLE L16-32, adapter "Markdown link check" L406) + navigable surface CAV2-C7 (L116-129) + residue CAV2-C8; edge-acyclicity by CAV2-C13 (L247-281). **Typed-edge LABEL vocab + Connections shape: No** (CAV2-C13 governs acyclicity, not a label set) | OK (public) | Light: Inventory xref `../arcana/inventory/development/LINKING-DISCIPLINE.md` (L145); defers `is-a`/`part-of` to Ontology Vault (L110-111) | **IMPORT-WITH-STRIP** | Import ONLY the residual gap = the controlled edge vocab (`cites`/`governs`/`validates`/`supersedes`/`depends-on`/`blocks`, L98-105) + `## Connections` table shape. DROP the link-hygiene rules (owned by C1/C7/C8); STRIP Inventory xref, re-point Ontology deferral to cav2 ontology owner. |
| 7 | DEVELOPMENT-TO-CANONICAL-PROMOTION (9-step process) | **YES — fully.** CAV2-C3 (STABLE L52-66) + CAV2-C11 (L177-204); AUTHORITY-MODEL Core-Flow (L31-46) + Non-Collapse #1/#5/#6 (L124-132) + Narrowest-Owner (L90-103); promotion-policy Ladder + Required Gates; **CAV2-D48** authority-promotion-lifecycle (DEFINITIONS L3184-3230, explicitly the parent promotion-policy instantiates) | OK | Owner-gate roster names Arcanum capabilities (`definitions-governance`,`sigil-development`,`spellcraft`) | **DEMOTE — SKIP (already-owned)** | Single most-owned family; cav2's entire authority-by-owner-route model IS this process restated. Re-importing violates CAV2-C17 precedent-sweep (build-from-owned, not net-new). Bertalanffy's generality claim ≠ a gap. |
| 8 | RECEIPT-ID-LEGEND-CONSTITUTION | No cav2 duplication, but no cav2 SURFACE either — cav2 has no receipt/sigil/`dispatch_id` surface | OK (public) but MISFIT | YES, hard: id schemes `CTX-`/`BLK-`/`GAP-`/`SWU-`/`dispatch_id` (L18), owners `craft, invoke/task-session, refine, dispatch-spec` (L23) — all Arcanum-runtime | **DEMOTE — SKIP (out-of-scope, not already-owned)** | Not a duplicate; it is Arcanum-runtime-specific with no cav2 landing surface. The gloss-on-cite rule is universal but has nothing to bind to in cav2 today. Defer until/unless cav2 gains a runtime. |

## DEMOTE-to-SKIP list

- **#7 DEVELOPMENT-TO-CANONICAL-PROMOTION** — SKIP **(already-owned)**. Owned by
  CAV2-C3 + CAV2-C11 + AUTHORITY-MODEL Core-Flow/Non-Collapse/Narrowest-Owner +
  promotion-policy + **CAV2-D48**. Re-importing would re-promote an owned principle
  (violates CAV2-C17 build-from-owned).
- **#8 RECEIPT-ID-LEGEND-CONSTITUTION** — SKIP **(out-of-scope, weak-fit)**. Not a
  duplicate but no cav2 receipt/runtime surface to bind to; Arcanum-runtime id
  catalog (`dispatch_id`/`SWU-`/`CTX-`). Defer, do not import.

## IMPORT-WITH-STRIP list (naming the Arcanum binding to strip)

- **#1 Validator** — STRIP: `is_local_runtime_path` predicate (`.arcanum/codex-home/*`,
  `.arcanum/runtime/*`, `tmp/*`), `is_generated_path` predicate (`*/development/runs/*`,
  `.arcanum/observability/*`, `benchmark/*`), and required-file pins
  (`framework/ARTIFACT-CONSTITUTION.md`, `framework/SCHEMA-CONSTITUTION.md`). Re-point
  all to `cyberAlchemy-v2/**` + cav2 constitution paths. Port, do not copy.
- **#2 ARTIFACT-CONSTITUTION retention-class** — STRIP: Arcanum source-selector list
  (`arcana/**`,`spells/**`,`transmutations/**`,`framework/**`,`disciplines/**`,
  `registry/**`,`.codex/commands/**`,`tools/**`) + generated/runtime `.arcanum/**`
  selectors → cav2 authority roots. ALSO DROP the `artifact.promotion.development-to-canonical`
  Promotion-Boundary sub-rule (owned by CAV2-C11/C3).
- **#3 GITIGNORE-CONSTITUTION** — STRIP: example paths (`.arcanum/observability/**`,
  `.claude/worktrees/`, `development/runner-bundles/`) + discipline xref
  `../disciplines/cards/gitignore.md`. Lightest strip.
- **#4 ARTIFACT-METADATA-CONSTITUTION** — STRIP: Arcanum capability-name example
  selectors (`xray.visual-library`, `framework.artifact-metadata`, `owner: x-ray`) +
  validation grep targets → cav2 namespace. Gate on a cav2 frontmatter decision-gate
  (Arcanum status is `candidate`).
- **#5 SCHEMA-CONSTITUTION** — STRIP: example paths only (`arcana/example/templates/*.schema.yml`,
  `framework/runtime/config.schema.yml`). Lowest-strip; rules carry unchanged.
- **#6 MARKDOWN-LINKING** — STRIP: link-hygiene rules already owned (C1/C7/C8) — import
  ONLY the residual = typed-edge label vocabulary (`cites`/`governs`/`validates`/
  `supersedes`/`depends-on`/`blocks`) + `## Connections` table shape. Also strip
  Inventory xref (`../arcana/inventory/development/LINKING-DISCIPLINE.md`) and re-point
  the Ontology-Vault `is-a`/`part-of` deferral to cav2's ontology owner.

## Open Questions

### OQ-1. Does #6 collapse to zero after stripping owned hygiene?

Context: once C1/C7/C8-owned link-hygiene is removed, #6 imports only ~6 edge labels +
one table shape. Recommendation: constitution-governance decides whether that residual
is a constitution rule or a definitions/ontology edge-vocabulary entry (may route to
definitions-governance instead of a new constitution). Status: OPEN.
