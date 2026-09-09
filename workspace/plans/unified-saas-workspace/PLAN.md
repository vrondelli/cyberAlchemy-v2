# Unified CyberAlchemy Workspace

Status: implementation campaign candidate
Objective route: `CA2-ROUTE-IMPLEMENT`
Authority effect: none

## Product target

One Tauri-hosted Workspace shell composes separately owned project capabilities.
The shell does not merge their domain models or inherit their authority.

```text
Workspace shell
  -> Explore plane (generated, read-only WorkspaceSnapshot)
  -> Essays plane (Essays-owned lifecycle and repository)
  -> Agent adjunct (Rust accepted-text and proposal ledger)
  -> Ontology plane (source-bound React Flow graph projection)
```

The active frontend root is `cyberAlchemy-v2/workspace/runtime`. Tauri already
packages that root's `dist`. The standalone Essays entry remains usable, while
its exported application surface can be composed inside Workspace.

## Contract boundaries

| Contract | Owner | Meaning | May mutate? |
| --- | --- | --- | --- |
| Workspace `WorkspaceSnapshot` | CyberAlchemy Workspace | Generated semantic catalog projection | No |
| Essays `EssayWorkspace` | Essays runtime | Writer-controlled intent, plan, draft, review, residue, export lifecycle | Browser-local only in the first slice |
| Rust `WorkspaceSnapshot` | Essays agent runtime | Accepted text, agent proposals, effects, conflicts, and evidence | Only through typed Tauri commands |

The first slice treats the Rust runtime as an agent-proposal adjunct. It does
not claim that the Rust schema persists the complete Essays lifecycle.

## Interaction contract

- The application rail is icon-first, but every destination has a concise
  accessible name, visible focus, selected state, and hover/focus tooltip.
- Project navigation opens an owned project surface; it does not transfer
  authority to Workspace.
- Web mode reports the desktop agent runtime as unavailable.
- Tauri mode identifies the current principal as a verified local-process
  identity, not as a verified human.
- Agent proposals stay visually and semantically separate from accepted text.
  Acceptance requires an explicit action bound to the current revision.
- Relation color is never the only ontology cue: every edge also retains a
  predicate label, arrow direction, and family-specific line treatment.

## Reference characteristics

These are planning inputs, not design authority:

- React Flow subflows, minimap, controls, and grouping provide the interaction
  substrate for portal scenes and bounded graph navigation:
  <https://reactflow.dev/examples/grouping/sub-flows>
- Neo4j Bloom Perspectives demonstrate task-specific business lenses that can
  limit visible categories and relationship types:
  <https://neo4j.com/docs/bloom-user-guide/current/bloom-perspectives/>
- Linear's keyboard and command-menu patterns motivate fast selection and
  contextual actions without making every operation permanently visible:
  <https://linear.app/docs/select-issues>
- WAI accessible-name guidance constrains icon-only controls:
  <https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/>
- Tauri commands are the explicit frontend-to-Rust boundary:
  <https://v2.tauri.app/develop/calling-rust/>

## Iterations

### Slice 1 — Essays inside Workspace

1. Compose Essays through its package boundary.
2. Add accessible Explore and Essays destinations to the shared shell.
3. Open the real `CA2-PROJECT-ESSAYS` record into the Essays surface.
4. Attach the typed Tauri agent bridge without simulating it in web mode.
5. Prove lifecycle, serialization, Rust persistence/conflict behavior, build,
   and browser interaction against the generated Essays project.

### Slice 2 — Ontology canvas

1. Promote the experiment's generator, semantic icons, graph functions, and
   React Flow surface together.
2. Bind the production graph only to exact Workspace `nodes.json` and
   `relations.json` bytes.
3. Add predicate-family colors, non-color redundancy, portal focus, guided
   perspectives, minimap, detail lens, keyboard operation, and graph tests.

### Slice 3 — Proposal-to-draft review handoff (active)

Existing D65 predecessors already define proposal non-mutation, owner
disposition, expected revision, `accept-proposal`, and `reject-proposal`.
Staging therefore remains a UI working-buffer action; it does not become a new
accepted-state transition or a new semantic authority.

The persisted interaction state machine is keyed by Workspace identity,
proposal identity, and a monotonically unique stage epoch. One Essay may have
only one active staged proposal; replacing it requires explicit confirmation.

```text
unstaged
  -> staged-unsaved
  -> saved-exact | reconciliation-needed
  -> disposition-in-flight
  -> disposition-unknown | accepted | rejected | terminal-conflict
```

