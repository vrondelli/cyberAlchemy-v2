import assert from "node:assert/strict";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {MessageChannel} from "node:worker_threads";

import {createDshWebGatewayJournalWorker, waitForGatewayWorkerResponse}
  from "../src/web-gateway-journal-worker.mjs";
import {createFileGatewaySessionStore}
  from "../../codex-app-server-wrapper/src/gateway-session-store.mjs";
import {prepareAreRepositoryWebPrompt} from "../src/web-prompt-permit.mjs";

test("synchronous journal response accepts a worker notification before wait begins", () => {
  const {port1, port2} = new MessageChannel();
  try {
    const flag = new Int32Array(new SharedArrayBuffer(4));
    port2.postMessage({ok: true, value: {journal_head: "pre-signalled"}});
    Atomics.store(flag, 0, 1);
    const result = waitForGatewayWorkerResponse(port1, flag, 100);
    assert.equal(result.status, "not-equal");
    assert.equal(result.signalled, true);
    assert.deepEqual(result.response, {ok: true, value: {journal_head: "pre-signalled"}});
  } finally {
    port1.close();
    port2.close();
  }
});

test("ARE journal worker is the only file writer across compaction and reopen", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-dsh-journal-worker-"));
  const path = join(directory, "gateway.jsonl");
  const storeId = "gateway-store:dsh-worker-test";
  let worker;
  try {
    worker = await createDshWebGatewayJournalWorker({path, store_id: storeId});
    assert.notEqual(worker.gateway_process_id, process.pid);
    const input = {session_id: "dsh:worker-test", request_id: "gateway-process-request",
      content: [{type: "text", text: "explain this architecture"}]};
    assert.deepEqual(await worker.prepare(input), prepareAreRepositoryWebPrompt(input));
    await assert.rejects(worker.prepare({...input, content: [{type: "image", url: "invalid"}]}),
      /gateway-preparation-denied/u);
    assert.throws(() => createFileGatewaySessionStore({path, store_id: storeId}),
      /gateway\.session-store-writer-lock-held/u);
    assert.match(worker.inspect().durability, /^append-only-file-fsync/u);
    for (let attempt = 0; attempt < 32; attempt++) {
      assert.equal(worker.inspect().store_id, storeId,
        "A signaled synchronous response must remain readable across repeated calls.");
    }
    assert.equal(worker.append({event_kind: "session-started", consumer_id: "dsh:worker-test",
      content: {lane: "interaction-bound", backend_adapter_id: "deepseek-harness-web/are-v1",
        resume_token_digest: "a".repeat(64)}}).ok, true);
    assert.equal(worker.getSession("dsh:worker-test").backend_adapter_id,
      "deepseek-harness-web/are-v1");
    assert.equal(worker.compact().ok, true);
    await worker.close();
    worker = await createDshWebGatewayJournalWorker({path, store_id: storeId});
    assert.equal(worker.getSession("dsh:worker-test").backend_adapter_id,
      "deepseek-harness-web/are-v1");
    assert.equal(worker.inspect().sessions.length, 1);
  } finally {
    await worker?.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("ARE gateway-process loss closes journal and preparation admission", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-dsh-gateway-process-loss-"));
  const path = join(directory, "gateway.jsonl");
  let fatalResolve;
  const fatal = new Promise((resolve) => {fatalResolve = resolve;});
  let worker;
  try {
    worker = await createDshWebGatewayJournalWorker({path,
      store_id: "gateway-store:dsh-process-loss", on_fatal: fatalResolve});
    const gatewayProcessId = worker.gateway_process_id;
    assert.notEqual(gatewayProcessId, process.pid);
    process.kill(gatewayProcessId, "SIGTERM");
    assert.match(await Promise.race([fatal, new Promise((_, reject) =>
      setTimeout(() => reject(new Error("gateway process loss not observed")), 5_000))]),
    /gateway-process-exited/u);
    assert.throws(() => worker.inspect(), /gateway-process-exited/u);
    await assert.rejects(worker.prepare({session_id: "dsh:loss", request_id: "prompt",
      content: [{type: "text", text: "explain this architecture"}]}),
    /gateway-process-exited/u);
  } finally {
    await worker?.close();
    rmSync(directory, {recursive: true, force: true});
  }
});

test("ARE preparation IPC rejects oversized and excess requests without faulting its writer", async () => {
  const directory = mkdtempSync(join(tmpdir(), "are-dsh-gateway-capacity-"));
  let worker;
  try {
    worker = await createDshWebGatewayJournalWorker({path: join(directory, "gateway.jsonl"),
      store_id: "gateway-store:dsh-capacity-test"});
    const input = {session_id: "dsh:capacity", request_id: "request",
      content: [{type: "text", text: "explain this architecture"}]};
    await assert.rejects(worker.prepare({...input,
      content: [{type: "text", text: "x".repeat(512 * 1024)}]}),
    /gateway-preparation-input-too-large-or-invalid/u);
    const circular = {...input};
    circular.content = circular;
    await assert.rejects(worker.prepare(circular), /gateway-preparation-input-too-large-or-invalid/u);
    const pending = Array.from({length: 16}, (_, index) => worker.prepare({
      ...input, request_id: `request-${index}`}));
    await assert.rejects(worker.prepare({...input, request_id: "request-over-capacity"}),
      /gateway-preparation-capacity-exceeded/u);
    const results = await Promise.allSettled(pending);
    assert.equal(results.every((result) => result.status === "fulfilled"), true);
    assert.equal(worker.inspect().durability.startsWith("append-only-file-fsync"), true);
    assert.deepEqual(await worker.prepare(input), prepareAreRepositoryWebPrompt(input));
  } finally {
    await worker?.close();
    rmSync(directory, {recursive: true, force: true});
  }
});
