# ARE Module Port

This candidate package provides the minimum extension boundary required for ARE
to remain loadable when optional modules are absent. It grants no authority.

The core accepts an empty adapter set. Consumers invoke an exact capability and
receive `available`, `unavailable`, or `blocked`; unavailable never means a
negative semantic judgment. There is no discovery, fallback chain, provider
priority, hot reload, route selection, or effect execution.

Module manifests and invocation receipts are canonical and digest-bound. A
module set is order-independent and immutable. Duplicate providers for one
capability are rejected rather than prioritized.

The later operational layers keep separate packages: the active local cutover
uses the packaged Linux x64 Rust verifier, while
`../module-port-distribution-envelope` verifies its exact test-only signed
distribution payload offline. Envelope validity does not install, activate,
publish, release, deploy, or grant module effects.

## Semantic text facade

`./semantic-text` declares typed capability names, protocol validators, and a
consumer facade without importing Alch. The optional compiled-Alch adapter is
available only through the separate `./alch-semantic-adapter` export:

```js
import {createModulePort} from "@cyberalchemy/module-port";
import {createSemanticTextFacade, semanticTextOutputValidators} from "@cyberalchemy/module-port/semantic-text";

const port = createModulePort({adapters: [], output_validators: semanticTextOutputValidators});
const semantic = createSemanticTextFacade(port, {consumer_id: "request-intent-runtime"});
const result = semantic.semanticKey("Build—a—new system", {invocation_id: "intent-1"});
// result.disposition === "unavailable"
```

Import `./alch-semantic-adapter` and inject `createAlchSemanticAdapter()` only
when that candidate module is explicitly configured.

## Route availability adapter

`./route-availability` lets an explicitly configured module answer whether one
already-registered route is currently available. Each declaration binds one
exact `route_id` to one exact capability ID and produces a digest-bound Module
Port receipt. `available: false` is a successful availability judgment with
reason codes; a missing provider remains `unavailable`; an invalid provider is
`blocked`.

The adapter cannot add a registry route, choose between routes, invoke a route
workflow, or grant effects. The consumer owns what an unavailable dependency
means. Duplicate route declarations and duplicate capability providers are
rejected instead of prioritized.

## Boundaries

- Manifests describe compatibility; they do not admit or activate modules.
- The host supplies adapters explicitly. Paths are never discovered or loaded.
- Invocation is synchronous so a result is bound to one immutable module-set
  snapshot without asynchronous replacement.
- Consumers own required-versus-not-applicable policy and all route authority.
- Adapter exceptions are reduced to stable reason codes; arbitrary error text
  is not exposed.

## Open Questions

Process isolation, asynchronous protocols, module-set successor lifecycle, real
release-signing custody, other platform artifacts, external installation, and
deployment remain separately governed boundaries.
