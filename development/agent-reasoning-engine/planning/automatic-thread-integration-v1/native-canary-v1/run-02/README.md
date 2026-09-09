# Corrected native ARE canary: PASS

Three real GPT-5.6-Luna turns completed through an isolated Codex app-server using
the existing ChatGPT login, low reasoning effort and standard speed. Together
with the earlier failed turn, this exhausts the four-turn authorization.

1. Enable apply-scoped mode and explain a cache: native prompt and Stop callbacks
   succeeded; no learned guidance was projected.
2. Learn the examples preference: ARE bound one lesson to the prior completed
   episode, persisted it and projected it through the native prompt hook.
3. Explain a cache again: the retained lesson was projected again. Luna supplied a
   concrete browser-cache example and echoed the exact source_digest available
   through the ARE hook context. That digest was absent from the user prompts.

All six callbacks succeeded with the exact native session, cwd and transcript
binding. Three completed outcomes were recorded in the real ARE ledger. Prompt
projections contained 0, 1 and 1 lessons. Every Stop returned {}; no continuation
was requested. Callback subprocesses recovered the same persisted ledger.

This proves the bounded isolated host-to-ARE-to-model integration. It is not a
raw outbound network capture, a causal comparison of explanation quality, proof
of natural-language learning, a cost advantage, full steering/subagent coverage,
or activation of the parent conversation. The digest could be available through
prior hook context as well as the final injection; it proves model visibility of
ARE context, not isolation of one injection's causal effect.

Corrected-run usage: 29,826 input tokens, of which 24,832 were cached, and 198 output
tokens: 30,024 total. Across all four authorized turns: 39,177 total tokens.
These are host-reported token counts, not measured account credit deductions;
parent coordination usage is separate.

The runner used the verified thread/start.config.bypass_hook_trust correction
only after discovering exactly the three disposable canary hooks. Normal Codex
configuration and existing hooks were not edited. The host process was stopped
and its temporary authentication symlink removed. No further real-model turn is
authorized by this four-turn envelope.

RESULT.json contains checks and usage; CALLBACKS.jsonl contains native hook inputs
and outputs; EVENTS.json contains selected host events; LEDGER.jsonl preserves
learning transitions and checkpoints. MANIFEST.json binds the evidence and tested
adapter dependencies. The failed run remains historical and unchanged.

Product-construction frontier: consolidate the tested candidate and address
remaining live-client requirements: exact hook trust, same-turn steering,
compaction, root/subagent attribution, controls and feedback interpretation.
Operational support owner: host integrator; affected stage: future current-chat
installation and rollback. Product approval and a separate scoped activation
remain deferred. This result does not activate ARE in the parent conversation.
