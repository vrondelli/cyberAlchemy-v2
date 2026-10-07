# D0b: ARE-prepared DSH Web prompt permit, candidate slice

Status: **candidate implementation evidence**, 2026-10-04. Route:
`CA2-ROUTE-IMPLEMENT`. Authority effect: none. This is a disposable Host
conformance result, not a qualified or activated Web profile.

## What changed

The [Web prompt permit broker](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/src/web-prompt-permit.mjs)
joins the pinned private Session append guard to a real ARE repository
`route` plus `context` decision. It handles text-only prompts for which both
decisions are direct. An asynchronous preparation creates a request-scoped
in-process permit; the synchronous append guard then checks the exact
Session, current Agent generation, request key, delivery target, user-role
source and text-content digest. A wrong key, content, generation, target,
or off-scope direct append fails before log/inbox commit. The permit is
single-use. A key consumed at native insertion remains quarantined if ACK
delivery fails. A separately supplied Host-binding verifier is mandatory;
the broker does not authenticate the browser itself.

The [disposable Web controller fixture](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/fixtures/web-prompt-permit-probe.mjs)
now installs the guard from the patched `SessionStore.prepare` factory, binds the Agent generation at
`agent/created`, and wraps the pinned `SessionController.prompt` before its
native implementation. It supplies only a synthetic local Host principal;
that is test scaffolding, **not** the P1g Host assertion. The test uses an
ARE-owned [no-tool preset root](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/config/presets/are-read-only/agent.cordis.yml)
with shipped and user preset roots disabled, plus the existing read-only
Host overlay and a loopback model. The stock Web profile remains unchanged.

The live result: an authenticated, correct-Origin Web `session/create` and
`session/prompt` produced one direct ARE route/context preparation, one
native `agent/inbox/spliced`, a native prompt ACK, one loopback model
request with **zero advertised tools**, and native `turn/end`. An
unauthenticated request, foreign Origin, non-routable text prompt, and
duplicate request key were rejected without another model dispatch. The
detached tests cover off-scope direct append, wrong content/key, replay,
Agent replacement during async preparation, missing Host binding, unsupported
image content, wrong steering target, concurrent prompt isolation, and
post-append ACK loss. Focused tests passed **9/9**.
The original adapter suite passed **44/44** and its existing read-only
headless canary passed with zero tools advertised.

## Early-install follow-up

The exact-hash [private DSH patch](../../../../implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/scripts/apply-private-dsh-session-patch.mjs)
now offers a one-shot, opt-in `SessionStore.installAppendAdmissionFactoryV1`.
It synchronously installs the broker's per-Session guard in `prepare` before
the prepared Session is returned to Agent setup, and covers ordinary and
restored Sessions with no inherited events. Nonempty seeds are rejected in
the guarded profile because the pinned constructor adopts them before the
factory can inspect the Session; native resume/fork needs its own validated
seed boundary. Installation after any prior `prepare` fails closed. A
factory that returns asynchronously or omits the per-Session guard also
fails before the Session reaches its caller. The patch accepts the prior
known patched bytes only after digest and reverse-transform verification;
unknown source drift remains an error. The generated `node_modules` copy is
not the durable patch source.

In the disposable Web fixture, a direct user-surface append on a prepared
but unpublished Session and another from an earlier `session/created`
listener both failed before log commit. The ordinary ARE-prepared Web prompt
still reached native ACK, one no-tool loopback model request, and native
`turn/end`. The full adapter suite passed **45/45**; the pinned read-only
canary passed with one provider request and zero tools. This closes the
specific setup-window/listener-order defect in the candidate composition,
not the full D0b/D1 qualification gate.

The first live run exposed a real profile gap: the previous Host-level
read-only patch did **not** remove the standard preset's model-facing tool
catalog. The loopback model saw 27 tools, including `bash`, before a
candidate no-tool preset root was added. The test intentionally failed on
that observation and now requires zero tools. This is not yet an effective
runtime-evaluated Host/preset graph lock against dynamic load or drift.

The live driver also emitted user-role context events from pinned
`agent-instructions` and `@deepseek-ai/dsh-system-prompt` writers after an
admitted user message. The broker allows those two source shapes only inside
that admitted turn, with a per-turn count bound; unknown plugin user-role
events remain denied. These source labels are not secure against arbitrary
same-process plugins, so exact trusted-plugin graph closure remains required.

## Claim ceiling and next dependencies

This is a working D0b Web-prompt path through ARE preparation and native DSH
admission, not full Web control. P1g is open because the fixture's Host
principal is synthetic and no independently verified browser/workspace/
Session writer assertion exists. P3 is open because the repository
route/context result is not yet a durable product conversation receipt
joined to authenticated creation. The broker's consumed-key map is process
memory; restart, pending-inbox adoption, cancellation, resume, child Agent
recreation and native-journal reconciliation remain unproven. Image/file
prompts and non-routable language fail closed in this candidate. Goal,
command, plan, subagent and dynamic plugin producers are not migrated.
The no-tool preset is deliberately restricted and cannot be called full
DSH Web parity. The `SessionStore` hook is opt-in: stock DSH and detached
Sessions remain native. An empty restored seed may create a native
`session/end-seed` maintenance event before the guard is installed; nonempty
seeds are denied. JavaScript same-process code can still mutate public
objects unless the effective loaded-plugin graph is closed. A qualified
profile must install and assert this factory at startup before any Session
exists; the fixture does not supply an independently verified P1g Host
principal or crash-safe receipt/journal reconciliation. D0b and D1 remain
open.

## Open Questions

- Which independently verifiable Host-owned assertion will bind the now
  [selected single local DSH Host principal](../P1G-DSH-WEB-HOST-PRINCIPAL-DECISION-2026-10-04.md)
  to native creation, Agent generation, and sole writer ownership before
  prompt admission? Per-browser ownership is deferred.
- How will a prepared ARE decision and native prompt key be journaled and
  reconciled across append, ACK loss, cancellation and process restart?
- Which exact Host context producers inherit an admitted turn, and which
  require separate ARE decisions and typed permits?
- How will the effective runtime Host/preset graph be locked, monitored and
  failed closed on reload or unknown plugin rows?
- How will a production profile prove that the opt-in factory was installed
  before every ordinary, resumed and child-created Session, and reject an
  unexpected plugin or second writer before serving Web traffic?
