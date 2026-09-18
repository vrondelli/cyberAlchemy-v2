import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {createSecretProviderRegistry, createSecretReference} from "../secret-provider.mjs";
import {createSopsAgeProcessSecretProvider} from "../sops-age-secret-provider.mjs";

const PYTHON = process.env.ARE_SECRET_PYTHON ?? "python3";
const SECRET_PROJECT = process.env.ARE_SECRET_PROJECT ?? fileURLToPath(new URL("../secret-bridge", import.meta.url));
const MATERIAL = "synthetic-node-bridge-material-never-log";
const REQUEST_DIGEST = "b".repeat(64);

function initializeStore(root) {
  const keyFile = join(root, "config", "keys.txt");
  const vaultFile = join(root, "data", "secrets.yaml");
  const code = [
    "import sys",
    "from secret_management.store import SopsAgeStore",
    "store=SopsAgeStore(key_file=sys.argv[1], vault_file=sys.argv[2])",
    "store.initialize()",
    "store.put('synthetic/node-key', sys.stdin.buffer.read(), purpose='node-test')"
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

test("local SOPS-age provider resolves through the neutral registry and redacts failures", async () => {
  const root = mkdtempSync(join(tmpdir(), "are-sops-provider-test-"));
  try {
    const {keyFile, vaultFile} = initializeStore(root);
    const provider = createSopsAgeProcessSecretProvider({
      provider_id: "local-test",
      python_command: PYTHON,
      project_root: SECRET_PROJECT,
      key_file: keyFile,
      vault_file: vaultFile
    });
    const registry = createSecretProviderRegistry({providers: [provider]});
    const reference = createSecretReference({provider_id: "local-test", locator: "synthetic/node-key"});
    let observed;
    const receipt = await registry.consume({
      secret_ref: reference,
      consumer_id: "model-transport",
      request_digest: REQUEST_DIGEST,
      consumer(material) { observed = Buffer.from(material).toString("utf8"); }
    });
    assert.equal(observed, MATERIAL);
    assert.equal(JSON.stringify(receipt).includes(MATERIAL), false);
    assert.equal(JSON.stringify(receipt).includes("synthetic/node-key"), false);

    const missing = createSecretReference({provider_id: "local-test", locator: "synthetic/missing-key"});
    await assert.rejects(
      () => registry.consume({secret_ref: missing, consumer_id: "model-transport", request_digest: REQUEST_DIGEST, consumer() {}}),
      (error) => error.code === "resolution-denied" && !String(error).includes("missing-key")
    );
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
