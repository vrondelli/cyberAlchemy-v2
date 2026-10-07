# D0b.4a — exact construction binding for the graph-observation fixture

Status: **candidate construction binding; owner authorization pending**.
Date: 2026-10-04. Route: `CA2-ROUTE-PLAN`. Authority effect: none. This
binding narrows one implementation unit; it does not authorize the writes,
activate DSH Web, or qualify a graph lock.

## Product-construction frontier

Build one repeatable, disposable observation fixture for the exact pinned DSH
Web graph. It must preserve the stock graph while proving the known
173-before/208-after active-fiber structure, the 35-fiber Agent-creation
delta, the created Agent's actual `standard` standing mount, and rejection of
one unexpected root-level direct registration.

The observer must **not** be mounted as a Loader plugin. Doing so would add a
Registry fiber and change the graph being measured. Instead, an out-of-graph
child harness calls the pinned `runProfile()` export, keeps the returned Host
context, and exchanges commands and sanitized observations with the test over
Node's in-memory IPC channel. The Web profile itself remains stock except for
telemetry disablement and runtime flags (`--no-open --port 0`).

## Exact implementation write set

Only these implementation files are authorized if the owner selects option A
in the implementation gate:

1. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-effective-graph-observer.mjs` — child Host harness and structural classifier.
2. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/web-effective-graph-observer.test.mjs` — authenticated loopback driver and assertions.
3. `development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/D0B4A-DSH-EFFECTIVE-GRAPH-OBSERVATION-2026-10-04.md` — generated only after focused and full-suite results are known.

No adapter `src/`, package manifest, lockfile, private patch, installed
`node_modules`, profile, home configuration, website, or live runtime is in
scope. If implementation reveals that one of those is necessary, stop and
return to a new gate rather than expanding this binding.

## Fixture protocol

The child harness is pinned test code, not a reusable product API.

1. Resolve every DSH import from the adapter's installed
   `@deepseek-ai/dsh` package so Cordis object identity is not split across
   package copies. Import `runProfile` through the current package's
   `profile-boot-BP_C0vpU.js` shim and reject a changed shim or target digest.
   Set the child `process.argv[1]` to the pinned DSH bin path, as required by
   this profile's HMR code.
2. Start `runProfile()` with `loadLayeredEnv("dsh")`, profile `web`, no patch
   files, telemetry disabled, and inner arguments `--no-open --port 0`.
   Retain the returned root context; add no Loader row and no observer fiber.
3. After `runProfile()` settles, install only a root event listener that
   remembers the exact newly announced Agent object. Event-listener effects
   must not create Registry fibers. Reject zero, multiple, or replaced Agent
   objects.
4. Accept closed IPC commands carrying a request key:
   `snapshot-before`, `snapshot-after`, `inject-unknown`, and `dispose`.
   Unknown command, duplicate request key, missing process IPC, or command in
   the wrong phase fails closed. Responses contain the request key, structural
   counts, category names, and reason codes only—never the launch token,
   cookie, native Session ID, prompt content, path-bearing Host log, callback
   source text, or environment.
5. `inject-unknown` invokes one named test callback through
   `ctx.root.plugin(...)`, awaits its fiber, and then classifies the graph.
   Because it is not mounted through a Loader Entry, it must be the sole
   additional no-Entry fiber and must be rejected as
   `unknown-no-entry-registration`. Dispose it during teardown.
6. On every exit path, dispose the Host, close IPC listeners, wait for process
   exit, escalate to process-group termination only when necessary, and let
   the parent remove the fresh temporary `DSH_HOME`.

Use a fresh Host for the positive case and another fresh Host for the negative
case. This prevents the deliberately injected registration from contaminating
the positive baseline or disposal assertions.

## Structural classifier

The classifier operates on object identity, never plugin names alone.

- Enumerate every active (`state === 2`) fiber in every
  `ctx.registry.values()` runtime.
- Enumerate Host entries from `ctx.loader.entries()`. A Loader entry holds the
  thenable wrapper returned by `RegistryService.plugin`; the current pin's
  underlying Registry fiber is its prototype. Assert that this exact object
  occurs once in the active-fiber set before classifying it as Host primary.
- For the single created Agent, resolve `standingMountFor(agent.ctx)` from the
  same pinned package instance and enumerate the mount tree. Classify exact
  underlying entry-fiber identities as preset primary, preserving Group rows.
- A remaining fiber whose `fiber.entry` is an exact Host or preset Entry
  object is nested under that entry. An Entry tag is ancestry only; D0b.4a
  makes no callback-source claim.
- The only allowed no-Entry boot fibers are the structurally located Loader
  primary and the `isolate` child whose parent is that exact Loader fiber.
  The check may include their expected runtime names as diagnostics, but a
  name is not sufficient to admit them.
