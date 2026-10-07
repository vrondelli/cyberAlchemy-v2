# ARE current implementation surfaces

**Status:** working-tree observation, not a product declaration or candidate receipt.  
**Observed:** 2026-09-25.  
**Method:** compared [`product.json`](../product.json) with immediate directories
under `packages/`, `benchmarks/`, and `apps/`, then inspected
[`are.mjs closure --json`](../bin/are.mjs) for default-closure membership.
The observed default closure had 548 files. Its contents can change with the
unfrozen tree; the counts below are a snapshot, not a release assertion.

## Declared product units

The profile declares **19 components**: 13 required, default-enabled Core
components; four optional, default-disabled extensions; and two disabled
research components. It also declares **two integrations**: one required Core
integration and one optional extension. The generated
[capability matrix](../docs/generated/CAPABILITY-MATRIX.md) projects these
profile fields, not every repository surface.

| Component | Declared classification | Default closure | Source |
| --- | --- | --- | --- |
| `module-port` | Core, required | Included | [`packages/module-port`](../packages/module-port/) |
| `intent-route-resolver` | Core, required | Included | [`packages/intent-route-resolver`](../packages/intent-route-resolver/) |
| `request-decision-router` | Core, required | Included | [`packages/request-decision-router`](../packages/request-decision-router/) |
| `request-intent-runtime` | Core, required | Included | [`packages/request-intent-runtime`](../packages/request-intent-runtime/) |
| `context-basis-runtime` | Core, required | Included | [`packages/context-basis-runtime`](../packages/context-basis-runtime/) |
| `reasoning-state-runtime` | Core, required | Included | [`packages/reasoning-state-runtime`](../packages/reasoning-state-runtime/) |
| `reasoning-policy-runtime` | Core, required | Included | [`packages/reasoning-policy-runtime`](../packages/reasoning-policy-runtime/) |
| `runtime-journal` | Core, required | Included | [`packages/runtime-journal`](../packages/runtime-journal/) |
| `semantic-input-runtime` | Core, required | Included | [`packages/semantic-input-runtime`](../packages/semantic-input-runtime/) |
| `semantic-judgment-evaluator` | Core, required | Included | [`packages/semantic-judgment-evaluator`](../packages/semantic-judgment-evaluator/) |
| `module-port-distribution-envelope` | Core, required | Included | [`packages/module-port-distribution-envelope`](../packages/module-port-distribution-envelope/) |
| `codex-app-server-wrapper` | Core, required | Included | [`packages/codex-app-server-wrapper`](../packages/codex-app-server-wrapper/) |
| `conversation-runtime` | Core, required | Included | [`packages/conversation-runtime`](../packages/conversation-runtime/) |
| `aci-binding-contract` | Extension, optional | Excluded | [`packages/aci-binding-contract`](../packages/aci-binding-contract/) |
| `dsh-gateway-backend-adapter` | Extension, optional, experimental | Excluded | [`packages/dsh-gateway-backend-adapter`](../packages/dsh-gateway-backend-adapter/) |
| `are-mcp-server` | Extension, optional | Excluded | [`packages/are-mcp-server`](../packages/are-mcp-server/) |
| `coding-agent-runtime` | Extension, optional, experimental | Excluded | [`packages/coding-agent-runtime`](../packages/coding-agent-runtime/) |
| `evolution-runtime` | Research, development-only | Excluded | [`packages/evolution-runtime`](../packages/evolution-runtime/) |
| `real-reasoning-benchmark` | Research, development-only | Excluded | [`benchmarks/real-reasoning-v1`](../benchmarks/real-reasoning-v1/) |

| Integration | Declared classification | Default selection | Source |
| --- | --- | --- | --- |
| `are-product-package` | Core, required | Selected | [`agent-reasoning-engine`](../../../agent-reasoning-engine/) |
| `codex-desktop-bridge` | Extension, optional | Not selected | [`codex-integration`](../../../development/agent-reasoning-engine/codex-integration/) |

