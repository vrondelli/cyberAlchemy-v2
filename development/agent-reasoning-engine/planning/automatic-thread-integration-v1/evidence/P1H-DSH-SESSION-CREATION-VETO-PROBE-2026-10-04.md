# P1h — DSH Web session-creation checkpoint probe

Status: **disposable candidate conformance evidence**, 2026-10-04.
Authority effect: none. Route: `CA2-ROUTE-IMPLEMENT`. This is not an ARE
identity assertion, durable conversation binding, pre-inbox gate, DSH Web
activation, or product-path selection.

## Bounded task and context

The task-session unit tested whether the pinned DSH Host has an in-process
creation checkpoint that can stop Agent publication. Context was the
[P1g carrier audit](P1G-DSH-WEB-HOST-IDENTITY-SOURCE-2026-10-04.md),
the pinned `SessionStore.announce`, `AgentRegistry.announce`, and
`AgentLoop.setupAndPublish` implementations, and the existing disposable
[D0 controller probe](D0-DSH-WEB-SESSION-CONTROLLER-SEAM-2026-10-04.md).
The write scope was one fixture, one test, and this evidence. The probe used
a fresh temporary `DSH_HOME`, loopback Web Host, normal token-to-cookie
exchange, the bundled read-only patch, and no model request. It left the
installed dependency and Web profile unchanged.

## Observed boundary

For one authenticated `session/create` with an exact probe session ID, a
**synchronous** `session/created` listener threw. The RPC returned failure;
the paired `agent/created` listener did not observe that Agent. The source
orders Session announce before Agent announce and disposes the prepared Agent
on a thrown creation publication. This is a viable *synchronous* native
creation checkpoint for a future trusted Host-local permit, not an identity
source by itself.

For a second exact session ID, the same listener returned a rejected Promise.
DSH logged/contained that rejection; the RPC succeeded and `agent/created`
ran. An asynchronous ARE decision or remote verifier placed directly inside
`session/created` would therefore **not** gate creation. Preparation must
finish before this event and the listener may only synchronously validate and
consume a prepared, exact, single-use in-process permit. Any file-backed ARE
binding append at that point would need an exact synchronous durable failure
contract and restart reconciliation; neither is implemented by this probe.

The session persistence handle is acquired before publication, and the
AgentLoop can flush setup-window events before `session/created`. For this
fresh ordinary Web creation, the test found no directory for the vetoed
session ID anywhere under its temporary DSH home after the failed RPC.
That observation does not cover seeded, resumed, plugin-modified, or
crash-time creation; those paths must be checked before claiming general
creation atomicity or blind retry safety.
`agent/created` itself contains synchronous listener errors, so it cannot
replace the Session creation veto. Neither creation event mediates later
`Agent.inbox.splice` or direct Session-log writes.

## Validation and limits

- `node --test test/web-session-created-veto-probe.test.mjs`: 1/1 passed.
- DSH adapter `npm test`: 28/28 passed, 0 failures.
- The fixture and test are under
  `implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter/test/`.
- This proves behavior in the pinned disposable Web Host only. It does not
  establish a supported versioned admission API, an authenticated Host or
  browser principal, native writer exclusivity, first-turn ARE receipt, or
  recovery after a crash.

## Next integration unit

After the principal mode is selected, test a *prepared-permit* creation
transaction: a trusted controller/Host source finishes ARE preparation before
calling native `create`; the synchronous Session hook consumes only the exact
session/Agent generation permit; a failed or uncertain gateway append and a
native persisted-but-unpublished session in any supported path are reconciled
without silent adopt.
That unit is independent of, and insufficient without, D0b's final-inbox
structural admission and closed producer graph. No production implementation
may treat an async event listener as the gate.

## Source selectors and open questions

- Pinned `@deepseek-ai/dsh-session/lib/index.js`: `SessionStore.announce`
  invokes listeners synchronously but contains returned Promise rejections.
- Pinned `@deepseek-ai/dsh-agent/lib/index.js`: `AgentRegistry.announce`
  contains both synchronous and asynchronous listener failures.
- Pinned `@deepseek-ai/dsh-agent-loop/lib/index.js`:
  `createStoredSession`, `appendUnstoredSuffix`, `setupAndPublish`.
- Pinned `@deepseek-ai/dsh-session-persistence-jsonl/lib/index.js`:
  `create` reserves an in-process write handle before first materialization.

Open questions: whether a veto after seeded/resumed/plugin setup leaves durable
residue; which trusted Host capability owns prepared creation permits and
recovery; whether the intended first Web principal is one local Host or each
browser/account; and which D0b delivery path will supply the lower pre-inbox
guard.
