import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { assessLessons } from "../src/core.mjs";
import { MemoryStore } from "../src/store.mjs";

function temporaryStore() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "memory-observatory-"));
  return {
    file: path.join(directory, "nested", "store.json"),
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true })
  };
}

const base = (lesson_id, extra = {}) => ({
  product_id: "product-a",
  participant_id: "participant-a",
  lesson_id,
  instruction: `instruction ${lesson_id}`,
  source_ref: `source:${lesson_id}`,
  ...extra
});

test("creates, revises, disables, persists, and records immutable history", () => {
  const fixture = temporaryStore();
  try {
    const store = new MemoryStore(fixture.file);
    const created = store.create(base("one", { conditions: ["deploy"] }));
    assert.equal(created.revision, 1);
    const revised = store.revise({
      product_id: "product-a",
      participant_id: "participant-a",
      lesson_id: "one",
      expected_revision: 1,
      instruction: "revised instruction",
      source_ref: "source:two"
    });
    assert.equal(revised.revision, 2);
    assert.deepEqual(revised.conditions, ["deploy"]);
    const disabled = store.disable({ product_id: "product-a", participant_id: "participant-a", lesson_id: "one", expected_revision: 2 });
    assert.equal(disabled.disabled, true);
    assert.equal(store.disable({ product_id: "product-a", participant_id: "participant-a", lesson_id: "one", expected_revision: 2 }).disabled, true);
    assert.deepEqual(store.history({ product_id: "product-a", participant_id: "participant-a", lesson_id: "one" }).map(event => [event.event_id, event.kind, event.revision]), [[1, "created", 1], [2, "revised", 2], [3, "disabled", 2]]);
    const restarted = new MemoryStore(fixture.file);
    assert.equal(restarted.list({ product_id: "product-a", participant_id: "participant-a" })[0].instruction, "revised instruction");
    assert.equal(restarted.history({ product_id: "product-a", participant_id: "participant-a", lesson_id: "one" })[0].source_ref, "source:one");
  } finally {
    fixture.cleanup();
  }
});

test("enforces scope, duplicate identity, and revision conflicts", () => {
  const fixture = temporaryStore();
  try {
    const store = new MemoryStore(fixture.file);
    store.create(base("same"));
    assert.throws(() => store.create(base("same")), error => error.code === "DUPLICATE_LESSON");
    assert.throws(() => store.revise({ ...base("same"), expected_revision: 9 }), error => error.code === "REVISION_CONFLICT");
    assert.deepEqual(store.list({ product_id: "other", participant_id: "participant-a" }), []);
    assert.deepEqual(store.exportScope({ product_id: "other", participant_id: "participant-a" }).events, []);
  } finally {
    fixture.cleanup();
  }
});

test("explains with case-insensitive conditions, exclusions, and disposition priority", () => {
  const lessons = [
    { ...base("a", { conditions: ["deploy"], exclusions: [] }), revision: 1, disabled: false },
    { ...base("b", { conditions: ["missing"], exclusions: [] }), revision: 2, disabled: false },
    { ...base("c", { exclusions: ["secret"] }), revision: 1, disabled: false },
    { ...base("d"), revision: 1, disabled: true },
    { ...base("e"), revision: 1, disabled: false }
  ];
  const result = assessLessons({
    product_id: "product-a",
    participant_id: "participant-a",
    text: "Please DEPLOY this safely",
    invalidated_refs: ["source:e"],
    override_ids: ["e"]
  }, lessons);
  assert.deepEqual(result.items.map(item => item.lesson_id), ["a"]);
  assert.deepEqual(result.assessments.map(item => [item.lesson_id, item.disposition]), [
    ["a", "applicable"], ["b", "inapplicable"], ["c", "applicable"], ["d", "disabled"], ["e", "unsupported"]
  ]);
});

test("rejects malformed existing storage without replacing it", () => {
  const fixture = temporaryStore();
  try {
    fs.mkdirSync(path.dirname(fixture.file), { recursive: true });
    fs.writeFileSync(fixture.file, "not-json");
    assert.throws(() => new MemoryStore(fixture.file), error => error.code === "STORE_CORRUPT");
    assert.equal(fs.readFileSync(fixture.file, "utf8"), "not-json");
  } finally {
    fixture.cleanup();
  }
});
