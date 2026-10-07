# D0b.4c early-provenance and pre-mutation-latch evidence

Status: **implemented and locally passing**. Date: 2026-10-05. Route:
`CA2-ROUTE-IMPLEMENT`. Owner authorization: exact statement
`Authorize D0b.4c.` Authority effect: none.

Controlling construction:
[D0b.4c construction binding](../D0B4C-CONSTRUCTION-BINDING-2026-10-04.md)
and [implementation gate](../D0B4C-IMPLEMENTATION-GATE-2026-10-04.md).
The route receipt was
`125980791f73e2ea1b3808cbc915c0296846183ce07c69f0de1628d8445d4be5`.
This evidence covers only the authorized nine authored files and ten generated
private-patch projections.

## Result

The exact pinned Linux/x64 `are-read-only` DSH Web Host now installs one graph
controller before Loader registration, binds imported callbacks to a verified
source-pin index and one of three reviewed resolution-base classes, records
Registry ancestry before descendant execution, qualifies the settled Host once,
and synchronously leaves serving state at every reviewed mutation boundary.

The disposable Host emitted readiness only after receiving an
`are.dsh-graph-qualification-receipt/v1` receipt with state `qualified`, epoch
`1`, claim posture `trusted-import-ancestry`, 172 source pins,
`authority_effect: "none"`, and `session_admission: "not-established"`. A late
unknown direct-root registration was rejected before insertion and left the
controller sticky-revoked with first reason `mutation.registry-plugin`.

The private patch remains a disposable projection. Its durable script performs
one all-target preflight, pins six dependency versions plus the package-lock
digest, accepts only the complete known base or patched state, applies every
anchor exactly once, and proves an in-memory reverse/forward round trip before
writing.

## Bound behavior

- App boot installs the exact single owner before Loader and authorizes the
  one-shot Loader callback.
- Loader uses its own v1/v2 resolver and actual host/preset resolution base,
  binds exact built-in or verified resolved sources, and authorizes the exact
  one-shot isolate callback.
- Cordis prepares provenance before Registry insertion and commits it before
  the newly created Fiber can expose a descendant registration.
- Cordis Registry/Fiber, Loader group/tree/entry/random-ID, and Agent Presets
  authoring/graph operations all invoke the controller before their first
  test-visible mutation.
- A synthetic Agent-construction window synchronously invalidates the old
  epoch, is single-owner and serialized, and advances only for an exact
  expected delta. Real Agent construction remains outside this gate.
- Fingerprint, source, base-class, owner, bootstrap, parent, callback-binding,
  delta, overlap, and late-registration failures are fail-closed. No method
  requalifies a revoked controller.

## Final identities

### Authored implementation artifacts

| Artifact | SHA-256 |
| --- | --- |
| `scripts/apply-private-dsh-session-patch.mjs` | `df39f71eec918831fc7f10dac9261909fb1808ef2fb00ab0ccd8496b2e3cea55` |
| `src/dsh-graph-manifest.mjs` | `b28099045717145642bfdd43c22ce20540a9412c391a26afd8cfb774f7d3d439` |
| `src/dsh-graph-epoch.mjs` | `f65dacdc3cd85b13f4f3be06b4f082d122a3b378116480c1005e4853490fdca4` |
| `config/dsh-web-are-read-only-graph-manifest.v1.json` | `880dea7557b167e9db97440a84f65700ca869de2d2168800dabcd02681f2ff40` |
| `test/private-dsh-session-patch.test.mjs` | `1eabb554060e7aae0d7927a7914865a92d63c1b2cb897b326a68109d231eab39` |
| `test/fixtures/web-early-provenance-revocation.mjs` | `b2076b5a257080f33ee26ea77b56e5cdc690b3b9b45443dc5eb9327689c1a483` |
| `test/dsh-graph-epoch.test.mjs` | `16700b1ccd7c45bd9b7e834971e8d27af428da5cdff78ad5025de5b9b4eea976` |
| `test/dsh-graph-manifest.test.mjs` | `8a94afdcfcb9215c81bc392fb054c01631e9c4e02a89c1c9199fc4929bc051ed` |

### Generated projection artifacts

