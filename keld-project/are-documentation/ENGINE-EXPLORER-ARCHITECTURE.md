# Engine explorer architecture

Status: implemented local product candidate; no deployment or release approval.
This document supersedes the selected-feature rendering architecture in the
historical feature-map report. The reviewed scope is
[EXPLORER-PRODUCT-PLAN.md](EXPLORER-PRODUCT-PLAN.md).

## Connected semantic model

[src/engineGraph.ts](src/engineGraph.ts) owns one graph with 73 nodes and 105
connections. The nine guides provide 88 local descriptions. Shared concepts are
merged explicitly: request, route, continuation, journal, state, host authorization,
gateway, adapter, secret provider, storage limits, observed result, unknown outcome,
and lesson revocation. Descriptions and source-guide memberships are retained.
Different stages such as candidate lesson, retained lesson history, delivery,
measured outcome, checkpoint and verified checkpoint remain distinct nodes.

The node identity table is keyed by guide and concept title, not display index.
Edge IDs use endpoints and relation kind, not visible wording. Duplicate endpoint
relations retain their original meanings and guide memberships in metadata.
[src/legacyGraphAliases.ts](src/legacyGraphAliases.ts) freezes old core and
`feature-<guide>-<index>` aliases so display reordering cannot change old links.
The [inventory](evidence/product-explorer/graph-inventory.json) records all facts,
source paths and source digests, relations, aliases, and tour sizes.

Relations describe process/data flow, constraints, or structure. Cross-region
relations express documented facts such as a context decision preparing an envelope,
state containing events, configuration constraining a gateway, and recovery requiring
verified checkpoints. Reading cards and region headings are not semantic graph
vertices and do not count as proof of connectedness. Weak connectivity and directed
request-tour transitions have separate unit tests. This graph is not a live trace.

## Scene and interaction ownership

[src/CanvasGraph.tsx](src/CanvasGraph.tsx) renders the complete model in one ReactFlow
instance. Workflows change emphasis and camera focus, never graph membership. Nine
region headings provide orientation. Show all fits semantic nodes only. Fit workflow
uses that workflow's memberships; Focus node restores a readable inspection scale.
Zoom limits are shared with the workspace validator. At overview zoom, node marks
and headings remain available; inspection moves to a readable scale.

Memoized node and edge objects retain unchanged references. Controlled node
measurements are stored in local scene state so React Flow's measured-node readiness
hook can safely replace arbitrary focus timers. One Camera component handles graph,
workflow, node and card focus. Camera operations have zero animation duration,
including reduced-motion operation. Manual pan cancels automatic following and
pauses a tour. Pending operations cannot apply saved-state writes after unmount.

A selected node owns one attached explanation. It is a canvas-local region with a
visual connector, bounded dimensions, independent text scrolling and explicit close
control. It is not a dialog, backdrop or focus trap. Placement follows the node and
chooses space below or above it. If the owner leaves the viewport, a return-to-node
control replaces the explanation. Node dragging retains the explanation's owner.

There are no permanent edge labels or decorative status/count badges. Relation
meaning remains in accessible edge names, the explanation and Read graph connections.
Relevant nodes have outlines and relations have heavier strokes, so emphasis is not
conveyed only by color. Sources and capability limits remain in explanations.

## Stories and tours

[src/engineStories.ts](src/engineStories.ts) binds every node to the authored facts
from its guides and to incoming/outgoing relations. [src/engineTours.ts](src/engineTours.ts)
defines stable step identities and a reducer for running, paused, completed and exit
states. Five tours are available: request (10 steps), understanding (16), connection
(27), memory/corrections (29), and operations (19). Workflow tours are guided
inspection paths through several branches; they do not imply one causal execution
across every step. The request tour separately follows verified directed relations.

Back, Next, Restart and Exit remain with the selected step. Selecting a related node
pauses the tour. Follow step restores its owner and following. Escape closes the
explanation, pauses the tour and restores node focus. Exit clears the tour URL and
returns focus to Start guided tour. No guide is opened automatically by a tour.
The landing tour link is distinct from Try ARE, which retains its live-chat behavior.

