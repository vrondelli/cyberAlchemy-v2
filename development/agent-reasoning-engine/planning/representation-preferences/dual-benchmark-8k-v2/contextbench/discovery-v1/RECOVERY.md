# Receipt-bound pageable recovery prototype

Status: offline implementation with six passing fixture tests. No provider calls, gold, current-source lookup or episode integration. The local [PLAN.md](PLAN.md) records the bounded scope and dependency DAG.

## API

`createRecoverySnapshot({captures, receipts})` clones the archive and uses native `bindDelivery`. Only observations confirmed in successful model requests with known usage enter the ordered index. Unmapped observations fail closed. Ordering is descending last-confirmed receipt, then original read ID. The index keeps one representative per exact `{path, source_sha256, start_line, end_line, body}` identity: the most recently confirmed read ID, with the same ID tie-break. Different source revisions, ranges, paths or bodies remain separate. All original observations remain unchanged in the private archive. Private snapshot counts expose total delivered, indexed unique and duplicate observations. There is no silent 16-entry unique-source ceiling. A SHA-256 fingerprint binds the exact capture/receipt archive and policy version.

`await buildRecoveryPage({snapshot, cursor=null, measure_tokens, max_entries=16, max_bytes=1024, max_tokens=256})` renders at most those limits, which may be lowered but not raised. It measures the complete public page JSON, including entries, snapshot fingerprint, offset, total, omission count and next cursor. The private archive/binding metadata must never be sent to the model. Only `page.model.text` is the public presentation. Raw full read IDs remain private; public `rN` handles are snapshot-relative ordinals.

Successful pages advance by at least one observation. A complete traversal stops at `next_cursor=null`. If the next entry or envelope cannot fit, status is `unfit`, `model=null`, `progress=false` and no next cursor is supplied. The caller must increase a lowered budget within the fixed maximum or explicitly stop and report the blocked entry. It must not silently skip the entry or automatically retry the same cursor. Empty archives return an empty page if its envelope fits, otherwise explicit unfit.

`resolveRecoveryRequest({snapshot, page, request})` accepts the **already-decoded complete** argument object `{handle: "rN"}` and rejects missing, extra, wrong-type, malformed or unlisted identifiers. It verifies snapshot integrity, page integrity, page membership and exact private bindings, then delegates to native `recoverObservedRead`. Returned read ID, path, source hash, range and UTF-8 body are the original delivered observation. The native result explicitly says historical observation and `current_source_verified=false`. There is no disk path/root parameter and no current-source read.

## Snapshot and trust boundary

Hold one private snapshot fixed throughout a paging session. Adding a new capture or receipt requires a new snapshot; old cursors fail against it. A new session starts at its first page. Do not recreate the snapshot from an evolving episode on every page request and expect old cursors to remain valid. Archive storage ownership, lifecycle and old-session retention require integration policy.

Cursors use canonical base64url serialization, strict fields, version, snapshot identity, bounded offset and an integrity checksum. The checksum is not keyed authentication: cursors are identifiers, not authority to expose undisclosed evidence. Every recoverable entry still must belong to the validated confirmed archive and the supplied page. Private snapshot/page records are caller-owned; do not accept model-supplied replacements for them.

This prototype validates archive membership and public page membership. It does **not** prove that this page was successfully delivered in the requesting model's prior prompt. Episode integration must bind the private page record to the actual successful request receipt and route only that page/session. Raw tool JSON parsing, duplicate-key handling and dispatch schemas belong to that integration; the resolver's API deliberately receives a decoded object, not arbitrary raw text. No current-source validity or native terminal acceptance is inferred from successful historical recovery.

## Validation and limitations

Run `node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/recovery-index.test.mjs` from repository root.

Tests traverse all 37 observations, including the 17th, without duplication; exercise stale/malformed/extra-field/version-altered cursors; reject unknown and off-page handles and mutated private bindings; preserve historical bytes despite a current file edit and caller-input mutation; require explicit unfit for tiny budgets; reject invalid measurements; handle empty archives; and exclude tokenizer-only or failed-request observations. Fixture receipts are locally constructed, not live evidence. The injected bytes/4 measurer is a **test fixture**, not a tokenizer or performance measurement.

The public page cap is 1,024 bytes and 256 caller-measured tokens, including cursor overhead. It is not complete-request 8K admission. Tool schema, system/task/history, recovered source bodies, output reservation and safety margins remain caller-owned admission inputs. Recovery can increase cumulative cost; no saving or quality claim follows from these tests. There is no runtime paging tool, recovery schema, discovery reminder or episode integration in this change.

## Open Questions

How will a paging session remain receipt-bound across evolving episodes and recycling? How long should prior snapshots survive? What should the caller do with an individually unfit path/envelope without hiding it? Does recovered historical evidence need separate freshness/projection feedback before terminal selection? Root review and a separately bounded integration must resolve these before live use.
