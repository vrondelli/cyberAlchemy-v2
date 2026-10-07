# Complete UI plan review

Status: self-review of the [parent candidate plan](WHOLE-UI-IMPLEMENTATION-PLAN.md),
2026-09-26. No independent reviewer, owner approval, or admitted execution
state is claimed.

## Verdict

The plan now covers all seven UX briefs and has a coherent functional order.
It is **not execution-ready**: each step still needs exact task-local scopes,
owners, tests, and a separately routed implementation request. Live Threads,
Decisions, Adapters, and Evolution also depend on source-owned read projections
or source configuration that the current Companion does not have.

## Review findings

| Finding | Disposition |
| --- | --- |
| Previous roadmap treated Adapters as the whole product. | Corrected: the seven-feature [UX index](ux/README.md) points to one parent plan, and the [adapter work-pack](adapter-observation/WORK-PACK.md) is explicitly a child. |
| The word “reasoning” could be mistaken for hidden model thoughts or for automatic chat-plan memory. | Corrected: Threads shows explicit Reasoning State events/frontiers only. Step 0B now requires typed parent-plan capture and recovery in runtime Reasoning State; it remains unimplemented and needs an owning host integration. The current CLI receipt does not provide it. |
| Several pages risk looking complete with fixture or product-health data. | Plan makes fixture labelling and source/time/freshness rules shared prerequisites; `doctor` PASS cannot color live adapter, thread, decision, or evolution status green. |
| Decisions could show evaluation as execution. | Step 9 requires separate labels for evaluation, authorization request, and independently observed effect; it depends on stable thread identity for per-thread linking. |
| Evolution could be shown as active because the runtime package exists. | Step 6 first shows exact candidate/disabled posture and a configured root; no cycle activation or improvement claim follows from package presence. |
| Security requested late could accidentally allow an unprotected live endpoint. | Full hardening is step 11 before package enablement. Earlier live experiments are private, same-user, explicit, bounded development harnesses; otherwise they remain fixture-only. |
| All pages in one release would create a false completeness claim if source APIs lag. | Each page has an honest not-configured/unavailable state. Functional development can advance independently, while the integrated candidate waits for exact source evidence. |

## Remaining gaps and next handoff

- The root plan is a roadmap, not the task-level work-pack required for
  mutation-capable execution. Split steps 0–2 first, each with exact file
  scope, acceptance tests, and an owner. Do not authorize all steps at once.
- The generated Invoke skill package lacks its linked `plan.md` contract, and
  these UX briefs are candidate design. Available guidance informed this
  roadmap; it is not a formal Invoke pass. Goals validation still blocks
  admission of a repository execution state.
- The strongest first product milestone is seven navigable, truthful pages
  with shared state semantics and a polished orb; source-backed pages follow
  independently. The first live-thread milestone needs a stable, filtered
  Reasoning State projection, not file reads from the renderer. Step 0B is
  required before claiming complete plan continuity, but its missing host
  binding does not block unrelated fixture UI construction.

## Open Questions

- Which host integration owns the required parent-plan Reasoning State record
  and restores it at task start? Which owner approves its bounded content?
- What exact active-thread and decision-history retention/privacy contract is
  acceptable for Companion?
