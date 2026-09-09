# TASK-IRR-CONTRACT-001 — Contract admission

## Objective and mapping

- Slice: S-IRR-01
- Layer/wave: L0 / W1
- Goal: admit only canonical JSON-only `RouteRequest@1` and
  `CapabilityRouteCatalogSnapshot@1` values.

## Source contracts

- `../../../define/SPEC.md#input-contract`
- `../../../design/COMPONENT-CONTRACTS.md`
- `../../../design/INTEGRATION-VERSIONING.md`
- `../../../design/VALIDATION-CONTRACTS.md`

## SWU-IRR-001 — request admission

- Primary behavior: validate and canonicalize one `RouteRequest@1`.
- Independent boundary: request fixtures pass without any catalog matching or
  disposition logic.
- Split analysis: canonical JSON alone is support code with no meaningful
  request decision; keep it with the request validator.
- Dependencies: W0 preflight only.
- Write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/package.json`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/index.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/canonical-json.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/request.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/request.test.mjs`
- Algorithm:
  1. require a plain object and exact supported major version;
  2. require request ID, generic routable-intent envelope, discriminator map,
     constraints, and catalog snapshot value;
  3. validate posture/value consistency without inferring missing values;
  4. normalize only contract-defined sets and object keys;
  5. return immutable normalized data or typed invalid diagnostics.
- Edge cases: missing raw intent; non-JSON/runtime-native value; `unresolved`
  with non-null value; inferred
  field without evidence/note; unknown top-level version; duplicate normalized
  discriminator key; non-object input.
- Done when: exact valid fixture canonicalizes; every edge case returns typed
  invalid diagnostics; repeat bytes match.
- Acceptance: test output plus scoped diff; no imports outside Node built-ins
  and the new package.
- Validation:
  `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/request.test.mjs`
- Execution owner: local-fallback.
- Handoff: return files, test command/output, invalid cases, assumptions,
  blockers, residue, and exact next-route recommendation.

## SWU-IRR-002 — catalog admission

- Primary behavior: validate and freeze one finite
  `CapabilityRouteCatalogSnapshot@1`.
- Independent boundary: catalog fixtures pass without eligibility resolution.
- Split analysis: identity/digest and dominance graph checks are one admission
  verdict; splitting would allow a partially admitted catalog.
- Dependencies: SWU-IRR-001 owner receipt.
- Write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/src/catalog.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/fixtures/catalogs/**`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/catalog.test.mjs`
  - package `index.mjs` export block
- Algorithm:
  1. validate version, owner, effective-state marker, finite route list, IDs,
     modes, predicates, inputs, contract refs, forbidden effects;
  2. canonicalize and recompute the catalog digest;
  3. reject duplicates, unknown predicate operators, unknown/self dominance
     refs;
  4. detect dominance cycles with a deterministic depth-first traversal;
  5. freeze and return the canonical catalog or invalid-catalog diagnostics.
- Edge cases: empty catalog, duplicate IDs, stale digest, missing owner, missing
  or unsupported/stale effective state, unknown route edge, cycle, duplicate
  normalized predicate, unsupported operator.
- Done when: all valid/invalid catalog fixtures pass and permutations produce
  identical canonical catalog bytes; missing, unsupported, and stale
  effective-state fixtures fail closed.
- Validation:
  `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/catalog.test.mjs`
- Execution owner: local-fallback.

## Synchronization and completion

Each SWU stops after its tests and terminal receipt. Invoke refresh updates
status/evidence and may select only the declared successor. The task completes
only after both SWU owner receipts pass.

Open questions are owned in
[../../../OPEN-QUESTIONS.md](../../../OPEN-QUESTIONS.md).
