import {realpathSync} from "node:fs";
import {fileURLToPath} from "node:url";

// This is a synthetic test contract, never a real Codex protocol observation.
const fixturePath = fileURLToPath(new URL("../test/fixtures/mock-app-server.mjs", import.meta.url));
const fixtureSha256 = "081a0645a296ed6597eaf46743c04db72d9cf5ddda8a25c5a1910484c3b42b5d";

export function selectTestFixture(mode, upstream, sha256) {
  if (mode === undefined || mode === "") return null;
  if (mode !== "workspace-mock-v1") throw new Error("ARE_CODEX_TEST_FIXTURE_UNKNOWN");
  if (realpathSync(upstream) !== realpathSync(fixturePath) || sha256 !== fixtureSha256) {
    throw new Error("ARE_CODEX_TEST_FIXTURE_IDENTITY_MISMATCH");
  }
  return {
    observation_id: "workspace-mock-v1",
    observed_binary_sha256: fixtureSha256,
    observed_surfaces: {server_requests: [
      "item/commandExecution/requestApproval",
      "item/fileChange/requestApproval",
      "item/permissions/requestApproval",
    ]},
  };
}
