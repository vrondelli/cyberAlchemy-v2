import assert from "node:assert/strict";
import test from "node:test";

import {createModulePort} from "../index.mjs";
import {createAlchSemanticAdapter} from "../alch-semantic-adapter.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../semantic-text.mjs";

test("optional Alch adapter satisfies the semantic text facade", () => {
  const port = createModulePort({adapters: [createAlchSemanticAdapter()], output_validators: semanticTextOutputValidators});
  const facade = createSemanticTextFacade(port, {consumer_id: "request-intent-runtime"});
  const key = facade.semanticKey("Build—a—new evidence system.", {invocation_id: "alch-key-1"});
  assert.equal(key.disposition, "available");
  assert.deepEqual(key.value, {key: "build a new evidence system"});
  const phrase = facade.containsPhrase("a predefined system", "define", {invocation_id: "alch-phrase-1"});
  assert.equal(phrase.disposition, "available");
  assert.deepEqual(phrase.value, {matched: false});
});
