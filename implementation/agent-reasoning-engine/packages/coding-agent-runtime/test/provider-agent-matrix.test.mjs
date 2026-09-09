import assert from "node:assert/strict";
import test from "node:test";

import {runProviderAgentMatrix} from "../scripts/provider-agent-matrix.mjs";

test("local and native provider fixtures exercise the same governed proposal loop", async () => {
  const result = await runProviderAgentMatrix();
  assert.equal(result.status, "PASS_BOUNDED", JSON.stringify(result));
  assert.equal(result.checks.length, 4);
  assert.equal(result.checks.every((entry) => entry.repository_unchanged), true);
  assert.equal(result.live_provider_calls, 0);
});
