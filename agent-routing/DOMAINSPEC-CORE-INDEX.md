# DomainSpec Core sibling inventory

Status: candidate navigation read model. Authority effect: none.
Observed: 2026-09-07 in the local filesystem, not a committed-history receipt.
Owner of navigation: CyberAlchemy v2 agent-routing owner. Source ownership stays
with the linked packages.

## Scope and use

Select `CA2-ROUTE-DOMAINSPEC-CORE` only for explicitly scoped sibling lookup.
The fixed target is `../domainspec-core` relative to the CyberAlchemy-v2 root
(`../../domainspec-core` from this document). Check that exact directory exists;
announce selected paths before reading them. Resolve each selected path and
require it to remain inside that fixed root. Reject symlinks escaping it, user
traversal, arbitrary sibling roots, credentials, dependency/build trees, and
`.git` contents. Do not initialize submodules or execute scripts during lookup.
No missing path redirects to another checkout. Public `arcanum/` is listed only
as a boundary, not permission to inspect or copy its contents.

This is a manually maintained, linked directory inventory, not a digest-pinned
identity index. Verify selected paths and source content on use; a directory's
presence proves neither implementation completeness nor runtime availability.
`project-index.json` and `scripts/locate.py` retain their existing local bounds.
Broader discovery within this fixed checkout must be announced and bounded to
the cited name and entry files. Missing checkout content remains explicit.

## Resume Workspace, RWO, ARE, and Luna

- Current continuation: [Luna VPS plan](../workspace/plans/luna-vps/PLAN.md).
- Local implementation packages: [Codex App Server wrapper](../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper) and [coding-agent runtime](../implementation/agent-reasoning-engine/packages/coding-agent-runtime).

- Local Workspace/Luna plan: [LUNA-MONITOR-PLAN.md](../workspace/experiments/control-center/LUNA-MONITOR-PLAN.md).
- Local RWO implementation: [README](../work-orchestration-implementation/README.md).
- Local ARE/Codex integration: [README](../development/agent-reasoning-engine/codex-integration/README.md).
- Orchestrator research exists at [research/cyberalchemy-orchestrator/2026-07-22-reasoning-engine-purpose](../../domainspec-core/research/cyberalchemy-orchestrator/2026-07-22-reasoning-engine-purpose). This is research evidence, not a runtime checkout.
- `../domainspec-core/projects/cyberalchemy-orchestrator` and
  `../domainspec-core/cyberAlchemy-v2` are absent in this checkout. The current
  CyberAlchemy-v2 repository is its sibling.
- [projects/subagents-work-infrastructure](../../domainspec-core/projects/subagents-work-infrastructure) is an empty declared submodule directory.
- [projects/co-op-engine/infra/README.md](../../domainspec-core/projects/co-op-engine/infra/README.md) documents a static website VPS deployment; it does not establish a Luna/Codex App Server host.
- [vscode-workspaces/README.md](../../domainspec-core/vscode-workspaces/README.md) indexes editor launchers, including [vscode-workspaces/cyberalchemy.code-workspace](../../domainspec-core/vscode-workspaces/cyberalchemy.code-workspace) and [vscode-workspaces/domainspec-core.code-workspace](../../domainspec-core/vscode-workspaces/domainspec-core.code-workspace). Launcher folder references may reflect the older umbrella layout.

## Root entry sources and areas

- [AGENTS.md](../../domainspec-core/AGENTS.md) — Sibling instructions; references to nested CyberAlchemy-v2 reflect a different layout.
- [README.md](../../domainspec-core/README.md) — Research hub overview; historical path claims need verification.
- [SUBMODULE-DISCIPLINE.md](../../domainspec-core/SUBMODULE-DISCIPLINE.md) — Submodule working discipline.
- [.gitmodules](../../domainspec-core/.gitmodules) — Declared submodule paths; does not establish populated checkouts.
- [research/registry](../../domainspec-core/research/registry) — Cross-project research navigation.
- [research/projects](../../domainspec-core/research/projects) — Research project sources.
- [cyberAlchemy](../../domainspec-core/cyberAlchemy) — Earlier CyberAlchemy artifacts.
- [implementation](../../domainspec-core/implementation) — Implementation references and declared DomainSpec submodule.
- [validation](../../domainspec-core/validation) — Validation references and declared harness submodule.
- [inventory](../../domainspec-core/inventory) — Inventory read models.
- [.arcanum/inventory](../../domainspec-core/.arcanum/inventory) — Private inventory read model, not authority.
- [.arcanum/ontology-vault](../../domainspec-core/.arcanum/ontology-vault) — Candidate ontology map, not authority.
- [docs](../../domainspec-core/docs) — Documentation.
- [ops](../../domainspec-core/ops) — Operational plans and surface inventories.
- [internal_tools](../../domainspec-core/internal_tools) — Local tools.
- [tools](../../domainspec-core/tools) — Tool entry area.
- [toolchains](../../domainspec-core/toolchains) — Toolchain definitions.
- [disciplines](../../domainspec-core/disciplines) — Discipline sources.
- [sessions](../../domainspec-core/sessions) — Existing session artifacts; discovery does not create or resume session authority.
- [Codex/current_conversations](../../domainspec-core/Codex/current_conversations) — Conversation artifacts; not loaded by this inventory.
- [vscode-workspaces](../../domainspec-core/vscode-workspaces) — Editor launchers.
- [arcanum](../../domainspec-core/arcanum) — Empty public-subsystem submodule boundary; contents excluded.

