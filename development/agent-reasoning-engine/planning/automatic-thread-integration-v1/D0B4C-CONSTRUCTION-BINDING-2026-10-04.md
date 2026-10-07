# D0b.4c — early provenance and pre-mutation latch construction binding

Status: **candidate construction binding; owner authorization pending**.
Date: 2026-10-04. Route: `CA2-ROUTE-PLAN`. Authority effect: none. Parent:
[D0b.4 graph-lock construction](D0B4-DSH-GRAPH-LOCK-CONSTRUCTION-2026-10-04.md).
Inputs: [D0b.4b evidence](evidence/D0B4B-DSH-SOURCE-PINNED-STRUCTURAL-WITNESS-2026-10-04.md),
[D0b.4c source audit](evidence/D0B4C-EARLY-PROVENANCE-REVOCATION-SOURCE-AUDIT-2026-10-04.md),
and [implementation layering](D0B4C-IMPLEMENTATION-LAYERING-2026-10-04.md).

This binding narrows D0b.4c. It does not authorize writes, generated-package
mutation, profile activation, deployment, or D0b.4d.

## Product-construction frontier

Build one opt-in, single-owner graph controller for the exact pinned DSH Web
`are-read-only` profile. It must be installed before Loader registration,
capture source-pinned Loader import causality and Registry ancestry during
boot, compare the settled Host graph to the refreshed D0b.4b manifest, and
expose a sticky epoch/revocation API whose supported mutator hooks run before
the first mutation or asynchronous yield.

Passing D0b.4c yields a **runtime Host graph qualification receipt**. It does
not admit a Session or prompt. D0b.4d must bind an actual Agent construction,
standing mount, Session and one-shot ARE permit to that epoch.

## Exact authored implementation write set

Only these nine repository-authored files are in the proposed implementation
boundary:

1. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/scripts/apply-private-dsh-session-patch.mjs` — generalize the existing digest-bound transaction to the exact multi-package patch while retaining the Session patch.
2. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/dsh-graph-manifest.mjs` — add an in-memory resolved source-pin index and the bounded Host-only comparison needed by qualification; retain the v1 offline claim ceiling.
3. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/dsh-graph-epoch.mjs` — closed controller, provenance records, state machine, mutation latch, fingerprints and receipt projection.
4. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/config/dsh-web-are-read-only-graph-manifest.v1.json` — regenerate exact installed-byte/source digests after the authorized private patch; do not relax schema or posture.
5. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/private-dsh-session-patch.test.mjs` — assert the expanded target transaction, base/patched digests, all-target preflight and reverse round trip.
6. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-early-provenance-revocation.mjs` — disposable opt-in child Host; no prompt, model or live profile.
7. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/dsh-graph-epoch.test.mjs` — unit, integration, mutation-family and negative coverage.
8. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/dsh-graph-manifest.test.mjs` — update exact regenerated package-set/material expectations and prove old bytes reject.
9. `development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/D0B4C-EARLY-PROVENANCE-REVOCATION-2026-10-04.md` — written only after all required checks settle.

No package manifest, package lock, adapter public `index.mjs`, gateway/server,
Companion, website, Codex integration, live profile/home file, D0b.4a source,
or D0b.4b evidence file may change. A required tenth authored file returns to
this gate.

## Exact generated patch projection

Running the authorized patch script may change only these generated files
under the adapter's pinned `node_modules`:

1. `@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-session/lib/index.js`;
2. `@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-session/lib/types/index.d.ts`;
3. `@deepseek-ai/dsh/node_modules/@deepseek-ai/cordis/lib/index.js`;
4. `@deepseek-ai/dsh/node_modules/@deepseek-ai/cordis-plugin-loader/lib/index.js`;
5. `@deepseek-ai/dsh/node_modules/@deepseek-ai/cordis-plugin-loader/lib/types/config/tree.d.ts`;
6. `@deepseek-ai/dsh/node_modules/@deepseek-ai/cordis-plugin-loader/lib/types/config/entry.d.ts`;
7. `@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-app-boot/lib/index.js`;
8. `@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-app-boot/lib/types/index.d.ts`;
9. `@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-agent-presets/lib/index.js`; and
10. `@deepseek-ai/dsh/lib/profile-boot-Dk-7KqJc.js`.

These are disposable projections, not durable patch authority. The script must
pin every package version and exact base/patched SHA-256, preflight all ten
files plus package-lock before the first write, transform each exact anchor
once, reverse-transform to the exact base, and write none when any target is
unknown. `--check` accepts only the complete latest patch set. Partial,
legacy-only, mixed-base or extra generated changes fail closed.

