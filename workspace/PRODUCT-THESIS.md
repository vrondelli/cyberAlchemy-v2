# CyberAlchemy Workspace: Control Center Product Thesis

Date: 2026-09-05  
Owner: CyberAlchemy v2 product owner  
Visibility: private  
Status: candidate product document; product direction approved in conversation  
Construction stage: product definition  
Authority effect: none

## Thesis

CyberAlchemy Workspace is a control center where a person directs work through
one persistent conversation, delegates execution to agents, and works with the
resulting artifacts in a space that adapts to their attention.

The central promise is continuity. A person can move between writing an essay,
examining an ontology, and supervising agents without rebuilding context or
managing separate conversations. The Workspace keeps the active work, its
supporting material, and the conversation connected.

This is an evolution of the Workspace capability within CyberAlchemy. The
direction approval authorizes recording this thesis. It does not establish
approval of a tested implementation or replace existing capability records.

## Who it serves and why

The initial user is a person constructing systems, conducting research, or
producing substantial documents with agents. Their work combines direct
editing, investigation, delegation, and review. Useful output often spans
several representations: prose, definitions, graphs, execution state, and
supporting evidence.

When these representations occupy separate destinations, the person must keep
reconstructing which conversation, assignment, and artifact belong together.
Workspace should carry those relationships visibly and preserve the person's
place as they move between them.

The expected value is less effort spent navigating and reconstructing context,
more time working on artifacts, and clearer intervention when delegated work
needs a decision. These are product hypotheses to measure through use.

## One conversation, multiple work surfaces

Chat is a permanent part of the Workspace, anchored at the bottom center. It
expands upward for discussion, planning, and review, then contracts when an
artifact needs space. The composer remains reachable. Resizing preserves the
draft, selection, and reading position.

Delegated agents appear as work associated with that conversation. Each
assignment has a purpose, progress, result, and access to its evidence. The
person can address a particular assignment from the same chat. The current
target must be visible so that a request such as “revise this” has an
unambiguous meaning.

One conversation does not require sharing its entire transcript with every
agent. Each delegation receives the context relevant to its assignment and
returns a result linked to the originating request. Assignment details can be
inspected without requiring a separate primary chat.

The Agent Reasoning Engine supplies the reasoning interaction and its receipts.
The existing successor orchestrator supplies the integration target for
delegated work, strategies, execution controls, and results. Workspace brings
these into a coherent experience while preserving their respective ownership.

## Space follows the task

Each surface needs enough space to remain useful: readable width for a document,
navigation room for a graph, or comparable areas for alternative results.
Workspace should arrange surfaces according to those needs and the person's
current task.

| Working situation | Proposed arrangement |
| --- | --- |
| Exploring an ontology | The graph fills the main canvas; chat stays compact in the bottom dock. |
| Writing an essay | The essay occupies the primary area, sources sit alongside it, and chat supports revision below. |
| Supervising delegated work | The orchestration graph occupies the primary area, with selected assignment details alongside it. |
| Comparing results | Artifacts appear side by side, with their shared question and context retained in chat. |
| Discussing the next step | Conversation expands while current artifacts remain available as compact previews. |

These arrangements are starting points. Users can resize, pin, rearrange, save
layouts, and restore the previous arrangement. Workspace can propose a layout
with a short reason and a preview, such as “Give the ontology more room.”

Adaptation must remain predictable. Streaming content must not continually move
panels, steal keyboard focus, or shrink material being read. User-pinned
arrangements take precedence over automatic suggestions. A transition should
preserve working state and offer a straightforward way back.

When available space cannot support several readable surfaces, the Workspace
should prioritize the active one and keep the others reachable. Keyboard
navigation, readable content, and reduced-motion preferences belong to the
same ergonomic objective.

## Attention is part of the product

The Workspace should make three things understandable at a glance:

- What am I working on?
- What is progressing independently?
- What needs me now?

The active artifact receives the most space. Background work stays compact.
A blocked assignment or decision becomes noticeable near its associated work
without replacing the current task. Routine progress should not compete with
reading or editing for attention.

Reasoning receipts explain decisions and help investigate results. Ordinary
use needs a concise status; deeper evidence remains available on demand.
Failures and requests for intervention receive stronger visibility than routine
receipt traffic. Displaying a receipt does not establish that its result is
correct or approved.

