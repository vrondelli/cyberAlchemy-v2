// Generation-only output budget with no legacy live/evaluator dependency.
import assert from "node:assert/strict";
import {lstatSync, readdirSync} from "node:fs";
import {join} from "node:path";

export const MAX_OUTPUT_BYTES = 32 * 1024 ** 2;
export const FINAL_RESERVE_BYTES = 8 * 1024 ** 2;

export function outputFootprint(directory) {
  let total = 0, entries = 0;
  const visit = (path) => {
    assert.ok(++entries <= 4096, "output entry ceiling"); const stat = lstatSync(path); assert.ok(!stat.isSymbolicLink(), "output symlink forbidden"); assert.ok(stat.isFile() || stat.isDirectory(), "output file kind");
    total += Math.max(stat.size, stat.blocks * 512); assert.ok(Number.isSafeInteger(total), "output byte overflow"); if (stat.isDirectory()) for (const name of readdirSync(path)) visit(join(path, name));
  };
  visit(directory); return total;
}
