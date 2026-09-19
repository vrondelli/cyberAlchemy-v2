# DomainSpec Skill And Agent Canonicalization Strategy

Date: 2026-06-01
Status: draft dispatch-backed research strategy
Dispatch: `ops/development/domainspec-skill-agent-canonicalization.dispatch.json`

## Objective

Find every DomainSpec skill and agent definition already inside this repository, identify the newest authoritative definition for each logical capability, choose one canonical source per definition, and make every downstream runtime surface read from or regenerate from that canonical source.

This is a research-first route. Copying bodies into another surface is allowed only after the route proves the source owner, freshness, and downstream runtime need. The desired end state is:

```text
canonical DomainSpec source
  -> generated or thin downstream reader
  -> runtime-specific package only when the runtime requires a native copy
```

## Current Evidence Snapshot

Observed in `/home/vrondelli/projects/domainspec-core` on 2026-06-01:

| Surface | Count | Role | Initial treatment |
| --- | ---: | --- | --- |
| `implementation/domainspec/copilot/skills/*/SKILL.md` | 37 | DomainSpec-owned source candidates | Research as likely canonical source for Type A DomainSpec skills. |
| `implementation/domainspec/.agents/skills/**/SKILL.md` | 115 | DomainSpec local agent/runtime surface | Inspect for newer or generated definitions; do not parent-edit without owner scope. |
| `.github/skills/*/SKILL.md` | 145 | Root GitHub/Copilot distribution surface | Treat as downstream adapters or root-owned research skills until proven otherwise. |
| `.github/agents/*` | 65 | Root agent distribution surface | Split DomainSpec downstream, GSD bundle-generated, and MARS root-owned research agents. |
| `implementation/domainspec/{copilot,.github,.claude,.codex}/agents/*` | 143 | DomainSpec-owned agent source/adapters | Prefer `copilot/agents` as canonical candidate, then compare runtime adapters for drift. |
| `domainspec-lean-formalization/.agents/skills/**/*` | 42 | Lean/math-specific local skill surface | Inventory in a separate lane; preserve proof, novelty, precedent-search, and Lean build guardrails. |
| `domainspec-lean-formalization/.agents/agent-prompts/*` | 4 | Lean/math-specific agent prompt surface | Inventory separately from root GitHub agents; do not copy without owner approval. |

Existing policy evidence:

- `ops/CODEX-SKILL-SURFACE-POLICY.md` says canonical DomainSpec source belongs under `implementation/domainspec/copilot/skills/*` or DomainSpec framework docs, while root `.github/skills/*` is not the Codex install surface.
- `ops/SURFACE-OWNER-BOUNDARIES.md` says parent cleanup may classify child scopes, but must not mutate `implementation/domainspec/` unless the task explicitly names that owner scope.
- `ops/ROOT-GITHUB-SKILLS-CLASSIFICATION.md` already marks many root DomainSpec and GSD skill copies as duplicates of newer DomainSpec-owned skills.
- `domainspec-lean-formalization/CLAUDE.md` defines math/Lean guardrails: claim must stay within proof, novelty needs precedent search, Lean workflow routes through dedicated skills, and non-trivial math sessions close with `/close-session-math`.

## Research Route

1. Recover policy context.
   Read the existing surface policy, owner-boundary policy, root skill classification, root agent README, and DomainSpec owned surfaces. Output a short owner-boundary frame.

2. Inventory all candidates.
   Build `ops/development/domainspec-skill-agent-candidate-ledger.md` with one row per skill or agent candidate:
   `logical_id`, `path`, `surface_family`, `owner_scope`, `mtime`, `size`, `sha256`, `provenance_header`, `canonical_claim`, `downstream_reader_claim`, `notes`.

3. Run the Lean formalization lane.
   Build `ops/development/lean-formalization-skill-agent-candidate-ledger.md` for `domainspec-lean-formalization/.agents/skills`, including `custom/*` and `gitnexus/*`, `domainspec-lean-formalization/.agents/agent-prompts`, and `domainspec-lean-formalization/CLAUDE.md`. This lane records overlap with generic utilities, but keeps proof-domain skills and agents under the Lean formalization owner unless an approval record says otherwise.

4. Compare candidates by logical definition.
   For each logical skill or agent, group all candidates and decide:
   `newest_file`, `strongest_authority`, `content_match`, `drift_risk`, `recommended_canonical`, `downstream_action`.

