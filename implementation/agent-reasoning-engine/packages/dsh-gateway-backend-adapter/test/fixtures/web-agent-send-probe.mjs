import {appendFileSync} from "node:fs";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {Service} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/cordis")).href);

// Diagnostic only. Replacing an Agent method is not a supported DSH ingress
// contract and must never be used as the product admission implementation.
export default class WebAgentSendProbe extends Service {
  constructor(ctx) {
    super(ctx, "are-web-agent-send-probe");
    const marker = process.env.ARE_DSH_AGENT_SEND_PROBE_MARKER;
    if (!marker) throw new Error("ARE_DSH_AGENT_SEND_PROBE_MARKER is required");
    appendFileSync(marker, "probe-mounted\n");
    ctx.on("agent/created", ({agent}) => {
      agent.send = () => {
        appendFileSync(marker, "send-denied-before-inbox\n");
        throw new Error("ARE agent-send seam probe denied prompt");
      };
      appendFileSync(marker, "agent-patched\n");
    });
    ctx.on("session/event", (_session, event) => {
      if (event?.type === "agent/inbox/spliced") appendFileSync(marker, "inbox-spliced\n");
    });
  }
}
