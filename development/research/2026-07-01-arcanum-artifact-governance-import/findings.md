---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-07-01
authored_by: domainspec-subagents-strategy (research dispatch 2026-07-01-arcanum-artifact-governance-import)
final_approver: parent
note: Paths repo-root-relative from domainspec-core/. Freezes the Arcanum→cav2 artifact-governance import plan.
---

# Arcanum artifact-governance → cav2 import (FROZEN findings)

**Question.** Which Arcanum framework artifact-governance constitutions + validator should be imported and
promoted to cav2 authority (enforcing on every artifact author/change), which are already-owned/mapped, and
does the enforcement actually exist?

**Dispatch.** research, 4 agents / 2 tensioned groups, check-tension PASS (first pass).
Returns: [research.md](./research.md). Classifiers: [classify-arcanum-supply.md](./classify-arcanum-supply.md)
(Bertalanffy) · [classify-cav2-coverage.md](./classify-cav2-coverage.md) (Beer). Verifiers:
[verify-boundary.md](./verify-boundary.md) (Wittgenstein) · [verify-enforcement.md](./verify-enforcement.md) (Hume).

## Headline (claim ≤ proof)
Your instinct is right on both counts: **the validator exists** and **the import is already partly mapped**
(cav2's `authority/constitutions/CONSTITUTION-IMPORT-PACK.md` names Arcanum framework constitutions as its
"first public-safe rule pattern source"; `imports/constitutions/MANIFEST.md` already stages 6 — but **zero
extracted**). The correction the tension surfaced: **"enforce always" is only partly real.** The validator
enforces **file-FORM via path heuristics** (retention visibility, `.schema.yml` format, markdown-link
resolution); its **metadata parser is advisory-only** (`--advisory`, no `--require-metadata`) — it cannot
fail a build even in Arcanum, and **0 cav2 files use YAML frontmatter**. So the honest win is **cav2's first
deterministic file-FORM gates**, NOT "validator-enforced authority" — and it does **not** close AUTHORITY-MODEL
OQ-1's kind-enumeration scan.

## Empirical validator fact
`arcanum/tools/validate-artifact-constitution.sh` (425 lines, `--self-test` exit 0) composes
`validate-artifact-metadata.py` (436 lines) + `check_markdown_links.sh`. Enforces **today**: gitignore-
visibility of generated/runtime paths, `.schema.yml` format, schema/markdown boundary, chart `\n` hygiene,
markdown-link resolution. **Path/filename heuristics** — not metadata-driven, not authority-rule-aware.
Port, don't copy (every predicate hardcoded to Arcanum roots: `.arcanum/*`, `benchmark/*`, `framework/*`).

## FROZEN import plan

### TIER 1 — IMPORT NOW · real deterministic enforcement (the actual net-new)
Port these to cav2 roots; they give cav2 its **first deterministic file-FORM gates** — exactly what both
OQ-1s (AUTHORITY-MODEL, STABLE-REPO) name as wanted-first, and a real target for the mint baseline's D21
schema facet.
- **The validator** (`validate-artifact-constitution.sh` + the two helpers) — strip `.arcanum/*`/`tmp/*`/
  `benchmark/*` path predicates + required-file pins → cav2 roots (`cyberAlchemy-v2/**`, `authority/**`).
- **SCHEMA-CONSTITUTION** (`.schema.yml` format rule) — lowest strip (example paths only); canonical +
  deterministic. Closes cav2's zero-schema gap (0 `.schema.*` files today, despite mint D21 mandating a schema facet).
- **ARTIFACT-CONSTITUTION retention-class taxonomy** (Source / Durable / Generated / Local-Runtime) **+
  GITIGNORE-CONSTITUTION** — the retention/visibility gate the validator enforces. **Strip** the source-
  selector list (`arcana/**`,`spells/**`,`.codex/**`) → cav2 roots, and **DROP the promotion sub-rule**
  (already-owned by CAV2-C11/C3).

