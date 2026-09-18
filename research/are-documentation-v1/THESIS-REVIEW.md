# Independent review of thesis inventory

Status: candidate research review, 2026-09-16. Reviewer: coverage proposer acting as independent Pair 1 reviewer; no authorship of THESIS-INVENTORY.md. No runtime changes or tests performed. Reviewed [THESIS-INVENTORY.md](THESIS-INVENTORY.md) against current source files and online documentation guidance. This is a documentation-design review, not product admission.

## Verdict

Accept the finite meaning inventory with the corrections below. Its 164-occurrence denominator is accurate and all entries retain their source and node kind. It correctly distinguishes one literal product thesis from eighteen explanatory decompositions and does not turn candidate capabilities into implemented functions. It does not yet establish an exhaustive runtime/API inventory or finished user documentation, and explicitly says so.

## Independent checks

A fresh read of the three source registries and a parse of appendix rows yielded:

| Registry | Source nodes | Appendix occurrences | Missing or extra occurrences | Kind mismatches |
|---|---:|---:|---:|---:|
| [Core](../../agent-reasoning-engine/business-ontology.json) | 136 | 136 | 0 | 0 |
| [Interaction scaffold](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | 11 | 11 | 0 | 0 |
| [Framings](../../agent-reasoning-engine/framings/nodes.json) | 17 | 17 | 0 | 0 |
| Total | 164 | 164 | 0 | 0 |

Comparison used the multiset of `(source path, node ID)` and each row's node kind, so repeated IDs in separate source registries remain separate occurrences. Every relative Markdown source link in the reviewed document resolved to an existing file. This checks referential coverage, not stored evidence-digest freshness or semantic truth.

The literal thesis quote matches `product_thesis` in [product.json](../../agent-reasoning-engine/product.json). Its two capability references match the inventory's distinction between the main and interaction capabilities. The [framing declaration](../../agent-reasoning-engine/framings/product-capability.json) is explicitly `not-implemented`, `not-adopted` and `not_evaluable`; its product binding remains CyberAlchemy and parent capability points to ARE's capability. Preserving that ownership difference is correct.

The T15 figures match the [8K release README](../../agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/README.md): +13.15 percentage points macro Span-F1, 6/8 to 8/8 valid selections and −3,568 logical tokens on eight independent confirmation pairs. The full acceptance contract is explicitly not cleared. This reviewer verified the reported numbers against that document, not by replaying the original model runs.

## Findings requiring reconciliation

| ID | Severity | Finding | Required correction |
|---|---|---|---|
| TR-01 | Low | Coverage paragraph assigns functionality to Pair 2 and diagrams to Pair 3, while the actual assigned ownership is Pair 3 coverage and Pair 2 architecture. | Correct pair numbers or link artifact names instead of numbered ownership. |
| TR-02 | Medium | T15 presents precise measured results but links the lighthouse as its source of meaning; the direct release evidence is not linked in that row. | Keep the lighthouse for the objective and add the exact 8K release README plus the confirmation result/validation entry as measurement evidence. Readers must reach the supporting record without guessing. |
| TR-03 | Low | The appendix introduction says “Source registries own exact definitions.” Earlier text correctly describes the sources registry as a provenance map and canonical definitions as owning repository terms. The later wording can erase that distinction. | Say “Each linked owning source preserves its exact candidate meaning; canonical repository definitions retain authority.” Do not assign definition authority to a generic selector registry. |
| TR-04 | Medium, next-stage acceptance | Every node receives placement by kind, which proves inventory coverage but not individualized explanation, runtime binding or a thesis-to-feature trace. | Before calling documentation complete, join T01–T18 to feature IDs and the 164 occurrences, and provide per-page examples/counterexamples and exact schema bindings where available. This is an accepted scan limit, not a reason to fabricate missing APIs now. |

## Online lens assessment

I independently consulted [Diátaxis](https://diataxis.fr/) and [arc42's overview](https://arc42.org/overview/) on 2026-09-16. The proposed distinction among tutorial, how-to, reference and explanation is faithful to Diátaxis. Keeping roadmap designs separate from runnable tutorials protects the reader from following an unavailable path. Each eventual tutorial still needs a concrete learning outcome and reproducible exercise; listing a planned tutorial title is not that exercise.

arc42 distinguishes context/scope, building blocks, runtime, deployment, quality scenarios, decisions, risks and glossary. The thesis draft uses these as different views rather than one overloaded graph, which is appropriate. Its three cybernetic loops also separate work control, scoped learning and engine evolution. Require each resulting graph to identify implemented versus proposed edges and link observer/comparator/action-gate nodes to actual feature/evidence owners. A repeating feedback process and an acyclic record of successive experiments are compatible when iteration identities remain distinct.

These are review judgments applying the linked frameworks; neither framework verifies ARE's implementation or endorses its product claims.

## Open Questions

- Which page or machine-readable join will own thesis → feature → definition/source-node → evidence traceability?
- Who resolves candidate product ownership and bridge freshness questions without promoting research prose into authority?
- What fresh source identity and receipt will qualify each eventual runnable tutorial?
