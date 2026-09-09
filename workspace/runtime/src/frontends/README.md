# Workspace frontend hosting

Workspace hosts trusted frontend packages from other repositories. The first
registration is the existing orchestrator console in
[the sibling repository](../../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/EMBEDDING.md).
The frontend remains owned there; Workspace supplies navigation, shared observations
and an embedding adapter. The standalone console uses the same product components.

## Add a frontend

1. Add a pinned or local linked package dependency in the Workspace runtime.
   The package exports a React component and its stylesheet as text; importing
   the embedded entry must not mount a root, inject global CSS, start polling,
   dispatch work or change browser history.
2. Add an adapter that exports the component and stylesheet described by
   [contract.ts](contract.ts). It receives a relative path, href(path) and
   navigate(path). Pass explicitly selected services/data through this adapter;
   do not infer runtime selection or permissions from the hostname.
3. Add one entry to [registry.ts](registry.ts): stable ID, label, icon, mount path
   and lazy loader. Navigation and mounting come from the registry, without
   adding feature branches to WorkspaceApp.

[FrontendHost.tsx](FrontendHost.tsx) renders the component through a React portal
into its own shadow root. React context remains available across the portal.
The shadow boundary isolates CSS selectors and local element IDs; it is **not
a security sandbox**. Only reviewed, trusted packages belong in this build.
JavaScript shares the window: global event handlers must clean up, avoid hidden
surfaces and use composedPath() for shadow-aware input handling. No remote
module loader or automatic package discovery is installed.

Routes use #/apps/<id>/<feature-path>. The orchestrator's existing #/runs
and dashboard-result links are explicit compatibility aliases. Each app stays
under its configured mount path. New tabs, reload, back and forward retain
the feature route. A failed lazy import displays a bounded error surface.

## Orchestrator adapter

[orchestrator.tsx](orchestrator.tsx) uses the one RunsProvider shared with Dashboard.
[orchestrator-projection.ts](orchestrator-projection.ts) maps verified native
observations into the sibling's rendering contract. Native status, fixture mode,
unknown progress, verification and identity remain explicit in RunObservation.
Legacy status is a list grouping, not a lifecycle decision. Missing strategies,
workers, attempts, history digests and lifecycle decisions are not invented.

The sibling renders its existing Runs list, Result, Overview, Strategy, Trace,
Workers, Evidence, Lifecycle, Operations, Lab and Ontologies components.
Workspace no longer has its own RunsSurface implementation. The Lab's persona
and knowledge catalog is the sibling's bundled reference data, not active workers
or newly observed research.

The current backend still supplies local native observations only. Full research
projections and research composer/control services remain future connection work.
Embedding without explicit services is observational even on a non-loopback name;
standalone hostname-based controls cannot activate through this entry. Native
fixture services are now supplied as described below.

## Open Questions

Cross-feature service capabilities, authenticated runtime selection, richer source
projections and controls are owned by
[the integration plan](../../../plans/orchestrator-integration/PLAN.md#open-questions).
Existing Essays and other built-in surfaces can adopt this host incrementally.
They are not automatically migrated by installing this boundary.

## Native controls (T4)

The selected Workspace backend can now explicitly enable native fixture controls.
The existing sibling NativeTasks editor receives shared state, a bounded request
callback and refresh callback; it does not start its standalone polling loop.
Successful launch navigates to the same stable run view used by Dashboard.
Run details render cancellation only when the backend advertises it.

The gateway accepts only review, launch and cancellation for its configured
runtime ID. Same-origin and intent headers are required. The native console
remains the only writer and enforces digest binding, single capacity, lifetime
budget, duplicate review retries and uncertainty. Workspace creates no second
launch ledger. No pause/resume or research-planner capabilities are inferred
from a native connection.

## Navigation and focus

FrontendHost receives its active state from Workspace and focuses the first
visible h1 once per active route entry, including returning to a retained
frontend. A MutationObserver waits for lazy content or initial observations;
it disconnects after focus or when the route becomes inactive. Background
projection refreshes and local tab changes do not repeat route focus. The heading
is the route announcement, avoiding a second live announcement of the same name.
The host also provides a keyboard skip-to-content control. Frontends must expose
an h1 when route content is ready and own their internal tab/dialog/form focus.
Dashboard return navigation uses the same heading helper. Other built-in surfaces
are not automatically migrated to this focus contract.

Suspense and observation loading have status semantics. Native review progress,
expiry, availability and reconnection use live status messages; failed actions
use an alert. The editor retains focusable aria-disabled controls with guarded
handlers, so a busy state does not drop focus. Field errors are associated before
the first invalid input receives focus. A completed review focuses its heading
only while the initiating control still owns focus.

The adapter retains the last enabled service identity when observations go
missing, supplying null state and disabled capabilities so an offline event does
not unmount the draft. Cached identity never authorizes a request: the request
callback still requires current availability. Explicitly disabled configuration
remains disabled. No draft is persisted to disk; leaving the editor or reloading
can still discard it. UX4/UX6 and the integration plan own wider persistence and
assistive-technology questions.

## Mobile obstruction and reflow

Workspace exports the inherited CSS custom property
`--workspace-bottom-obstruction`. FrontendHost applies it as scroll padding
and control scroll margin within the shadow root, so the fixed mobile rail
does not cover a control scrolled into view. A frontend with additional nested
scroll containers must preserve that allowance. CSS isolation does not remove
this host-owned layout constraint. The Workspace rail keeps minimum touch
targets and scrolls horizontally if its registered apps exceed the available
width. Validation and remaining manual coverage are in
[UX5](../../../plans/orchestrator-integration/UX5-REFLOW.md#open-questions).
