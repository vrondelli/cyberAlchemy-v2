import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {projectDshWebActivity} from "../src/web-adapter-observation.mjs";
import {readAdapterObservation}
  from "../../codex-app-server-wrapper/src/adapter-observation-client.mjs";
import {fullHostPlanFixture} from './fixtures/host-plan-selection.mjs';

const schema = "are.dsh-host-owned-graph-probe/v1";
const fixture = fileURLToPath(new URL("./fixtures/web-host-owned-graph-probe.mjs", import.meta.url));
const manifest = fileURLToPath(new URL("../config/dsh-web-are-host-owned-graph-manifest.v1.json", import.meta.url));

for (const [attack, fullPlan] of [["settings-default", false], ["old-agent", false], ["preparation-outage", false], ["settings-default", true], ['unresolved-first', true]]) {
test(`authenticated Web prompt loses its permit when ${attack} changes during ARE preparation${fullPlan ? ' with full selected plan progress' : ''}`,
  {timeout: 180_000}, async () => {
    const home = await mkdtemp(join(tmpdir(), "are-dsh-preparation-race-"));
    const plan = fullPlan ? fullHostPlanFixture(home) : null;
    const observationToken = "private-preparation-race-observation-".repeat(2);
    const child = spawn(process.execPath, [fixture], {
      stdio: ["ignore", "pipe", "pipe", "ipc"],
      detached: process.platform !== "win32",
      env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
        ARE_DSH_USE_JOURNAL_WORKER: "1",
        ARE_DSH_TEST_OBSERVATION: "1", ARE_ADAPTER_OBSERVATION_TOKEN: observationToken,
        ARE_DSH_TEST_PLAN_SELECTION: JSON.stringify(plan?.descriptor ?? null),
        ARE_DSH_HOST_MANIFEST: manifest,
        ...(attack === 'unresolved-first' ? {} : attack === "preparation-outage"
          ? {ARE_DSH_FAIL_PREPARATION: "1"} : {ARE_DSH_HOLD_PREPARATION: "1"})},
    });
    let stdout = "";
    let stderr = "";
    let ready;
    let preparationPaused;
    const pending = new Map();
    child.stdout.on("data", (chunk) => { stdout = (stdout + chunk).slice(-4096); });
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-4096); });
    child.on("message", (message) => {
      if (message?.schema_version !== schema) return;
      if (message.kind === "ready" || message.kind === "fatal") ready = message;
      if (message.kind === "preparation-paused") preparationPaused = message;
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
    const signal = (name) => {
      try {
        if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, name);
        else child.kill(name);
      } catch (error) { if (error?.code !== "ESRCH") throw error; }
    };
    try {
      const deadline = Date.now() + 120_000;
      let launched;
      while (Date.now() < deadline && child.exitCode === null) {
        launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        if (launched && ready) break;
        await new Promise((done) => setTimeout(done, 50));
      }
      assert.equal(ready?.kind, "ready", ready?.reason_code ?? stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]"));
      assert.ok(launched);
      const url = new URL(launched);
      assert.equal(url.hostname, "127.0.0.1");
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
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
      const created = await rpc("create", {}, "race-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      const sessionId = created.result.value.sessionId;
      const before = await command("before", "session-state", {session_id: sessionId});
      assert.equal(before.binding.status, "active");
      const pendingPrompt = rpc("prompt", {sessionId, requestId: "race-prompt", mode: "queue",
        content: [{type: "text", text: attack === 'unresolved-first' ? 'continue' : "explain ARE routing architecture"}]}, "race-prompt-rpc");
      if (attack !== "preparation-outage" && attack !== 'unresolved-first') {
        const pauseDeadline = Date.now() + 15_000;
        while (!preparationPaused && Date.now() < pauseDeadline) {
          await new Promise((done) => setTimeout(done, 25));
        }
        assert.equal(preparationPaused?.request_id, "race-prompt");
        const changed = attack === "old-agent"
          ? await command("change", "dispose-agent", {session_id: sessionId})
          : await command("change", "change-default");
        if (attack === "old-agent") assert.equal(changed.binding_status, "draining");
        else assert.equal(changed.default_id, "not-the-qualified-preset");
        const released = await command("release", "release-preparation");
        assert.equal(released.released, true);
      }
      const prompt = await pendingPrompt;
      assert.equal(prompt.result?.ok, false);
      if (attack === "old-agent" || attack === 'unresolved-first') {
        // The owned normalizer now refuses the drained binding before the
        // broker's post-preparation check. The private gateway sanitizes errors.
        assert.equal(prompt.result.error.message, "dsh-web.gateway-preparation-denied");
      } else assert.match(JSON.stringify(prompt.result),
        /graph-binding-changed|fingerprint-drift|agent-generation-changed|agent-binding-inactive|fixture-preparation-outage/u);
      const after = await command("after", "session-state", {session_id: sessionId});
      assert.equal(after.event_count, before.event_count);
      assert.equal(after.user_message_count, 0);
      assert.equal(after.model_request_count, 0);
      assert.equal(after.preparation_observations.length, 0);
      assert.equal(after.model_entry_observations.length, 0);
      assert.equal(after.objective_interpretation_count, attack === "settings-default" ? 1 : 0);
      assert.equal(after.objective_preflight_count, attack === "settings-default" ? 1 : 0);
      assert.equal(after.interpretation_observations.length, attack === "settings-default" ? 1 : 0);
      const observed = await readAdapterObservation({socket_path: ready.observation_endpoint,
        token: observationToken});
      assert.equal(observed.source, "dsh-web-host-process");
      assert.equal(observed.host_task_control.status, "unverified");
      assert.equal(observed.dsh_web_activity.retained_model_entry_count, 0);
      assert.equal(observed.dsh_web_activity.retained_turn_terminal_count, 0);
      assert.doesNotMatch(JSON.stringify(observed), /explain ARE routing architecture|race-prompt/);
      if (fullPlan) {
        const head = observed.dsh_web_activity.agents[0].are_plan_head;
        assert.equal(head.status, 'checkpoint-retained');
        assert.equal(head.sources, 'verified-at-read');
        assert.equal(head.selection_relation, 'matches-startup');
        assert.equal(head.plan_progress.obligation_count, 30);
        assert.equal(head.plan_progress.open_decision_count, plan.selection.unresolved_decisions.length);
      }
      if (attack === "settings-default") {
        const interpretation = after.interpretation_observations[0];
        const activity = projectDshWebActivity({agent_records: [{status: "active",
          thread_ref: interpretation.thread_ref, native_turn_state: "not-started"}],
        host_observations: after.interpretation_observations});
        assert.equal(activity.agents[0].are_interpretation.status,
          "checkpoint-retained-no-admission-retained");
        assert.equal(activity.agents[0].are_preparation, undefined);
        assert.equal(activity.retained_model_entry_count, 0);
        assert.deepEqual(observed.dsh_web_activity.agents[0].are_interpretation,
          activity.agents[0].are_interpretation);
        assert.equal(observed.dsh_web_activity.agents[0].are_preparation, undefined);
        assert.equal(observed.dsh_web_activity.agents[0].native_turn_state, "not-started");
        if (fullPlan) {
          const summary = observed.dsh_web_activity.agents[0].are_interpretation;
          assert.equal(summary.schema_version, 'are.dsh-objective-interpretation-summary/v2');
          assert.equal(summary.plan_progress.obligation_count, 30);
          assert.equal(summary.plan_progress.open_decision_count, plan.selection.unresolved_decisions.length);
          assert.equal(summary.plan_progress.completed_count,
            plan.selection.feature_obligations.filter(row => row.status === 'completed').length);
          assert.deepEqual(summary.plan_progress, interpretation.plan_progress);
        }
      } else {
        assert.ok(observed.dsh_web_activity.agents.every(agent => agent.are_interpretation === undefined));
      }
      if (attack === "settings-default") assert.equal(after.graph.state, "revoked");
      if (attack === "preparation-outage" || attack === 'unresolved-first') assert.equal(after.graph.state, "qualified");
    } finally {
      if (child.connected && child.exitCode === null) {
        await command("cleanup-release", "release-preparation").catch(() => {});
        await command("stop", "dispose").catch(() => {});
      }
      if (child.exitCode === null) {
        signal("SIGTERM");
        await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
        if (child.exitCode === null) signal("SIGKILL");
      }
      await rm(home, {recursive: true, force: true});
    }
  });
}
