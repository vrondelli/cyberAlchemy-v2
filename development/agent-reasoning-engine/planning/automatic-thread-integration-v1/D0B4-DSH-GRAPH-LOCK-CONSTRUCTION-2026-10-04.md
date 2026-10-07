# D0b.4 — pinned DSH Web graph-lock construction contract

Status: **candidate plan, not implementation authority**, 2026-10-04.
Route: `CA2-ROUTE-PLAN`. Authority effect: none. Parent:
[D0b supported admission contract](D0B-DSH-SUPPORTED-ADMISSION-CONTRACT-2026-10-04.md).
The [source and disposable inventory audit](evidence/D0B4-DSH-EFFECTIVE-GRAPH-LOCK-SOURCE-AUDIT-2026-10-04.md)
is evidence for this contract, not a qualification receipt.

## Outcome and trust boundary

D0b.4 must make a selected DSH Web Host reject a changed or unknown effective
plugin/preset graph **before** another selected Session is created, an ARE
prompt permit is consumed, or a model request begins. It must witness the
actual standing mount of each Agent, including an older generation retained
after a preset file changes. The first test profile may be the explicitly
restricted `are-read-only` no-tool profile. Passing it must not be called full
Web parity: goal, command, plan, subagent, plugin and tool producers remain
D0b.3/D1 work.

The private-patch prototype assumes one trusted, version-pinned DSH process.
A JavaScript callback in that same process can alter objects or write a Session
log directly; a self-reported inventory or monkey-patched method is **not**
a sandbox against hostile code. Qualification therefore also requires an
exact allowed module graph, no user-authored preset/plugin roots, and no
unreviewed dynamic code. If that premise cannot be enforced, reject the
profile or move untrusted plugins behind a separate process/capability
boundary. No live profile is activated by this plan.

## Witness model

Construct two distinct fingerprints, never one `--dump-config` hash:

| Witness | Exact contents | Why separate |
| --- | --- | --- |
| Source pin | `@deepseek-ai/dsh@0.1.5-rc.2`, nested package versions, lockfile and patched-source digests, profile/config and allowed module paths with file digests | Reject dependency or source drift before boot. Names alone are not code identity. |
| Effective Host graph | Every Loader entry, including groups, with ID, resolved module identity, evaluated enabled state and fiber phase, plus every registered Cordis runtime/fiber mapped to an allowed Loader ancestry, allowed Agent-creation delta or explicitly enumerated trusted bootstrap registration | `pluginInventory.list()` omits direct `ctx.plugin(...)` registrations and excludes group rows. An unmatched callback/fiber fails closed. |
| Preset graph | Exact resolved roots, default ID, selected preset ID, mounted Loader rows **including groups and nested fibers**, fiber phases, and model-facing tool/effect catalog | An unmounted roster-file projection does not attest running plugins. Unknown, conditional or extra tool rows fail closed. |
| Agent binding | Native Session ID, Agent object/generation, actual `standingMountFor(agent.ctx)` key, its mounted-tree digest and Host graph epoch | `compositionInventory()` chooses the newest mount; an older Agent can still use a previous one. |

Canonical serialization must order rows and fields deterministically while
retaining duplicate IDs as an error rather than silently deduplicating. A
process-local boot nonce plus monotonically increasing epoch identifies a
qualified runtime instance; the source manifest is reusable across boots,
but an Agent/permit binding is not. A structural digest cannot by itself
prove callback origin: map each runtime/fiber to the resolved, digest-pinned
module and Loader ancestry, and reject a callback that cannot be mapped.

The pinned Cordis `RegistryService.plugin` runtime record retains `name`,
`callback`, `fibers` and `Config`, but no resolved module URL or content digest.
Loader gives nested fibers an Entry inherited from their parent context; that
is ancestry, **not** callback provenance. Its optional caller-stack supplier
can be passed into `plugin`, so a stack string is diagnostic rather than an
independent trust witness. Consequently a post-boot Registry/Loader snapshot
cannot establish the source-bound mapping required above. The qualified path
must capture a trusted resolved import identity and registration ancestry
at/before registration, before Web readiness; unmatched direct registrations
fail closed. This still relies on the explicitly trusted, pinned same-process
code premise and is not hostile-plugin isolation.

## State machine and admission order

```text
boot/unqualified -> checking -> qualified(boot, epoch, manifest, Agent set)
                         |                     |
                         v                     v
                      rejected <--- revoke synchronously before graph mutation
                                            |
                                            v
                                    stopped/quarantined
```

1. Install the graph observer **before** exposing Web readiness or permitting
   Session creation. Wait for the Host Loader and selected preset mount to
   settle, then compare the effective Host, Registry, preset, and tool graph
   to the exact manifest. Do not accept an inventory RPC response as the sole
   witness; it is an independently testable read model.
