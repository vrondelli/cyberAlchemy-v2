# Goal

Determine the fastest governed route to a runnable local knowledge-graph UI example that reuses the current CyberAlchemy-v2 and DomainSpec-v2 node, relation, provenance, and view contracts while leaving an explicit revision seam for later DomainSpec-v2 candidate and authoritative inputs.

# TL;DR

The shortest honest route is a new proposal-only `SWU-IOLM-00C-UI-A`, dependent only on passed `SWU-IOLM-00C-A`, followed—only after exact owner approval and application—by one bounded Task Session in a new child Craft context, `CTX-CAV2-IOLM-WORKABLE-EXAMPLE`. That session may write only `cyberAlchemy-v2/development/iolm-workable-example/**`. Its input is the current checked-in expected Key-and-Door graph, source manifest, and build receipt, bound by exact hashes before a local server opens its port. It is a private fixture-backed demonstration, not candidate compiler output and not evidence for `00C-B`, `00C-C`, `G-DSV2-SG`, promotion, or publication. [Agent 1 establishes that this is the smallest complete compiled fixture and that the UI does not yet exist](./research.md#a-fixture-backed-demonstration-available-now); [Agent 2 establishes the independent fixture-demo SWU route](./research.md#finding); [Agent 3 establishes the separate package and evidence split](./research.md#non-negotiable-evidence-split).

The implementation boundary is one immutable, versioned `DemoSnapshotV1`, produced through `PinnedMintedFixtureGateway -> MintedFixtureBindingGuard -> DemoSnapshotV1Adapter -> DemoSnapshotV1Guard -> QuestionSliceSelector -> Graph | Outline | Table`. Native HTML, CSS, ES modules, SVG, and semantic tables are enough for the first 4-node/3-edge example. Agent 2’s React Flow/ELK observations are time-bound to **2026-07-22**, research-only, and neither authorized for this slice nor verified compatible with the future implementation environment. [Agent 1 requires one normalized model rather than renderer-owned semantics](./research.md#verdict); [Agent 2 supplies the shared-selection, co-primary-lens interaction contract](./research.md#exact-walking-skeleton); [Agent 3 requires a version-addressed immutable snapshot boundary](./research.md#adapter-and-revision-seams).

# Context

`SWU-IOLM-00C-A` supplied executable candidate contracts, but the repository contains no runnable IOLM graph UI. `00C-B` still requires a literal two-feature CyberAlchemy Method/Craft compilation with a typed cross-feature edge, while the live DomainSpec-v2 compiler still rejects cross-feature edges. `00C-C` is unselected, and the authoritative `Sg` route remains blocked. Folding a demo into any of those gates would convert interface evidence into compiler or authority evidence without proof. [Agent 1 separates the runnable compiler substrate from the blocked two-feature proof](./research.md#b-compiler-backed-candidate-proof); [Agent 2 separates a fixture demonstration from candidate parity](./research.md#finding); [Agent 3 identifies the reserved IOLM prototype scopes and forbids ambiguous evidence](./research.md#verdict-1).

The explorers agreed on the fixture-backed vertical slice, shared selection across graph/outline/table, visible provenance, and hard non-authority limits. They disagreed on the carrier and package stack: Agent 2 proposed the positive candidate envelope plus React/ELK, while Agent 1 found that envelope is not byte-bound to the current receipt and also showed that native HTML/SVG can render the small graph. The reviewed resolution is to use the checked-in expected minted bundle directly, retain Agent 2’s learner-facing interaction contract, and require no package installation for the first slice. The 2026-07-22 React Flow/ELK observations remain optional research, not an authorization or a compatibility finding for the environment in which a later implementation would run. [Agent 1 documents the stale envelope binding and native-renderer option](./research.md#a-fixture-backed-demonstration-available-now); [Agent 2 documents the desired learner journey and dated renderer research](./research.md#renderer-and-layout); [Agent 3 requires stale or mismatched revisions to block rather than fall back](./research.md#forbidden-shortcuts-and-ui-negative-controls).

# Verdict matrix

| Question | Verdict | What may be claimed | What remains excluded |
|---|---|---|---|
| Can a local fixture UI be built now? | **YES, after proposal approval/apply** | A fixed, contract-bound 4-node/3-edge bundle can drive three synchronized local read views with inspectable provenance. | No UI or passing browser/accessibility evidence exists yet. |
| Does this unblock or satisfy `SWU-IOLM-00C-B`? | **NO** | Nothing beyond regression compatibility with current fixture contracts. | The Option 1 route, literal two-feature source set, typed cross-feature connection, deterministic double compilation, and owner-issued receipt remain unchanged. |
| Does this satisfy `SWU-IOLM-00C-C`? | **NO** | Demo-only projection behavior. | Candidate-substrate parity selection and evidence. |
| Does this satisfy `G-DSV2-SG` or support authoritative display? | **NO** | `posture: candidate` and `authority_effect: none` only in `DemoSnapshotV1`. | Owner-issued `Sg`, quotient, retraction, authoritative adapter, or authority transition. |
| May demo reports enter promotion or publication evidence? | **NO** | `artifact_role: demo-evidence`, scoped to this SWU. | Promotion, publication, release admission, ontology authority, or DomainSpec authority. |
| Does the first slice require package installation? | **NO, by design** | Runtime requirements are Python 3.11+, Node 22+, and an ES2022-capable browser. | This is not a claim of “no runtime dependencies”; React Flow/ELK remain dated research only and are not authorized or compatibility-verified. |

These verdicts preserve Agent 1’s proof boundary around `00C-B` and `G-DSV2-SG`, Agent 2’s narrow fixture-demonstration claim, and Agent 3’s machine-readable evidence exclusions. [Agent 1: compiler-backed proof and authority boundary](./research.md#b-compiler-backed-candidate-proof); [Agent 2: run-and-evidence limits](./research.md#run-and-evidence); [Agent 3: non-negotiable evidence split](./research.md#non-negotiable-evidence-split).

# Recommended architecture

```text
current checked-in expected Key-and-Door bundle
  -> PinnedMintedFixtureGateway
  -> MintedFixtureBindingGuard
  -> DemoSnapshotV1Adapter
  -> DemoSnapshotV1Guard
  -> QuestionSliceSelector
  -> Graph | Outline | Table
                 \
                  -> shared selection -> provenance inspector
```

The gateway reads exactly three existing expected artifacts and does not compile sources, consume the candidate-envelope fixture, or generate a fresh receipt. The binding guard verifies bytes and all identity-bearing contract fields before `serve_demo.py` binds a port. The adapter performs the only posture translation: it turns fixture records into `DemoSnapshotV1` records with `posture: candidate` and `authority_effect: none`. Renderers receive only the guarded snapshot or a selector-produced induced view; they never parse DomainSpec files or infer edge meaning. [Agent 1 requires complete provenance joins and a single normalized read model](./research.md#a-fixture-backed-demonstration-available-now); [Agent 2 requires lenses not to import fixture JSON directly](./research.md#component-and-revision-boundary); [Agent 3 requires adapters to carry versioned binding and forbids renderer-local authority](./research.md#adapter-and-revision-seams).

`DemoSnapshotV1` must model feature namespaces explicitly and give every relation independently namespaced source and target endpoints. The current fixture exercises one feature; a non-served, sidecar-only synthetic conformance case exercises two feature namespaces and a cross-feature endpoint. That sidecar proves only that the snapshot shape does not preclude future input; it is not candidate data, `00C-B` evidence, or a substitute for compiler support. [Agent 1 preserves the literal two-feature requirement](./research.md#b-compiler-backed-candidate-proof); [Agent 3 requires local candidate modeling not to decide authority](./research.md#owner-boundaries).

Artifact roles are deliberately asymmetric:

- the three input artifacts are `fixture`;
- `DemoSnapshotV1` is `generated-read-model` and is the only layer allowed to add candidate posture plus `authority_effect: none`;
- graph, outline, table, question slice, and inspector are `projection`;
- validation and run reports are `demo-evidence`.

No layer is `source` or `authoritative`, and every result contract carries this machine-readable fence:

```json
{
  "ineligible_for": [
    "SWU-IOLM-00C-B",
    "SWU-IOLM-00C-C",
    "G-DSV2-SG",
    "CROSS_FEATURE_UNSUPPORTED",
    "promotion",
    "publication"
  ]
}
```

Neither the single-feature source fixture nor the synthetic cross-feature sidecar resolves, bypasses, contradicts, or provides evidence against the live compiler’s `CROSS_FEATURE_UNSUPPORTED` guard. The existing IOLM candidate validator remains a regression-only precheck; its PASS cannot be aggregated into this demo’s outcome or the blocked gates. [Agent 1 preserves the compiler prohibition and upstream route](./research.md#b-compiler-backed-candidate-proof); [Agent 2 distinguishes carrier fixture from source authority](./research.md#exact-walking-skeleton); [Agent 3 defines the minimum visible vocabulary and forbidden gates](./research.md#minimum-visible-vocabulary).

# Exact first build slice and file boundary

The first governed change is not implementation. It is `invoke:refresh:proposal-only`, adding exactly `SWU-IOLM-00C-UI-A`, dependent only on passed `SWU-IOLM-00C-A`, and the child Craft context `CTX-CAV2-IOLM-WORKABLE-EXAMPLE`. The proposal must machine-exclude its receipts from `00C-B`, `00C-C`, `G-DSV2-SG`, promotion, and publication. Option 1 and the literal two-feature cross-feature done criterion in `00C-B` remain textually and semantically unchanged. Only after exact approval and apply may one Task Session write the package. [Agent 2 proposes the independent UI SWU](./research.md#finding); [Agent 3 preserves the Option 1 control and requires a child context outside reserved paths](./research.md#non-negotiable-evidence-split).

The Task Session write boundary is exactly:

```text
cyberAlchemy-v2/development/iolm-workable-example/
  README.md
  index.html
  serve_demo.py
  contracts/
    source-binding.v1.json
    source-binding.v1.schema.json
    demo-snapshot.v1.schema.json
  assets/
    demo.css
    app.mjs
    gateway.mjs
    binding-guard.mjs
    demo-snapshot-v1.mjs
    question-slice.mjs
    selection.mjs
    graph-view.mjs
    outline-view.mjs
    table-view.mjs
    provenance-inspector.mjs
  generated/
    read-models/
      demo-snapshot.v1.json
    runs/
      <run-id>/
        automated-results.json
        manual-results.json
        validation-summary.json
  manual/
    MANUAL-CHECKS.md
  tests/
    binding-guard.test.mjs
    demo-snapshot-v1.test.mjs
    question-slice.test.mjs
    projections.test.mjs
    selection-inspector.test.mjs
    test_server_contract.py
    fixtures/
      demo-snapshot-v1-cross-feature.synthetic.json
```

`contracts/source-binding.v1.json` is the versioned runtime manifest, validated by `contracts/source-binding.v1.schema.json`; it carries the three canonical paths, all nine pinned values, expected counts `4 nodes / 3 edges`, all four node IDs, and all three edge IDs. `contracts/demo-snapshot.v1.schema.json` binds the exact read-model contract written to `generated/read-models/demo-snapshot.v1.json`. The `tests/*.test.mjs` paths cover pure ES-module models, `tests/test_server_contract.py` covers the Python binding/server boundary, `manual/MANUAL-CHECKS.md` owns the human protocol, and every attempt gets durable result files under `generated/runs/<run-id>/`. These are exact governed paths, not a claim that any file currently exists.

The package must not edit DomainSpec fixtures, IOLM prototype contracts, compiler code, work-pack evidence outside the approved SWU’s own governed records, or public `arcanum/`. It may read the current expected bundle in place; `serve_demo.py` exposes it only through the three fixed fixture routes. [Agent 3 requires the sibling package, forbids use of the existing prototype scopes, and forbids private output in Arcanum](./research.md#forbidden-shortcuts-and-ui-negative-controls).

# Pinned input contract

The runtime input is the current checked-in expected Key-and-Door bundle, never candidate truth and never a fresh build:

| Artifact | Allowlisted repo-root-relative path |
|---|---|
| graph | `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json` |
| source manifest | `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json` |
| build receipt | `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json` |

| Binding | Required value |
|---|---|
| graph SHA-256 | `66a63b80141274d7c803820c668f521d1676961e7362d8e9af1b03061c4b4a65` |
| source-manifest SHA-256 | `3d5db5ae885b93b4c490057597624c96ff53d3061d33af7ba289878d1eded831` |
| build-receipt SHA-256 | `1a5be10941d8342451d71e80dacc3bdd9ecfbe39412b22ffde617cd04370e20d` |
| source-set digest | `6316759c5fc26835c1dcdd951d4fdc9e9def708bdbf38941cfe62512b4987b95` |
| profile | `feature-with-independent-node-files@1` |
| profile digest | `0cbc0b58f35b39bd45698d4f19ce4d853e4ae26c6242633df8952e20f81423e5` |
| generator | `fixture-generator/v1` |
| kinds digest | `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede` |
| relationships digest | `567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41` |

The binding exists because the checked-in graph, manifest, and receipt form the smallest complete generated dataset; the old positive candidate envelope cannot replace this table because it claims a different receipt digest and its validator does not dereference artifact paths. At startup and before serving fixture bytes, the path guard must take the explicit `--repo-root`, reject any symlinked component, compute a strict realpath, prove that it remains beneath that explicit repository root, and require equality with exactly one of the three allowlisted canonical paths above. A path escape, alternate path to the same bytes, or symlink anywhere in the resolved component chain is a block. [Agent 1 identifies the exact carrier class and the envelope mismatch](./research.md#a-fixture-backed-demonstration-available-now); [Agent 3 requires path, revision/hash, schema, adapter version, and output digest at every adapter boundary](./research.md#adapter-and-revision-seams).

The guarded semantic core is exactly:

| Type | Stable ID | Required meaning |
|---|---|---|
| node | `key-and-door.DoorUnlocked` | Event |
| node | `key-and-door.HasKeyRule` | Rule |
| node | `key-and-door.Player` | Entity |
| node | `key-and-door.UnlockDoor` | Operation |
| edge | `key-and-door.edge.has-key-rule-enforces-unlock-door` | `HasKeyRule --enforces--> UnlockDoor` |
| edge | `key-and-door.edge.player-performs-unlock-door` | `Player --performs--> UnlockDoor` |
| edge | `key-and-door.edge.unlock-door-produces-door-unlocked` | `UnlockDoor --produces--> DoorUnlocked` |

Every stable ID must join to exactly one source-manifest record. Missing, duplicate, redirected, or digest-mismatched joins block the whole snapshot. Renderers may abbreviate visible labels but must select, link, and inspect by the full IDs above. [Agent 1 requires exact manifest joins and ID preservation](./research.md#a-fixture-backed-demonstration-available-now); [Agent 2 requires identical stable-ID sets and selection across lenses](./research.md#exact-walking-skeleton).

# Data flow and observable default

On startup, `serve_demo.py` validates `contracts/source-binding.v1.json`, checks its three literal repo-root-relative paths against the explicit `--repo-root`, rejects symlinked components and path escapes, verifies the pinned hashes and receipt bindings, and checks that the request surface can expose only the declared assets and fixture routes. Only then may it bind `127.0.0.1:4173`. The browser gateway fetches `/fixtures/graph.json`, `/fixtures/source-manifest.json`, and `/fixtures/build-receipt.json`; no other repository path is addressable. The guard repeats structural and join checks, the adapter emits one immutable snapshot, and all views are pure projections of that snapshot. [Agent 2 requires a default-deny source resolver and no non-GET traffic](./research.md#exact-walking-skeleton); [Agent 3 requires GET-only behavior and blocking on stale or mismatched sources](./research.md#forbidden-shortcuts-and-ui-negative-controls).

The default screen shows the full 4-node/3-edge semantic core and explicit `4 nodes / 3 relations` counts. The focus question—“What does the Player do, and what supports that connection?”—switches to the induced set `{key-and-door.Player, key-and-door.UnlockDoor, key-and-door.edge.player-performs-unlock-door}` with explicit `2 nodes / 1 relation` counts. It is a projection over the same snapshot, not a replacement graph. Graph, outline, and table are co-primary: they preserve a selected stable ID across lens changes and feed one persistent provenance inspector. [Agent 1 warns that a display filter must not masquerade as a new graph](./research.md#a-fixture-backed-demonstration-available-now); [Agent 2 specifies the exact question slice, shared selection, and provenance fields](./research.md#exact-walking-skeleton).

The page always displays: **“Private fixture-backed candidate demo — authority effect: none — publication unauthorized.”** Each inspector record shows artifact role, posture, authority effect, owner route, source reference, contract binding, validation state, relation class when applicable, and exact provenance. Graph edges use explicit labels and direction; outline is described as an authored navigation projection rather than containment; table uses native Records and Relations tables. The UI offers no edit, approve, promote, waive, close, publish, rebuild, or source-write action. [Agent 3 defines the persistent posture strip, vocabulary, and forbidden controls](./research.md#minimum-visible-vocabulary); [Agent 2 distinguishes the outline from semantic containment](./research.md#exact-walking-skeleton).

# Exact commands and URL

After the SWU is approved, applied, and implemented, the advertised local commands are:

```bash
cd /home/vrondelli/projects/domainspec-core
python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py \
  --repo-root "$PWD" \
  --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json \
  --check
node --test cyberAlchemy-v2/development/iolm-workable-example/tests/*.test.mjs
python3 -m unittest cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py
python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py \
  --repo-root "$PWD" \
  --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json \
  --host 127.0.0.1 --port 4173
```

Then open:

```text
http://127.0.0.1:4173/?lens=graph&selected=key-and-door.UnlockDoor
```

The runtime floor is Python 3.11+, Node 22+, and an ES2022-capable browser. No package installation is required, but Python, Node, and the browser are runtime dependencies. `--check` must validate the binding and schemas, exercise the exact pre-bind and typed-negative checks, invoke or equivalently collect the pure-model and server-contract automated suites, write the durable run result set, and exit without opening a listener. The final serve command must rerun the exact binding before port bind and fail closed on mismatch. These are required future commands, not evidence that they currently succeed. [Agent 1 supports a Python-served native fixture viewer](./research.md#a-fixture-backed-demonstration-available-now); [Agent 2 supplies the URL-addressed selection contract](./research.md#exact-walking-skeleton); [Agent 3 requires validation to block stale inputs](./research.md#forbidden-shortcuts-and-ui-negative-controls).

The server contract is GET/HEAD only. It serves the application assets plus exactly the three fixture routes above; unknown routes return 404, non-GET/HEAD methods return 405, and no request can write, compile, rebuild, traverse paths, or expose arbitrary repository content. [Agent 2 requires source resolver rejection and no non-GET request](./research.md#run-and-evidence); [Agent 3 forbids mutation endpoints](./research.md#forbidden-shortcuts-and-ui-negative-controls).

# Acceptance and red checks

Every check attempt allocates `generated/runs/<run-id>/`. `automated-results.json` records only automated checks. `manual-results.json` is created with every required manual check at `NOT_RUN` and changes only when a person performs and records that protocol. `validation-summary.json` is derived from those two files: any binding/security failure is `BLOCK`; any other required check failure is `FAIL`; absent failures, any required manual `NOT_RUN` makes the overall state `NOT_RUN`; overall `PASS` is possible only when every required automated and manual check is `PASS`. `--check` may exit successfully when its automated scope passes, but it must still emit overall `NOT_RUN` while manual evidence is outstanding. Each result names its narrow claim and the complete `ineligible_for` fence. [Agent 3 requires claim-scoped validation states and forbids successful UI tests from creating authority](./research.md#minimum-visible-vocabulary); [Agent 2 separates accessibility and usability evidence from broader conformance claims](./research.md#run-and-evidence).

Node’s built-in test runner exercises only pure JavaScript `DemoSnapshotV1`, question-slice, projection, selection, and inspector models. Python unittest exercises source-binding, canonical-path, HTTP method, allowlist, pre-bind, and result-serialization behavior. Neither suite drives a real DOM or browser, and no Python or Node pure-model result may stand in for rendered-browser evidence.

Required automated acceptance checks:

1. all nine pinned binding values match before port bind;
2. all four node IDs and three edge IDs are present once, endpoints resolve, and every graph ID joins exactly once to provenance;
3. `DemoSnapshotV1` has one stable output digest, explicit feature namespaces, and candidate/none posture only;
4. the full core is 4/3 and the induced question slice is 2/1 with exactly the declared IDs;
5. pure graph, outline, and table projection models expose equal stable-ID sets for the active slice and preserve selection-state transitions across lens changes;
6. the pure provenance-inspector model resolves nodes and relations without renderer parsing;
7. a sidecar-only synthetic two-feature snapshot with a cross-feature endpoint passes `DemoSnapshotV1Guard` but is absent from served runtime data and evidence claims;
8. GET/HEAD on assets and the three fixture routes behave as allowlisted, while unknown routes, traversal, and mutation methods are rejected;
9. two identical inputs produce byte-identical snapshot and projection serializations;
10. the existing IOLM candidate validator may run only as a separately labeled regression check and is not included as proof of the demo binding or any downstream gate.

Required manual browser checks, recorded individually rather than inferred from automation:

- keyboard-only traversal in the rendered DOM from question to relation to provenance inspector and across all three lenses, with visible focus and stable selection;
- visible focus order, focus persistence through lens changes, and no keyboard trap;
- reduced-motion behavior with transitions and viewport animation absent while coordinates, focus, and selection remain intact;
- rendered DOM parity for the core and question-slice ID/count sets across graph, outline, and table;
- visual text/shape sufficiency without color for posture, relation direction/class, selection, validation state, and failure screens.

No pure-model assertion, automated DOM assertion, screenshot, or library accessibility feature may mark these manual checks passed. [Agent 2 defines the keyboard/reduced-motion journey while limiting what it proves](./research.md#run-and-evidence); [Agent 3 explicitly rejects automated accessibility or screenshot review as comprehension evidence](./research.md#forbidden-shortcuts-and-ui-negative-controls).

Executable red controls must deliberately produce blocked screens and nonzero `--check` status for at least:

| Code | Injected failure | Required result |
|---|---|---|
| `BIND_GRAPH_HASH_MISMATCH` | mutate graph bytes | block before port bind |
| `BIND_MANIFEST_HASH_MISMATCH` | mutate manifest bytes | block before port bind |
| `BIND_RECEIPT_HASH_MISMATCH` | mutate receipt bytes | block before port bind |
| `BIND_SOURCE_SET_MISMATCH` | change source-set digest | block |
| `BIND_PROFILE_MISMATCH` | change profile ID/version or profile digest | block |
| `BIND_GENERATOR_MISMATCH` | change generator ID/version | block |
| `BIND_REGISTRY_MISMATCH` | change kinds or relationships digest | block |
| `MANIFEST_JOIN_MISSING` | remove one graph record’s provenance | block |
| `MANIFEST_JOIN_AMBIGUOUS` | duplicate one stable-ID provenance record | block |
| `EDGE_ENDPOINT_UNRESOLVED` | replace one endpoint ID | block |
| `SNAPSHOT_POSTURE_FORBIDDEN` | set `authoritative` outside an authoritative successor | block |
| `SNAPSHOT_AUTHORITY_EFFECT_FORBIDDEN` | set an effect other than `none` | block |
| `SNAPSHOT_FEATURE_NAMESPACE_MISSING` | omit a node/endpoint feature namespace | block |
| `QUESTION_SLICE_PARITY_MISMATCH` | omit or add an ID in one lens | block the lens set |
| `SELECTION_ID_UNRESOLVED` | request an absent stable ID | show a typed blocked selection state; never silently choose another |
| `HTTP_METHOD_NOT_ALLOWED` | POST/PUT/PATCH/DELETE | 405, no state change |
| `HTTP_ROUTE_NOT_ALLOWLISTED` | arbitrary repo path or traversal | 404, no bytes disclosed |
| `BIND_PATH_SYMLINKED` | place a symlink in any fixture path component | block before reading or serving bytes |
| `BIND_PATH_OUTSIDE_REPO_ROOT` | escape the explicit repo root | block before reading or serving bytes |
| `BIND_PATH_NOT_CANONICAL_ALLOWLIST` | use any path other than the three literal canonical paths | block before reading or serving bytes |

The failure screen must retain the posture banner, typed code, failed binding or contract field, expected/actual digest when safe, owner route, and recovery instruction. It must never fall back to stale data. [Agent 3 requires hard failure on missing identity/provenance/bindings and forbids silent fallback](./research.md#forbidden-shortcuts-and-ui-negative-controls); [Agent 1 requires exact imported identity and provenance preservation](./research.md#c-authoritative-rebind).

# Current and later routes

## Current: fixture demonstration

`SWU-IOLM-00C-UI-A` binds the current expected Key-and-Door bundle and may close only a “runnable local fixture demonstration” claim. It does not emit a DomainSpec consumer receipt or candidate build receipt. The older IOLM candidate contract remains a compatibility boundary and regression suite, not runtime truth. [Agent 1 distinguishes the checked-in fixture from a bound candidate build](./research.md#a-fixture-backed-demonstration-available-now); [Agent 2 forbids a consumer receipt from this demo](./research.md#component-and-revision-boundary).

## Later: real `00C-B` candidate

The selected upstream route must first deliver actual cross-feature support and its owner-issued passing receipt. Then the unchanged `00C-B` criterion must compile two real feature namespaces, CyberAlchemy Method and Craft, with the literal typed cross-feature witness. Only after that proof may a later UI SWU replace `PinnedMintedFixtureGateway` with a compiler-output gateway. `DemoSnapshotV1Adapter`, guards, selectors, selection semantics, and views remain unchanged only if the real compiler output satisfies their versioned contract; otherwise a sibling adapter/snapshot version and migration evidence are required. Neither the current source fixture nor the synthetic sidecar resolves, bypasses, contradicts, or supplies evidence against `CROSS_FEATURE_UNSUPPORTED`; the sidecar never licenses this swap. [Agent 1 defines the unchanged two-feature successor route](./research.md#b-compiler-backed-candidate-proof); [Agent 3 requires new adapters beside old versions rather than reinterpretation](./research.md#adapter-and-revision-seams).

## Later: authoritative DomainSpec-v2 rebind

An owner-issued `Sg` cannot be connected by changing the gateway alone because `DemoSnapshotV1` is deliberately candidate-only. Authoritative input requires either a posture-neutral successor read-model core with posture-specific envelopes or an explicitly versioned authoritative sibling plus stable-ID migration/quotient evidence. Imported IDs, directions, relations, and provenance must be preserved byte-for-byte or accompanied by an explicit old-to-new map with tombstone/split/merge residue. No frontend toggle may promote posture. [Agent 1 identifies the candidate-only schema gap and required authoritative comparator/migration](./research.md#c-authoritative-rebind); [Agent 3 specifies the authoritative adapter and migration sequence](./research.md#adapter-and-revision-seams).

# Authority limits

The demo implementer owns only package bytes and demo test receipts. DomainSpec-v2 owners retain definitions, relationship signatures, profiles, compiler contracts, graph identity, and FPR state. CAV2 authority and definitions owners retain authority meaning. The private learning-map product owner owns snapshot projection fields and presentation lifecycle but cannot promote DomainSpec or CAV2 semantics. Craft owns continuation state; publication remains outside this slice. File proximity, repeated display, central placement, a green check, or a visually persuasive graph changes none of those owners. [Agent 3 maps these owner boundaries and the authority rule](./research.md#owner-boundaries).

Accordingly, every durable result must repeat the machine-readable `ineligible_for` values `SWU-IOLM-00C-B`, `SWU-IOLM-00C-C`, `G-DSV2-SG`, `CROSS_FEATURE_UNSUPPORTED`, `promotion`, and `publication`, while separately reporting release admission and ontology authority as unsatisfied and unaffected. It must not expose public export or mutation actions, even behind a feature flag. [Agent 3 makes these exclusions explicit](./research.md#non-negotiable-evidence-split).

# Reviewer convergence

The reviewed synthesis converged after one zig-zag revision. Popper’s verdict is **PASS with one binding constraint**: required manual checks left `NOT_RUN` cannot be aggregated into an overall validation `PASS`; the three-file run contract encodes that precedence explicitly. Quine’s verdict is **PASS with no remaining category error**: the carrier is fixture, `DemoSnapshotV1` is the generated read model, reports are demo-evidence, candidate posture is introduced at exactly one adapter boundary, and every compiler/authority/publication gate remains separate. The resulting limits match Agent 2’s narrow run claim and Agent 3’s typed validation and evidence boundaries. [Agent 2: run claim limits](./research.md#run-and-evidence); [Agent 3: vocabulary and validation semantics](./research.md#minimum-visible-vocabulary).

# Next governed route

Route `invoke:refresh:proposal-only` against the IOLM work pack. The proposal must add exactly `SWU-IOLM-00C-UI-A` and `CTX-CAV2-IOLM-WORKABLE-EXAMPLE`, encode the sole dependency on passed `00C-A`, freeze the write scope, canonical paths, versioned binding contract, and pinned values in this finding, name the three-file result and manual-check aggregation rule, and carry the complete `ineligible_for` fence including `CROSS_FEATURE_UNSUPPORTED`. Stop after the proposal for exact owner approval; only an approved/applied refresh authorizes Context Builder plus one bounded Task Session. [Agent 2 supplies the proposal-only sequence](./research.md#finding); [Agent 3 supplies the Craft and evidence constraints](./research.md#non-negotiable-evidence-split).

# Connections

| Target | Relation | Description |
|---|---|---|
| [research.md](./research.md) | `derives-from` | Reciprocal of the `research.md` `derives` edge: this findings artifact synthesizes the three explorer returns, reconciles their carrier/runtime disagreement, and incorporates the reviewed zig-zag constraint. |

# Dispatch closeout

**Status: RESOLVED.** Final approver **Bourbaki, Nicolas** returned **ACCEPT** after the single authorized writer revision. Reviewers **Popper** and **Quine** returned **PASS** after one synthesis zig-zag. Counted agents: **8** total (**3 explorers, 1 synthesizer, 2 skeptics, 1 writer, 1 auditor**); helpers: **0**; `loops_used`: **1**. No implementation, browser run, accessibility check, SWU apply, or authority claim was performed.

# Open Questions

- **OQ-1 (BLOCKER for implementation)** — Will the IOLM owner approve and apply the exact proposal-only addition of `SWU-IOLM-00C-UI-A` and `CTX-CAV2-IOLM-WORKABLE-EXAMPLE` without changing Option 1 or `00C-B`? Recommendation: approve only if the pinned bindings, sole dependency on `00C-A`, write boundary, and machine exclusions are present verbatim; otherwise return the proposal for correction. Owner: `CTX-CAV2-IOLM` owner.
- **OQ-2** — Which concrete people and assistive-technology/browser pairings will execute the keyboard and reduced-motion checks? Recommendation: name them in the approved SWU before Task Session close and keep the overall result `NOT_RUN` until both manual records exist. Owner: `SWU-IOLM-00C-UI-A` task owner.
- **OQ-3** — When should the 2026-07-22 React Flow/ELK research be reconsidered? Recommendation: treat it as research-only and unverified against the future implementation environment; defer compatibility evaluation until a measured graph-size or interaction requirement exceeds the native SVG/table slice, then open a separate dependency and accessibility decision rather than expanding this SWU. Owner: private learning-map product owner.
- **OQ-4** — Which versioned contract will admit an eventual owner-issued authoritative `Sg`? Recommendation: before any authoritative rebind, choose either a posture-neutral read-model successor or an explicit authoritative sibling and require migration/quotient evidence; do not reuse `DemoSnapshotV1` by gateway substitution. Owner: DomainSpec-v2 authority owner.
- **OQ-5** — What exact receipt will authorize replacing the fixture gateway with real `00C-B` output? Recommendation: require the existing upstream cross-feature-support receipt plus the unchanged two-feature `00C-B` acceptance evidence, then create a later UI SWU whose only presumed seam is the gateway. Owner: `SWU-IOLM-00C-B` owner.
