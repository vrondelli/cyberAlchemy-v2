# API and data contracts

ARE exposes commands, package entrypoints, host protocols, and versioned record
schemas. This page maps those surfaces to their owning sources. It is a manual
reference map. Source code and machine schemas own exact field-level behavior.
The [generated candidate API field reference](reference/API-FIELDS.md) provides
the closed runtime-export and selected-schema inventory. Its versioned
[`api-field-annotations.json`](reference/api-field-annotations.json) registry
adds documentation metadata without changing Candidate 018 validation schemas.

## Contract hierarchy

| Surface | Owning source | Compatibility identity |
| --- | --- | --- |
| Product boundary | [`../product.json`](../product.json) | Product version and closure digest |
| Command dispatch | [`../bin/are.mjs`](../bin/are.mjs) | Command plus input schema |
| Decision CLI | [ARE runtime request schema](../schemas/cli-request.schema.json), [repository-facing CLI contract](../../../agent-routing/capabilities/are-cli/README.md) | `are.cli-request/v1`, result schema, route receipt |
| JavaScript packages | Each package's `index.mjs` | Export name plus record schema version |
| Gateway backend | [`backend-adapter.mjs`](../packages/codex-app-server-wrapper/src/backend-adapter.mjs) | `are.gateway-backend-adapter/v1` |
| Gateway wire | Gateway and RPC source in `codex-app-server-wrapper` | JSON-RPC 2.0 over JSON lines plus runtime epoch |
| Coding run input | [`run-config.schema.json`](../packages/coding-agent-runtime/schemas/run-config.schema.json) | JSON Schema `$id` and bound runtime profile |
| Patch proposal | [`patch-set-candidate.schema.json`](../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json) | Candidate schema and source snapshot |
| Next action | [`next-action-candidate.schema.json`](../packages/coding-agent-runtime/schemas/next-action-candidate.schema.json) | Candidate schema and run identity |

## Package entrypoints

All entrypoints and every export enumerated beneath them are currently
`candidate-internal`. The machine-readable surface declares an empty public
supported set. DR-04 is the only promotion gate.

| Package | Candidate entrypoint | Contract family |
| --- | --- | --- |
| module-port | [`index.mjs`](../packages/module-port/index.mjs) | Module manifests, invocations, results, receipts |
| intent-route-resolver | [`index.mjs`](../packages/intent-route-resolver/index.mjs) | Intent compilation and route resolution |
| request-decision-router | [`index.mjs`](../packages/request-decision-router/index.mjs) | Route, effect, and continuation decisions |
| request-intent-runtime | [`index.mjs`](../packages/request-intent-runtime/index.mjs) | Intent state, corrections, objectives, requirements, learning |
| context-basis-runtime | [`index.mjs`](../packages/context-basis-runtime/index.mjs) | Definition closure, selectors, Context Basis, envelopes and views |
| reasoning-state-runtime | [`index.mjs`](../packages/reasoning-state-runtime/index.mjs) | Events, epochs, dispatch, checkpoints, recovery, frontiers |
| reasoning-policy-runtime | [`index.mjs`](../packages/reasoning-policy-runtime/index.mjs) | Evolution decisions and reduction plans |
| evolution-runtime | [`index.mjs`](../packages/evolution-runtime/index.mjs) | Signals, hypotheses, experiments, comparisons, recommendations |
| runtime-journal | [`index.mjs`](../packages/runtime-journal/index.mjs) | Ordered operational events, replay, cuts, eviction |
| semantic-input-runtime | [`index.mjs`](../packages/semantic-input-runtime/index.mjs) | Exact context-bound semantic inputs |
| semantic-judgment-evaluator | [`index.mjs`](../packages/semantic-judgment-evaluator/index.mjs) | Typed outcomes and Reasoning Receipts |
| module-port-distribution-envelope | [`index.mjs`](../packages/module-port-distribution-envelope/index.mjs) | Packaged artifact identity verification |
| aci-binding-contract | [`index.mjs`](../packages/aci-binding-contract/index.mjs) | Agent/computer interaction lineage |
| codex-app-server-wrapper | [`index.mjs`](../packages/codex-app-server-wrapper/index.mjs) | Host preflight, gateway, session, effects and lifecycle |
| coding-agent-runtime | [`index.mjs`](../packages/coding-agent-runtime/index.mjs) | Providers, tools, budgets, proposals, patches, verification |
| conversation-runtime | [`index.mjs`](../packages/conversation-runtime/index.mjs) | Conversations, decisions, responses and improvement handoff |
| real-reasoning-benchmark | [`README.md`](../benchmarks/real-reasoning-v1/README.md) | Executable benchmark surface rather than a library API |

Import directly from the owning package entrypoint while the product remains a
private workspace candidate:

~~~js
import {
  createJsonLineProcessBackendAdapter,
  createPersistentGateway,
} from "../packages/codex-app-server-wrapper/index.mjs";
~~~

There is no published package-level export map or semantic-versioning promise
for individual JavaScript functions. A source-compatible name can still change
meaning when its record schema or profile changes.

## Data identity rules

ARE records use explicit `schema_version` values and content digests where
reconstruction or comparison matters. Consumers should:

1. Reject unknown mandatory schema versions.
2. Preserve unknown fields only when the owning contract permits them.
3. Compare content identities instead of filenames or timestamps.
4. Bind receipts to the exact request, profile, source snapshot, and predecessor.
5. Distinguish a historical replay from a refreshed evaluation.
6. Keep caller assertions separate from engine-observed evidence.
7. Treat every `authority_effect: none` result as non-authorizing.

## Stability classes

| Class | Meaning |
| --- | --- |
| Product-declared | Included in Candidate 018 closure and assigned owned tests |
| Candidate contract | Tested locally, but not approved as a public stable API |
| Prototype/default off | Implemented and testable, but disabled in the serving profile |
| Research-only | Outside the release closure and unable to define product behavior |
| Internal source | May support a declared surface without being a supported entrypoint |

The two Product Capabilities and the 17 implementation components are different
classification layers. See the [Capability guide](capabilities/README.md) and
[Components and integrations](COMPONENTS-AND-INTEGRATIONS.md).

## Error and evolution behavior

Closed contracts reject malformed or extra fields where their validators say
so. Unknown versions, stale bindings, invalid digests, ambiguous continuation,
and unverifiable recovery fail closed. A contract change that alters the product
closure requires successor candidate evidence. Research records remain
append-only and may recommend such a successor.

## Open Questions

- Which package exports should be promoted into a smaller stable SDK surface?
- Which additional annotations, if any, should become mandatory before the
  field reference is promoted from candidate-internal to a supported public
  surface?
- Which compatibility policy should govern additive fields before a public
  package exists?
