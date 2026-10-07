# D0b.4a — DSH effective-graph observation evidence

Status: **implemented and verified within the D0b.4a construction boundary**.
Date: 2026-10-04. Route: `CA2-ROUTE-IMPLEMENT`. This is bounded structural
test evidence; it does not activate DSH Web, qualify a graph lock, or establish
an ARE-controlled turn.

The owner authorized the exact D0b.4a three-file write set. The implementation
route receipt is `f9d611ef22bf33f6463b5288e508ed20188c2059ca2f5a94be895b4667c8d467`
(`route_decision_digest`
`c47590bf7e7e70ba41df1e8b9a439b7f2d8de3170c9e0453f4759e1cc30fbfea`).

## Implemented observation

The out-of-graph child harness starts the pinned stock `web` profile through
`runProfile()`, with no Loader observer row and no observer Registry fiber. A
closed Node IPC protocol permits only baseline snapshot, post-create snapshot,
negative injection, and disposal. It returns structural counts and bounded
reason codes; launch token, cookie, Session ID, prompt content, Host logs,
callback source, environment, and paths are not returned.

The positive case used a fresh mode-`0700` temporary `DSH_HOME`, authenticated
to the loopback Web endpoint in memory, and sent one `session/create` request
with an empty request. It observed:

- before creation: 173 active fibers = 128 Host primary + 43 Host nested +
  Loader bootstrap + isolate bootstrap;
- after creation: 208 active fibers;
- exact 35-fiber delta = five Host nested + 14 preset primary + three preset
  Group primary + 13 preset nested;
- one announced Agent joined to preset `standard`, whose standing mount had 31
  entries: 28 non-Group and three Group;
- zero unknown fibers before and after creation.

The negative case used a separate fresh Host. After proving the same 173-fiber
baseline, it registered one named callback directly through
`ctx.root.plugin(...)`. The classifier returned `ok: false`, exactly one new
unknown active fiber, and reason `unknown-no-entry-registration`. The injected
fiber and Host were disposed before the parent removed the temporary home.

No prompt, model selection, attachment, tool, model call, or provider call was
made by this observation.

## Verification

From
`implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter`:

- `npm run verify:dsh-patch` — passed; pinned DSH `0.1.5-rc.2`, Session
  `0.1.5-rc.3`, and the already-patched installed files matched.
- `node --test test/web-effective-graph-observer.test.mjs` — 3/3 passed,
  including the positive and negative subtests; 0 failed, skipped, or
  cancelled.
- `npm test` — 48/48 passed; 0 failed, skipped, or cancelled. The package
  pretest repeated the private-patch verification.

Implemented artifact digests:

| Artifact | SHA-256 |
| --- | --- |
| `test/fixtures/web-effective-graph-observer.mjs` | `df33059e9823ff5ea32e98e1bd7d928ceae15f9bcb63229bec7e2e220f92c621` |
| `test/web-effective-graph-observer.test.mjs` | `0926c7544e96271c79af5e31f1fd819910abf288f444a1580003472bc2ba2d83` |

The construction binding's source-currentness gate also remained exact:

| Source | SHA-256 |
| --- | --- |
| Adapter `package-lock.json` | `5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896` |
| Cordis `lib/index.js` | `1729cdbf8ee40b17c8839e06bf96491490548559e11ef7e411271e0754e751c5` |
| Cordis Loader `lib/index.js` | `95f3651b2ac3caa6d19fd4e75121617ad28355e604102920480defb1da895e1b` |
| Agent Presets `lib/index.js` | `8d9de90d3812abf18e923a14b57e772a89d0a8dd87abf4cfcbd8a4430d9ffec1` |
| DSH App Boot `lib/index.js` | `d8fdfe41996a4fefcff63af4982787924b0ae651f24bb1402f775b70202529bb` |
| Profile export shim `profile-boot-BP_C0vpU.js` | `1c8ff3e931a29a8f4e54a4db197935aa0d5f6bfbd4275a487bfff576d600ca69` |
| Effective profile `profile-boot-Dk-7KqJc.js` | `8b79b5c70281f23153ecc1828ba9b6e7b48364cc71409c90f12bde4cc4d7cde0` |

## Claim ceiling

This unit proves repeatable structural observation of the current pinned DSH
Web graph and fail-closed rejection of the injected no-Entry registration. It
does not prove module provenance, graph immutability, pre-mutation revocation,
Host identity, exclusive writing, ARE prompt admission, crash recovery, or a
controlled Web turn.

## Open Questions

- D0b.4b still needs a separately authorized source manifest and provenance
  binding before this structural observation can become a graph lock.
- D0b.4c through D0b.4e, P1g Host assertion, and D1 remain deferred under the
  parent integration plan.