## Project directories

All 36 immediate `projects/` directories observed. Entry links indicate files
that exist, not reviewed project status. Empty submodules are marked explicitly.

| Directory | Entry evidence |
| --- | --- |
| [alpha-grant](../../domainspec-core/projects/alpha-grant) | Directory present; no immediate README/profile/package/plan entry |
| [animejs](../../domainspec-core/projects/animejs) | Directory present; no immediate README/profile/package/plan entry |
| [arcanum-journey](../../domainspec-core/projects/arcanum-journey) | Directory present; no immediate README/profile/package/plan entry |
| [augmentor](../../domainspec-core/projects/augmentor) | Directory present; no immediate README/profile/package/plan entry |
| [auth-foundation](../../domainspec-core/projects/auth-foundation) | [README.md](../../domainspec-core/projects/auth-foundation/README.md) |
| [auth-user-management](../../domainspec-core/projects/auth-user-management) | [README.md](../../domainspec-core/projects/auth-user-management/README.md); [package.json](../../domainspec-core/projects/auth-user-management/package.json) |
| [autoads](../../domainspec-core/projects/autoads) | [README.md](../../domainspec-core/projects/autoads/README.md); [PLAN.md](../../domainspec-core/projects/autoads/PLAN.md) |
| [body-war](../../domainspec-core/projects/body-war) | [README.md](../../domainspec-core/projects/body-war/README.md) |
| [co-op-engine](../../domainspec-core/projects/co-op-engine) | Directory present; no immediate README/profile/package/plan entry |
| [creator-pack-marketplace](../../domainspec-core/projects/creator-pack-marketplace) | [README.md](../../domainspec-core/projects/creator-pack-marketplace/README.md) |
| [cyberAlchemy-website](../../domainspec-core/projects/cyberAlchemy-website) | [README.md](../../domainspec-core/projects/cyberAlchemy-website/README.md) |
| [cyberalchemy-lab](../../domainspec-core/projects/cyberalchemy-lab) | Directory present; no immediate README/profile/package/plan entry |
| [domainspec-v2](../../domainspec-core/projects/domainspec-v2) | [README.md](../../domainspec-core/projects/domainspec-v2/README.md) |
| [equalizator](../../domainspec-core/projects/equalizator) | Directory present; no immediate README/profile/package/plan entry |
| [framework-unification](../../domainspec-core/projects/framework-unification) | [README.md](../../domainspec-core/projects/framework-unification/README.md) |
| [gb10-team-budget](../../domainspec-core/projects/gb10-team-budget) | Directory present; no immediate README/profile/package/plan entry |
| [goldenquill](../../domainspec-core/projects/goldenquill) | [README.md](../../domainspec-core/projects/goldenquill/README.md) |
| [ide-ergonomics](../../domainspec-core/projects/ide-ergonomics) | [README.md](../../domainspec-core/projects/ide-ergonomics/README.md) |
| [ide-extension](../../domainspec-core/projects/ide-extension) | [README.md](../../domainspec-core/projects/ide-extension/README.md); [package.json](../../domainspec-core/projects/ide-extension/package.json) |
| [industrial-bid-brasil](../../domainspec-core/projects/industrial-bid-brasil) | [README.md](../../domainspec-core/projects/industrial-bid-brasil/README.md) |
| [lucifers-lights](../../domainspec-core/projects/lucifers-lights) | [README.md](../../domainspec-core/projects/lucifers-lights/README.md) |
| [ontologize](../../domainspec-core/projects/ontologize) | [README.md](../../domainspec-core/projects/ontologize/README.md); [PLAN.md](../../domainspec-core/projects/ontologize/PLAN.md) |
| [ontology](../../domainspec-core/projects/ontology) | [README.md](../../domainspec-core/projects/ontology/README.md) |
| [poker-agent-arena](../../domainspec-core/projects/poker-agent-arena) | [README.md](../../domainspec-core/projects/poker-agent-arena/README.md) |
| [pos-multilevel](../../domainspec-core/projects/pos-multilevel) | [README.md](../../domainspec-core/projects/pos-multilevel/README.md) |
| [rpv-origination](../../domainspec-core/projects/rpv-origination) | Empty declared submodule directory |
| [savvy_legal-studio-ai](../../domainspec-core/projects/savvy_legal-studio-ai) | Empty declared submodule directory |
| [secret-management](../../domainspec-core/projects/secret-management) | [README.md](../../domainspec-core/projects/secret-management/README.md) |
| [sonar-loop](../../domainspec-core/projects/sonar-loop) | [README.md](../../domainspec-core/projects/sonar-loop/README.md) |
| [subagents-work-infrastructure](../../domainspec-core/projects/subagents-work-infrastructure) | Empty declared submodule directory |
| [ui-prototyping-studio](../../domainspec-core/projects/ui-prototyping-studio) | [README.md](../../domainspec-core/projects/ui-prototyping-studio/README.md) |
| [voice-production](../../domainspec-core/projects/voice-production) | [README.md](../../domainspec-core/projects/voice-production/README.md) |
| [whisky-doses](../../domainspec-core/projects/whisky-doses) | Directory present; no immediate README/profile/package/plan entry |
| [xdivina](../../domainspec-core/projects/xdivina) | Empty declared submodule directory |
| [zagr](../../domainspec-core/projects/zagr) | Empty declared submodule directory |
| [zrig](../../domainspec-core/projects/zrig) | Directory present; no immediate README/profile/package/plan entry |

