import {appendFileSync} from "node:fs";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Service} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/cordis")).href);

// Disposable timing probe only. A synchronous creation veto is not an ARE
// identity assertion, durable gateway binding, or pre-inbox admission gate.
export default class WebSessionCreatedVetoProbe extends Service {
  constructor(ctx) {
    super(ctx, "are-web-session-created-veto-probe");
    const marker = process.env.ARE_DSH_CREATION_VETO_MARKER;
    const targetId = process.env.ARE_DSH_CREATION_VETO_SESSION_ID;
    const asyncId = process.env.ARE_DSH_CREATION_ASYNC_SESSION_ID;
    if (!marker || !targetId || !asyncId) throw new Error("ARE DSH creation probe inputs are required");
    appendFileSync(marker, "probe-mounted\n");
    ctx.on("session/created", (session) => {
      if (session.id === targetId) {
        appendFileSync(marker, "session-created-veto\n");
        throw new Error("ARE disposable session creation veto");
      }
      if (session.id === asyncId) {
        appendFileSync(marker, "session-created-async-reject\n");
        return Promise.reject(new Error("ARE disposable asynchronous creation rejection"));
      }
    });
    ctx.on("agent/created", ({agent}) => {
      if (agent.id === targetId) appendFileSync(marker, "agent-created-after-veto\n");
      if (agent.id === asyncId) appendFileSync(marker, "agent-created-after-async-reject\n");
    });
  }
}
