import assert from "node:assert/strict";
import test from "node:test";

import {createAlchSemanticAdapter, createAlchSemanticModulePort} from "../alch-semantic-adapter.mjs";
import {createSemanticTextFacade} from "../semantic-text.mjs";

test("packaged Alch adapter requires an explicit semantic runtime", () => {
  assert.throws(() => createAlchSemanticAdapter(), /explicitly supplied Alch semantic runtime/u);
  assert.throws(() => createAlchSemanticAdapter({semanticKey: () => "key"}),
    /explicitly supplied Alch semantic runtime/u);
  const runtime = {
    semanticKey: text => text.toLowerCase(),
    containsPhrase: (text, phrase) => text.includes(phrase),
  };
  const facade = createSemanticTextFacade(createAlchSemanticModulePort(runtime), {consumer_id: "boundary-test"});
  const key = facade.semanticKey("ARE", {invocation_id: "boundary-key"});
  const phrase = facade.containsPhrase("ARE is ready", "ready", {invocation_id: "boundary-phrase"});
  assert.equal(key.disposition, "available");
  assert.deepEqual(key.value, {key: "are"});
  assert.equal(phrase.disposition, "available");
  assert.deepEqual(phrase.value, {matched: true});
});