2. A graph-affecting operation synchronously latches `revoked` before its
   first mutation or asynchronous yield. The pinned private-patch candidate
   must cover `RegistryService.plugin/delete`, Loader `Entry`/`EntryTree`
   update/init/dispose paths, Fiber restart/update, and preset root/default,
   `ensureStanding` remount and `select`/recompose paths. Instrument a
   disposable no-tool turn first to distinguish expected lifecycle activity
   from post-qualification drift. Do not assume an after-change event or a
   periodic snapshot can prevent the first unmediated request.
3. For file/settings inputs that may change without a Cordis event, compare
   the exact selected composition bytes and resolved roots/default at each
   creation/prompt boundary. The synchronous final append guard needs a
   stable in-process epoch and a synchronous source-fingerprint check (or a
   source watcher whose missed-event race is closed by that check). A file
   change must revoke before a stale permit can commit; a watcher alone is
   insufficient. In-memory graph mutation still needs pre-mutation hooks.
4. Before Agent publication, bind its actual standing mount and native
   generation. Before ARE preparation and again after it, verify the Host and
   Agent witnesses. Bind `(boot, epoch, Agent generation, Session, request key,
   content digest, source, mode)` into the one-shot permit. The existing
   `Session.append` guard must synchronously reject an old-epoch permit even
   when drift occurs after asynchronous ARE preparation. A second model
   dispatch guard checks the current witness but never substitutes for
   pre-inbox admission.
5. `revoked` is sticky for the serving instance. Deny new selected creation,
   prompt and model dispatch; classify pending/in-flight work as uncertain
   against the native journal under D0b.5/D2. Do not auto-requalify a changed
   live graph merely because a later snapshot matches again. A fresh boot
   and explicit requalification are separate operations.

This contract does not claim atomicity of a JavaScript-process snapshot
against hostile same-process code. It requires deterministic rejection of
all *supported* mutators in a trusted, pinned composition and a separate
isolation decision for anything outside that premise.

## Smallest construction sequence and write boundaries

1. **D0b.4a — observation fixture.** Add a disposable out-of-graph Host
   harness/test that records Loader, Registry and selected Agent-mount
   identities without prompts or secrets. Do not mount the observer as a
   plugin: its own fiber would alter the stock counts. Reconcile every active
   Registry fiber, including Group and nested fibers, to an allowed Loader
   entry, exact creation delta or explicit bootstrap exception. No
   qualification claim. The exact file, IPC, classification, cleanup and
   rollback boundary is in the [D0b.4a construction binding](D0B4A-CONSTRUCTION-BINDING-2026-10-04.md).
   Proposed writes: adapter `test/fixtures/`, `test/`, and candidate evidence.
2. **D0b.4b — source-pinned structural witness.** Add a declarative manifest
   schema and verifier in the adapter; pin the exact installed graph and
   no-tool preset. Unknown row, direct callback, wrong root/default,
   unmounted/failed row, or extra tool rejects. The offline verifier may bind
   source bytes and Loader rows, but must report callback origin as
   **unproved** until D0b.4c's early registration/import witness exists; an
   inherited Entry or caller stack must not be promoted to module identity.
   This is offline/disposable verification only.
   Proposed writes: adapter `src/`, `config/`, `test/`, and evidence.
3. **D0b.4c — early provenance and pre-mutation latch.** Extend the
   digest-bound private DSH patch to record the trusted resolved Loader import
   and each Registry registration's parent/Entry ancestry before Web
   readiness. Reject registrations without a pinned trusted import ancestry
   except the two explicit bootstrap exceptions. Also cover the named mutator
   boundaries and expose a single-install, one-owner graph epoch/revocation
   API. Bind it into the Web fixture before readiness.
   A partial hook set is a failed D0b.4c, not a weaker lock. Proposed writes:
   adapter `scripts/apply-private-dsh-session-patch.mjs`, `src/`, `test/`;
   generated `node_modules` changes are disposable projections.
4. **D0b.4d — permit and Agent binding.** Extend the broker/Session guard to
   consume only current-epoch permits for the exact Agent standing mount.
   Couple with P1g's real Host-owned creation/writer assertion; the synthetic
   fixture principal remains test-only. Proposed writes: adapter `src/`,
   `test/`, fixture, and evidence.
5. **D0b.4e — conformance.** In an authenticated disposable Web Host, inject
   unknown Host and direct plugins, wrong roots/default, preset edit/remount,
   blank-session `select`, old-generation Agent, extra tool, Loader reload,
   settings race and an ARE-preparation/append race. Each must reject before
   native insertion or model dispatch, while the unchanged restricted
   no-tool turn still ends natively. Re-run against the exact dependency pin
   before upgrade. Full Web parity remains unclaimed until D0b.3 producers,
   P1g, P2/P3 and D0b.5/D1 also pass.