The happy-path interaction is:

```text
pending proposal
  -> explicit Stage in editor
  -> staged working buffer (not saved, not accepted)
  -> explicit Essays Save accepted draft
  -> writer-saved exact match
  -> explicit Accept saved draft in ledger
  -> accepted in the Rust ledger

writer-saved different canonical Markdown bytes
  -> reconciliation-needed
  -> explicit Reject with reason, or restage the original proposal
```

Exact matching uses the Essays canonical Markdown bytes produced by
`normalizeMarkdown`, not the raw proposal string or a digest alone. SHA-256 is
retained only as evidence. A qualifying save must advance both the Essays
workspace revision and the essay revision beyond the values captured at
staging; Rust ledger revisions remain an independent sequence and are never
compared to Essays revisions. Every later save re-evaluates the handoff. A
divergent save disables acceptance, while an unsaved dirty buffer does not
change which exact persisted Essays revision is being reconciled.

Accept and Reject form a non-atomic cross-store saga. Before either invoke, the
client persists one stable request identity and then refreshes the Rust
snapshot. The proposal must still be pending, its `source_revision` must equal
the staged ledger revision, and the ledger workspace accepted revision must
still equal that revision. Transport ambiguity becomes
`disposition-unknown`; retry first reconciles from a fresh snapshot and reuses
the same request identity. Terminal ledger status wins after relaunch, while
unresolved local residue remains visible. A stale revision or incompatible
terminal state becomes `terminal-conflict`, never an implicit retry.

Implementation boundary:

1. Add a typed proposal-handoff reducer and persistence adapter in Workspace.
   The record carries proposal identity, source ledger revision, Essays
   revision at staging, observed saved revision, and visible residue. It never
   claims editorial authority.
2. Extend the exported Essays component with one inbound staged-buffer prop and
   one saved-draft observation callback. Receiving a proposal changes only the
   unsaved editor buffer. The stage epoch participates in the Milkdown key so
   the visible editor, not merely React state, receives the proposed bytes. The
   existing `Save accepted draft` action remains the writer-controlled
   persistence transition.
3. Add `Stage in editor`, persisted exact-match reconciliation, stable-request
   retry after an ambiguous ledger result, and confirmed `Reject` with a
   trimmed non-empty reason to Agent Dock. Reject never restores, erases, or
   saves the editor buffer. Ledger acceptance stays disabled until the exact
   canonical staged text has been saved by Essays at later workspace and essay
   revisions.
4. Make Tauri WebDriver crates optional under the `wdio` Cargo feature, select
   only the default capability in ordinary configuration, and add a WDIO-only
   configuration/capability path for the smoke. The ordinary desktop runtime
   remains free of registered WebDriver plugins and permissions.
5. Make rail tooltips mutually exclusive when pointer hover and keyboard focus
   coexist.

Exact intended implementation files:

- `essays/runtime/src/App.tsx` and focused component tests;
- `essays/runtime/src/domain/markdown.ts` and its existing canonicalization
  tests; `essays/runtime/package.json` only if an export is required;
- `workspace/runtime/src/WorkspaceApp.tsx`;
- `workspace/runtime/src/features/agents/{AgentDock.tsx,tauri-agent-bridge.ts,proposal-handoff.ts}` and tests;
- `workspace/runtime/src/styles.css`;
- `workspace/runtime/wdio/{specs/unified-workspace.e2e.mjs,SMOKE-RECEIPT.candidate.json}`;
- `essays/development/agent-runtime/implementation/desktop/src-tauri/{Cargo.toml,tauri.conf.json,capabilities/**}` and `src/main.rs` only if feature registration requires it;
- `workspace/runtime/wdio/{run-smoke.mjs,wdio.conf.mjs,vite.config.mjs}` only
  where clean storage or the WDIO-only capability selection requires it;
- this plan and the exact implementation manifest only when their bound bytes
  require refresh.

Verification contract:

- unit tests prove a pending proposal cannot change an `EssayWorkspace` and
  cannot be ledger-accepted before a later explicit Essays save;
- reducer-table tests cover every state/event pair, corrupt persisted records,
  reload, stale snapshots, terminal remote status, and same-request retry;
- canonicalization tests cover CRLF, trailing spaces, outer whitespace, and a
  terminal newline;
- every later divergent saved edit becomes visible `reconciliation-needed`
  residue;
