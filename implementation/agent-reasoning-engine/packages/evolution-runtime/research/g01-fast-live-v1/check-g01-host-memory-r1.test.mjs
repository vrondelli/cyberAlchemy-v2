import test from "node:test";
import assert from "node:assert/strict";
import {assessHostMemory, parseMeminfo, MIN_AVAILABLE_BYTES} from "./check-g01-host-memory-r1.mjs";

const meminfo = available => `MemTotal:       16370732 kB\nMemAvailable:   ${available} kB\nShmem:         12000000 kB\nSwapTotal:             0 kB\nSwapFree:              0 kB\n`;

test("low available memory fails before dispatch even when total RAM is large", () => {
  const result = assessHostMemory(meminfo(1_000_000));
  assert.equal(result.status, "fail-low-memory");
  assert.ok(result.shortfall_bytes > 0);
  assert.equal(result.model_calls, 0);
});

test("the threshold is provisional and still requires an actual-layout probe", () => {
  const result = assessHostMemory(meminfo(Math.ceil(MIN_AVAILABLE_BYTES / 1024)));
  assert.equal(result.status, "provisional-pass");
  assert.equal(result.shortfall_bytes, 0);
  assert.match(result.next_gate, /exact future overlay layout/);
});

test("incomplete and inconsistent kernel values fail closed", () => {
  assert.throws(() => assessHostMemory("MemAvailable: 1 kB\n"), /meminfo-incomplete/);
  assert.throws(() => assessHostMemory({...parseMeminfo(meminfo(1_000_000)),
    MemTotal: 1, MemAvailable: 2}), /invalid-values/);
});
