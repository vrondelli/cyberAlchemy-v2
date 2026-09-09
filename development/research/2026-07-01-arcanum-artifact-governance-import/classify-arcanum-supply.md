# Classify Arcanum Artifact-Governance Supply for cav2 Import

Status: research (candidate evidence, not a promotion)
Date: 2026-07-01
Role: import-classifier (research subagent, generality-first angle)
Corpus: the Arcanum SUPPLY under `arcanum/framework/` + `arcanum/tools/`
Boundary: public->private import is the SAFE direction; this file classifies, it does not promote.

## Method

For each artifact-governance constitution and the validator in the Arcanum supply, I applied one
probe: **is this UNIVERSAL artifact-authoring governance every governed repo needs** (a rule about
what an artifact IS, how it is classified / tagged / validated / promoted / linked) -> **promote-to-cav**;
or is it **Arcanum-SPECIFIC** (selectors like `arcana/**`, `spells/**`, `transmutations/**`,
`.codex/**`, sigil/spell vocabulary, `.arcanum/**` runtime paths) -> **arcanum-specific**. For the
general ones I record the STRIP: the Arcanum-bound selectors/paths that must be replaced with cav2's
own (`cyberAlchemy-v2/**` roots, `authority/`, `authority/constitutions/`, `authority/definitions/`).
claim <= proof; every row cites a read path.

## Classification Table

