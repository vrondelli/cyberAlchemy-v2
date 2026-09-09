#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import path from "node:path";

const [tool, ...args] = process.argv.slice(2);
if (!new Set(["tsc", "tsx"]).has(tool)) {
  process.stderr.write("Usage: run-toolchain.mjs tsc|tsx [arguments]\n");
  process.exit(2);
}

const checkout = path.resolve(import.meta.dirname, "../../../../../../..");
const parent = path.dirname(checkout);
const explicit = process.env.ALCHLANG_DOMAINSPEC_PACKAGE_ROOT;
const packageRoots = explicit
  ? [path.resolve(explicit)]
  : [
      path.join(parent, "projects/domainspec-v2/impl/cli"),
      path.join(parent, "domainspec-core/projects/domainspec-v2/impl/cli"),
    ].filter((candidate) => existsSync(path.join(candidate, "package.json")));

if (packageRoots.length !== 1) {
  process.stderr.write(`${packageRoots.length ? "DOMAINSPEC_PACKAGE_AMBIGUOUS" : "DOMAINSPEC_PACKAGE_MISSING"}: set ALCHLANG_DOMAINSPEC_PACKAGE_ROOT\n`);
  process.exit(1);
}

const localExecutable = path.resolve(import.meta.dirname, `../node_modules/.bin/${tool}`);
const executable = existsSync(localExecutable)
  ? localExecutable
  : path.resolve(packageRoots[0], `../node_modules/.bin/${tool}`);
if (!existsSync(executable)) {
  process.stderr.write(`ALCHLANG_TOOLCHAIN_MISSING: ${executable}\n`);
  process.exit(1);
}
const result = spawnSync(executable, args, {cwd: process.cwd(), env: process.env, stdio: "inherit"});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
