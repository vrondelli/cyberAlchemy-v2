import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import test from "node:test";

const bundle = readFileSync(new URL("../web-outcomes-plugin/lib/client.js", import.meta.url), "utf8");

function plugin() {
  let registration;
  runInNewContext(bundle, {window: {__ModuleLoader__: {load(value) {
    registration = value;
  }}}});
  assert.equal(registration.id, "@cyberalchemy/are-dsh-web-outcomes");
  return registration.factory((name) => {
    assert.equal(name, "react");
    return {createElement: (type, props, children) => ({type, props, children})};
  });
}

test("ARE DSH Web indicator registers only a read-only Session header slot", () => {
  const client = plugin();
  const calls = [];
  client.apply({slots: {inject(name, mount) {
    calls.push(["inject", name]);
    mount();
  }, register(entry, component) {
    calls.push(["register", entry, component]);
  }}});
  assert.deepEqual([...client.inject], ["slots"]);
  assert.equal(calls.length, 2);
  assert.equal(calls[0][1], "conversation.session.header.utilities");
  assert.equal(calls[1][1].id, "are-prompt-outcome");
  const render = calls[1][2];
  assert.equal(render({useProjection: () => undefined}), null);
  assert.equal(render({useProjection: () => [{disposition: "uncertain", terminal: null}]})
    .props["aria-label"], "ARE prompt uncertain");
  assert.equal(render({useProjection: () => [{disposition: "recovered", terminal: "completed"}]})
    .props["data-are-prompt-outcome"], "completed");
  assert.equal(render({useProjection: () => [{disposition: "private", terminal: null}]}), null);
});
