# Workspace control-center prototype

A local interactive prototype of one conversation across writing, ontology
exploration, and delegated-work supervision.

## Open it

The current preview is served at http://127.0.0.1:4198/.

To start it again from this directory:

```sh
python3 -m http.server 4198 --bind 127.0.0.1
```

Messages, editing, layouts, and assignment changes are local fixtures held in
memory. Refresh starts a new prototype session. The existing Tauri app and its
live chat are not replaced.

## Try the journey

1. Write a draft in the bottom conversation. Its target starts on the essay.
2. Open Ontology from the surface navigation. The chat target stays on the essay.
3. Choose Arrange workspace, preview Ontology focus, then Apply layout.
4. Select a concept in the graph to attach supporting context. Search and zoom
   are available; scrolling pans a zoomed graph.
5. Restore the previous arrangement. Your essay, chat draft, and reading position
   remain. The essay also has a second preview of the same work identity.
6. Pin the primary essay, then propose another focus layout. Apply explains the
   conflict; unpin to proceed.
7. Use Save layout, resize the canvas width, and Load saved to test session layout
   recall. Chat expands upward using its Expand control.
8. In Orchestration, open Evidence & preview controls and simulate blocked
   research. Acknowledge the notice, inspect it, and return to the previous work.
   Acknowledgement leaves the underlying block unresolved.

The graph and research stages are illustrative fixtures. Replies explicitly
identify themselves as preview responses; no agents receive the messages.

## Sequence and models

- [Business ontology refinement](business.json): six concepts, guarded states,
  transitions, failure behavior, and preserved parent references.
- [System ontology](system.json): seven planned prototype components.
- [Traceability bridge](bridge.json): candidate mappings from contracts to components.
- [Detailed implementation plan](PLAN.md): authored before model and UI code.
- [Scenario mapping](scenarios.json): all 21 Definition Pack scenarios.
- [Results](RESULTS.md): observed checks and remaining product evidence.

The original [product/business ontology](../../control-center-ontology/README.md)
and [Definition Pack](../../interaction-definition-pack/README.md) remain intact.
This additive refinement binds exact Definition Pack bytes and verifies its
selected upstream sources. Schemas are owned in [ontology-schema.json](ontology-schema.json).

## Verify

```sh
node --test model.test.mjs
node validate.mjs
```

Node and Python 3 with jsonschema are required. The validator is check-only;
receipts are separately materialized under receipts and retain history.
Browser checks were run with the installed Playwright CLI using Firefox.
[browser-check.mjs](browser-check.mjs) contains the replayable function passed
to the CLI's run-code operation.

## Construction and operational scope

Status: candidate prototype. Authority effect: none. Product construction has
reached a browser interaction witness. The operational preview server is owned
by the current local session and serves only loopback traffic.

The full Rust/frontend suite, WDIO-specific build, unified Tauri smoke and
qualified cold-session differential benchmark campaign require integration into
an exact Tauri candidate. They are not evaluated by this prototype and their
existing budgets remain unchanged.

## Open Questions

The [ontology residue](../../control-center-ontology/residue.json) retains
automation, persistence, addon, adapter, usability, and capability-boundary
questions. This prototype evaluates explicit Apply and session-local continuity.
It does not resolve Lab vocabulary, live integration, final usability thresholds,
or the missing formal Define lifecycle evidence.
