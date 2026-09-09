import {createHash} from "node:crypto";

export const CODING_AGENT_EVENT_SCHEMA = "are.coding-agent-event/v1";
const KEYS = new Set(["schema_version", "event_id", "kind", "tool", "candidate", "authority_effect"]);

function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function digest(value) { return createHash("sha256").update(stable(value)).digest("hex"); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function blocked(reasons) { return freeze({ok: false, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"}); }

export function parseAgentEvent(raw) {
  let value;
  try { value = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return blocked(["event.json-invalid"]); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return blocked(["event.object-required"]);
  const reasons = [];
  if (Object.keys(value).some((key) => !KEYS.has(key))) reasons.push("event.unknown-field");
  if (value.schema_version !== CODING_AGENT_EVENT_SCHEMA) reasons.push("event.schema-version-invalid");
  if (typeof value.event_id !== "string" || !value.event_id) reasons.push("event.id-required");
  if (!['tool-request', 'final-candidate'].includes(value.kind)) reasons.push("event.kind-invalid");
  if (value.authority_effect !== "none") reasons.push("event.authority-effect-invalid");
  if (value.kind === "tool-request") {
    if (!value.tool || typeof value.tool !== "object" || Array.isArray(value.tool) || Object.keys(value.tool).some((key) => !["name", "arguments"].includes(key)) || typeof value.tool.name !== "string" || !value.tool.name || !value.tool.arguments || typeof value.tool.arguments !== "object" || Array.isArray(value.tool.arguments)) reasons.push("event.tool-invalid");
    if (value.candidate !== undefined) reasons.push("event.candidate-forbidden");
  }
  if (value.kind === "final-candidate") {
    if (!value.candidate || typeof value.candidate !== "object" || Array.isArray(value.candidate)) reasons.push("event.candidate-required");
    if (value.tool !== undefined) reasons.push("event.tool-forbidden");
  }
  if (reasons.length) return blocked(reasons);
  const normalized = freeze(structuredClone(value));
  return freeze({ok: true, value: normalized, event_digest: digest(normalized), authority_effect: "none"});
}
