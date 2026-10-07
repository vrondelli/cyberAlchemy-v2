# D0b.4b — source-pinned structural witness construction binding

Status: **candidate construction binding; owner authorization pending**.
Date: 2026-10-04. Route: `CA2-ROUTE-PLAN`. Authority effect: none. Parent:
[D0b.4 graph-lock construction](D0B4-DSH-GRAPH-LOCK-CONSTRUCTION-2026-10-04.md).
Prerequisite evidence:
[D0b.4a effective-graph observation](evidence/D0B4A-DSH-EFFECTIVE-GRAPH-OBSERVATION-2026-10-04.md).

This binding narrows the second D0b.4 unit. It does not authorize its writes,
activate a DSH profile, qualify a graph lock, or prove callback provenance.

## Product-construction frontier

Build one versioned, declarative manifest and fail-closed verifier for the
exact installed DSH Web graph used by the candidate `are-read-only` preset.
The verifier must bind the complete installed dependency-tree bytes and
runtime tuple, not only Loader entrypoints. It must also bind effective Loader
rows, complete active Registry structure, the actual Agent standing mount, the
exact preset-root and default selection, and the model-facing tool catalog.

D0b.4b is deliberately **offline/disposable**. It may show that the pinned
bytes and structural observation match the declared manifest. It must report
nested callback origin as `unproved`: Cordis retains Loader ancestry but not a
trusted resolved-module identity for nested registrations. Early import and
registration provenance, mutation revocation, and a serving graph epoch remain
D0b.4c.

## Exact implementation write set

Only these five files are in the proposed D0b.4b implementation boundary:

1. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/dsh-graph-manifest.mjs` — closed manifest parser, canonicalizer, source-pin verifier, structural observation collector/comparator, and bounded reason codes.
2. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/config/dsh-web-are-read-only-graph-manifest.v1.json` — reviewed declarative manifest for the exact pin and restricted profile.
3. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-source-pinned-graph-witness.mjs` — out-of-graph disposable Host harness using closed IPC.
4. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/dsh-graph-manifest.test.mjs` — schema, source, structure, tool-catalog, and negative-control tests.
5. `development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/D0B4B-DSH-SOURCE-PINNED-STRUCTURAL-WITNESS-2026-10-04.md` — written only after focused and full-suite results are known.

The manifest schema is implemented as an exported closed JavaScript schema
contract and parser in `dsh-graph-manifest.mjs`; no undeclared JSON-schema
runtime dependency is added. `package.json`, `package-lock.json`, D0b.4a's two
test files and evidence, the private patch applicator, generated
`node_modules`, live profiles, home configuration, gateway sources, and
website/Companion sources are outside this write set. The existing test glob
already discovers the proposed test, so no package-script mutation is needed.

If implementation requires any sixth file or installed-source mutation, stop
and return to a new gate.

## Manifest schema and canonical identity

The manifest schema version is `are.dsh-structural-graph-manifest/v1`. It is a
closed record with these sections:

- `manifest_id`, `profile_id`, `claim_posture`, and `material_digest`;
- exact package names and versions, including DSH `0.1.5-rc.2`, nested DSH
  packages `0.1.5-rc.3`, Cordis `4.0.2`, and Cordis Loader `1.0.3`;
- the exact Linux/Node runtime tuple and all installed package-instance rows,
  including locator, package identity, complete package-tree digest, file and
  byte counts, maximum regular-file bytes, native-binary count, and one
  aggregate package-set digest;
- exact adapter files, DSH profile/bundle/config files, bootstrap sources, and
  every distinct Loader module entrypoint as normalized source pins;
- exact Web profile layers and overlay digests, with no profile/home user
  patch content;
- all 156 Host Loader rows, including Groups, with unique ID, module specifier
  or an explicit Loader-Group sentinel, evaluated disabled state, and expected
  fiber phase;
- the two structurally admitted no-Entry bootstrap fibers: the Loader service
  owner and its exact `isolate` child relation;
