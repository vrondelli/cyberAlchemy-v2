# D0b.4b DSH source-pinned structural witness evidence

Status: **implemented and locally passing**. Date: 2026-10-04. Route:
`CA2-ROUTE-IMPLEMENT`. Owner authorization: exact statement
`Authorize D0b.4b.` Authority effect: none.

Controlling construction:
[D0b.4b construction binding](../D0B4B-CONSTRUCTION-BINDING-2026-10-04.md).
This evidence covers only the five-file D0b.4b authorization envelope.

## Result

The disposable Linux/x64 `web` profile now has a closed source/structure
manifest and fail-closed verifier. The final witness matched the complete
installed package closure, runtime tuple, 169 source pins, four reviewed
profile layers, all 156 Host Loader rows, both bootstrap fibers, the restricted
Agent mount, the 172-to-177 fiber transition, and the exact empty model-facing
tool catalog.

Cordis generates a fresh eight-hex ID at boot for three entries that omit an
explicit ID: HMR plus the selected browse backend and client surface. Raw IDs
therefore cannot be durable graph identities. The collector accepts the exact
eight-hex generated shape only for those three source-pinned module specifiers
and renders stable `generated:<module-specifier>` logical IDs. The separate
disabled `include:hmr` row retains its explicit ID. Any different generated-ID
shape, module, row, state, or count fails closed.

No prompt, model request, provider request, attachment, tool call, or external
write was made. Each positive/negative structural case used a fresh loopback
Host and mode-`0700` temporary home, exchanged its launch token only in memory,
sent at most one empty `session/create`, and removed the temporary home during
settlement.

## Final artifact identities

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `src/dsh-graph-manifest.mjs` | 43,498 | `a0ccfd8c75e3210c915def8f5dc41e1b5f12e7c9e1ad36422dc5be9c61033426` |
| `config/dsh-web-are-read-only-graph-manifest.v1.json` | 292,536 | `a5362d0a70f460f87edeaa19fe86c580ee9061b3ecc550a33d236b851f4a1288` |
| `test/fixtures/web-source-pinned-graph-witness.mjs` | 6,122 | `b29840901e978ed7a61e1dfe4301949132f6278afe34f5db11c86371c003e194` |
| `test/dsh-graph-manifest.test.mjs` | 17,364 | `d2d3c3deb386426545554835a05612a2155002d44d5c0d71492f9d6266b16311` |

The manifest material digest is
`fc961bc9bade082ed16352186aa7e02690f08d88b876cede823f53206f05af2a`.
The manifest is 292,536 bytes, below the 1 MiB pre-parse limit. It pins its
verifier, child witness, and focused test sources; it does not pin itself.

## Installed closure and runtime

| Field | Final matched value |
| --- | --- |
| Installed package instances | 523 |
| Regular files | 25,509 |
| Regular-file bytes | 224,464,888 |
| Native `.node` files | 14 |
| Largest regular file | 18,621,496 bytes |
| Canonical package-row JSON | 139,502 bytes |
| Package-set SHA-256 | `16392d0d956dc3e375536e78fd5a48a9f7003d7f679b6b26ab6aab344d6b826d` |
| Runtime | Node `v26.8.1`; ABI `147`; N-API `10`; Linux; x64; glibc `2.43` |
| Diagnostic host release | `6.18.33.2-microsoft-standard-WSL2` |

The two-pass verifier rejected inventory drift before hashing, used a maximum
1 MiB file-read buffer, rejected symlinks, traversal, special files, and nested
package double counting, and retained metadata rather than file contents.

## Structural match

| Phase | Exact active-fiber partition |
| --- | --- |
| Before Session creation | 172 = 127 Host primary + 43 Host nested + Loader bootstrap + isolate bootstrap |
| After one Session creation | 177 = 127 Host primary + 47 Host nested + one preset primary + Loader bootstrap + isolate bootstrap |
| Creation delta | five = four Host nested + one preset primary |

The selected/default preset was `are-read-only`; the only root was symbolic
`config/presets` with `system` trust; the only mounted preset row was
`include:agent-presets:persona`; composition SHA-256 was
`c749f1160281520ac1aa2acf924c633e96cf7cd5cc3660d868c7290a3279f8ff`;
and the model-facing tool catalog was exactly empty.

## Validation

| Command | Result |
| --- | --- |
| `npm run verify:dsh-patch` | pass; lock and both private-patched Session files matched |
| `node --test test/web-effective-graph-observer.test.mjs` | pass, 3/3 |
| `node --test test/dsh-graph-manifest.test.mjs` | pass, 7/7; 92.401 s test duration; 92.49 s wall; 629,752 KiB maximum RSS |
| `npm test` | pass, 55/55; no failures, cancellations, skips, or todos; 129.620 s test duration; 130.09 s wall; 608,444 KiB maximum RSS |

In the standalone focused run, the full runtime/source/package preflight took
65.985 s. Under parallel full-suite load it took 102.430 s, still within its
explicit 120 s deadline. The parent test has a separate 180 s settlement
allowance so the two disposable Hosts can cleanly stop under parallel load; it
settled in 127.558 s in the full suite.

Negative controls covered wrong runtime, package count/locator/version/tree
hash, source version/hash/path, unknown fields, stale material digest,
over-limit manifests, wrong profile layers, missing/failed Loader rows,
unexpected direct no-Entry registration, wrong root/default/preset,
composition drift, an extra tool, and a forbidden source-proved callback
claim. Every result retained `authority_effect: "none"`,
`callback_origin: "unproved"`, and
`serving_graph_lock: "not-established"`.

## Claim ceiling

Passing D0b.4b proves that one disposable Linux/x64 restricted profile matched
the reviewed installed dependency-tree bytes, selected adapter/DSH sources,
runtime tuple, Loader structure, active Registry partition, Agent mount,
composition, and empty tool catalog at the observed boundaries.

It does **not** prove which pinned files were actually imported, the resolved
origin of nested callbacks, Node executable or system-library identity,
cross-OS portability, early installation, mutation revocation, a stable
serving graph epoch, Agent/permit or Host-principal binding, exclusive writing,
crash recovery, deployment readiness, or an ARE-controlled DSH Web turn.
D0b.4c and later gates remain separately unauthorized.

## Open Questions

- D0b.4c still owns early import/registration provenance and synchronous
  pre-mutation revocation against a serving graph epoch.
- Windows and macOS still require separately reviewed package/runtime
  manifests; this evidence cannot be promoted as a portable witness.
- The measured RSS is diagnostic rather than an acceptance identity. A later
  optimization may reduce retained inventory metadata without weakening the
  two-pass source-byte proof.
