import {createHash} from "node:crypto";
import {lstatSync, readFileSync} from "node:fs";
import {resolve, sep} from "node:path";

import {semanticTextOutputValidators} from "../module-port/semantic-text.mjs";
import {composeStaticModulePort} from "../module-port/static-composition.mjs";

export const CONFIGURATION_ID = "are-production-semantic-core-v2-candidate";
export const CONFIGURATION_SHA256 = "71673fd5302bc521513d530eccfc36c2c81b01d967916ee013edf203a2e910c8";
export const MODULE_SET_DIGEST = "f87d8f92824c2b1fab2635742f71d630ce3121c155b509fa13ce4fe0c6e1a926";
const BINDING_ID = "ARE-MODULE-PORT-RUST-BINDING-002-CANDIDATE";
const base = "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2";
const bound = Object.freeze({
  configuration: {path: `${base}/generated/runtime/configuration.json`, sha256: CONFIGURATION_SHA256},
  bindings: {path: `${base}/generated/provenance/runtime-bindings.json`, sha256: "47ce3e3cd632a5b111c4df20b22dc64180bfd0e858897d0e7f71ddda2d04bdcc"},
  evidence: {path: `${base}/evidence/runtime-conformance.json`, sha256: "ebc2bc6ba9a14507f74d3e1898c5e54ec95207b54839b40cef09d2f8c30fc40c"},
  adapter: {path: "implementation/agent-reasoning-engine/packages/module-port/alch-semantic-adapter.mjs", sha256: "79c744c2ea3f92c3aaf102a697d4b306d6660d9c1311c14b7eef2c5111457039"},
  runtime: {path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/consumer-runtime.mjs", sha256: "b4a58d12309c93632fd3487d6a8fcdf778993d688e45e4b72637012f01d095a0"},
  compiled: {path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/evidence/bundle/app/prelude.mjs", sha256: "a959563fbfab815c2ac08bff8835384d1102349b763ad10d918a248a9ce74cf7"},
});

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const blocked = (reason) => Object.freeze({schema_version: "are.module-port-cutover-preview/v2-candidate", ok: false,
  disposition: "blocked", reason_codes: [reason], configuration_id: CONFIGURATION_ID,
  runtime_admitted: false, activation_selected: false, cutover_completed: false,
  enforcement_active: false, effect_authorized: false, authority_effect: "none", port: null});

function readExact(root, entry) {
  let current = resolve(root);
  if (lstatSync(current).isSymbolicLink()) throw new Error("preview.repository-root-symlink");
  for (const part of entry.path.split("/")) {
    if (!part || part === "." || part === ".." || part.includes(sep)) throw new Error("preview.path-invalid");
    current = resolve(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`preview.symlink-forbidden:${entry.path}`);
  }
  if (!lstatSync(current).isFile()) throw new Error(`preview.file-not-regular:${entry.path}`);
  if (digest(readFileSync(current)) !== entry.sha256) throw new Error(`preview.digest-mismatch:${entry.path}`);
  return current;
}

function receiptValid(receipt) {
  return receipt?.schema_version === "are.module-port-rust-binding-receipt/v2-candidate"
    && receipt.binding_id === BINDING_ID && receipt.disposition === "PASS"
    && receipt.subject_configuration_id === CONFIGURATION_ID
    && receipt.subject_configuration_sha256 === CONFIGURATION_SHA256
    && receipt.module_set_digest === MODULE_SET_DIGEST
    && receipt.runtime_admission_verified === false && receipt.binding_admitted === false
    && receipt.enforcement_active === false && receipt.effect_authorized === false
    && receipt.authority_effect === "none";
}

/** Local composition preview only. A candidate verifier receipt is not admission. */
export async function previewCandidateModulePort({repository_root, verifier_receipt} = {}) {
  if (!receiptValid(verifier_receipt)) return blocked("preview.verifier-receipt-invalid");
  if (typeof repository_root !== "string" || !repository_root) return blocked("preview.repository-root-invalid");
  let paths;
  try { paths = Object.fromEntries(Object.entries(bound).map(([key, entry]) => [key, readExact(repository_root, entry)])); }
  catch (error) { return blocked(error?.message ?? "preview.bound-file-unavailable"); }
  let configuration, bindings, evidence;
  try {
    configuration = JSON.parse(readFileSync(paths.configuration));
    bindings = JSON.parse(readFileSync(paths.bindings));
    evidence = JSON.parse(readFileSync(paths.evidence));
  } catch { return blocked("preview.bound-json-invalid"); }
  if (configuration.configuration_id !== CONFIGURATION_ID
    || configuration.modules?.length !== 1
    || configuration.modules[0]?.factory_id !== "createAlchSemanticAdapter"
    || bindings.modules?.[0]?.factory_source_sha256 !== bound.adapter.sha256
    || bindings.modules?.[0]?.runtime_source_sha256 !== bound.runtime.sha256
    || bindings.modules?.[0]?.compiled_source_sha256 !== bound.compiled.sha256
    || evidence.status !== "PASS" || evidence.runtime_admitted !== false
    || evidence.bindings?.runtime_configuration_sha256 !== CONFIGURATION_SHA256) return blocked("preview.subject-claims-invalid");
  let composition;
  try {
    const [{createAlchSemanticAdapter}, {semanticKey, containsPhrase}] = await Promise.all([
      import("../module-port/alch-semantic-adapter.mjs"),
      import("../../../../language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/consumer-runtime.mjs"),
    ]);
    composition = composeStaticModulePort({configuration,
      adapter_factories: {createAlchSemanticAdapter: () => createAlchSemanticAdapter({semanticKey, containsPhrase})},
      output_validators: semanticTextOutputValidators});
  } catch { return blocked("preview.verified-source-load-failed"); }
  if (!composition.ok || composition.module_set_digest !== MODULE_SET_DIGEST) return blocked("preview.module-composition-blocked");
  return Object.freeze({schema_version: "are.module-port-cutover-preview/v2-candidate", ok: true,
    disposition: "available-candidate", reason_codes: [], configuration_id: CONFIGURATION_ID,
    module_set_digest: composition.module_set_digest, runtime_admitted: false,
    activation_selected: false, cutover_completed: false, enforcement_active: false,
    effect_authorized: false, authority_effect: "none", port: composition.port});
}
