---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template (Universal Governance Baseline, SWU-B3, D15 SPLIT); intended-not-shipped
created: 2026-07-01
authored_by: sigil-development (--update, universal-baseline L1 build)
swu: SWU-B3 (project-space role declaration)
source_artifact: cyberAlchemy-v2/authority/definitions/DEFINITIONS.md CAV2-D15 (FORM only; cav2's folder list NOT copied)
emits_to: <TARGET_REPO>/authority/PROJECT-SPACE-ROLES.md
partition: development/research/2026-07-01-universal-baseline-partition/findings.md (bucket B, SPLIT)
guardrail: >
  Seed the role-declaration FORMAT (each folder declares its authority role) so no folder becomes canon by
  proximity. LOCALIZE the rows: the domain lists ITS OWN folders, never cav2's. D42 (governed-artifact-tree)
  is DEFERRED - build decides whether its thin interface checklist folds in here or earns its own file.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). D15 project-space, SPLIT: inherit the role-declaration FORMAT,
  localize the folder rows. Emitted empty-but-live; the domain fills one row per folder. Zero cav2 folder names.
-->

# <DOMAIN> Project-Space Roles

Status: **PROPOSED** — pending owner ratification (mint ratify-CLOSE)
Owner: <DOMAIN> owner
Provenance: CAV2-D15 (project space)

Every folder in this repo declares its **authority role** here, so nothing becomes canonical by proximity
(e.g. `research/` does not become policy just by sitting next to `authority/`).

| Folder | Authority role | May hold | May NOT become without a decision |
| --- | --- | --- | --- |
| `authority/` | authority surface | kinds, constitutions, decisions, source-spine | — |
| `<DOMAIN folder>` | <role — source-space / project-space / staging / evidence> | <what it holds> | <what it must not become> |
| <the domain adds one row per folder — ITS OWN folders, never cav2's> | ... | ... | ... |

<!-- Seed self-check: this file lists the DOMAIN's folders only; grep for cav2's own folder names
     (inventory/ontology/architecture/specs/validation/ops/.craft) → zero. D42 fold-decision: TODO(build). -->
