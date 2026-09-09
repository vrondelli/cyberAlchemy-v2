---
node_type: decision
is_session: false
status: resolved
boundary: INTERNAL — intended-not-shipped
scope: development decision — cav2-wide YAML frontmatter adoption (gates Tier-2 ARTIFACT-METADATA import)
created: 2026-07-02
decided_by: user via /decision-gate
source_evidence: development/research/2026-07-01-arcanum-artifact-governance-import/findings.md
note: Paths repo-root-relative from domainspec-core/.
---

# Decision — cav2-wide YAML frontmatter adoption

## Question
Should cav2 adopt YAML frontmatter (artifact metadata: `artifact_id`, `artifact_type`, `intent`, `owner`,
`lifecycle_status`, `constitution_selectors`, `validation_profile`) on its authority artifacts — unblocking
Tier-2 `ARTIFACT-METADATA-CONSTITUTION` from prose-only to real enforce-by-type? (Today 0 cav2 authority
files use frontmatter.)

## Options considered
1. Adopt on new/touched only — incremental, lowest cost, legacy untagged until touched.
2. **Adopt cav2-wide (migrate all)** — retrofit frontmatter across ALL cav2 authority artifacts + build the
   `--require-metadata` parser → full enforce-by-type. *(selected)*
3. Defer Tier-2 — keep metadata prose-only, ship Tier-1 form-gates first.

## Selected
**Option 2 — Adopt cav2-wide (migrate all).** The owner chose full completeness: metadata-driven
enforce-by-type becomes real across cav2, not incremental.

## What this scopes (claim ≤ proof — this is the largest build in the thread)
1. **Retrofit** the 7-field artifact metadata block onto **every** governed cav2 authority artifact
   (`authority/**`, `ontology/**`, `specs/**`, constitutions, definitions, decisions, …).
2. **Build `--require-metadata`** in the ported Tier-1 validator (`validate-artifact-metadata.py`), flipping
   it from `--advisory` to build-failing.
3. **Promote** Tier-2 `ARTIFACT-METADATA-CONSTITUTION` from prose-only → enforcement (its rules'
   `constitution_selectors`/`validation_profile` now bind).

## Dependencies + sequencing (load-bearing)
- **Tier-2 depends on Tier-1.** The `--require-metadata` parser attaches to the *ported* validator (Tier-1
  L2/L3) and the metadata constitution lands beside the Tier-1 constitutions. **Do Tier-1 first**, then this.
- Execute the retrofit as a **bounded migration task-session** (or a fan-out over artifact families) — big-bang
  adopt-wide *intent*, staged *execution*, so it doesn't block on one enormous commit.

## Remaining blockers / assumptions
- **No blocker on the decision.** The build is gated on Tier-1 landing + is a real migration cost (owner-accepted).
- **Assumption:** the retrofit can be scripted/assisted (derive `artifact_type`/`owner` from path + node_type),
  with review — a pure-manual retrofit across all of cav2 would be prohibitive; a migration helper is in-scope.
- **Open follow-on:** a `constitution_selectors` vocabulary for cav2 (which selector names map to which cav2
  constitutions) must be defined for the metadata to select rule packs — a definitions/constitution-governance task.

## Gate result: PASS. Next: Tier-1 import pack → then the Tier-2 migration + parser build.