- exact pre-create, post-create, and creation-delta category counts;
- one system-trust preset root represented by a repository-relative symbolic
  selector, default and selected ID `are-read-only`, the exact composition
  bytes, one mounted `persona` row, and no other preset row;
- the model-facing tool-name catalog, which must be the exact empty array; and
- explicit `callback_origin: "unproved"` and
  `serving_graph_lock: "not-established"` fields.

Canonical JSON orders object keys lexicographically and manifest arrays by
their declared stable keys. The parser rejects, rather than repairs, unknown
fields, missing fields, duplicate IDs or source selectors, unsorted arrays,
absolute paths, traversal, invalid digests, unsupported resolution modes,
conditional rows, and a self-declared material digest that does not match the
canonical material with `material_digest` omitted.

The verifier accepts only these resolution modes:

1. a fixed repository-relative adapter file under the adapter package;
2. a fixed package-relative file under the pinned DSH installation; or
3. a module specifier resolved from the pinned DSH package's own
   `createRequire` base.

It resolves real paths and rejects escape from the corresponding root. It
binds package name, version, normalized relative file identity, byte length,
and SHA-256. A Loader Group sentinel such as `cordis:include` is not treated as
a Node module; its implementation source is separately pinned. No absolute
checkout or temporary-home path is durable manifest content.

### Installed dependency closure and runtime tuple

The 154 Loader entrypoint pins remain necessary for row-to-module identity,
but they are not a transitive source closure. For example, the pinned
`@deepseek-ai/dsh-agent-presets` entrypoint imports `js-yaml`, `zod`,
`@deepseek-ai/schemastery`, Cordis packages, and other DSH packages whose bytes
would otherwise be unbound. `package-lock.json` integrity is also insufficient:
the installed Session package is intentionally private-patched after package
extraction, and installed bytes can drift independently of registry tarball
integrity.

The manifest therefore carries a separate `installed_package_set` section.
Starting at the adapter's fixed `node_modules` root, the verifier recursively
discovers every package instance in every exact `node_modules` directory. A
package row contains its normalized locator relative to that root, declared
name and version, regular-file count, total regular-file bytes, native `.node`
file count, maximum regular-file bytes, and a complete tree SHA-256. Each
package tree excludes nested `node_modules` because those are separately
identified package instances. Its canonical rows include directories and every
regular file's normalized path, executable-bit posture, byte length, and
SHA-256. The current pin has no package-root or package-internal symlink; a
symlink, absolute/traversing path, special file, missing package manifest,
duplicate locator, or package identity mismatch fails closed. Root `.bin`
links and hidden npm metadata are not package instances and are outside this
source-byte claim; the authoritative adapter `package-lock.json` remains pinned
separately.

Package rows are sorted by normalized locator in unsigned UTF-8 byte order,
tree rows by normalized relative path in the same order, and object keys by the
manifest's canonical-JSON rule. The package-set digest covers the complete
canonical row array. The verifier does not accept an allowlist subset and does
not derive expected rows from the installation under test.

The same section binds `node_version`, `node_module_abi`, `napi_version`,
`platform`, `arch`, and runtime libc family/version. These are exact witness
inputs, not portable invariants. A Windows or macOS profile needs a separately
reviewed manifest because optional packages and native binaries differ by
platform. Kernel/WSL release is recorded as diagnostic evidence but is not a
source identity or acceptance field.

This full-tree check runs once before the disposable Host starts, never per
prompt or as a serving hot-path scan. It uses two passes. The inventory pass
uses `lstat`, never follows a symlink, and must match package identities plus
the exact per-package and global file, byte, native-file, and maximum-file-size
caps before content hashing begins. The hash pass then binds the exact path set,
executable bits, sizes, and bytes. It reads one regular file at a time in fixed
chunks no larger than 1 MiB and never retains the 224 MB tree's file contents.
The manifest itself must be smaller than 1 MiB before JSON parsing. D0b.4b
installs no watcher or background daemon; D0b.4c must bind its later serving
epoch to the reviewed manifest without weakening this preflight.

