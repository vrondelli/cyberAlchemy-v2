# G1 — persisted dynamic-tool release probe (2026-09-30)

Status: bounded negative host evidence, not an activation or deactivation.

The pinned WSL host `codex-cli 0.155.0-alpha.16.4` (SHA-256 `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`) passed the disposable `native-hosted-effect-join-canary.mjs` effect join: one fixture-approved command completed through the ARE gateway, approval broker, and journal, and its result returned to a local fake Responses provider. No external model request or current desktop task was involved. The separate managed model-wire inflight-crash canary passed with a durable intent, recovered interrupted turn, unsettled effect, and refusal to rebind that thread.

On a subsequent direct App Server process, `thread/resume` with no replacement restored the persisted `are_effect_request` dynamic tool in the next model request. Two explicit resume probes then supplied `dynamicTools: []` and a nonempty replacement definition respectively. Both requests succeeded, but the next model request still advertised `are_effect_request`; the replacement tool was absent. The generated `v2/ThreadResumeParams.json` for this exact host version has no `dynamicTools` property. The test-only probes now assert `UNAVAILABLE_EMPTY_LIST_IGNORED` and `UNAVAILABLE_REPLACEMENT_IGNORED`, so a changed host behavior requires review. `thread/read` and `thread/resume` responses did not expose the effective dynamic-tool definition.

[Official OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server) says `dynamicTools` from `thread/start` persist in the rollout and are restored on resume when no new tools are supplied. Its general documentation is not evidence that this pinned binary accepts a replacement on `thread/resume`; the version-generated schema and live probes govern this candidate.

The 2026-10-02 read-only recheck still found the same installed version and
binary digest. The exact catalog verifier passed 164 client requests, 82 server
notifications, and 11 server requests. It now reports the two relevant schema
fields separately: `thread_start_dynamic_tools_declared: true` and
`thread_resume_dynamic_tools_declared: false`. This is a generated-schema
observation, not a new live revocation attempt or proof that a future declared
field would actually remove a tool. The installed host's release claim ceiling
is unchanged.

## Claim ceiling

The current host can safely run a new, gateway-owned effect turn under the tested conditions, but these probes do not establish an exclusive handover of this desktop task or a safe release of a persisted ARE-owned thread to an ordinary direct client. A direct resumer may see a stale ARE tool without the ARE approval/journal handler. No `dynamicTools` value on `thread/resume` can presently be relied on to revoke it. Managed session shutdown must not be presented as full deactivation or direct-client rollback. Keep any effectful thread bound to an ARE-owned gateway and fail closed if that binding is lost; an explicit, host-supported release protocol remains unverified.

## Open Questions

- Will a future pinned App Server expose a supported dynamic-tool replacement or revocation on resume, with observable confirmation?
- Can a host-supported exclusive writer handover and release protocol cover this exact desktop conversation without racing its current client?
- How should a user-visible recovery route preserve the thread history when a managed gateway is unavailable, without advertising an unhandled effect tool?
