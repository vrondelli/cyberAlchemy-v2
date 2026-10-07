# G1 completed-host-turn recovery: bounded source evidence

Status: candidate construction evidence, 2026-09-27. This is not activation,
installer validation, product approval, or a claim about the current Codex task.

## Boundary and implementation

When a gateway has a durable `turn/start` completion receipt and exactly one
accepted-turn receipt, an owned `thread/read(includeTurns: true)` response can
prove that the same raw host turn has status `completed`. After restart, the
wrapper also requires the corresponding persisted ARE semantic turn binding.
It checkpoints `semantic-turn-recovery-terminal` with the host observation
digest and releases only that recovered turn's guard. The same checkpoint
already covered exact `interrupted` and `failed` turns.

This is **host completion with ARE completion unassessed**. Neither a fabricated
`turn/completed` notification nor a Reasoning State completion frontier,
semantic outcome, Evolution signal, continuation decision, automatic successor,
or retry is produced. A late real notification is forwarded as host evidence
without retroactively creating those ARE products. A distinct new user turn
may enter the ordinary preflight path; `inProgress`, unknown acceptance, and
conflicting terminal status remain fail-closed.

The read-only Companion Threads row says `Recovered host terminal`, states
that ARE missed the completion notification for a host-`completed` turn, and
labels any earlier frontier as historical. It does not claim that the whole
chat was activated or that the lost completion was semantically assessed.

## Source validation

- Wrapper, gateway, and thread-observation focused suites: 149 passed, zero
  failed. Tests cover exact accepted history, durability-before-reconciliation,
  both `interrupted` and `completed`, restart/idempotency, distinct later turn,
  and absence of semantic completion, Evolution signal, and frontier.
- Full wrapper package suite: 388 passed, zero failed, five platform skips.
- Companion renderer suite: 25 passed, zero failed, including completed-host
  recovery copy. Rust bridge `cargo check --offline` passed. JavaScript syntax
  check passed.

The native Windows `--completed-notification-loss` canary first exposed a
remaining observation-client validator that rejected `completed` terminal
recovery; the validator was corrected. The rerun passed against the installed
`codex-cli 0.155.0-alpha.16.4` binary (SHA-256
`9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
Its test-only one-shot injection withheld the second turn's real host
`turn/completed` notification from ARE after the disposable host turn
finished. After gateway/backend restart, exact host history proved that turn
`completed`; the recovered Threads observation reported `recovery-terminal`,
one matching durable history receipt, the earlier frontier unchanged, and
zero process-local decisions. A new request was rejected before history
verification and accepted afterward as a distinct turn. The stable request
key did not redispatch the old turn. Four fixed loopback provider requests
occurred; external model calls were zero, the current desktop task was not
touched, and temporary configuration was removed.

This is an injected notification-loss scenario, not a real power-loss test or
proof that every host notification failure can be reconstructed. The prior
[interrupted-turn evidence](G1-NATIVE-INTERRUPTED-TURN-RECOVERY.md) remains a
separate failure mode. A fresh unsigned Windows development installer was
built from this source at
`implementation/agent-reasoning-engine/apps/desktop-companion/dist/ARE_Companion_0.1.0_x64-setup-completed-loss-20260927.exe`
(SHA-256 `c072ddc8ce1ebe019b27716cc473f15bd64cb229406fd2fb0a6d42e253c21e0d`,
development closure digest
`f28e32a04201cc636c409646d257d92bb0e2fdd870a3bb0515624c8b67198408`).
The builder's staged product-health gate passed, and its temporary stage was
removed after success. The installer was not installed, and a WebView2 run
against that first installer was not run. A second same-day build from the
then-current source retained its stage for exact package validation. Its
resource feature check passed with product version `0.10.0-rc.1`, and the
two-phase native WebView2 run passed against the staged executable and
resources. Before restart, the app showed a real completed frontier and
linked decisions. After one-shot completion-notification loss and restart,
Threads showed `Recovered host terminal`, exact `completed` history, the
earlier-turn frontier label, and ARE completion explicitly unassessed;
Decisions correctly had zero process-local records. Orb opening, all seven
destinations, appearance, keyboard/focus, and independent Evidence source
postures passed in both phases. The tested unsigned installer was retained at
`implementation/agent-reasoning-engine/apps/desktop-companion/dist/ARE_Companion_0.1.0_x64-setup-completed-loss-ui-tested-20260927.exe`
(SHA-256 `6f6c04db8fff16bf606ab30a7e7c219775385ec9e3f7401b9772d13b74e01735`,
development closure digest
`3327fb99dd423bd9a325c73557c785668425abbdf56f3826548eed039df43910`).
It was not installed or signed. The exact retained build stage and temporary
duplicate-output directory were removed after testing; those temporary files
are not recoverable. The earlier interrupted-turn installer predates this
completed extension.

One concurrent full-suite run had an unrelated five-second Evolution startup
observation timeout while the Windows native build consumed the machine. Its
focused test passed after the build; the uncontended full suite then passed
with 388 passed, zero failed, five platform skips. No timeout assertion was
weakened.

## Claim ceiling and open questions

Exact host status is not equivalent to an ARE completion notification. Can a
future host provide a durable, replayable, notification-equivalent completion
envelope with exact identity and ordering so ARE can assess a lost completion
once, rather than leave it explicitly unassessed? How should a genuinely
unknown `turn/start` dispatch be reconciled when there is no accepted-turn ID?
These need separate protocol evidence and further failure-injection tests.
