# Artifact Tree Admission

Status: candidate
Steward: CyberAlchemy v2 authority owner (discipline-governance route)
Discipline ID: `artifact-tree-admission`
Name: Artifact tree admission
Kind: instance of [CAV2-D50 discipline](../../authority/definitions/DEFINITIONS.md#cav2-d50-discipline)
Catalog: **private-parent** (CyberAlchemy v2) - must not be routed into the public Arcanum catalog

## Purpose

Govern the recurring practice of deciding whether, where, and in what form a
new folder or artifact should be created before filesystem mutation begins.

The practice keeps creation traceable to intent instead of treating a requested
filename or directory as sufficient design authority. It admits a new object
only after its role, parent surface, ownership, type posture, durability, source
boundary, validation surface, and continuation route are explicit enough for
its intended use.

## Admission Sequence

Before creating a folder or artifact:

1. **Preserve intent.** Record why the object is needed, what pressure it
   answers, and why an existing owner or artifact cannot absorb the work
   (`CAV2-D39`).
2. **Choose the owning surface.** Place the object under the narrowest existing
   repository area whose role and authority posture match it. File proximity
   does not grant authority (`CAV2-D34`).
3. **Classify the artifact posture.** If the object instantiates an enumerated
   canonical kind and comes from that kind's process, record its
   `canonical_kind`, `authority_kind`, process origin, durability, and initial
   authority state (`CAV2-D51`, `CAV2-D52`). Otherwise, mark it as
   non-canonical working material or route a canonical-kind proposal to the
   owning gate; do not invent an implicit kind.
4. **Govern a load-bearing tree.** If a folder or artifact set will constrain
   future work, promote knowledge, or become a reusable authority surface,
   expose the complete governed-artifact-tree interface required by
   `CAV2-D42`.
5. **Attach the object to the repository.** Add the parent entrypoint, source or
   provenance links, validation path, challenge or drift route, and next owner
   so a later human or agent can trace why the object exists (`CAV2-D35`,
   `CAV2-D36`).
6. **Record residue.** Missing classification, ownership, validation, or tree
   fields remain explicit residue. A gap may flag, defer, or block admission;
   it must not disappear behind a newly created path.

## Boundary

This discipline governs the recurring **admission practice**. It does not:

- define `artifact`, `canonical artifact`, `durability`, or any other term;
- make every folder a governed artifact tree;
- forbid temporary or non-canonical working material;
- add a canonical kind, authority kind, top-level repository area, or promotion
  state;
- author or amend a constitution;
- make an artifact authoritative because it is typed, durable, linked, or well
  placed;
- replace the producing capability's own process or validation contract.

Top-level area creation, canonical-kind extension, authority-kind extension,
and changes to an existing area's role are blocker-level owner decisions.
Structural enforcement belongs to `constitution-governance`; deterministic
checks belong to the eventual validator owner.

## Evidence

- [CAV2-D42 Governed Artifact Tree](../../authority/definitions/DEFINITIONS.md#cav2-d42-governed-artifact-tree) - requires a governance interface when a folder or artifact set becomes load-bearing.
- [CAV2-D51 Canonical Artifact](../../authority/definitions/DEFINITIONS.md#cav2-d51-canonical-artifact) and [CAV2-D52 Artifact Durability](../../authority/definitions/DEFINITIONS.md#cav2-d52-artifact-durability) - separate recognized type and process origin from authority, and classify intended lifespan.
- [Canonical Kinds](../../ontology/canonical-kinds/CANONICAL-KINDS.md) - enumerates recognized artifact kinds, producing processes, rollups, and durability defaults while leaving unenumerated work non-canonical.
- [Stable Repository Constitution](../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md) - `CAV2-C7` already requires navigable durable areas and `CAV2-C14` requires a governed interface for load-bearing trees.
- [CyberAlchemy v2 repository shape](../../README.md#repository-shape) - assigns distinct roles to authority, research, architecture, capabilities, specs, implementation, validation, inventory, ontology, observability, and ops.
- [Source Map ingest rules](../../SOURCE-MAP.md#ingest-rules) - requires source posture, reference-first ingestion, authority-layer separation, and traceability from generated projections.

Maintenance signal: folder and artifact creation already crosses definitions,
constitution, ontology, repository architecture, source ingestion, and producing
capabilities. The rules exist, but the recurring pre-creation decision is
scattered across those surfaces, allowing misplaced, untyped, unowned, or
untraceable artifacts to appear before governance catches up.

## Validation

- Mode: mixed
- Current posture: prose-review now; deterministic admission check later.
- Current check: review the proposed object against the admission sequence,
  existing repository shape, `CAV2-C7`, `CAV2-C14`, `CAV2-D42`, `CAV2-D51`,
  `CAV2-D52`, and local Markdown links.
- Future check: a validator inspects durable additions for an owning surface,
  entrypoint linkage, recognized canonical posture or explicit non-canonical
  status, durability when canonical, and the governed-tree interface when the
  tree is load-bearing.
- Latest result: pass, 2026-07-11 card structure, private catalog parity, and
  local Markdown link check; deterministic admission validation remains the
  named hardening route.

## Quality Bar

A useful artifact-tree admission must:

- preserve the initiating intent and name why a new object is needed;
- use the narrowest existing owner and repository surface;
- distinguish canonical artifact, non-canonical working material, and authority;
- assign durability only to a canonical artifact and keep it orthogonal to
  authority and maturity;
- require the `CAV2-D42` interface only when the tree is load-bearing;
- preserve provenance, traceability, validation, challenge, drift, and residue;
- make consequential extensions owner-gated instead of implicit in filesystem
  mutation.

## Promotion Guardrail

Candidate only; repeated use cannot self-promote this discipline. Advancing
past `candidate` requires cross-capability admission receipts, an owner-approved
validation surface, a declared mutation boundary, and evidence that the check
does not burden temporary working material or duplicate producing-process
contracts.

This discipline may recommend constitution, canonical-kind, decision, validator,
or producing-capability routes. It cannot execute their authority changes.

## Next Hardening Move

Route a private artifact-admission amendment through
`constitution-governance`, reusing and tightening `CAV2-C7` and `CAV2-C14`
rather than adding an overlapping tree rule. After that owner decision, define
an admission-record template and a deterministic validator for the fields the
constitution makes mandatory.
