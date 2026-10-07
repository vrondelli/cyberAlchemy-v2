# C2 host server-request boundary

Status: bounded local client proof, 2026-09-26. Authority effect: none. This
does not activate or hand over the current desktop task.

## Finding and repair

The shared App Server RPC client previously answered only methods whose names
ended in `/requestApproval`. Other server-initiated requests carrying an RPC
`id` fell through as notifications, leaving the host without a response. The
[official App Server contract](https://learn.chatgpt.com/docs/app-server)
also describes MCP elicitation, user input, and experimental
dynamic-tool calls as server-to-client requests. A client that cannot handle
one of these must not silently leave it pending or claim complete host request
coverage.

The [client](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs)
now allowlists command, file-change, and permission approvals. Its default is
still decline (or empty permissions scoped to the turn). MCP elicitation receives an
explicit decline. Other server requests receive a bounded JSON-RPC
method-not-supported error. Approval-handler exceptions receive a bounded
error rather than an implicit accept, an unhandled promise, or reflected
exception text. No unsupported request is executed by this client.
An exact generated-schema check found two missing required fields in those
negative responses: `scope` for permission requests and `_meta` for MCP
elicitation. The shared response contract now supplies `scope: "turn"` with
empty permissions and `_meta: null` with an elicitation decline. The Windows
approval broker uses the same permission response and removes a pending UI
approval when the RPC handler's abort signal fires. The installed-host method
matrix and claim ceiling are in
[G1 request coverage](G1-INSTALLED-HOST-REQUEST-COVERAGE.md).
The joined RPC-to-Windows-broker test and corrected disposable Windows-client
startup canary are also recorded there; neither proves native delivery of a
live approval to this desktop task.

A second liveness gap was found in the same client: the ordered input reader
awaited an asynchronous approval handler. If that handler requested host state
through the same RPC connection, the reply sat behind the handler in the read
queue and both sides waited. Server requests now run outside that read queue.
The client caps active handlers at 64 and each host response wait at 120 seconds
by default; capacity exhaustion and timeout produce bounded JSON-RPC errors.
A timed-out handler receives an abort signal and keeps consuming its capacity
until it actually settles, so ignored cancellation cannot accumulate an
unbounded number of handlers. Late results are discarded after timeout or
close. Client request IDs
are normalized for response correlation, and a second outstanding request
with the same ID is rejected instead of replacing its predecessor.

The [focused tests](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/rpc-client.test.mjs)
exercise those branches and private-payload non-reflection. RPC client,
gateway, and gateway-session-client suites passed 68/68 after the change.
This is a local fake-transport test of response behavior; it is not native
delivery evidence for each method on the installed desktop host. The earlier
[H0C approval canary](H0C-NATIVE-APPROVAL-BOUNDARY.md) remains the only native
approval-requested fixture here, and its advisory-hook bypass counterexample
still prevents a universal effect-enforcement claim.
The additional local liveness fixtures passed 17/17 in the RPC client suite:
an approval handler can await `thread/read` on the same connection, a timed-out
handler cannot later approve, unresolved handlers continue to consume capacity,
and numeric client IDs correlate correctly. After the final capacity refinement,
RPC, gateway and gateway-session-client suites passed 73/73. The full wrapper
suite also exited successfully in serial mode. These tests do not prove that a real UI supplies a
human answer or that every native App Server request method is supported.
The checked-in generated host protocol snapshot names the user-input method
`item/tool/requestUserInput`; the unsupported-method fixture now uses that
exact snapshot spelling. The snapshot is version-bound and does not establish
coverage for later host versions.

## Claim ceiling

The client now fails closed instead of waiting forever on unsupported
server-request methods. It does not collect an answer from the installed
desktop UI, implement dynamic tools, prove all current or future App Server
request types, bind this task's account, or make ARE the exclusive writer.
G1 must observe the exact selected host/client method coverage and rollback
before activation.

## Open Questions

- Which selected UI client presents supported elicitation and user-input
  requests, and how are its responses attributed to the exact host task?
- Which installed-host effect boundary can prevent tools that never request
  approval from executing after an ARE block?
