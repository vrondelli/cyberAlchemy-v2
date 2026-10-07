import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync} from "node:fs";
import {createConnection} from "node:net";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {ACKNOWLEDGED_CONTINUITY_MODE, GATEWAY_CONNECT_SCHEMA, GATEWAY_REQUEST_META_KEY, REQUEST_CONTEXT_KEY} from "../index.mjs";
import {verifyReasoningStateLog} from "../../reasoning-state-runtime/index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const gatewayBin = resolve(packageRoot, "bin/are-codex-gateway.mjs");
const profileSource = resolve(packageRoot, "profiles/repository-v1.json");
const learningProfileSource = resolve(packageRoot, "profiles/interaction-learning-canary-v1.json");
const catalogFixtureBinary = process.env.ARE_TEST_CODEX_BINARY ?? "/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex";
const catalogFixtureSkip = process.platform === "win32" ? "POSIX socket fixture"
  : !existsSync(catalogFixtureBinary) ? "Pinned Codex schema fixture unavailable" : false;

async function waitForRecord(records, predicate, child) {
  // Schema verification starts another Codex process and can exceed five seconds
  // when the full wrapper suite runs its process-heavy tests concurrently.
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const match = records.find(predicate);
    if (match) return match;
    if (child.exitCode !== null || child.signalCode !== null) break;
    await new Promise((done) => setTimeout(done, 10));
  }
  throw new Error(`Gateway record not observed: ${JSON.stringify(records)}`);
}

async function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await once(child, "exit");
}

test("gateway refuses a same-version host with schema drift before opening its socket", {skip: process.platform === "win32" ? "POSIX socket fixture" : false}, async () => {
  const directory = mkdtempSync("/tmp/are-gateway-catalog-drift-");
  const fakeCodexPath = resolve(directory, "fake-codex.mjs");
  const socketPath = resolve(directory, "gateway.sock");
  writeFileSync(fakeCodexPath, `import {writeFileSync} from "node:fs";
if (process.argv.includes("--version")) process.stdout.write("codex-cli 0.155.0-alpha.16.4\\n");
else if (process.argv.includes("generate-json-schema")) {
  const output = process.argv[process.argv.indexOf("--out") + 1];
  writeFileSync(output + "/ClientRequest.json", "{}\\n");
}
`);
  const child = spawn(process.execPath, [gatewayBin, "--listen", socketPath, "--development-live", "--config", profileSource,
    "--repository-root", repositoryRoot, "--backend", "direct-stdio", "--codex-command", process.execPath,
    "--codex-prefix-arg", fakeCodexPath, "--session-store", resolve(directory, "sessions.jsonl")],
  {stdio: ["ignore", "ignore", "pipe"]});
  const records = [];
  let stderrBuffer = "";
  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString("utf8");
    let index;
    while ((index = stderrBuffer.indexOf("\n")) >= 0) {
      const line = stderrBuffer.slice(0, index);
      stderrBuffer = stderrBuffer.slice(index + 1);
      try { records.push(JSON.parse(line)); } catch { records.push({unparsed: line}); }
    }
  });
  try {
    const failure = await waitForRecord(records,
      (record) => record.reason === "gateway.host-method-catalog-verification-failed", child);
    assert.equal(failure.verification.reason, "host.method-catalog-schema-drift:ClientRequest.json");
    assert.equal(failure.authority_effect, "none");
    await waitForExit(child);
    assert.equal(child.exitCode, 4);
    assert.equal(existsSync(socketPath), false);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await waitForExit(child);
    rmSync(directory, {recursive: true, force: true});
  }
});

