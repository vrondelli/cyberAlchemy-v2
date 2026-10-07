import assert from "node:assert/strict";
import {execFileSync, spawn} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {createHash} from 'node:crypto';
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {readAdapterObservation}
  from "../../codex-app-server-wrapper/src/adapter-observation-client.mjs";
import {hostPlanFixture, panelNames, advanceHostPlanFixture, fullHostPlanFixture, replaceHostPlanFixture} from "./fixtures/host-plan-selection.mjs";
import {verifyReasoningStateLog} from '../../reasoning-state-runtime/index.mjs';
import {recoverOwnedPlannedSingle} from './fixtures/owned-model-context.mjs';

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./fixtures/web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../config/dsh-web-are-host-owned-canary-graph-manifest.v1.json", import.meta.url));

for (const [ackLoss, selectedPlan, advancePlan, replacePlan, research] of [[false, false, false], [true, false, false], [false, true, false], [true, true, false], [true, true, true], [true, true, false, true], [true, true, false, true, true]]) {
test(`qualified Host-owned Web objective completes two native no-tool turns ${ackLoss ? "after ACK loss and fresh Host resume" : "with ACK"}${replacePlan ? " replacing the full 30-obligation parent plan" : advancePlan ? " advancing the selected parent plan" : selectedPlan ? " retaining the full selected parent plan" : " without plan selection"}${research ? ' with a v3 Research context' : ''}`,
  {timeout: 600_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-host-owned-turn-"));
    const plan = selectedPlan ? (replacePlan ? fullHostPlanFixture(home) : hostPlanFixture(home)) : null;
    let requests = 0;
    const modelContexts = [];
    const wireContexts = [];
    let providerError;
    let providerEnteredResolve;
    let releaseProvider;
    const providerEntered = new Promise(resolve => { providerEnteredResolve = resolve; });
    const providerReleased = new Promise(resolve => { releaseProvider = resolve; });
    const mock = createServer(async (request, response) => {
      try {
        assert.equal(request.method, "POST");
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        assert.deepEqual((body.tools ?? []).map((tool) => tool.function?.name ?? tool.name), []);
        assert.ok(body.messages.some((message) => message.role === "system"
          && /are\.dsh-web-model-context\/v[23]/.test(JSON.stringify(message))),
        "model request must contain the ARE-selected context");
        const contextText = body.messages.filter(message => message.role === "system")
          .flatMap(message => typeof message.content === "string" ? [message.content]
            : (message.content ?? []).map(part => part.text).filter(Boolean))
          .find(text => /are\.dsh-web-model-context\/v[23]/.test(text));
        assert.ok(Buffer.byteLength(contextText) <= 32768);
        const wire = JSON.parse(contextText);
        wireContexts.push(wire);
        modelContexts.push(recoverOwnedPlannedSingle(wire));
        requests += 1;
        if (!ackLoss) {
          providerEnteredResolve();
          await providerReleased;
        }
        const event = {id: "are-local-turn", object: "chat.completion.chunk", model: body.model,
          choices: [{index: 0, delta: {role: "assistant", content: "local qualified reply"},
            finish_reason: "stop"}],
          usage: {prompt_tokens: 8, completion_tokens: 5, total_tokens: 13}};
        response.writeHead(200, {"content-type": "text/event-stream"});
        response.end(`data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`);
      } catch (error) {
        providerError = error;
        response.writeHead(500).end();
      }
    });
    await new Promise((done, reject) => {
      mock.once("error", reject);
      mock.listen(0, "127.0.0.1", done);
    });
    const address = mock.address();
    const hostEnv = {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
      ARE_DSH_USE_JOURNAL_WORKER: "1",
      ARE_DSH_TEST_PLAN_SELECTION: JSON.stringify(plan?.descriptor ?? null),
      ARE_DSH_TEST_OBSERVATION: "1",
      ARE_ADAPTER_OBSERVATION_TOKEN: "dsh-native-preparation-ui-test-token-".repeat(2),
      ARE_DSH_HOST_MANIFEST: manifest,
      ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
      ARE_DSH_MOCK_API_KEY: "local-test-only-not-a-secret",
      ...(ackLoss ? {ARE_DSH_DROP_PROMPT_ACK: "1"} : {})};
    const child = spawn(process.execPath, [fixture], {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      detached: process.platform !== "win32",
      env: hostEnv,
    });
    let restarted;
    let stdout = "";
    let stderr = "";
    let ready;
    const pending = new Map();
    child.stdout.on("data", (chunk) => { stdout = (stdout + chunk).slice(-4096); });
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-4096); });
    child.on("message", (message) => {
      if (message?.schema_version !== schema) return;
      if (message.kind === "ready" || message.kind === "fatal") ready = message;
      if (message.kind === "response") {
        pending.get(message.request_key)?.(message.result);
        pending.delete(message.request_key);
      }
    });
    const command = (key, kind, extra = {}) => new Promise((resolveResult, reject) => {
      const timer = setTimeout(() => { pending.delete(key); reject(new Error(`${kind} timed out`)); }, 15_000);
      pending.set(key, (result) => { clearTimeout(timer); resolveResult(result); });
      child.send({schema_version: schema, request_key: key, command: kind, ...extra});
    });
    const signal = (target, name) => {
      try {
        if (process.platform !== "win32" && Number.isSafeInteger(target.pid)) process.kill(-target.pid, name);
        else target.kill(name);
      } catch (error) { if (error?.code !== "ESRCH") throw error; }
    };
    try {
      const deadline = Date.now() + 240_000;
      let launched;
      while (Date.now() < deadline && child.exitCode === null) {
        launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        if (launched && ready) break;
        await new Promise((done) => setTimeout(done, 50));
      }
      assert.equal(ready?.kind, "ready", ready?.reason_code ?? stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]"));
      assert.ok(launched, "qualified Web Host did not publish a loopback URL");
      assert.equal(ready.receipt.state, "qualified");
      const url = new URL(launched);
      assert.equal(url.hostname, "127.0.0.1");
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `token exchange failed: ${login.status}`);
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: method === "list" ? {_request: request} : {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      assert.match(ready.workspace_id, /^[0-9a-f-]+$/u);
      const created = await rpc("create", {workspaceId: ready.workspace_id}, "canary-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const sessionId = created.result.value.sessionId;
      const before = await command("before", "session-state", {session_id: sessionId});
      assert.equal(before.binding.status, "active");
      assert.equal(before.native_turn_state, "not-started");
      assert.deepEqual(before.model_tool_names, []);
      const idleObservation = await readAdapterObservation({
        socket_path: ready.observation_endpoint, token: hostEnv.ARE_ADAPTER_OBSERVATION_TOKEN});
      assert.equal(idleObservation.dsh_web_activity.active_agent_count, 1);
      assert.equal(idleObservation.dsh_web_activity.agents[0].are_preparation, undefined);
      const followed = ackLoss ? null : command("follow-visible", "follow-visible-reply",
        {session_id: sessionId});
      const prompt = await rpc("prompt", {sessionId, requestId: "canary-prompt", mode: "queue",
        content: [{type: "text", text: research ? 'Research runtime recovery.' : "explain ARE routing architecture"}]}, "canary-prompt-rpc");
      assert.equal(prompt.result?.ok, !ackLoss, JSON.stringify(prompt.result));
      if (ackLoss) assert.match(JSON.stringify(prompt.result), /fixture-ack-lost/u);
      else assert.equal(prompt.result.value?.accepted, true);
      if (!ackLoss) {
        await Promise.race([providerEntered, new Promise((_, reject) =>
          setTimeout(() => reject(new Error("mock provider did not receive the model request")), 15_000))]);
        const openDeadline = Date.now() + 15_000;
        let open;
        while (Date.now() < openDeadline) {
          open = await command(`open-${Date.now()}`, "session-state", {session_id: sessionId});
          if (open.native_turn_state === "open-observed") break;
          await new Promise(done => setTimeout(done, 50));
        }
        assert.equal(open?.native_turn_state, "open-observed");
        assert.equal(open.turn_end_count, 0);
        releaseProvider();
      }
      const turnDeadline = Date.now() + 30_000;
      let state;
      while (Date.now() < turnDeadline) {
        state = await command(`state-${Date.now()}`, "session-state", {session_id: sessionId});
        if (state.turn_end_count > 0 && requests > 0) break;
        await new Promise((done) => setTimeout(done, 50));
      }
      assert.equal(providerError, undefined, String(providerError));
      assert.equal(requests, 1);
      assert.equal(state.user_message_count, 1);
      assert.equal(state.turn_end_count, 1);
      assert.equal(state.native_turn_state, "closed-observed");
      assert.equal(state.graph.state, "qualified");
      assert.equal(state.prompt_requests.length, 1);
      assert.equal(state.prompt_requests[0].status, "complete");
      assert.equal(state.model_entry_observations.length, 1);
      if (research) {
        assert.equal(wireContexts[0].schema_version, 'are.dsh-web-model-context/v3');
        assert.ok(Buffer.byteLength(JSON.stringify(modelContexts[0])) > 32768);
      }
      if (selectedPlan) {
        const projected = modelContexts[0].objective.plan_context;
        assert.equal(projected.feature_obligations.length, replacePlan ? 30 : 7);
        assert.equal(projected.active_slice_id, plan.selection.active_slice_id);
        assert.deepEqual(projected.unresolved_decisions, plan.selection.unresolved_decisions);
        assert.deepEqual(modelContexts[0].objective.requirement_snapshot.requirements,
          replacePlan ? plan.selection.feature_obligations.map(row => row.summary).sort() : [...panelNames].sort());
      } else assert.equal(modelContexts[0].objective.plan_context, undefined);
      assert.equal(state.model_entry_observations[0].request_digests[0],
        state.prompt_requests[0].binding_digest);
      assert.match(state.model_entry_observations[0].context_digest, /^[0-9a-f]{64}$/u);
      assert.equal(state.model_entry_observations[0].preparation_bindings.length, 1);
      assert.equal(state.model_entry_observations[0].preparation_bindings[0].request_digest,
        state.prompt_requests[0].binding_digest);
      const retainedPreparation = state.preparation_observations[0];
      assert.match(retainedPreparation.objective_checkpoint.checkpoint_digest, /^[0-9a-f]{64}$/u);
      assert.equal(retainedPreparation.objective_checkpoint.binding_digest,
        modelContexts[0].objective.objective_binding_digest);
      assert.equal(retainedPreparation.objective_checkpoint.objective_state_digest,
        modelContexts[0].objective.state_digest);
      assert.equal(retainedPreparation.objective_checkpoint.resolution_digest,
        modelContexts[0].objective.resolution_digest);
      assert.equal(retainedPreparation.request_digest,
        state.model_entry_observations[0].preparation_bindings[0].request_digest);
      const completedObservation = await readAdapterObservation({
        socket_path: ready.observation_endpoint, token: hostEnv.ARE_ADAPTER_OBSERVATION_TOKEN});
      assert.deepEqual(completedObservation.dsh_web_activity.agents[0].are_preparation, {
        status: "route-context-prepared", route_id: research ? 'CA2-ROUTE-RESEARCH' : "CA2-ROUTE-UNDERSTAND",
        dispatch_relation: "latest-model-entry",
        objective_checkpoint: {schema_version: selectedPlan ? "are.dsh-objective-checkpoint-summary/v3"
          : "are.dsh-objective-checkpoint-summary/v1",
          status: "host-retained-reference",
          checkpoint_digest: retainedPreparation.objective_checkpoint.checkpoint_digest,
          objective_state_digest: modelContexts[0].objective.state_digest,
          binding_digest: modelContexts[0].objective.objective_binding_digest,
          requirements: selectedPlan ? "continuity-reference-retained" : "not-selected",
          ...(selectedPlan ? {plan_context_digest: modelContexts[0].objective.plan_context.plan_context_digest,
            plan_progress: retainedPreparation.objective_checkpoint.plan_progress} : {})},
      });
      assert.equal(completedObservation.dsh_web_activity.agents[0].native_turn_state,
        "closed-observed");
      assert.equal(completedObservation.dsh_web_activity.agents[0].last_turn_evidence,
        "terminal-retained");
      assert.doesNotMatch(JSON.stringify(completedObservation),
        /explain (this|ARE routing) architecture|local qualified reply|are\.dsh-web-model-context/u);
      if (!ackLoss && process.env.ARE_TEST_WINDOWS_DSH_PREPARED_UI_EXE) {
        assert.ok(process.env.WSL_DISTRO_NAME, "Native Windows UI check requires WSL.");
        const uiScript = fileURLToPath(new URL(
          "../../../apps/desktop-companion/scripts/test-windows-ui.mjs", import.meta.url));
        const windowsPath = path => execFileSync("wslpath", ["-w", path],
          {encoding: "utf8"}).trim();
        const ui = JSON.parse(execFileSync("node.exe", [windowsPath(uiScript),
          windowsPath(process.env.ARE_TEST_WINDOWS_DSH_PREPARED_UI_EXE),
          "--adapter-external-socket", ready.observation_endpoint,
          "--adapter-external-dsh", "--timeout-ms", "30000"], {
          encoding: "utf8", timeout: 180_000,
          env: {...process.env, ARE_WINDOWS_UI_EXPECT_DSH_PREPARATION: "1",
            ARE_ADAPTER_OBSERVATION_TOKEN: hostEnv.ARE_ADAPTER_OBSERVATION_TOKEN,
            WSLENV: [process.env.WSLENV, "ARE_ADAPTER_OBSERVATION_TOKEN/w",
              "ARE_WINDOWS_UI_EXPECT_DSH_PREPARATION/w"].filter(Boolean).join(":")},
        }));
        assert.equal(ui.ok, true);
        assert.ok(ui.checks.includes("dsh-prepared-route-correlated-to-native-model-entry"));
      }
      assert.doesNotMatch(JSON.stringify(state.model_entry_observations),
        /are\.dsh-web-model-context|explain (this|ARE routing) architecture/u);
      assert.equal(state.terminal_observations.length, 1);
      assert.equal(state.terminal_observations[0].turn_status, "completed");
      assert.equal(state.terminal_observations[0].request_digest,
        state.prompt_requests[0].binding_digest);
      if (ackLoss) assert.equal(state.prompt_requests[0].response
        .recovered_from_terminal_observation_digest,
      state.terminal_observations[0].observation_digest);
      const listed = await rpc("list", {}, "canary-list-outcomes");
      assert.equal(listed.result?.ok, true, JSON.stringify(listed.result));
      const listedSession = listed.result.value.items.find((item) => item.sessionId === sessionId);
      assert.equal(listedSession.projections.values.arePromptOutcomes.length, 1);
      assert.deepEqual(listedSession.projections.values.arePromptOutcomes[0], {
        requestKeyDigest: state.terminal_observations[0].request_key_digest,
        disposition: ackLoss ? "recovered" : "accepted", terminal: "completed"});
      assert.doesNotMatch(JSON.stringify(listedSession.projections), /explain this architecture|canary-prompt/u);
      const followedStatus = await command("follow-prompt-outcome", "follow-snapshot",
        {session_id: sessionId});
      assert.deepEqual(followedStatus.projections.values.arePromptOutcomes,
        listedSession.projections.values.arePromptOutcomes);
      if (followed) {
        const frames = (await followed).frames;
        assert.equal(frames[0].type, "snapshot");
        assert.deepEqual(frames[0].assistantStream, {revision: 0});
        const encoded = JSON.stringify(frames);
        assert.match(encoded, /local qualified reply/u);
        assert.doesNotMatch(encoded, /reasoning|replayState|request\/context/u);
      }
      const page = await rpc("page", {address: {kind: "session", sessionId},
        throughSeq: state.event_count - 1, maxMessages: 50}, "canary-owned-page");
      assert.equal(page.result?.ok, true, JSON.stringify(page.result));
      const visible = page.result.value.records
        .filter((record) => ["user/message", "assistant/message"].includes(record.event.type));
      assert.equal(visible.filter((record) => record.event.type === "user/message").length, 1);
      assert.equal(visible.filter((record) => record.event.type === "assistant/message").length, 1);
      assert.match(JSON.stringify(visible), /local qualified reply/u);
      assert.doesNotMatch(JSON.stringify(page.result.value), /reasoning|replayState|request\/context/u);
      assert.doesNotMatch(JSON.stringify(page.result.value), /are\.dsh-web-model-context\/v[12]/u);
      const visibleSearch = await rpc("search", {query: "qualified reply"}, "canary-search-visible");
      assert.equal(visibleSearch.result?.ok, true, JSON.stringify(visibleSearch.result));
      assert.deepEqual(visibleSearch.result.value.items,
        [{sessionId, snippet: "local qualified reply"}]);
      const privateSearch = await rpc("search", {query: "request/context"}, "canary-search-private");
      assert.equal(privateSearch.result?.ok, true, JSON.stringify(privateSearch.result));
      assert.deepEqual(privateSearch.result.value.items, []);
      const replay = await rpc("prompt", {sessionId, requestId: "canary-prompt", mode: "queue",
        content: [{type: "text", text: "explain this architecture"}]}, "canary-prompt-replay-rpc");
      assert.equal(replay.result?.ok, false);
      assert.match(JSON.stringify(replay.result), /prompt-request-replayed/u);
      const afterReplay = await command("after-replay", "session-state", {session_id: sessionId});
      assert.equal(afterReplay.event_count, state.event_count);
      assert.equal(afterReplay.user_message_count, 1);
      assert.equal(afterReplay.model_request_count, state.model_request_count);
      assert.equal(requests, 1);
      if (!ackLoss) {
        const continued = await rpc("prompt", {sessionId, requestId: "canary-continue", mode: "queue",
          content: [{type: "text", text: "continue"}]}, "canary-continue-rpc");
        assert.equal(continued.result?.ok, true, JSON.stringify(continued.result));
        const deadline = Date.now() + 30_000;
        let after;
        while (Date.now() < deadline) {
          after = await command(`continued-${Date.now()}`, "session-state", {session_id: sessionId});
          if (after.turn_end_count === 2 && requests === 2) break;
          await new Promise(done => setTimeout(done, 50));
        }
        assert.equal(providerError, undefined, String(providerError));
        assert.equal(after?.turn_end_count, 2);
        assert.equal(after.user_message_count, 2);
        assert.equal(modelContexts.length, 2);
        if (selectedPlan) assert.deepEqual(modelContexts[1].objective.plan_context, modelContexts[0].objective.plan_context);
        assert.equal(modelContexts[1].objective.transition, "continue");
        assert.equal(modelContexts[1].objective.active_objective.objective_id,
          modelContexts[0].objective.active_objective.objective_id);
        assert.notEqual(modelContexts[1].objective.state_digest, modelContexts[0].objective.state_digest);
        const observation = await readAdapterObservation({socket_path: ready.observation_endpoint,
          token: hostEnv.ARE_ADAPTER_OBSERVATION_TOKEN});
        assert.equal(observation.dsh_web_activity.agents[0].are_preparation.dispatch_relation,
          "latest-model-entry");
        const successor = observation.dsh_web_activity.agents[0].are_preparation.objective_checkpoint;
        assert.equal(successor.objective_state_digest, modelContexts[1].objective.state_digest);
        assert.equal(successor.binding_digest, modelContexts[1].objective.objective_binding_digest);
        assert.equal(successor.checkpoint_digest, after.preparation_observations.at(-1)
          .objective_checkpoint.checkpoint_digest);
        assert.notEqual(successor.checkpoint_digest,
          retainedPreparation.objective_checkpoint.checkpoint_digest);
      }
      const drained = await command("completed-drain", "dispose-agent", {session_id: sessionId});
      assert.equal(drained.binding_status, "draining", drained.reason_code);
      const released = await command("completed-release", "release-agent", {session_id: sessionId});
      assert.equal(released.binding_status, "released", released.reason_code);
      if (ackLoss) {
        const exited = once(child, "exit");
        signal(child, "SIGKILL");
        await exited;
        if (advancePlan) {
          const advanced = advanceHostPlanFixture(home, plan, modelContexts[0].objective.plan_context,
            {active_slice_id: "panel-2"});
          hostEnv.ARE_DSH_TEST_PLAN_SELECTION = JSON.stringify(advanced.descriptor);
        }
        if (replacePlan) {
          const retained = verifyReasoningStateLog(join(home, 'gateway.jsonl.objectives.jsonl'));
          assert.equal(retained.ok, true);
          const continuity = retained.value.records.filter(row => row.record_kind === 'reasoning-state-event'
            && row.value.event_kind === 'objective-transition-resolved').at(-1).value.content.requirement_continuity;
          const parent = 'Disposable full-scope parent replacement; all 30 integration/UI obligations remain accounted.\n';
          const hash = createHash('sha256').update(parent).digest('hex');
          await writeFile(join(home, 'replacement-parent.md'), parent);
          const replaced = replaceHostPlanFixture(home, plan, modelContexts[0].objective.plan_context, continuity,
            {parent_plan_ref: 'replacement-parent.md', parent_plan_digest: hash,
              source_refs: plan.selection.source_refs.map(row => row.source_ref === plan.selection.parent_plan_ref
                ? {source_ref: 'replacement-parent.md', source_digest: hash} : row),
              feature_obligations: plan.selection.feature_obligations.map((row, index, all) => index === all.length - 1
                ? {...row, summary: 'Preserve Appearance skins, placement and low-resource desktop behavior.'} : row)});
          hostEnv.ARE_DSH_TEST_PLAN_SELECTION = JSON.stringify(replaced.descriptor);
          Object.assign(plan, replaced);
        }
        restarted = spawn(process.execPath, [fixture], {
          stdio: ["ignore", "pipe", "pipe", "ipc"],
          detached: process.platform !== "win32", env: {...hostEnv, ARE_DSH_DROP_PROMPT_ACK: "0"},
        });
        let restartResult;
        let restartError = "";
        let restartStdout = "";
        restarted.stdout.on("data", (chunk) => {
          restartStdout = (restartStdout + chunk).slice(-4096);
        });
        restarted.stderr.on("data", (chunk) => {
          restartError = (restartError + chunk).slice(-2048);
        });
        restarted.on("message", (message) => {
          if (message?.schema_version === schema
            && ["ready", "fatal"].includes(message.kind)) restartResult = message;
        });
        const restartDeadline = Date.now() + 120_000;
        while (!restartResult && restarted.exitCode === null && Date.now() < restartDeadline) {
          await new Promise((done) => setTimeout(done, 50));
        }
        assert.equal(restartResult?.kind, "ready",
          restartResult?.reason_code ?? restartError.replaceAll(/token=[^\s]+/gu, "token=[redacted]"));
        const resumed = await new Promise((resolveResult, reject) => {
          const timer = setTimeout(() => reject(new Error(`resume timed out: ${restartError}`)), 30_000);
          restarted.on("message", (message) => {
            if (message?.schema_version !== schema || message.kind !== "response"
              || message.request_key !== "ack-loss-resume") return;
            clearTimeout(timer);
            resolveResult(message.result);
          });
          restarted.send({schema_version: schema, request_key: "ack-loss-resume",
            command: "resume-agent", session_id: sessionId});
        });
        assert.equal(resumed.resumed?.sessionId, sessionId, resumed.reason_code);
        assert.equal(resumed.resumed?.generation, 2);
        const restartedUrlText = restartStdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        assert.ok(restartedUrlText, "resumed Host did not publish a Web URL");
        const restartedUrl = new URL(restartedUrlText);
        const restartedCookie = (await fetch(restartedUrl, {redirect: "manual"}))
          .headers.get("set-cookie")?.split(";", 1)[0];
        assert.ok(restartedCookie);
        const restartedListResponse = await fetch(new URL("/api/session/list", restartedUrl), {
          method: "POST", headers: {"content-type": "application/json",
            cookie: restartedCookie, origin: restartedUrl.origin},
          body: JSON.stringify({type: "client-request", rpcId: "resumed-prompt-outcome",
            method: "session/list", payload: {args: {_request: {}}}}),
        });
        assert.equal(restartedListResponse.status, 200);
        const restartedList = await restartedListResponse.json();
        assert.equal(restartedList.result?.ok, true, JSON.stringify(restartedList.result));
        const resumedItem = restartedList.result.value.items.find((item) => item.sessionId === sessionId);
        assert.deepEqual(resumedItem?.projections?.values?.arePromptOutcomes,
          listedSession.projections.values.arePromptOutcomes);
        const restartedCommand = (request_key, command, extra = {}) => new Promise((resolveResult, reject) => {
          const finish = message => {
            if (message?.schema_version !== schema || message.kind !== "response"
              || message.request_key !== request_key) return;
            clearTimeout(timer); restarted.off("message", finish); resolveResult(message.result);
          };
          const timer = setTimeout(() => {
            restarted.off("message", finish); reject(new Error(`restarted command timed out: ${command}`));
          }, 30_000);
          restarted.on("message", finish);
          restarted.send({schema_version: schema, request_key, command, ...extra});
        });
        const continuedResponse = await fetch(new URL("/api/session/prompt", restartedUrl), {
          method: "POST", headers: {"content-type": "application/json", cookie: restartedCookie,
            origin: restartedUrl.origin}, body: JSON.stringify({type: "client-request",
            rpcId: "resumed-continue-rpc", method: "session/prompt", payload: {args: {request: {
              sessionId, requestId: "canary-resumed-continue", mode: "queue",
              content: [{type: "text", text: "continue"}]}}}}),
        });
        assert.equal(continuedResponse.status, 200);
        const continued = await continuedResponse.json();
        assert.equal(continued.result?.ok, true, JSON.stringify(continued.result));
        const continueDeadline = Date.now() + 30_000;
        let resumedState;
        while (Date.now() < continueDeadline) {
          resumedState = await restartedCommand(`resumed-state-${Date.now()}`, "session-state", {session_id: sessionId});
          if (resumedState.turn_end_count === 2 && requests === 2) break;
          await new Promise(done => setTimeout(done, 50));
        }
        assert.equal(providerError, undefined, String(providerError));
        assert.equal(requests, 2, "fresh Host must not redispatch the old prompt");
        assert.equal(resumedState?.turn_end_count, 2);
        assert.equal(resumedState.user_message_count, 2);
        if (replacePlan) {
          const successor = modelContexts[1].objective.plan_context;
          assert.equal(successor.previous_plan_context_digest, modelContexts[0].objective.plan_context.plan_context_digest);
          assert.equal(successor.parent_plan_ref, 'replacement-parent.md');
          assert.equal(successor.feature_obligations.length, 30);
          assert.deepEqual(successor.feature_obligations, plan.selection.feature_obligations);
          assert.deepEqual(modelContexts[1].objective.requirement_snapshot.requirements,
            plan.selection.feature_obligations.map(row => row.summary).sort());
          const retained = verifyReasoningStateLog(join(home, 'gateway.jsonl.objectives.jsonl'));
          assert.equal(retained.ok, true);
          const migrations = retained.value.records.filter(row => row.record_kind === 'reasoning-state-event'
            && row.value.event_kind === 'plan-requirements-migrated');
          assert.equal(migrations.length, 1);
          assert.equal(migrations[0].value.content.migration.schema_version, 'are.plan-requirement-migration/v2');
        } else if (advancePlan) {
          assert.equal(modelContexts[1].objective.plan_context.previous_plan_context_digest,
            modelContexts[0].objective.plan_context.plan_context_digest);
          assert.equal(modelContexts[1].objective.plan_context.active_slice_id, "panel-2");
          assert.deepEqual(modelContexts[1].objective.plan_context.feature_obligations,
            modelContexts[0].objective.plan_context.feature_obligations);
          assert.deepEqual(modelContexts[1].objective.requirement_snapshot.requirements,
            modelContexts[0].objective.requirement_snapshot.requirements);
        } else if (selectedPlan) assert.deepEqual(modelContexts[1].objective.plan_context, modelContexts[0].objective.plan_context);
        assert.equal(modelContexts[1].objective.transition, "continue");
        assert.equal(modelContexts[1].objective.active_objective.objective_id,
          modelContexts[0].objective.active_objective.objective_id);
        const resumedObservation = await readAdapterObservation({socket_path: restartResult.observation_endpoint,
          token: hostEnv.ARE_ADAPTER_OBSERVATION_TOKEN});
        const resumedPreparation = resumedObservation.dsh_web_activity.agents[0].are_preparation;
        assert.equal(resumedPreparation.dispatch_relation, "latest-model-entry");
        assert.equal(resumedPreparation.objective_checkpoint.objective_state_digest,
          modelContexts[1].objective.state_digest);
        assert.equal(resumedPreparation.objective_checkpoint.binding_digest,
          modelContexts[1].objective.objective_binding_digest);
        if (selectedPlan) assert.equal(resumedPreparation.objective_checkpoint.plan_context_digest,
          modelContexts[1].objective.plan_context.plan_context_digest);
        assert.notEqual(resumedPreparation.objective_checkpoint.checkpoint_digest,
          retainedPreparation.objective_checkpoint.checkpoint_digest);
        assert.doesNotMatch(JSON.stringify(resumedObservation), /local qualified reply|are\.dsh-web-model-context/u);
        await restartedCommand("resumed-stop", "dispose");
      }
    } finally {
      releaseProvider();
      if (child.connected && child.exitCode === null) await command("stop", "dispose").catch(() => {});
      if (child.exitCode === null) {
        signal(child, "SIGTERM");
        await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
        if (child.exitCode === null) signal(child, "SIGKILL");
      }
      if (restarted?.exitCode === null) {
        signal(restarted, "SIGTERM");
        await Promise.race([once(restarted, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
        if (restarted.exitCode === null) signal(restarted, "SIGKILL");
      }
      await new Promise((done) => mock.close(done));
      await rm(home, {recursive: true, force: true});
    }
  });
}
