# T5D — Explicit knowledge-context inspection

Candidate construction, 2026-09-08. Authority effect: none. Owner authorization:
user “next”; [D65 construction boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Use and scope

Open Runs → Research ontology. Select a record in the canvas or expand **Browse
records and relationships without the canvas** and select it with keyboard or
touch. The existing inspector now appears before the canvas and shows the record,
status and relation counts. **Inspect source references** exposes projected path,
selector and digest; absent fields say **Not reported**. It does not open files,
resolve external references or verify their contents.

For one concept, **Preview concept context** shows exactly what can be selected:
its ID, label, definition, recorded status, source-reference metadata and an
explicit authority-effect/claim-ceiling statement. **Prepare task from this
concept** opens the existing Native tasks composer with a pending selection.
**Use selected source** is still required to replace supplied input; review and
launch remain separate explicit controls. Persona profiles, source pointers and
research-run records remain inspectable and have no concept-context action.

Only the selected concept is included. Neighboring records, persona assignments,
source-file contents and graph relationships are not inferred into a task. The
existing three concept records retain candidate/reviewed status; neither status
becomes authority by inclusion in context. Workspace ontology remains separate
from this sibling research projection.

## Contract and return inspection

The [context serializer](../../runtime/src/features/runs/knowledge-context.ts)
produces `workspace-research-concept-context/v1` text with authority_effect none.
T5B wraps it as a knowledge source, using the existing `concept:` record ID,
`record-context` selector and SHA-256 of that exact context text as revision.
Definition, status and source-reference changes therefore change the revision and
native task digest. Missing selectors/digests are represented as null in context.
The digest binds projected bytes; it does not authenticate upstream ownership.

The [source navigation contract](../../runtime/src/features/runs/source-navigation.ts)
returns to the existing Research ontology route. Current matching context,
changed revision/text and unavailable context are distinct. A reload resolves
against the current bundled record, not an invented historical snapshot. Run
origins use the same source link and Back to run contract introduced in T5C.

The sibling [embedding extension](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/EMBEDDING.md)
accepts a selected record ID and a host-rendered context slot. Graph/source
inspection remains owned by the sibling frontend; Workspace owns cross-feature
selection and review services. Selected inspector data is derived from current
graph records, and polling does not repeatedly focus the inspector.

## Verification and local candidate

[T5D evidence](T5D-EVIDENCE.json) records contract tests, sibling tests, TypeScript
and the bounded Workspace build. The [browser journey](test-knowledge-context.mjs)
uses an isolated native owner for one real review. Inspection, preview and input
selection send zero POSTs; the explicit review is the only POST. No launch is
requested and no job is created. Installed history and fixture budget are
preserved. Desktop/mobile axe scans cover the changed inspector and context
controls; keyboard selection focuses the inspector heading and 320px reflow is
checked. Existing embedded navigation is also replayed against recorded runs.

Local candidate: http://127.0.0.1:4187/#/apps/orchestrator/ontologies .
Frontend rollback: ~/.local/share/are-workspace/dashboard-01/frontend-before-t5d .
This change refreshes local assets only; no service restart or VPS action occurs.

## Open Questions

T5E owns integrated source → review → run → Essays acceptance. Upstream document
retrieval, source-owner attestation, historical knowledge revisions, multiple
record selection and larger-context policies require separate contracts. This
stage intentionally selects one bundled concept record, not arbitrary knowledge
files or a retrieval engine.

Full product validation, UX6 manual screen-reader/browser gaps, standard catalog
snapshot drift and VPS activation remain in the [parent plan](PLAN.md#open-questions).
The local fixture still returns a fixed test response; MCP remains last.