test("learning-enabled gateway refuses to start without hosted input attestation", {skip: catalogFixtureSkip}, async () => {
  const directory = mkdtempSync("/tmp/are-gateway-learning-attestation-");
  const fakeCodexPath = resolve(directory, "fake-codex.mjs");
  const socketPath = resolve(directory, "gateway.sock");
  writeFileSync(fakeCodexPath, `import {execFileSync} from "node:child_process";
if (process.argv.includes("--version")) process.stdout.write("codex-cli 0.155.0-alpha.16.4\\n");
else if (process.argv.includes("generate-json-schema")) execFileSync(${JSON.stringify(catalogFixtureBinary)}, process.argv.slice(2));
`);
  chmodSync(fakeCodexPath, 0o700);
  const environment = {...process.env};
  delete environment.ARE_HOSTED_INPUT_ATTESTATION_KEY;
  const child = spawn(process.execPath, [gatewayBin, "--listen", socketPath, "--development-live", "--config", learningProfileSource,
    "--repository-root", repositoryRoot, "--backend", "direct-stdio", "--codex-command", process.execPath,
    "--codex-prefix-arg", fakeCodexPath, "--session-store", resolve(directory, "sessions.jsonl")],
  {env: environment, stdio: ["ignore", "ignore", "pipe"]});
  const records = [];
  let stderrBuffer = "";
  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString("utf8");
    let index;
    while ((index = stderrBuffer.indexOf("\n")) >= 0) {
      const line = stderrBuffer.slice(0, index);
      stderrBuffer = stderrBuffer.slice(index + 1);
      try { records.push(JSON.parse(line)); } catch { records.push({unparsed: line}); }
    }
  });
  try {
    const failure = await waitForRecord(records,
      (record) => record.reason === "gateway.hosted-input-attestation-required", child);
    assert.equal(failure.authority_effect, "none");
    await waitForExit(child);
    assert.equal(child.exitCode, 12);
    assert.equal(existsSync(socketPath), false);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await waitForExit(child);
    rmSync(directory, {recursive: true, force: true});
  }
});

