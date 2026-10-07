import {appendFileSync} from "node:fs";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Service} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/cordis")).href);
const {createUserMessage} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href);

// Disposable conformance probe. This is deliberately not an ARE permit owner.
export default class WebSessionAppendAdmissionProbe extends Service {
  constructor(ctx) {
    super(ctx, "are-web-session-append-admission-probe");
    const marker = process.env.ARE_DSH_SESSION_APPEND_PROBE_MARKER;
    if (!marker) throw new Error("ARE_DSH_SESSION_APPEND_PROBE_MARKER is required");
    appendFileSync(marker, "probe-mounted\n");
    ctx.on("session/created", (session) => {
      session.installAppendAdmissionGuardV1((event) => {
        if (event.type === "agent/inbox/spliced" && event.data.inserted.length > 0) {
          appendFileSync(marker, "inbox-insert-denied\n");
          return false;
        }
        if (event.type === "user/message") {
          appendFileSync(marker, "user-surface-denied\n");
          return false;
        }
        return true;
      });
      appendFileSync(marker, "session-guard-installed\n");
    });
    ctx.on("agent/created", ({agent}) => {
      const synthetic = createUserMessage({
        content: [{type: "text", text: "local admission probe; never dispatch"}],
        source: {kind: "plugin", plugin: "are-web-session-append-admission-probe"},
      });
      for (const [name, attempt] of [
        ["direct-inbox", () => agent.session.append("agent/inbox/spliced", {
          target: "next-turn", start: agent.inbox.nextTurn.length, inserted: [synthetic],
        })],
        ["direct-user-surface", () => agent.session.append("user/message", synthetic, {surfaceOp: "append"})],
      ]) {
        try {
          attempt();
          throw new Error(`${name} unexpectedly committed`);
        } catch (error) {
          if (error?.message !== "session append admission denied") throw error;
          appendFileSync(marker, `${name}-rejected\n`);
        }
      }
      if (agent.inbox.nextTurn.some((message) => message.id === synthetic.id)) {
        throw new Error("denied synthetic message reached inbox");
      }
      if (agent.session.snapshotEvents().some((event) =>
        (event.type === "agent/inbox/spliced" && event.data.inserted.some((message) => message.id === synthetic.id)) ||
        (event.type === "user/message" && event.data.id === synthetic.id))) {
        throw new Error("denied synthetic message reached session log");
      }
      appendFileSync(marker, "denied-writes-absent\n");
    });
  }
}
