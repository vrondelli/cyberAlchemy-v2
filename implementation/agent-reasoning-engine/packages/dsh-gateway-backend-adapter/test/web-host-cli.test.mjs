import assert from "node:assert/strict";
import {execFileSync, spawn} from "node:child_process";
import {once} from "node:events";
import {chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {parseDshWebHostArgs, preflightDshWebHost} from "../bin/are-dsh-web-host.mjs";
import {readAdapterObservation}
  from "../../codex-app-server-wrapper/src/adapter-observation-client.mjs";
import {hostPlanFixture} from "./fixtures/host-plan-selection.mjs";

const cli = fileURLToPath(new URL("../bin/are-dsh-web-host.mjs", import.meta.url));

test("DSH Web Host command requires an explicit private home and selected workspace", (context) => {
  const home = mkdtempSync(join(tmpdir(), "are-dsh-web-cli-preflight-"));
  context.after(() => rmSync(home, {recursive: true, force: true}));
  assert.throws(() => parseDshWebHostArgs([]), /dsh-web-host.required-argument-missing/);
  assert.throws(() => parseDshWebHostArgs(["--home", home, "--workspace"]),
    /dsh-web-host.arguments-invalid/);
  const parsed = parseDshWebHostArgs(["--home", home, "--workspace", home]);
  assert.equal(preflightDshWebHost(parsed).workspace, home);
  assert.equal(preflightDshWebHost(parsed).planSelection, null);
  const plan = hostPlanFixture(home);
  const withPlan = parseDshWebHostArgs(["--home", home, "--workspace", home, "--plan-selection", plan.path]);
  assert.deepEqual(preflightDshWebHost(withPlan).planSelection, plan.descriptor);
  assert.throws(() => preflightDshWebHost({...withPlan, plan_selection: "relative"}), /host-plan-selection-invalid-or-drifted/);
  assert.throws(() => parseDshWebHostArgs(["--home", home, "--workspace", home,
    "--plan-selection", plan.path, "--plan-selection", plan.path]), /arguments-invalid/);
  assert.deepEqual(parseDshWebHostArgs(["--home", home, "--workspace", home,
    "--resume-session", "session-00000000-0000-0000-0000-000000000001"]).resume_sessions,
  ["session-00000000-0000-0000-0000-000000000001"]);
  assert.throws(() => preflightDshWebHost({...parsed, resume_sessions: ["not-a-session"]}),
    /dsh-web-host.resume-session-invalid/);
  assert.throws(() => preflightDshWebHost({...parsed, workspace: "relative"}),
    /dsh-web-host.workspace-absolute-required/);
  assert.throws(() => preflightDshWebHost({...parsed, observation_socket: join(tmpdir(), "outside.sock")}),
    /dsh-web-host.observation-socket-invalid/);
  assert.throws(() => preflightDshWebHost({...parsed, development_observation_tcp_port: "65536"}),
    /dsh-web-host.observation-tcp-port-invalid/);
  assert.throws(() => preflightDshWebHost({...parsed, observation_socket: join(home, "observe.sock"),
    development_observation_tcp_port: "0"}), /dsh-web-host.observation-tcp-port-invalid/);
  const previousToken = process.env.ARE_ADAPTER_OBSERVATION_TOKEN;
  try {
    process.env.ARE_ADAPTER_OBSERVATION_TOKEN = "dsh-loopback-test-token-".repeat(2);
    const tcp = parseDshWebHostArgs(["--home", home, "--workspace", home,
      "--development-observation-tcp-port", "0"]);
    assert.equal(preflightDshWebHost(tcp).observationTcpPort, 0);
  } finally {
    if (previousToken === undefined) delete process.env.ARE_ADAPTER_OBSERVATION_TOKEN;
    else process.env.ARE_ADAPTER_OBSERVATION_TOKEN = previousToken;
  }
  if (process.platform !== "win32") {
    chmodSync(home, 0o755);
    assert.throws(() => preflightDshWebHost(parsed), /dsh-web-host.home-not-private/);
  }
});

test("DSH Web Host command starts the restricted authenticated profile and stops cleanly",
  {skip: process.platform !== "linux" ? "Pinned Host profile is Linux-only" : false,
    timeout: 600_000}, async (context) => {
    const home = mkdtempSync(join(tmpdir(), "are-dsh-web-cli-live-"));
    const selectedPlan = hostPlanFixture(home);
    const observationSocket = join(home, "are-observation.sock");
    const observationToken = "dsh-web-observation-test-token-".repeat(2);
    context.after(() => rmSync(home, {recursive: true, force: true}));
    const child = spawn(process.execPath, [cli, "--home", home, "--workspace", home, "--plan-selection", selectedPlan.path,
      "--observation-socket", observationSocket], {
      env: {...process.env, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
        ARE_ADAPTER_OBSERVATION_TOKEN: observationToken},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let lineBuffer = "";
    let stderr = "";
    let ready = null;
    let stopped = null;
    let sessionId = null;
    child.stdout.on("data", chunk => {
      stdout = (stdout + chunk).slice(-8192);
      lineBuffer += chunk.toString("utf8");
      let newline;
      while ((newline = lineBuffer.indexOf("\n")) >= 0) {
        const line = lineBuffer.slice(0, newline);
        lineBuffer = lineBuffer.slice(newline + 1);
        try {
          const record = JSON.parse(line);
          if (record.schema_version === "are.dsh-web-host-ready/v1") ready = record;
          if (record.schema_version === "are.dsh-web-host-stopped/v1") stopped = record;
        } catch { /* Native Host output is not a readiness receipt. */ }
      }
    });
    child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-4096); });
    try {
      const deadline = Date.now() + 180_000;
      let launched;
      while (Date.now() < deadline && child.exitCode === null && child.signalCode === null) {
        launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        if (launched && ready) break;
        await new Promise(done => setTimeout(done, 50));
      }
      assert.equal(ready?.ok, true,
        `First Host did not become ready: exit=${child.exitCode} signal=${child.signalCode} stderr=${stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]")}`);
      assert.equal(ready.graph_state, "qualified");
      assert.equal(ready.adapter_observation, "private-local-socket");
      const observation = await readAdapterObservation({socket_path: observationSocket,
        token: observationToken});
      assert.equal(observation.source, "dsh-web-host-process");
      assert.equal(observation.gateway.status, "running");
      assert.equal(observation.backend.status, "running");
      assert.equal(observation.client_link.status, "not-observed");
      assert.equal(observation.selected_path.status, "not-observed");
      assert.deepEqual(observation.dsh_web_activity, {status: "observed",
        active_agent_count: 0, retained_model_entry_count: 0,
        retained_turn_terminal_count: 0, omitted_agent_count: 0, agents: []});
      const cliObservation = JSON.parse(execFileSync(process.execPath,
        [fileURLToPath(new URL("../../../bin/are.mjs", import.meta.url)),
          "adapter-status", "--json", "--socket", observationSocket],
        {encoding: "utf8", env: {...process.env,
          ARE_ADAPTER_OBSERVATION_TOKEN: observationToken}}));
      assert.equal(cliObservation.runtime_epoch_id, observation.runtime_epoch_id);
      assert.equal(cliObservation.selected_backend_adapter_id, "deepseek-harness-web/are-v1");
      assert.ok(launched, "The Host did not publish its loopback Web URL");
      const url = new URL(launched);
      assert.equal(url.hostname, "127.0.0.1");
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `Web token exchange failed: ${login.status}`);
      const page = await fetch(new URL("/", url), {headers: {cookie}});
      assert.equal(page.status, 200);
      const html = await page.text();
      for (const disabledClientId of ["@deepseek-ai/dsh-cordis-client-runner",
        "@deepseek-ai/dsh-client-ui-cordis"]) {
        assert.equal(html.includes(`"id":"${disabledClientId}"`), false,
          `Restricted Web boot graph advertised disabled ${disabledClientId}`);
        assert.equal(html.includes(`${disabledClientId}/client.js`), false,
          `Restricted Web boot graph loaded disabled ${disabledClientId}`);
      }
      const bundleRoutes = [...html.matchAll(/\/plugins\/\?\?[^"< ]+/gu)]
        .map(match => match[0].replaceAll("&amp;", "&"));
      for (const packageId of ["@deepseek-ai/dsh-api-session-controller",
        "@deepseek-ai/dsh-api-workspace-controller",
        "@cyberalchemy/are-dsh-web-outcomes"]) {
        assert.ok(html.includes(`"id":"${packageId}"`),
          `Web boot graph did not advertise ${packageId}`);
        const bundleRoute = bundleRoutes.find(path => path.includes(`${packageId}/client.js`));
        assert.ok(bundleRoute, `Web did not serve a bundle route for ${packageId}`);
        const bundle = await fetch(new URL(bundleRoute, url), {headers: {cookie}});
        assert.equal(bundle.status, 200);
        assert.ok((await bundle.text()).includes(`id: "${packageId}"`),
          `Web bundle did not register ${packageId}`);
      }
      const rpc = async (method, request, rpcId) => {
        const response = await fetch(new URL(`/api/session/${method}`, url), {
          method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
          body: JSON.stringify({type: "client-request", rpcId, method: `session/${method}`,
            payload: {args: method === "list" ? {_request: request} : {request}}}),
        });
        assert.equal(response.status, 200);
        return response.json();
      };
      const empty = await rpc("list", {}, "are-cli-list-empty");
      assert.deepEqual(empty.result?.value?.items, []);
      assert.match(ready.workspace_id, /^[0-9a-f-]+$/u);
      const created = await rpc("create", {workspaceId: ready.workspace_id}, "are-cli-create");
      assert.equal(created.result?.ok, true, JSON.stringify(created.result));
      sessionId = created.result.value.sessionId;
      const listed = await rpc("list", {}, "are-cli-list-created");
      assert.deepEqual(listed.result?.value?.items.map(item => item.sessionId), [sessionId]);
      const afterCreate = await readAdapterObservation({socket_path: observationSocket,
        token: observationToken});
      assert.equal(afterCreate.dsh_web_activity.status, "observed");
      assert.equal(afterCreate.dsh_web_activity.active_agent_count, 1);
      assert.equal(afterCreate.dsh_web_activity.retained_model_entry_count, 0);
      assert.equal(afterCreate.dsh_web_activity.retained_turn_terminal_count, 0);
      assert.equal(afterCreate.dsh_web_activity.omitted_agent_count, 0);
      assert.equal(afterCreate.dsh_web_activity.agents.length, 1);
      assert.match(afterCreate.dsh_web_activity.agents[0].thread_ref,
        /^backend-thread:[0-9a-f]{64}$/u);
      assert.equal(afterCreate.dsh_web_activity.agents[0].last_turn_evidence,
        "no-retained-turn-event");
      assert.equal(afterCreate.dsh_web_activity.agents[0].native_turn_state, "not-started");
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const closed = once(child, "close");
        child.kill("SIGTERM");
        await closed;
      }
    }
    assert.equal(child.exitCode, 0, stderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]"));
    assert.deepEqual(stopped?.released_session_ids, [sessionId]);
    assert.equal(stopped?.ok, true);
    assert.equal(stopped?.release_index_checkpointed, true);
    assert.equal(existsSync(observationSocket), false);
    const second = spawn(process.execPath, [cli, "--home", home, "--workspace", home, "--plan-selection", selectedPlan.path,
      "--development-observation-tcp-port", "0"],
      {env: {...process.env, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1",
        ARE_ADAPTER_OBSERVATION_TOKEN: observationToken},
      stdio: ["ignore", "pipe", "pipe"]});
    let secondStdout = "";
    let secondStderr = "";
    let secondLineBuffer = "";
    let secondReady = null;
    let secondStopped = null;
    second.stdout.on("data", chunk => {
      secondStdout = (secondStdout + chunk).slice(-8192);
      secondLineBuffer += chunk.toString("utf8");
      let newline;
      while ((newline = secondLineBuffer.indexOf("\n")) >= 0) {
        const line = secondLineBuffer.slice(0, newline);
        secondLineBuffer = secondLineBuffer.slice(newline + 1);
        try {
          const record = JSON.parse(line);
          if (record.schema_version === "are.dsh-web-host-ready/v1") secondReady = record;
          if (record.schema_version === "are.dsh-web-host-stopped/v1") secondStopped = record;
        } catch { /* Native Host output is not a readiness receipt. */ }
      }
    });
    second.stderr.on("data", chunk => { secondStderr = (secondStderr + chunk).slice(-4096); });
    try {
      const deadline = Date.now() + 180_000;
      let launched;
      while (Date.now() < deadline && second.exitCode === null && second.signalCode === null) {
        launched = secondStdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
        if (launched && secondReady) break;
        await new Promise(done => setTimeout(done, 50));
      }
      assert.equal(secondReady?.ok, true,
        `Resumed Host did not become ready: exit=${second.exitCode} signal=${second.signalCode} stderr=${secondStderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]")}`);
      assert.deepEqual(secondReady.resumed_session_ids, [sessionId]);
      assert.equal(secondReady.resume_source, "release-index");
      assert.equal(secondReady.adapter_observation, "loopback-tcp-development");
      assert.match(secondReady.observation_endpoint, /^tcp:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/u);
      const resumedObservation = await readAdapterObservation({
        socket_path: secondReady.observation_endpoint, token: observationToken});
      assert.equal(resumedObservation.source, "dsh-web-host-process");
      assert.equal(resumedObservation.dsh_web_activity.active_agent_count, 1);
      assert.equal(resumedObservation.dsh_web_activity.agents[0].native_turn_state, "not-started");
      if (process.env.ARE_TEST_WINDOWS_DSH_OBSERVATION === "1") {
        assert.ok(process.env.WSL_DISTRO_NAME,
          "Native Windows observation check requires WSL with a reachable node.exe.");
        const areCli = fileURLToPath(new URL("../../../bin/are.mjs", import.meta.url));
        const windowsCli = execFileSync("wslpath", ["-w", areCli], {encoding: "utf8"}).trim();
        const windowsObservation = JSON.parse(execFileSync("node.exe", [windowsCli,
          "adapter-status", "--json", "--socket", secondReady.observation_endpoint], {
          encoding: "utf8", timeout: 30_000,
          env: {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: observationToken,
            WSLENV: [process.env.WSLENV, "ARE_ADAPTER_OBSERVATION_TOKEN/w"]
              .filter(Boolean).join(":")},
        }));
        assert.equal(windowsObservation.source, "dsh-web-host-process");
        assert.equal(windowsObservation.runtime_epoch_id, resumedObservation.runtime_epoch_id);
        assert.equal(windowsObservation.selected_backend_adapter_id, "deepseek-harness-web/are-v1");
        assert.equal(windowsObservation.dsh_web_activity.active_agent_count, 1);
        assert.equal(windowsObservation.dsh_web_activity.agents.length, 1);
        assert.equal(windowsObservation.dsh_web_activity.agents[0].native_turn_state,
          "not-started");
        assert.equal(windowsObservation.client_link.status, "not-observed");
        assert.equal(windowsObservation.selected_path.status, "not-observed");
        assert.equal(windowsObservation.host_task_control.status, "unverified");
      }
      if (process.env.ARE_TEST_WINDOWS_DSH_UI_EXE) {
        assert.ok(process.env.WSL_DISTRO_NAME,
          "Native Windows Companion check requires WSL with a reachable node.exe.");
        const uiScript = fileURLToPath(new URL("../../../apps/desktop-companion/scripts/test-windows-ui.mjs", import.meta.url));
        const windowsUiScript = execFileSync("wslpath", ["-w", uiScript], {encoding: "utf8"}).trim();
        const windowsExe = execFileSync("wslpath", ["-w", process.env.ARE_TEST_WINDOWS_DSH_UI_EXE],
          {encoding: "utf8"}).trim();
        const windowsUi = JSON.parse(execFileSync("node.exe", [windowsUiScript, windowsExe,
          "--adapter-external-socket", secondReady.observation_endpoint,
          "--adapter-external-dsh", "--timeout-ms", "30000"], {
          encoding: "utf8", timeout: 180_000,
          env: {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: observationToken,
            WSLENV: [process.env.WSLENV, "ARE_ADAPTER_OBSERVATION_TOKEN/w"]
              .filter(Boolean).join(":")},
        }));
        assert.equal(windowsUi.ok, true);
        assert.ok(windowsUi.checks.includes("dsh-host-agent-activity-visible-without-browser-control-claim"));
        assert.ok(windowsUi.checks.includes("dsh-agent-thread-state-visible-with-explicit-claim-limit"));
      }
      if (process.env.ARE_TEST_LINUX_DSH_UI_ROOT) {
        assert.ok(process.env.DISPLAY && process.env.WEBKIT_INSPECTOR_HTTP_SERVER
          && process.env.ARE_LINUX_UI_INSPECTOR_SERVER,
        "Native Linux DSH UI check requires an isolated display and test-only WebKit inspector.");
        const uiRoot = process.env.ARE_TEST_LINUX_DSH_UI_ROOT;
        const companionExe = join(uiRoot, "bin/are-companion");
        const bundledNode = join(uiRoot, "node/bin/node");
        const bundledEntry = join(uiRoot,
          "are/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs");
        for (const path of [companionExe, bundledNode, bundledEntry]) {
          assert.ok(existsSync(path), `Missing extracted Linux Companion resource: ${path}`);
        }
        const inspector = fileURLToPath(new URL("../../../apps/desktop-companion/scripts/inspect-linux-ui.mjs", import.meta.url));
        const uiHome = mkdtempSync(join(tmpdir(), "are-dsh-web-linux-ui-"));
        const runtime = join(uiHome, "runtime");
        mkdirSync(runtime, {mode: 0o700});
        context.after(() => rmSync(uiHome, {recursive: true, force: true}));
        const companion = spawn(companionExe, ["--dashboard-only"], {
          env: {...process.env, HOME: uiHome, XDG_RUNTIME_DIR: runtime,
            GDK_BACKEND: "x11", WEBKIT_DISABLE_COMPOSITING_MODE: "1",
            ARE_COMPANION_NODE: bundledNode, ARE_COMPANION_ENTRY: bundledEntry,
            ARE_COMPANION_OBSERVATION_SOCKET: secondReady.observation_endpoint,
            ARE_ADAPTER_OBSERVATION_TOKEN: observationToken},
          stdio: ["ignore", "ignore", "pipe"],
        });
        let companionStderr = "";
        companion.stderr.on("data", chunk => {
          companionStderr = (companionStderr + chunk).slice(-2048);
        });
        try {
          const linuxUi = JSON.parse(execFileSync(bundledNode, [inspector,
            "--verify-dsh-agent-state"], {encoding: "utf8", timeout: 45_000,
            env: {...process.env, ARE_LINUX_UI_INSPECTOR_SERVER:
              process.env.ARE_LINUX_UI_INSPECTOR_SERVER}}));
          assert.equal(linuxUi.active_host_agents, 1);
          assert.equal(linuxUi.observation_time_visible, true);
          assert.equal(linuxUi.browser_task_control_claimed, false);
        } catch (error) {
          throw new Error(`Native Linux DSH UI failed: ${error.message}; Companion: ${companionStderr}`);
        } finally {
          if (companion.exitCode === null && companion.signalCode === null) {
            const closed = once(companion, "close");
            companion.kill("SIGTERM");
            await Promise.race([closed, new Promise(done => setTimeout(done, 3000))]);
            if (companion.exitCode === null && companion.signalCode === null) {
              companion.kill("SIGKILL");
              await closed;
            }
          }
        }
      }
      const url = new URL(launched);
      const login = await fetch(url, {redirect: "manual"});
      const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
      assert.ok(cookie, `Resumed Web token exchange failed: ${login.status}`);
      const response = await fetch(new URL("/api/session/list", url), {
        method: "POST", headers: {"content-type": "application/json", cookie, origin: url.origin},
        body: JSON.stringify({type: "client-request", rpcId: "are-cli-resumed-list",
          method: "session/list", payload: {args: {_request: {}}}}),
      });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.deepEqual(result.result?.value?.items.map(item => item.sessionId), [sessionId]);
    } finally {
      if (second.exitCode === null && second.signalCode === null) {
        const closed = once(second, "close");
        second.kill("SIGTERM");
        await closed;
      }
    }
    assert.equal(second.exitCode, 0,
      secondStderr.replaceAll(/token=[^\s]+/gu, "token=[redacted]"));
    assert.deepEqual(secondStopped?.released_session_ids, [sessionId]);
    assert.equal(secondStopped?.release_index_checkpointed, true);
  });
