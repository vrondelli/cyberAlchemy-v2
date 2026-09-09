import { createHash } from "node:crypto";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDomainSource, compileCarrier } from "../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/index.ts";

const root = dirname(fileURLToPath(import.meta.url));
const compilerRoot = resolve(root, "../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation");
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const bytes = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const source = readFileSync(resolve(root, "recent-context.alch"), "utf8");
const parsed = parseDomainSource(source);
const first = compileCarrier(parsed.carrier);
const second = compileCarrier(parseDomainSource(source).carrier);
if (bytes(first) !== bytes(second)) throw new Error("non-deterministic AlchLang compilation");
const compilerSources = Object.fromEntries(readdirSync(resolve(compilerRoot, "src"))
  .filter(name => name.endsWith(".ts")).sort().map(name => ["src/" + name, hash(readFileSync(resolve(compilerRoot, "src", name)))]));
const artifacts: Record<string, string> = {
  ...first.files,
  "carrier.json": bytes(parsed.carrier),
  "compilation-plan.json": bytes(first.plan),
};
artifacts["build-receipt.json"] = bytes({
  schema_version: "cav2-recent-context-alchlang-build/v1", status: "candidate",
  source_sha256: hash(source), source_digest: first.source_digest, plan_digest: first.plan_digest,
  compiler_package: JSON.parse(readFileSync(resolve(compilerRoot, "package.json"), "utf8")).version,
  compiler_sources: compilerSources, compiler_sources_digest: hash(bytes(compilerSources)),
  builder_sha256: hash(readFileSync(fileURLToPath(import.meta.url))),
  deterministic_runs: 2,
  files: Object.fromEntries(Object.entries(artifacts).map(([name, content]) => [name, hash(content)])),
  authority_effect: "none", implementation_generated: false,
  claim_ceiling: "Compiled AlchLang model and TypeScript contracts only. Git query is a separately authored, tested Python adapter.",
});
if (process.argv.includes("--emit-json")) {
  process.stdout.write(bytes(artifacts));
} else {
  mkdirSync(resolve(root, "generated"), { recursive: true });
  for (const [name, content] of Object.entries(artifacts)) writeFileSync(resolve(root, "generated", name), content);
  process.stdout.write(`built=${Object.keys(artifacts).length}\n`);
}