| Generated target | SHA-256 |
| --- | --- |
| `dsh-session/lib/index.js` | `9399398facd18aef611172047496407bb905d0824a92a9319b0e9710910dd123` |
| `dsh-session/lib/types/index.d.ts` | `bd53bf30ae78440f061f5ff955aa8b64a26e5569a557ba503d11d7d88a145f01` |
| `cordis/lib/index.js` | `3317d1ac53cbad98692bd502744f51a9df20c5f7690e954bb705b50aa089c3d4` |
| `cordis-plugin-loader/lib/index.js` | `a1eefed8ed85cbcb7595a68b5f3eb4793847ff764d62d87ab24041df12281fa8` |
| `cordis-plugin-loader/lib/types/config/tree.d.ts` | `8463794d01f275147394897a3cfd06b1aa5baf6ccfaa1eac52360548dc70076b` |
| `cordis-plugin-loader/lib/types/config/entry.d.ts` | `220caafb74e37e9b92444ce0d9d21bc4d8921b562e4723a5b8bc2c6d613f69d5` |
| `dsh-app-boot/lib/index.js` | `0229241d76bd41f748485b4243cb02681120f60b3b36a9bd4ca3c4691c3cfc6a` |
| `dsh-app-boot/lib/types/index.d.ts` | `6cd099ae8027213cd0fa6c8725aa12bb311f198467336d977a9c399c9352bbb9` |
| `dsh-agent-presets/lib/index.js` | `6b62c6eef230ec246e35e180c8e2f297111765dc542aa0a67222e1bff5b97c27` |
| `dsh/profile-boot-Dk-7KqJc.js` | `546bc1c46324eacffe4758640c9bbf6ce9e89e1e13ef9839811fb1879de9edbb` |

The unchanged package-lock SHA-256 is
`5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`.
No package manifest or lock edit was made.

## Refreshed manifest

| Field | Final matched value |
| --- | --- |
| Manifest bytes | 293,882 |
| Material digest | `0bcee80eb015a4adc396510d148418a76ce2d4ce8ed651efaaac436e6971ab06` |
| Installed package instances | 523 |
| Regular files | 25,509 |
| Regular-file bytes | 224,469,597 |
| Source pins | 172 |
| Package-set SHA-256 | `8f2873e0726c7e879a9814f69cf4b771549c6ce8ad0eed2c7c886a90631e9bf9` |
| Callback-origin posture | `unproved` |
| Serving-graph-lock posture | `not-established` |

The pre-patch D0b.4b package-set digest
`16392d0d956dc3e375536e78fd5a48a9f7003d7f679b6b26ab6aab344d6b826d`
was an explicit negative control and rejected.

## Validation

| Command | Result |
| --- | --- |
| `npm run verify:dsh-patch` | pass; all 10 targets and the lock matched |
| `node --test test/private-dsh-session-patch.test.mjs` | pass, 6/6 |
| `node --test test/dsh-graph-epoch.test.mjs` | pass, 8/8; disposable Host qualified and rejected the late root registration |
| `node --test test/dsh-graph-manifest.test.mjs` | pass, 7/7; full installed tree and two disposable witnesses matched |
| D0b.4a observer plus prompt/append focused tests | pass, 12/12 |
| `npm test` | pass, 63/63; no failures, cancellations, skips, or todos; 248.423 s |
| syntax, JSON parse, and scoped `git diff --check` | pass |

The first standalone Host qualification and manifest-verifier attempts reached
their former 150-second and 120/180-second test deadlines without a mismatch
or child exit. Their bounded test-only deadlines were raised to accommodate
observed WSL filesystem cost. The standalone reruns then passed in 166.900 s
and 370.739 s; the exact final pinned files passed again inside `npm test` in
133.384 s and 246.091 s respectively.

The D0b.4c fixture sent no HTTP request, prompt, provider/model request, tool
call, attachment, or external bind before readiness. The required full
regression suite separately exercised its pre-existing disposable local-model
prompt test; it made no external provider call and is not evidence of D0b.4c
Session admission.

## Claim ceiling

Passing D0b.4c proves only that one exact trusted, pinned Linux/x64 restricted
Host captured causal import ancestry, matched its reviewed Host graph before
readiness, and synchronously left serving state for every tested supported
mutator before its first visible mutation.

It does **not** prove function-definition origin, hostile-plugin containment,
HTTP admission, real Agent construction, Session or one-shot permit binding,
an ARE-controlled prompt/model request, recovery, parallel construction,
cross-OS portability, deployment, or production readiness. In particular,
the offline manifest intentionally remains `callback_origin: "unproved"` and
`serving_graph_lock: "not-established"`; the runtime receipt is separate and
does not rewrite D0b.4b's claim posture.

## Open Questions

- D0b.4d still owns real Agent construction, standing mount, Session and
  one-shot permit binding to a current graph epoch.
- Windows and macOS require separately reviewed package/runtime manifests.
- A later gate must define recovery after revocation or process failure before
  any deployment or production claim.
