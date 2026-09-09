import {createHash} from "node:crypto";

function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

export async function runProviderConformance({transports, prompt, expected_final_bytes} = {}) {
  if (!Array.isArray(transports) || transports.length === 0 || transports.some((transport) => typeof transport?.generate !== "function")) throw new TypeError("transports are required.");
  const checks = [];
  for (const transport of transports) {
    try {
      const generated = await transport.generate({prompt, run_id: `provider-conformance:${transport.transport_id}`});
      const valid = generated?.final_bytes === expected_final_bytes && generated?.receipt?.schema_version === "are.model-turn-transport-receipt/v1" && generated.receipt.authority_effect === "none";
      checks.push({transport_id: transport.transport_id, status: valid ? "PASS" : "BLOCK", reason_codes: valid ? [] : ["provider.conformance-output-invalid"], receipt: generated?.receipt ?? null, authority_effect: "none"});
    } catch {
      checks.push({transport_id: transport.transport_id, status: "BLOCK", reason_codes: ["provider.conformance-transport-failed"], receipt: null, authority_effect: "none"});
    }
  }
  const status = checks.every((entry) => entry.status === "PASS") ? "PASS_BOUNDED" : "BLOCK";
  const material = {schema_version: "are.provider-conformance-matrix/v1", status, reason_codes: [...new Set(checks.flatMap((entry) => entry.reason_codes))].sort(), checks, live_calls_authorized: false, authority_effect: "none"};
  return Object.freeze({...material, result_digest: sha256(stable(material))});
}
