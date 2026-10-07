# G1 approval-scope boundary across current and legacy paths

Status: bounded construction evidence, 2026-09-26. Authority effect: none.
This does not activate the current desktop task or establish universal host
effect enforcement.

## Finding and change

The ARE-hosted browser displayed only **Accept once**, but its authenticated
approval endpoint also accepted `acceptForSession`. The shared Codex wrapper
recognized that response, as well as executable/network policy amendments, as
an accepted effect. These forms can change how later host effects are approved,
so a later operation might not emit a new request for ARE to assess.

The hosted approval broker now accepts only `accept`, `decline`, or `cancel` for
command/file requests. The shared wrapper independently allows only those
one-request results for command/file approvals and requires `scope: "turn"`
for permission responses. A broader result is converted into an explicit host
decline, with the pending approval released and a rejection event recorded.
The successful one-use approval path remains unchanged.

The older governance proxy at
`development/agent-reasoning-engine/codex-integration/runtime/proxy.mjs` and
its engine still recognize session-wide and policy-amending acceptances. That
digest-bound compatibility route was not silently rewritten or retired; the
integration registry and map now state that it cannot inherit this guard's
claim. The website edge/broker/provider chain, DSH backend and other model
transports are distinct boundaries, not alternate approval implementations for
this hosted Codex path.

## Verification

- Focused shared-wrapper and hosted-client suites: 93/93 passed, including
  one-use approval, session/policy grant rejection and permission-scope denial.
- Full serial `codex-app-server-wrapper` package suite: exit 0.
- Integration-surface registry tests: 4/4 passed.
- Selected DSH and Conversation Runtime suites: 21/21 passed. Selected website
  chat/closure and legacy-proxy suites: 23/23 passed. These are separate-mode
  regression checks, not a shared controller conformance result.
- Installed `codex-cli 0.155.0-alpha.16.4` disposable canary with fixed loopback
  provider and actual gateway/wrapper: an approval-requested command followed
  by a programmatic `acceptForSession` response produced one wrapper rejection,
  no tool-success marker and a completed turn. Zero external model calls;
  temporary configuration removed; native child reaped. Binary SHA-256:
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`.
  The ordinary decline canary also passed. Neither contacted the desktop task.

## Claim ceiling and open questions

This closes one approval *scope* bypass in the current shared wrapper and
hosted-client API. The hosted path was subsequently pinned to read-only and
its Codex gateway now rejects writable lifecycle requests; see
[parameter evidence](G1-HOST-PARAMETER-CONTRACT.md). That does not prove
universal interception: a host operation that needs no approval may still
execute despite an advisory hook block on another selected path. It does not
migrate the legacy proxy, prove direct
desktop-client handover, or unify the website/DSH/Conversation Runtime identity
stores. G1 remains construction-only; O1 live activation is blocked.

Before any selected path can claim managed effects, prove its exact host policy,
which operations emit approvals, whether an approved turn can create persistent
host policy, and how a bypass is prevented or surfaced as unsupported.
