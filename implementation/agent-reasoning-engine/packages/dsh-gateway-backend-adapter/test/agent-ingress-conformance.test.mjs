import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {dirname, join} from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));

async function pinnedSource(packageName, relativePath = "index.js") {
  const entry = dshRequire.resolve(packageName);
  return readFile(join(dirname(entry), relativePath), "utf8");
}

async function pinnedPackageFile(packageName, filename) {
  return readFile(join(dirname(dshRequire.resolve(`${packageName}/package.json`)), filename), "utf8");
}

function ordered(source, labels) {
  let offset = 0;
  for (const label of labels) {
    const next = source.indexOf(label, offset);
    assert.notEqual(next, -1, `pinned DSH source changed: ${label}`);
    offset = next + label.length;
  }
}

test("pinned DSH Agent inbox append precedes inserted notification", async () => {
  const loop = await pinnedSource("@deepseek-ai/dsh-agent-loop");
  const mutation = loop.slice(loop.indexOf("\tmutate(target, start, deleteCount, inserted, discardRemoved) {"),
    loop.indexOf("\n};", loop.indexOf("\tmutate(target, start, deleteCount, inserted, discardRemoved) {")));
  ordered(mutation, [
    'this.session.append("agent/inbox/spliced", splice)',
    'this.dispatch.emit("agent/inbox/inserted", { message })',
  ]);
  const send = loop.slice(loop.indexOf("\tsend(message, target, wakeup) {"),
    loop.indexOf("\tcancel(cause, options = {}) {"));
  assert.match(send, /this\.inbox\.splice\(resolvedTarget, Infinity, 0, \[message\]\)/u);
  for (const [method, target, wakeup] of [
    ["followup", "next-turn", "true"], ["steer", "next-step", "true"],
    ["inject", "next-step", "false"],
  ]) {
    assert.ok(send.includes(`${method}(input) {\n\t\tthis.send(input, "${target}", ${wakeup});`),
      `pinned DSH ${method} ingress changed`);
  }
});