Do not implement all five units under one vague approval. Each construction
unit needs its own selected `CA2-ROUTE-IMPLEMENT` objective, exact write scope,
D65 gate, source-currentness check and evidence synchronization. The present
`CA2-ROUTE-PLAN` only authorizes this candidate contract.

## D0b.4a observation fixture acceptance checklist

This is the next **proposed** construction unit, not a graph lock. Use a
disposable out-of-graph child harness around an in-process pinned Web Host,
with a fresh temporary `DSH_HOME`,
telemetry disabled and Web bound to loopback. Retain launch output in memory
only long enough to perform the local token-to-cookie exchange; never write
the token, cookie, native Session ID or raw Host log into a test artifact.
Create one native Agent with authenticated `session/create` and no prompt,
model request or tool call. Dispose the Host and temporary home even when an
assertion fails.

The child harness uses the context returned by pinned `runProfile()` and
communicates sanitized observations over Node IPC. It must not add a Loader
row or Registry fiber; this closes the observer-effect gap that a diagnostic
Host plugin would introduce. Use separate fresh Hosts for positive and
direct-registration-negative cases.

The fixture must take Registry and Loader snapshots both before and after
creation. Classify **every active** Registry fiber by actual object identity:
underlying primary Loader fiber (including Group entries), nested fiber with
an exact Loader Entry object, or an explicit no-Entry bootstrap exception.
Do not classify by plugin name alone or assume the Loader's wrapper fiber is
the Registry fiber. Resolve the created Agent through the native Agent
registry and attest its actual `standingMountFor(agent.ctx)` and mounted
Loader tree, not the latest preset roster or an unmounted file projection.

For the exact current pin, the positive fixture should reproduce the
within-Host baseline of 173 active fibers before creation and 208 after it:
35 newly active fibers partitioned into five Host-nested, 17 preset-primary
(three Group) and 13 preset-nested. Record the selected `standard` mount's 31
Loader entries (three Groups). A changed count or unclassified fiber fails
the test and triggers source reinspection; these numbers are **pin-specific
test expectations**, not a portable DSH invariant. A negative case must
register an unexpected direct `ctx.plugin(...)` callback in the disposable
Host and demonstrate that the classifier rejects its no-Entry fiber rather
than silently treating it as one of the two bootstrap exceptions. Include
focused `node:test` coverage and run the adapter's full test command after
the fixture is added.

Passing D0b.4a proves only repeatable structural observation and detection
of that injected unknown registration. It does not prove callback/module
origin, graph stability during mutation, an exclusive writer, a Host-owned
principal assertion, or any ARE-controlled Web turn. Exact source-pinned
identity belongs to D0b.4b; pre-mutation revocation to D0b.4c; permit and
Agent binding to D0b.4d; and negative Web conformance to D0b.4e. The
selected single-local-Host principal remains a separate, unproved P1g
construction obligation.

## Current checks and claim ceiling

At plan time, `npm run verify:dsh-patch` passed on the pinned patched Session
source and `node --test test/web-prompt-permit.test.mjs` passed 8/8. These
tests verify the *existing* permit behavior, not graph closure. The
authenticated disposable inventory query reported 156 Host entries, 128
enabled-and-active entries and four preset rosters. No D0b.4 construction
unit has passed its acceptance tests. A separate in-process disposable
stock-Web boot classified 173 active Registry fibers as 128 primary Host
Loader fibers, 43 nested under Host Loader entries and two without an Entry
(`Loader`, `isolate`). This is only a boot snapshot with no Agent mount or
dynamic-load negative case. A later native `session/create` probe identified
the Agent's actual `standard` standing mount and confirmed 35 additional
active fibers in the same Host: five Host-nested, 17 preset-primary
(including three Group entries), and 13 preset-nested. It narrows D0b.4a but
does not finish it or qualify the stock tool-enabled preset.
D0b, P1g and D1 remain open.

## Open Questions

- The no-Entry `Loader` and `isolate` boot calls are source-located; can a
  verifier bind their runtime callbacks, all 43 boot-time nested Host
  callbacks, five creation-time Host callbacks (two unnamed), and 13
  preset-nested callbacks to digest-pinned trusted code rather than a
  name-only or inherited-Entry exception?
- Which pinned mutator paths are exercised during a normal no-tool turn or
  Session disposal, and which must be allowed without opening a drift race?
- How will the final trusted-code boundary exclude arbitrary same-process
  plugins from calling unguarded Session or graph methods?
