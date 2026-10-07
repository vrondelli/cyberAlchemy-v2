# F1 content-free pending-feedback discovery

Status: bounded candidate implementation evidence, 2026-09-28. This does not establish current-task handover or general feedback attribution.

## Behavior

ARE can list pending feedback for one exact thread from its durable learning ledger. Each entry contains only the feedback ID and a digest of the submitted text; no feedback text, instruction, episode, or scope is inferred. Dismissed entries disappear from the list, including after ledger replay. A malformed pending identity fails closed.

The wrapper exposes a read-only, closed-parameter `cyberalchemy/learning/pendingFeedback/list` method. The gateway requires the thread to belong to the requesting consumer, including while another thread creation is unsettled. The authenticated hosted-client endpoint accepts only a single owned `threadId` query and validates the wrapper response before returning it to the browser. It starts no model turn.

The browser's **Find pending reviews** action makes discovery explicit. The user selects a listed entry before its content-free review marker is restored to local storage. An existing marker cannot be replaced. Exact original feedback text is still required to dismiss a recovered item; discovery itself cannot apply or dismiss a lesson.

## Verification

- Lifecycle tests cover thread scoping, digest-only output, replay, and removal after dismissal. File-backed wrapper test covers read-only discovery after restart.
- Gateway test covers owned discovery and foreign-consumer denial. Hosted HTTP tests cover authentication, ownership, closed query, no model turn, and withholding an unbounded wrapper response. Browser marker test covers explicit adoption and overwrite refusal.
- Full wrapper package suite: 500 passed, 13 skipped, 0 failed (`npm test`).
- The Linux Chromium attempt could not start because `libnspr4.so` is unavailable. The same disposable hosted-browser suite then ran with Windows Node, installed Windows Chrome, and the local Playwright runtime: 8 passed, 0 failed. Its pending-review case loses the browser marker, reloads, discovers the pending ID, explicitly adopts it, rejects changed text, and dismisses using the exact text. This verifies the rendered hosted browser, not the packaged Companion WebView2 surface.

## Claim ceiling and open questions

This repairs recovery of content-free pending-review identity for owned hosted-client threads only. It does not recover original text, verify human origin, classify broad feedback, adjudicate apply/revise, transfer control of the current Codex desktop task, or resolve installed-host thread-history limitations. Packaged Companion WebView2 validation remains separate.
