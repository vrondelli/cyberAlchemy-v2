import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {verifyHostMethodCatalog} from "../src/host-catalog-verification.mjs";

const catalogFixtureBinary = process.env.ARE_TEST_CODEX_BINARY ?? "/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex";

test("configured command prefix verifies all four pinned host schemas", {skip: !existsSync(catalogFixtureBinary) && "Pinned Codex schema fixture unavailable"}, () => {
  const directory = mkdtempSync(join(tmpdir(), "are-catalog-prefix-"));
  const shim = join(directory, "host-shim.mjs");
  const argumentLog = join(directory, "arguments.jsonl");
  writeFileSync(shim, `import {execFileSync} from "node:child_process";
import {appendFileSync} from "node:fs";
appendFileSync(${JSON.stringify(argumentLog)}, JSON.stringify(process.argv.slice(2)) + "\\n");
process.stdout.write(execFileSync(${JSON.stringify(catalogFixtureBinary)}, process.argv.slice(2), {encoding: "utf8"}));
`);
  try {
    const result = verifyHostMethodCatalog({command: process.execPath, prefix_args: [shim]});
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.server_notification_methods, 82);
    assert.equal(result.server_request_methods, 11);
    assert.deepEqual(result.schema_fields, {
      thread_start_dynamic_tools_declared: true,
      thread_resume_dynamic_tools_declared: false,
    });
    const calls = readFileSync(argumentLog, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    assert.deepEqual(calls[0], ["--version"]);
    assert.deepEqual(calls[1].slice(0, 3), ["app-server", "generate-json-schema", "--experimental"]);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("same-version host with changed schemas fails closed", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-catalog-drift-"));
  const shim = join(directory, "host-shim.mjs");
  writeFileSync(shim, `import {writeFileSync} from "node:fs";
if (process.argv.includes("--version")) process.stdout.write("codex-cli 0.155.0-alpha.16.4\\n");
else if (process.argv.includes("generate-json-schema")) {
  const output = process.argv[process.argv.indexOf("--out") + 1];
  writeFileSync(output + "/ClientRequest.json", "{}\\n");
}
`);
  try {
    const result = verifyHostMethodCatalog({command: process.execPath, prefix_args: [shim]});
    assert.equal(result.ok, false);
    assert.equal(result.observed_codex_version, "codex-cli 0.155.0-alpha.16.4");
    assert.equal(result.reason, "host.method-catalog-schema-drift:ClientRequest.json");
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("version drift stops before schema generation", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-catalog-version-"));
  const shim = join(directory, "host-shim.mjs");
  const generationMarker = join(directory, "generated");
  writeFileSync(shim, `import {writeFileSync} from "node:fs";
if (process.argv.includes("--version")) process.stdout.write("codex-cli 0.0.0\\n");
else writeFileSync(${JSON.stringify(generationMarker)}, "unexpected");
`);
  try {
    const result = verifyHostMethodCatalog({command: process.execPath, prefix_args: [shim]});
    assert.equal(result.ok, false);
    assert.equal(result.reason, "host.method-catalog-version-drift");
    assert.equal(existsSync(generationMarker), false);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
