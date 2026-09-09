# Essays Runtime Task-Session Context Pack

## Identity

- Task/SWU: `ESSAYS-TS-001`
- Source task/work-pack: `cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json`
- Session/run id: `ESSAYS-RUNTIME-IMPLEMENTATION-001`
- Session evidence path: `cyberAlchemy-v2/essays/implementation/task-session/context`
- Runtime handoff: `runtime`
- Repository revision: `f9a6b132ca3bccaa5be5ef10fa898fb886324c06`
- Evidence date: `2026-08-30`

This is strict, lean execution evidence. It is not a reusable source of product or system meaning.

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `ESSAYS-O1-GRAPH-MAPPING` | `covered` | `REALIZATION-BASELINE.candidate.json#implementation_slices`; compiled graph | Every domain-bearing implementation must cite an exact `essays-runtime.*` node. |
| `ESSAYS-O2-RUNTIME-AUTHORITY` | `covered` | baseline acceptance obligations; `BRIDGE.json#mappings` | Essays runtime owns accepted state; React, Milkdown, and storage are adapters. |
| `ESSAYS-O3-HUMAN-AUTHORITY` | `covered` | graph nodes `HumanEditorialAuthorityRule`, `ReviewResolutionRule` | Generated proposals and observations require explicit writer operations. |
| `ESSAYS-O4-EXPORT-GATE` | `covered` | graph operations and baseline acceptance obligations | Unresolved blocking comments or residue block a local export; export is not publication. |
| `ESSAYS-O5-STABLE-MARKDOWN` | `covered` | baseline `ESSAYS-IMPL-CORE`; Whisper Review HTML Contract | CommonMark round trips deterministically and review comments bind stable block IDs. |
| `ESSAYS-O6-EDITOR-SURFACE` | `covered` | dependency review and accepted editor allowlist/denylist | Only four Milkdown packages may be direct editor dependencies. |
| `ESSAYS-O7-ACCESSIBILITY` | `covered` | baseline acceptance obligations | Browser evidence must cover keyboard access, visible focus, labels, instructions, and review association. |
| `ESSAYS-O8-VALIDATION` | `covered` | baseline acceptance obligations | Unit, integration, build, DomainSpec recompile, whitespace, and browser checks are mandatory. |
| `ESSAYS-O9-NO-EXTERNAL-EFFECT` | `covered` | owner acceptance receipt and implementation target | No account, network, collaboration, publication, deployment, or external synchronization surface. |

Strict coverage: `pass`

## Selected Sources

- `cyberAlchemy-v2/essays/implementation/REALIZATION-BASELINE.candidate.json`
  - Selectors: `implementation_target`, `editor_adapter_candidate`, `implementation_slices`, `acceptance_obligations`
  - Obligations: `ESSAYS-O1` through `ESSAYS-O9`
  - Evidence excerpt: local React/Vite target; Essays-owned persistence; four-package Milkdown allowlist; nine exact acceptance obligations.
- `cyberAlchemy-v2/essays/implementation/OWNER-ACCEPTANCE-RECEIPT.json`
  - Selectors: `status`, `baseline_digest`, `implementation_scope`, effect ceilings
  - Obligations: `ESSAYS-O6`, `ESSAYS-O9`
  - Evidence excerpt: exact baseline digest is accepted for bounded local implementation and ordinary dependencies only.
- `cyberAlchemy-v2/essays/domainspec-project/.domainspec/generated/graph.json`
  - Selectors: nodes and edges under feature `essays-runtime`
  - Obligations: `ESSAYS-O1`, `ESSAYS-O3`, `ESSAYS-O4`
  - Evidence excerpt: compiled DomainSpec graph contains the complete 43-node, 85-edge system model.
- `cyberAlchemy-v2/essays/domainspec-project/specs/essays-runtime/feature.json`
  - Selectors: `node_sources`
  - Obligations: `ESSAYS-O1`, `ESSAYS-O8`
  - Evidence excerpt: authoritative per-node source inventory for the Essays runtime feature.
- `cyberAlchemy-v2/essays/system-ontology/BRIDGE.json`
  - Selectors: `mappings`, `claim_ceiling`
  - Obligations: `ESSAYS-O2`, `ESSAYS-O9`
  - Evidence excerpt: editor state is non-authoritative; Whisper support is only a candidate and export grants no publication authority.
- `cyberAlchemy-v2/essays/research/open-source-writing-substrate/dependency-surface-review.json`
  - Selectors: direct allowlist, direct denylist, integration decision, remaining adoption gates
  - Obligations: `ESSAYS-O6`, `ESSAYS-O8`
  - Evidence excerpt: mount Milkdown core through a project-owned React effect and prove exact lockfile closure.
