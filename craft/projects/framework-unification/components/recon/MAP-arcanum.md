# MAP — Arcanum (../Arcanum sibling)

The public sigil/spell/skill catalog and governance framework repo — reusable agent capabilities plus the method, quality bar, observability, and experiment-harness machinery that govern them.

## Role in the three-pillar model

Maps to **Arcanum** (the *how*) — its own `README.md` opens "Arcanum is a framework for creating reusable agent capabilities through governed synthesis," matching parent CLAUDE.md's framing of Arcanum as sigils/spells and the only pillar meant to be public.

## Top-level folders

| Folder | Contents |
|---|---|
| `arcana/` | 37 folders — autonomous orchestration sigils (heaviest tier) |
| `spells/` | 15 folders — multi-sigil workflow compositions |
| `formulae/` | 3 folders — deterministic operational sigils |
| `transmutations/` | 4 folders — bounded cognitive-synthesis sigils |
| `registry/` | `SIGILS.md`, `SPELLS.md`, `PACKS.md` — promoted-capability catalogs |
| `definitions/` | `DEFINITIONS.md` (65 terms), `-INDEX.md`, `TAXONOMY.md`, `RELATIONSHIPS.md`, `DEFINITION-DRIFT-AUDIT.md` |
| `disciplines/` | Catalog (23 cards) + schema/templates/scripts for cross-capability practices |
| `framework/` | Method, quality bar, anti-patterns, constitutions, `observability/`, `runtime/`, `templates/` |
| `telemetry/agents/` | `subagents-dispatch.yaml` — dispatch ledger |
| `tools/` | `arcanum` CLI resolver, bootstrap/install scripts, validators |
| `docs/` | Public GitHub Pages site (method/system/craft/registry HTML) |
| `development/` | Cross-cutting dev workstreams (craft, ontology-lifecycle, refinement-runs, session-handoffs, user-guide) |
| `research/` | Theory/proofs backing capabilities (category theory, Shannon secrecy, dispatch-composition-attack, ontology-vault-branching proof) |
| `extraction-research/` | Pre-authoring source notes for 9 sigils (mined before conversion to sigil form) |
| `projects/ui-prototyping-studio/` | Standalone product build (backend code, session-state spec) — not a capability, see Open Questions |
| `benchmark/`, `output/`, `writing/` | Experiment harness fixtures/artifacts; generated presentations; Substack drafts |
| Root docs | `README.md`, `CLAUDE.md`, `BUSINESS-ONTOLOGY.md`, `CRAFT.md`, `DECISIONS.md`, `TO-DEVS.md`, `AGENT-FRAMEWORK-IMPROVEMENTS.md`, `FRIEND-INSTALL-TUTORIAL.md` |

## Capability inventory

Registry-listed unless marked `*` (folder exists, used elsewhere, absent from `registry/SIGILS.md`/`SPELLS.md`).

