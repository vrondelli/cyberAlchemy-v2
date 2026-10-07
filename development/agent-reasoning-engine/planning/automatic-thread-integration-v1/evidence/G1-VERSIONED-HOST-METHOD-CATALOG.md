# G1 versioned gateway method admission

Status: bounded construction evidence, 2026-09-26. Authority effect: none.

## Source and scope

The selected installed `codex-cli 0.155.0-alpha.16.4` generated an
experimental App Server JSON Schema bundle. Its `ClientRequest.json` contains
164 distinct methods (SHA-256
`84503651b1b6f9a4f259cf6d917b6b46a4a8f3262e00f6cfd077abc84dfbb5c1`)
and `ClientNotification.json` contains `initialized` (SHA-256
`706cf248d75027c84a3c63348d0ed507182e8eba40069dd17541793de029145a`).
The exact names and a deliberately small admitted subset are recorded in the
[catalog](../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/host-client-method-catalog.v1.json).
Official App Server documentation says generated schemas are version-specific:
https://learn.chatgpt.com/docs/app-server

## Admission behavior

The persistent gateway now classifies a client request or notification before
it reaches any wrapper implementation. Sixteen observed host requests are
admitted for selected thread/turn lifecycle and observation, along with five
named wrapper-local ARE requests and the `initialized` notification. Every
other observed host request is rejected as `host.method-ungoverned`; a method
absent from the versioned catalog is rejected as `host.method-unknown`. A
rejected request receives JSON-RPC error `-32081`; a rejected notification
is dropped. Responses to pending server requests remain a distinct path.
The installed-host gateway entrypoint checks that the selected Codex protocol
version matches the catalog before startup. The native verifier regenerates
both schemas in an isolated temporary directory and checks their digests and
ordered method lists; it removes that directory after inspection.

This specifically prevents a generic gateway client from reaching unreviewed
direct filesystem writes/removal, configuration writes, plugin installation,
MCP tool calls, remote-control mutations, raw thread item injection, shell
commands, review, archive/delete, and unknown future method names, even when
the gateway is given a pass-through wrapper. The direct stdio wrapper is a
separate compatibility path; it retains its narrower known-alternate-method
guard and cannot inherit this gateway-wide claim.

## Verification

- Catalog unit tests classify all 164 observed request names, preserve
  `initialized` and response handling, and reject listed effect methods and
  unknown names: 2/2 passed.
- Acknowledged gateway plus pass-through wrapper test rejects unsafe and
  unknown methods with zero backend writes.
- Full serial wrapper package suite: 350 passed, one platform skip, zero
  failed.
- Native schema verifier against the installed selected binary: `ok:true`,
  164 request methods, one notification method, authority effect none.
- The first native approved-write canary exposed an omitted observation
  method: `hooks/list` was blocked at discovery. After explicitly admitting
  that read-only method, the same installed-host canary passed with one-use
  approval, zero external model calls, temporary configuration removed, and
  native child reaped. The focused catalog suite passed again 2/2.

## Claim ceiling and open questions

Method admission is necessary but not sufficient for managed effects. A
generic gateway client can still supply unsafe `approvalPolicy`, `sandbox`,
or per-turn `sandboxPolicy` parameters on otherwise admitted lifecycle
methods. The hosted browser pins read-only plus on-request approval, but a
different gateway client is not yet bound to that policy. The catalog also
does not establish exact desktop-task handover, read ownership, unknown-delivery
reconciliation, or a legacy-proxy migration. G1/O1 remain unadmitted.

The next G1 construction step is a gateway-side per-method parameter contract
for admitted lifecycle requests, with backend-specific capability rules so
the no-effects DSH adapter is not falsely treated as Codex. The product owner
must separately decide any future user-visible shell, review, compaction,
MCP, or configuration workflow before it is admitted.
