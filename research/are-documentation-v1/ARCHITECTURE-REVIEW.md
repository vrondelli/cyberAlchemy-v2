# Architecture proposal — independent cross-review

Status: candidate documentation review, 2026-09-16. Reviewer: thesis proposer acting as independent reviewer of architecture proposer's work. This is cross-review under the environment's concurrent-agent limit; the reviewer did not author ARCHITECTURE.md. Authority effect: none.

## Disposition

**Accept inventory coverage; revise three diagram/presentation details before treating the architecture chapter as reviewed documentation.** No runtime, release or compatibility certification is performed here. Reviewed [ARCHITECTURE.md](ARCHITECTURE.md) as present on 2026-09-16; no edits to that proposal were made by this reviewer.

## Independent external lens

The official [C4 model](https://c4model.com/) distinguishes system, container, component and code abstractions, with dynamic and deployment views supporting them. The proposal correctly separates logical layers from deployment units. For ARE this means eight responsibility layers cannot imply eight services, and a component table cannot substitute for an operator's process diagram.

The [Kubernetes controller documentation](https://kubernetes.io/docs/concepts/architecture/controller/) explains desired/current state, observation, and requested changes, including controllers that ask other components to act. That is a useful bounded analogy for ARE policy versus host execution. ARE's finite tasks, uncertain semantic observations, effect permissions and unproven convergence differ from Kubernetes reconciliation. A circular flowchart alone does not establish closed-loop control or improved outcomes.

## Coverage checks

| Check | Result | Evidence / limitation |
|---|---|---|
| Declared components | 17/17 represented | Compared every component ID and path in [product.json](../../implementation/agent-reasoning-engine/product.json) with the component table |
| Declared integrations | 6/6 represented by source path | All six appear; five display labels omit exact integration IDs, a minor machine-checkability improvement |
| Extra packages | 2/2 represented | Conversation runtime and Rust binding both distinguished from declared composition |
| Additional dependency gap | Represented | Semantic-contract runtime explicitly listed as a dependency requiring closure verification |
| Gateway versus model adapter | Correct | Codex session/lifecycle protocol explicitly separated from OpenAI-compatible/native model transports and proposed neutral-host SDK |
| Current versus target | Correct at document level | Separate target feedback graph, current wiring, and finite research DAG; disabled learning/provider seams stated |
| Rust flags | Corrected prior audit | [cutover index](../../implementation/agent-reasoning-engine/packages/module-port-governance-cutover/index.mjs) intentionally accepts a Rust receipt whose admission/enforcement flags are false, independently checks selected decision records, and can return `enforcement_active:true` with `effect_authorized:false` |
| Reference links | Pass | Every Markdown local link resolves in the current checkout; target page names are correctly labelled proposed |
| Page usefulness | Strong with bounded omissions | Pages promise success/failure traces, contracts, profiles, evidence, owners and Open Questions; actual runnable tutorials still need qualification |
| Runtime verification | Not rerun | This is source/document review; historic suite scores and closure claims are not recertified |

## Findings and concrete corrections

### AR-01 — Medium: target feedback graph hides the comparison and terminal decision

The reference objective and estimated state both enter the controller, but the actual comparison is implicit. The graph has no explicit completed/blocked/unknown exit. Readers could mistake the circle for automatic persistence until convergence, especially given this project's past endless experiment loops.

Correction: show a comparator/assessment node with desired outcome and attributable observed evidence as distinct inputs. Label its outputs `supported`, `contradicted`, and `unknown`, then a bounded disposition `continue / ask / blocked / complete`. Feed only a permitted continuation into action selection. A semantic comparator can remain an optional candidate; do not imply it is always enabled. Keep a textual statement that missing observation cannot count as success.

Acceptance: a reader can point to what is compared, what observation supports it, what happens when evidence is missing, and where the loop stops. The graph should preserve the source [learning model](../../agent-reasoning-engine/REASONING-AND-LEARNING.md)'s outcome/continuation distinctions.

### AR-02 — Medium: policy recommendation arrow bypasses the upgrade boundary

The target graph draws `Reviewed policy variant recommendation → Controller`. Although the text calls it a recommendation and elsewhere preserves nonauthorization, this edge depicts the recommendation entering serving policy without the explicit controlled-upgrade boundary. A target diagram should be especially clear about an as-yet-unwired autonomous path.

Correction: insert `Separate selection/activation check` between recommendation and policy adoption, with a reject/retain-current path and rollback/canary evidence feedback. Distinguish recording the recommendation from using an activated policy. Mark the activation path optional/proposed unless a specific current binding is named.

Acceptance: every path that changes serving policy passes the named selection boundary; experimental fitness alone has no direct actuator path. This follows [main capability](../../agent-reasoning-engine/product-capability.json)'s recommend-only default and reversible controlled-local upgrade limits.

### AR-03 — Low: runtime and deployment deliverables are promised but not exemplified

The proposal correctly describes C4 process/deployment views but its three examples are logical feedback/current dataflow/research DAG views. There is no process-boundary example showing where the CLI, local Unix socket, wrapper, Codex app-server, model endpoint and persisted files live. The current gateway path is useful but could be mistaken for an executable topology.

Correction: in the writing backlog add an explicitly scoped local deployment/process diagram, including executable ownership, IPC/network boundaries, file ownership, supported platform, and how an unavailable/mismatched Codex binary appears. Do not use a C4 container label to imply a Docker container. This deliverable can remain planned; the current proposal should call out the missing example.

Acceptance: an operator can identify which process they start, where state is stored, which external process/version is required, and which connection is local versus provider-facing.

### AR-04 — Low: improve integration identity traceability

The six source paths are complete, but five human labels differ from the integration IDs. Add the exact `integration_id` next to each label so a future coverage checker can compare composition to docs without inferring aliases. Preserve readable titles for navigation.

## Claims specifically upheld

- The Rust receipt's false flags must not be generalized into a claim that all governance cutover enforcement is inactive. The proposal gets this distinction right.
- A model provider adapter is not a host gateway or universal agent protocol. The proposal gets this distinction right.
- The reasoning-state ledger and bounded runtime journal have different persistence roles. The proposal distinguishes them.
- Logging an observation alone is not learning, and a research DAG is not itself a continuously running improvement service. The proposal preserves these limits.
- Actual product meaning and default profile behavior remain separate from target design. No proposal here should automatically enable learning.

## Open Questions

- Which current operation owns the comparator and completion decision in the first supported end-to-end example, and which portions are optional semantic providers?
- Which exact controlled-upgrade binding should the target feedback illustration cite when it becomes a runnable example?
- What process/platform/protocol combination will be the first supported deployment diagram?
- Should diagram/source/status coverage be machine-checked with exact registry IDs before documentation publication?
