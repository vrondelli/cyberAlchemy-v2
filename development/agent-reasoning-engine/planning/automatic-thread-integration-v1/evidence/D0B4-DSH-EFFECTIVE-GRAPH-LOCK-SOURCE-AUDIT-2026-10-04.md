# D0b.4 — effective DSH Host/preset graph-lock source audit

Status: **candidate source and bounded runtime evidence with implementation plan**, 2026-10-04.
Route: `CA2-ROUTE-PLAN`. Authority effect: none. No qualified profile,
runtime lock, live activation, or graph-conformance test is claimed here.

## Scope and pinned evidence

This audit concerns the exact local `@deepseek-ai/dsh@0.1.5-rc.2` graph with
`dsh-host-plugin-inventory@0.1.5-rc.3` and
`dsh-agent-presets@0.1.5-rc.3`. The adapter lockfile SHA-256 is
`5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`.
The Host inventory source digest is
`bd70cb815620a36acfd2f292a2586f05194cbf47d920f25a152e85da66fe0703`;
the preset source digest is
`8d9de90d3812abf18e923a14b57e772a89d0a8dd87abf4cfcbd8a4430d9ffec1`.
These are local source hashes, not a release qualification receipt.

## What the pinned runtime already exposes

- Shipped DSH Web mounts `plugin-inventory`. Its `list()` reads current
  non-group `ctx.loader.entries()` and reports entry ID, module name,
  effective enabled state, and fiber phase. When `agentPresets` is present it
  joins `compositionInventory()` for each discovered preset. This is a useful
  runtime-evaluated read model, unlike a raw `--dump-config` hash.
- `AgentPresets.compositionInventory()` reads the newest live standing mount
  for a preset when one exists. Its rows come from the mounted Loader tree,
  including evaluated enablement and fiber state. An unmounted preset is
  parsed from its file with `!!js` disabled expressions evaluated through
  the Loader context; that answer predicts a mount, but does not attest that
  its plugin instances ran.
- `AgentPresets.roots`, `defaultId`, `standingMountFor(agent.ctx)`, and the
  mounted tree provide the selectors for an exact Agent-specific witness.
  `roots` includes shipped/user roots only when configured; the current
  disposable ARE preset disables both. `defaultId` can change through
  hot-reloaded settings. `select` can recompose a blank Agent before its
  first turn.

## Why this is not yet a lock

1. `PluginInventoryGateway.list()` reads Loader entries, not all registered
   Cordis callbacks. A plugin mounted directly with `ctx.plugin(...)` outside
   a Loader entry is not certified by that projection. Cordis's separate
   `ctx.registry` enumerates registered runtimes/fibers, so a qualification
   check must close this second surface or explicitly reject it.
2. The preset roster reports the **newest** live standing mount for an ID.
   A pre-existing Agent can remain joined to an older generation after its
   composition file changes. One global roster digest therefore cannot
   attest the effective graph of every active Agent; the Agent's actual
   `standingMountFor(agent.ctx)` and tree must be checked.
3. Loader entries can update/restart; preset discovery re-reads roots;
   settings can change the default; and `ensureStanding` mounts a new
   generation when the file stamp changes. `list()` is asynchronous and
   exposes no atomic qualification epoch. Inferring a stable serving lock
   from one snapshot would be unsafe.
4. The inventory is observational. It does not veto an unknown row, freeze
   a preset, guard a direct Session writer, or fail Web readiness. A
   same-process untrusted plugin still needs a stronger trusted-code or
   process-isolation boundary than a JavaScript snapshot.

## Proposed D0b.4 construction and acceptance sequence

These are **proposed write scopes**, not authorization to implement them.

1. Define a versioned qualification manifest for the pinned graph: exact
   dependency/source digests; required Host Loader entries and fiber phases;
   every active registered callback/fiber including direct plugins; preset
   roots, default ID, selected preset rows and module identities; and the
   model-facing tool/effect catalog. Unknown or conditional rows fail closed.
   A no-tool read-only profile is separately named and never called full
   DSH Web parity.
2. At startup, await settled Loader/preset mounts, inspect both Host Loader
   and registry surfaces, and compare the mounted selected preset—not merely
   an unmounted file—to the manifest. Before each selected Agent is
   published and before each prompt is admitted, bind and verify the exact
   Agent-specific standing-mount generation and current graph epoch. An
   Agent joined to an older generation must be checked against its own tree.
