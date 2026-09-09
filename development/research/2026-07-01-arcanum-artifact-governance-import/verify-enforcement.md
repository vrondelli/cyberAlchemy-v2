# Enforcement-Reality / Need Verification — Arcanum Artifact-Governance Import

Status: research finding (skeptic gate)
Owner: enforcement-reality skeptic subagent (Hume angle)
Date: 2026-07-01
Gate: ENFORCEMENT-REALITY / NEED. Guards against UNDER-import AND enforcement VAPORWARE.
Verdict rule: claim <= proof; every enforcement claim cites the line that enforces it.

## (a) The Empirical Validator Fact

**Exists? YES. Runs? YES — both self-tests pass empirically (exit 0).**

- `arcanum/tools/validate-artifact-constitution.sh` — real, 425 lines (`wc -l` = 425, not
  the reported 12.1K/"425-line" — 425 lines confirmed), executable (mode 755). Ran
  `--self-test` (dispatch line 334-337): prints "chart line-break fixtures: pass / schema
  format fixtures: pass / schema markdown boundary fixtures: pass / markdown link fixtures:
  pass", exit 0.
- It composes two more real, self-testing tools:
  - `arcanum/tools/validate-artifact-metadata.py` — 436 lines, `--self-test` exit 0.
  - `arcanum/tools/check_markdown_links.sh` — 2.3K, exit 0 on the linking constitution.

### WHAT it actually enforces TODAY — the path-heuristic vs metadata-parser split

**BLOCKING (path/filename heuristics, `add_failure` → exit 1):**

| Check | Enforced by | Cite |
| --- | --- | --- |
| Generated/local-runtime artifacts must be gitignored (untracked new paths) | `is_generated_path`/`is_local_runtime_path` case-globs → `validate_path_visibility` | script L34-45, L25-32, L147-167 |
| Tracked local-runtime state must be removed from index | glob match on tracked files | L378-382 |
| New schema artifact must be `.schema.yml` (not `.json`/`.yaml`) | `is_schema_artifact_path` suffix match → `validate_schema_format` | L67-74, L169-182 |
| New schema Markdown must be non-canonical or paired `.schema.yml` | `is_schema_markdown_path` (path=`*/templates/*schema*.md`) → boundary | L76-112, L184-205 |
| Chart/visual artifacts: no literal `\n` in label/title/etc. | `is_visual_artifact_path` (filename globs `*chart*`, `*.svg`…) | L55-65, L114-145 |
| Local Markdown links in the linking constitution resolve | delegates to `check_markdown_links.sh` | L207-213 |

Every one of these keys off **path, filename, and extension** — exactly the constitution's
own admission: *"Current limitation: validation still relies heavily on path and filename
heuristics"* (`arcanum/framework/ARTIFACT-CONSTITUTION.md` L157-160).

**NON-BLOCKING / ADVISORY (the metadata parser — real code, but wired to never fail):**

The metadata parser is NOT the vaporware the constitution prose implies; `validate-artifact-metadata.py`
genuinely parses Markdown frontmatter (L133-140), YAML `artifact:` blocks (L147-161), JSON
`artifact` objects (L164-170), script comment blocks (L173-183), and validates 7 required
fields + status enum + list-typing + companion-boundary (L227-268). BUT it is neutered at the
call site in two ways:

1. The shell validator invokes it with **`--advisory`** (script L392), which downgrades ALL
   errors to warnings (py L417-419).
2. It runs **without `--require-metadata`**, so `require_missing=False` → **missing metadata
   is not even flagged** (py L233-236). And the shell only ever `add_warning`s the output,
   never `add_failure` (script L396-400).

So: metadata-driven constitution selection (`constitution_selectors`, `validation_profile`)
**cannot fail a build even in Arcanum today.** This matches `ARTIFACT-METADATA-CONSTITUTION.md`
Status: candidate (L3) and its rules table where every rule is `candidate` with Validator =
`future metadata parser` / `future ... profile` (L110-114). The parser exists; **the enforcement
does not** — it is deliberately advisory pending the promotion-boundary gates (L168-176).

