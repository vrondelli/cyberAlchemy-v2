# Open Residue

| ID | Question | Why unresolved | Required owner/evidence | Blocks |
| --- | --- | --- | --- | --- |
| `R-01` | Is Rule-before-guarded-mutation an admitted portable Operation invariant or still a profile candidate? | August findings say portable but its terminal audit is BLOCK; accepted July work calls direct leaf/order implementation proposed. | semantic/definitions owner with exact canonical selectors | portable Operation obligation set |
| `R-02` | Must PersistenceBinding contain an `interface_ref`, or may exact Entity/Operation/Query roles be sufficient? | Older research forces repository port into Interface; user direction rejects code-level ports; Revision 2 calls the binding neutral. | system-integration contract owner plus non-collapse fixtures | persistence schema |
| `R-03` | Does durable Workflow state fit PersistenceBinding or need `WorkflowRuntimeBinding`/equivalent? | Current first slice targets logical persistence records but does not name workflow history, checkpoints, timers, or replay. | APE Workflow owner and system-integration owner | durable Workflow mapping |
| `R-04` | What applicability discriminator separates synchronous and durable Workflow profiles? | Applying replay/checkpoint constraints universally would overfit Temporal-like runtimes. | Workflow profile owner; finite positive/negative fixtures | profile resolution |
| `R-05` | What exact roles do Scheduler/Timer, task queue, activity/step runner, and workflow store have? | No accepted dependency taxonomy or infrastructure binding owns them. | Workflow runtime research/contract design | durable provider projection |
| `R-06` | When can a Workflow step call a Transporter directly versus invoking an Operation that transports? | Responsibility and failure ownership differ; current source does not decide. | Workflow/application profile owner with hostile traces | messaging placement rule |
| `R-07` | What is the exact TransportBinding/DeliveryGuaranteeBinding schema? | Explicitly deferred in Revision 2. | system-integration Refine route after persistence slice | queue/broker enforcement |
| `R-08` | Which TypeScript module boundaries and suffixes are selected? | Poker Team is precedent only; naming/import policy has no admitted owner. | implementation-profile owner | static diagnostics/severity |
| `R-09` | How are pure Rules and shared calculations detected without over-injecting pure functions? | HOF injection of every helper would add ceremony; dynamic calls complicate observation. | profile owner plus analyzer experiments | SRP/SoC static checks |
| `R-10` | What exact cost/call budgets become correctness obligations? | N+1/complexity warnings are not semantic without declared measures/bounds. | semantic owner plus runtime experiment | algorithmic failure severity |
| `R-11` | How are Workflow version compatibility and in-flight migrations represented? | W4 and Revision 2 do not own durable workflow code/version evolution. | Workflow runtime/profile owner | long-running workflow readiness |
| `R-12` | Should the new work be selected before APE Enum closes? | Current active APE Work Pack has a gated Enum frontier and no next-type selection. | APE progression owner and exact current receipts | execution order only; not research validity |

No residue may be silently answered by a TypeScript naming convention, provider
choice, passing fixture, or research receipt.
