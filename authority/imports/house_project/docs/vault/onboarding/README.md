---
tags: [vault, onboarding]
node_type: reference
is_session: false
layer: ontology
nature: reference
status: active
version: 0.1.0
last_updated: 2026-05-16
---

# Onboarding — house_project vault

This folder is the entry point for agents and humans approaching the house_project vault under the new cross-repo discipline.

## What happened on 2026-05-16

A framework discipline (frontmatter ownership, discovery shape, edge acyclicity, schema amendment, governs/runtime witness, vault folder structure, convicção bet ledger) was developed in `/domainspec` during this session. The house_project vault already carries most of the *vocabulary* (`node_type`, `convicção`, `veracidade`, etc.) but not yet the *shape and process*.

## What was added (additive, no edits to existing files)

- **`constitution/framework/`** — seven framework constitutions peer-copied from `/domainspec/vault/constitution/`. All are `status: proposed` (except `vault-folder-structure-constitution.md`, preserved as `status: draft` per its upstream state). Canonical source remains `/domainspec`; these copies are visibility, not adoption.
- **`snapshots/2026-05-16-v0.json`** — snapshot zero of the entire `docs/vault/**/*.md` corpus (519 files), content-addressed. This is the empirical baseline against which any future migration is measured.

## Adoption model

Adoption is **per-constitution and per-rule**, not all-or-nothing. Each framework constitution can be:
- adopted as-is,
- adopted with modifications recorded in `amendments/` (not yet created),
- declined with rationale,
- or deferred pending a prerequisite (e.g. edge-acyclicity depends on migrating prose-table edges into frontmatter).

No existing file in `docs/vault/` or `docs/features/` was modified to land these proposals.

## Canonical references

- Cross-repo discovery: `/Users/victorboscaro/domainspec/vault/discovery/graph-as-residue-attractor/README.md`
- Investigation lens for this rollout: `/Users/victorboscaro/domainspec/vault/discovery/cross-repo-rollout/lenses/01-house-project-investigation.md`
- House_project schema source-of-truth: `../ontology-conventions.md`
