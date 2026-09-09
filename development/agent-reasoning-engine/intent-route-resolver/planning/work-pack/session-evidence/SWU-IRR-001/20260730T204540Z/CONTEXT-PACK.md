# Runtime handoff context pack

- Task: `TASK-IRR-CONTRACT-001`
- SWU: `SWU-IRR-001`
- Run: `20260730T204540Z`
- Mode: standard
- Strict coverage: pass
- Authority class: private
- Evidence role: session evidence, not canonical planning authority

## Obligations

| ID | Obligation | Status | Controlling evidence |
|---|---|---|---|
| O-01 | Admit only exact `RouteRequest@1` values and preserve unresolved posture. | covered | `define/SPEC.md#input-contract`; `design/COMPONENT-CONTRACTS.md#routerequest1` |
| O-02 | Canonicalize deterministically without model, network, discovery, persistence, dispatch, or effect calls. | covered | `define/SPEC.md#deterministic-resolution-rules`; `design/ARCHITECTURE.md#view-2--high-level-structure` |
| O-03 | Be usable by an arbitrary agentic runtime without importing that runtime. | resolved | Direct user requirement dated 2026-07-30; implement a dependency-injected `projectIntent` port in `src/request.mjs`, returning the same admitted `RouteRequest@1`. |
| O-04 | Preserve compatibility with `IntentRecord selected-local@1`. | covered | `design/INTEGRATION-VERSIONING.md#compatibility-rules`; expose an explicit mapper rather than hard-coding a host runtime. |
| O-05 | Remain an advisory add-on seam, never an executor or approval owner. | covered | `define/SPEC.md#source-and-ownership-boundaries`; `design/AUTHORITY-TRUST.md` |
| O-06 | Prove the working package in a real browser without claiming ResonantOS product acceptance. | resolved | Direct user requirement dated 2026-07-30; browser HTML is generated later by the declared SWU-IRR-005 witness harness inside its selected output directory. |
| O-07 | Preserve unrelated dirty work and public/private boundaries. | covered | work-pack common constraints and repository `AGENTS.md` |

## Selected context

| Path | Selector | Obligation refs |
|---|---|---|
| `cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/planning/WORK-PACK.md` | objective, SWU manifest, closeout contract | O-01, O-02, O-05, O-07 |
| `cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/planning/work-pack/tasks/TASK-IRR-CONTRACT-001.md` | SWU-IRR-001 write scope, algorithm, validation | O-01, O-02, O-03, O-04 |
| `cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/define/SPEC.md` | input contract, output algebra, acceptance | O-01, O-02, O-05 |
| `cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/design/COMPONENT-CONTRACTS.md` | request and canonical receipt contracts | O-01, O-02 |
| `cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/design/INTEGRATION-VERSIONING.md` | adapter and versioning boundaries | O-03, O-04, O-05 |
| `cyberAlchemy-v2/development/agent-reasoning-engine/spec/INTENT-RECORD.md` | exact selected-local envelope and field posture | O-04 |
| `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/package.json` | neighboring private package conventions | O-02, O-07 |

## Write scope

- `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/package.json`
- `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/index.mjs`
- `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/canonical-json.mjs`
- `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/request.mjs`
- `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/request.test.mjs`

## Validation

```text
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/request.test.mjs
```

## Fallback exploration

If an obligation cannot be implemented from the selected evidence, stop before
expanding outside the resolver development and implementation roots. Do not
inspect or mutate a consumer runtime.

## Open Questions

- Runtime-specific package installers and host catalog compilers remain later,
  owner-specific adapters.
- The browser witness proves portable execution of the package API, not
  ResonantOS or Augmentor product acceptance.