### TIER 2 — IMPORT AS PROSE-ONLY · no enforcement yet (adopt-first / route-out)
- **ARTIFACT-METADATA-CONSTITUTION** (YAML frontmatter + `constitution_selectors` + `validation_profile`)
  — the "enforce always by artifact intent/type" vision, but **advisory-vaporware** (parser exists, never
  fails a build; 0 cav2 files use frontmatter). Needs a **cav2 decision-gate to ADOPT frontmatter** before
  it is enforcement, not prose. Biggest "looks-like-enforcement-but-isn't."
- **MARKDOWN-LINKING typed-edge vocabulary + `## Connections`** (the residual after hygiene is dropped) —
  prose-only ("future edge adapter"); **route to ontology / definitions-governance**, likely an edge-vocab
  entry, NOT a new constitution (Wittgenstein's open-Q).

### SKIP — already-owned / out-of-scope (build-from-owned, CAV2-C17)
- **DEVELOPMENT-TO-CANONICAL-PROMOTION** — cav2 already owns the whole 9-step semantics (CAV2-C3 + C11 +
  AUTHORITY-MODEL Core-Flow/Non-Collapse + promotion-policy + CAV2-D48). Re-importing violates CAV2-C17.
- **MARKDOWN-LINKING hygiene** (cite-or-label, link-check) — owned (CAV2-C1 adapter *is* "Markdown link
  check", C7, C8).
- **ARTIFACT-CONSTITUTION promotion-boundary rule** — owned (CAV2-C11/C3).
- **RECEIPT-ID-LEGEND** — no cav2 receipt/runtime surface to bind to (Arcanum capability).
- **7 capability-lifecycle docs** (CYBERALCHEMY-METHOD, QUALITY-BAR, ANTI-PATTERNS, SIGIL-DEVELOPMENT-
  WORKFLOW, VALIDATION-EXPERIMENT-PROTOCOL, EXPERIMENT-HARNESS-STANDARD, ARTIFACT-AUTHORING-MEMORY) —
  capability governance, not artifact-IS governance.

## Mapping status (answers "is it already mapped?")
YES, path-level: `imports/constitutions/MANIFEST.md` (scan **2026-06-19, stale**) stages 6 candidates;
`CONSTITUTION-IMPORT-PACK.md` is the landing zone. But **zero extracted into a cav2 local rule**, and 3
(DEV-TO-CANONICAL, RECEIPT-ID, the validator) are **not staged at all**. **Re-scan needed** before extraction
(constitution-governance).

## Import path (public Arcanum → private cav2 — safe direction)
Per CAV2-C11 import-before-promotion: stage in `authority/imports/` → extract the rule (strip Arcanum
bindings) → promote via `promotion-policy` + `decision-gate` → land as a cav2 constitution (or, for the
edge-vocab, an ontology/definitions entry). No confidentiality risk (all candidates are public framework
text; promotion pulls no cav2-private content toward Arcanum — Wittgenstein verified).

## Recommended next
- **`invoke define→design→plan`** for a **Tier-1 import pack**: port the validator + SCHEMA + retention/
  gitignore to cav2 roots, wired as cav2's first deterministic file-form gate. This is the concrete "make
  it cav / enforce (form) always" win, and it directly hardens the mint baseline's D21 schema facet.
- A **decision-gate** on adopting YAML frontmatter in cav2 (gates Tier-2 ARTIFACT-METADATA from prose to enforcement).
- **constitution-governance** re-scan of `imports/MANIFEST.md` + route the edge-vocab (Tier-2) to ontology.

## Residue
- The validator port is the only Tier-1 item that is *code* (bash+python), not a doc — its cav2 landing +
  hook wiring is a task-session, not a constitution promotion.
- "Enforce always" in the metadata sense (by artifact intent/type) is NOT achieved by this import — it needs
  a real `--require-metadata` parser + cav2 frontmatter adoption. Recorded honestly, not overclaimed.
