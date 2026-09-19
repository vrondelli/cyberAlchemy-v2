# MAP — business-philosopher

`../business-philosopher` is Victor's personal Obsidian-backed editorial workspace for writing
philosophy/systems-thinking essays — the audience-facing output layer that sits *outside* the
DomainSpec/Arcanum/Saturn engineering stack but writes *about* it and borrows its subagent-dispatch
tooling.

## Role in the three-pillar model

- **DomainSpec** — not the pillar itself; embeds a full separate checkout of the DomainSpec+GSD
  agent/skill package as a git submodule (`domainspec/`, remote `cyberAlchemyAI/domainspec.git`,
  HEAD `da94796`). That submodule's `.claude/skills/` and `.claude/agents/` are near-identical in
  name to `implementation/domainspec/` here, but it is a **different remote** than domainspec-core's
  own `implementation/domainspec` submodule (`vrondelli/domainspec.git`) — likely a sibling
  fork/instance, not the same tracked ref (inferred).
- **Arcanum** — not present; no `arcanum/` folder or Arcanum submodule found.
- **Saturn** — not present; no evidence-loop implementation.
- **authority-spine** — no authority spine of its own; it is content, not governance.
- **Other — editorial workspace + a subagents-dispatch *consumer*.** Its `.claude/agents/`
  (`domainspec-research-writer.agent.md` etc.) and `telemetry/agents/subagents-dispatch.yaml`
  mechanically mirror the domainspec-core `register-dispatch`/`domainspec-subagents-strategy`
  pattern (same schema_version `0.6.0`, same dispatch/close-row shape), adapted for a repo with "no
  vault, backlog, or ontology-conventions.md" (per its `close-session` skill). It is a downstream
  adopter of that governance mechanism, not an origin of it (inferred).
- Per `discovery/repo-restructure-investigation.md`, this repo is explicitly one of three siblings:
  editorial (`business-philosopher`), operational framework (`/domainspec`, 24 meta-types/26 edges/
  10-stage pipeline), and math formalization (`/domainspec-theorem`, Lean 4 proofs) — with a noted
  "back-edge gap" (theorem/operational repos prove/operationalize things this repo still lists as
  open, and nothing here names them as neighbors).

## Top-level folders

| Folder | Contents |
| --- | --- |
| `essays/` | 3 finished/in-progress essays in Victor's voice (2 PT, 1 mixed) |
| `discovery/` | Persona, essay topics, interview log, phd-viability, recommendations, phrasing backlog, repo-restructure investigation, a subagents prior-art proposal |
| `assuntos/` | Deep-dive subject folders (7 topics: abstraction-as-art, adaptive-formalization, agents-optimization, domain-driven-design, emergence, knowledge-topology, meta-representations, orquestracao-multi-agente, theorem) — ~35 files total |
| `research/` | 3 research-tower-style topic folders (compositional-dynamics-residue, meadows-yoneda-bridge, meta-layers-validation), each with `research.md`/`findings.md` |
| `presentations/` | 1 talk-in-development (resonantOS "Schemas, Residue and Emergence"): outline(s) + workflow takeaways |
| `sessions/` | 18 session-provenance notes (2026-06-10 through 2026-07-03), written by the local `close-session` skill |
| `brisas-leleno/` | 1 file — an "information preservation conjecture" note (unclear standalone project, inferred: a side idea parked here) |
| `telemetry/agents/` | `subagents-dispatch.yaml` — append-only dispatch/close-row log, guarded by a pre-commit-style hook that blocks direct edits outside the official appender |
| `templates/` | 2 templates (`domainspec-research.md`, `domainspec-findings.md`) for the local subagents-dispatch writer agents |
| `agents/` | `newsletter.md` — a fictional/framing device ("Gödel Machine Digest") for agent-authored bulletins, not live tooling |
| `animations/` | 1 topic (`embedding-search`): Manim-style Python scene scripts + render shell script |
| `domainspec/` | Git submodule: full separate DomainSpec+GSD engine checkout (see above) — its own CLAUDE.md, CONSTITUTION.md, AXIOMS.md, backend/, apps, docker-compose/prometheus infra, ~120 `.claude/agents` + `.claude/skills` entries |
| `.claude/` | Local (non-submodule) agents/skills: 3 writer agents + 1 skill (see inventory) |
| `.obsidian/` | Obsidian vault config (graph view, appearance) — confirms this is browsed as a personal knowledge graph, not just files |
| `manifesto.md`, `write-style.md`, `CLAUDE.md`, `README.md` | Root governance docs (below) |

