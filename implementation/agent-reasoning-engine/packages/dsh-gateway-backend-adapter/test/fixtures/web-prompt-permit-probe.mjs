import {appendFileSync} from "node:fs";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

import {createDshWebPromptPermitBroker} from "../../src/web-prompt-permit.mjs";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {SessionController} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-api-session-controller")).href);
const {createUserMessage} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href);

// Disposable Web conformance fixture, not a qualified profile. The local
// synthetic Host principal is deliberately not a P1g browser assertion.
export default class WebPromptPermitProbe extends SessionController {
  constructor(ctx, config, internals) {
    super(ctx, config, internals);
    const marker = process.env.ARE_DSH_WEB_PERMIT_PROBE_MARKER;
    if (!marker) throw new Error("ARE_DSH_WEB_PERMIT_PROBE_MARKER is required");
    const note = (value) => appendFileSync(marker, `${value}\n`);
    const broker = createDshWebPromptPermitBroker({
      verify_host_binding: async ({agent, generation}) => ({
        host_principal: "disposable-local-host-test-only",
        native_session_id: agent.id,
        agent_generation: generation,
      }),
      on_denial: ({event_type, reason}) => note(`denied:${event_type}:${reason}`),
    });
    this.arePromptBroker = broker;
    note("controller-mounted");
    const earlyMessage = createUserMessage({content: [{type: "text", text: "early writer must never dispatch"}],
      source: {kind: "plugin", plugin: "are-early-writer-probe"}});
    const denyEarlyWriter = (session, markerName) => {
      try {
        session.append("user/message", earlyMessage, {surfaceOp: "append"});
        throw new Error(`${markerName} unexpectedly committed`);
      } catch (error) {
        if (error?.message !== "session append admission denied") throw error;
        note(`${markerName}-denied`);
      }
    };
    // Register before the owner listener: event-order installation is too late.
    ctx.on("session/created", (session) => {
      denyEarlyWriter(session, "early-listener-write");
    });
    ctx.sessions.installAppendAdmissionFactoryV1((session) => {
      broker.installSession(session);
      note("session-guard-installed-at-prepare");
    });
    // A prepared but unpublished Session models AgentLoop's setup window.
    denyEarlyWriter(ctx.sessions.prepare("are-pre-announcement-probe"), "setup-window-write");
    ctx.on("agent/created", ({agent}) => {
      broker.activateAgent(agent);
      note("agent-generation-bound");
    });
    ctx.on("session/disposed", (session) => broker.disposeSession(session));
    ctx.on("session/event", (_session, event) => {
      if (event.type === "agent/inbox/spliced" && event.data.inserted.length > 0) note("native-inbox-inserted");
      if (event.type === "user/message") note("native-user-message");
      if (event.type === "turn/start" || event.type === "turn/end") note(`native-${event.type}`);
    });
    ctx.on("agent/error", ({error}) => note(`agent-error:${String(error).slice(0, 300)}`));
  }

  async prompt(request, signal) {
    signal.throwIfAborted();
    const found = await this.agents.resolveAgent(request.sessionId);
    if ("error" in found) throw found.error;
    const result = await this.arePromptBroker.admitPrompt({agent: found.agent, request,
      invoke: () => super.prompt(request, signal)});
    appendFileSync(process.env.ARE_DSH_WEB_PERMIT_PROBE_MARKER, "are-prepared-native-ack\n");
    return result.accepted;
  }
}