- Every active fiber must land in exactly one category. Zero categories,
  multiple categories, duplicate Entry IDs, missing wrapper prototypes, a
  changed parent relation, or any other no-Entry fiber fails the observation.

Canonical response categories are `host-primary`, `host-nested`,
`preset-primary`, `preset-group-primary`, `preset-nested`, `bootstrap-loader`,
`bootstrap-isolate`, and `unknown`. Rows are sorted only for deterministic
diagnostics; ownership and classification use object identity.

## Parent test flow and exact assertions

The parent test creates a mode-`0700` temporary home, launches the child with
`stdio: ["ignore", "pipe", "pipe", "ipc"]`, and retains bounded stdout/stderr
in memory. Failure messages redact every `token=` value before rendering.

For the positive Host:

1. Wait for both the child-ready IPC message and the loopback Web URL.
2. Exchange the launch token for a same-origin cookie in memory.
3. Request `snapshot-before` and assert 173 active fibers:
   128 Host primary, 43 Host nested, two allowed bootstrap fibers, and no
   preset or unknown fiber.
4. Send exactly one authenticated `session/create` request with an empty
   request. Do not prompt, select a model, attach content, call a tool, or
   contact a model/provider. Do not include the returned Session ID in an
   assertion message or durable artifact.
5. Request `snapshot-after` and assert 208 active fibers. The exact 35 new
   object identities must partition as five Host nested, 17 preset primary
   (14 non-Group plus three Group), and 13 preset nested.
6. Assert one remembered Agent, preset ID `standard`, 31 mounted entries, 28
   non-Group entries, three Groups, and zero unknown/unclassified fibers.

For the negative Host, assert the ordinary pre-create baseline first, issue
`inject-unknown`, then require classifier rejection with exactly one new
active object in `unknown` and the reason
`unknown-no-entry-registration`. A test that merely observes the extra fiber
but returns `ok: true` fails.

## Source-currentness gate

Immediately before implementation, all of these must still match:

| Source | Required SHA-256 |
| --- | --- |
| Adapter `package-lock.json` | `5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896` |
| Cordis `lib/index.js` | `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5` |
| Cordis Loader `lib/index.js` | `95f3651b2ac3caa6d19fd4e75121617ad28355e604102920480defb1da895e1b` |
| Agent Presets `lib/index.js` | `8d9de90d3812abf18e923a14b57e772a89d0a8dd87abf4cfcbd8a4430d9ffec1` |
| DSH App Boot `lib/index.js` | `d8fdfe41996a4fefcff63af4982787924b0ae651f24bb1402f775b70202529bb` |
| Profile export shim `profile-boot-BP_C0vpU.js` | `1c8ff3e931a29a8f4e54a4db197935aa0d5f6bfbd4275a487bfff576d600ca69` |
| Effective profile implementation `profile-boot-Dk-7KqJc.js` | `8b79b5c70281f23153ecc1828ba9b6e7b48364cc71409c90f12bde4cc4d7cde0` |

`npm run verify:dsh-patch` must also pass. A changed digest is a stop condition
for source reinspection, not a request to update expected hashes mechanically.
These checks passed while this binding was authored.

## Verification commands and claim ceiling

From the adapter package:

```sh
npm run verify:dsh-patch
node --test test/web-effective-graph-observer.test.mjs
npm test
```

The focused test must prove both positive and negative cases; the full suite
must remain green. Evidence records exact test counts and current hashes only
after both commands complete.

Passing this unit proves repeatable structural observation and rejection of
the injected no-Entry registration. It does not prove module provenance,
graph immutability, pre-mutation revocation, Host identity, exclusive writing,
ARE prompt admission, crash recovery, or any controlled Web turn.

## D65 lanes, rollback, and stop conditions

- **Runnable product work:** the two test files and post-pass evidence above.
- **Causal blocker:** explicit owner authorization for this exact write set.
- **Operational support:** disposable loopback Host lifecycle and cleanup,
  contained entirely inside the test.
- **Deferred residue:** D0b.4b source manifest, D0b.4c provenance/revocation,
  D0b.4d permit binding, D0b.4e conformance, P1g Host assertion, and D1.
- **Rollback:** remove the two new test files and their candidate evidence;
  no generated dependency, configuration, or live state may remain.
- **Stop:** source hash drift, non-loopback binding, model/provider activity,
  a need to patch runtime source, a secret in output, incomplete cleanup, or
  classification requiring a name-only trust assumption.

## Open Questions

- None blocks owner selection for this exact unit. Any implementation-time
  need to widen the write set returns to a new decision gate.