- `.agents/skills/whisper/SKILL.md`
  - Selectors: `Purpose`, `Artifact Lifecycle Contract`, `Review HTML Contract`
  - Obligations: `ESSAYS-O3`, `ESSAYS-O5`
  - Evidence excerpt: intent-to-plan-to-draft-to-review-to-validation-to-residue lifecycle with stable addressable review blocks.
- `cyberAlchemy-v2/essays/domainspec-project/specs/essays-runtime/nodes/essay-workspace-binding.json`
  - Selectors: `body`, `connections`
  - Obligations: `ESSAYS-O2`, `ESSAYS-O3`
  - Evidence excerpt: UI mutations are explicit operations with expected-revision preconditions and accepted-revision invalidation.

## Architecture Guidance

Implement a pure TypeScript domain kernel behind `EssaysRuntimeInterface`, an Essays-owned repository port, a local-storage adapter, a project-owned Milkdown DOM lifecycle adapter, and a React projection. Framework utilities must not claim domain meaning. Preserve previous essay revisions and reconcile Markdown blocks to stable IDs before committing a writer-approved revision.

## Related Feature Context

The studio route is `/essays/:workspaceId`. The lifecycle is intent, accepted plan, authoritative draft, addressable review, explicit resolution, validation with residue, then local export. Whisper informs the lifecycle shape only; no Whisper capability invocation or accepted realization is claimed.

## Constraints And Non-Goals

- Do not mutate the accepted baseline, compiled graph, bridge, or generated system ontology.
- Do not add AI, accounts, collaboration, uploads, media, tables, LaTeX, drag-and-drop, slash commands, streaming, publication, deployment, or external synchronization.
- Do not install `@milkdown/kit`, `@milkdown/react`, or `@milkdown/crepe`.
- Do not allow React, Milkdown, ProseMirror, or browser storage to own authoritative domain transitions.
- Do not call a local export publication, release, or deployment.

## Write Scope

- `cyberAlchemy-v2/essays/runtime/**`
- `cyberAlchemy-v2/essays/implementation/task-session/**`
- Detached conformance evidence under `cyberAlchemy-v2/essays/implementation/**`
- Narrow acceptance-receipt validation in `cyberAlchemy-v2/essays/scripts/validate.py`

## Validation Surface

- Runtime unit and integration tests.
- TypeScript typecheck and deterministic Vite production build.
- Exact lockfile production dependency and license audit with denied-package checks.
- DomainSpec v2 deterministic recompile/check.
- CyberAlchemy Essays package validator and scoped whitespace check.
- Browser acceptance at desktop and narrow viewport with keyboard, labels, editor instructions, review association, persistence, revision-conflict, blocked-export, and successful local-export evidence.

## Gaps And Blockers

- None. Whisper capability realization remains deliberately deferred and is not required by this local deterministic slice.

## Authority Precedence

1. Exact owner acceptance receipt bound to baseline digest `c71b20049c023424951ab5d28427cf844f0f83b54e3cd6dc91434adeb1972214`.
2. Accepted realization baseline obligations and target scope.
3. Compiled DomainSpec v2 graph and per-node sources.
4. CyberAlchemy semantic-to-system bridge claim ceilings.
5. Whisper lifecycle and review-addressability guidance.
6. Framework and adapter conventions.

## Fallback Exploration Rule

Broad repository exploration is allowed only for a newly observed validation gap, and that gap must be named before exploring. Extra sources must be reported in the runtime result.

## Provenance

- Baseline SHA-256: `c71b20049c023424951ab5d28427cf844f0f83b54e3cd6dc91434adeb1972214`
- Owner acceptance SHA-256: `5b32abe53fa685d1def25c46e8c1cc0060af7eb817750f3336a274d4246269f2`
- Compiled graph SHA-256: `821f38a7a7a701680857950eae36308d27192753b439a92d31fa37c71bdb634c`
- Bridge SHA-256: `ae37d82b281c51845c9d7409cfff8eb6f8b6f900e379d6a42dc0ecd882fce2fb`
- Dependency review SHA-256: `a5e0f43cebbc0621df3f37ccc537cb237fa24311bc5f4b73c2445175f7e1b2af`
- Whisper skill SHA-256: `754dd2cd94a3ae61adf7bd95e033c8c91f8fab95aa1ff83123430cfb0ffd11f0`
- Builder mode: `lean`

## Output Paths

- Markdown: `cyberAlchemy-v2/essays/implementation/task-session/context/RUNTIME-HANDOFF.md`
- JSON/index: `cyberAlchemy-v2/essays/implementation/task-session/context/runtime-handoff-index.json`
