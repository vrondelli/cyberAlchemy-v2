# T5C — Chat and project source entry

Candidate construction, 2026-09-08. Authority effect: none. Owner authorization:
user “next”; [D65 construction boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Use

In Explore workspace, select a project and choose **Prepare task from project
description**. Only that record's displayed meaning is selected. The source uses
the record ID, bundled snapshot ID as revision, and `meaning` selector. Files,
provenance references and the rest of the project are not exported.

In Chat, choose **Prepare task from this message** on a recorded user or completed
assistant message. Streaming output and the system boundary message have no action.
The source uses its captured thread ID, local message ID selector, and SHA-256 of
that message's text as a content revision. This is a local observed message, not
an authenticated native transcript revision. Browser-only Chat has no live Tauri
bridge; this feature does not add a browser Chat backend.

Both actions open the existing sibling Native tasks composer. Expand **Preview
selected source**, inspect it, then choose **Use selected source** to replace only
the supplied input. Title and instruction stay as written. Applying a selection
invalidates a previous review. The existing Review task and Launch fixture task
controls retain their separate owner decisions. The selected connection remains
a fixed-response fixture; it does not generate a model answer.

A pending selection cannot silently replace another. Dismiss selection leaves the
draft intact. Workspace keeps composer text in memory across source navigation;
reviews are not restored after leaving the composer. The source selection and
draft disappear on reload. No source selection triggers review or launch itself.

## Return navigation and boundaries

The composer offers **Return to selected source** after input replacement while
the input remains unchanged. Runs with a valid T5B Chat/project origin offer
**Open declared source**. The target carries source coordinates, text checksum and,
for runs, a **Back to run** link. Selected content is never placed in the URL.
Only local Chat and project destinations are constructed.

Return inspection distinguishes matching revision and text, changed content or
revision, and unavailable source. Project links select the declared project in
the current bundled snapshot; they do not retrieve historical snapshots. Chat
links resolve against retained messages. A reload loses those messages and reports
unavailable rather than reconstructing a conversation. The return heading receives
focus on entry; source selection and preview controls remain keyboard accessible.

Source coordinates remain caller-declared. Matching current local content does
not authenticate source ownership. T5B continues to bind the exact selection to
the native task digest. Native schemas and journals have no additional writers.

## Implementation and evidence

- [Source entry provider and controls](../../runtime/src/features/runs/SourceTasks.tsx)
- [Navigation and comparison contract](../../runtime/src/features/runs/source-navigation.ts)
- [Workspace project entry](../../runtime/src/WorkspaceApp.tsx)
- [Chat message entry](../../runtime/src/features/chat/ChatSurface.tsx)
- [Existing frontend adapter](../../runtime/src/frontends/orchestrator.tsx)
- Sibling composer: `../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/src/NativeTasks.tsx`
- [T5C evidence](T5C-EVIDENCE.json) and [browser journey](test-source-entry.mjs)

Browser tests use isolated real native reviews, a mocked Tauri Chat bridge and an
explicitly mocked run projection for source navigation. They create no native
jobs. Existing-history and review-recovery regressions preserve installed journals
and fixture budget. Automated accessibility evidence covers the changed source
controls and sampled mobile composer; it does not replace manual screen-reader
acceptance.

Local candidate: http://127.0.0.1:4187/#/collections/projects . Frontend rollback:
~/.local/share/are-workspace/dashboard-01/frontend-before-t5c . No service restart
is required for this asset refresh.

## Open Questions

T5D owns explicit knowledge-context inspection. T5E owns integrated acceptance
across source selection, review, run and Essays output. Live native Chat and
historical transcript resolution remain dependent on their owning runtime; the
mocked browser bridge is not proof of a live Tauri journey. Source-owner attestation,
substring selections for oversized messages and durable composer recovery remain
future work. Current source/draft state is tab-local memory.

Whole product acceptance, catalog snapshot drift, UX6 manual/browser gaps and VPS
activation remain in the [parent plan](PLAN.md#open-questions). MCP remains last.