## Development directories

All 12 immediate development directories; names provide navigation only.

- [development/arcanum-integration](../../domainspec-core/development/arcanum-integration)
- [development/authority-triage](../../domainspec-core/development/authority-triage)
- [development/cyberalchemy-integration-sdk](../../domainspec-core/development/cyberalchemy-integration-sdk)
- [development/deterministic-retrieval-thesis](../../domainspec-core/development/deterministic-retrieval-thesis)
- [development/deterministic-test-derivation-engine](../../domainspec-core/development/deterministic-test-derivation-engine)
- [development/intent-route-system-guide](../../domainspec-core/development/intent-route-system-guide)
- [development/invariants](../../domainspec-core/development/invariants)
- [development/machine-map](../../domainspec-core/development/machine-map)
- [development/refinement-runs](../../domainspec-core/development/refinement-runs)
- [development/resonantos-integration](../../domainspec-core/development/resonantos-integration)
- [development/review](../../domainspec-core/development/review)
- [development/x-rays](../../domainspec-core/development/x-rays)

## Research directories

All 47 immediate research directories; nested evidence and generated snapshots
were not recursively inventoried or validated.

- [research/2026-07-23-infinity-category-cochain-applicability](../../domainspec-core/research/2026-07-23-infinity-category-cochain-applicability)
- [research/2026-07-28-augmentor-routing-session-fabric](../../domainspec-core/research/2026-07-28-augmentor-routing-session-fabric)
- [research/2026-07-28-augmentor-subagent-strategy-integration](../../domainspec-core/research/2026-07-28-augmentor-subagent-strategy-integration)
- [research/2026-07-28-authority-memory-augmentor-integration](../../domainspec-core/research/2026-07-28-authority-memory-augmentor-integration)
- [research/2026-07-29-augmentor-unified-agent-architecture](../../domainspec-core/research/2026-07-29-augmentor-unified-agent-architecture)
- [research/2026-07-30-arcanum-resonantos-addon](../../domainspec-core/research/2026-07-30-arcanum-resonantos-addon)
- [research/2026-07-30-intent-router-bootstrap-runtime-integration](../../domainspec-core/research/2026-07-30-intent-router-bootstrap-runtime-integration)
- [research/2026-08-01-typesafe-reliable-autonomy-role](../../domainspec-core/research/2026-08-01-typesafe-reliable-autonomy-role)
- [research/2026-08-04-ontology-video-voice-provider-research](../../domainspec-core/research/2026-08-04-ontology-video-voice-provider-research)
- [research/2026-08-06-augmentor-addon-sdk-ontology-api](../../domainspec-core/research/2026-08-06-augmentor-addon-sdk-ontology-api)
- [research/2026-08-07-cognitive-tools-reflection-tower](../../domainspec-core/research/2026-08-07-cognitive-tools-reflection-tower)
- [research/2026-08-07-cogtoolslab-complete-corpus-final-closure](../../domainspec-core/research/2026-08-07-cogtoolslab-complete-corpus-final-closure)
- [research/2026-08-07-cogtoolslab-complete-corpus-program](../../domainspec-core/research/2026-08-07-cogtoolslab-complete-corpus-program)
- [research/2026-08-07-cogtoolslab-complete-corpus-recovery](../../domainspec-core/research/2026-08-07-cogtoolslab-complete-corpus-recovery)
- [research/2026-08-07-discord-organizational-network-analysis](../../domainspec-core/research/2026-08-07-discord-organizational-network-analysis)
- [research/2026-08-07-domainspec-v2-paper-evidence-refresh](../../domainspec-core/research/2026-08-07-domainspec-v2-paper-evidence-refresh)
- [research/2026-08-07-project-history-balanced-expansion](../../domainspec-core/research/2026-08-07-project-history-balanced-expansion)
- [research/2026-08-09-augmentor-resonantos-ontology-docs-mvp](../../domainspec-core/research/2026-08-09-augmentor-resonantos-ontology-docs-mvp)
- [research/2026-08-09-skillopt-arcanum-presentation](../../domainspec-core/research/2026-08-09-skillopt-arcanum-presentation)
- [research/2026-08-12-bolina-domainspec-formal-modeling](../../domainspec-core/research/2026-08-12-bolina-domainspec-formal-modeling)
- [research/2026-08-12-living-archive-sciencedirect-corpus](../../domainspec-core/research/2026-08-12-living-archive-sciencedirect-corpus)
- [research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate](../../domainspec-core/research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate)
- [research/2026-09-04-tink-go-conformance-reward](../../domainspec-core/research/2026-09-04-tink-go-conformance-reward)
- [research/MTNG-review-packet-v2-2026-06-17-clean](../../domainspec-core/research/MTNG-review-packet-v2-2026-06-17-clean)
- [research/agentic-music-studio](../../domainspec-core/research/agentic-music-studio)
- [research/cyber-alchemy-space](../../domainspec-core/research/cyber-alchemy-space)
- [research/cyberalchemy-orchestrator](../../domainspec-core/research/cyberalchemy-orchestrator)
- [research/ddd-event-sourcing](../../domainspec-core/research/ddd-event-sourcing)
- [research/domainspec](../../domainspec-core/research/domainspec)
- [research/framework-unification-diagram-feasibility](../../domainspec-core/research/framework-unification-diagram-feasibility)
- [research/high-attention-low-parameter-models](../../domainspec-core/research/high-attention-low-parameter-models)
- [research/intent-annotation-tags](../../domainspec-core/research/intent-annotation-tags)
- [research/jusbrasil-call](../../domainspec-core/research/jusbrasil-call)
- [research/lean-formalization-implications](../../domainspec-core/research/lean-formalization-implications)
- [research/lesswrong-rationality](../../domainspec-core/research/lesswrong-rationality)
- [research/mtng-resonantos](../../domainspec-core/research/mtng-resonantos)
- [research/projects](../../domainspec-core/research/projects)
- [research/registry](../../domainspec-core/research/registry)
- [research/shannon-content-relation-map](../../domainspec-core/research/shannon-content-relation-map)
- [research/shared](../../domainspec-core/research/shared)
- [research/smt-fol-test-derivation](../../domainspec-core/research/smt-fol-test-derivation)
- [research/sovereign-biocentric-ai-cognitive-commons](../../domainspec-core/research/sovereign-biocentric-ai-cognitive-commons)
- [research/system-theory-achievements](../../domainspec-core/research/system-theory-achievements)
- [research/ternary-models](../../domainspec-core/research/ternary-models)
- [research/ternary-models-old-cpus](../../domainspec-core/research/ternary-models-old-cpus)
- [research/tower-system-taxonomy](../../domainspec-core/research/tower-system-taxonomy)
- [research/triton-top2-backward-kernel](../../domainspec-core/research/triton-top2-backward-kernel)

## Construction boundary and remaining work

This navigation prototype extends the existing routing capability and business
ontology scaffold; it selects no target ontology records or runtime selectors.
Current product frontier: the explicit read-only route and this linked inventory.
Runnable construction work: validate registry integration and selected link bounds.
Operational owner: repository operator, for missing checkout restoration at the
future orchestrator-source selection stage. That is not required for inventory
construction. No credential, host, deployment, or runtime operation is authorized.

The previous missing-parent instruction blocker is addressed by the explicit
[checkout layout contract](LAYOUT.md). Candidate projections are rebuilt from
current authored inputs and checked by two independent replay runs. Focused
checks and replay remain navigation/construction evidence only; product approval
and operational authority remain ungranted.

## Open Questions

- Where is the runnable `cyberalchemy-orchestrator` checkout for this environment?
- Which exact VPS, Codex App Server installation, and Luna execution adapter should
  the Workspace/RWO/ARE continuation bind? This inventory establishes none.
- Should the operator restore the missing submodules, and which source revisions?
- Which additional checkout shapes, if any, need an explicit tested mapping?
- Which directory-only entries warrant source-owned identity indexing next?