| Name | Kind | What it does | Path |
|---|---|---|---|
| observability-setup | sigil-formulae | Installs/verifies repo-local telemetry package (JSONL ledgers, reflection state) | `formulae/observability-setup` |
| dispatch-spec* | sigil-formulae | Validates/designs dispatch routes chaining sigils, spells, owners, gates, techniques | `formulae/dispatch-spec` |
| anti-bias-vector-composition* | sigil-formulae | Designs pairwise-opposed agent angle sets so correlated bias cancels under composition | `formulae/anti-bias-vector-composition` |
| context-builder | sigil-transmutation | Compact task-ready context packs from selector-level evidence | `transmutations/context-builder` |
| codex-goal-profile | sigil-transmutation | Turns a work-pack task/SWU into a native Codex `/goal` profile | `transmutations/codex-goal-profile` |
| feature-glossary | sigil-transmutation | Scoped vocabulary glossary with source links, no global authority | `transmutations/feature-glossary` |
| implementation-layering | sigil-transmutation | Stages implementation from smallest proof to progressive hardening | `transmutations/implementation-layering` |
| architecture-pattern-inventory | sigil-arcana | Maps repo architecture into concept/relationship cards + dependency rules | `arcana/architecture-pattern-inventory` |
| constitution-governance | sigil-arcana | Creates/selects/composes/promotes modular constitutions | `arcana/constitution-governance` |
| craft | sigil-arcana | Recursive project ledger: contexts, blockers, gaps, decisions, next moves | `arcana/craft` |
| definitions-governance | sigil-arcana | Canonical definitions, three-voice interpretation, drift checks | `arcana/definitions-governance` |
| decision-gate | sigil-arcana | Resolves blocker-level multi-option decisions, persists record | `arcana/decision-gate` |
| discipline-governance | sigil-arcana | Formalizes/routes/promotes/retires disciplines; owns the disciplines-layer lifecycle | `arcana/discipline-governance` |
| distill | sigil-arcana | Reduces a broad model/plan to the smallest coherent recomposable unit | `arcana/distill` |
| experiment-harness | sigil-arcana | Profile-aware fixture/validation loops for sigil/spell promotion evidence | `arcana/experiment-harness` |
| github-project-issue-loop | sigil-arcana | Claims a GitHub Project issue → refine → invoke → task-session → PR + board sync | `arcana/github-project-issue-loop` |
| inventory | sigil-arcana | Repo-local compiled knowledge store: ingest, index, tag, lint, lookup | `arcana/inventory` |
| ontology-vault | sigil-arcana | Governed vault: sessions, premises, confidence promotion, business/system branches | `arcana/ontology-vault` |
| residuality-spec | sigil-arcana | Stressor/residue/degradation/attractor analysis for resilient specs | `arcana/residuality-spec` |
| refine | sigil-arcana | Discovery/design refinement loop via Codex Goal + deterministic dispatch | `arcana/refine` |
| robot-talks | sigil-arcana | Multi-agent investigation for cross-layer contradictions | `arcana/robot-talks` |
| scope-interview | sigil-arcana | Interviews greenfield/brownfield scope into a discovery baseline | `arcana/scope-interview` |
| signal-observer | sigil-arcana | Derives behavior-level telemetry signals from a completed sigil run | `arcana/signal-observer` |
| sigil-development | sigil-arcana | Governed sigil lifecycle: create, validate, observe, reflect, iterate | `arcana/sigil-development` |
| sigil-runtime-installer | sigil-arcana | Installs Copilot/Claude/Codex runtime adapters for sigils | `arcana/sigil-runtime-installer` |
| skill-decomposer | sigil-arcana | Extracts one reusable capability from a tangled/mixed source | `arcana/skill-decomposer` |
| skill-transcriptor | sigil-arcana | Converts a coherent existing skill into an Arcanum-compliant sigil package | `arcana/skill-transcriptor` |
| spellcraft | sigil-arcana | Designs/validates/observes/revises spells composing multiple sigils | `arcana/spellcraft` |
| structured-interview-kits | sigil-arcana | Pluggable one-question-at-a-time interview modes (alias: interrogation) | `arcana/structured-interview-kits` |
| task-session | sigil-arcana | Executes one bounded task: trade-offs, gates, done criteria, evidence | `arcana/task-session` |
| ux-evidence-validator | sigil-arcana | UX/accessibility/Playwright evidence into calibrated hard gates + risk flags | `arcana/ux-evidence-validator` |
| ux-lessons | sigil-arcana | Turns a UI iteration session into typed lessons + reusable ux-pattern cards | `arcana/ux-lessons` |
| workflow-reflect | sigil-arcana | Analyzes accumulated telemetry into workflow improvement proposals | `arcana/workflow-reflect` |
| x-ray | sigil-arcana | Turns supplied context into a guided HTML explanation page | `arcana/x-ray` |
| audit-alignment* | sigil-arcana | Audits implementation fidelity vs a spec, classified alignment report | `arcana/audit-alignment` |
| code-tag-audit* | sigil-arcana | Deterministic code↔spec traceability: extract/validate/drift on source tags | `arcana/code-tag-audit` |
| invoke-example-runner* | sigil-arcana | Selects/runs invoke-template validation prompts through Codex, saves output | `arcana/invoke-example-runner` |
| observability-derivation* | sigil-arcana | Derives a typed metric-obligation inventory from spec aspect docs | `arcana/observability-derivation` |
| research-evidence-harness* | sigil-arcana | Converts research protocols into validated run schemas, JSONL fixtures, metrics | `arcana/research-evidence-harness` |
| research-tower* | sigil-arcana | Turns a paper/corpus/question into a governed research tower with source-first claims | `arcana/research-tower` |
| sync-user-stories* | sigil-arcana | Generates story-driven STORIES from spec aspect docs with coverage matrix | `arcana/sync-user-stories` |
| test-derivation* | sigil-arcana | Deterministically derives a test-obligation spec from feature aspect docs, no LLM in path | `arcana/test-derivation` |
| verification-weaver* | sigil-arcana | Routes verification targets to evidence owners, joins into one VERIFICATION-WEAVE receipt | `arcana/verification-weaver` |
| integration-spec* | sigil-arcana (design-stage) | Only `development/` exists — no SKILL.md/README yet | `arcana/integration-spec` |
| arcanum-bootstrap | spell | Installs Arcanum into a consuming repo (sigils/spells/observability/runtime adapters) | `spells/arcanum-bootstrap` |
| repository-harness | spell | Installs inventory + architecture-pattern-inventory + context-builder together | `spells/repository-harness` |
| ontology-harness | spell | Composes inventory + ontology-vault + context-builder into ontology governance | `spells/ontology-harness` |
| necronomicon | spell | Repo-local knowledge harness: inventory/ontology substrate loop, session memory, routing | `spells/necronomicon` |
| implementation-readiness | spell | implementation-layering + decision-gate + task-session chained | `spells/implementation-readiness` |
| discovery-to-inventory | spell | scope-interview + feature-glossary + inventory chained | `spells/discovery-to-inventory` |
| whisper | spell | Author intent → governed text: substrate, SCU selection, drafting, residue | `spells/whisper` |
| reading-learning-package | spell | research-tower output → reader-facing learning package (HTML/PDF) | `spells/reading-learning-package` |
| sigil-maintenance-loop | spell | signal-observer + workflow-reflect + sigil-development chained | `spells/sigil-maintenance-loop` |
| observed-invocation-loop | spell | Wraps managed invocations with guaranteed telemetry + reflection routing | `spells/observed-invocation-loop` |
| goal | spell | Autonomous fail-closed DAG loop over a Craft frontier: route, gate, stage, promote-on-approval only | `spells/goal` |
| invoke* | spell | Turns dev intent into governed define/design/plan/handoff/refresh/full/validate artifacts | `spells/invoke` |
| guide-architecture* | spell | Guides a user through a software architecture target (context→structure→explain→validate) | `spells/guide-architecture` |
| publication-research-pipeline* | spell (draft candidate, not promoted) | Research question → source understanding → evidence → claim adjudication → paper package | `spells/publication-research-pipeline` |
| tower-research-program* | spell (design-stage) | Only `development/` exists — no README/SKILL.md yet | `spells/tower-research-program` |
| tools/arcanum | tool (CLI) | Deterministic resolver/validator/handoff/legacy-adapter bash script (534 long lines) | `tools/arcanum` |
| subagents-dispatch.yaml | ledger | Append-only dispatch record (register-dispatch pattern), same shape as domainspec-core's | `telemetry/agents/subagents-dispatch.yaml` |
| disciplines catalog | catalog (long tail, 23 cards) | craft, planning, schema, dispatch, observability, quality-bar, validation-experiment, decision-gating, interview, ontology, residuality, ux-evidence, receipt-id-legend, gitignore, runtime-boundary, context-selection, distillation, evidence-inventory, artifact-constitution, research-evidence, development-package-promotion-gate + 2 more | `disciplines/DISCIPLINES.md`, `disciplines/cards/` |

