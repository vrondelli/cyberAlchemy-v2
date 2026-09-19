# Codex Goal Profile: BTE L0A Repair Through L8

## Codex Goal Profile Result

- Source work-pack:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md`
- Selected unit: `BTE-L0A-REPAIR-THROUGH-L8-ONE-SHOT`
- Readiness: pass
- Goal budget: 1,859 / 4,000 characters, pass
- Decision profile: none; consumed fields n/a
- One-shot mode: yes
- Capability policy: `task-session` executes one exact SWU; `invoke refresh`
  reconciles receipts and instantiates the next candidate; `context-builder`
  must produce strict per-SWU coverage; `dispatch-spec` validates routes;
  `decision-gate` owns blocker-level choices; `craft` may synchronize only
  receipt-backed scoped state. Subagents are not authorized.
- Sidecar profile:
  `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/goals/bte-l0a-repair-through-l8-one-shot/CODEX-GOAL-PROFILE.md`
- Native Goal: see `00-goal-command.md`.
- Verification surface: per-SWU commands and receipts plus terminal
  `verify:bte:consumers` and `verify:bte`; profile validation covers the native
  Goal budget, JSON, source existence, strict coverage, approval boundaries,
  links, whitespace, and diff hygiene.
- Boundaries: one SWU and one exact write scope at a time; immutable evidence
  remains immutable; owner/freeze/admission gates remain independent; no UI,
  public Arcanum, subagents, commit/push/PR/gitlink, release, or production
  authorization.
- Handoff pack:
  - Markdown: `handoff-pack.md`
  - JSON/index: `handoff-index.json`
- Strict coverage: pass for campaign control and current L0A repair. Every
  future implementation SWU must receive a new strict pack after it is
  instantiated; this profile does not pretend its future byte scope is known.
- Fallback exploration: named gaps only.
- Extra-source reporting: required.
- Stop condition: stop blocked when a current unit cannot be selected or proven
  without guessing, widening scope, impersonating an owner, or weakening a
  receipt. Report the layer, candidate, completed receipts, exact blocker,
  owner, unblock action, residue, and prior-layer validity.
- Validation: pass; see `PROFILE-VALIDATION.json`.

## Readiness Basis

The user explicitly selected the whole ordered stream and approved this profile.
The active frontier contains one dependency-ready candidate:
`SWU-BTE-L0A-REPAIR-001`. Later tasks intentionally have no SWU IDs; they are
instantiated only after predecessor receipts make their exact handles, fixtures,
write scopes, and validation commands knowable.

Campaign authorization removes repeated operator confirmation only when a
passing refresh exposes exactly one fully bounded candidate. It cannot grant an
independent validation freeze, formation/profile/node/relationship admission,
catalogue freeze, consumer-owner receipt, release decision, or production
authorization.

## Completion Meaning

`pass` means the full L0A-repair-to-L8 chain has exact terminal receipts and the
non-admitting terminal verifier passes. `block` is also a valid terminal Goal
state when the campaign reaches a genuine unresolved owner or proof gate and
returns the exact unblock action. A partial chain is never described as full BTE
completion.
