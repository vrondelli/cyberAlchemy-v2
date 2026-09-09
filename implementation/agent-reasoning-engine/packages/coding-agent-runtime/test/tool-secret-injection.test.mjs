import assert from "node:assert/strict";
import test from "node:test";

import {createInjectedSecretProvider, createSecretProviderRegistry, createSecretReference} from "../secret-provider.mjs";
import {createToolSecretBinding, runSecretBoundSandboxCommand} from "../tool-secret-injection.mjs";

test("tool-scoped injection redacts material and exposes only reference projections", async () => {
  const secret = "canary-super-secret";
  const reference = createSecretReference({provider_id: "fixture", locator: "token", purpose: "sandbox-tool"});
  const registry = createSecretProviderRegistry({providers: [createInjectedSecretProvider({provider_id: "fixture", resolve: async () => Buffer.from(secret)})]});
  const binding = createToolSecretBinding({binding_id: "test-token", command_name: "node", secrets: [{environment_name: "TEST_TOKEN", secret_ref: reference}]});
  let observedEnvironment;
  const sandbox = {run(command, {environment}) { observedEnvironment = {...environment}; const redacted = `${environment.TEST_TOKEN}`.replaceAll(secret, "[REDACTED]"); return {schema_version: "are.coding-agent-sandbox-result/v1", ok: true, reason_codes: [], command, stdout: redacted, stderr: redacted, injected_environment_names: Object.keys(environment), authority_effect: "none"}; }};
  const result = await runSecretBoundSandboxCommand({binding, secret_registry: registry, sandbox, command: ["node", "--test"]});
  assert.equal(result.ok, true);
  assert.equal(observedEnvironment.TEST_TOKEN, secret);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(Object.hasOwn(binding.projection.secrets[0].secret_reference, "locator"), false);
  assert.deepEqual(result.injected_environment_names, ["TEST_TOKEN"]);
});

test("secret binding rejects command mismatch before resolution", async () => {
  let resolutions = 0;
  const reference = createSecretReference({provider_id: "fixture", locator: "token", purpose: "sandbox-tool"});
  const registry = createSecretProviderRegistry({providers: [createInjectedSecretProvider({provider_id: "fixture", resolve: async () => { resolutions += 1; return Buffer.from("secret"); }})]});
  const binding = createToolSecretBinding({binding_id: "test-token", command_name: "node", secrets: [{environment_name: "TEST_TOKEN", secret_ref: reference}]});
  const result = await runSecretBoundSandboxCommand({binding, secret_registry: registry, sandbox: {run() { throw new Error("must not run"); }}, command: ["npm", "test"]});
  assert.deepEqual(result.reason_codes, ["tool.secret-binding-command-mismatch"]);
  assert.equal(resolutions, 0);
});