test("pinned DSH pre-step veto is after turn start and inbox claim", async () => {
  const loop = await pinnedSource("@deepseek-ai/dsh-agent-loop");
  const preStep = loop.slice(loop.indexOf("\tasync preStep(target, position) {"),
    loop.indexOf("\t/** Whether the assembled tool schemas differ", loop.indexOf("\tasync preStep(target, position) {")));
  ordered(preStep, ["this.inbox.claim(target, position.turn)",
    'this.dispatch.waterfall("agent/pre-step"']);
  const turn = loop.slice(loop.indexOf("\tasync turn() {"));
  ordered(turn, ['this.session.append("turn/start", { turn })',
    "const decision = await this.preStep(target, {"]);
  assert.match(turn, /if \(decision\.kind === "reject"\) \{\s*turnEnds = \{ kind: "blocked" \};/u);

  const agentEntry = dshRequire.resolve("@deepseek-ai/dsh-agent");
  const runtimeTypes = await readFile(join(dirname(agentEntry), "types/runtime-types.d.ts"), "utf8");
  assert.ok(/If the proposed step\s*\* is rejected, the claimed message ends here: it is neither discarded nor/u.test(runtimeTypes),
    "pinned DSH claimed-message rejection contract changed");
  const consumedWork = await readFile(join(dirname(agentEntry), "types/consumed-work.d.ts"), "utf8");
  assert.ok(/one that claimed inbox input and then failed, was stopped,\s*\* or was rejected/u.test(consumedWork),
    "pinned DSH consumed-work contract changed");
});

test("pinned DSH public Inbox can append without Agent.send", async () => {
  const loop = await pinnedSource("@deepseek-ai/dsh-agent-loop");
  const agentEntry = dshRequire.resolve("@deepseek-ai/dsh-agent");
  const types = await readFile(join(dirname(agentEntry), "types/runtime-types.d.ts"), "utf8");
  assert.match(types, /readonly inbox: Inbox;/u, "Agent no longer exposes the Inbox contract");
  assert.match(types, /splice\(target: InboxTarget, start: number, deleteCount: number, inserted: UserMessage\[\]\): UserMessage\[\];/u,
    "public Inbox splice signature changed");
  const inbox = loop.slice(loop.indexOf("var ReactLoopInbox = class {"),
    loop.indexOf("\n};", loop.indexOf("var ReactLoopInbox = class {")));
  ordered(inbox, ["splice(target, start, deleteCount, inserted) {",
    "return this.mutate(target, start, deleteCount, inserted, true);",
    "mutate(target, start, deleteCount, inserted, discardRemoved) {",
    'this.session.append("agent/inbox/spliced", splice)']);
  assert.doesNotMatch(inbox, /this\.send\(/u,
    "direct public Inbox mutation no longer bypasses Agent.send; revise the admission plan");
  assert.doesNotMatch(inbox.slice(inbox.indexOf("mutate(target, start, deleteCount, inserted, discardRemoved) {")),
    /this\.splice\(/u, "runtime-callable Inbox.mutate now routes through splice; revise seam evidence");
});

test("pinned DSH Web loads alternate Agent writers outside SessionController", async () => {
  const [base, web, standard, presets, goal, command, plan, subagent, runner] = await Promise.all([
    pinnedPackageFile("@deepseek-ai/dsh-base", "cordis.patch.yml"),
    pinnedPackageFile("@deepseek-ai/dsh-web-app", "cordis.patch.yml"),
    pinnedPackageFile("@deepseek-ai/dsh-agent-presets", "presets/standard/agent.cordis.yml"),
    pinnedSource("@deepseek-ai/dsh-agent-presets"),
    pinnedSource("@deepseek-ai/dsh-goal-round-driver"),
    pinnedSource("@deepseek-ai/dsh-command-goal"),
    pinnedSource("@deepseek-ai/dsh-plan-mode"),
    pinnedSource("@deepseek-ai/dsh-subagent"),
    pinnedSource("@deepseek-ai/dsh-cordis-host-runner"),
  ]);
  assert.match(base, /^\s*- id: goal-round-driver\n\s+name:/mu);
  assert.doesNotMatch(web, /^\s*- id: goal-round-driver$/mu);
  const restrictedWeb = await readFile(new URL("../config/read-only.patch.yml", import.meta.url), "utf8");
  assert.match(restrictedWeb, /^\s*- id: goal-round-driver\n\s+disabled: true$/mu);
  for (const plugin of ["cordis-host-runner", "subagent", "subagent-spawn-in-process",
    "subagent-fork-in-process"]) {
    assert.match(restrictedWeb, new RegExp(`^\\s*- id: ${plugin}\\n\\s+disabled: true$`, "mu"));
  }
  assert.match(web, /^\s*- id: command-goal\n\s+disabled: true$/mu);
  assert.match(web, /^\s*- id: plan-mode\n\s+disabled: true$/mu);
  assert.match(standard, /^\s*- id: command-goal\n\s+name:/mu);
  assert.match(standard, /^\s*- id: plan-mode\n\s+name:/mu);
  assert.match(base, /^\s*- id: subagent\n\s+name:/mu);
  assert.match(web, /^\s*- id: cordis-host-runner\n\s+name:/mu);
  assert.match(web, /^\s*default: standard$/mu);
  assert.match(presets, /includeUserRoot: z\.boolean\(\)\.default\(true\)/u);

  assert.match(goal, /agent\.followup\(message\)/u);
  assert.match(command, /invocation\.agent\.followup\(createUserMessage\(/u);
  assert.match(plan, /agent\.steer\(createUserMessage\(/u);
  assert.match(subagent, /this\.agent\.steer\(message\)/u);
  assert.match(subagent, /parent\.inject\(message\)/u);
  assert.match(runner, /agent\.steer\(createUserMessage\(/u);
  assert.match(runner, /agent\.inject\(createUserMessage\(/u);
});
