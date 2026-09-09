import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

const runtimeRoot = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(readFileSync(join(runtimeRoot, "package.json"), "utf8"));
const allowlist = new Set([
  "@milkdown/core",
  "@milkdown/plugin-history",
  "@milkdown/plugin-listener",
  "@milkdown/preset-commonmark",
]);
const denylist = ["@milkdown/kit", "@milkdown/react", "@milkdown/crepe"];

const directMilkdown = Object.keys(packageJson.dependencies).filter((name) => name.startsWith("@milkdown/"));
if (directMilkdown.some((name) => !allowlist.has(name)) || directMilkdown.length !== allowlist.size) {
  throw new Error(`direct Milkdown surface drift: ${directMilkdown.join(", ")}`);
}
for (const name of allowlist) {
  if (packageJson.dependencies[name] !== "7.21.3") throw new Error(`${name} must be pinned to 7.21.3`);
}

const production = new Map();
const resolveDependency = (fromRoot, dependency) => {
  let cursor = fromRoot;
  while (cursor.startsWith(runtimeRoot)) {
    if (basename(cursor) === "node_modules") {
      const candidate = join(cursor, dependency);
      if (existsSync(candidate)) return realpathSync(candidate);
    }
    const nested = join(cursor, "node_modules", dependency);
    if (existsSync(nested)) return realpathSync(nested);
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return null;
};
const visitedRoots = new Set();
const visit = (packageRoot) => {
  const realRoot = realpathSync(packageRoot);
  if (visitedRoots.has(realRoot)) return;
  visitedRoots.add(realRoot);
  const manifest = JSON.parse(readFileSync(join(realRoot, "package.json"), "utf8"));
  production.set(`${manifest.name}@${manifest.version}`, {
    name: manifest.name,
    version: manifest.version,
    license: manifest.license ?? "UNKNOWN",
  });
  const dependencyNames = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ]);
  for (const dependency of dependencyNames) {
    const dependencyRoot = resolveDependency(realRoot, dependency);
    if (dependencyRoot) visit(dependencyRoot);
  }
};
for (const dependency of Object.keys(packageJson.dependencies)) {
  visit(realpathSync(join(runtimeRoot, "node_modules", dependency)));
}
for (const denied of denylist) {
  if ([...production.values()].some((entry) => entry.name === denied)) throw new Error(`denied package in production tree: ${denied}`);
}

const inventory = [...production.values()]
  .sort((left, right) => left.name.localeCompare(right.name) || left.version.localeCompare(right.version));
const prohibitedLicenses = /(?:^|\W)(?:AGPL|GPL|SSPL)(?:\W|$)/i;
const licenseProblems = inventory.filter((entry) => entry.license === "UNKNOWN" || prohibitedLicenses.test(String(entry.license)));
if (licenseProblems.length) throw new Error(`production license closure failed: ${JSON.stringify(licenseProblems)}`);

const lock = readFileSync(join(runtimeRoot, "pnpm-lock.yaml"), "utf8");
for (const denied of denylist) {
  if (lock.includes(denied)) throw new Error(`denied package in lockfile: ${denied}`);
}
const distFiles = (() => {
  try { return readdirSync(join(runtimeRoot, "dist"), { recursive: true, encoding: "utf8" }); }
  catch { return []; }
})();
for (const path of distFiles.filter((item) => /\.(?:js|css|map)$/.test(item))) {
  const bytes = readFileSync(join(runtimeRoot, "dist", path), "utf8");
  for (const marker of ["@milkdown/kit", "@milkdown/react", "@milkdown/crepe", "plugin-upload", "plugin-slash", "plugin-collaborative"])
    if (bytes.includes(marker)) throw new Error(`denied capability marker ${marker} in dist/${relative(runtimeRoot, path)}`);
}

console.log(JSON.stringify({
  status: "PASS",
  projectLicense: packageJson.license,
  directMilkdown: [...allowlist],
  deniedAbsent: denylist,
  productionPackageCount: inventory.length,
  licenses: [...new Set(inventory.map((entry) => entry.license))].sort(),
  inventory,
}, null, 2));
