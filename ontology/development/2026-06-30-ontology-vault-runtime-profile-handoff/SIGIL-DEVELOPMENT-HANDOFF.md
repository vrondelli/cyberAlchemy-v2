---
node_type: invoke-handoff
is_session: true
status: pass
boundary: INTERNAL - private handoff evidence only
created: 2026-06-30
source_capability: invoke
target_owner: sigil-development
target_sigil: ontology-vault
handoff_type: new-lifecycle-thread
---

# Invoke Handoff: Ontology Vault Project-Local Runtime Profiles

## Identity

- Source session reference: current ontology-vault / DomainSpec v2 runtime
  discussion, 2026-06-30.
- Destination label: `ontology-vault` project-local runtime profile update.
- Handoff type: `new-lifecycle-thread`.
- Target lifecycle owner: `sigil-development`.
- Target sigil: `ontology-vault`.
- Recommended mode: `sigil-development ontology-vault --update`.

## New Session Prompt

```text
Continue from the Invoke handoff for the Ontology Vault project-local runtime profile update.

Goal: update the reusable ontology-vault sigil so it can operate over project-local ontology runtime profiles and, when explicitly selected and gated, use governed subagents as an agent-backed provisional runtime. Keep the canonical sigil generic. Do not hardcode DomainSpec v2 or other private project paths into public Arcanum sources. Treat DomainSpec v2 as a private pilot/profile surface only.

Start with:
- cyberAlchemy-v2/ontology/development/2026-06-30-ontology-vault-runtime-profile-handoff/CONTEXT-PACK.md
- cyberAlchemy-v2/ontology/development/2026-06-30-ontology-vault-runtime-profile-handoff/SIGIL-DEVELOPMENT-HANDOFF.md
- cyberAlchemy-v2/ontology/development/2026-06-30-ontology-vault-runtime-profile-handoff/HANDOFF-DISPATCH.json

Then inspect the canonical target at arcanum/arcana/ontology-vault/ and decide the smallest update-mode lifecycle slice. Preserve generated runtime mirror discipline: patch canonical sources first, then sync generated .agents/.claude copies if the public sigil changes.
```

## Route Rationale

`ontology-vault` already governs maps, sessions, premises, confidence, branch
bridges, delegated evidence, and validation. The missing behavior is not a new
sigil from scratch; it is an update to recognize a project-local runtime
profile as the bounded execution context for those existing modes.

The user wants to test a runtime now by combining:

- `ontology-vault` as controller/state-machine,
- governed agents as optional execution backend,
- DomainSpec v2 as the first local profile/pilot,
- inventory and observability as read-model/telemetry surfaces.

This handoff routes to Sigil Development because changes to `SKILL.md`,
templates, observability expectations, generated mirrors, and experiment
harness state belong to the sigil lifecycle owner.

## Context Builder Selection

| Obligation | Coverage | Selected Source | Why It Matters |
| --- | --- | --- | --- |
| Existing target sigil contract | covered | `arcanum/arcana/ontology-vault/SKILL.md` | The update must preserve the existing objective and quality bar. |
| Invoke-to-sigil lifecycle boundary | covered | `.agents/skills/invoke/SKILL.md`, `.agents/skills/sigil-development/SKILL.md` | Invoke authors this packet; Sigil Development owns mutation. |
| Handoff-mode requirements | covered | `.agents/skills/invoke/handoff.md` | Ensures this is a handoff, not a disguised implementation. |
| Runtime gap | covered | `cyberAlchemy-v2/ontology/projections/README.md#Gate Result` | Projection shape is ready, generated projection runtime is gated. |
| Base ontology role | covered | `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md#Package Boundary` | Ontology models authority but does not decide authority. |
| Project-local pilot | covered | `projects/domainspec-v2/ontology/README.md#Role` | DomainSpec v2 can instantiate CAV2 shape locally without becoming a second base package. |
| Local owner route | covered | `projects/domainspec-v2/authority/AUTHORITY-MODEL.md#Authority Kinds` | Runtime profile must use DomainSpec v2 owner routes for local promotion decisions. |
| Source-spine boundary | covered | `projects/domainspec-v2/authority/source-spine.md#Source Families` | CAV2 and v1 are supporting source only, never resolution paths. |
| Agent backend gate | covered | `domainspec-subagents-strategy` skill contract | Agent runtime needs P1 trigger, tension check, human confirmation, ledger append, closeout. |
| No accidental inventory promotion | covered | `TASK-SESSION-SWU-OCON-006.md#Summary` | Candidate/local guidance and session evidence were not inventoried as promoted knowledge. |

Context Builder coverage: pass.

## Target Boundary

In scope for Sigil Development:

- Update the generic `ontology-vault` contract to recognize project-local
  runtime profiles.