## Extensibility across hosts and addons

The broader “plugin everywhere, plugins inside” direction applies to this
experience. Addon-provided surfaces participate in shared selection,
conversation context, layout, and attention behavior.

An essay editor, ontology viewer, or orchestrator view declares its space needs
and supported interactions so Workspace can compose it consistently. Addon
packaging and capability meaning remain distinct; this thesis does not rename
either or make every capability a separate window.

When Workspace is embedded in another host, it should preserve the interaction
model within the space and permissions that host provides. The initial
construction target is the existing Tauri Workspace. Other host adapters can
reuse the model as their integration becomes available.

## First product journey

The first experiment follows one continuous task:

1. Ask for research through the persistent chat.
2. Inspect its delegated work in the orchestration view.
3. Open the resulting essay while keeping progress and context reachable.
4. Follow a referenced definition or ontology into the main canvas.
5. Request a revision against the explicitly selected artifact or assignment.
6. Restore the preferred writing arrangement without losing the draft or place.

This journey should reveal whether the shared conversation and adaptive space
make work easier to direct and understand.

## Evidence of success

Evaluate whether people can identify the active chat target, locate blocked
work, inspect supporting evidence, and recover a preferred layout without
losing their place. Compare the journey with the current separate-surface
experience, recording task completion, context mistakes, navigation effort,
unwanted interruptions, and layout recovery.

Existing performance budgets remain unchanged. Chat startup, command dispatch,
projection, paint, and navigation must continue to meet their applicable
budgets. The benchmark campaign must use qualified host conditions and a
meaningful repeated sample population, with evidence bound to the compared
candidates. A layout prototype alone cannot prove live orchestration or
end-to-end product readiness.

## Construction frontier and operational support

| Lane | Current position and next work | Owner and dependency |
| --- | --- | --- |
| Product construction | Record this thesis; next, define the interaction contracts and prototype the continuous journey. | Workspace construction owner; no operational dependency is needed to explore the interaction prototype. |
| Product construction | Integrate persistent chat, artifact surfaces, and successor orchestration after their contracts are made concrete. | Workspace and ARE/orchestrator owners; depends on current adapters and explicit context and identity bindings. |
| Product test | Test one frozen candidate through the journey, existing suites, and qualified performance campaign. | Product-test owner; depends on the integrated candidate. |
| Operational support | Reconciliation with cyberalchemy-lab, merge preparation, publication, and deployment remain deferred. | Respective repository and operational owners; these affect later integration or delivery stages and do not block the interaction prototype. |

Construction follows the existing D65 sequence from prototype definitions and
agent-facing ontology scaffolds through implementation prototypes, one exact
testable candidate, current product-test evidence, and product approval.
Separate operational decisions follow where required. This document does not
register ontology dependencies or modify accepted definitions.

## Sources and relationship to existing work

- Product intent: the user's control-center request and approval to create this
  thesis in the conversation on 2026-09-05.
- [Workspace capability introduction](README.md): existing capability boundary.
- [Workspace shell](runtime/src/WorkspaceApp.tsx): current separate surfaces.
- [Chat surface](runtime/src/features/chat/ChatSurface.tsx): existing chat,
  approvals, and reasoning-receipt presentation.
- [Successor orchestrator console](../../../cyberalchemy-successor/cyberAlchemy-v2/work-orchestration-implementation/frontend/README.md): integration target for
  strategies, assignments, execution controls, and results. This sibling
  checkout reference is local and requires that checkout to be present.

These sources are navigation references, not a frozen conformance manifest.
Current runtime behavior and exact source identities must be checked when
constructing the integration candidate.

## Open Questions

- Which layout changes can be applied automatically, and which should remain
  previewed suggestions? User-pinned arrangements always take precedence.
- How should the visible chat target distinguish the selected artifact, its
  assignment, and the broader task when more than one is relevant?
- Which workspace, conversation, and layout state should persist across restarts
  and across embedding hosts?
- What is the smallest shared contract through which addon surfaces report
  space needs, selected context, and requests for attention?
- Which current successor adapter will supply the Tauri integration, and how
  will it expose unavailable, stale, or disconnected state?
- What measured usability thresholds should accompany the unchanged performance
  budgets before the integrated candidate is submitted for product approval?