## State and navigation

[src/canvasWorkspace.ts](src/canvasWorkspace.ts) schema 2 holds node positions,
selection, guide cards, viewport and stable tour/step IDs. Graph and documentation
versions are separate. The existing storage key is retained so schema 1 can migrate.
Valid cards, offsets and positions survive content updates; removed or malformed
entries are pruned with a notice. Invalid storage has a fresh-state recovery path.
Running tours reload paused; animation/DOM state is never persisted.

`feature` and `guide` links focus a workflow. `node` inspects a canonical node or a
legacy alias. `card` explicitly opens a guide. Legacy `node` with `page=1` still
opens the full reader. Invalid/conflicting destinations have a visible recovery
path. Full-reader origin `engine` restores node, camera and paused tour. Article
navigation can unmount the renderer; restoration tests do not claim DOM retention
across different pages. Workflow and tour changes within Explore retain the renderer.
Reset clears layout, cards, selection and tour, then fits the full graph.

## Content loading and failures

The generated `documentation-index.json` contains guide metadata and heading indexes.
Full Markdown is loaded only for the reader, guide cards or full-text guide search.
The generator validates both projections. `useDocumentation.tsx` provides loading,
retry and reload recovery. A failed canvas chunk has an error boundary with a reload
action; saved workspace state is retained. Documentation chunk bytes are included
in the documentation route's download budget. Visiting tours loads no extra manual
chunks. Explicit guide loads are reported separately from the graph/tour route.

Scrolling explanations has no application state handler. Existing guide offset
persistence coalesces writes without rerendering cards or reparsing Markdown.
The sidebar owns its scroll; mobile starts with navigation collapsed so the canvas
has room. Both states are tested. Storage failures leave in-memory exploration usable.

## Verification and limits

Run `npm run test:canvas`, `npm run benchmark:engine`, and `npm run benchmark:canvas`.
Current browser and performance evidence is linked in
[EXPLORER-RELEASE-NOTES.md](EXPLORER-RELEASE-NOTES.md). Timing on the shared headless
host is diagnostic; it does not prove dedicated-device latency or reader comprehension.
No engine/model calls are made by explorer navigation or tests.

## Open Questions

- Validate WebKit on a host with its required system libraries before claiming
  Safari support; the local browser matrix reports unavailable environments.
- Confirm the proposed latency targets on a controlled reference device.
- Gather first-time-reader feedback on explanation length and regional layout.

## Validation isolation

`test-explorer-candidate.mjs` builds into a unique temporary directory and passes it
through `ARE_DOCS_DIST`. All browser checks and benchmarks use that directory,
including manifest/asset accounting. It records source and asset hashes in the
candidate receipt and removes the temporary output on completion. This avoids
mixing browser requests with concurrent builds in the shared `dist` directory.
The 720×500, DPR-2 fixture emulates 200% page zoom from 1440×1000; it tests content
geometry and interaction, not browser-chrome controls or WCAG certification.

The eight “What matters to you?” choices focus and highlight semantic node groups
in the same graph. They retain the saved layout and never replace the dataset.
Download validation requires the static route closure and rejects any loaded
JS/CSS outside the reserved budget. Deferred assets can be reserved without being
loaded on first entry; the browser receipt lists that difference explicitly.

## Readable entry and node artwork

A fresh explorer session opens the first feature, “Understand the engine.” It
focuses that region instead of fitting all 73 nodes into the initial view. Saved
viewports and explicit node, feature, guide and tour links take precedence. Show
all uses an explicit overview URL and keeps the complete connected graph available.

Nodes reuse the existing shared sculpture artwork with the existing SVG fallback.
Core concepts retain their distinct symbols; other nodes use their feature-family
symbol. Titles use 16px text at normal zoom. Artwork is hidden only at overview
scale, where it would be too small to interpret. No graph identities are removed.
Unresolved device and reader-validation questions remain in Open Questions above.