- Decide whether to add a generic argument or process convention such as
  `--profile <path>` and `--runtime inline|agents`.
- Add or revise a generic template for a project-local runtime profile.
- Define how `ontology-vault` invokes or hands off to governed agents without
  bypassing `domainspec-subagents-strategy`.
- Define runtime outputs such as map, validation report, confidence action,
  drift report, projection/read-model, observability signal, and optional
  inventory read-model update.
- Add experiment-harness examples or record why the current harness is
  sufficient or blocked.
- Sync generated runtime skill mirrors only after canonical edits are validated.

Out of scope for Sigil Development in this handoff:

- Directly promoting DomainSpec v2 ontology candidates.
- Writing `cyberAlchemy-v2/specs/` from ontology candidates.
- Treating subagent agreement as authority.
- Treating generated projection output as canonical source.
- Hardcoding `projects/domainspec-v2` paths into public `arcanum/` sources.
- Mutating private DomainSpec v2 profile files unless a later task-session or
  explicit owner route approves that write scope.

## Suggested Generic Runtime Profile Contract

Sigil Development should evaluate a generic profile shape like:

```yaml
profile_id:
profile_status: candidate | active-local | retired
base_ontology_refs:
local_ontology_refs:
local_owner_refs:
source_spine_refs:
implementation_refs:
allowed_runtime_modes:
  - inline
  - agents
agent_backend:
  strategy_owner: domainspec-subagents-strategy
  dispatch_types_allowed:
    - research
    - review
    - experiment
runtime_outputs:
  - ontology-map
  - validation-report
  - confidence-action-report
  - drift-report
  - candidate-map-projection
  - review-index-projection
blocked_outputs:
  - promotion-verdict
  - spec-mutation
  - runtime-conformance-verdict
  - canonical-source-mutation
owner_gates:
residue_route:
observability_route:
```

DomainSpec v2 can instantiate this profile privately later. The public sigil
should document the shape generically.

## Suggested Update Slices

| Slice | Goal | Owner | Acceptance Evidence |
| --- | --- | --- | --- |
| OVRP-001 | Add generic project-local runtime profile concept to Ontology Vault docs/skill. | sigil-development | Canonical diff plus generated mirror sync plan. |
| OVRP-002 | Add profile template or examples without private paths. | sigil-development | Template validates links and public/private scan passes. |
| OVRP-003 | Add agent-backed runtime protocol that routes through `domainspec-subagents-strategy`. | sigil-development | Quality bar names P1 trigger, human confirmation, ledger, closeout, and delegated evidence traceability. |
| OVRP-004 | Add or update experiment harness examples for inline profile and agent-backed profile. | sigil-development + experiment-harness | Example prompts and validation report. |
| OVRP-005 | Optional private pilot: create `projects/domainspec-v2/ontology/RUNTIME-PROFILE.md`. | task-session after owner route | Private profile artifact, no public Arcanum mutation. |

## Gaps And Blockers

| Gap | Owner | Status | Next Action |
| --- | --- | --- | --- |
| Exact profile flag syntax | sigil-development | open | Decide whether to add `--profile` / `--runtime` to argument hint or keep profile detection in process text. |
| Experiment harness coverage | sigil-development + experiment-harness | open | Inspect existing ontology-vault development harness and decide whether new examples are required. |
| Generated mirror sync | sigil-development | open | If canonical public sigil changes, regenerate or sync `.agents/skills/ontology-vault` and `.claude/skills/ontology-vault`. |
| DomainSpec v2 private pilot write | task-session / DomainSpec v2 owner | deferred | Create private `RUNTIME-PROFILE.md` only after generic sigil update is accepted or a bounded task-session approves the write. |
| Subagent runtime confirmation | domainspec-subagents-strategy | deferred | Any agent-backed pilot needs a proposed sheet, check-tension gate, explicit human confirmation, dispatch row, and close row. |

## Next Route

Run:

```text
sigil-development ontology-vault --update
```

Use this handoff as source context. The first Sigil Development result should
decide whether the update can be a targeted contract/template change or whether
reflection is required before mutation.

## Provenance

- Invoke mode: `handoff`.
- Source context pack:
  `cyberAlchemy-v2/ontology/development/2026-06-30-ontology-vault-runtime-profile-handoff/CONTEXT-PACK.md`
- Dispatch route:
  `cyberAlchemy-v2/ontology/development/2026-06-30-ontology-vault-runtime-profile-handoff/HANDOFF-DISPATCH.json`
- Target owner: `sigil-development`.
- Target sigil: `ontology-vault`.
- Created: 2026-06-30.

## Gate Result

- Status: pass.
- Reason: The handoff names the target lifecycle owner, keeps public/private
  state separate, preserves DomainSpec v2 as a private pilot profile, and does
  not mutate the target sigil.
