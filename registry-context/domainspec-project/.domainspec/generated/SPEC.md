# Registry Context Runtime Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `083b353b6d6f0bbde580dcf565861aa90b4d4a7d728a2974592aa7f65e5e2852`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `registry-context-runtime.RegisteredContext` | Entity | Preserve one CAV2-D66 Context identity, exact Context digest, owner route, and registered selection policy without owning its source meanings. |
| `registry-context-runtime.RegistryContextIntegrityPolicy` | Policy | Select fail-closed behavior for unknown Contexts, Context digest drift, unregistered selections, selection drift, undeclared consumers or intended uses, path input, and authority escalation. |
| `registry-context-runtime.RegistryContextRequest` | Value Object | Carry one bounded request for a named Context, expected Context digest, consumer, intended use, and registered selection IDs without accepting repository paths. |
| `registry-context-runtime.RegistryContextResolverInterface` | Interface | Expose one technology-neutral local read-only Registry Context query without selecting a socket, daemon, network, or shared-service transport. |
| `registry-context-runtime.RegistryContextView` | Entity | Preserve one immutable digest-bound materialization of a Context, exact request digest, source epoch, Context projection, selected records, resolution status, claim ceiling, and authority effect. |
| `registry-context-runtime.ResolveRegistryContext` | Query | Resolve one named Context from registered exact selections into a deterministic immutable View without source mutation or authority effect. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `registry-context-runtime.edge.interface-exposes-resolve` | `registry-context-runtime.RegistryContextResolverInterface` | `exposes` | `registry-context-runtime.ResolveRegistryContext` |
| `registry-context-runtime.edge.resolve-reads-context` | `registry-context-runtime.ResolveRegistryContext` | `reads` | `registry-context-runtime.RegisteredContext` |
| `registry-context-runtime.edge.view-contains-request` | `registry-context-runtime.RegistryContextView` | `contains` | `registry-context-runtime.RegistryContextRequest` |

This file is generated; edit machine sources and rebuild.
