# Preliminary Ontology View Surface Inventory

Status: local discovery seed; incomplete until Context Builder stage 1  
Authority effect: none

This inventory groups source surfaces by architecture, not merely filename. It
avoids treating generated/staged copies as independent designs.

| Family | Representative entrypoints | Observed strengths to examine | Known risk or question |
| --- | --- | --- | --- |
| CyberAlchemy authority views | `cyberAlchemy-v2/ontology/views/{ontology,system,bridge}-view.md` | explicit view roles, allowed/forbidden claims, owner/evidence boundaries | textual guidance rather than an interactive renderer |
| Legacy CyberAlchemy presentations | `cyberAlchemy/agentic-system-ontology-synthesis.html`, `cyberAlchemy/operational-ontology-runtime.html` | narrative sequencing and approachable explanation | bespoke static presentations; no reusable graph contract established |
| DomainSpec/ZefraHub explorer | `implementation/domainspec/implementation/app-frontend/visualizations/ontology-visualization/{index,explorer}.html` | large-graph force layout, search, 2D/3D controls, graph metrics, side inspection | very large embedded artifact; density and maintainability need audit |
| Unified Architecture Ontology Canvas | `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html` and later `unified-ontology-canvas` candidates | SVG connections, graphics-document semantics, pan/zoom, keyboard navigation, multiple edge classes | fixed large canvas and iteration drift; latest admitted candidate must be selected |
| DomainSpec comprehension evidence | `projects/domainspec-v2/development/comprehension-novice-test/**` | explicit stall taxonomy and edge-law comprehension risks | research protocol, not a renderer; must not be presented as human outcome proof |
| Body War business atlas | `projects/body-war/ontology/business/BUSINESS-VIEW-ATLAS.html` | editorial lenses, source metadata, search, relation sentences, actual SVG arrow geometry, endpoint links | static generated single-project atlas; lens and portal semantics differ from OEW |
| Body War relation/learning views | `BUSINESS-VIEWS.html`, `BUSINESS-JOURNEY-EXPERIMENT.html`, `BUSINESS-COMPREHENSION-TASK.html`, `generated/views/*.svg` | readable relation sentences, print surfaces, guided journey, comprehension tasks | fragmented surfaces and duplicated presentation logic |
| Body War whole-system OEW | `projects/body-war/ontology/whole-system/frontend/index.html`, default route and `?oew=1` | full 276-node/301-relation bundle, evidence inspector, full index, focus subset | failed unified UX: no shared renderer, no evidence-route connectors/icons/portals |
| Augmentor unified-agent viewer | `projects/augmentor/ontology/unified-agent/ontology-visualization.html`, `views/*.json` | generated SVG edges, interpretive view roles, embedded evidence/authority contract | current working-tree state is dirty and candidate-local; reuse must be source-bound |
| Anime.js knowledge-vault views | `projects/animejs/ontology/agent-knowledge-vault/views/*.json` | task/API/coverage/gap views over a shared graph | structured agent view pack, not yet a general human graph UI |
| Arcanum/research narrative views | `arcanum/arcana/ontology-vault/development/friend-graph-memory-ontology-summary.html`, `research/2026-08-03-ontology-authority-agent-context-presentation/presentation.html` | explanation, schema walkthrough, governance context | narrative artifacts are evidence inputs, not renderer owners |

## Initial synthesis pressure

No single existing surface owns all required capabilities. The architecture must
separate:

- canonical ontology/view semantics;
- a normalized lossless view/scene model;
- deterministic layout and interaction state;
- the graph renderer/tool adapter;
- evidence/authority inspection;
- generated static/print projections;
- acceptance fixtures and human-study residue.

The Context Builder stage must digest and deduplicate this inventory, identify
the newest source-owned version of each family, and record dirty/uncommitted
posture without overwriting it.
