# UX3 — focus, announcements and task recovery

2026-09-08 · owner-directed private construction candidate · authority effect: none.

## Plan and boundary

Implement A4/A5 and the review-recovery part of U5 from [UX-AUDIT.md](UX-AUDIT.md).
The user authorized the next task after UX2. Construction follows the D65 boundary
in [PLAN.md](PLAN.md); this change has no selected ontology-record dependency.

1. Establish active-route focus and loading semantics in the generic frontend host.
2. Keep the editor mounted through lost observations and guard unavailable actions.
3. Add field validation, review progress, actionable errors, expiry and safe recovery.
4. Test browser focus, asynchronous races and the existing isolated control path.
5. Refresh the existing loopback candidate and advance the UX DAG.

No runtime authority, persistent task schema, budget, credential or deployment
policy changes are included. VPS activation and MCP remain deferred.

## Implemented behavior

### Navigation

The host focuses the visible route h1 once on entry. It waits for lazy content and
initial observations, supports retained frontend re-entry, and cancels the wait
when inactive. Heading focus supplies the route announcement; a duplicate live
message with the same heading is avoided. A keyboard skip-to-content control is
available. Dashboard return navigation uses the same helper.

Back, forward, reload and deep links enter at the route heading. Local tab selection
keeps focus on its tab; projection polling does not focus the heading again.
Loading surfaces have status semantics. Other built-in Workspace surfaces have not
been migrated to this contract. See the [host contract](../../runtime/src/frontends/README.md#navigation-and-focus).

### Review and recovery

- Busy/unavailable controls use aria-disabled with guarded handlers, retaining
  keyboard focus. An immediate in-flight guard prevents duplicate requests before
  React has rendered the busy state. Review progress is announced separately.
- Required fields enforce the existing owner UTF-8 byte limits and reject null
  characters. Field errors are associated before the first invalid field receives
  focus. Owner validation remains authoritative.
- A successful review focuses its heading only if the initiating review button
  still has focus and the editor is visible. A user editing or moving elsewhere
  does not have focus taken back by the response. Edited drafts invalidate pending
  review responses.
- Review expiry uses a timer rather than relying on polling or another render.
  The expiry message updates without moving focus. Launch checks the deadline
  again at activation. Review again obtains a new review for the retained text.
- If the owner rejects an apparently current review as expired or mismatched,
  focus moves from the removed launch control to Review again.
- Readable errors explain connection, capacity, budget, validation and review
  failures. Raw diagnostic codes remain under Technical details. Errors use alerts;
  availability, progress, expiry and reconnection use status messages.
- Missing observations no longer unmount the native editor. The adapter retains
  only the last enabled service identity, with null current state and disabled
  capabilities. The request callback still requires current availability. Inputs
  and a pending review remain in memory; reconnection is announced without moving
  focus.
- Unconfirmed launch delivery is not converted into a fresh review or task. The
  editor retains the draft, blocks further submissions and links to Runs for
  inspection. Editing does not clear this guard. A known successful launch is not
  labelled uncertain merely because the following observation refresh fails.

## Evidence

[UX3-EVIDENCE.json](UX3-EVIDENCE.json) records results and source hashes.

The rendered [focus/recovery test](test-focus-recovery.mjs) uses real built
Workspace components with browser-mocked review and launch responses. It covers
initial loading, Dashboard and embedded navigation, history/reload, skip action,
polling, tab focus, associated errors, duplicate activation, review retry, timed
expiry, owner rejection, stale responses, offline draft retention and uncertain
launch recovery. It verifies the installed task journal is byte-for-byte unchanged.
Mock replies never reach the native owner.

The existing embedded browser test checks native identity/results, navigation,
search/filter, graph presentation, mobile isolation and offline recovery. The
existing control canary uses two tasks in a separate temporary native fixture
runtime, checking real review/launch/idempotency/cancel, budget and restart behavior.
It uses zero paid model calls and consumes zero installed launches.

Twenty-four sibling tests pass, including four new validation/error-policy tests.
Sibling TypeScript/Vite and the bounded Workspace TypeScript/Vite build pass.
Three automated mobile accessibility scans cover the ready editor, field errors
and failed review; they report no violations or incomplete checks in those sampled
states. These scans do not certify the whole application.

## Limitations and next frontier

The standard Workspace snapshot-generation build still has the previously recorded
catalog drift; the bounded build uses existing bundled snapshots. No real
screen-reader session, full browser zoom or cross-browser acceptance was performed.
DOM focus, accessible names, status/alert semantics and request counts are measured;
actual assistive-technology announcement wording remains UX6 verification.

Draft retention is in memory through connection loss. Leaving the editor or
reloading can discard an unlaunched draft; no disk persistence was introduced.
No automatic retry is made after uncertain launch delivery.

UX3 is complete. UX4 Overview hierarchy, consistent state vocabulary and capability
disclosure is next. U5's duplicate default titles remain a UX4 presentation concern;
review expiry, disabled feedback and error recovery are handled here. UX5 reflow
and UX6 acceptance retain their [DAG](UX-DAG.json) dependencies. Parent T5/T6 and
operational owners/gates in DAG.json are unchanged; MCP remains last.

## Open Questions

- Which real screen-reader/browser combinations should own final acceptance?
- Should unlaunched drafts survive explicit navigation and reload? This needs a
  separate persistence scope and disclosure, beyond offline in-memory retention.
- UX4 owns result prominence, technical-identity disclosure and consistent labels.
- UX5/UX6 own broader reflow, canvas accessibility and assistive-technology checks.
