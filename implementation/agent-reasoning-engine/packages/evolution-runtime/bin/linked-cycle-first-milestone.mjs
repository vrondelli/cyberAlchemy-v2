#!/usr/bin/env node
import {readFileSync} from "node:fs";

import {runLinkedCycleFirstMilestone} from "../src/linked-cycle-first-milestone-v1.mjs";

try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (!input || input.schema_version !== "are.linked-cycle-first-milestone-request/v1" || typeof input.output_root !== "string" || typeof input.program_root !== "string" || Object.keys(input).some((key) => !["schema_version", "output_root", "program_root"].includes(key))) throw new Error("request-invalid");
  process.stdout.write(`${JSON.stringify({ok: true, value: runLinkedCycleFirstMilestone(input), authority_effect: "none"})}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ok: false, reason_codes: [`linked-cycle.${error.message}`], authority_effect: "none"})}\n`);
  process.exitCode = 2;
}