test("gateway Evolution intake requires both profile opt-in and a private absolute log", {skip: catalogFixtureSkip}, async () => {
  const directory = mkdtempSync("/tmp/are-gateway-evolution-startup-");
  const original = JSON.parse(readFileSync(profileSource, "utf8"));
  const enabledProfilePath = resolve(directory, "enabled-profile.json");
  const disabledProfilePath = resolve(directory, "disabled-profile.json");
  const fakeCodexPath = resolve(directory, "fake-codex.mjs");
  const inboxPath = resolve(directory, "evolution-signals.jsonl");
  writeFileSync(enabledProfilePath, `${JSON.stringify({...original, evolution_signals: {enabled: true, trigger: "turn/completed"}})}\n`);
  writeFileSync(disabledProfilePath, `${JSON.stringify(original)}\n`);
  writeFileSync(fakeCodexPath, `import {execFileSync} from "node:child_process";
if (process.argv.includes("--version")) process.stdout.write("codex-cli 0.155.0-alpha.16.4\\n");
else if (process.argv.includes("generate-json-schema")) execFileSync(${JSON.stringify(catalogFixtureBinary)}, process.argv.slice(2));
`);
  chmodSync(fakeCodexPath, 0o700);
  const run = (profilePath, withLog) => {
    const args = [gatewayBin, "--listen", resolve(directory, `gateway-${withLog ? "with" : "without"}-${profilePath === enabledProfilePath ? "enabled" : "disabled"}.sock`),
      "--development-live", "--config", profilePath, "--repository-root", repositoryRoot,
      "--backend", "direct-stdio",
      "--codex-command", process.execPath, "--codex-prefix-arg", fakeCodexPath,
      "--session-store", resolve(directory, "gateway-sessions.jsonl"),
      ...(withLog ? ["--evolution-signal-log", inboxPath] : [])];
    const child = spawn(process.execPath, args, {stdio: ["ignore", "ignore", "pipe"]});
    const records = [];
    let buffer = "";
    child.stderr.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        try { records.push(JSON.parse(line)); } catch { records.push({unparsed: line}); }
      }
    });
    return {child, records};
  };
  try {
    const disabled = run(disabledProfilePath, true);
    const disabledFailure = await waitForRecord(disabled.records, (record) => record.reason === "gateway.evolution-signals-disabled", disabled.child);
    assert.equal(disabledFailure.authority_effect, "none");
    await waitForExit(disabled.child);
    assert.equal(existsSync(inboxPath), false);

    const missing = run(enabledProfilePath, false);
    await waitForRecord(missing.records, (record) => record.reason === "gateway.evolution-signal-log-required", missing.child);
    await waitForExit(missing.child);
    assert.equal(existsSync(inboxPath), false);

    const enabled = run(enabledProfilePath, true);
    try {
      const ready = await waitForRecord(enabled.records, (record) => record.schema_version === "are.gateway-ready/v1", enabled.child);
      assert.equal(ready.evolution_signal_intake.status, "ready");
      assert.equal(ready.evolution_signal_intake.record_count, 0);
      assert.equal(existsSync(`${inboxPath}.writer.lock`), true);
    } finally {
      if (enabled.child.exitCode === null && enabled.child.signalCode === null) {
        const stopped = once(enabled.child, "close");
        enabled.child.kill("SIGTERM");
        await stopped;
      }
    }
    assert.equal(existsSync(`${inboxPath}.writer.lock`), false);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("opt-in gateway records one blocked-semantic Evolution signal from a loopback turn", {skip: catalogFixtureSkip}, async () => {
  const directory = mkdtempSync("/tmp/are-gateway-evolution-loopback-");
  const profile = JSON.parse(readFileSync(profileSource, "utf8"));
  profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
  profile.evolution_signals = {enabled: true, trigger: "turn/completed"};
  const profilePath = resolve(directory, "profile.json");
  const fakeCodexPath = resolve(directory, "fake-codex.mjs");
  const socketPath = resolve(directory, "gateway.sock");
  const inboxPath = resolve(directory, "signals.jsonl");
  writeFileSync(profilePath, `${JSON.stringify(profile)}\n`);
  writeFileSync(fakeCodexPath, `import {execFileSync} from "node:child_process";
import {createInterface} from "node:readline";
if (process.argv.includes("--version")) process.stdout.write("codex-cli 0.155.0-alpha.16.4\\n");
else if (process.argv.includes("generate-json-schema")) execFileSync(${JSON.stringify(catalogFixtureBinary)}, process.argv.slice(2));
else createInterface({input: process.stdin}).on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") process.stdout.write(JSON.stringify({jsonrpc: "2.0", id: message.id, result: {userAgent: "Codex Desktop/0.155.0-alpha.16.4 (fixture)", codexHome: "/fixture", platformFamily: "unix", platformOs: "linux"}}) + "\\n");
  else if (message.method === "thread/start") process.stdout.write(JSON.stringify({jsonrpc: "2.0", id: message.id, result: {thread: {id: "thread-evolution-loopback"}}}) + "\\n");
  else if (message.method === "turn/start") {
    process.stdout.write(JSON.stringify({jsonrpc: "2.0", id: message.id, result: {turn: {id: "turn-evolution-loopback", threadId: message.params.threadId}}}) + "\\n");
    setTimeout(() => process.stdout.write(JSON.stringify({jsonrpc: "2.0", method: "turn/completed", params: {threadId: message.params.threadId, turn: {id: "turn-evolution-loopback", status: "completed", items: []}}}) + "\\n"), 30);
  } else if (Object.hasOwn(message, "id")) process.stdout.write(JSON.stringify({jsonrpc: "2.0", id: message.id, result: {}}) + "\\n");
});
`);
  const child = spawn(process.execPath, [gatewayBin, "--listen", socketPath, "--development-live", "--config", profilePath,
    "--repository-root", repositoryRoot, "--backend", "direct-stdio", "--codex-command", process.execPath,
    "--codex-prefix-arg", fakeCodexPath, "--session-store", resolve(directory, "sessions.jsonl"),
    "--reasoning-state-dir", resolve(directory, "reasoning"), "--evolution-signal-log", inboxPath], {stdio: ["ignore", "ignore", "pipe"]});
  const records = [];
  let stderrBuffer = "";
  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString("utf8");
    let index;
    while ((index = stderrBuffer.indexOf("\n")) >= 0) {
      const line = stderrBuffer.slice(0, index);
      stderrBuffer = stderrBuffer.slice(index + 1);
      try { records.push(JSON.parse(line)); } catch { records.push({unparsed: line}); }
    }
  });
  let socket;
  try {
    await waitForRecord(records, (record) => record.schema_version === "are.gateway-ready/v1", child);
    socket = createConnection(socketPath);
    await once(socket, "connect");
    const clientMessages = [];
    let clientBuffer = "";
    socket.on("data", (chunk) => {
      clientBuffer += chunk.toString("utf8");
      let newline;
      while ((newline = clientBuffer.indexOf("\n")) >= 0) {
        clientMessages.push(JSON.parse(clientBuffer.slice(0, newline)));
        clientBuffer = clientBuffer.slice(newline + 1);
      }
    });
    socket.write(`${JSON.stringify({schema_version: GATEWAY_CONNECT_SCHEMA, consumer_id: "codex:human-chat", lane: "interaction-bound",
      continuity: {mode: ACKNOWLEDGED_CONTINUITY_MODE, last_acked_sequence: 0, request_aliases: []}})}\n`);
    socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 399, method: "initialize",
      params: {clientInfo: {name: "are-evolution-loopback", version: "1"}}})}\n`);
    const initializationDeadline = Date.now() + 5000;
    while (!clientMessages.some((entry) => entry.message?.id === 399 && entry.message?.result?.userAgent?.startsWith("Codex Desktop/0.155.0-alpha.16.4"))
      && Date.now() < initializationDeadline) await new Promise((done) => setTimeout(done, 10));
    assert.ok(clientMessages.some((entry) => entry.message?.id === 399 && entry.message?.result?.userAgent?.startsWith("Codex Desktop/0.155.0-alpha.16.4")),
      "Gateway must verify the disposable backend's reported version before thread work.");
    socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 400, method: "thread/start",
      params: {cwd: repositoryRoot, approvalPolicy: "on-request", sandbox: "read-only"},
      [GATEWAY_REQUEST_META_KEY]: {request_key: "thread:evolution-loopback"}})}\n`);
    const ownershipDeadline = Date.now() + 5000;
    while (!clientMessages.some((entry) => entry.message?.id === 400 && entry.message?.result?.thread?.id === "thread-evolution-loopback")
      && Date.now() < ownershipDeadline) await new Promise((done) => setTimeout(done, 10));
    assert.ok(clientMessages.some((entry) => entry.message?.id === 400 && entry.message?.result?.thread?.id === "thread-evolution-loopback"),
      "Gateway must own the disposable thread before the Evolution turn.");
    const hint = {schema_version: "are.request-context-hint/v1", raw_request: "Define a bounded reasoning epoch.", objective_kind: "define"};
    socket.write(`${JSON.stringify({jsonrpc: "2.0", id: 401, method: "turn/start", params: {threadId: "thread-evolution-loopback",
      input: [{type: "text", text: "Define a bounded reasoning epoch."}],
      approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"},
      additionalContext: {[REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(hint)}}},
      [GATEWAY_REQUEST_META_KEY]: {request_key: "turn:evolution-loopback"}})}\n`);
    const deadline = Date.now() + 5000;
    while ((!existsSync(inboxPath) || !readFileSync(inboxPath, "utf8").includes("reasoning-state-checkpoint")) && Date.now() < deadline) {
      await new Promise((done) => setTimeout(done, 20));
    }
    const log = existsSync(inboxPath) ? readFileSync(inboxPath, "utf8") : "";
    assert.match(log, /evolution.improvement-signal-candidate/, JSON.stringify(records));
    assert.doesNotMatch(log, /Define a bounded reasoning epoch/);
    const verified = verifyReasoningStateLog(inboxPath, {expected_ledger_id: "are-evolution-gateway-signal-inbox/v1"});
    assert.equal(verified.ok, true);
    assert.equal(verified.value.index.checkpoint_count, 1);
  } finally {
    socket?.destroy();
    if (child.exitCode === null && child.signalCode === null) {
      const stopped = once(child, "close");
      child.kill("SIGTERM");
      await stopped;
    }
    rmSync(directory, {recursive: true, force: true});
  }
});
