#!/usr/bin/env node
// Test-only Appearance CDP client. The shipped Companion never enables remote debugging.
import assert from "node:assert/strict";

const port = Number(process.argv[2]);
const target = process.argv[3];
const placement = target?.startsWith("placement:") ? target.slice("placement:".length) : null;
const skin = placement ? null : target;
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, "A local CDP port is required");
assert.ok(placement ? ["center", "top-left", "top-right", "bottom-left", "bottom-right"].includes(placement)
  : ["verdant", "cobalt", "ember"].includes(skin), "A known appearance choice is required");

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let page;
for (let attempt = 0; attempt < 50; attempt++) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json`, {signal: AbortSignal.timeout(1000)});
    const pages = await response.json();
    page = pages.find(candidate => candidate.url?.includes("/dashboard.html") && candidate.webSocketDebuggerUrl);
  } catch { /* WebView2 may still be opening its local inspector socket. */ }
  if (page) break;
  await pause(100);
}
assert.ok(page, "The owned dashboard was not available to the test-only inspector");

const socket = new WebSocket(page.webSocketDebuggerUrl);
try {
  await Promise.race([
    new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, {once: true});
      socket.addEventListener("error", reject, {once: true});
    }),
    pause(5000).then(() => { throw new Error("CDP socket did not open"); }),
  ]);
  const selector = placement ? `[data-orb-placement="${placement}"]` : `[data-skin-choice="${skin}"]`;
  const expression = `(() => {
    const navigation = document.querySelector('[data-panel="appearance"]');
    const panel = document.getElementById('panel-appearance');
    const choice = document.querySelector('${selector}');
    if (!navigation || !panel || !choice) throw new Error('Appearance controls are missing');
    navigation.click();
    if (panel.hidden) throw new Error('Appearance did not open');
    choice.click();
    return {appearance_visible: !panel.hidden, requested_choice: '${target}'};
  })()`;
  const reply = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("CDP evaluation timed out")), 5000);
    socket.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timeout);
      if (message.error || message.result?.exceptionDetails) reject(new Error(JSON.stringify(message.error ?? message.result.exceptionDetails)));
      else resolve(message.result?.result?.value);
    });
  });
  socket.send(JSON.stringify({id: 1, method: "Runtime.evaluate", params: {expression, returnByValue: true, awaitPromise: true}}));
  const result = await reply;
  assert.deepEqual(result, {appearance_visible: true, requested_choice: target});
  process.stdout.write(JSON.stringify({schema_version: "are.native-orb-skin-cdp-test/v1", ...result, authority_effect: "none"}) + "\n");
} finally {
  socket.close();
}
