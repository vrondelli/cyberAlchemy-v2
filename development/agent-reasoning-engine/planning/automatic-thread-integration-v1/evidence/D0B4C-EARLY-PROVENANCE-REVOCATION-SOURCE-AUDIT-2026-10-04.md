# D0b.4c early-provenance and revocation source audit

Status: **planning evidence only; no implementation or qualification claim**.
Date: 2026-10-04. Route: `CA2-ROUTE-PLAN`. Authority effect: none. Parent:
[D0b.4 graph-lock construction](../D0B4-DSH-GRAPH-LOCK-CONSTRUCTION-2026-10-04.md).
The completed [D0b.4b witness](D0B4B-DSH-SOURCE-PINNED-STRUCTURAL-WITNESS-2026-10-04.md)
is the source and structural baseline for this audit.

## Question examined

Can the exact pinned DSH Web process acquire a single graph owner before its
Loader starts, bind each Cordis registration to a trusted resolved Loader
import ancestry, and leave the serving state synchronously before any supported
graph mutation?

For the pinned, trusted same-process prototype, the answer is **yes, with a
private multi-package patch**. The current Session-only patch is not enough.
The implementation must also patch the DSH profile/boot seam, Cordis Registry
and Fiber seam, Loader import/lifecycle seam, and Agent Presets mutation seam.

## Exact inspected pin

| Surface | Version or current SHA-256 | Relevant source fact |
| --- | --- | --- |
| `@deepseek-ai/dsh` | `0.1.5-rc.2`; active profile chunk `8b79b5c70281f23153ecc1828ba9b6e7b48364cc71409c90f12bde4cc4d7cde0` | `runProfile()` calls `boot()`, installs live patch watchers, then commits app readiness |
| `@deepseek-ai/dsh-app-boot` | `0.1.5-rc.3`; `lib/index.js` `d8fdfe41996a4fefcff63af4982787924b0ae651f24bb1402f775b70202529bb` | `boot()` creates `Context`, provides host facts, then immediately calls `ctx.plugin(Loader)`; no pre-Loader owner hook exists |
| `@deepseek-ai/cordis` | `4.0.2`; `lib/index.js` `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5` | `RegistryService.plugin()` creates runtime/Fiber without source identity; `delete()`, `Fiber.restart()`, `Fiber.update()`, and the Fiber disposer mutate before any ARE latch |
| `@deepseek-ai/cordis-plugin-loader` | `1.0.3`; `lib/index.js` `95f3651b2ac3caa6d19fd4e75121617ad28355e604102920480defb1da895e1b` | `EntryTree.import()` knows specifier and resolution base, but discards resolved URL before `RegistryService.plugin()` |
| `@deepseek-ai/dsh-agent-presets` | `0.1.5-rc.3`; `lib/index.js` `8d9de90d3812abf18e923a14b57e772a89d0a8dd87abf4cfcbd8a4430d9ffec1` | roots are derived at construction; default is live settings; `ensureStanding()`, `recompose()`, `select()` and authoring paths can change the effective preset graph |
| private patch source | `apply-private-dsh-session-patch.mjs` `1faf2e7e8ebd3ae17abf21351158accb447229b27cc8d48855493e5f1a0a82a2` | it currently preflights and patches only DSH Session JavaScript and declarations |
| D0b.4b manifest | `a5362d0a70f460f87edeaa19fe86c580ee9061b3ecc550a33d236b851f4a1288` | it binds the current generated package bytes; any D0b.4c patch necessarily makes this manifest stale until regenerated |

The package-lock SHA remains
`5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`.
These values are source-currentness guards, not portable invariants.

## Findings

### 1. The owner can be installed early enough

The first useful seam is between `new Context()` and `ctx.plugin(Loader)` in
`dsh-app-boot.boot()`. A private optional hook passed down by
`dsh.runProfile()` can install one controller on the root Context before either
bootstrap Fiber exists. Installation after `ctx.plugin(Loader)` is too late:
both the Loader Fiber and its direct `isolate` child have already registered.

The hook must be opt-in. Stock DSH behavior remains byte-for-byte equivalent
when no controller is supplied. A second owner, a late install, or controller
replacement must throw.

### 2. Loader has the real resolution inputs, including its version split

The pinned Loader already classifies Node's internal ESM loader as `v1` or
`v2`. Its current consumers call `resolveSync(specifier, base, attributes)` for
v1 and `resolveSync(base, {specifier, attributes})` for v2. D0b.4c can use the
same classified loader to record the URL resolved by the same mechanism that
performs the import.

One default base is not sufficient:

- ordinary `EntryTree` rows resolve from the tree Context base;
- `HostResolvedRootInclude` resolves bare packages from DSH's installed-host
  base while retaining the config-tree base for relative/builtin rows; and
- `PresetTree` resolves harness packages from its recorded host base while
  retaining preset-relative files beside the preset.

Therefore provenance must be attached to an explicit import target
`(specifier, base URL, resolved URL, Loader entry ancestry)`. Re-resolving all
names later from a guessed base is not acceptable.

