# MAP — domainspec (../domainspec, cyberAlchemyAI)

DomainSpec is a spec-first, agent-driven delivery framework (taxonomy + relationships + templates + pipeline agents/skills) that turns domain docs into tests, code, UI, observability, and infra with traceability at every stage.

## Relationship to implementation/domainspec (vrondelli)

**Finding: this is the same repository, not a fork, successor, or divergent branch.** `../domainspec` (remote `cyberAlchemyAI/domainspec`) and the `implementation/domainspec` submodule (remote `vrondelli/domainspec`) share one linear commit history from the same initial commit (`fce5bdf "Initial commit: DomainSpec framework, agents, and README workflow"`) through to `4ea9fea`. At that point:

- `git merge-base` of the two HEADs = `4ea9feacf9b6bb064e21eeab4e020065d2627e07` — exactly `../domainspec`'s HEAD.
- The submodule (vrondelli) is exactly **one commit ahead**: `6418420 "feat: add standalone subagents-strategy package"` (matches domainspec-core's own last bump commit "add subagents-strategy standalone package").
- No divergent commits exist on either side — a strict fast-forward, not a merge or rewrite.
- Same author/license: `LICENSE` (BSL 1.1) names "Vladimir Rondelli" as licensor, matching the `vrondelli` GitHub handle.
- README, CLAUDE.md, taxonomy/relationship counts, and root doc set are byte-identical between the two clones (verified on README first ~40 lines and full nav list).

Working theory (inferred): `cyberAlchemyAI/domainspec` is a second git remote for the *same* local project — most likely an org-account mirror/backup of the personal `vrondelli/domainspec` repo — kept one push behind. It is **not** a separately-evolving sibling; treat any content difference as staleness, not intentional divergence. `git remote show origin` also lists extra branches (`chore/fresh-baseline-reset-2026-05-03`, `codex/goldenquill-promotion-governance`, `vault/subagents-topologies-feature-discovery-format`) not checked for divergence here (see Open Questions).

## Role in the three-pillar model

Same role as `implementation/domainspec` itself: the **DomainSpec pillar** (the "what" — typed intent), per domainspec-core's CLAUDE.md framing — because the content is identical, not a distinct pillar or product (inferred from the relationship finding above).

## Top-level folders

| Folder | Contents |
|---|---|
| `.claude/` | Claude Code harness: 40 agents, 116 skills (domainspec-*, gsd-*, custom, gitnexus, governance) |
| `Codex/`, `claude/` | Legacy Codex command adapters + `current_conversations/` session exports |
| `apps/` | `web` — runnable frontend app |
| `architecture/` | Framework architecture doc + pattern library |
| `backend/` | Backend implementation package (src, tsconfig) |
| `copilot/` | Public-facing GitHub Copilot distribution pack — 19 agents, 38 skills, installer |
| `docs/` | Project docs: registry, glossary, 12 features, discovery, interviews, signals |
| `domain_knowledge/` | `lean-code-validator` domain package |
| `domainspec/` | Symlink shim re-exposing framework files for submodule consumers |
| `examples/` | 5 worked vertical-slice feature examples |
| `experiments/` | Dated experiment folder (dual-residue-loss) |
| `governance/` | Code-tag schema, drift reports, waivers |
| `implementation/` | Governance-signals doc + `app-frontend` |
| `infra/` | Docker compose, prometheus, alerts |
| `internal_tools/` | Vault platform — 9 Python subsystems + kernel |
| `plan/` | Vision, pitch scripts, completeness dashboard, traceability |
| `research/` | Dated research logs incl. `subagents-strategy` (17 sessions), system-theory |
| `starter/` | Starter glossary/registry for new consumer projects |
| `templates/` | 37 canonical doc templates |
| `tools/` | ~20 validation/generation scripts + vendored `arcanum` runtime resolver binary |
| `vault/` | Knowledge graph: 19 constitutions, 5 axioms, 9 premises, 45 discovery families, 91 sessions |

## Capability inventory

| Name | Kind | What it does | Path |
|---|---|---|---|
| domainspec-orchestrator | agent | Single user-facing intent router for the whole pipeline | `.claude/agents/domainspec-orchestrator.agent.md` |
| domainspec-planner | agent | Converts goals into dependency-ordered plans | `.claude/agents/domainspec-planner.agent.md` |
| domainspec-spec-writer | agent | Authors/evolves feature specs (SPEC + aspects + stories) | `.claude/agents/domainspec-spec-writer.agent.md` |
| domainspec-test-designer | agent | Derives TEST-SPEC + Playwright E2E from docs | `.claude/agents/domainspec-test-designer.agent.md` |
| domainspec-implementer | agent | Implements backend code from contracts | `.claude/agents/domainspec-implementer.agent.md` |
| domainspec-ui-architect | agent | Frontend architecture + UI-SPEC + build + audit | `.claude/agents/domainspec-ui-architect.agent.md` |
| domainspec-infra-architect | agent | Infra constitution + IaC/CI/monitoring scaffold | `.claude/agents/domainspec-infra-architect.agent.md` |
| domainspec-verifier | agent | PASS/FLAG/BLOCK feature readiness verdict | `.claude/agents/domainspec-verifier.agent.md` |
| domainspec-otel-instrumenter/-verifier | agent (2) | Instruments + audits OTel metric coverage | `.claude/agents/domainspec-otel-*.agent.md` |
| domainspec-alignment-auditor / layering-auditor | agent (2) | Docs-vs-code fidelity + domain-logic-drift audits | `.claude/agents/domainspec-*-auditor.agent.md` |
| domainspec-l1-extractor / l2-extractor / delta-extractor | agent (3) | Layered extraction agents for vault/ontology processing | `.claude/agents/domainspec-l*-extractor.agent.md` |
| mars-researcher | agent | Investigates implementation decisions via domain navigation | `.claude/agents/mars-researcher.agent.md` |
| gsd-* agent family | agent (19) | "Get Stuff Done" phase-based planning/execution/audit agents (planner, executor, roadmapper, debugger, ui-checker, etc.) | `.claude/agents/gsd-*.agent.md` |
| domainspec-pipeline | skill | End-to-end plan→spec→test→impl→UI→observe→infra→verify orchestration | `.claude/skills/domainspec-pipeline` |
| domainspec-orchestrate / -start | skill (2) | NL intent routing + brownfield/greenfield discovery entrypoint | `.claude/skills/domainspec-{orchestrate,start}` |
| domainspec-spec-feature / -feature-glossary / -implementation-layering | skill (3) | Feature spec, glossary, POC-layering authoring | `.claude/skills/domainspec-*` |
| domainspec-generate-tests | skill | Derives backend TEST-SPEC + E2E scaffolds | `.claude/skills/domainspec-generate-tests` |
| domainspec-implement / -tag-code | skill (2) | Backend implementation + source code tagging/drift check | `.claude/skills/domainspec-{implement,tag-code}` |
| domainspec-ui-pipeline / -ui-architecture / -ui-implement | skill (3) | Full UI lifecycle: spec, arch constitution, build | `.claude/skills/domainspec-ui-*` |
| domainspec-infra-architecture / -infra-deploy | skill (2) | Infra constitution authoring + IaC/prometheus/alerts sync | `.claude/skills/domainspec-infra-*` |
| domainspec-verify-feature / -readiness-gate / -pilot-readiness | skill (3) | Readiness verdicts, profile-based gates | `.claude/skills/domainspec-{verify-feature,readiness-gate,pilot-readiness}` |
| domainspec-audit-alignment / -audit-layering | skill (2) | Deterministic drift/migration audits | `.claude/skills/domainspec-audit-*` |
| domainspec-subagents-strategy | skill | Governs subagent dispatch routing + constitution (v0.4.0-draft present) | `.claude/skills/domainspec-subagents-strategy` |
| domainspec-brownfield-translation | skill | Translates an already-built project into DomainSpec artifacts | `.claude/skills/domainspec-brownfield-translation` |
| gsd-* skill family | skill (~60) | Full phase/milestone/workspace lifecycle (plan-phase, execute-phase, debug, ui-review, forensics, workstreams, etc.) | `.claude/skills/gsd-*` |
| gitnexus-* skill family | skill (6) | Codebase exploration/refactoring/impact-analysis via a GitNexus MCP tool (referenced, not verified installed) | `.claude/skills/gitnexus-*` |
| custom/* skill fragments | skill (~20) | House-style writing/tagging conventions (frontmatter, edges, domain-tagging, discovery-writing) | `.claude/skills/custom/*` |
| vault_common / vault_ctl / vault_telemetry | tool (3) | Vault kernel + invariant enforcement CLI + residue-counter metrics | `internal_tools/vault_*` |
| convergence_runner | tool | Multi-agent dispatch with structured logging / lens-experiment replay | `internal_tools/convergence_runner` |
| graph_retrieval | tool | Two-layer typed-edge subgraph retrieval prototype | `internal_tools/graph_retrieval` |
| categorical_tooling_guard | tool | Gate-1 CLI wrapping `audit_richness.py` → pass/flag/block | `internal_tools/categorical_tooling_guard` |
| tower_explorer | tool | Gate-0 structural checker for vault-style knowledge graphs | `internal_tools/tower_explorer` |
| agents-telemetry | tool | Agent-activity telemetry pipeline | `internal_tools/agents-telemetry` |
| tools/*.ts validation scripts | tool (~20) | Doc-link, orphan, relationship, signal, work-pack-coverage, governance-chain validators + registry/telemetry generators | `tools/*.ts` |
| tools/arcanum | tool | Vendored single-file Arcanum runtime resolver binary | `tools/arcanum` |
| test-derivation-engine | tool/subsystem | Deterministic doc→test derivation engine (L0-L4, self-derive fixpoint) — active development track | `tools/test-derivation-engine`, `development/deterministic-test-derivation-engine` |
| copilot pack | distribution | 19 agents + 38 skills + installer, mirrors core pack for GitHub Copilot consumers | `copilot/` |
| architecture pattern library | reference asset | Reusable architecture pattern catalog | `architecture/pattern-library` |
| 5 worked examples | reference asset | payment-processing, order-management, inventory-management, user-account, shared | `examples/` |
| 37 templates | reference asset | Canonical per-aspect doc templates (SPEC, states, operations, UI-SPEC, infra, observability, etc.) | `templates/` |

## Key ideas / vocabulary

- **Spec-layer taxonomy** — 24 meta-types (13 backend + 11 UI) classifying concepts inside one feature spec.
- **Vault graph schema** — 22 forward edge types (epistemic/provenance/reference) governing cross-artifact knowledge relations, distinct from the spec-layer taxonomy.
- **Vertical slice** — a feature directory holding only the aspect docs (`domain.md`, `operations.md`, `states.md`, etc.) that feature needs.
- **TOBANOV** — working-notes concept for cross-component invariants (`TOBANOV.md`, not yet formalized).
- **ADLC** — Agentic Delivery Lifecycle; DomainSpec's external convergence target (`ADLC-ALIGNMENT.md`).
- **GSD ("Get Stuff Done")** — a parallel phase/milestone/workspace execution layer bolted alongside the DomainSpec pipeline (own agent + skill family, ~60 skills).
- **Governance attenuation** — a model for relaxing/escalating governance strictness (`GOVERNANCE-ATTENUATION.md` + execution board).

## Entry / orientation docs

- `README.md` — pipeline overview, quick start, full command/agent reference (primary orientation doc).
- `CLAUDE.md` — this repo's own agent context router (distinct persona/rules from domainspec-core's CLAUDE.md, though structurally similar — "radical candor," mandatory route-first step).
- `AGENTS.md` — agent roster with GitNexus/vault-routing MCP standing rules.
- `AUTHORITY-MAP.md` — canonical source map per subsystem.
- `internal_tools/README.md` — vault platform architecture (kernel + subsystems).

## Status floor

Built: full pipeline agent/skill set, taxonomy/relationship docs, templates, 5 worked examples, vault kernel + CLIs (vault_ctl, vault_telemetry), copilot distribution pack, test-derivation-engine (L0-L4 deterministic core, per commit log). CHANGELOG at v2.1.0.
Designed/aspirational: README's own ADLC-ALIGNMENT summary self-reports gaps — L3 governance "scattered," L4 axioms "implicit," L5 navigation "file-based, no queryable graph," L6 enforcement "manual, no pre-commit hooks" — i.e., the framework's own maintainers flag governance/enforcement automation as not yet closed.

## Git state

Remote: `https://github.com/cyberAlchemyAI/domainspec.git` (origin, fetch=push). Branch: `main`. HEAD: `4ea9fea` (2026-07-01), one commit behind `vrondelli/domainspec`'s `6418420` (2026-07-02). Working tree clean. Other remote branches present but not diff-checked: `chore/fresh-baseline-reset-2026-05-03`, `codex/goldenquill-promotion-governance`, `vault/subagents-topologies-feature-discovery-format`.

## Open questions

- Is `cyberAlchemyAI/domainspec` a manual dual-push mirror or an automated sync (e.g., CI mirroring vrondelli → org)? Not evidenced either way here.
- Visibility (public vs private) of `cyberAlchemyAI/domainspec` was not checked (no `gh` CLI available in this environment) — matters directly for the "never leak private prose" boundary if the org repo is public while the framework content is BSL 1.1 / non-commercial.
- Three org-only branches (`codex/goldenquill-promotion-governance`, `vault/subagents-topologies-feature-discovery-format`, `chore/fresh-baseline-reset-2026-05-03`) were not compared against `vrondelli`'s branches — could contain genuinely divergent work not present in the submodule.
- `claude/current_conversations/` and `Codex/current_conversations/` hold exported session transcripts committed to the repo — worth confirming these don't carry sensitive content before any public exposure.
- Relationship of the embedded `gsd-*` (~60 skills, 19 agents) system to the DomainSpec pipeline proper is not fully mapped here — it reads as a second, parallel execution framework layered into the same repo rather than a DomainSpec-native concept.
