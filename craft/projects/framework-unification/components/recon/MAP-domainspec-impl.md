# MAP — implementation/domainspec (built engine)

The vrondelli/domainspec submodule: a spec-first pipeline framework that turns typed domain docs into governed, tested, observable code, plus its own Claude/Codex harness.

## Role in the three-pillar model

Maps to **DomainSpec** (the *what*) — its own root README calls it "specification-first... think first, code second," i.e. the built engine that authors typed intent (spec-layer taxonomy + vault graph schema) before code (inferred: parent CLAUDE.md names `implementation/domainspec/` as the DomainSpec pillar location directly).

## Top-level folders

| Folder | Contents |
|---|---|
| `.claude/` | Claude Code harness: agents, hooks, skills, settings (this repo's primary control surface) |
| `.agents/`, `.codex/`, `Codex/`, `claude/` | Codex-facing mirrors/adapters of skills + `current_conversations` state (inferred: dual-harness support) |
| `.arcanum/` | Arcanum runtime install artifacts — `necronomicon/`, `observability/`, `runtime/` |
| `.github/`, `.githooks/` | CI workflows and local git hooks |
| `.planning/` | GSD-style planning scratch (discovery-gate-wiring, research, subagents-strategy-regime-split) |
| `apps/` | Runnable apps (`web/`) built on the framework |
| `architecture/` | Architecture index + `pattern-library/` (layering, dependency rules, testing/observability alignment) |
| `backend/` | Backend implementation package (TS) |
| `copilot/` | Public reusable agent+skill distribution pack |
| `development/` | Dev workstreams (arcanum-integration, deterministic-test-derivation-engine, spec-conformance-validator) |
| `docs/` | Project docs: features, registry.json/md, glossary, signals, interviews, reviews |
| `domain_knowledge/` | `lean-code-validator` |
| `domainspec/` | Symlink shim exposing canonical framework files (ARCHITECTURE/RELATIONSHIPS/TAXONOMY/etc.) for submodule consumers |
| `examples/` | Worked examples (inventory-management, order-management, payment-processing, user-account) |
| `experiments/`, `research/` | Dated research/experiment logs (e.g. dual-residue-loss, subagents-strategy) |
| `framework/` | `observability/` notes |
| `governance/` | Code-tag schema, waivers, drift reports, tooling |
| `implementation/` (nested) | `GOVERNANCE-SIGNALS.md`, `app-frontend/` |
| `infra/` | Docker-compose, prometheus.yml, alert rules |
| `internal_tools/` | Vault platform: agents-telemetry, graph_retrieval, categorical_tooling_guard, convergence_runner, lean-code-validator |
| `plan/` | Product/program plans (VISION, TRACEABILITY, COMPLETENESS-DASHBOARD, agentic/) |
| `starter/` | Starter project (glossary.md, registry.md) |
| `subagents-strategy-standalone/` | Recently added standalone package (per parent repo's latest commit) |
| `telemetry/agents/` | `agent-pool.yaml`, `subagents-dispatch.yaml` |
| `templates/` | Canonical document templates for the pipeline |
| `tools/` | Validators/generators (TS + shell scripts) |
| `vault/` | Knowledge graph: constitution/, axiom/, premise/, discovery/, conceptual/, sessions/, snapshots/, amendments/, bets/ |

## Capability inventory

| Name | Kind | What it does | Path |
|---|---|---|---|
| domainspec-pipeline | skill | End-to-end orchestrator: plan→spec→stories→tests→implement→tag→ui→observability→infra→verify→signals in one command | `.claude/skills/domainspec-pipeline/SKILL.md` |
| domainspec-start | skill | Detect greenfield/brownfield scope, run discovery, init docs baseline | `.claude/skills/domainspec-start/` |
| domainspec-init | skill | Initialize DomainSpec docs structure + starter artifacts | `.claude/skills/domainspec-init/` |
| domainspec-interview-scope | skill | Interview project to discover domain scope, produce overview/definitions/decisions | `.claude/skills/domainspec-interview-scope/` |
| domainspec-spec-feature | skill | Create/evolve a feature SPEC using taxonomy+templates | `.claude/skills/domainspec-spec-feature/` |
| domainspec-sync-user-stories | skill | Generate/refresh STORIES.md from aspect docs | `.claude/skills/domainspec-sync-user-stories/` |
| domainspec-generate-tests | skill | Derive deterministic TEST-SPEC from DomainSpec artifacts | `.claude/skills/domainspec-generate-tests/` |
| domainspec-implement | skill | Build backend code from SPEC+TEST-SPEC; runs alignment/layering audits first if code exists | `.claude/skills/domainspec-implement/SKILL.md` |
| domainspec-tag-code | skill | Apply `@domainspec` source tags to code, validate extract/drift | `.claude/skills/domainspec-tag-code/` |
| domainspec-ui-pipeline | skill | Full per-feature UI pipeline: UI-SPEC→E2E tests→implement→audit | `.claude/skills/domainspec-ui-pipeline/` |
| domainspec-ui-architecture | skill | Define/evolve UI-ARCHITECTURE.md constitution, scaffold layout | `.claude/skills/domainspec-ui-architecture/` |
| domainspec-ui-implement | skill | Implement frontend pages/components from UI-SPEC | `.claude/skills/domainspec-ui-implement/` |
| domainspec-instrument-otel | skill | Instrument backend with OTel metrics from observability specs (inner loop) | `.claude/skills/domainspec-instrument-otel/` |
| domainspec-otel-verify | skill | Verify OTel coverage vs spec, produce OBSERVABILITY-REPORT.md (outer loop) | `.claude/skills/domainspec-otel-verify/` |
| domainspec-infra-architecture | skill | Define infra constitution (INFRA-ARCHITECTURE.md), scaffold IaC/CI/monitoring | `.claude/skills/domainspec-infra-architecture/` |
| domainspec-infra-deploy | skill | Generate/update deploy artifacts (Pulumi, compose, prometheus, alerts) | `.claude/skills/domainspec-infra-deploy/` |
| domainspec-sync-registry | skill | Sync global concept registry + glossary from feature SPEC tables | `.claude/skills/domainspec-sync-registry/` |
| domainspec-verify-feature | skill | Verify feature readiness from specs/tests/impl/alignment | `.claude/skills/domainspec-verify-feature/` |
| domainspec-readiness-gate | skill | Unified readiness gate (pilot/release-candidate/production profiles) | `.claude/skills/domainspec-readiness-gate/` |
| domainspec-pilot-readiness | skill | Prepare a feature for pilot testing via discovery-first updates | `.claude/skills/domainspec-pilot-readiness/` |
| domainspec-emit-signals | skill | Mandatory session epilogue: append structured signals to pipeline-signals.jsonl | `.claude/skills/domainspec-emit-signals/` |
| domainspec-signal-observer | skill | Async observer: derive behavior-level signals from telemetry bundles | `.claude/skills/domainspec-signal-observer/` |
| domainspec-reflect | skill | Outer-loop: analyze signals across runs, generate TUNING-REPORT.md, propose skill/agent changes | `.claude/skills/domainspec-reflect/` |
| domainspec-audit-alignment | skill | Audit implementation fidelity vs spec, produce ALIGNMENT-REPORT.md | `.claude/skills/domainspec-audit-alignment/` |
| domainspec-audit-layering | skill | Audit domain-layering drift, produce migration plan | `.claude/skills/domainspec-audit-layering/` |
| domainspec-brownfield-translation | skill | Translate an existing implemented project into DomainSpec as-is artifacts | `.claude/skills/domainspec-brownfield-translation/` |
| domainspec-context-builder | skill | Build minimal deterministic task context pack (selector-level retrieval) | `.claude/skills/domainspec-context-builder/` |
| domainspec-decision-gate | skill | Resolve/persist unresolved multi-option decisions before mutation | `.claude/skills/domainspec-decision-gate/` |
| domainspec-definitions-governance | skill | DomainSpec profile of definitions governance (canonical term upkeep) | `.claude/skills/domainspec-definitions-governance/` |
| domainspec-feature-glossary | skill | Create/evolve per-feature glossary | `.claude/skills/domainspec-feature-glossary/` |
| domainspec-implementation-axioms | skill | Non-negotiable implementer commitments, read before coding | `.claude/skills/domainspec-implementation-axioms/` |
| domainspec-interview-kits | skill | Structured one-question-at-a-time interviews (grill/readiness/audit-gap modes) | `.claude/skills/domainspec-interview-kits/` |
| domainspec-new-repo | skill | Scaffold a new DomainSpec consumer repo (sibling, not this one) | `.claude/skills/domainspec-new-repo/` |
| domainspec-orchestrate | skill | Unified NL entrypoint routing to specialist domainspec-* workflows | `.claude/skills/domainspec-orchestrate/` |
| domainspec-task-session | skill | Run one implementation-plan task as guided interactive session | `.claude/skills/domainspec-task-session/` |
| domainspec-help | skill | Command reference + recommended next step | `.claude/skills/domainspec-help/` |
| domainspec-*-phase-bridge / ui-audit-bridge (6 skills) | skill group | Bridge DomainSpec plan/execute/verify/UI steps to GSD phase workflow, normalize outputs back | `.claude/skills/domainspec-{plan,execute,verify,ui}-phase-bridge/`, `domainspec-ui-audit-bridge/` |
| domainspec-subagents-strategy | skill | Route subagent dispatch by type (research/review/experiment live) | `.claude/skills/domainspec-subagents-strategy/` |
| domainspec agents (22) | agent roster | Planner, implementer, verifier, orchestrator, context-builder, interviewer(+kits), spec-writer, story-sync, test-designer, task-executor, registry-sync, code-tagger, layering-auditor, alignment-auditor, otel-instrumenter/-verifier, infra-architect, ui-architect, l1/l2-extractor, delta-extractor, discovery-writer, vault-metadata-curator | `.claude/agents/domainspec-*.agent.md` |
| gsd-* (57 skills) | skill pack (vendored) | "Get Shit Done" — full parallel phase-based delivery workflow (new-project/milestone/phase, plan/execute/verify, debug, forensics, UI review, workstreams, backlog/todo/notes) imported wholesale; DomainSpec bridges into it rather than replacing it | `.claude/skills/gsd-*/`, engine at `.claude/get-shit-done/` |
| gsd agents (18) | agent roster | Researcher/planner/executor/verifier/debugger/roadmapper/UI-auditor family backing gsd-* skills | `.claude/agents/gsd-*.agent.md` |
| inject-domainspec-axioms.sh | hook (UserPromptSubmit) | Keyword-matches prompt (spec/plan/implement/infra, EN+PT) and injects the 3 non-negotiable AX-DS axioms as context | `.claude/hooks/inject-domainspec-axioms.sh` |
| spec-validate.sh | hook (PostToolUse on Write/Edit) | Fail-closed: on any `docs/features/**/*.md` write, runs the canonical-form linter (`test-derivation-engine lint`) and surfaces violations | `.claude/hooks/spec-validate.sh` |
| frontmatter cheatsheet hook | hook (PreToolUse on Write/Edit `*.md`) | Injects frontmatter schema/allowed-values as additionalContext before any markdown write (documented in `.claude/README.md`; not present as a literal PreToolUse block in current `.claude/settings.json` — see Open Questions) | `.claude/settings.json`, `.claude/README.md` |
| validate-signals / detect-signals / analyze-signals | tool (ts) | Signal schema conformance, deterministic artifact-level detection, threshold-triggered pattern analysis | `tools/*.ts` |
| validate-governance-chain / validate-orphans / validate-relationships | tool (ts) | Source/sync chain check, orphan `@biz`/`@sys` anchor check, edge-catalog conformance | `tools/*.ts` |
| validate-doc-links / check_markdown_links.sh / check_docs_sync.sh | tool | Link and doc-sync integrity gates | `tools/*` |
| build-telemetry-bundle.ts | tool | Assembles full-trace telemetry bundle feeding the async observer | `tools/build-telemetry-bundle.ts` |
| generate-registry.ts / generate-meta-health.ts | tool | Rebuild docs/registry.json+md; compute governance health metrics M-001..M-006 | `tools/*.ts` |
| prune-governance.ts / governance-attenuation-audit.ts | tool | Via-Negativa rule pruning by evidence; attenuation audit | `tools/*.ts` |
| validate-tuning-report.ts / validate-work-pack-coverage.ts | tool | Structural checks on TUNING-REPORT.md and work-pack task coverage | `tools/*.ts` |
| code-tags:extract/validate/composability/drift | pnpm scripts (governance) | Extract `@domainspec` code tags, validate against schema+waivers, check composability, compare drift | `package.json` scripts → `governance/tags/tools/*.ts` |
| close-session | skill | Triage session, write summary, delegate frontmatter classification, create vault conversation node | `.claude/skills/close-session/SKILL.md` |
| other shared skills (~15) | skill group | check-tension, engineer-view, ontology-view, system-view, research, review, robot-talks, experiment, scratchpad, create-skill, commit-message, gitnexus(+copy), implement-filter, test-uncommitted-changes — shared with parent-repo Arcanum catalog, not DomainSpec-specific | `.claude/skills/{check-tension,engineer-view,...}/` |

## Key ideas / vocabulary

- **Meta-concept taxonomy** — 25 typed building blocks (14 backend + 11 UI) every domain concept maps to exactly one of (`TAXONOMY.md`; note: root README states "24 meta-types" — versions disagree, see Open Questions).
- **Relationship catalog** — 29 typed edges (15 backend, 8 intra-UI, 6 cross-layer) connecting concepts into a navigable graph (`RELATIONSHIPS.md`; root README says "26" — same drift).
- **Vault graph schema** — 22 forward edge types (epistemic/provenance/reference) governing the knowledge-graph layer, distinct from the spec-layer taxonomy above.
- **AXIOMS → CONSTITUTION → gates chain** — 6 epistemic axioms (A1–A6) derive 11 constitution rules (C1–C11), each bound to a concrete deterministic gate (e.g. `validate-signals`, layering audit).
- **Dual-phase observation** — fast/blocking observer (in-pipeline, deterministic detectors) vs async/deep observer (post-session, telemetry-bundle-based) — Axiom A4.
- **Tuning loop** — sync pipeline emits signals → async GitHub Action analyzes thresholds → `domainspec-reflect` produces TUNING-REPORT.md → human approves → skills/agents improve.
- **AX-DS-1/2/3** — implementation axioms: spec is source (code is compiled image), one vocabulary across spec/code, no orphan behavior.
- **Code tags** — `@biz`/`@sys` (constitution) / `@domainspec:...` (governance folder) source annotations binding code to spec concepts.

## Entry / orientation docs

- `README.md` — root navigation, links every top-level doc and folder (68KB, primary orientation). |
- `CLAUDE.md` / `AGENTS.md` — near-identical agent context router (route table); `AGENTS.md` targets a `.Codex/skills` path variant, suggesting Codex is the secondary harness.
- `AUTHORITY-MAP.md` — canonical-source table resolving which doc wins when two describe the same thing.
- `.claude/README.md` — harness contract: documents the frontmatter PreToolUse hook and hook inspection commands.
- `architecture/ARCHITECTURE.md` — index-only pointer into `architecture/pattern-library/`.

## Status floor

Built and operating: the skill/agent catalog (~148 skills, 40 agents), hooks, tools/validators, vault, and CHANGELOG (at v2.1.0 per header) show a maintained, versioned, in-use framework — not a paper design. Signals files (`docs/signals/pipeline-signals.jsonl`) and telemetry (`telemetry/agents/`) are present with real content, evidencing actual runs (inferred: file presence, not read for volume). Some pieces read as aspirational/working-notes by their own naming: `PRODUCT-COMPONENTS-IDEA.md`, `TOBANOV.md` ("working notes"), `PHASED-PLAN.md`, `plan/` (product/vision docs) — these sit above the built engine, not part of it.

## Git state

- Remote: `https://github.com/vrondelli/domainspec.git`
- Branch: detached-looking `git branch --show-current` returned empty, but HEAD matches `origin/main`/`origin/HEAD` exactly (no divergence)
- HEAD: `6418420d` (full: `6418420d6d6d8e9e0a0cd909a388dae765f2b1d1`), committed 2026-07-02T21:27:19-03:00
- Working tree: clean (`git status --short` empty)

## Open questions

- Taxonomy/relationship counts disagree between root `README.md` ("24 meta-types, 26 relationships") and the canonical files themselves (`TAXONOMY.md` says 25; `RELATIONSHIPS.md` says 29) — likely README staleness, not re-verified here.
- `.claude/settings.json` in this checkout carries permissions and a PostToolUse hook that reference an unrelated project (`internal_tools/creative_analysis_harnessing`, `labeling_platform`) rather than domainspec's own tooling, and shows no `PreToolUse` block despite `.claude/README.md` documenting one as active — the settings file may be stale/copied from a different repo checkout, or the PreToolUse hook has since been removed without updating the README (not resolved here; PreToolUse doc claim not verified against the actual file).
- Relationship between `domainspec/` (symlink shim), `implementation/` (nested, distinct from this repo's own path), and the root-level canonical files was inferred from README prose, not exhaustively traced.
- GSD ("Get Shit Done", 57 skills + 18 agents) is fully vendored inside `.claude/` — unclear whether it's forked/customized here or a stock import; not diffed against upstream.
- `.data/`, `framework/`, `development/`, `experiments/`, `research/` top-level folders were only listed one level deep — contents not characterized beyond filenames.
