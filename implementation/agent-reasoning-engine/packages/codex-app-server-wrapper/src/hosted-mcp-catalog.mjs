import {isRecord} from "./canonical.mjs";

export function hostedMcpRelayCatalogPosture(result) {
  if (!isRecord(result) || !Array.isArray(result.data) || result.nextCursor !== null) return {ok: false};
  const relays = result.data.filter((server) => server?.name === "are_hosted_hook_relay");
  if (relays.length !== 1) return {ok: false};
  const relay = relays[0];
  if (relay.runtimeStatus !== "connected" || relay.toolsError !== null || !isRecord(relay.tools)) return {ok: false};
  const tool = relay.tools.are_hook_observe;
  if (!isRecord(tool) || tool.name !== "are_hook_observe") return {ok: false};
  return {ok: true};
}

// A restricted managed session may expose no MCP tools, or exactly the known
// hosted hook relay. A listing is a one-use pre-turn snapshot, not a durable
// claim about later configuration or a substitute for effect mediation.
export function hostedRestrictedMcpCatalogPosture(result, {requireRelay = false} = {}) {
  if (!isRecord(result) || !Array.isArray(result.data) || result.nextCursor !== null) return {ok: false};
  if (!requireRelay) return {ok: result.data.length === 0};
  if (result.data.length !== 1) return {ok: false};
  const relay = result.data[0];
  if (relay?.name !== "are_hosted_hook_relay" || relay.runtimeStatus !== "connected"
    || relay.toolsError !== null || !isRecord(relay.tools)) return {ok: false};
  const toolNames = Object.keys(relay.tools);
  return {ok: toolNames.length === 1 && toolNames[0] === "are_hook_observe"
    && isRecord(relay.tools.are_hook_observe)
    && relay.tools.are_hook_observe.name === "are_hook_observe"};
}
