import {appendFileSync} from "node:fs";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Service} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/cordis")).href);
const {createUserMessage} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href);

// Diagnostic only. A per-instance method override is not a supported DSH
// admission contract and must never be used in an ARE-owned Web profile.
export default class WebInboxMutateProbe extends Service {
  constructor(ctx) {
    super(ctx, "are-web-inbox-mutate-probe");
    const marker = process.env.ARE_DSH_INBOX_MUTATE_PROBE_MARKER;
    if (!marker) throw new Error("ARE_DSH_INBOX_MUTATE_PROBE_MARKER is required");
    appendFileSync(marker, "probe-mounted\n");
    ctx.on("agent/created", ({agent}) => {
      const original = agent.inbox.mutate;
      if (typeof original !== "function") throw new Error("pinned Inbox.mutate seam missing");
      agent.inbox.mutate = function (...args) {
        if (Array.isArray(args[3]) && args[3].length > 0) {
          appendFileSync(marker, "mutate-denied-before-inbox\n");
          throw new Error("ARE inbox-mutate seam probe denied insertion");
        }
        return original.apply(this, args);
      };
      appendFileSync(marker, "agent-mutator-patched\n");
      for (const [name, attempt] of [
        ["direct-mutate", () => agent.inbox.mutate("next-turn", Infinity, 0, [{id: "probe-direct-mutate"}], true)],
        ["direct-splice", () => agent.inbox.splice("next-turn", Infinity, 0, [{id: "probe-direct-splice"}])],
      ]) {
        try {
          attempt();
          throw new Error(`${name} unexpectedly reached native inbox`);
        } catch (error) {
          if (error?.message !== "ARE inbox-mutate seam probe denied insertion") throw error;
          appendFileSync(marker, `${name}-denied\n`);
        }
      }
      // This intentionally demonstrates the remaining lower bypass. The
      // synthetic message is removed synchronously before the Agent can run.
      const synthetic = createUserMessage({
        content: [{type: "text", text: "test-only Session append; never dispatch"}],
        source: {kind: "plugin", plugin: "are-web-inbox-mutate-probe"},
      });
      const appended = agent.session.append("agent/inbox/spliced", {
        target: "next-turn", start: agent.inbox.nextTurn.length, inserted: [synthetic],
      });
      if (appended.data.inserted[0]?.id !== synthetic.id) throw new Error("direct Session append did not retain message");
      appendFileSync(marker, "session-direct-inserted\n");
      if (!agent.inbox.nextTurn.some((message) => message.id === synthetic.id)) {
        throw new Error("direct Session append did not project into Agent inbox");
      }
      appendFileSync(marker, "inbox-projected\n");
      if (!agent.inbox.remove(synthetic.id)) throw new Error("synthetic message could not be canceled");
      if (agent.inbox.nextTurn.some((message) => message.id === synthetic.id)) {
        throw new Error("synthetic message remained pending after cancellation");
      }
      if (agent.session.snapshotEvents().some((event) => event.type === "turn/start")) {
        throw new Error("synthetic message started a turn");
      }
      appendFileSync(marker, "synthetic-cancelled-before-turn\n");
    });
    ctx.on("session/event", (_session, event) => {
      if (event?.type === "agent/inbox/spliced") appendFileSync(marker, "inbox-spliced\n");
    });
  }
}