| Constitution / validator | What it governs | promote-to-cav / arcanum-specific | Strippable Arcanum bindings | Status in Arcanum |
| --- | --- | --- | --- | --- |
| `framework/ARTIFACT-CONSTITUTION.md` | The core artifact-class model: every file is Source / Durable-Evidence / Generated / Local-Runtime with an owner, retention class, validation obligation; plus a promotion-boundary rule and chart/newline rendering rules. | **promote-to-cav** (this is THE universal "what an artifact is" governance) | Source-class selector list is Arcanum-specific: `arcana/**`, `spells/**`, `transmutations/**`, `framework/**`, `disciplines/**`, `registry/**`, `.codex/commands/**`, `tools/**` (L17-24); generated selectors `**/development/runs/**`, `.arcanum/observability/**` (L47-58); local-runtime `.arcanum/codex-home/**`, `.arcanum/runtime/**` (L67-73). Replace source selectors with cav2 authority roots (`authority/**`, `authority/constitutions/**`, `authority/definitions/**`, `ontology/**`, `specs/**`); keep the class MODEL verbatim, it is domain-neutral. | **No explicit status header** — de-facto canonical: it is the file the validator hard-requires to exist (`validate-artifact-constitution.sh` L7,339-341) and other constitutions cite it as authority. |
| `framework/ARTIFACT-METADATA-CONSTITUTION.md` | Metadata-driven (not path-only) constitution selection: `artifact_id`, `artifact_type`, `intent`, `owner`, `lifecycle_status`, `constitution_selectors`, `validation_profile`; encoding rules (YAML frontmatter / `artifact` block); composition precedence. | **promote-to-cav** (universal typed-artifact tagging every governed repo needs; directly answers "how is an artifact classified/tagged/validated") | Example selectors are Arcanum capability names: `xray.visual-library`, `framework.artifact-metadata`, `owner: x-ray` (L69-97, L120-122); validation grep targets `framework arcana/constitution-governance arcana/x-ray` (L155). Replace with cav2 selector namespace (e.g. `cav2.artifact-metadata`, `authority/**` owners); the field SET and precedence ladder carry over unchanged. | **candidate** (explicit `Status: candidate`, L3; validation adapter unbuilt, L110-114). |
| `framework/SCHEMA-CONSTITUTION.md` | Canonical machine-readable schema format: schemas must be `.schema.yml` (not `.json`/`.yaml`/prose-only); prose-boundary + legacy-migration rules. | **promote-to-cav** (universal format rule about what a schema artifact IS; format-neutral to domain) | Example paths only: `arcana/example/templates/*.schema.yml`, `framework/runtime/config.schema.yml` (L40-52). No hard selector binding in the rules themselves — swap example paths to cav2 ones. Lowest-strip candidate. | **canonical** (explicit `Status: canonical`, L3; rules `deterministic` and validator-backed, L32-34). |
| `framework/MARKDOWN-LINKING-CONSTITUTION.md` | Markdown navigability: local-link resolution, source-reference-on-claim, typed relation edges (`cites`/`governs`/`validates`/`supersedes`/...), edge-direction visibility, non-authority notices. | **promote-to-cav** (universal doc-hygiene + relation-typing governance; every governed doc repo needs it) | Cross-refs to `../arcana/inventory/development/LINKING-DISCIPLINE.md` and an Inventory validator task (L145, L252-254); selectors `framework.artifact*`, `framework.markdown-linking` (L11-17). Strip the Inventory source-refs (Arcanum-capability evidence) and re-point selectors to cav2 namespace; the edge vocabulary + shapes are domain-neutral. Warns against `is-a`/`part-of` unless Ontology Vault owns them — cav2 has its own ontology owner, re-point that deferral. | **candidate** (frontmatter `status: candidate`, `authority_level: candidate`, L4,6). |
| `framework/DEVELOPMENT-TO-CANONICAL-PROMOTION.md` | The promotion PROCESS: how candidate/development evidence crosses into canonical source as an owner-gated promotion patch (name source, target, selected claim, omitted material, validation, approval). | **promote-to-cav** (universal promotion discipline; cav2 already has `authority/promotion-policy.md` + a promotion lifecycle, so this is a strong complement/merge target) | Owner-gate step names Arcanum capabilities: `definitions-governance`, `constitution-governance`, `architecture-pattern-inventory`, `sigil-development`, `spellcraft`, `decision-gate` (L62-66); target-resolution names `SKILL.md`, `arcana/<capability>/ARCHITECTURE.md`, `framework/` (L36-42, L92-93); validation cmds `tools/*` (L124-125). Replace owner-gate roster with cav2 owners and target roots; the 9-step process + anti-patterns are domain-neutral. | **active** (`Status: active`, L4; process doc, not a rule table). |
| `framework/RECEIPT-ID-LEGEND-CONSTITUTION.md` | Receipts must gloss tracked ids inline (`ID - meaning`) so a receipt is self-contained; define-on-mint, no-orphan-cite, bulk-legend, scheme-not-owned. | **promote-to-cav, LOWER priority** (general receipt-hygiene, but its id schemes `CTX-`/`BLK-`/`GAP-`/`SWU-`/`dispatch_id` (L18) are Arcanum craft/invoke/dispatch-spec artifacts — governance is universal, the id CATALOG is Arcanum-bound) | Id-scheme list (L18) and owners `craft, invoke/task-session, refine, dispatch-spec` (L23) are Arcanum-specific; discipline cross-ref `../disciplines/cards/receipt-id-legend.md` (L11,60). Strip to cav2's own tracked-id schemes; the gloss-on-cite RULE is universal. | **candidate** (`Status: candidate`, L3; only `gloss-on-cite` is `active`+validator-backed via `tools/validate-receipt-legend.py`, rest `review`, L31-35). |
| `framework/GITIGNORE-CONSTITUTION.md` | `.gitignore` hygiene: ignore generated/local-state/secrets, don't over-exclude source, `already-tracked` needs explicit `git rm --cached`, narrow scope. | **promote-to-cav** (universal repo-hygiene; pairs with the Artifact Constitution class model — every governed repo has a `.gitignore`) | Examples reference `.arcanum/observability/**`, `.claude/worktrees/`, `development/runner-bundles/` (L44-46); discipline cross-ref `../disciplines/cards/gitignore.md` (L11,63). All examples, no hard selector binding in rules — lightest strip. | **candidate** (`Status: candidate`, L3; all 6 rules `review`, no deterministic validator yet, L32-37,57). |
| `tools/validate-artifact-constitution.sh` | The deterministic validator: scans git working tree for un-ignored generated/local-runtime artifacts, tracked runtime state, `.schema.yml` format, schema-markdown boundary, and runs the markdown link checker; has `--self-test` with fixtures. | **promote-to-cav (port, do not copy)** — the validator LOGIC is general but every path predicate is Arcanum-hardcoded | Hardcoded predicates: `is_local_runtime_path` -> `.arcanum/codex-home/*`, `.arcanum/runtime/*`, `tmp/*` (L27-31); `is_generated_path` -> `**/development/runs/*`, `.arcanum/observability/*`, `benchmark/*` (L36-44); required-file checks pin `framework/ARTIFACT-CONSTITUTION.md`, `framework/SCHEMA-CONSTITUTION.md`, etc. (L7-12, 339-361). A cav2 port must re-point every predicate to cav2 roots and re-point the required-file checks to the cav2 constitution paths. | Not a constitution (no status); it is the enforcement surface the canonical/candidate constitutions cite. |

## Companion note: files in the supply that are NOT artifact-governance

`framework/CYBERALCHEMY-METHOD.md`, `QUALITY-BAR.md`, `ANTI-PATTERNS.md`,
`SIGIL-DEVELOPMENT-WORKFLOW.md`, `VALIDATION-EXPERIMENT-PROTOCOL.md`,
`EXPERIMENT-HARNESS-STANDARD.md`, `ARTIFACT-AUTHORING-MEMORY.md` (per `framework/README.md` L9-19)
govern sigil/spell authoring, execution quality, and experiment harnesses — capability-lifecycle
governance, not artifact-IS/classify/tag/validate/promote governance. They are **out of this import's
scope** (Arcanum-specific by nature, not by strippable binding). Flagged for completeness, not proposed.

## Boundary + import-layer note

cav2 already has a candidate import layer that names "Arcanum framework constitutions" as its
"First public-safe rule pattern source" (`authority/constitutions/CONSTITUTION-IMPORT-PACK.md` L20,
Precedence L29-33) and a `authority/promotion-policy.md`. So this import has a landing zone: these
seven promote-to-cav items are the concrete rule-level extraction that pack's "Next Route" (L66-71)
asks for. Any actual promotion is owner-gated (constitution-governance) and out of this research scope.
