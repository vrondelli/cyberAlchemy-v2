---
node_type: sigil-development-result
is_session: true
status: pass
boundary: INTERNAL - private lifecycle closeout evidence only
created: 2026-06-30
source_capability: sigil-development
target_sigil: ontology-vault
mode: update
run_id: arcanum-hook-019f18ec-e90d-7671-845a-287938974cb3
---

# Sigil Development Result: Ontology Vault Runtime Profiles

## Summary

`ontology-vault` was updated in targeted update mode to support generic
project-local runtime profiles and optional governed-agent runtime backends.
The public sigil remains generic: no DomainSpec v2 or private project paths were
introduced into reusable Arcanum sources.

## Output Contract

- Target sigil: `ontology-vault`.
- Lifecycle mode: `update`.
- Tier: `arcana`.
- Runtime profile support: added.
- Runtime modes: `inline` default, `agents` gated by a repository-local governed
  agent strategy.
- Agent backend authority: delegated evidence only.
- Promotion/spec mutation authority: blocked unless a separate owner route
  explicitly permits movement.
- Reflection trigger state: none; the Invoke handoff was precise enough for a
  targeted update.
- Iteration decision: targeted update complete; experiment-harness proof remains
  a later promotion-readiness step.

## Files Changed

Canonical public source:

- `arcanum/arcana/ontology-vault/SKILL.md`
- `arcanum/arcana/ontology-vault/README.md`
- `arcanum/arcana/ontology-vault/templates/runtime-profile.md`

Generated local runtime mirrors:

- `.agents/skills/ontology-vault/SKILL.md`
- `.agents/skills/ontology-vault/README.md`
- `.agents/skills/ontology-vault/templates/runtime-profile.md`
- `.claude/skills/ontology-vault/SKILL.md`
- `.claude/skills/ontology-vault/README.md`
- `.claude/skills/ontology-vault/templates/runtime-profile.md`

Private lifecycle receipt:

- `cyberAlchemy-v2/ontology/development/2026-06-30-ontology-vault-runtime-profile-handoff/SIGIL-DEVELOPMENT-RESULT.md`

## Behavior Added

- Added `--profile <path>` and `--runtime inline|agents` to the sigil argument
  surface.
- Added a project-local runtime profile contract that names local ontology refs,
  owner refs, source-spine refs, implementation/runtime refs, allowed outputs,
  blocked outputs, owner gates, residue route, and observability route.
- Added process rules for loading a profile before broad discovery and treating
  profile refs as the execution boundary.
- Added a governed-agent backend rule: agent-backed runs require a local strategy
  owner, explicit permission in the profile, trigger checks, tension or review
  gates, explicit human confirmation, registration, closeout, and ledger
  evidence.
- Added validation requirements for profile completeness, runtime permission,
  blocked output attempts, owner-gate coverage, and agent closeout receipts.
- Added a reusable runtime profile template.

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Canonical first | pass | Public `arcanum/arcana/ontology-vault/` was patched before generated mirrors were synced. |
| Public/private boundary | pass | Generic public files contain no private project names or local filesystem paths. |
| Runtime profile non-authority | pass | Profile outputs are constrained to evidence, reports, drift findings, and projections unless owner routes approve movement. |
| Agent backend human gate | pass | Agent-backed runtime is explicitly routed through governed trigger, tension, confirmation, registration, closeout, and ledger evidence. |
| Generated mirror discipline | pass | `.agents` and `.claude` skill mirrors were regenerated from the canonical sigil using `bootstrap_arcanum.sh`. |

## Validation

- `git -C arcanum diff --check -- arcana/ontology-vault/SKILL.md arcana/ontology-vault/README.md arcana/ontology-vault/templates/runtime-profile.md`
- `git diff --check -- .agents/skills/ontology-vault .claude/skills/ontology-vault`
- Private-boundary scan over canonical and generated files for project names and
  local paths: no matches.
- Trailing-whitespace scan over canonical and generated files: no matches.
- Non-ASCII scan over canonical and generated files: no matches.
- Generated `runtime-profile.md` templates match the canonical template for both
  Codex and Claude mirrors.

## Deferred Work

- Create the private DomainSpec v2 profile as a later bounded task-session, for
  example `projects/domainspec-v2/ontology/RUNTIME-PROFILE.md`.
- Run an experiment-harness proof for inline profile execution and agent-backed
  profile execution before claiming promotion readiness.
- Do not use this update as permission to promote DomainSpec v2 ontology
  candidates, mutate specs, or treat generated projections as authority.
