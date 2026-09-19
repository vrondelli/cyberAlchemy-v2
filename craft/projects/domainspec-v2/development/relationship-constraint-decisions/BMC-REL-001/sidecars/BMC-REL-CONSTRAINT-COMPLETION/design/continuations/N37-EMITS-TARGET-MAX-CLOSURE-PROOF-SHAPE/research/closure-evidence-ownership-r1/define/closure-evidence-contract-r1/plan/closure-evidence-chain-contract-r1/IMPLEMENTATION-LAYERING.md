# Implementation layering: closure-evidence chain contract

Status: execution-candidate; exact acceptance unapproved.

| Layer | Decision question | Minimum unit | Included | Deferred | Exit evidence | Promotion |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | Is destination, identity, compatibility, registry, and lifecycle ownership fixed? | Resolved owner prerequisite | EVF family, immutable v1, scoped manifest, owners | Source mutation | `BMC-REL-PLAN-01` owner receipt | Enter proof-only Plan frontier |
| L1 | Can each candidate schema be materialized without semantic inflation? | One schema plus its fixtures per SWU | N43 envelope, then N44 receipt | Evaluator implementation and packet/profile admission | Task Session terminal receipt plus Invoke closeout | Select the next dependency-ready SWU |
| L2 | Is the family discoverable and does the coordinated chain fail closed? | Manifest, then chain validator | Exact inventory, digest bindings, precedence, hostile probes | Runtime integration and currentness policy | Typed terminal and closeout receipts | Seek terminal Work Pack closeout |
| L3 | Is packaging or release credible? | Not planned | None | Publication, release, deployment | None | Defer |

L1 is the first execution layer. The route is still unselected and unapproved. Every layer preserves `authority_effect: none`, and no layer changes the canonical relationship catalogue or BMC packet.
