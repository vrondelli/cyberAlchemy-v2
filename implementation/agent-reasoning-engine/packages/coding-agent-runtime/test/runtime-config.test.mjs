import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {existsSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {createConfiguredModelTransport, parseCodingAgentRunConfig} from "../runtime-config.mjs";

const PYTHON = process.env.ARE_SECRET_PYTHON ?? "python3";
const WORKSPACE_ROOT = fileURLToPath(new URL("../../../../../../", import.meta.url));
const NESTED_SECRET_PROJECT = resolve(WORKSPACE_ROOT, "projects/secret-management");
const SIBLING_SECRET_PROJECT = resolve(WORKSPACE_ROOT, "domainspec-core/projects/secret-management");
const SECRET_PROJECT = process.env.ARE_SECRET_PROJECT ?? (existsSync(NESTED_SECRET_PROJECT) ? NESTED_SECRET_PROJECT : SIBLING_SECRET_PROJECT);
const MATERIAL = "synthetic-configured-agent-secret-never-log";

function baseConfig(credential) {
  return {
    schema_version: "are.coding-agent-run-config/v1",
    model: {
      transport: "openai-compatible",
      base_url: "https://models.invalid/v1",
      model: "synthetic-model",
      ...(credential ? {credential} : {})
    },
    observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"],
    mutation_allowlist: ["src/range.mjs"],
    verification_command: [process.execPath, "--test"]
  };
}

function initializeStore(root) {
  const keyFile = join(root, "config", "keys.txt");
  const vaultFile = join(root, "data", "secrets.yaml");
  const code = [
    "import sys",
    "from secret_management.store import SopsAgeStore",
    "store=SopsAgeStore(key_file=sys.argv[1], vault_file=sys.argv[2])",
    "store.initialize()",
    "store.put('synthetic/model-key', sys.stdin.buffer.read(), purpose='model-provider')"
  ].join(";");
  const completed = spawnSync(PYTHON, ["-c", code, keyFile, vaultFile], {
    cwd: SECRET_PROJECT,
    input: MATERIAL,
    encoding: "utf8",
    env: {LANG: "C", LC_ALL: "C", PYTHONDONTWRITEBYTECODE: "1", PYTHONPATH: SECRET_PROJECT}
  });
  assert.equal(completed.status, 0, completed.error?.code ?? completed.stderr ?? "Synthetic store setup failed.");
  return {keyFile, vaultFile};
}

test("strict run configuration rejects embedded or unknown credential fields", () => {
  const config = baseConfig();
  config.model.api_key = MATERIAL;
  assert.throws(() => parseCodingAgentRunConfig(config), /unsupported field/u);

  const local = baseConfig({provider_kind: "local-sops-age", provider_id: "local", locator: "synthetic/model-key", material: MATERIAL});
  assert.throws(() => parseCodingAgentRunConfig(local), /unsupported field/u);
});

test("configured environment reference supplies deployment injection without material in receipts", async () => {
  const credential = {provider_kind: "environment", provider_id: "deploy-env", locator: "MODEL_API_KEY"};
  let authorization;
  const configured = createConfiguredModelTransport({
    config: baseConfig(credential),
    env: {MODEL_API_KEY: MATERIAL},
    fetch_impl: async (_url, options) => {
      authorization = options.headers.authorization;
      return {ok: true, status: 200, async json() { return {choices: [{message: {content: "environment-final-bytes"}}]}; }};
    }
  });
  const generated = await configured.model_transport.generate({prompt: "synthetic prompt", run_id: "configured-environment-test"});
  assert.equal(authorization, `Bearer ${MATERIAL}`);
  const rendered = JSON.stringify(generated.receipt);
  assert.equal(rendered.includes(MATERIAL), false);
  assert.equal(rendered.includes("MODEL_API_KEY"), false);
  assert.equal(generated.receipt.api_key_source, "secret-provider:deploy-env");
});

test("configured local SOPS credential reaches the model request but not its receipt", async () => {
  const root = mkdtempSync(join(tmpdir(), "are-runtime-config-test-"));
  try {
    const {keyFile, vaultFile} = initializeStore(root);
    const config = baseConfig({
      provider_kind: "local-sops-age",
      provider_id: "local-sops",
      locator: "synthetic/model-key",
      python_command: PYTHON,
      project_root: SECRET_PROJECT,
      key_file: keyFile,
      vault_file: vaultFile
    });
    let authorization;
    const configured = createConfiguredModelTransport({
      config,
      fetch_impl: async (_url, options) => {
        authorization = options.headers.authorization;
        return {ok: true, status: 200, async json() { return {choices: [{message: {content: "synthetic-final-bytes"}}]}; }};
      }
    });
    const generated = await configured.model_transport.generate({prompt: "synthetic prompt", run_id: "configured-local-test"});
    assert.equal(authorization, `Bearer ${MATERIAL}`);
    assert.equal(generated.final_bytes, "synthetic-final-bytes");
    const rendered = JSON.stringify(generated.receipt);
    for (const forbidden of [MATERIAL, "synthetic/model-key", keyFile, vaultFile]) assert.equal(rendered.includes(forbidden), false);
    assert.equal(generated.receipt.api_key_source, "secret-provider:local-sops");
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
