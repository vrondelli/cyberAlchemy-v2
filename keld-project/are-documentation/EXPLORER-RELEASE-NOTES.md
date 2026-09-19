# Explorer release candidate notes

Status: explorer update deployed to https://are.keld.studio/ on 2026-09-18 after explicit user authorization.

The explorer now uses one complete connected graph across workflows. It replaces
selected-feature graph swapping and automatic whole-guide opening with node
inspection and guided tours. Connection labels and redundant badges are removed;
node titles, source links and capability limits remain.

## Readability follow-up

Restored shared node artwork and increased title size. Fresh sessions focus the
first feature; saved views and explicit links retain their destinations. Show all
remains available for the complete graph.

## Changes

- 73 semantic nodes, 105 canonical connections, nine source-guide regions.
- Five tours with attached explanations, highlighted nodes/relations, Back/Next,
  pause/follow, restart and exit. Full guides are optional explicit actions.
- Stable semantic identities and frozen legacy aliases; compatible schema-1 canvas
  data migrates to schema 2. Reload pauses tours and retains valid layout and cards.
- Compact explorer controls, collapsible navigation and independent scrolling.
- Metadata/full-manual loading split with retry/reload recovery and explicit budgets.

## Verification evidence

- [Isolated candidate receipt](evidence/product-explorer/candidate.json)
- [Graph inventory](evidence/product-explorer/graph-inventory.json)
- [First feature with restored icons](evidence/product-explorer/first-route-desktop.png)
- [Complete graph screenshot](evidence/product-explorer/whole-graph-desktop.png)
- [Attached explanation screenshot](evidence/product-explorer/tour-desktop.png)
- [Complete graph and tour checks](evidence/product-explorer/results.json)
- [Touch, narrow screens and keyboard checks](evidence/product-explorer/mobile-results.json)
- [Navigation and failure recovery](evidence/product-explorer/recovery-results.json)
- [Browser matrix](evidence/product-explorer/browser-matrix.json)
- [Layout and sidebar](evidence/explorer-layout/results.json)
- [Explicit guide cards](evidence/canvas-docs/results.json)
- [Full reader](evidence/manual-reader/results.json)
- [Download budget](evidence/performance/download-current.json)
- [Browser asset closure](evidence/performance/download-browser.json)
- [Full-graph workload](evidence/performance/full-engine.json)

The full-graph benchmark includes all nodes/edges, nine expanded guide cards and an
active explanation. It measures scrolling, tour steps, pan and zoom, with three
repetitions per viewport. Structural checks are release-candidate gates; timing is
diagnostic on this shared host. The separate guide-card benchmark retains its
one/three/five/nine-card workloads.

The final isolated run passed all 15 validation stages, including 20 unit tests.
Chromium and Firefox smoke tests passed; the browser-matrix stage records WebKit
as unavailable, rather than a successful browser test. All six full-graph workloads
passed structural checks. Tour-step p95 ranged from 104.7 to 151.1 ms on this shared
host: the proposed 100 ms dedicated-device target has not been demonstrated.

## Migration and rollback

Schema 1 is read from the existing `are.documentation.workspace.v1` session key;
schema 2 is written there after migration. Versioned state is local to the browser
session. Unknown node or tour identities are pruned while valid cards remain.
Reset canvas is an explicit way to discard the layout. The old reader cannot read
schema 2: rolling back the site may reset its canvas rather than restore the new
layout. Export session storage before a rollback if a layout must be preserved.

## Open Questions and release limits

WebKit is unavailable on this Linux host because system libraries are missing;
that is not a Safari pass. Chromium and Firefox have functional smoke coverage.
The 200% zoom fixture emulates viewport geometry; actual browser-control zoom and
broader assistive-technology checks remain separate. No WCAG certification is implied.
Dedicated-device timing and human first-time-reader feedback remain follow-up
validation before wider support/performance claims. Packaging and deployment remain
separate owner decisions. This candidate does not change backend authorization,
model integration, live-chat access or ARE learning defaults.

## Deployment

The static page update is live at https://are.keld.studio/. The deployment adds
a static-asset layer to the existing public-chat image, preserving its backend
code. Only the public-chat container was replaced; the edge, inference broker
and provider gateway retained their container identities. All ARE services are
healthy. The public page, icons, initial feature, tour controls, complete graph
and backend status passed post-deployment checks. No paid model turn was run.

The deployment includes the concurrently added global live-chat UI mount; the
exact deployed build passed desktop, mobile, recovery and byte-budget checks
before rollout. Earlier full-suite evidence remains a separate source snapshot.

[Deployment receipt and rollback location](evidence/product-explorer/deployment.json)
retain the old and new image IDs and the backed-up Compose path. Restore that
Compose file and run `docker compose -f compose.presentation.yaml up -d --no-deps
--wait public-chat` from the deployment directory to roll back. Existing browser
zoom, WebKit, dedicated-device performance and reader-study questions remain open.

## Headline deployment

“A Brain for your agent” is live in the animated and reduced-motion headings.
Public browser checks passed for both variants and the explorer. Backend status
reports configured, available live service. The rollout preserves the newer
backend and its active Compose override. An initial base-only rollout failed
health checks and was rolled back; the successful retry uses both files.

[Headline deployment receipt](evidence/product-explorer/headline-deployment.json)
records the current image and backed-up override. For this deployment, rollback
must restore that override and invoke Compose with both `compose.presentation.yaml`
and `compose.presentation.candidate.yaml`; the earlier base-only rollback recipe
is superseded. Existing support and performance questions remain open.