## Key ideas / vocabulary

- **sigil / spell / tier** (formulae / transmutations / arcana) — one reusable capability vs. a multi-sigil composition, tiered by epistemic nature (deterministic → bounded-synthesis → autonomous).
- **CyberAlchemy Method** — five anchors every governed run keeps visible: Objective, Output artifact, Discovery, Tension, Route.
- **contract** (`DEF-ARC-CONTRACT`) — the behavioral/authority agreement a capability, route, or artifact must satisfy beyond schema validity.
- **discipline** — a cross-capability recurring practice with a card, steward, evidence, and hardening route; does not itself claim sigil/spell authority (new-ish first-class layer, see Open Questions).
- **necronomicon substrate loop** — "Inventory And Ontology Substrate Loop": classify output as source-backed fact / candidate / contradiction / gap; no-promotion guardrail keeps Necronomicon from self-promoting knowledge.
- **goal / DAG loop** — fail-closed Craft-frontier control loop; stages ledger deltas, mutates only behind an explicit approval token.
- **observability envelope / signal / reflection** — per-run JSONL telemetry feeding threshold-triggered reflection reports.
- **quality bar / anti-pattern** — observable success criteria and named misuse cases every capability is checked against.

## Entry / orientation docs

- `README.md` — primary orientation: method, capability model, registry, lifecycle, install instructions.
- `CLAUDE.md` — routes Claude Code to `.claude/skills/orchestrate/SKILL.md` (generated) and states the `dispatch-spec` / `invoke` / `task-session` / `tools/arcanum` boundary lines verbatim (matches this repo's CLAUDE.md digest).
- `framework/CYBERALCHEMY-METHOD.md` — the working philosophy (five anchors).
- `registry/SIGILS.md`, `registry/SPELLS.md` — the promoted-capability catalogs (primary source for this map's registered rows).
- `docs/` — public GitHub Pages mirror (method.html, system.html, craft.html, registry.html).

## Status floor

Built and in real use: 27 registered sigils + 11 registered spells, each with README + SKILL.md + Quality Bar/Anti-Patterns per the registry's own Entry Requirements; the definitions tower (65 terms, index, taxonomy, relationships, drift-audit — 1,243 lines across 4 files); the observability package (12 shell scripts, ledgers, reflection state, real refinement-run evidence under `framework/observability/development/`); `tools/arcanum` as a working CLI. Designed-but-unregistered: 10 arcana sigils and 4 spells exist as folders (some with only `SKILL.md`, no `README.md`) and are absent from the registry tables despite active use elsewhere (`dispatch-spec` and `invoke` are load-bearing per CLAUDE.md and the `necronomicon`/`goal` spells). Pure design-stage (no SKILL.md/README at all yet): `integration-spec` and `tower-research-program` — only `development/` scaffolding. Disciplines catalog is explicitly `Status: candidate` at the catalog level, with individual cards ranging candidate → active-pattern → canonical → implemented. `projects/ui-prototyping-studio/` is a real running product build (backend code, session-state machine) — not itself a capability, and its own README says it was "extracted from the now-deprecated `domainspec` monorepo," which is a public/private-boundary flag, not resolved here.

## Git state

- Remote: `https://github.com/cyberAlchemyAI/Arcanum.git`
- Branch: `main`
- HEAD: `e4d3b5d` — "skill(close-session): add ZefraHub close-session workflow" (2026-07-01 22:28:46 -03:00)
- Working tree: one untracked file, `TO-VLAD/TO-VLAD9.md`; otherwise clean.

## Open questions

- **Registry lag is material, not marginal.** Counting folders vs. registry tables: ~27% of spell folders (4/15) and ~27% of arcana sigil folders (10/37) are unregistered, plus 2 of 3 formulae sigils (`dispatch-spec`, `anti-bias-vector-composition`) — including capabilities named as load-bearing boundaries in Arcanum's own `CLAUDE.md` (`dispatch-spec`, `invoke`). Registry promotion appears to be a real bottleneck, not an oversight in one tier.
- **`ui-prototyping-studio` sits inside the public repo as a real product build**, self-described as extracted from "the now-deprecated `domainspec` monorepo" — worth a direct check against this repo's public/private boundary rule (never leak private prose into `arcanum/`); not resolved here, just flagged for the owner.
- **Several arcana sigils carry DomainSpec-flavored names and descriptions** (`audit-alignment`, `code-tag-audit`, `observability-derivation`, `sync-user-stories`, `test-derivation` — all describe operating on "a DomainSpec spec's aspect docs") while living in the public Arcana tier. Unclear whether "DomainSpec" here is generic terminology or an actual dependency on the private DomainSpec pillar's artifact shape; not traced further.
- **Reconciliation vs. `CAPABILITY-CENSUS.md`** (dispatch `2026-06-18`, ~13 days before this HEAD): the census's capability→axis mapping still holds — no owner it names has disappeared, and its explicit "out-of-scope-but-carry-new-verbs" flags for `test-derivation`, `audit-alignment`, `research-tower`, and `publication-research-pipeline` (all already known-but-unregistered then) are unchanged in kind now. What is new since the census: (1) **`goal` spell** (`autonomous-dag-goal-loop`) — a newly *registered* fail-closed Craft-frontier control loop the census's Execute/Route rows didn't have. (2) **`disciplines/` promoted to a first-class top-level tier** with its own schema, cards, catalog, and a `discipline-governance` sigil — the census's Govern row only had constitution-governance/decision-gate/definitions-governance, not a separate practice-formalization layer. (3) **`ux-lessons`** (new sigil, sits beside `ux-evidence-validator` in Validate). (4) **`github-project-issue-loop`** (new sigil, GitHub-Projects-to-PR loop, not in the census's Route/Execute rows). (5) A larger unregistered long tail than the census implied: `code-tag-audit`, `integration-spec`, `invoke-example-runner`, `observability-derivation`, `sync-user-stories`, `verification-weaver`, `guide-architecture`, and `tower-research-program` are folders the census did not name at all.
