import assert from "node:assert/strict";
import test from "node:test";

import {createDefineController} from "../src/controller.mjs";

async function waitFor(controller, predicate) {
  if (predicate(controller.snapshot())) return controller.snapshot();
  return new Promise((resolve) => {
    const unsubscribe = controller.subscribe((snapshot) => {
      if (!predicate(snapshot)) return;
      unsubscribe();
      resolve(snapshot);
    });
  });
}

test("controller bridges typed input to a capability conversation without renderer state", async () => {
  const responses = [];
  const controller = createDefineController({
    agent: {close: async () => {}},
    runConversation: async ({opening, ask, write}) => {
      responses.push(opening);
      write("I heard a research project.");
      responses.push(await ask("Which subject matters most?"));
      write("The candidate is ready.");
      return {ok: true, authority_effect: "none"};
    },
  });
  assert.equal(controller.submit("Research DAO rewards"), true);
  await waitFor(controller, (state) => state.phase === "waiting");
  assert.equal(controller.submit("Contribution evidence"), true);
  const completed = await waitFor(controller, (state) => state.phase === "completed");
  assert.deepEqual(responses, ["Research DAO rewards", "Contribution evidence"]);
  assert.match(completed.transcript.map((item) => item.text).join("\n"), /candidate is ready/);
});

test("controller reports failures as visible state", async () => {
  const controller = createDefineController({
    agent: {close: async () => {}},
    runConversation: async () => { throw new Error("gateway unavailable"); },
  });
  controller.submit("A project");
  const failed = await waitFor(controller, (state) => state.phase === "error");
  assert.equal(failed.error, "gateway unavailable");
  assert.equal(failed.transcript.at(-1).role, "error");
});
