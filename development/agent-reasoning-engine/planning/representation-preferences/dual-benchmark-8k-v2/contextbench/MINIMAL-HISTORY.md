# Minimal-history comparison adapter

Status: implemented and four offline test groups pass; independent review pending. This is the history adapter for the proposed baseline, not a complete runnable benchmark arm. No live calls or quality/savings result.

## Policy and reuse

[minimal-history.mjs](minimal-history.mjs) reuses the existing [history projector](discovery-v1/history.mjs). It retains the two newest complete tool exchanges and plain assistant messages from the oldest retained exchange onward. With zero tool exchanges, all plain assistant messages remain. With one exchange, plain assistant messages before it are omitted; messages from that exchange onward remain. This is a structural bound, not a token bound. Actual input plus reserved output must still pass the native measured 8K admission. An oversized retained exchange fails admission intact; there is no hidden summary, truncation or retry.

The adapter accepts only executed assistant/tool history. Task/system instructions, tools and final evidence packet are assembled by the episode separately. No archive references, discovery reminders, persistent reasoning notes, pending-fragment restoration or protected-index exceptions are passed to the projector. Original assistant fields, including reasoning fields, and entire tool outputs are preserved. Ordinary assistant messages may contain reasoning; the baseline excludes separately injected persistent notes, not model output fields required by the provider protocol.

All input history is validated before older messages are omitted. Orphan/incomplete exchanges, duplicate tool IDs across the history, malformed function calls and injected user/system messages fail. Parallel tool replies may appear in any order as long as each requested ID is answered exactly once. Duplicate IDs use the existing projector's conservative rejection policy; they are not silently renamed. Each projection records full-input and projected-history hashes, omitted indices and JSON byte counts. Byte counts are not token measurements or savings claims. Captured original requests and receipts must remain available to bind older delivered observations for final selection.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/minimal-history.test.mjs
```

Four groups passed on 2026-09-18: exact two-exchange selection and input immutability; malformed/incomplete history rejection even when old; intact oversized/multi-tool exchanges; deterministic empty and terminal-message handling. These are synthetic protocol tests, not provider qualification.

## Product frontier and dependencies

Coordinator owns the next runnable work: a complete minimal-history episode using this adapter, the common source tools and terminal evidence representation, shared measured native driver and 96K/96-call accounting. It must reserve capacity for final evidence selection and preserve all request captures after pruning. Common current-ARE versus alternative differences must be declared before the twelve-outcome freeze. Independent review, real tokenizer qualification, shared abort wiring and D:/WSL admission remain prerequisites for live generation. C: is excluded; release and deployment remain separate residue.

## Open questions

Can the complete baseline finish useful discovery and final selection under this fixed history policy? Are all real provider reasoning/tool exchanges accepted without losing required fields? Should a future experiment change the two-exchange policy? Any such change needs prospective registration rather than outcome-based tuning. This adapter does not resolve bounded history for the independent-investigation arm, whose current full branch history still fails explicitly when oversized. The comparison must declare that difference or implement a reviewed common policy before launch.
