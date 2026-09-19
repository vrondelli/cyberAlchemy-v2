# Bounded native persistence descendants

`stage-persistence.mjs`, `context-recycling-bounded-v3.mjs` and `transport-bounded-v3.mjs` are additive modules. Original native implementations, frozen experiment sources and current provider runs remain unchanged. This is a persistence integration component, not an end-to-end stage-cap or live approval.

## Caller API

`createStagePersistence({stage_guard, stage_root})` returns synchronous methods:

- `writeJson(path, value, {final=false})`: exclusive canonical JSON write, file fsync and parent-directory fsync.
- `append(path, text)`: append encoded text, or exclusive create if absent, with allocation reservation and fsync.
- `atomicJson(path, value)`: fresh temporary file, fsync, rename and directory fsync. Replacement holds the old file plus complete temporary allocation. Initial publication reserves both destination and temporary entries before any effects.
- `createLock(path)` and `removeLock(path)`: exclusive leased creation and owned regular-file removal. Missing parent directories are created only inside an admitted file/lock write.

Paths must resolve inside the exact stage root; native callers should pass absolute paths. The same stage guard/persistence object must be shared by both workers and all stage writers. Optional `io` injection exists solely to test failure boundaries. Partial files remain counted; errors settle all acquired leases and retain the original error plus any settlement diagnostic. Final artifacts use `writeJson(...,{final:true})` only after ordinary leases are drained. Atomic replacement and append are ordinary operations.

`openContextRecycling({...existing_args, persistence})` requires the supplied persistence object. All recycler lock, checkpoint and archive writes use it, including parent-directory creation. Native registration functions remain local to this descendant module. `createGlmClient({...existing_args, persistence, before_dispatch})` imports those same functions, preserving the WeakMap registration boundary and the existing semantic client-identity hash. Callers must not mix the original recycler with the descendant transport.

`before_dispatch({kind, request_sha256, signal})` is awaited after secret resolution, immediately before HTTP dispatch; abort is checked again afterward. Guard failure produces an explicit undispatched zero-token receipt and infrastructure/persistence marker, without a credential-failure label. Received model usage remains attached if ledger persistence or post-response checkpoint persistence fails. Original transport/profile/retry semantics otherwise remain unchanged; caller policy still forbids benchmark retries.

## Validation

Eight synthetic tests pass: create/append/atomic/lock leases, retained temporary file after rename failure, full-stage rejection before recycler directory creation, native transport/recycler registration and unchanged identity, known model usage through ledger and checkpoint failure, and health rejection after synthetic secret resolution before model HTTP. HTTP requests are intercepted in memory without sockets. No real credentials, providers, tokenizers, dataset trees, gold or network were accessed.

## Open Questions and remaining integration

Root-owned run/preflight/live-client successors must pass this exact object to every descendant boundary and route their own artifacts through it. The source-restoration descendants separately require the same stage guard/root. Native scorer subprocess/temp/cache writes still need bounded integration. Stage-root creation requires its own launch/storage admission, and no unrelated writer may bypass the shared guard. Independent review and complete writer-inventory validation remain prerequisites before claiming a full32MiB cap or creating a live freeze.