## Capability inventory

| Name | Kind | What it does | Path |
| --- | --- | --- | --- |
| domainspec-research-writer | agent | Mechanically persists collected subagent-dispatch child returns verbatim into `domainspec-research.md` (no synthesis) | `.claude/agents/domainspec-research-writer.agent.md` |
| domainspec-findings-writer | agent | Sibling writer agent for the findings-side artifact of a dispatch | `.claude/agents/domainspec-findings-writer.agent.md` |
| domainspec-discovery-writer | agent | Sibling writer agent for the discovery-side artifact of a dispatch | `.claude/agents/domainspec-discovery-writer.agent.md` |
| close-session (local) | skill | Repo-adapted session-close workflow (from ZefraHub's version): triage, ≤10-sentence summary, writes to `sessions/` | `.claude/skills/close-session/SKILL.md` |
| subagents-dispatch.yaml | telemetry log | Append-only registry of every subagent dispatch + close row (research/review types observed); hook-protected against direct edits | `telemetry/agents/subagents-dispatch.yaml` |
| domainspec-research.md template | template | Canonical section/frontmatter shape for a dispatch's collected research | `templates/domainspec-research.md` |
| domainspec-findings.md template | template | Canonical section/frontmatter shape for a dispatch's findings | `templates/domainspec-findings.md` |
| embedding-search animation | script pipeline | Manim/Python scene (`fermat_embedding_scene.py`) + render shell script visualizing embedding search | `animations/embedding-search/` |
| agents/newsletter.md | content device | Framing doc inviting "5 specialized agents" (Orchestrator/Coder/Architect/QA/DB-Infra) to log architectural bulletins — a rhetorical device, not wired automation (inferred) | `agents/newsletter.md` |
| **domainspec/ submodule (long tail)** | full engine checkout | ~24 `domainspec-*` skills + ~45 `gsd-*` skills + ~45 agent files (`domainspec-*.agent.md`, `gsd-*.agent.md`, `mars-researcher.agent.md`) — same package family as `implementation/domainspec/` in this repo, different remote/fork; not separately cataloged here (out of scope for a business-philosopher-level census) | `domainspec/.claude/skills/`, `domainspec/.claude/agents/` |
| root `.claude/settings.json` | permissions config | Pre-approves a handful of Bash commands (git status on domainspec-theorem, telemetry log.sh invocations) — paths reference `/Users/victorboscaro/...` (macOS), i.e. copied from a different machine/OS than this Windows recon environment | `.claude/settings.json` |

## Key ideas / vocabulary

- **Manifesto's 4 operating principles** — variance reduction, antifragility (Taleb), "the nudge" (vs. cages/bureaucracy), the universal API (form = content) — `manifesto.md`.
- **"Structural Stoics"** — controlling what can be controlled via elegant low-entropy architecture; absorbing complexity into structure rather than onto people.
- **Meta-representations stack** — the repo's core recurring conceptual cluster (`assuntos/meta-representations/`): L0/L1/L2 meta-layers, domainspec-synthesis, reinforcing loops, formalization roadmap.
- **Noether/Hofstadter complementarity** — a working conjecture that productive self-reference needs both a conservative (Noether-style) and generative (Hofstadter-style) mode; subject of a prior-art subagent dispatch.
- **Graph portability principles** — from `repo-restructure-investigation.md`: each node declares its "Markov blanket," cross-repo edges are first-class and version-pinned, portable nodes re-anchor context in their opening.
- **Voice discipline** — peer-at-a-whiteboard register, concrete-before-abstract, hedge-on-generalization/commit-on-lived-experience, no guru tone, PT for raw thinking vs. EN for publishing (`write-style.md`).

## Entry / orientation docs

- `README.md` — navigation map with one-line description of every major doc/folder.
- `CLAUDE.md` — mandatory-first-step router (7 numbered routes: understand codebase, understand vault, debug, write discovery/spec/plan, refactor/code, test, close session, new markdown, backlog, README, robot-talks, ambiguous, infra) — note: this router's routes (GitNexus, vault, `docs/vault/`, `specs/`) describe a *different, code-centric* project template and don't match this repo's actual folders (essays/discovery/assuntos) — looks like an unadapted/copied router (inferred).
- `discovery/persona.md` — "read first" orientation to who Victor is and what he wants from the work.
- `write-style.md` — voice/editing reference, must be read before generating any content in his voice.

## Status floor

- **Built and in active use:** essays (3), assuntos deep-dives (~35 files), research-tower-style folders (3), sessions log (18 entries spanning ~3 weeks), the subagents-dispatch telemetry (2+ recorded dispatches with real child-agent fan-outs), `close-session` skill, writer agents.
- **Designed/aspirational or inconsistent:** root `CLAUDE.md` router describes tooling (GitNexus, semantic-index, vault) that doesn't exist in this repo; `agents/newsletter.md` is a rhetorical framing device with no evidence of agents actually publishing to it; `manifesto.md` self-flags unresolved tone issues ("guru risk," "reference stacking") and is explicitly not to be edited without instruction; `brisas-leleno/` is a single orphaned file with unclear project status.
- The embedded `domainspec/` submodule is itself a mature, built engine (its own CHANGELOG, CONSTITUTION, ~120 agents/skills) — but that maturity belongs to the submodule's own repo, not to business-philosopher.

## Git state

- **This repo:** remote `https://github.com/VictorBoscaro/business-philosopher.git`, branch `main`, HEAD `6dacea1`.
- **`domainspec/` submodule:** remote `https://github.com/cyberAlchemyAI/domainspec.git`, HEAD `da94796` (detached, tracked via `.gitmodules`).
- Also declared in `.gitmodules` but not inspected: none — only the one submodule (`domainspec`) is registered.

## Open questions

1. **Does it share the domainspec engine with domainspec-core?** Partially. The submodule's
   `.claude/skills/`/`.claude/agents/` names are near-identical to domainspec-core's
   `implementation/domainspec/` (same `domainspec-*` + `gsd-*` families), but the two point to
   different git remotes (`cyberAlchemyAI/domainspec` vs. `vrondelli/domainspec`) at different
   commits. Whether one is a fork of the other, whether they're kept in sync, or whether
   `cyberAlchemyAI/domainspec` is actually the canonical upstream (matching the `cyberAlchemyAI`
   org that also owns the canonical `Arcanum` submodule in domainspec-core) is unresolved and
   worth a direct diff/provenance check.
2. **Is `discovery/repo-restructure-investigation.md`'s "back-edge gap" still open?** It names a
   real live problem — essays claiming novelty for ideas already proved/refuted in the sibling
   `domainspec-theorem` repo — and describes a 6-agent dispatch (2 phases) to fix it; only Agent V's
   results are marked done in the file read here, so the resolution state should be checked in
   later sessions.
3. **Is the root `CLAUDE.md` router stale?** Its routes reference tooling and folders (GitNexus,
   `docs/vault/`, `specs/`) that don't match this repo's real structure — likely copied from
   another project template and never adapted; worth flagging to Victor rather than silently fixing.
4. **What is `brisas-leleno/`?** A single-file folder with no README explaining its relationship to
   the rest of the workspace — name and scope unclear from content alone.