**Net split:** retention-class visibility + schema-format + chart-render + link-resolution =
REAL path-heuristic enforcement today. Metadata-driven selection = parser exists, wired
advisory-only, NOT enforcement.

## (b) Per-Candidate: need-witness + enforcement verdict

| # | Candidate | Need-witness (cav2 artifact that drifts unenforced today) | Verdict |
| --- | --- | --- | --- |
| 1 | **Deterministic VALIDATOR** (`validate-artifact-constitution.sh`) ported to cav2 roots | cav2 `AUTHORITY-MODEL.md` OQ-1 (L155-159, "review-mode today; deterministic scan pending") + `STABLE-REPOSITORY-CONSTITUTION.md` OQ-1 (L436-440, "start with Markdown link checks and source-map field checks"). Today cav2 has ZERO deterministic validators; every CAV2-C rule is `review`/`hybrid`. | **IMPORT-WITH-REAL-ENFORCEMENT** — but ONLY the path-heuristic subset (schema-format + gitignore-visibility + markdown-link + chart-render). Porting it closes OQ-1's *link + schema* recommendation exactly. The metadata half ports as advisory. Honest scope: it does NOT make CAV2-C1…C15 deterministic; it enforces file-form, not authority-kind semantics. |
| 2 | **ARTIFACT-CONSTITUTION** retention-class taxonomy + `.gitignore` | cav2 has no source/generated/runtime *file* taxonomy (coverage classifier GAP #2). Witness: cav2 governs authority-*kind* separation (CAV2-C2/C6), not file retention; a generated projection under `ontology/projections/` has no cav2 rule forcing it ignored-unless-promoted. | **IMPORT-WITH-REAL-ENFORCEMENT** — the ported `validate_path_visibility` + `is_generated_path`/`is_local_runtime_path` globs (script L34-45, L147-167) enforce this deterministically the moment cav2 paths are added to the globs. Real today. (Promotion-boundary *intent* is already OWNED by CAV2-C11/C3 — do not re-promote that half.) |
| 3 | **GITIGNORE-CONSTITUTION** | Same retention gap; cav2 authority owns no `.gitignore`/tracked-tree rule (classifier GAP #2, low value while cav2 is doc-only). | **IMPORT-AS-CANDIDATE-PROSE-ONLY** — the Arcanum constitution itself is Status: candidate with **every rule Validator = "none yet"** (`GITIGNORE-CONSTITUTION.md` L32-37, L55-59). No ignore-policy validator exists even in Arcanum. Importing it is governance prose, not enforcement. (The *visibility* half is already covered by validator #1/#2's ignore checks.) |
| 4 | **ARTIFACT-METADATA-CONSTITUTION** (frontmatter + selectors + `validation_profile`) | Strong witness: **0 of cav2's authority `.md` files use `---` YAML frontmatter** (grep: only imported `imports/house_project/**` does). A cav2 constitution authored today declares its selectors as *prose* (`Selectors: cyberAlchemy-v2/**`), which no parser can map to a validation profile. | **IMPORT-AS-CANDIDATE-PROSE-ONLY** — the parser exists but is advisory-only even in Arcanum (§a), AND cav2 has zero frontmatter for it to parse. Adopting it is a *convention change* requiring a decision-gate (whether cav2 files gain frontmatter) before any parser can bind. Not enforcement today. |
| 5 | **SCHEMA-CONSTITUTION** (`.schema.yml` format rule) | Sharp witness: the **mint universal-baseline seeds D21 "four-facet action method" binding "classification/schema/human-view/machine-view" for every governed action** (`development/mint/development/2026-07-01-universal-baseline-PLAN.md` L43; `classify-coupling.md` L62) — yet `find cyberAlchemy-v2 -name '*.schema.*'` returns EMPTY. A D21-mandated schema facet with no schema file and no format rule = drift with no enforcement. | **IMPORT-WITH-REAL-ENFORCEMENT** — Arcanum `SCHEMA-CONSTITUTION.md` is Status: **canonical** (L2) with all three rules `deterministic` via the validator (L32-34); `validate_schema_format`/`validate_schema_markdown_boundary` (script L169-205) fail-on-`.json`/`.yaml` today. Ports as a working gate the instant cav2 schema files exist. |
| 6 | **MARKDOWN-LINKING** typed-edge vocabulary + `## Connections` | cav2 owns cite-or-label + navigable surface + "Markdown link check" as its named first deterministic rule (CAV2-C1 adapter L406; C7, C8). GAP = the controlled edge-label set (`cites`/`governs`/`supersedes`…) + `## Connections` table; CAV2-C13 governs edge *acyclicity* not a *label vocabulary* (classifier GAP #4). | **SPLIT.** The **link-resolution rule** (`markdown.linking.local-links-resolve`) is the ONE `deterministic` rule (`MARKDOWN-LINKING-CONSTITUTION.md` L6, Validator `check_markdown_links.sh`) → **IMPORT-WITH-REAL-ENFORCEMENT** (and it is precisely STABLE-REPO OQ-1's recommended first check). The **typed-edge vocabulary** rules are all `review`/`future edge adapter` (L9-11) → **IMPORT-AS-CANDIDATE-PROSE-ONLY** (vaporware even in Arcanum). |
| 7 | **DEVELOPMENT-TO-CANONICAL-PROMOTION** | No genuine gap — coverage classifier's single most-owned family. | **NOT-NEEDED** — already OWNED by CAV2-C3 + CAV2-C11 + `AUTHORITY-MODEL.md` Core-Flow/Non-Collapse + `promotion-policy.md` + CAV2-D48. Its Validation mode is `hybrid`/review even in Arcanum (Status: active, Owner: artifact-constitution + definitions-governance) — no deterministic gate to port. Re-importing violates the precedent-sweep/build-from-owned rule (CAV2-C17). Beer is right. |
| 8 | **RECEIPT-ID-LEGEND** | cav2 has no receipt/sigil/`dispatch_id` surface (classifier GAP: out-of-scope unless cav2 gains a runtime). | **NOT-NEEDED** for cav2 authority now. (For completeness: even in Arcanum only its `gloss-on-cite` rule is deterministic via `validate-receipt-legend.py`, 3.5K, which exists; the other 4 rules are `review`/"none yet" — `RECEIPT-ID-LEGEND-CONSTITUTION.md` L31-35, L54. So it is mostly prose-only there too — but the need-witness for cav2 is absent regardless.) |

## Summary of verdicts

- **IMPORT-WITH-REAL-ENFORCEMENT (path-heuristic, enforces today):** #1 (validator, path-subset
  only), #2 (retention visibility), #5 (schema-format, canonical+deterministic), #6a
  (markdown link-resolution).
- **IMPORT-AS-CANDIDATE-PROSE-ONLY (parser/validator absent even in Arcanum — NOT enforcement):**
  #3 (gitignore, all rules "none yet"), #4 (metadata, advisory-only + no cav2 frontmatter to
  parse), #6b (typed-edge vocabulary, "future edge adapter").
- **NOT-NEEDED (already owned / no cav2 witness):** #7 (development-to-canonical, owned by
  CAV2-C3/C11/D48), #8 (receipt-id, no cav2 receipt surface).

## Guard against enforcement VAPORWARE (the trap this gate exists to block)

The seductive overclaim is "import the validator → cav2 rules become enforced." FALSE. The
validator enforces **file-form** (extension, path-class, chart syntax, link resolution). It
does **not** enforce cav2's substantive authority rules (CAV2-C1…C15: source-ledgering,
layer-separation, public/private scrub, kind-enumeration closure) — those stay review/hybrid,
and AUTHORITY-MODEL OQ-1 (L68, kind-enumeration scan pending) is NOT closed by this import.
Claim <= proof: the honest win is "cav2 gets its FIRST deterministic file-form gates (link +
schema + retention), closing the *specific* first-check both OQ-1s recommend" — not "cav2
becomes validator-enforced."

## Open Questions

### OQ-1. Does the ported validator get `--require-metadata` turned ON for cav2?

Context: Arcanum runs metadata advisory-only. If cav2 adopts frontmatter (candidate #4) it
could flip `--require-metadata` to make selectors blocking — but only after the decision-gate
on cav2 frontmatter convention. Status: OPEN; do not assume the port inherits Arcanum's
advisory posture as permanent.
