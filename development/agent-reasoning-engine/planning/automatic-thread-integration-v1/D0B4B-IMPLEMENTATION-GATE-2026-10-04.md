# D0b.4b source-pinned structural-witness implementation gate

Status: **owner decision required; no selection recorded**.
Date: 2026-10-04. Route: `CA2-ROUTE-PLAN`. Authority effect: none. Exact
construction scope:
[D0b.4b construction binding](D0B4B-CONSTRUCTION-BINDING-2026-10-04.md).

## Decision

Should the next bounded implementation objective be D0b.4b: the exact
five-file installed-source-pinned structural witness for the disposable DSH
Web `are-read-only` Linux/x64 profile?

| Option | Value | Cost and boundary | Result |
| --- | --- | --- | --- |
| A — authorize D0b.4b only | Converts D0b.4a's structural counts into a reviewed manifest that binds the complete installed dependency tree, Linux/Node runtime tuple, Loader rows, Registry categories, actual Agent mount, system-only root/default, and empty tool catalog | Adds a large 523-package Linux/x64-specific manifest, a one-time streamed 224 MB offline preflight, and local verifier/test maintenance; actual imported-file and nested-callback provenance remain explicitly unproved | Enables D0b.4c design against a concrete source/structure witness, subject to its own later gate |
| B — defer D0b.4b | Leaves implementation unchanged while further read-only analysis continues | D0b.4 cannot progress from observation toward a graph lock | D0b.4a remains the last implemented unit |

No option is selected by this document. The Goals package cannot register this
candidate as admitted execution state, and the planning route grants no
implementation authority.

## Exact option-A authorization envelope

Option A authorizes creation of only:

1. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/dsh-graph-manifest.mjs`;
2. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/config/dsh-web-are-read-only-graph-manifest.v1.json`;
3. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-source-pinned-graph-witness.mjs`;
4. `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/dsh-graph-manifest.test.mjs`; and
5. `development/agent-reasoning-engine/planning/automatic-thread-integration-v1/evidence/D0B4B-DSH-SOURCE-PINNED-STRUCTURAL-WITNESS-2026-10-04.md`, after tests pass.

It does not authorize edits to package manifests or locks, D0b.4a artifacts,
the private DSH patch, generated `node_modules`, live profiles, gateway/runtime
sources, Companion/website code, deployment, publication, or D0b.4c onward.

The source-currentness table, closed schema, restricted-profile baseline,
complete 523-instance installed-package snapshot, exact Node/ABI/N-API/
platform/architecture/libc tuple, negative cases, test commands, cleanup, claim
ceiling, two-pass 1-MiB-chunk/1-MiB-manifest resource bounds, 120 s focused-test
settlement deadline, rollback, and stop conditions in the construction binding
are part of the authorization envelope. Any required scope expansion returns
here before mutation.

To select option A, the owner can state exactly: `Authorize D0b.4b.`

## Current evidence and boundary

D0b.4a is implemented and its focused test passes 3/3; the adapter suite
passes 48/48. A fresh planning-only restricted-profile observation found the
expected 172-to-177 active-fiber transition, one mounted `persona` row, one
system-only preset root, and zero model-facing tools. This narrows the next
construction unit but is not a durable manifest, graph lock, or authorization.

A follow-up source-closure audit showed that the earlier 154 Loader entrypoint
hashes did not bind imported dependencies. The current adapter installation
contains 523 package instances, 25,509 regular files, 224,464,888 package
bytes, and 14 native files. Its canonical package-set SHA-256 is
`16392d0d956dc3e375536e78fd5a48a9f7003d7f679b6b26ab6aab344d6b826d`
under the construction binding's declared traversal. Option A now includes
that complete installed tree and the exact Linux/x64 Node runtime tuple; this
does not enlarge the five-file write set.

The selected fixed-chunk audit reproduced the digest in 31.6 s with 83,388 KiB
maximum resident memory on this WSL host. A sequential whole-file comparison
was faster (17.9 s) but used 142,804 KiB, so the low-memory fixed-chunk route is
the implementation requirement. The timings remain diagnostic; exact inventory
caps, a 1 MiB read chunk, a 1 MiB manifest cap, and clean settlement within the
focused test's 120 s deadline are the enforceable boundary.

Even after option A passes, D0b.4c remains necessary because Cordis's current
post-boot Registry/Loader state cannot prove the resolved source of nested
callbacks. D0b.4b must say `callback_origin: "unproved"` and cannot qualify a
serving epoch or controlled turn.

## Open Questions

- Owner selection of A or B is the only blocking decision for this unit.
- Early provenance capture and synchronous drift revocation remain owned by a
  later, separately reviewed D0b.4c construction binding.
- A Windows or macOS witness requires a separately reviewed platform manifest;
  option A authorizes only the current Linux/x64 pin.
