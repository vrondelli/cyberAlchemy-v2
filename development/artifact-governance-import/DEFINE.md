---
node_type: define
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-07-01
authored_by: invoke (mode=define)
target_artifact: cav2 artifact-governance import pack (Tier-1)
consumes: development/research/2026-07-01-arcanum-artifact-governance-import/findings.md (frozen)
note: Paths repo-root-relative from domainspec-core/.
---

# cav2 Artifact-Governance Import Pack (Tier-1) — DEFINE

## Intent
Port Arcanum's **Tier-1** artifact-governance into cav2 as its **first deterministic file-FORM gate**:
the validator tooling + the `SCHEMA-CONSTITUTION` (.schema.yml format) + the `ARTIFACT-CONSTITUTION`
retention-class taxonomy + `GITIGNORE-CONSTITUTION`. Boundary-safe (public Arcanum → private cav2).

## Contract — what the pack delivers
1. A cav2-rooted **validator** (ported from `arcanum/tools/validate-artifact-constitution.sh` + the two
   helpers) that runs on artifact author/change and blocks file-FORM violations.
2. Two cav2 constitutions in `authority/constitutions/`: a **Schema-Format** constitution (.schema.yml
   shape) and a **Retention-Class** constitution (Source / Durable / Generated / Local-Runtime + `.gitignore`
   coupling).
3. Hook/pre-commit wiring so the validator runs "always" on artifact write — the source of "enforce always".

## Honest scope (claim ≤ proof) — what it is NOT
- **File-FORM gates only** (retention visibility, `.schema.yml` format, markdown-link resolution). It does
  **NOT** enforce cav2's substantive authority rules (CAV2-C1..C15) and does **NOT** close AUTHORITY-MODEL
  OQ-1's kind-enumeration scan. Those stay review-mode.
- **Not** the metadata-by-intent/type layer — that is Tier-2 (`ARTIFACT-METADATA`), which is prose-only
  until cav2 adopts YAML frontmatter (a separate decision-gate).

## Boundary
- Public → private is the safe direction; port (not copy) — every Arcanum path predicate
  (`.arcanum/*`, `benchmark/*`, `arcana/**`, `spells/**`, `.codex/**`) is stripped and re-rooted to cav2
  (`cyberAlchemy-v2/**`, `authority/**`, `development/runs/**`, …).
- Stage via CAV2-C11 import-before-promotion (`authority/imports/`) → extract → promote via
  `promotion-policy` + `decision-gate`.

## Why now (build-from-owned)
This directly answers the earlier "schema for the mint templates?" gap — cav2 gets a `.schema.yml` format
rule + a validator by **importing Arcanum's owned tooling, not building our own**, and it delivers the
deterministic link+schema checks both OQ-1s (AUTHORITY-MODEL, STABLE-REPO) name as wanted-first.

## Next
→ [DESIGN.md](./DESIGN.md) → [PLAN.md](./PLAN.md) → task-session (the port is code, not just docs).