### 3. Registration ancestry is provable; function-definition origin is not

`Entry._start()` is the last common point that still has the Loader Entry and
the imported callback. It can bind that callback object to the resolved import
record before calling the unchanged public `RegistryService.plugin()` method.
The Registry patch can then:

1. prepare a registration record before `_internal.set()` or Fiber creation;
2. accept a primary callback only when it has a pinned Loader-import record;
3. accept a nested callback only when its exact parent Fiber already has an
   accepted provenance chain; and
4. attach the prepared record to the new Fiber before its asynchronously
   scheduled plugin body can register descendants.

The Loader service and its `isolate` child are the only no-Entry bootstrap
records. The app-boot patch must authorize the exact Loader callback object,
and the Loader constructor patch must authorize the exact `isolate` callback
object. Runtime name or stack text alone is not sufficient.

This proves **trusted import causality and parent/Entry ancestry** under the
digest-pinned same-process premise. JavaScript does not generally expose the
definition file of an arbitrary nested function object. D0b.4c must not claim
function-definition provenance, hostile-plugin isolation, or an OS security
boundary.

### 4. Revocation must precede the first mutation

The first mutation points are visible and patchable:

- Registry runtime insertion/deletion in `RegistryService.plugin/delete`;
- Fiber config/epoch/disposal changes in `Fiber.update/restart` and the Fiber
  disposer;
- Loader store/options/fiber changes in `EntryGroup`, `EntryTree`, and `Entry`
  create, update, init, dispose, remove, and stop paths; and
- preset authoring, mount/remount, standing-generation, recompose, select and
  swap paths in Agent Presets.

An after-change event, periodic inventory, file watcher, or rejected final
comparison is too late. Every patched boundary must synchronously call the
same controller before its first assignment, deletion, splice, Fiber epoch
change, file mutation, scope rebind, or asynchronous yield.

### 5. Expected Agent construction needs a non-serving transition

A normal first Agent creation adds the exact D0b.4b creation delta; treating
every post-boot addition as an unexplained attack would make the selected
profile unusable. Conversely, leaving the Host qualified while an Agent graph
is being built creates a race for older permits.

The controller therefore needs a future-facing, one-owner construction window:

```text
qualified(epoch=n)
  -> checking-agent(non-serving, no old permit valid)
  -> qualified(epoch=n+1, exact expected delta and Agent binding)
  or revoked(sticky)
```

D0b.4c implements and tests the window mechanism but does not grant a product
caller authority to open it. D0b.4d must couple that capability to the real
Host-owned creation path, exact Agent standing mount, Session, and permit.

### 6. Source files and settings need final synchronous fingerprints

Agent Presets uses an `mtimeMs + size` stamp to decide whether to remount a
composition. That is a cache hint, not a trust fingerprint. The controller
must retain exact composition bytes, resolved roots, default selection, and
source-manifest identity and expose a synchronous `assertCurrent()` check for
the later creation/prompt/append boundaries. Watchers may reduce detection
latency but cannot replace the final check.

### 7. App readiness is not request admission

`runProfile()` commits its `appReady` service only after the Loader tree and
live patch watchers settle, but `dsh-host-webserver` binds its HTTP socket
during plugin activation. Delaying `appReady` therefore does not by itself
block an early HTTP request.

D0b.4c can still meet its bounded obligation by qualifying before
`runProfile()` returns and before the disposable child emits its IPC-ready
message. It does **not** establish selected Session admission. D0b.4d must
check the controller at the real `session/create`, prompt preparation, Session
append and model-dispatch boundaries. Calling D0b.4c a Web ingress lock would
exceed the evidence.

### 8. The D0b.4b manifest must move with the patch

D0b.4b hashes all 523 installed package instances and several entrypoints.
Changing Cordis, Loader, app-boot, Agent Presets, the DSH profile chunk, or
their declarations changes the complete package-set digest. D0b.4c must:

1. apply the exact digest-bound patch transactionally;
2. regenerate only the expected byte/count/digest fields of the reviewed
   D0b.4b manifest;
3. re-run the full source verifier; and
4. retain D0b.4b's `callback_origin: "unproved"` posture in that offline
   manifest. Runtime qualification is a separate D0b.4c receipt.

Silently bypassing the old manifest or weakening its comparison is a hard
failure.

## Construction conclusion

No source-level impossibility blocks D0b.4c for the restricted Linux/x64 pin.
The smallest honest construction is a graph controller outside the Loader
graph, an exact private patch across the six runtime surfaces above, a refreshed
offline manifest, and a disposable pre-ready fixture proving both accepted
ancestry and synchronous sticky revocation.

It remains a trusted-code prototype. D0b.4d (Agent/Session/permit binding),
D0b.4e (authenticated negative Web conformance), P1g (real Host principal),
and D0b.5/D1 (recovery and broader producers) remain open.

## Open Questions

- Whether later upstreaming should expose a neutral Cordis provenance hook or
  retain this private patch is a post-prototype decision.
- Multi-Agent concurrent construction is deliberately deferred; the first
  candidate permits one graph construction window at a time and rejects
  overlap.

