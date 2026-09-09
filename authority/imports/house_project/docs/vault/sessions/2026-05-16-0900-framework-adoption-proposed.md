---
tags: [vault, ontology, session, cross-repo-rollout, framework-adoption]
node_type: session
is_session: true
layer: ontology
nature: reference
status: active
created: 2026-05-16
timestamp: 2026-05-16T09:00:00-03:00
expires: 2026-07-15
conversation_id: house-project-framework-adoption-proposed-2026-05-16
decisions_made: false
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Snapshot zero + framework visibility, low-risk only. No existing house_project file was modified. Establishes the baseline and the seven proposals so the human reviewer can adopt per-constitution at their own pace."
---

# Framework Adoption — Proposed (house_project)

## What was added tonight

- `docs/vault/snapshots/2026-05-16-v0.json` — snapshot zero of the 519-file vault corpus, content-addressed (sha256 per file + corpus_hash).
- `docs/vault/constitution/framework/` — seven framework constitutions peer-copied from `/domainspec/vault/constitution/`, each marked `status: proposed` (vault-folder-structure preserved as `status: draft`). Each carries a top-of-body NOTE pointing back to the canonical source.
- `docs/vault/onboarding/README.md` — restrained entry point describing what landed and how adoption is meant to proceed (per-constitution, per-rule).

## What was NOT touched

- No file under `docs/vault/` was modified. The 7 pre-existing house_project constitutions, the 2 flat-file discoveries, `ontology-conventions.md`, `graph-edges.md`, all of `conversations/`, all of `axiom/`, `premise/`, `conceptual/`, `domain/`, `dictionary-*.md`, and both navigation files are untouched.
- No file under `docs/features/` was modified. The 213-file features corpus is untouched.
- No `verification:` field was added to any existing lens file.
- No folder was renamed or restructured. No frontmatter migration was performed.

## Open questions for the human reviewer

1. Which of the seven framework constitutions to adopt, and in what order? (Lens recommends `frontmatter-ownership` and `schema-amendment-discipline` first — least conflict.)
2. For each adopted constitution: as-is, or with house_project-specific modifications (recorded where)?
3. `edge-acyclicity` requires migrating prose Connections-tables + `graph-edges.md` into typed frontmatter `edges:` — accept this prerequisite, defer it, or reject the constitution?
4. Do framework constitutions, once adopted, replace or coexist with the existing house_project constitutions (`folder-structure`, `commit-message`, etc.)?
5. Should `conversations/` be left as a legacy basin while new artifacts flow into `sessions/`, per the lens recommendation?