## Controller contract

The controller schema is `are.dsh-graph-epoch/v1`. It is created outside the
Loader graph and installed on one root Context through a private opt-in
`runProfile({graphControl})` path.

### States

```text
new
  -> capturing-boot
  -> checking-host
  -> qualified(epoch=1)
       -> checking-agent(non-serving)
            -> qualified(epoch=n+1) | revoked
       -> revoked
  -> stopping
  -> stopped

any invalid transition -> revoked (except new/install errors, which reject)
revoked -> stopping -> stopped only
```

`qualified` is the only serving state. Entry into `checking-agent` invalidates
the prior epoch synchronously before any allowed construction mutation. Only
one construction window may exist. D0b.4c tests the mechanism; D0b.4d owns the
real caller and close-time Agent binding.

### Stable API

The implementation may choose private method names, but its tested semantics
must cover:

- `install(rootCtx)` — once, before Loader; no replacement;
- `authorizeBootstrap(kind, callback)` — exact one-shot `loader` and `isolate`
  callback identities only;
- `bindImportedCallback(callback, importRecord)` — immutable resolved-import
  binding; a conflicting second binding rejects;
- `beforeRegistration(...)` / `commitRegistration(fiber, token)` — prepare
  before Registry mutation and attach before descendant plugin execution;
- `beforeMutation(kind, subject)` — synchronous latch before first change;
- `beginAgentConstruction(expectedDelta)` / `commitAgentConstruction(...)` —
  serialized non-serving window; unavailable to ordinary plugin Contexts;
- `assertCurrent()` — exact synchronous manifest/composition/root/default
  fingerprint check;
- `qualifyHost(observation)` — one transition after settled comparison;
- `snapshot()` — secret-free immutable diagnostic projection; and
- `beginStop()` — terminal non-serving teardown transition.

All failures use stable bounded reason codes. The first revocation fact is
immutable. Later facts may be counted or bounded but cannot overwrite it.
No API requalifies a revoked controller.

## Import and registration provenance

Loader import records contain only:

- normalized Loader Entry ID and ordered parent Entry IDs;
- original specifier;
- canonical resolution base URL class (never an absolute durable path);
- actual resolved file URL mapped in memory to one reviewed source selector;
- package name/version, relative path, byte count and SHA-256 from D0b.4b;
- boot nonce; and
- builtin posture where applicable.

The patched Loader must use its already-classified Node internal loader and
the same v1/v2 `resolveSync` convention as the import. It must preserve the
different host-root and preset-tree bases. A module imported from a URL not in
the verified source-pin index rejects before Registry insertion.

Registration records contain callback object identity only in private WeakMaps
plus immutable public diagnostics: Fiber UID while live, runtime label as
diagnostic, Entry chain, parent Fiber relation, bootstrap kind or source
selector, and provenance-chain digest. Stacks and callback source text are not
captured. Runtime name never grants trust.

Accepted sources are:

1. the exact one-shot Loader bootstrap callback authorized by app boot;
2. the exact one-shot `isolate` callback authorized inside that Loader; or
3. a primary imported callback or nested registration causally descending
   from an already accepted Fiber.

A direct root plugin, missing parent, unpinned import, callback rebound to a
different source, third bootstrap or post-revoke registration rejects.

## Complete pre-mutation coverage matrix

| Package | Required first-boundary hooks | First change that must not precede the hook |
| --- | --- | --- |
| Cordis Registry | `RegistryService.plugin`, `RegistryService.delete` | `_internal.set/delete`, Fiber creation/disposal |
| Cordis Fiber | `Fiber.update`, `Fiber.restart`, Fiber disposer | `_config` assignment, epoch change, UID clear, runtime-fiber removal |
| Loader groups/trees | `EntryGroup.create/remove/update/stop`; `EntryTree.create/remove/update`; random-ID allocation when serving | store insertion/deletion, data splice/unlink, option mutation, persistence write |
| Loader entries | `Entry.refresh`, `_dispose`, `update`, `init/_init`, `_start` | import/start, option replacement, Fiber disposal/restart |
| Agent Presets authoring | `copy`, `remove` and their remote wrappers | composition/default file mutation |
| Agent Presets graph | `mount`, `recompose`, `select`, `swap`, `standingKeyFor`, `ensureStanding` | standing-map mutation, scope creation/rebind, selected-event append |
| Source/settings check | `assertCurrent()` at controller qualification and future D0b.4d boundaries | acceptance of changed exact bytes, roots or default |

