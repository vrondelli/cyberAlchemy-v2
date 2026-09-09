import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";

const runtimeRoot = resolve(import.meta.dirname, "..");
const tempRoot = mkdtempSync(join(tmpdir(), "essays-build-determinism-"));
const outputs = [join(tempRoot, "run-1"), join(tempRoot, "run-2")];
for (const output of outputs) {
  execFileSync("pnpm", ["exec", "vite", "build", "--outDir", output, "--emptyOutDir"], {
    cwd: runtimeRoot,
    stdio: "pipe",
  });
}

const digestTree = (root) => readdirSync(root, { recursive: true, encoding: "utf8" })
  .filter((path) => !path.endsWith(".map"))
  .sort()
  .map((path) => {
    let bytes;
    try { bytes = readFileSync(join(root, path)); }
    catch { return null; }
    return `${relative(root, join(root, path))}:${createHash("sha256").update(bytes).digest("hex")}`;
  })
  .filter(Boolean);

const [first, second] = outputs.map(digestTree);
if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error(`build output is not deterministic: ${basename(outputs[0])} differs from ${basename(outputs[1])}`);
}
console.log(JSON.stringify({ status: "PASS", comparedRuns: 2, files: first }, null, 2));
