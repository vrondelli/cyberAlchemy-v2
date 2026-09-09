# Codex host boundary inspection

Status: source-inspected implementation planning evidence, not a compiled patch.
Authority effect: none. Revision inspected:
`6af345407d9c2a568da9d01b6c4b81a9e61495c0` in `openai/codex`.
This upstream revision has not been established as the installed binary's source.

The old `codex-rs/core/src/codex.rs` URL returned 404. Bounded directory lookup
located the current session implementation instead.

| Source location | Observed behavior | Required integration |
| --- | --- | --- |
| `core/src/session/turn.rs:1086` | `run_pre_sampling_compact` can run previous-model compaction before checking current limits. | Gate before both paths, including model-switch behavior. |
| `core/src/session/turn.rs:509` | Mid-turn rollover calls `run_auto_compact`; rollover is not an ARE fresh-context transfer. | Intercept before compaction, quiesce tool work, and stage validated task state. |
| `core/src/session/turn.rs:1415` | `run_sampling_request` reconstructs prompts inside a retry loop. | Re-measure and bind each attempt; an earlier turn-level permit is insufficient. |
| `core/src/session/turn.rs:2296` | `try_run_sampling_request` calls `client_session.stream`. | Bind dispatch to the exact prompt and current generation before this call. |
| `core/src/session/context_window.rs` | Combines scoped compaction thresholds, usable window and fallback buffering. | Establish actual threshold/scope and reserve all forthcoming growth. |

Source:
https://github.com/openai/codex/blob/6af345407d9c2a568da9d01b6c4b81a9e61495c0/codex-rs/core/src/session/turn.rs

## Open questions

The lower-level client/network retry paths, auxiliary inference, tool concurrency,
and model-switch paths still need complete dependency inspection. No claim of
every-provider-request coverage follows from these identified call sites. A
pinned source checkout, prototype host interface, compiled integration tests and
bounded live validation remain construction work. No host patch or build was
performed in this epoch, and neither installed Codex nor the desktop task changed.