## Present but not declared as separate product units

These rows do **not** imply that each item should become a component. They
identify the distinction between implementation presence and product profile
selection.

| Surface | Observation | Default closure | Source |
| --- | --- | --- | --- |
| Benchmark scheduler package | A package directory with scheduler and report code, absent from `product.json`. | Excluded | [`packages/benchmark-scheduler`](../packages/benchmark-scheduler/README.md) |
| Rust Module Port governance binding | A package directory absent from `product.json`. Its source is excluded, but two Linux x64 artifact files enter through the declared distribution envelope. Its own receipt says binding admission and enforcement are false. | Partial: two artifact files | [`binding README`](../packages/module-port-governance-binding-rust/README.md), [`distribution envelope`](../packages/module-port-distribution-envelope/) |
| Module Port governance cutover | A package directory with implementation and tests, absent from `product.json`; [`src/product.mjs`](../src/product.mjs) retains a conditional packaging path if a component with this ID is declared. That conditional does not select it now. | Excluded | [`cutover README`](../packages/module-port-governance-cutover/README.md) |
| ARE Companion desktop app | Separate Tauri Linux/Windows floating-icon and read-only dashboard prototype; no app/component/integration entry in `product.json`. Its installer may bundle ARE, but the app source is not part of ARE's default closure. | Excluded | [`apps/desktop-companion`](../apps/desktop-companion/README.md) |
| Local operations module | Private state-root diagnostics, child-environment projection, logical backup and restore. Included through top-level `src` source selection, not a separate component or top-level CLI command. | Included | [`src/local-operations.mjs`](../src/local-operations.mjs), [`tests`](../test/local-operations.test.mjs) |
| Codex wrapper browser client | HTML/CSS/JS client and Windows launcher live inside the declared wrapper package; no separate integration declaration. This client can interact with threads and approvals and must not be conflated with the read-only Companion. | Included | [`client`](../packages/codex-app-server-wrapper/client/), [`launcher`](../packages/codex-app-server-wrapper/bin/are-codex-windows-client.mjs) |
| Interaction launcher | The wrapper's launcher is in the closure and dispatched by [`are.mjs`](../bin/are.mjs), but is not individually named in `product.json` `entrypoints`. | Included | [`are-interaction.mjs`](../packages/codex-app-server-wrapper/bin/are-interaction.mjs) |
| Other research benchmark trees | ContextBench, external-context, GLM episodes, and GLM fitting have directories but no component entries. | Excluded | [`contextbench-v1`](../benchmarks/contextbench-v1/), [`external-context-v1`](../benchmarks/external-context-v1/), [`glm-episodes-v1`](../benchmarks/glm-episodes-v1/), [`glm-fitting-v1`](../benchmarks/glm-fitting-v1/) |

The immediate-directory reconciliation is exact for this observation: 21
directories under `packages/` versus 18 component paths there; the three
unmatched package directories are the scheduler, Rust binding, and cutover.
Of five immediate benchmark directories, only `real-reasoning-v1` is declared.
The desktop app is under `apps/`, outside both sets.

## Front-end and evolution boundary

The [`evolution-runtime`](../packages/evolution-runtime/) is implemented but
declared research-only and default-disabled. The
[`Companion`](../apps/desktop-companion/README.md) currently projects doctor
health; it does not show an Evolution Engine view, per-active-thread reasoning
state, or a historical decision feed. Those are front-end/product projection
gaps, not evidence that the underlying runtime or data is absent. A later
read-only UI contract must define bounded, authorized data access before these
views can be claimed as delivered.

## Open Questions

- Does the owner want the three unmatched packages and desktop app recorded in
  a future product profile, or explicitly marked development/research-only?
- What exact read projection and privacy boundary should expose evolution,
  per-thread reasoning state, and decisions to Companion?
- Should internal `src` and wrapper entrypoints get their own generated
  discoverability index without inflating the component count?
