import assert from "node:assert/strict";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {createAdvancedReasoningController} from "../advanced-reasoning.mjs";
import {openPersistentCodingSession} from "../integrated-context.mjs";

test("advanced reasoning branches, replays, reduces, reuses counterevidence, and exports portable epochs", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-advanced-reasoning-"));
  try {
    const opened = openPersistentCodingSession({log_path: resolve(root, "reasoning.jsonl"), ledger_id: "advanced:test"});
    assert.equal(opened.ok, true);
    const session = opened.session;
    for (let index = 0; index < 5; index += 1) assert.equal(session.record({event_kind: `event-${index}`, content: {index}}).ok, true);
    const controller = createAdvancedReasoningController({session, maximum_event_count: 4, mandatory_event_kinds: ["event-0"]});
    const base = session.latestEpoch();
    const branch = controller.createAlternative({branch_ref: "alternative:one", content: {strategy: "one"}, base_epoch: base});
    assert.equal(branch.ok, true, branch.reason_codes?.join(","));
    const replay = controller.replayFixture(branch.epoch);
    assert.equal(replay.ok, true);
    const reduced = controller.reduceIfNeeded(branch.epoch);
    assert.equal(reduced.ok, true, reduced.reason_codes?.join(","));
    assert.equal(reduced.disposition, "reduced");
    const counter = controller.recordCounterevidence({claim_ref: "claim:test", evidence_ref: "failure:1", source_identity: "source:a", source_digest: "digest:a", content: {reason: "failed"}});
    assert.equal(counter.ok, true);
    const selected = controller.selectCounterevidence({claim_ref: "claim:test", current_sources: [{source_identity: "source:a", source_digest: "digest:a"}]});
    assert.equal(selected.value.selected.length, 1);
    const portable = controller.exportPortable();
    assert.equal(portable.ok, true);
    controller.appendJournal({event_kind: "turn-closed", thread_id: "t", turn_id: "1", content: {status: "closed"}});
    const cut = controller.cutJournal({thread_id: "t"});
    assert.equal(controller.replayJournal(cut.value).ok, true);
    assert.equal(controller.evictJournal({max_events: 0, max_closed_turns: 0}).ok, true);
    assert.equal(session.close().ok, true);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
