# D0b.4d — Host-owned permit and Agent binding evidence

Status: **implemented for the fresh, single-local-Host disposable profile; Web conformance remains open**. Date: 2026-10-05. Route: `CA2-ROUTE-IMPLEMENT`. Owner authorization: `Authorize D0b.4d`. Authority effect: none. Route receipt: `4412ebc567e0ae2f4b5927914ee3b7e92e575fcd4168e418bc8bb362123d6f35`.

## Result and claim ceiling

The exact pinned Linux/x64 DSH Web Host can boot a qualified Host-owned profile, mint a fresh native Session/Agent ID, append `thread-bound` and `bound` in the existing durable ARE gateway journal before native publication, verify the published Agent and graph, activate the binding, and return creation. The Host rejects caller-chosen session identity. A second Agent sharing the standing preset also qualifies; the graph epoch advances from 1 to 2 to 3. The live fixture observed no unknown fibers. The first Agent's cold graph delta is five fibers; a subsequent warm Agent's delta is two. Both are pinned in the qualified manifest.

The restricted controller accepts only fresh create and queue prompt; other remote session operations reject. The pinned SessionStore installs the final-append broker before Session preparation, and the pinned AgentLoop consults the Host owner before model dispatch. The broker captures the exact Agent, standing mount, boot nonce, and graph epoch before ARE preparation, checks them again after asynchronous preparation and at the synchronous native append, and requires an admitted user message in the current epoch for model dispatch. The real Host-owned local principal and writer assertion use the existing `are.conversation-binding/v1` journal, not a synthetic fixture principal or a second binding store.

This is **not** a claim of complete authenticated browser/Web conformance, successful provider/model turn, restart/resume recovery, deployment readiness, or full ARE control of arbitrary DSH sessions. Those remain D0b.4e and later work. The qualified manifest pins the DSH installed package tree and selected adapter/ARE gateway imports; it does not prove a closed transitive hash graph for the entire ARE decision CLI. The separate policy/runtime bundles still have their own verification, but this graph witness must not be described as a complete source closure for every ARE import.

## Boundary sequence

1. The private pinned app-boot hook calls `hostPrepare` before the Loader tree. The pinned SessionStore constructor then installs one append-admission factory before its first `prepare`.
2. The qualified controller's create path rejects request fields, mints the native ID, and opens the single-owner graph construction window. Its controller closure retains the registered native instance because Cordis exposes a service proxy to callers.
3. The Session factory consumes the one-use Host creation capability and installs the broker before inbox availability. Agent setup mounts the selected preset and writes `thread-bound` then `bound` before native publication.
4. Native publication installs the final lifecycle fiber. Before acknowledging create, the owner compares the full cold/warm graph delta, commits the next epoch, verifies the published Session/Agent identities, activates the binding, and activates the broker. Any failure revokes the graph; no prompt is admitted from an inactive binding.
5. Prompt admission is queue-only, ARE-prepared, binding-authorized, and guarded at final Session append. The model-dispatch hook requires a matching admitted active-turn user message and current epoch.

## Validation

| Check | Result |
| --- | --- |
| `npm run verify:dsh-patch` | Pass; all 11 exact generated targets and lock digest matched |
| Focused patch, broker, owner tests | Pass, 21/21 |
| Disposable qualified Host: caller identity rejection and two native Agents | Pass, 1/1; active bindings, epochs 2 and 3, zero unknown fibers |
| D0b.4b manifest suite on refreshed pinned package tree | Pass, 7/7; full 523-package hash, restricted Host and drift cases |

The qualified manifest has 185 source pins, material digest `c85a613681fe742b9131ee4b5efc4052a7defed6da9bac6853b8dc6d840f00b7`, and package-set digest `b329280fc50cb7248fab215c4426bb078165a2503c84044e1ce03d0a0a4a364e`. The older read-only manifest remains a separate profile (178 pins) and is not silently promoted to Host-owned serving.

## Open Questions

- D0b.4e must prove authenticated Web create/prompt, negative mutation and race cases, and an unchanged restricted no-tool native turn; the current disposable test invokes the in-process controller.
- A crash between durable claim, binding, native publication, and activation remains fail-closed but needs explicit quarantine/reconciliation. Restart and resume remain excluded from this fresh-only profile.
- Review and bind the full transitive ARE decision-CLI code closure if a future claim requires every non-DSH source byte to be covered by this graph manifest.
- Source-pinned DSH upgrades require re-observation of cold and warm graph deltas and repeat conformance; these counts are not portable invariants.
