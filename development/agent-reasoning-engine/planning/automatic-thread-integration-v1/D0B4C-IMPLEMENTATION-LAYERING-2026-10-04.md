# D0b.4c implementation layering

Status: **candidate layering; not implementation authority**. Date: 2026-10-04.
Route: `CA2-ROUTE-PLAN`. Authority effect: none. Evidence:
[source audit](evidence/D0B4C-EARLY-PROVENANCE-REVOCATION-SOURCE-AUDIT-2026-10-04.md).

## Layering result

- **Target:** D0b.4c early resolved-import provenance and pre-mutation graph
  revocation for the pinned `are-read-only` DSH Web prototype.
- **Artifact type:** runtime controller plus digest-bound private patch,
  disposable fixture, tests, refreshed D0b.4b source manifest, and evidence.
- **Mode:** additive private prototype on one exact Linux/x64 dependency graph.
- **Layer count:** four.
- **Recommended boundary:** implement all four layers inside one separately
  authorized D0b.4c unit; a partial layer may be retained as diagnostic work
  but may not be reported as D0b.4c complete.

The boundary heuristic is: add a layer only when it closes a new failure mode
that the preceding layer cannot detect before serving. Every layer below earns
its place.

## Layer DAG

```text
L0 early owner and state proof
  -> L1 resolved import and registration ancestry
      -> L2 complete pre-mutation latch and fingerprints
          -> L3 pre-ready qualification and conformance
              -> D0b.4c complete

D0b.4c complete -> D0b.4d Agent/Session/permit binding
D0b.4c complete -> D0b.4e authenticated Web negative cases (after D0b.4d)
```

## L0 — minimum working unit: early single owner

**Decision earned:** the controller can exist before any non-root Fiber and can
leave the serving state synchronously.

Implement a pure `dsh-graph-epoch` controller with closed states and bounded
reason codes. Extend the private patch with an opt-in `runProfile`/`boot` hook
between `new Context()` and `ctx.plugin(Loader)`. Prove:

- one root Context accepts one owner only;
- late, duplicate, or replacement installation rejects;
- boot starts in `capturing-boot`, not `qualified`;
- `revoke(reason)` is synchronous, sticky, idempotent, and retains the first
  cause plus bounded later diagnostics; and
- stop is terminal and never requalifies.

L0 is the smallest coherent proof. It does not know which code registered,
cover graph mutators, or qualify a Host.

## L1 — resolved import and causal registration ancestry

**Decision earned:** every accepted active Fiber in the restricted boot has a
trusted, source-pinned import ancestry or one of two exact bootstrap identities.

Add Loader import-target resolution using the pinned internal-loader v1/v2
calling convention and the three real base-selection rules. Bind the imported
callback object before Registry registration. Add Registry prepare/commit
hooks that attach immutable provenance to each Fiber.

Acceptance requires:

- exact Loader and `isolate` callback-object bootstrap authorizations;
- every primary Entry Fiber bound to resolved URL, source selector, Entry ID,
  parent Entry chain, package/version and D0b.4b source digest;
- every nested Fiber bound to its exact parent Fiber chain;
- direct root registration, unpinned URL, missing import record, conflicting
  callback binding, duplicate bootstrap, or registration after revoke rejects;
- no stacks or runtime names used as trust evidence; and
- claim text limited to `trusted-import-ancestry`, never function-definition
  origin.

## L2 — complete supported-mutation latch and source fingerprints

**Decision earned:** every supported graph-changing path leaves the qualified
serving state before its first mutation or yield.

Patch the complete boundary matrix in the construction binding. Add exact
composition/root/default/source fingerprints and a synchronous
`assertCurrent()` API. Add the serialized non-serving Agent-construction
window, which increments the epoch only after an exact expected delta closes;
overlap, mismatch, throw, cancellation or abandonment revokes.

Acceptance requires one first-mutation test per patch family, including
Registry insert/delete, Fiber update/restart/dispose, Loader create/update/
remove/init/dispose/stop, preset authoring/remount/recompose/select, and final
fingerprint drift. Calling a second hook after an earlier hook has already
latched is allowed, but an uncovered mutation path is not.

## L3 — source-bound pre-ready qualification

**Decision earned:** the unchanged restricted profile can produce one runtime
qualification receipt before the disposable fixture announces readiness, and
all injected negative cases fail closed.

The child verifies the refreshed D0b.4b manifest before boot, installs the
controller through the new opt-in hook, lets the restricted Host settle, then
compares captured Host graph and provenance with the manifest. Only then may it
emit IPC readiness. The receipt binds boot nonce, epoch, manifest ID/material
digest, package-set digest, source-pin count, Host graph digest, provenance
graph digest, state and timestamp posture; it contains no token, cookie,
Session ID, absolute path, callback source or stack.

Negative cases must cover unknown direct root plugin, wrong resolved base,
unbound nested registration, each mutator family, exact-byte/default/root
drift, duplicate owner, late owner, construction-window overlap and failed
window closure. The unchanged boot must still dispose cleanly.

## Non-regression surface

Every layer keeps these gates green:

1. patch check and patch round-trip tests;
2. D0b.4a observation tests;
3. refreshed D0b.4b source and structural witness tests;
4. existing Session append and Web permit tests; and
5. the full adapter suite.

The private patch applicator must preflight every generated target before
writing any and must reverse-transform every patched file to its exact base.
No test may use a live DSH home, provider credential, model request, prompt, or
external listener.

## Deferred work

- D0b.4d: real Host-owned Agent construction authority; actual standing-mount,
  Session, request, content and one-shot permit binding; append/model guards.
- D0b.4e: authenticated Web injection/race matrix.
- P1g: real single-local-Host principal assertion.
- D0b.5/D1: crash/recovery, uncertain in-flight work and broader producer/tool
  parity.
- hostile same-process plugin isolation and portable Windows/macOS manifests.

## Open Questions

- The first implementation deliberately serializes Agent graph construction.
  A later concurrency design must prove isolation before relaxing that rule.

