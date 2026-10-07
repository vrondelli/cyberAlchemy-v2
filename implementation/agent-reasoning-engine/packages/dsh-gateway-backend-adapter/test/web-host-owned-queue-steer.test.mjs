import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {assertOwnedModelContexts} from "./fixtures/owned-model-context.mjs";
import {fullHostPlanFixture, replaceHostPlanFixture} from "./fixtures/host-plan-selection.mjs";
import {verifyReasoningStateLog} from "../../reasoning-state-runtime/index.mjs";

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./fixtures/web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../config/dsh-web-are-host-owned-canary-graph-manifest.v1.json", import.meta.url));

for (const [selectedPlan, research, replacePlan] of [[false, false], [true, false], [true, true], [true, true, true]]) {
test(`authenticated Web queue and direct steering consume three prompts in one turn and resume ${selectedPlan ? "with all 30 integration/UI obligations" : "without plan selection"}${research ? ' using v3 Research batches' : ''}${replacePlan ? ' replacing all three retained objectives' : ''}`,
  {timeout: 420_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-web-queue-steer-"));
    const plan = selectedPlan ? fullHostPlanFixture(home) : null;
    let providerRequests = 0;
    const providerBodies = [];
    let heldResponse;
    let heldSecond;
    const mock = createServer(async (request, response) => {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      assert.deepEqual(body.tools ?? [], []);
      providerRequests += 1;
      providerBodies.push(body);
      response.writeHead(200, {"content-type": "text/event-stream"});
      if (providerRequests <= 2) {
        if (providerRequests === 1) heldResponse = response;
        else heldSecond = response;
        response.write(": waiting for steering\n\n");
      } else {
        const chunk = {id: "are-local-steered", object: "chat.completion.chunk",
          model: body.model, choices: [{index: 0,
            delta: {role: "assistant", content: "steered prompt done"}, finish_reason: "stop"}]};
        response.end(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`);
      }
    });
    let child;
    let restarted;
    try {
      await new Promise((resolve, reject) => {
        mock.once("error", reject);
        mock.listen(0, "127.0.0.1", resolve);
      });
      const env = {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
        ARE_DSH_USE_JOURNAL_WORKER: "1",
        ARE_DSH_TEST_PLAN_SELECTION: JSON.stringify(plan?.descriptor ?? null),
        ARE_DSH_HOST_MANIFEST: manifest,
        ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`,
        ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"};
      child = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"], env});
      let stdout = "";
      let stderr = "";
      const pending = new Map();
      let ready;
      child.stdout.on("data", (chunk) => {stdout = (stdout + chunk).slice(-4096);});
      child.stderr.on("data", (chunk) => {stderr = (stderr + chunk).slice(-4096);});
      child.on("message", (message) => {
        if (message?.schema_version !== schema) return;
        if (["ready", "fatal"].includes(message.kind)) ready = message;
        if (message.kind === "response") {
          pending.get(message.request_key)?.(message.result);
          pending.delete(message.request_key);
        }
      });
      const command = (key, kind, extra = {}) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => {pending.delete(key); reject(new Error(`${kind} timed out: ${stderr}`));}, 30_000);
        pending.set(key, (result) => {clearTimeout(timer); resolve(result);});
        child.send({schema_version: schema, request_key: key, command: kind, ...extra});
      });
      const deadline = Date.now() + 240_000;
      while (!ready && child.exitCode === null && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(ready?.kind, "ready", ready?.reason_code ?? stderr);
      const webUrl = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      assert.ok(webUrl, "qualified Host did not publish a loopback Web URL");
      const url = new URL(webUrl);
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `Web token exchange failed: ${login.status}`);
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      const created = await rpc("create", {workspaceId: ready.workspace_id}, "steer-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const sessionId = created.result.value.sessionId;
      const first = await rpc("prompt", {sessionId, requestId: "steer-first", mode: "queue",
        content: [{type: "text", text: research ? 'Research runtime recovery.' : "explain ARE routing architecture"}]}, "steer-first-rpc");
      assert.equal(first.result?.ok, true, JSON.stringify(first.result));
      const modelDeadline = Date.now() + 30_000;
      while (providerRequests === 0 && Date.now() < modelDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(providerRequests, 1);
      const second = await rpc("prompt", {sessionId, requestId: "steer-second", mode: "queue",
        content: [{type: "text", text: research ? 'New task: Research adapter lifecycle.' : "New task: explain the steered followup"}]}, "steer-second-rpc");
      assert.equal(second.result?.ok, true, JSON.stringify(second.result));
      const before = await command("steer-before", "session-state", {session_id: sessionId});
      assert.equal(before.pending_queue_item_ids.length, 1);
      const itemId = before.pending_queue_item_ids[0];
      const steered = await rpc("updateQueue", {sessionId, itemId,
        action: {kind: "steer"}}, "steer-update-rpc");
      assert.equal(steered.result?.ok, true, JSON.stringify(steered.result));
      const after = await command("steer-after", "session-state", {session_id: sessionId});
      assert.deepEqual(after.pending_queue_item_ids, []);
      assert.deepEqual(after.pending_next_step_item_ids, [itemId]);
      assert.equal(after.queue_steer_requests.length, 1);
      assert.equal(after.queue_steer_observations.length, 1);
      const chunk = {id: "are-local-first", object: "chat.completion.chunk", model: "local",
        choices: [{index: 0, delta: {role: "assistant", content: "first done"},
          finish_reason: "stop"}]};
      heldResponse.end(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`);
      const secondDeadline = Date.now() + 30_000;
      while (providerRequests < 2 && Date.now() < secondDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(providerRequests, 2);
      const direct = await rpc("prompt", {sessionId, requestId: "steer-direct-third", mode: "steer",
        content: [{type: "text", text: research ? 'New task: Research runtime recovery.' : "New task: explain the direct steering followup"}]},
      "steer-direct-third-rpc");
      assert.equal(direct.result?.ok, true, JSON.stringify(direct.result));
      const directPending = await command("direct-pending", "session-state", {session_id: sessionId});
      assert.equal(directPending.pending_next_step_item_ids.length, 1);
      const secondChunk = {id: "are-local-second", object: "chat.completion.chunk", model: "local",
        choices: [{index: 0, delta: {role: "assistant", content: "second done"},
          finish_reason: "stop"}]};
      heldSecond.end(`data: ${JSON.stringify(secondChunk)}\n\ndata: [DONE]\n\n`);
      let settled;
      const turnDeadline = Date.now() + 30_000;
      while (Date.now() < turnDeadline) {
        settled = await command(`steer-settled-${Date.now()}`, "session-state", {session_id: sessionId});
        if (settled.turn_end_count === 1 && settled.terminal_observations.length === 3) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(settled?.turn_end_count, 1);
      assert.equal(settled.user_message_count, 3);
      assert.equal(settled.terminal_observations.length, 3);
      assert.equal(providerRequests, 3);
      assert.match(JSON.stringify(providerBodies[1]), research ? /Research adapter lifecycle/u : /explain the steered followup/u);
      assert.match(JSON.stringify(providerBodies[2]), research ? /Research runtime recovery/u : /explain the direct steering followup/u);
      if (research) {
        assert.match(JSON.stringify(providerBodies[0]), /are\.dsh-web-model-context\/v3/);
        assert.match(JSON.stringify(providerBodies[1]), /are\.dsh-web-model-context-batch\/v3/);
        assert.match(JSON.stringify(providerBodies[2]), /are\.dsh-web-model-context-batch\/v3/);
      }
      const joined = assertOwnedModelContexts(settled, providerBodies);
      assert.equal(new Set(joined.map(item => item.preparation.objective_checkpoint.checkpoint_digest)).size, 3);
      if (selectedPlan) {
        assert.ok(joined.every(item => item.context.objective.requirement_snapshot.requirements.length === 30));
        assert.ok(joined.every(item => item.context.objective.plan_context.feature_obligations.length === 30));
        assert.deepEqual(joined.map(item => item.context.objective.plan_context.unresolved_decisions),
          Array(3).fill(plan.selection.unresolved_decisions));
        assert.deepEqual(joined[1].context.objective.plan_context, joined[2].context.objective.plan_context);
        assert.equal(new Set(joined.map(item => item.context.objective.active_objective.objective_id)).size, 3,
          "sharing the parent plan must not merge three independently resolved objectives");
      } else assert.ok(joined.every(item => item.context.objective.requirement_snapshot === null));
      assert.equal((await command("steer-drain", "dispose-agent", {session_id: sessionId})).binding_status,
        "draining");
      assert.equal((await command("steer-release", "release-agent", {session_id: sessionId})).binding_status,
        "released");
      assert.equal((await command("steer-compact", "compact-gateway")).ok, true);
      const exited = once(child, "exit");
      assert.deepEqual(await command("steer-stop", "dispose"), {disposed: true});
      await exited;
      if (replacePlan) {
        const retained = verifyReasoningStateLog(join(home, 'gateway.jsonl.objectives.jsonl'));
        assert.equal(retained.ok, true);
        const continuity = retained.value.records.filter(row => row.record_kind === 'reasoning-state-event'
          && row.value.event_kind === 'objective-transition-resolved').at(-1).value.content.requirement_continuity;
        assert.equal(continuity.snapshots.length, 3);
        assert.deepEqual(new Set(continuity.snapshots.map(row => row.objective_id)),
          new Set(joined.map(row => row.context.objective.active_objective.objective_id)));
        const parent = 'Disposable full-scope parent replacement across three retained native objectives.\n';
        const hash = createHash('sha256').update(parent).digest('hex');
        await writeFile(join(home, 'replacement-parent.md'), parent);
        const replaced = replaceHostPlanFixture(home, plan, joined.at(-1).context.objective.plan_context, continuity,
          {parent_plan_ref: 'replacement-parent.md', parent_plan_digest: hash,
            source_refs: plan.selection.source_refs.map(row => row.source_ref === plan.selection.parent_plan_ref
              ? {source_ref: 'replacement-parent.md', source_digest: hash} : row),
            feature_obligations: plan.selection.feature_obligations.map((row, index, all) => index === all.length - 1
              ? {...row, summary: 'Preserve Appearance skins, placement and low-resource desktop behavior.'} : row)});
        Object.assign(plan, replaced);
        env.ARE_DSH_TEST_PLAN_SELECTION = JSON.stringify(replaced.descriptor);
      }
      restarted = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"], env});
      let restartError = "";
      let restartStdout = "";
      restarted.stdout.on("data", chunk => {restartStdout = (restartStdout + chunk).slice(-4096);});
      restarted.stderr.on("data", (chunk) => {restartError = (restartError + chunk).slice(-4096);});
      const restartedReady = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`restart timed out: ${restartError}`)), 240_000);
        restarted.on("message", (message) => {
          if (message?.schema_version !== schema || !["ready", "fatal"].includes(message.kind)) return;
          clearTimeout(timer);
          resolve(message);
        });
        restarted.on("exit", (code, signal) => {
          clearTimeout(timer);
          reject(new Error(`restart exited ${code ?? signal}: ${restartError}`));
        });
      });
      assert.equal(restartedReady.kind, "ready", restartedReady.reason_code ?? restartError);
      const resumed = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`resume timed out: ${restartError}`)), 120_000);
        restarted.on("message", (message) => {
          if (message?.schema_version !== schema || message.kind !== "response"
            || message.request_key !== "steer-resume") return;
          clearTimeout(timer);
          resolve(message.result);
        });
        restarted.send({schema_version: schema, request_key: "steer-resume",
          command: "resume-agent", session_id: sessionId});
      });
      assert.equal(resumed.resumed?.sessionId, sessionId, resumed.reason_code);
      assert.equal(resumed.resumed?.generation, 2);
      const restartedCommand = (request_key, command, extra = {}) => new Promise((resolve, reject) => {
        const finish = message => {
          if (message?.schema_version !== schema || message.kind !== "response" || message.request_key !== request_key) return;
          clearTimeout(timer); restarted.off("message", finish); resolve(message.result);
        };
        const timer = setTimeout(() => {restarted.off("message", finish); reject(new Error(`${command} timed out`));}, 30_000);
        restarted.on("message", finish);
        restarted.send({schema_version: schema, request_key, command, ...extra});
      });
      if (selectedPlan) {
        const restartedUrl = new URL(restartStdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1]);
        const restartedCookie = (await fetch(restartedUrl, {redirect: "manual"})).headers.get("set-cookie")?.split(";", 1)[0];
        assert.ok(restartedCookie);
        const response = await fetch(new URL("/api/session/prompt", restartedUrl), {
          method: "POST", headers: {"content-type": "application/json", cookie: restartedCookie, origin: restartedUrl.origin},
          body: JSON.stringify({type: "client-request", rpcId: "full-plan-resumed-continue", method: "session/prompt",
            payload: {args: {request: {sessionId, requestId: "full-plan-resumed-continue", mode: "queue",
              content: [{type: "text", text: "continue"}]}}}}),
        });
        assert.equal(response.status, 200);
        const result = await response.json(); assert.equal(result.result?.ok, true,
          `${JSON.stringify(result.result)}; native fixture: ${restartError}`);
        const deadline = Date.now() + 30_000;
        let resumedState;
        while (Date.now() < deadline) {
          resumedState = await restartedCommand(`full-plan-resumed-${Date.now()}`, "session-state", {session_id: sessionId});
          if (resumedState.turn_end_count === 2 && providerRequests === 4) break;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        assert.equal(providerRequests, 4, "fresh Host must dispatch only the new continuation");
        assert.equal(resumedState?.turn_end_count, 2);
        const recovered = assertOwnedModelContexts(resumedState, providerBodies);
        assert.equal(recovered.at(-1).context.objective.active_objective.objective_id,
          joined.at(-1).context.objective.active_objective.objective_id);
        if (replacePlan) {
          const successor = recovered.at(-1).context.objective.plan_context;
          assert.equal(successor.previous_plan_context_digest, joined.at(-1).context.objective.plan_context.plan_context_digest);
          assert.equal(successor.parent_plan_ref, 'replacement-parent.md');
          assert.deepEqual(successor.feature_obligations, plan.selection.feature_obligations);
          assert.deepEqual(recovered.at(-1).context.objective.requirement_snapshot.requirements,
            plan.selection.feature_obligations.map(row => row.summary).sort());
          const retained = verifyReasoningStateLog(join(home, 'gateway.jsonl.objectives.jsonl'));
          assert.equal(retained.ok, true);
          const migrations = retained.value.records.filter(row => row.record_kind === 'reasoning-state-event'
            && row.value.event_kind === 'plan-requirements-migrated');
          assert.equal(migrations.length, 1, 'startup replacement must not emit one migration per model or redispatch');
          const migration = migrations[0].value.content.migration;
          assert.equal(migration.schema_version, 'are.plan-requirement-migration/v2');
          assert.equal(migration.next_continuity.snapshots.length, 3);
          assert.deepEqual(new Set(migration.next_continuity.snapshots.map(row => row.objective_id)),
            new Set(joined.map(row => row.context.objective.active_objective.objective_id)));
          assert.ok(migration.next_continuity.snapshots.every(row =>
            JSON.stringify(row.requirements) === JSON.stringify(plan.selection.feature_obligations.map(row => row.summary).sort())));
          assert.equal(resumedState.user_message_count, 4, 'migration is not an extra native user turn');
        } else assert.deepEqual(recovered.at(-1).context.objective.plan_context, joined.at(-1).context.objective.plan_context);
        assert.equal(recovered.at(-1).context.objective.requirement_snapshot.requirements.length, 30);
        const checkpoint = recovered.at(-1).preparation.objective_checkpoint;
        assert.equal(checkpoint.schema_version, 'are.dsh-objective-checkpoint-observation/v3');
        assert.equal(checkpoint.plan_progress.obligation_count, 30);
        assert.equal(checkpoint.plan_progress.open_decision_count, recovered.at(-1).context.objective.plan_context.unresolved_decisions.length);
        assert.equal(checkpoint.plan_progress.completed_count,
          recovered.at(-1).context.objective.plan_context.feature_obligations.filter(row => row.status === 'completed').length);
      }
      assert.equal((await restartedCommand("final-resume-drain", "dispose-agent", {session_id: sessionId})).binding_status, "draining");
      assert.equal((await restartedCommand("final-resume-release", "release-agent", {session_id: sessionId})).binding_status, "released");
      const restartedExited = once(restarted, "exit");
      assert.deepEqual(await restartedCommand("final-resume-stop", "dispose"), {disposed: true});
      await restartedExited;
    } finally {
      if (child?.exitCode === null) child.kill("SIGTERM");
      if (restarted?.exitCode === null) restarted.kill("SIGTERM");
      heldResponse?.destroy();
      heldSecond?.destroy();
      mock.closeAllConnections();
      await new Promise((resolve) => mock.close(resolve));
      await rm(home, {recursive: true, force: true});
    }
  });
}

test("authenticated Web cancellation aborts a turn after steering was consumed",
  {timeout: 300_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-web-steer-cancel-"));
    let providerRequests = 0;
    const providerBodies = [];
    let heldFirst;
    let heldSecond;
    const mock = createServer(async (request, response) => {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      providerBodies.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      providerRequests += 1;
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.write(": waiting for cancellation\n\n");
      if (providerRequests === 1) heldFirst = response;
      else heldSecond = response;
    });
    let child;
    try {
      await new Promise((resolve, reject) => {
        mock.once("error", reject);
        mock.listen(0, "127.0.0.1", resolve);
      });
      child = fork(fixture, [], {execArgv: [], stdio: ["ignore", "pipe", "pipe", "ipc"],
        env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
          ARE_DSH_USE_JOURNAL_WORKER: "1",
          ARE_DSH_HOST_MANIFEST: manifest,
          ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${mock.address().port}/v1`,
          ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret"}});
      let stdout = "";
      let stderr = "";
      let ready;
      const pending = new Map();
      child.stdout.on("data", (chunk) => {stdout = (stdout + chunk).slice(-4096);});
      child.stderr.on("data", (chunk) => {stderr = (stderr + chunk).slice(-4096);});
      child.on("message", (message) => {
        if (message?.schema_version !== schema) return;
        if (["ready", "fatal"].includes(message.kind)) ready = message;
        if (message.kind === "response") {
          pending.get(message.request_key)?.(message.result);
          pending.delete(message.request_key);
        }
      });
      const command = (key, kind, extra = {}) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => {pending.delete(key); reject(new Error(`${kind} timed out: ${stderr}`));}, 30_000);
        pending.set(key, (result) => {clearTimeout(timer); resolve(result);});
        child.send({schema_version: schema, request_key: key, command: kind, ...extra});
      });
      const startupDeadline = Date.now() + 240_000;
      while (!ready && child.exitCode === null && Date.now() < startupDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(ready?.kind, "ready", ready?.reason_code ?? stderr);
      const webUrl = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      assert.ok(webUrl);
      const url = new URL(webUrl);
      const cookie = (await fetch(url, {redirect: "manual"})).headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie);
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      const created = await rpc("create", {workspaceId: ready.workspace_id}, "cancel-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const sessionId = created.result.value.sessionId;
      assert.equal((await rpc("prompt", {sessionId, requestId: "cancel-first", mode: "queue",
        content: [{type: "text", text: "explain ARE routing architecture"}]}, "cancel-first-rpc")).result?.ok, true);
      const firstDeadline = Date.now() + 30_000;
      while (providerRequests < 1 && Date.now() < firstDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(providerRequests, 1);
      assert.equal((await rpc("prompt", {sessionId, requestId: "cancel-second", mode: "queue",
        content: [{type: "text", text: "New task: explain the steered followup"}]}, "cancel-second-rpc")).result?.ok, true);
      const queued = await command("cancel-queued", "session-state", {session_id: sessionId});
      const itemId = queued.pending_queue_item_ids[0];
      assert.ok(itemId);
      assert.equal((await rpc("updateQueue", {sessionId, itemId,
        action: {kind: "steer"}}, "cancel-steer-rpc")).result?.ok, true);
      const firstChunk = {id: "are-local-before-cancel", object: "chat.completion.chunk", model: "local",
        choices: [{index: 0, delta: {role: "assistant", content: "first done"},
          finish_reason: "stop"}]};
      heldFirst.end(`data: ${JSON.stringify(firstChunk)}\n\ndata: [DONE]\n\n`);
      const secondDeadline = Date.now() + 30_000;
      while (providerRequests < 2 && Date.now() < secondDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(providerRequests, 2);
      const cancelled = await rpc("cancel", {sessionId}, "cancel-after-steer-rpc");
      assert.equal(cancelled.result?.ok, true, JSON.stringify(cancelled.result));
      let settled;
      const terminalDeadline = Date.now() + 30_000;
      while (Date.now() < terminalDeadline) {
        settled = await command(`cancel-settled-${Date.now()}`, "session-state", {session_id: sessionId});
        if (settled.turn_end_count === 1 && settled.terminal_observations.length === 2) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      assert.equal(settled?.turn_end_count, 1);
      assert.equal(settled.user_message_count, 2);
      assert.equal(settled.terminal_observations.length, 2);
      assert.ok(settled.terminal_observations.every((item) => item.turn_status === "interrupted"));
      assert.equal(settled.cancel_requests.length, 1);
      assert.equal(settled.cancel_requests[0].status, "complete");
      assert.equal(settled.cancel_requests[0].target_request_key, `${sessionId}:cancel-first`);
      assert.equal(providerRequests, 2);
      assertOwnedModelContexts(settled, providerBodies);
      assert.equal((await command("cancel-drain", "dispose-agent", {session_id: sessionId})).binding_status,
        "draining");
      assert.equal((await command("cancel-release", "release-agent", {session_id: sessionId})).binding_status,
        "released");
      assert.equal((await command("cancel-compact", "compact-gateway")).ok, true);
    } finally {
      if (child?.exitCode === null) child.kill("SIGTERM");
      heldFirst?.destroy();
      heldSecond?.destroy();
      mock.closeAllConnections();
      await new Promise((resolve) => mock.close(resolve));
      await rm(home, {recursive: true, force: true});
    }
  });
