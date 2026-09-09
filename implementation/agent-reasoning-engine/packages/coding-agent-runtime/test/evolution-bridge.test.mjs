import assert from "node:assert/strict";
import test from "node:test";

import {projectAgentImprovementSignals} from "../evolution-bridge.mjs";

const benchmark = {schema_version: "are.coding-agent-integrated-benchmark/v1", status: "MEASURED", event_parse: {p95_us: 50}, read_file: {p95_us: 200}, search_text: {p95_us: 100}};

test("evolution signals require explicit selection and remain recommend-only", () => {
  const withheld = projectAgentImprovementSignals({benchmark_result: benchmark});
  assert.equal(withheld.disposition, "not-selected");
  assert.equal(withheld.signals.length, 0);
  const selected = projectAgentImprovementSignals({benchmark_result: benchmark, user_selected: true});
  assert.equal(selected.ok, true);
  assert.equal(selected.signals.length, 3);
  assert.equal(selected.automatic_adoption, false);
  assert.equal(selected.authority_effect, "none");
});