The manifest is materialized once from the reviewed pin during the authorized
implementation. There is no update-in-place or “accept current graph” command.
A later dependency change must fail with an explicit diff and return to a new
owner-reviewed manifest gate.

## Structural observation and comparison

The new child fixture follows D0b.4a's observer-effect constraint: it calls the
pinned `runProfile()` export directly and must not add a Loader row or Registry
fiber. It starts a fresh `web` profile with:

- a mode-`0700` temporary `DSH_HOME`;
- telemetry disabled and `--no-open --port 0`;
- the repository `read-only.patch.yml` applied;
- `agent-presets` configured with default `are-read-only`, exactly one
  system-trust root at the repository preset directory, and both shipped and
  user roots disabled; and
- no home/profile user patch content.

The parent waits for both child readiness and the loopback URL, exchanges the
launch token for a same-origin cookie only in memory, and sends one
authenticated `session/create` request with an empty request. It sends no
prompt, model selection, attachment, tool call, model request, or provider
request.

The child records every Host and mounted-preset Loader row, every active
Registry fiber, exact primary/nested Entry identity, the two bootstrap
relations, `standingMountFor(agent.ctx)`, effective preset roots/default, and
`agent.ctx.tools.schemas(agent)`. It serializes only symbolic source selectors,
row fields, category counts, digests, and bounded reason codes. It never emits
the launch token, cookie, Session ID, raw Host log, absolute path, environment,
callback source text, or stack.

The comparator rejects all of the following:

- missing or extra Host/preset rows, duplicate IDs, changed module specifier,
  conditional/unknown row, wrong effective disabled state, or an enabled row
  without the exact expected active phase;
- any active fiber outside the manifest's structural categories, including a
  direct `ctx.root.plugin(...)` registration;
- a missing/changed bootstrap relation, primary/nested category count, or
  Agent-creation delta;
- no standing mount, a different/superseded mount, wrong preset ID, extra or
  user/shipped root, changed default, changed composition bytes, or wrong
  preset trust;
- an extra model-facing tool name or any non-empty tool catalog; and
- any attempt to report nested callback origin as source-proved.

All failures return `ok: false`, stable reason codes, `authority_effect:
"none"`, and the fixed unproved-origin posture. They do not auto-rewrite the
manifest or degrade to count-only acceptance.

## Exact pin expectations

A planning-time disposable observation of the proposed restricted profile
produced this pin-specific baseline:

| Phase | Exact active-fiber partition |
| --- | --- |
| Before Session creation | 172 = 127 Host primary + 43 Host nested + Loader bootstrap + isolate bootstrap |
| After one Session creation | 177 = 127 Host primary + 47 Host nested + one preset primary + Loader bootstrap + isolate bootstrap |
| Creation delta | five = four Host nested + one preset primary |

The same observation found 156 Host Loader rows, 127 enabled-and-active Host
rows, one mounted preset row (`include:agent-presets:persona` resolving
`@deepseek-ai/dsh-persona`), preset ID/default `are-read-only`, one system-only
root, and zero model-facing tools. It resolved 154 distinct Node module
specifiers; the sole non-Node sentinel was `cordis:include`. These are
pin-specific construction expectations, not portable DSH invariants or
qualification evidence.

A second read-only audit exposed the missing transitive boundary and measured
the complete current installation:

| Installed-tree field | Exact planning-time observation |
| --- | --- |
| Adapter lockfile | npm lockfile v3; 588 package entries; zero development entries; 70 optional entries |
| Installed package instances | 523 |
| Package regular files | 25,509 |
| Package regular-file bytes | 224,464,888 |
| Largest regular file | 18,621,496 bytes at `@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.8.18.6` |
| Native `.node` files | 14 across five package instances |
| Canonical package-set SHA-256 | `16392d0d956dc3e375536e78fd5a48a9f7003d7f679b6b26ab6aab344d6b826d` |
| Runtime tuple | Node `v26.8.1`; module ABI `147`; N-API `10`; `linux`; `x64`; glibc `2.43` |
| Diagnostic host release | `6.18.33.2-microsoft-standard-WSL2` (record only; not an acceptance field) |

