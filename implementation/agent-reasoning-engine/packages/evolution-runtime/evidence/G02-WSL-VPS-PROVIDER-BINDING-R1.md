# G02 WSL storage and VPS provider binding r1

## Bounded purpose

Operational support for the private
[native workspace experiment](G02-NATIVE-CANDIDATE-WORKSPACE-R1.md), not a new
product service. Repository sources, native evidence, and campaign receipts stay
on WSL; GLM calls consume the existing credential on the VPS. A short-lived SSH
process accepts one bounded JSON request on stdin and exits after one provider
attempt. No public listener, arbitrary command, arbitrary endpoint, credential
transfer, source-tree transfer, implicit retries, cleanup, or deployment occurs.

Provider identity is pinned to `glm-5.3-flash` and the existing VPS transport
SHA-256 `5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d`.
Only the fixed z.ai tokenizer and chat-completions endpoints are available.
Input32MiB, response1MiB, generation output1–8192 tokens, low reasoning effort,
tokenizer deadline30s, generation deadline300s. Each campaign still needs its
own frozen total/model-call budgets and native tokenizer admission.

Closed input excludes credentials, arbitrary headers, model override, hidden
reasoning fields, and shell commands. Replies whitelist usage, request identity,
numeric provider code, public assistant content/tool calls, and timing. Hidden
reasoning, raw errors, response headers and metadata are not exported. Exact
credential reflection is redacted before stdout. These checks do not turn
source/model text into trusted instructions or authorize tool execution.

## Frontier and gates

Runnable support frontier: local negative tests, small exact VPS file staging,
remote hash/credential-presence check without provider access, then a frozen
one-tokenizer/one-generation functionality probe. This is transport functionality,
not benchmark improvement. Native source/execution parity and a live exposed
workspace canary remain separate gates. No unopened confirmation labels are used.
Candidate ontology records/selectors are not dependencies. The existing campaign
approval covers bounded provider spend; publication and broad VPS cleanup remain
separate. Do not reduce the native worker's filesystem reserve to bypass failure.

Implementation:
[relay](../research/g02-product-r4/vps-json-provider-r1.mjs),
[tests](../research/g02-product-r4/vps-json-provider-r1.test.mjs),
[fixed WSL caller](../research/g02-product-r4/wsl-vps-provider-r1.mjs),
[functionality probe](../research/g02-product-r4/probe-wsl-vps-provider-r1.mjs).

## Terminal provider probe — 2026-10-06

All10 local binding tests pass. Remote preflight initially found raw-file hashing
incorrectly serialized a Buffer; this was fixed before any provider dispatch,
with a regression test. The exact staged relay is
`/opt/are/evolution-runtime/g02-wsl-vps-provider-r1/relay.mjs`, SHA-256
`0f5d4b71251075e6687947f1b1feea08b2cbbe04e6090235cbb010e1585745e2`.
The VPS Node is v24.10.0; WSL Node is v26.8.1. This staging is a private benchmark
process, not an activated/public service.

The frozen live probe made exactly one tokenizer and one generation attempt,
no retry. Both reported34 input tokens; generation reported7 output tokens and
returned the exact requested public JSON. Functionality passed, with41 known
generation tokens. Exact request-body digests and SSH/provider timing are recorded.
No repository task, reference labels or native quality metric entered this probe.

Private archive:
`/home/vlad_/are-benchmark-archive/g02-wsl-vps-provider-probe-r1-20261006/`.
Pre-dispatch `FREEZE.json` SHA-256:
`fc52c902d7e0b1ff1a7e9c94dda77f07621bbc04946ad5dce5292d7a6b1e4b1b`.
Terminal `RESULT.json` SHA-256:
`a551d691d7fd3517132bd5ac06de542beb65df4f5071a60bf8dfc6a10da7b797`.
The WSL caller checks exact operation, request ID and provider-body digest, and
marks missing/unbound SSH replies as uncertain rather than assuming no dispatch.
Such uncertainty stops the native canary without an automatic retry.

The exposed task1 native workspace canary is now terminal and scored, and the
separate12-case matched pilot has sealed and native-scored all24 model arms;
its exact workspace policy failed its frozen quality/cost gate.
Its result and quality gates are owned
by the linked workspace document; this provider probe alone establishes neither.

## Separate connection-reuse candidate — 2026-10-06

Completed-run metadata showed substantial SSH overhead beyond recorded provider
latency. A separate [zero-provider timing probe](../research/g02-product-r4/probe-ssh-connection-reuse-r1.mjs)
ran four paired fixed `true` commands per transport, alternating arm order.
Direct SSH averaged2180.18ms; a private existing master averaged403.76ms.
Cold master startup was1863.79ms. These are infrastructure command timings,
not model latency, billing, native quality or product-superiority measurements.
The probe made zero GLM/tokenizer calls, closed its exact private master after
all synchronous channels completed, and removed its empty probe-owned temporary
directory. Its write-once receipt remains at
`/home/vlad_/are-benchmark-archive/g02-ssh-connection-reuse-probe-r1-20261006/RESULT.json`,
SHA-256:`e7f52ad8130b613c7921a352bcc2cc4b91589246d7013d143897f54f3d69bdd0`.

The separate [r2 transport candidate](../research/g02-product-r4/wsl-vps-provider-multiplexed-r2.mjs)
requires an exact WSL-private Unix socket, owner/mode checks, unchanged provider
request and reply binding, the fixed relay hash, original byte/time caps and
zero retries. `ProxyCommand=/bin/false` disables an unplanned fresh connection
if the intended master is unavailable. It does not create a master, transfer
credentials or accept socket settings in model input. Four local synthetic
tests pass. An initial fake-process test compared
serialized nested JSON incorrectly and left its fake reply unfinished. The
fixture comparison was corrected, the rerun passed, and only that exact hung
synthetic child was stopped; no benchmark/provider process was restarted.

The campaign's r1 source pins and transport remain unchanged. After all24 model
arms sealed, the separate [r2 live probe](../research/g02-product-r4/probe-multiplexed-vps-provider-r2.mjs)
was frozen and executed: one tokenizer request and one synthetic generation,
58 known generation tokens, no unknown generation usage and zero retries.
It returned the requested public JSON and passed reply/body bindings. The
tokenizer contract was checked against the earlier r1 receipt before dispatch:
tokenizer usage has a prompt count, not a completion count. The owned master
closed successfully; its private socket and empty temporary directory are gone.
Only that probe-owned temporary state was removed, and durable receipts remain.

Private archive:
`/home/vlad_/are-benchmark-archive/g02-multiplexed-vps-provider-probe-r2-20261006/`.
`FREEZE.json` SHA-256:
`74aed35505886bfc3a22a4611721ed5120529c89e05c749f9d85f09bc46fa705`.
`RESULT.json` SHA-256:
`e94c0d9333e9d06fe06c3b33f764d752417d1bcbb34a9f4d79ff84dac756957b`.
This is provider functionality only, not native quality, matched model latency
or superiority evidence. Any future campaign use still needs its own prospective
transport binding; do not substitute r2 into the already sealed r1 campaign.

## Open Questions

- Can native token admission and successful delivery bind exactly to relayed
  request bytes, including unknown-usage/failure accounting without replay?
- Which local source-tool and helper dependencies must match the VPS candidate
  before a meaningful paired native experiment?
- What SSH latency is added, and how should it be separated from comparable
  provider/native execution costs?
- A process/connection timeout is not evidence that the provider did not dispatch;
  how is that uncertainty sealed without automatic retries?
