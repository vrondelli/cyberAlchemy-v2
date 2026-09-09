# TASK-IRR-ADAPTER-001 — Standalone adapter boundary

## Objective and mapping

- Slice: S-IRR-03
- Layer/wave: L0 / W3
- Goal: expose the pure resolver through a generic JSON port and preserve the
  existing selected-local intent model as one explicit compatibility mapper.

## Source contracts

- `../../../define/SPEC.md#input-contract`
- `../../../design/COMPONENT-CONTRACTS.md`
- `../../../design/INTEGRATION-VERSIONING.md`
- `../../../design/VALIDATION-CONTRACTS.md`

## SWU-IRR-005 — generic JSON runtime port

- Primary behavior: accept JSON text and return one canonical JSON response
  without leaking caller-controlled parse, version, or shape exceptions.
- Independent boundary: literal JSON fixtures pass without any selected-local
  or consumer-runtime code.
- Dependencies: SWU-IRR-004 owner receipt.
- Write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/json-port.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/json-port.test.mjs`
  - package `index.mjs` and `package.json` export blocks
- Done when: valid requests resolve; malformed JSON and unknown protocol
  versions return canonical `IntentRoutePortResponse@1` failures with nullable
  request identity and disposition/diagnostic exclusivity; repeated bytes
  match.
- Validation:
  `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/json-port.test.mjs`
- Execution owner: local-fallback.

## SWU-IRR-006 — selected-local mapper and add-on declaration

- Primary behavior: convert `intent-record.selected-local@1` plus a
  digest-bound mapping profile into a generic routable intent and declare the
  package's zero-permission add-on surface.
- Independent boundary: mapper fixtures and manifest validation pass without a
  consumer host.
- Dependencies: SWU-IRR-005 owner receipt.
- Write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/selected-local.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/selected-local.test.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/addon-manifest.json`
  - package `index.mjs` and `package.json` export blocks
- Done when: raw intent, source digest, posture, evidence, and inference notes
  are preserved; absent source selectors become unresolved; the mapping receipt
  binds the profile digest and unmapped fields; the manifest declares supported
  protocols and no permissions; exported code has no environment/runtime
  imports.
- Validation:
  `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/selected-local.test.mjs`
- Execution owner: local-fallback.

## Synchronization and completion

Each SWU stops after its own tests and terminal receipt. Invoke refresh may
select only the declared successor. The task completes only after both owner
receipts pass.

## Open Questions

- Admission of a shared public add-on manifest format remains with a separate
  add-on lifecycle owner.
- Consumer-specific installation, catalog compilation, and route-decision
  persistence remain outside this task.