3. Add a fail-closed drift latch at Loader update/restart, preset file/root
   change, settings/default change, preset `select`/recompose, and direct
   plugin registration. Drift revokes qualified readiness **before** another
   creation, append permit, or model request. Each issued permit must bind
   the qualified graph epoch, and the synchronous Session append guard must
   reject an old-epoch permit even if drift occurs after ARE preparation.
   No in-flight turn or pending
   inbox item may be silently reported as ARE-complete; recovery is a
   separate D0b.5/D2 proof.
4. In a disposable authenticated Web Host, demonstrate that an unknown
   Host row, direct plugin, user/shipped preset root, altered preset file,
   changed default, blank-session recompose, old-generation Agent, extra
   tool, and reload race each fail qualification or admission before model
   dispatch. The unchanged locked profile must still complete the native
   no-tool Web turn. Repeat on the exact pinned dependency before any
   version upgrade.

Full Web parity additionally needs typed ARE permits for goal, command,
plan, subagent, plugin and Host-continuation producers. Locking the current
restricted preset would prove only a restricted read-only profile, not that
the full D0b/D1 outcome has been reached.

## Verification and source selectors

The source audit verified versions and source hashes and inspected these local
selectors:

- `node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-host-plugin-inventory/lib/index.js`:
  `PluginInventoryGateway.list`.
- `node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-agent-presets/lib/index.js`:
  `compositionInventory`, `mountedCompositionRows`, `standingMountFor`,
  `defaultId`, `select`, and `ensureStanding`.
- `node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/cordis-plugin-loader/lib/index.js`:
  `EntryTree.entries`, `Entry.update`, and `Loader` lifecycle hooks.
- `node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/cordis/lib/index.js`:
  `RegistryService.values` and Fiber restart/update.
- `node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-web-app/cordis.patch.yml`:
  shipped `plugin-inventory` and `agent-presets` rows.

Paths above are relative to the
`implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter`
package; installed `node_modules` is generated, not the durable ARE source.

## Disposable Web inventory observation

On 2026-10-04, a fresh temporary `DSH_HOME` launched the pinned DSH CLI with
`--profile web --no-open --port 0` and telemetry disabled. A local token
exchange established a Web cookie, then one same-origin authenticated
`POST /api/pluginInventory/list` request used the `pluginInventory/list`
client-request envelope. The endpoint returned HTTP 200 with `result.ok: true`,
`entries` and `agentPresets`: 156 Host entries, of which 128 reported both
enabled and active, and four preset rosters (`standard`, `ptc`, `minimal`,
`cordis`). No prompt, tool, model, or external provider request was made. The
temporary Host and its home were removed after the probe; token and cookie
were not logged.

This confirms that the read model is reachable in the pinned Web build. It
does **not** attest complete Cordis registry coverage, a selected Agent's
actual standing mount, graph atomicity, module trust, drift rejection, or an
ARE-controlled/qualified Web profile. D0b.4 remains open.

## Disposable in-process Registry/Loader reconciliation

Also on 2026-10-04, a fresh temporary stock Web Host was booted in-process
through the pinned `runProfile` entry, with the DSH bin path supplied as
`process.argv[1]` (required by its HMR plugin). No Agent or preset standing
mount was created and no prompt/model/tool request was issued. The diagnostic
read `ctx.loader.entries()` and `ctx.registry.entries()` after Host readiness,
then disposed the Host and removed its temporary `DSH_HOME`. It printed only
counts and non-secret plugin names.

The Host had 156 non-group Loader entries, of which 128 had active primary
fibers. The Registry had 174 fibers total and 173 active fibers. Each active
fiber fell into one observed category: 128 were the underlying fibers of
Loader entry wrappers, 43 carried a Host Loader Entry but were nested
registrations, and two had no Entry (`Loader` and `isolate`). The initial
diagnostic incorrectly compared a Loader's `Object.create(fiber)` wrapper
to the Registry's underlying Fiber; the corrected diagnostic used the
wrapper prototype and `fiber.entry` linkage from the pinned Cordis Loader.

This narrows the **boot-time** reconciliation problem: the two no-Entry
registrations need exact trusted-bootstrap source bindings, and the 43
nested callbacks need module-origin/ancestry evidence rather than treating
their shared Entry tag as sufficient. It does not prove closure after an
Agent preset mounts, after a dynamic plugin registration, or across a
reload race. D0b.4a's fixture and conformance test remain open.

