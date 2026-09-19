# Shared repository tools in DeepSeek Harness

Status: implemented additive adapter; four local tests and five VPS tests pass, including actual pinned DSH ToolRuntime. Not a complete headless benchmark composition or evidence-delivery adapter.

[Adapter](deepseek-matched-tools.mjs) registers the exact existing native list_files, read_file, search, apply_edits and get_patch schemas through DSH's public tool registry. Model content remains the same canonical JSON envelope, including read IDs and source hashes. DSH's reasoning loop and memory are not reimplemented.

Calls are exclusive and cancellation-aware at execution boundaries. Unique call IDs prevent conflating observations. The caller supplies synchronous guarded persistence; intent is recorded before execution, source snapshots before read results, and outputs after execution. Persistence failure poisons the adapter. A failed write after an edit leaves the recorded intent and the edited worktree visible; it cannot become a successful benchmark result. Native schema errors remain normal tool feedback.

Execution records explicitly state delivery_confirmed=false. A result created by a tool is not proof that a model received it. Future wire binding must verify actual successful provider requests, exact returned content, final model selection and base-source projection. Neither registry execution nor handles alone can clear these requirements.

## Verification

Local: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-matched-tools.test.mjs

VPS evidence is in [the retained test receipt](deepseek-matched-tools-evidence/TEST-RECEIPT-R2.json). It runs the same adapter tests plus deepseek-matched-runtime.test.mjs against installed DSH 0.1.5-rc.2 packages, using a real temporary Git repository inside a network-disabled container. All five tests pass. The pinned fixture image ID and source/dependency hashes are retained. The fixture image adds Git to the pinned Node image; it is a test image, not a declared production release.

The first remote run failed in test cleanup because Context has no dispose method. The invalid cleanup call was removed; the test explicitly unregisters its tools, and the isolated process owns the remaining in-memory services. Initial failure output is retained. No provider calls occurred in these tests.

Coverage: exact five-tool schema equality, native runtime registration/JSON rendering, stable read IDs, actual edits, unchanged base reads, schema diagnostics, cancellation before mutation, duplicate IDs, persistence failure after mutation and registration rollback.

## Open questions

Headless composition must expose only the agreed task capabilities, bind a fresh adapter to one run, provide guarded storage and retain native memory behavior. Terminal selection, exact request/source binding, compaction admission and complete accounting are pending. The common profile still needs real tokenizer qualification with a useful output reserve. Matching tool capability makes an adapted DSH comparator, not an out-of-box DSH performance claim. Independent review/freeze is required before scoring.
