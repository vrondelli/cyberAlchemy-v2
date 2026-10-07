# D0b: private pinned Session append admission checkpoint

Status: **candidate implementation evidence**, 2026-10-04. Route:
`CA2-ROUTE-IMPLEMENT`. Authority effect: none. The owner selected the
private-patch-first route. No live ARE/DSH Web profile was activated.

## Built and tested

The repo-owned [applicator](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/scripts/apply-private-dsh-session-patch.mjs)
patches the nested `@deepseek-ai/dsh-session@0.1.5-rc.3` in the exact
`@deepseek-ai/dsh@0.1.5-rc.2` graph. It requires lockfile SHA-256
`5dfa52f27a953ff9d80c96fcea87d204854d984923cbf0934733ab0b58da6896`,
checks original source digests, preflights both target files before writes,
and rejects unknown drift. The generated `node_modules` edits are not
canonical. `npm ci` removes them; `npm run patch:dsh` reapplies them, while
`pretest` and `precanary` require `--check` to pass.

The candidate runtime adds a one-shot, per-Session
`installAppendAdmissionGuardV1` callback. On every `Session.append`, it sees
the validated, frozen event after observer collection but before log push,
event publication, or native Agent inbox projection. Only synchronous exact
`true` admits. False, a Promise, or a thrown error denies before commit;
reentrant append also fails. Unqualified Sessions retain native behavior.
The matching declaration adds the typed callback. This API is private to the
pinned patch, not a documented DSH release contract.

The [detached tests](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/private-dsh-session-patch.test.mjs)
cover integrity verification, unqualified behavior, direct inbox and
`user/message` denial, a single-use example rejecting replay, async denial,
and reentrancy. The [disposable Web fixture](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/web-session-append-admission-probe.test.mjs)
loads the patch under a temporary `DSH_HOME`, authenticates on loopback,
installs a guard synchronously at `session/created`, and proves direct
`agent.session.append` writes and normal Web `session/prompt` are rejected
before native inbox insertion. It uses the read-only profile and never sends
a model request. The fixture is diagnostic, not a packaged ARE owner.

Validation: focused detached tests **5/5**, focused Web test **1/1**,
adapter `npm test` **35/35**, `npm run canary` **ok**, with zero tools
advertised. Tested on Node 26.8.1. These are local working-tree results,
not a release candidate or deployed client.

## Claim ceiling and remaining dependencies

This closes the observed direct-Session bypass for a *selected, guarded*
Session in the disposable Web test. It does not close D0b or deliver full Web
control. No ARE decision is yet prepared/consumed through this callback. The
single-use permit test is an in-memory example, not an authenticated ARE
permit. The future owner must install the exact guard on every created,
resumed and child Session before a producer can write; bind it to the real
Host principal, Session and Agent generation; and fail readiness if the
guard is missing or another caller installed one first. User/plugin code in
the same JavaScript process is not isolated by this hook: arbitrary trusted-
graph escape or monkeypatching is not covered. Effective Host/preset graph
locking, dynamic-load rejection, producer migration, idempotency,
append/ACK crash reconciliation, and P1/P2/P3/D1 remain open.

## Open Questions

- Which supported lifecycle point owns installation and verifies it across
  resume, Agent replacement and child creation?
- How will a prepared ARE decision become a single-use exact-event permit
  without blocking the synchronous append callback or trusting caller labels?
- Who owns private-patch rebases, and what event triggers migration to a
  maintainer-supported DSH release?
