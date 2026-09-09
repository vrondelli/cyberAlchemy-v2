# Ontology v4 Workspace integration prototype

Status: construction candidate. Authority effect: none.

## Construction contract

Reuse the v4 definitions of SourcePackage, RecordIdentity, LatestSnapshot and
ContextProjection. The Workspace remains an inspect-only projection, never a
source owner. The immutable runtime head identifies the displayed event epoch.

Prototype scaffold: SemanticEvent -> calculates -> LatestSnapshot;
LatestSnapshot -> projects_into -> ContextProjection;
ContextProjection -> displayed_by -> Workspace ontology screen (proposed binding).
The Product behavior is package selection, authored-view selection, graph
navigation, source inspection and explicit refresh. Business meaning and source
authority remain in each imported record. The implementation contract is a
read-only GET /api/ontology-v4 snapshot served by a loopback Node adapter over
the existing Rust export command. No new DomainSpec compilation is claimed.

Views with node_ids and relation_ids or relation_types become bounded graphs.
Explicit relations add their real endpoints. Markdown views are displayed as
source documents, not interpreted as executable selectors. Unsupported selectors
or missing records fail that view visibly. Source numbers outside JavaScript's
safe integer range are displayed as decimal strings, never rounded or edited.

For relation_types views, node_ids are presentation anchors: include matching
one-hop incident relations and their real endpoints. This is an explicit UI
closure policy, not a change to authored selectors. The induced-only draft
showed zero Context relations because its operations lie outside the anchors;
browser inspection exposed that omission. No transitive expansion is performed.

## Two-lane plan

Product construction: contract/scaffold -> read-only export adapter -> package,
view and provenance UI -> focused tests -> browser tests -> exact candidate.
Runnable frontier: implement and test this integration. No operational blocker.

Operational support: local preview (session owner, affects browser verification);
publication (repository owner, no current construction stage); admission and
cutover (runtime/source owners, after Product approval). Publication, admission,
source retirement and cutover are deferred; they do not block prototype work.

Preserve the v4 candidate/store, old dist preview and unrelated chat edits.
Serve a separate integration build; never overwrite a frozen candidate.

## Run and test

From workspace/runtime, use `node --test scripts/ontology-v4-adapter.test.mjs`,
`node_modules/.bin/vitest run src/features/ontology/runtime-views.test.ts`,
and `node_modules/.bin/tsc --noEmit`.
Build an isolated directory with `node_modules/.bin/vite build --outDir
/tmp/<unique-preview-directory>`; start `node scripts/serve-ontology-v4.mjs
<preview-directory>`. The server prints its dynamically allocated loopback URL.
Open #/ontology. Existing Workspace graph remains selectable.

## Open questions and limits

The binding currently selects the local v4 demonstration store explicitly.
It is not an admitted live consumer, a daemon deployment, an ontology editor,
a new authority route or a large-graph performance certification. Source files
may evolve independently; this UI shows committed imported source bytes, not
an assertion of currentness against every working-tree source. Product review,
exact consumer cutover, authentication for remote use and production indexing
remain separate work. Imported view definitions are not promoted by rendering.
