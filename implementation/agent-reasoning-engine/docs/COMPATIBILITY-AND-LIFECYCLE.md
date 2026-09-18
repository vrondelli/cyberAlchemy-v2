# Compatibility and lifecycle

Compatibility in ARE has several independent layers. A runtime can parse a
provider response while the provider and model remain unqualified for a
benchmark. A passing candidate can also remain unapproved for publication or
deployment.

## Current support matrix

The detailed current reader/writer inventory is
[`compatibility-matrix.json`](compatibility-matrix.json), with verification in
[`compatibility-matrix-receipt.json`](compatibility-matrix-receipt.json). It
covers seven compatibility categories and deliberately contains no
predecessor/successor pair.

| Layer | Candidate 018 posture | Evidence boundary |
| --- | --- | --- |
| Product lifecycle | Stability candidate, private | Frozen closure and release verification |
| Node.js | Exactly `26.8.1` | `product.json` and `package.json` |
| Operating environment | Linux or WSL development workspace | Local tests and Unix process behavior |
| Gateway transport | Local Unix socket. JSON-RPC 2.0 over JSON lines | Gateway suites and loopback canaries |
| Default host backend | Codex app-server, observed `codex-cli 0.153.0-alpha.5` | Pinned protocol observation and projection |
| Other agents | Validated JSON-lines process adapter contract | Adapter contract tests. Host translation required |
| Model transports | OpenAI-compatible, native OpenAI, Anthropic, and Google adapters reach the proposal boundary | Deterministic provider conformance. No general live qualification |
| Semantic evaluation | Implemented, default disabled | Definition-readiness domain tests |
| Interaction learning | Prototype, default off | Local lifecycle tests and bounded benchmark |
| Effect execution | No default authority | Host approval and sandbox remain external boundaries |
| Durable continuity | File-backed gateway session and Reasoning State paths | Single-writer local profile |
| Network service | Unsupported | No hosted or multi-tenant boundary |

## Model and context-window qualification

Transport compatibility does not establish useful task performance. Model,
provider, effort mode, context window, prompt/runtime profile, task family, and
scorer version form one qualification identity.

| Research target | Current result |
| --- | --- |
| GLM 5.3 Flash 8K chapter | Wrapped with bounded claims and retained evidence |
| GLM 5.3 Flash 10K | Not qualified by the current reviewed decision |
| GLM 5.3 Flash 12K | Blocked until a 10K successor passes development and independent confirmation |
| Other models or domains | No transfer claim without their own evaluation |

The [Research program](RESEARCH-PROGRAM.md) owns current benchmark interpretation.
These rows do not change the product's provider adapter surface.

## Lifecycle states

~~~mermaid
flowchart LR
    A[Prototype or research candidate] --> B[Tested product candidate]
    B --> C[Owner product review]
    C --> D[Accepted release unit]
    D --> E[Published artifact]
    E --> F[Activated deployment]
~~~

Each transition has a separate owner and evidence requirement. Candidate 018 is
at the tested product-candidate stage. Its records explicitly leave product
approval, commit, tag, push, publication, activation, and deployment separate.

## Change compatibility

| Change | Required response |
| --- | --- |
| Documentation explanation only | Run documentation verification. Do not change product evidence claims |
| Package behavior or tested source bytes | Run focused and complete tests. Freeze a successor candidate |
| Required component, integration, or entrypoint | Update `product.json`, test-plan ownership, and successor evidence |
| Record schema or profile semantics | Update consumers, negative tests, migration decision, and successor evidence |
| Host protocol observation | Refresh the pinned observation and selected projection before claiming compatibility |
| Provider/model/context window | Run a bounded qualification. Do not infer transfer from transport compatibility |
| Storage representation | Define backup, recovery, compatibility, and rollback before changing persisted data |
| Public artifact or deployment | Select separate publication and operational routes and owners |

## Version interpretation

`0.10.0-self-contained-candidate.7` identifies the current private product
candidate. It is not a public semantic-versioning commitment. The immutable
Candidate 018 records identify exact bytes more strongly than the human-readable
version string.

The selected [release policy](release-policy.json) begins accepted successor
versions at `0.10.0-rc.1` under Semantic Versioning and reserves
`v0.10.0-rc.1` for that separately frozen successor. Candidate 018 keeps its
existing identity and remains a private baseline.

Historical candidate evidence is never rewritten. A successor can supersede a
candidate for future use while retaining prior results as history and
counterevidence.

## Known unsupported assumptions

- Candidate 018 has a self-contained source closure, but no accepted tag,
  trusted signature, or public delivery channel exists yet.
- Windows-native process, socket, and permission behavior is unqualified.
- A process adapter does not make an arbitrary agent protocol compatible.
- Provider cache use cannot be inferred when telemetry is absent.
- Passing a lower or higher context-window experiment does not qualify another
  window automatically.
- Local contract tests do not establish hostile multi-tenant security.

## Open Questions

- Which minimal platform matrix is required before a public artifact exists?
- What compatibility promise should begin with the first externally consumed
  SDK or gateway protocol?
- Should host protocol observations have an explicit supported-version range or
  remain exact-version evidence?
