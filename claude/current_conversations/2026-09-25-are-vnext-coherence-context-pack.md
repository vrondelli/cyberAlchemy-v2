---
node_type: session-evidence
title: ARE vNext coherence implementation context pack
date: 2026-09-25
status: task-ready
route: CA2-ROUTE-IMPLEMENT
authority_effect: none
---

# Context Pack Summary

- Task: `ARE-VNEXT-COHERENCE-FOUNDATION`
- Mode: standard
- Files selected: 12
- Snippets selected: 18
- Obligation coverage: 100%
- Handoff pack: none; implementation remains in the primary task
- Strict coverage: pass
- Blockers: 0 for bounded owner-directed native mutation

## Task contract

Outcome: implement the first complete coherence pass for ARE from a reviewed DAG,
with runtime/security/operations first and architecture/governance second.

Non-goals: candidate freeze, product approval, publication, deployment, hosted
website or iframe integration, destructive cleanup, or rewriting historical
Candidate 020 evidence.

Write scope:

- `implementation/agent-reasoning-engine/**` where required by DAG nodes;
- `agent-routing/**` where required to make routing policy executable;
- `goals/projects/agent-reasoning-engine/**` and the exact Goal schema/validator
  files required to repair ARE evidence validation;
- this task's planning and session-evidence artifacts.

## Obligation matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Express the work as a dependency DAG | Audit synthesis and user request | covered |
| O2 | Obtain an independent plan review before implementation | User-requested sequential subagent role | covered |
| O3 | Obtain an implementation-seam analysis after review | User-requested sequential subagent role | covered |
| O4 | Address runtime, security, and operations first | Audit runtime report | covered |
| O5 | Address architecture and governance second | Audit governance report | covered |
| O6 | Preserve Candidate 020 as history | `RELEASE.md` candidate immutability contract | covered |
| O7 | Keep D65 product construction and operational residue separate | `agent-routing/ROUTER.md`, D65 section | covered |
| O8 | Preserve unrelated dirty work | repository working rules and current status | covered |
| O9 | Validate every implemented node without freezing or publishing | product/component test surfaces | covered |

## Included context

- `claude/current_conversations/2026-09-25-1540-a7f3c1-are-product-coherence-audit.md`
  — complete audit findings, synthesis, and recommended order — O1, O4, O5.
- `implementation/agent-reasoning-engine/product.json:1-195` — current flat
  19-component product profile and entrypoints — O1, O4, O5.
- `implementation/agent-reasoning-engine/src/product.mjs:175-250` — closure and
  health validation behavior — O4, O9.
- `implementation/agent-reasoning-engine/test/product.test.mjs:18-100` — product
  closure and ownership assertions — O9.
- `implementation/agent-reasoning-engine/test/distribution.test.mjs:10-70` —
  isolated materialization and CLI checks — O4, O9.
- `packages/codex-app-server-wrapper/src/gateway-session-store.mjs:1-140` —
  append/replay persistence surface — O4.
- `packages/codex-app-server-wrapper/src/gateway.mjs:160-220` — lifecycle and
  resource enforcement — O4.
- `packages/dsh-gateway-backend-adapter/src/server.mjs:55-190` — DSH persistence,
  thread limits, and history bounds — O4.
- `packages/dsh-gateway-backend-adapter/src/dsh-runner.mjs:1-90` — provider
  overlay checks and process boundary — O4.
- `packages/request-decision-router/src/router.mjs:140-253` — objective/effect
  candidate selection — O5.
- `packages/request-decision-router/src/consequence.mjs:9-59` — route/effect
  enforcement behavior — O5.
- `goals/projects/agent-reasoning-engine/project.json:29-47` and
  `goals/schemas/goal-package.schema.json#/$defs/goal` — lifecycle and evidence
  binding mismatch — O5.

## Constraints and decisions

- Target form: installable single-user local CLI/daemon.
- Product decomposition: Core, extensions, research/evaluation.
- DSH posture: optional experimental extension until its installation,
  capability, durability, and upgrade contracts close.
- Recovery hierarchy: gateway owns orchestration; Reasoning State owns semantic
  task truth; backend transcripts remain replaceable evidence/cache.
- Product bundle mode is immutable and content-addressed; live repository mode
  is explicitly development-only.
- Changes are reversible source changes and tests. No external effects.

## Validation surface

- Focused tests for every touched package.
- Agent-routing schema and router validation.
- Goals validation for the repaired ARE evidence shape.
- ARE product, distribution, and isolated-source tests.
- Full `node implementation/agent-reasoning-engine/bin/are.mjs test` only after
  focused suites pass.
- `git diff --check` and exact changed-path review.

## Excluded candidates

- Frozen Candidate 018/020 receipts: historical evidence, not implementation
  sources.
- Hosted website/iframe plans: explicitly out of scope.
- Publication, signing, tag, and deployment procedures: separate routes and
  owner effects.
- Research benchmark execution: not required to prove product structure.

## Fallback exploration rule

If a DAG node encounters an unowned policy decision, destructive migration,
credential requirement, external service, or irreversible compatibility choice,
stop that node and preserve it as operational residue. Continue only independent
ready nodes.

