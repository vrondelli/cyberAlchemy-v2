import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import catalog from "./host-client-method-catalog.v1.json" with {type: "json"};
import {hostMethodCatalogBindingCheck} from "./host-method-policy.mjs";

const SCHEMAS = [
  ["ClientRequest.json", "client_request"],
  ["ClientNotification.json", "client_notification"],
  ["ServerNotification.json", "server_notification"],
  ["ServerRequest.json", "server_request"],
];

function checkSchema(outputDir, name, stem) {
  let bytes;
  try { bytes = readFileSync(join(outputDir, name)); }
  catch { throw new Error(`host.method-catalog-schema-unavailable:${name}`); }
  if (createHash("sha256").update(bytes).digest("hex") !== catalog[`${stem}_schema_sha256`]) {
    throw new Error(`host.method-catalog-schema-drift:${name}`);
  }
  let schema;
  try { schema = JSON.parse(bytes.toString("utf8")); }
  catch { throw new Error(`host.method-catalog-schema-invalid:${name}`); }
  const expectedMethods = catalog[`${stem}_methods`];
  const methods = schema.oneOf?.map((entry) => entry.properties?.method?.enum?.[0]);
  if (!Array.isArray(methods) || methods.length !== expectedMethods.length
    || methods.some((method, index) => method !== expectedMethods[index])) {
    throw new Error(`host.method-catalog-method-drift:${name}`);
  }
  if (!stem.startsWith("server_")) return schema;
  const required = [];
  const optional = [];
  const requiredTurn = [];
  const optionalTurn = [];
  for (const entry of schema.oneOf) {
    const method = entry.properties?.method?.enum?.[0];
    const definition = schema.definitions?.[entry.properties?.params?.$ref?.split("/").at(-1)];
    if (!definition) throw new Error(`host.method-catalog-params-drift:${name}:${method}`);
    if (definition.required?.includes("threadId")) required.push(method);
    else if (Object.hasOwn(definition.properties ?? {}, "threadId")) optional.push(method);
    if (definition.required?.includes("turnId")) requiredTurn.push(method);
    else if (Object.hasOwn(definition.properties ?? {}, "turnId")) optionalTurn.push(method);
  }
  for (const [actual, expected] of [[required, catalog[`${stem}_required_thread_id_methods`]],
    [optional, catalog[`${stem}_optional_thread_id_methods`]]]) {
    if (actual.length !== expected.length || actual.some((method, index) => method !== expected[index])) {
      throw new Error(`host.method-catalog-thread-scope-drift:${name}`);
    }
  }
  if (requiredTurn.length !== catalog[`${stem}_required_turn_id_methods`].length
    || requiredTurn.some((method, index) => method !== catalog[`${stem}_required_turn_id_methods`][index])) {
    throw new Error(`host.method-catalog-turn-scope-drift:${name}`);
  }
  if (optionalTurn.length !== catalog[`${stem}_optional_turn_id_methods`].length
    || optionalTurn.some((method, index) => method !== catalog[`${stem}_optional_turn_id_methods`][index])) {
    throw new Error(`host.method-catalog-optional-turn-scope-drift:${name}`);
  }
  return schema;
}

function dynamicToolFields(schema) {
  const declared = method => {
    const entry = schema.oneOf.find(value => value.properties?.method?.enum?.[0] === method);
    const name = entry?.properties?.params?.$ref?.split("/").at(-1);
    const definition = schema.definitions?.[name];
    if (!definition || !definition.properties) throw new Error(`host.method-catalog-params-drift:ClientRequest.json:${method}`);
    return Object.hasOwn(definition.properties, "dynamicTools");
  };
  // A declared field is only schema capability, not proof that replacement
  // removes a persisted tool or that the desktop client has released its writer.
  return {thread_start_dynamic_tools_declared: declared("thread/start"),
    thread_resume_dynamic_tools_declared: declared("thread/resume")};
}

export function verifyHostMethodCatalog({command, prefix_args = []} = {}) {
  if (typeof command !== "string" || !command || !Array.isArray(prefix_args)
    || prefix_args.some((arg) => typeof arg !== "string")) {
    return {schema_version: "are.host-method-catalog-verification/v1", ok: false,
      reason: "host.method-catalog-command-invalid", authority_effect: "none"};
  }
  let observedVersion = null;
  let outputDir = null;
  try {
    try { observedVersion = execFileSync(command, [...prefix_args, "--version"], {encoding: "utf8", timeout: 5000}).trim(); }
    catch { throw new Error("host.method-catalog-version-unavailable"); }
    if (!hostMethodCatalogBindingCheck(observedVersion)) throw new Error("host.method-catalog-version-drift");
    outputDir = mkdtempSync(join(tmpdir(), "are-host-method-catalog-"));
    try {
      execFileSync(command, [...prefix_args, "app-server", "generate-json-schema", "--experimental", "--out", outputDir],
        {timeout: 30000, maxBuffer: 2 * 1024 * 1024});
    } catch { throw new Error("host.method-catalog-generation-failed"); }
    let clientRequestSchema;
    for (const [name, stem] of SCHEMAS) {
      const schema = checkSchema(outputDir, name, stem);
      if (name === "ClientRequest.json") clientRequestSchema = schema;
    }
    return {schema_version: "are.host-method-catalog-verification/v1", ok: true,
      observed_codex_version: observedVersion,
      request_methods: catalog.client_request_methods.length,
      notification_methods: catalog.client_notification_methods.length,
      server_notification_methods: catalog.server_notification_methods.length,
      server_request_methods: catalog.server_request_methods.length,
      schema_fields: dynamicToolFields(clientRequestSchema),
      authority_effect: "none"};
  } catch (error) {
    return {schema_version: "are.host-method-catalog-verification/v1", ok: false,
      observed_codex_version: observedVersion, reason: error.message, authority_effect: "none"};
  } finally {
    if (outputDir) rmSync(outputDir, {recursive: true, force: true});
  }
}
