# Cyberalchemy Agent Routing Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `7ceb7eb681bd61a34d05f8f755c0647d413989ec5598a830f9c2c9430c8ce600`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `cyberalchemy-agent-routing.CyberAlchemyRouteResolution` | Rule | Resolve every repository objective through exactly one CyberAlchemy-v2 route and fail closed when no unique route or executable capability is available, while mandatory ontology enforcement remains separately suspended pending a governed Rust binding. |
| `cyberalchemy-agent-routing.RecentContextFreshness` | Rule | Return scoped recent commit metadata only under an exact current source binding; rebuild stale cache data and never treat history as a session or authority. |
| `cyberalchemy-agent-routing.RecentRepositoryContext` | Entity | A repository agent can find recent committed changes for an explicitly selected project or path, with current provenance and separately labeled working-tree status. |
| `cyberalchemy-agent-routing.RepositoryAgentRoute` | Entity | Preserve one stable CyberAlchemy-v2 route identity with its objective, authority root, minimal read set, execution posture, authorization requirement, write ceiling, blockers, and forbidden fallback. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |

This file is generated; edit machine sources and rebuild.