- rejection requires confirmation, a non-empty reason, a fresh snapshot,
  stable request identity, and expected revision;
- actual WebKitGTK/Tauri traverses Explore -> `CA2-PROJECT-ESSAYS` -> owned
  Essays surface, stages one proposal, saves it, accepts it, relaunches, and
  proves SQLite persistence and replay safety. The fixture clears or namespaces
  browser localStorage, explicitly creates the studio, accepts intent, and
  generates the plan before staging;
- a real stale or terminal-status path proves visible residue survives relaunch
  without test-only Rust semantics;
- actual WebKitGTK/Tauri also opens Ontology, activates a portal and filter,
  opens the detail dialog, and captures the `1280x820` surface;
- desktop browser evidence contains at most one visible rail tooltip;
- ordinary Cargo build excludes both WebDriver dependencies and permissions,
  while the `wdio` build and smoke remain available;
- the canonical Workspace generator continues to fail closed on
  `WORKSPACE_CATALOG_SNAPSHOT_DRIFT`.

#### Reviewed Slice 3 correction candidate

The correction candidate keeps exact-save authority in the pure
`hasExactSavedEvidence` predicate: canonical Markdown bytes must match and both
observed Essays revisions must be strictly later than their staged values.
SHA-256 remains evidence only. Saved observations are monotonic; an older pair
cannot replace newer evidence, while different bytes for one identical
workspace/essay revision pair produce fail-closed integrity residue.

An ambiguous disposition retains its original request ID and deadline. Before
retry, the UI obtains and reconciles a fresh Rust snapshot. An expired attempt
is never invoked again: a still-pending ledger becomes visible
`terminal-conflict`, preserves the expired identity, and requires an explicitly
confirmed new stage epoch for any new request. Later saves do not erase
`disposition-in-flight` or `disposition-unknown`; divergence disables an accept
retry. Terminal ledger status still wins, while a later divergent Essays save
remains explicit cross-store residue rather than an alignment claim. The UI
shows both the exact Essays revision pair targeted by acceptance and the latest
observed saved pair.

The revised real-Tauri smoke candidate clears the Essays portal when selecting
the coordination perspective, proves `WORKSPACE-REL-004` as a `coordinates`
edge, refocuses `CA2-PROJECT-CYBERALCHEMY-WORKSPACE`, and then opens detail. It
also creates proposal B at accepted ledger revision 1, stages and saves it,
rejects it through existing Tauri IPC while the UI snapshot remains pending,
and requires the subsequent UI acceptance preflight to persist
`terminal-conflict` without changing ledger revision 1 or proposal A text.
That residue must survive relaunch. The full WDIO smoke remains
`NOT_RUN_AFTER_REVISION` for the parent-owned execution step; focused TypeScript,
Vitest, and JavaScript syntax checks are the helper's candidate-only validation.

### Slice 4 — visual regression and conformance hardening

1. Fix desktop and responsive viewport matrices.
2. Capture deterministic screenshots with stable data, fonts, and motion.
3. Calibrate structural screenshot tolerances and preserve aesthetic quality
   as human-review residue.
4. Run the Workspace frontend, Tauri/Rust runtime, and real-project browser
   campaign together.

The first baseline remains a candidate until human review. Slice 3 captures
candidate screenshots at `1280x820` and records viewport, WebKitGTK/Tauri
identity, fixture identity, and image digest, but sets no aesthetic PASS or
pixel threshold. Slice 4 may add automated image or geometry comparison to
detect later drift; neither mechanism can promote aesthetics, product value,
or owner acceptance.

## Review record

The first independent review returned `REVISE`. The accepted corrections were:

- preserve three distinct contracts rather than inventing a lossless merge;
- make the shell a composition boundary with read and action planes;
- use the Rust runtime as an agent adjunct until a complete Essays persistence
  binding is authored;
- promote the ontology experiment as a complete source-bound unit;
- make pixel precision testable through fixed viewports and screenshot evidence.

The second independent review also returned `REVISE`. It confirmed the unified
shell, current ontology graph, and real Tauri/SQLite round trip, then identified
the active Slice 3 gaps: no proposal-to-editor handoff, no rejection UI, no
complete Tauri project/ontology navigation proof, a desktop tooltip collision,
and no candidate visual-regression baseline at the actual Tauri viewport.

## Claim ceiling

Passing the campaign can establish a local candidate implementation and its
test evidence. It cannot establish ontology admission, owner acceptance,
publication, release, deployment, or product value.