Duplicate hooks along one call chain are expected and must be idempotent after
the first latch. Coverage is measured by first mutation, not method count.
Boot capture and an explicitly open `checking-agent` window record allowed
mutations; `qualified` without such a window revokes synchronously.

## Qualification and receipt

The disposable child must, in order:

1. create a fresh mode-`0700` `DSH_HOME`, disable telemetry and bind Web to
   loopback port zero;
2. load and verify the refreshed D0b.4b manifest, including the full 523-package
   tree, before boot;
3. create the controller from the verified source-pin index;
4. start `runProfile()` with only the restricted preset/read-only overlays and
   the opt-in controller;
5. let the profile's normal dynamic rows/watch setup settle;
6. compare every captured Host Loader/Registry/provenance row to the manifest;
7. call `qualifyHost()` and only then emit child IPC readiness; and
8. enter stopping before disposing the Host and temporary home.

The receipt schema is `are.dsh-graph-qualification-receipt/v1`. It binds boot
nonce, epoch, manifest ID and material digest, package-set digest, Host graph
digest, provenance graph digest, source-pin count, state and claim posture
`trusted-import-ancestry`. It reports `authority_effect: "none"` and
`session_admission: "not-established"`. It excludes tokens, cookies, Session
or Agent IDs, environment, absolute paths, logs, stacks and callback source.

The HTTP socket may bind during plugin activation. The fixture must send no
request before IPC readiness. This unit does not claim a Web request gate.

## Acceptance and negative matrix

Focused tests must prove:

- unchanged restricted boot qualifies once before IPC readiness;
- all active Fibers reconcile to pinned import ancestry or the exact two
  bootstrap records;
- duplicate/late owner and bootstrap reuse reject;
- unknown direct root plugin and unbound nested plugin reject before insertion;
- wrong resolved base/URL/source digest reject;
- each coverage-matrix family revokes before a test-visible first mutation;
- revoked is sticky, old epoch checks fail, and no method requalifies;
- source/root/default/exact composition drift fails `assertCurrent()`;
- one synthetic expected Agent window can close only on the exact delta,
  increments epoch, and rejects overlap/mismatch/throw;
- teardown from qualified or revoked settles without being mistaken for a
  serving mutation; and
- D0b.4b's pre-patch package digest rejects while the regenerated exact digest
  passes.

Then run:

1. `npm run verify:dsh-patch`;
2. `node --test test/private-dsh-session-patch.test.mjs`;
3. `node --test test/dsh-graph-epoch.test.mjs`;
4. `node --test test/dsh-graph-manifest.test.mjs`;
5. D0b.4a's focused observation test;
6. existing Web prompt/append focused tests; and
7. `npm test` for the whole adapter.

Every child process has a bounded settlement timeout and `finally` cleanup.
No provider, model request, prompt, tool call, external bind, live profile,
credential or durable Session is allowed.

## Source-currentness and stop conditions

Before implementation, re-check every version/digest in the source audit and
the package-lock digest. Stop before any write if:

- any target digest, anchor, package version, profile chunk name or manifest
  baseline changed;
- resolved import identity cannot use the same resolver/base as import;
- any active Fiber lacks accepted ancestry;
- any named mutator reaches a first mutation before the controller;
- qualification requires weakening D0b.4b, accepting current bytes
  automatically, or emitting secrets/absolute paths;
- the patch cannot preflight and reverse all generated targets atomically;
- the unchanged restricted Host cannot qualify or cleanly dispose; or
- an additional authored file is required.

On failure, generated changes must be restored by the patch's exact reverse
transforms or a fresh pinned install; do not hand-edit `node_modules` into a
passing state. Preserve all unrelated worktree changes.

## Claim ceiling

Passing D0b.4c proves only that one exact trusted, pinned Linux/x64 restricted
Host captured causal import ancestry and synchronously left serving state for
all tested supported mutators before fixture readiness. It does not prove
function-definition origin, hostile-plugin containment, HTTP admission,
Agent/Session/permit binding, a controlled prompt/model request, recovery,
parallel Agent construction, full DSH parity, portability, deployment or
production readiness.

## Open Questions

- The gate selection is the only blocking decision for this construction unit.
- The real caller for `checking-agent` remains deliberately owned by D0b.4d.

