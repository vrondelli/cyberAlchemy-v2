---
node_type: invoke-handoff-context-pack
is_session: true
status: complete
boundary: INTERNAL - private handoff evidence only
created: 2026-06-30
authored_by: invoke (mode=handoff)
target_owner: sigil-development
target_sigil: ontology-vault
---

# Context Pack: Ontology Vault Runtime Profile Handoff

## Task

Prepare a bounded handoff from Invoke to Sigil Development for updating the
`ontology-vault` sigil so it can support project-local ontology runtime
profiles and an agent-backed pilot runtime without hardcoding DomainSpec v2
private paths into the public sigil contract.

## Obligation Matrix

| Obligation | Required Evidence | Coverage |
| --- | --- | --- |
| O1: Target is an existing reusable sigil. | `arcanum/arcana/ontology-vault/SKILL.md` and generated `.agents/skills/ontology-vault/SKILL.md`. | covered |
| O2: Next lifecycle owner is Sigil Development. | Invoke and Sigil Development chain-boundary rules. | covered |
| O3: User intent is a test runtime using Ontology Vault plus agents. | Current session request: use `ontology-vault` and governed agents as runtime for DomainSpec v2 testing. | covered |
| O4: Generic sigil must not hardcode DomainSpec v2. | Public/private boundary and DomainSpec v2 candidate/local status. | covered |
| O5: DomainSpec v2 should be a project-local runtime profile/pilot. | `projects/domainspec-v2/ontology/README.md`, authority model, and source spine. | covered |
| O6: Agent backend remains governed. | `domainspec-subagents-strategy` requires P1 trigger, tension gate, human confirmation, ledger rows, and closeout. | covered |
| O7: Runtime outputs must not create authority. | CAV2 projection docs and ontology package model forbid promotion by projection or proximity. | covered |
| O8: Handoff should be validation-ready. | Dispatch Spec route plus diff/JSON checks. | covered |

## Selected Sources

| Source | Selectors | Why Included |
| --- | --- | --- |
| `.agents/skills/invoke/SKILL.md` | Lifecycle authority chain and target artifact provenance. | Confirms Invoke authors the handoff only. |
| `.agents/skills/invoke/handoff.md` | Handoff mode gates and output contract. | Defines required handoff sections and next route. |
| `.agents/skills/sigil-development/SKILL.md` | Chain boundary and update-mode lifecycle. | Confirms Sigil Development owns the sigil mutation. |
| `arcanum/arcana/ontology-vault/SKILL.md` | Current canonical sigil contract. | Target source of truth for generic changes. |
| `.agents/skills/ontology-vault/SKILL.md` | Generated runtime mirror. | Confirms generated copies should be synced, not patched as authority. |
| `cyberAlchemy-v2/ontology/projections/README.md` | Gate result. | States projection shape is ready but generated projection runtime is gated. |
| `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Package boundary and core model. | Confirms ontology models authority but does not decide authority. |
| `projects/domainspec-v2/ontology/README.md` | Candidate local instantiation surface. | Provides the pilot profile target and forbidden collapses. |
| `projects/domainspec-v2/authority/AUTHORITY-MODEL.md` | Local authority owner route. | Shows local governance kinds and build-time/runtime boundary. |
| `projects/domainspec-v2/authority/source-spine.md` | Harvested precedent boundary. | Confirms CAV2 and v1 are supporting sources only. |
| `cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation/TASK-SESSION-SWU-OCON-006.md` | Closeout result. | Records that DomainSpec v2 ontology guidance remains candidate/local and inventory refresh was deferred. |
| prior memory boundary notes | Generated runtime mirrors, public/private boundaries, project-local hypothesis status. | Keeps the handoff from turning private pilot context into public sigil law. |

## Controlling Constraints

- Do not mutate `ontology-vault` during Invoke handoff.
- Do not place private DomainSpec v2 pilot details inside public `arcanum/`
  artifacts except as generic, sanitized capability requirements.
- Sigil Development should patch canonical `arcanum/arcana/ontology-vault/`
  first, then sync generated runtime copies if it changes the public sigil.
- DomainSpec v2 should be represented as a local runtime profile/pilot, not a
  generic default.
- Agent-backed runtime work must route through `domainspec-subagents-strategy`
  only when P1 triggers hold and explicit human confirmation is obtained.
- Runtime/profile outputs are evidence, validation reports, projections, and
  read models; they are not promotion verdicts.

## Handoff Decisions

| Decision | Selected Option | Rationale |
| --- | --- | --- |
| Handoff type | `new-lifecycle-thread` targeting `sigil-development --update ontology-vault`. | The work is a sigil contract/runtime-profile update, not bounded execution. |
| Public/private placement | Store this handoff under private `cyberAlchemy-v2/ontology/development/`. | The brief cites private DomainSpec v2 paths and should not be committed into public Arcanum as-is. |
| Sigil update shape | Add generic project-local runtime profile behavior to `ontology-vault`. | Keeps DomainSpec v2 as one profile, not generic law. |
| Agent runtime | Treat governed agents as optional backend selected by runtime profile and P1 trigger. | Preserves subagent strategy gates and append-only ledger discipline. |

## Strict Coverage

Strict coverage: pass for a non-execution handoff. The next lifecycle owner has
enough context to start an `ontology-vault` update. Mutation, experiment
harness changes, and generated-runtime sync remain owned by Sigil Development.