The installed count is lower than the lockfile count because platform-specific
optional packages are not all materialized. The package-set rows bind what can
actually resolve from this Linux installation, including the private Session
patch and the 14 native files; the lockfile separately binds the declared
cross-platform dependency selection.

The exact traversal was then run twice under `/usr/bin/time -v` without
writing files. Both strategies reproduced the package-set digest:

| Resource observation | Fixed-chunk streamed scan | Sequential whole-file scan |
| --- | ---: | ---: |
| Wall time on this WSL host | 31.6 s | 17.9 s |
| Maximum resident set | 83,388 KiB | 142,804 KiB |
| Package-row canonical JSON | 139,502 bytes | 139,502 bytes |
| Largest package file | 18,621,496 bytes | 18,621,496 bytes |
| Resulting package-set digest | `16392d0d956dc3e375536e78fd5a48a9f7003d7f679b6b26ab6aab344d6b826d` | same |

The lower-memory fixed-chunk strategy is selected despite its extra 13.7 s on
this host. These timings are diagnostics, not portable performance claims.
The focused test gives the preflight a 120 s settlement deadline and treats a
deadline breach as a failed, cleaned-up witness rather than accepting a
partial digest. Correctness resource bounds are the exact inventory caps,
1 MiB read chunk, 1 MiB manifest-file cap, and absence of retained file bytes;
wall time and RSS are recorded in evidence but are not source identities.

The test uses separate fresh Hosts for the positive witness and the direct
registration negative control. The negative Host must first match the
ordinary restricted-profile baseline, then add exactly one no-Entry fiber and
be rejected as `graph.unknown-no-entry-registration`.

## Source-currentness gate

Immediately before implementation, these sources must still match:

| Source/currentness input | Required identity |
| --- | --- |
| Adapter `package-lock.json` | `5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896` |
| Adapter `config/read-only.patch.yml` | `f096349134697e5e3c5f58a6bf4760eccf7dd7b5f535a5e1b2614684f9bdb33d` |
| Adapter `config/presets/are-read-only/agent.cordis.yml` | `c749f1160281520ac1aa2acf924c633e96cf7cd5cc3660d868c7290a3279f8ff` |
| DSH base `cordis.patch.yml` | `1d34f61f498c5779ecaf2b13c4cbeea1254818450a1021dca594a30c03c230db` |
| DSH Web `cordis.patch.yml` | `1c0209b817d05d25ed9857c8d9611fa631301f1b9593e871f23595e83b17261d` |
| DSH App Boot `lib/index.js` | `d8fdfe41996a4fefcff63af4982787924b0ae651f24bb1402f775b70202529bb` |
| Profile export shim | `1c8ff3e931a29a8f4e54a4db197935aa0d5f6bfbd4275a487bfff576d600ca69` |
| Effective profile implementation | `8b79b5c70281f23153ecc1828ba9b6e7b48364cc71409c90f12bde4cc4d7cde0` |
| Cordis `lib/index.js` | `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5` |
| Cordis Loader `lib/index.js` | `95f3651b2ac3caa6d19fd4e75121617ad28355e604102920480defb1da895e1b` |
| Agent Presets `lib/index.js` | `8d9de90d3812abf18e923a14b57e772a89d0a8dd87abf4cfcbd8a4430d9ffec1` |
| DSH Tools `lib/index.js` | `aaba52bf5d0149355407642b3965c06977d1e9143f5c61bc19429abbe6a11c5d` |
| System Prompt `lib/index.js` | `c55121dd92e88783adc37a5f92e6c410304bae39796d1e67218b5fab8712bafc` |
| Persona `lib/index.js` | `1e9dd7f0dfd87cbff6486b7ca043d2e1b863a2a56b99106a4bf74831591266d5` |
| D0b.4a child fixture | `df33059e9823ff5ea32e98e1bd7d928ceae15f9bcb63229bec7e2e220f92c621` |
| D0b.4a parent test | `0926c7544e96271c79af5e31f1fd819910abf288f444a1580003472bc2ba2d83` |
| Installed package set | 523 instances; 25,509 files; 224,464,888 bytes; largest file 18,621,496 bytes; 14 native files; canonical SHA-256 `16392d0d956dc3e375536e78fd5a48a9f7003d7f679b6b26ab6aab344d6b826d` |
| Runtime tuple | Node `v26.8.1`; module ABI `147`; N-API `10`; `linux`; `x64`; glibc `2.43` |

