# Cyberalchemy Workspace Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `e0bb7d1038e65c650314bde117548593b76330ac523c147a1f3d185522cf7d06`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `cyberalchemy-workspace.CyberAlchemyWorkspaceInterface` | Interface | Expose only the local inspect query to the frontend and grant the interface no semantic, validation, admission, or Project authority. |
| `cyberalchemy-workspace.InspectWorkspace` | Query | Read the current immutable Workspace Snapshot without editing sources, changing authority, inferring admission, or invoking a Project action. |
| `cyberalchemy-workspace.WorkspaceBinding` | Binding | Bind the Workspace page to one immutable local snapshot query and invalidate only when the generated semantic source epoch changes. |
| `cyberalchemy-workspace.WorkspaceExplorer` | Component | Present searchable read-only definition, product, project, and ontology collections with detail provenance, boundaries, claim ceilings, and explicit Project entry navigation. |
| `cyberalchemy-workspace.WorkspaceHomePage` | Page | Own the local root route where a person can browse the four collections and select a Project entry without editing semantic sources. |
| `cyberalchemy-workspace.WorkspaceRecord` | Value Object | Project one semantic record while preserving its non-collapsible collection, stable identity, label, status, meaning, owner route, provenance, boundary, claim ceiling, source epoch, and optional Project entry target. |
| `cyberalchemy-workspace.WorkspaceShell` | Layout | Provide clean shared navigation for CyberAlchemy meaning and Project entry without presenting mutation or admission controls. |
| `cyberalchemy-workspace.WorkspaceSnapshot` | Entity | Own one immutable, version-identified projection of source-owned definitions, products, projects, and ontologies without owning their meaning or authority. |
| `cyberalchemy-workspace.WorkspaceViewModel` | View Model | Group Workspace Records into four typed collections while keeping source epoch, status, meaning, owner, provenance, boundary, claim ceiling, and Project entry targets visible. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `cyberalchemy-workspace.edge.binding-fetches-inspection` | `cyberalchemy-workspace.WorkspaceBinding` | `fetches` | `cyberalchemy-workspace.InspectWorkspace` |
| `cyberalchemy-workspace.edge.explorer-displays-view-model` | `cyberalchemy-workspace.WorkspaceExplorer` | `displays` | `cyberalchemy-workspace.WorkspaceViewModel` |
| `cyberalchemy-workspace.edge.home-renders-explorer` | `cyberalchemy-workspace.WorkspaceHomePage` | `renders` | `cyberalchemy-workspace.WorkspaceExplorer` |
| `cyberalchemy-workspace.edge.inspect-reads-snapshot` | `cyberalchemy-workspace.InspectWorkspace` | `reads` | `cyberalchemy-workspace.WorkspaceSnapshot` |
| `cyberalchemy-workspace.edge.interface-exposes-inspect` | `cyberalchemy-workspace.CyberAlchemyWorkspaceInterface` | `exposes` | `cyberalchemy-workspace.InspectWorkspace` |
| `cyberalchemy-workspace.edge.shell-wraps-home` | `cyberalchemy-workspace.WorkspaceShell` | `wraps` | `cyberalchemy-workspace.WorkspaceHomePage` |
| `cyberalchemy-workspace.edge.snapshot-contains-record` | `cyberalchemy-workspace.WorkspaceSnapshot` | `contains` | `cyberalchemy-workspace.WorkspaceRecord` |
| `cyberalchemy-workspace.edge.view-model-derives-snapshot` | `cyberalchemy-workspace.WorkspaceViewModel` | `derives` | `cyberalchemy-workspace.WorkspaceSnapshot` |

This file is generated; edit machine sources and rebuild.