Pinned source locates the two no-Entry bootstrap calls:
`dsh-app-boot/lib/index.js:boot` calls `ctx.plugin(Loader)` before mounting
the config tree, and `cordis-plugin-loader/lib/index.js:Loader` calls
`ctx.plugin(isolate)`. Their local source SHA-256 values were respectively
`d8fdfe41996a4fefcff63af4982787924b0ae651f24bb1402f775b70202529bb`
and `95f3651b2ac3caa6d19fd4e75121617ad28355e604102920480defb1da895e1b`.
These source selectors explain the observed names; a future witness must
still verify those exact bytes and runtime callback identities at boot.

## Disposable native Agent-mount delta

In a second temporary stock Web Host on 2026-10-04, one same-origin,
authenticated `session/create` RPC created a native Session and Agent. The
probe issued **no prompt, model request, or tool call**. It read the Agent
from the native `agents` registry and used the pinned
`standingMountFor(agent.ctx)` to identify the exact mount the Agent joined:
`standard`, with 31 Loader entries including three groups (28 non-group
rows). The Host and temporary home were disposed after inspection; the Web
token, cookie, and Session ID were not logged.

An initial post-create snapshot showed 208 active Registry fibers: 128
primary Host entries, 48 Host-nested fibers, 14 primary non-group preset
entries, 13 preset-nested fibers, three preset Group fibers, and the two
no-Entry boot fibers. A controlled before/after reading **within one Host**
then confirmed 173 active fibers before creation and 208 after it, with
exactly 35 newly active fibers: five Host-nested, 17 preset-primary
(including the three Group fibers), and 13 preset-nested. The five Host
additions were `scope` under `include:agent-loop`, `scope` and `PresetTree`
under `include:agent-presets`, and two unnamed callbacks under
`include:agent-loop`. The Group entries were `planning`, `compaction`, and
`delegation` under `include:agent-presets`.

This corrects the proposed witness shape: Group entries and nested
registrations are part of the effective graph, and native Agent creation
legitimately changes the Registry after Web readiness. A single immutable
Host-boot fiber count is therefore not a valid per-Agent lock. Each allowed
creation delta needs source-bound callback/Entry identity and an Agent-mount
generation witness. This probe did not test an unknown plugin, older preset
generation, reload, drift latch, or ARE permit; D0b.4a remains incomplete.

## Callback-origin retention check

A follow-up read of the same pinned graph inspected
`cordis/lib/index.js:RegistryService.plugin` and `Fiber`, plus
`cordis-plugin-loader/lib/index.js:Entry._start` and Loader's
`internal/plugin` listener. The current Cordis source SHA-256 is
`1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5`;
the Loader source remains
`95f3651b2ac3caa6d19fd4e75121617ad28355e604102920480defb1da895e1b`.

`RegistryService.plugin` stores the callback function, display name, fibers
and config schema in its runtime record. It does **not** store the resolved
module path or bytes. Loader imports a named module for its primary Entry,
then calls `ctx.registry.plugin`; its `internal/plugin` listener assigns an
Entry to nested fibers from their parent context. Thus `fiber.entry` gives
useful structural ancestry but is not evidence that the nested callback's
code came from that Entry's module. Cordis also retains an optional
`getOuterStack` supplier for error diagnostics, but `plugin` accepts that
supplier as an argument and Loader passes its own supplier. A stack trace is
not an independently authenticated code-origin witness.

This changes the construction dependency: D0b.4a can prove structural
observation; D0b.4b can compare a source-pinned structural manifest, but
neither can claim source-bound identity for nested callbacks after boot.
D0b.4c needs early resolved-import and registration-ancestry capture as well
as pre-mutation revocation, installed before Web readiness. The exact trust
premise remains a closed, pinned same-process module graph; arbitrary
untrusted same-process code is not made safe by ancestry capture.

## Open Questions

- Which supported runtime hook can make graph drift fail before any alternate
  producer inserts input, rather than merely noticing the change later?
- How will the 43 boot-time nested callbacks, five creation-time Host
  callbacks (including two unnamed ones), and 13 preset-nested callbacks
  be bound to exact trusted code rather than names or inherited Entry tags?
- Which features remain in the first restricted profile, and which require
  full producer migration before the eventual full-Web claim?
