import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {launchHen11Vps} from "./launch-vps.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`hen11-continuation.${reason}`); };

export function loadContinuation(path, freezeSha256) {
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  need(receipt?.schema_version === "are.hen11-task-continuation/v1" && receipt.target_freeze_sha256 === freezeSha256, "receipt");
  need(receipt.preserved_task_id === "contextbench-4" && /^[a-f0-9]{64}$/.test(receipt.preserved_row_sha256 ?? ""), "preserved-task");
  const bytes = readFileSync(receipt.preserved_row_path); need(sha(bytes) === receipt.preserved_row_sha256, "preserved-row-drift");
  const row = JSON.parse(bytes); need(row.task_id === receipt.preserved_task_id && row.result?.status === "final_context_selected" && row.result.native_export && row.evidence?.ledger?.evidence_consistent === true && row.evidence?.windows?.measured_windows_verified === true, "preserved-row-invalid");
  need(Array.isArray(receipt.forbidden_indeterminate_request_sha256) && receipt.forbidden_indeterminate_request_sha256.every(value => /^[a-f0-9]{64}$/.test(value)), "forbidden-requests");
  return {receipt, row};
}

if (process.argv[1] === import.meta.filename) {
  const [freezePath, freezeSha256, continuationPath] = process.argv.slice(2);
  try { const {row} = loadContinuation(continuationPath, freezeSha256); const controller = new AbortController(); process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort()); console.log(canonicalJson(await launchHen11Vps({freezePath, freezeSha256, signal: controller.signal, host: {preserved_rows: new Map([[row.task_id, row]])}}))); }
  catch (error) { console.error(canonicalJson({status: "failed", error: String(error.message), authority_effect: "none"})); process.exitCode = 2; }
}