`npm run verify:dsh-patch` must pass. Any mismatch is a stop for source
reinspection, not permission to update the manifest mechanically.

## Verification and acceptance

From the adapter package, run:

```sh
npm run verify:dsh-patch
node --test test/web-effective-graph-observer.test.mjs
node --test test/dsh-graph-manifest.test.mjs
npm test
```

Acceptance requires:

1. closed-schema and canonical-material tests pass;
2. all manifest source pins resolve from their declared roots, every one of
   the 523 installed package-instance rows and the aggregate package-set digest
   match, and the exact runtime tuple matches;
3. the disposable positive Host matches every row, source, structural count,
   root/default/mount, composition byte, and empty tool-catalog field;
4. wrong runtime field, package locator/version/tree hash, package count,
   source version/hash/path, unknown/missing/failed row, direct registration,
   wrong root/default/preset, changed composition, and extra tool each fail
   with their expected reason code; synthetic tree fixtures also reject
   symlinks, traversal, special files, and nested-package double counting;
5. the verifier rejects an over-1-MiB manifest before parsing, never reads an
   unapproved excess file after inventory mismatch, uses at most a 1-MiB read
   chunk, and settles or fails cleanly within the focused test's 120 s limit;
6. callback origin remains explicitly unproved in success and failure output;
7. D0b.4a remains green, the full adapter suite remains green, and cleanup
   leaves no child process or temporary home; and
8. only after all checks pass, the evidence file records exact counts,
   artifact digests, source-pin count, resource diagnostics, and claim ceiling.

Passing this unit proves an exact installed dependency-tree byte match,
Loader-entrypoint mapping, runtime tuple, and structural-manifest match for one
disposable Linux/x64 restricted profile. It does **not** prove which of those
files were actually imported, nested callback origin, Node executable or
system-library identity, cross-OS portability, early installation, graph
stability, pre-mutation revocation, a live epoch, Agent/permit binding, Host
identity, exclusive writing, crash recovery, or an ARE-controlled Web turn.

## D65 lanes, rollback, and stop conditions

- **Runnable product work:** the four adapter files plus post-pass evidence.
- **Causal blocker:** explicit owner authorization for this exact five-file
  implementation scope.
- **Operational support:** disposable loopback Host lifecycle and cleanup,
  contained within the fixture/test.
- **Deferred residue:** D0b.4c provenance/revocation, D0b.4d Agent/permit
  binding, D0b.4e conformance, P1g Host assertion, D0b.5/D2 recovery, and D1.
- **Rollback:** delete the four new adapter files and candidate evidence; no
  generated dependency, live profile, or configuration may remain.
- **Stop:** source hash/version, installed package-set, runtime-tuple, or native
  binary drift; a need to mutate generated dependencies or an existing runtime
  source; non-loopback binding; model/provider activity; secret/path emission;
  an over-limit manifest/inventory, preflight deadline breach, incomplete
  cleanup; or any source-provenance claim for nested callbacks.

## Open Questions

- None blocks owner selection of this exact unit.
- D0b.4c must decide the supported early import/registration capture and full
  pre-mutation latch; D0b.4b intentionally does not answer that question.
- Windows and macOS need separately reviewed package-set/runtime manifests;
  this first Linux/x64 witness must not be relabeled as cross-platform proof.