5. Select the canonical owner.
   Use a decision gate before mutation. A newer timestamp is evidence, not authority. Generated packages and copied root surfaces cannot become canonical unless the owner explicitly approves that source move.

6. Plan downstream readers.
   For every non-canonical copy, choose exactly one downstream action:
   `regenerate-from-canonical`, `thin-reader`, `copy-on-release`, `root-owned-keep`, `delete-candidate`, or `blocked-owner-question`.

7. Hand off implementation.
   Only after the decision gate, create a bounded task-session that copies, rewrites, generates, or deletes the selected surfaces and adds drift checks.

## Canonical Selection Rules

- Prefer `implementation/domainspec/copilot/skills/*` for canonical DomainSpec implementation skills when present and newer or equally current.
- Treat `implementation/domainspec/.agents/skills/*` as DomainSpec-owned local runtime surface. It can provide freshness evidence, but parent work should not rewrite it without an owner-scoped task.
- Treat `.github/skills/*` as downstream GitHub/Copilot distribution unless a specific root-owned skill has no DomainSpec owner.
- Treat `.github/agents/*` as downstream agent distribution unless a matching owner source is missing.
- Treat `domainspec-lean-formalization/.agents/skills/*` and `domainspec-lean-formalization/.agents/agent-prompts/*` as Lean formalization owned. Shared utilities can be compared for dedupe, but proof-domain skills such as Lean hygiene, mathlib PR, theorem discovery, theorem ontology, precedent search, and proof writing should stay canonical in that lane.
- Keep Arcanum skills, MARS research skills, and project-local overlays out of the DomainSpec canonicalization decision unless a row explicitly depends on them.

## Copy And Reader Policy

Use direct body copy only as a transitional runtime adapter when the runtime cannot read a canonical file by reference. Every copied package should include provenance:

```yaml
surface_kind: generated-native-runtime-package
canonical_source: <repo path>
generated_by: <script or task-session id>
mutation_policy: regenerate-from-canonical-source
alias_of: null
```

Preferred mechanics:

- Canonical source: edited by the owning capability or repo scope.
- Thin reader: points to canonical source and adds only runtime invocation metadata.
- Generated native package: copied body plus provenance, regenerated by script.
- Drift check: compares canonical hash to downstream generated package metadata.

## Validation Gates

- Owner scope gate: block writes across `implementation/domainspec/`, nested Arcanum, project, or machine-global surfaces unless explicitly scoped.
- Freshness gate: compare mtime and content hash, but require owner/provenance before canonical selection.
- Adapter gate: downstream surfaces must declare provenance or thin-reader status.
- Drift gate: add or identify a command that detects divergence after copy/generation.
- Approval gate: operator approves the canonical owner decision before implementation.

## Suggested Commands For The Research Pass

```bash
find implementation/domainspec/copilot/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print
find implementation/domainspec/.agents/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print
find .github/skills -mindepth 2 -maxdepth 2 -name SKILL.md -print
find .github/agents -maxdepth 1 -type f -print
find implementation/domainspec/copilot/agents implementation/domainspec/.github/agents implementation/domainspec/.claude/agents implementation/domainspec/.codex/agents -maxdepth 1 -type f -print
find domainspec-lean-formalization/.agents/skills -type f -print
find domainspec-lean-formalization/.agents/agent-prompts -maxdepth 1 -type f -print
```

The follow-up task-session should turn those into a machine-readable ledger with checksums, mtimes, provenance extraction, and duplicate grouping.

## Dispatch Spec Result

- Dispatch ID: `domainspec-skill-agent-canonicalization-20260601`
- Status: pass after validator run
- Mode: research
- Step count: 7
- Patterns: route, fanout, sequential, decision, validation, handoff
- Gates: owner scope, canonical source, freshness, downstream reader validation, promotion guardrail
- Handoffs: candidate ledger, Lean formalization ledger, canonical candidate matrix, owner decision, reader refresh plan, task-session handoff
- Subagent strategy: recommended; five roles including `lean-formalization-inventorist`; join policy `parent_synthesis`; authorization `requires_user_permission`
- Observability: dispatch-id-bound trace events defined
- Promotion guardrail: research artifacts recommend source ownership only after decision approval
- Required repairs: none after validation
- Next route: task-session
