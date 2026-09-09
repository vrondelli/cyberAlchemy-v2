---
title: Proposed repository observe-only posture
status: design-only
authority_effect: none
enforcement_effect: none
---

# Observe-Only Posture

## Meaning of deactivation

For this project, deactivating repository governance means:

> No repository-owned governance finding participates in a work command's exit
> status, merge decision, lifecycle movement, authority grant, owner request, or
> source mutation.

It does not mean deleting definitions, constitutions, templates, validators,
ontologies, evidence, or design structure. Those remain available for learning
and later evaluation.

It also cannot deactivate boundaries outside repository ownership: platform and
host safeguards, active agent instructions, remote branch protection,
credentials, destructive-action controls, or an independent submodule's rules.

## Proposed contract

The future single source would be a root-owned file such as
`.governance/posture.json`. This bundle contains only a non-active example at
`fixtures/OBSERVE-ONLY-POSTURE.example.json`.

Required semantics:

- posture is exactly `observe_only`;
- governance jobs are outside the product-work critical path;
- observer failures cannot replace or mask the product-work result;
- findings are local evidence only;
- no governance writer targets source, lifecycle, authority, Git index, or
  external services;
- no missing or malformed governance configuration creates enforcement;
- no `enforce` value exists until separately designed and accepted.

## Current surface map

| Surface | Current classification | This turn |
| --- | --- | --- |
| Root `.githooks/pre-commit` | Formatting plus `git add`; inactive in this checkout because `core.hooksPath` points to `.git/hooks`. | Unchanged. |
| Root `.github/workflows/drift-check.yml` | Blocking job when the workflow runs; remote required-check status unknown. | Unchanged. |
| Root `Makefile` publication/bump checks | Explicit fail-closed commands, not ambient hooks. | Unchanged. |
| Root `.codex/hooks.json` and stop hook | Run-local observation is normally fail-open; strict mode can block. | Unchanged; a future adapter must ignore strict governance blocking while observe-only. |
| Root `.claude/settings.json` skill guard | Injects guidance but does not deny the tool. | Unchanged advisory context. |
| `tools/arcanum` and generated skills | On-demand authoring/validation/lifecycle tools. | Used only for read-only mode discovery; unchanged. |
| `implementation/domainspec` hooks and scripts | Independent Git root; active formatting/staging hook, fail-closed spec lint, and strict code-tag chain. | Read-only evidence; parent posture cannot override it. |
| `validation/poker-team` hooks and workflows | Independent Git root; effectful Husky hook, hard governance workflow, and external tuning actions. | Read-only evidence; local owner and external-effect changes required. |
| Public Arcanum CI | Independent public repository validation. | Cannot inherit a private CyberAlchemy posture. |
| Other submodules/Git roots | Seven Git roots exist in total; each owns its configuration and external CI. | Not changed. |
| Agent instructions | Active runtime collaboration constraints. | Not deactivatable by this Design. |
| Remote repository policy | External state. | Unknown and unchanged. |

## Future activation sequence

This is a design sequence, not authorization to execute it:

1. Inventory every parent and child Git root and every hook, CI required check,
   wrapper, validator caller, background observer, and external policy.
2. Classify each surface as structure, observation, advisory validation,
   blocking enforcement, mutation, or external authority.
3. Introduce the posture manifest and a pure resolver in an isolated fixture.
4. Prove the observer runs after or beside work and cannot alter the work result.
5. Adapt one parent-owned surface at a time. Each adapter must declare whether
   it can actually become advisory or is externally owned.
6. For each independent Git root, obtain its own owner decision. Never infer
   inheritance from the parent.
7. Verify that zero governance findings block representative work and zero
   governance observers write protected state.
8. Publish a coverage report naming all uncovered or externally controlled
   surfaces. Do not call the repository fully observe-only while any material
   surface is unknown.

## Restoration and later enforcement

There is intentionally no quick toggle from `observe_only` to `enforce`.
Restoring enforcement requires a new project that defines:

- the exact rule and harm basis;
- the surface and effect it may block;
- false-positive and negative-control evidence;
- owner and challenge route;
- rollback and emergency bypass;
- friction budget and review cadence;
- independent validation and explicit activation.

This asymmetry prevents a configuration typo from silently making candidate
governance authoritative.

## Open questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
