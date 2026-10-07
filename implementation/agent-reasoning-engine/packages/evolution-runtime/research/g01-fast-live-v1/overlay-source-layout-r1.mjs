// Opt-in source layout for G01 r15 r2 and r16 r2. Mounts one independently
// writable view over a pinned checkout. It never removes source evidence.
import {execFileSync} from "node:child_process";
import {existsSync, lstatSync, mkdirSync} from "node:fs";
import {dirname, join, resolve, sep} from "node:path";

const layouts = new Map([
  ["g01-r15-r2-single-lower-overlay-r1", {
    lowerRoot: "/dev/shm/are-g01-r15-r2-single-checkout-residency-r1",
    upperRoot: "/dev/shm/are-g01-r15-r2-overlay-uppers-r1",
    cachePrefixes: ["/tmp/are-g01-r15-source-caches-r1/", "/tmp/are-g01-r15-r2-delta-caches-r1/"],
    destinations: new Map([
      ["/tmp/are-g01-r15-r2-overlay-adapter-probe-r1/", "adapter-probe"],
      ["/tmp/are-g01-r15-r2-overlay-fourview-probe-r1/", "fourview-probe"],
      ["/tmp/are-g01-product-replication-r15-source/", "campaign"]
    ])
  }],
  ["g01-r16-r2-single-lower-overlay-r1", {
    lowerRoot: "/dev/shm/are-g01-r16-r2-single-checkout-residency-r1",
    upperRoot: "/dev/shm/are-g01-r16-r2-overlay-uppers-r1",
    cachePrefixes: ["/dev/shm/are-g01-r16-source-caches-r1/", "/dev/shm/are-g01-r16-r2-delta-caches-r1/"],
    destinations: new Map([
      ["/tmp/are-g01-r16-r2-overlay-fourview-probe-r1/", "fourview-probe"],
      ["/tmp/are-g01-r17-r16cohort-overlay-fourview-probe-r1/", "fourview-probe-r17"],
      ["/tmp/are-g01-product-replication-r16-source/", "campaign"],
      ["/tmp/are-g01-product-replication-r17-source/", "campaign-r17"]
    ])
  }]
]);
const safe = path => typeof path === "string" && path.startsWith("/") &&
  resolve(path) === path && /^\/[A-Za-z0-9_./-]+$/.test(path) &&
  !path.split("/").some(piece => piece === ".." || piece === ".");
const run = (program, args, cwd) => execFileSync(program, args, {
  ...(cwd ? {cwd} : {}), encoding: "utf8", timeout: 120000, maxBuffer: 16000000
}).trim();
const git = (cwd, args) => run("git", ["-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false", ...args], cwd);
const need = (condition, reason) => {
  if (!condition) throw Error(`g01-overlay-layout.${reason}`);
};
const noSymlinks = path => {
  let cursor = sep;
  for (const piece of path.split(sep).filter(Boolean)) {
    cursor = join(cursor, piece);
    if (existsSync(cursor)) need(!lstatSync(cursor).isSymbolicLink(), "symlink-path");
  }
};

export function validateOverlaySourceBinding({mode = "g01-r15-r2-single-lower-overlay-r1", ordinal, destination, cache, base_commit}) {
  const layout = layouts.get(mode);
  need(layout, "mode");
  need(Number.isSafeInteger(ordinal) && ordinal >= 1 && ordinal <= 24, "ordinal");
  need([destination, cache].every(safe) && /^[a-f0-9]{40}$/.test(base_commit), "arguments");
  need([...layout.destinations.keys()].some(prefix => destination.startsWith(prefix)) &&
    /\/(control|candidate)\/source\/00\/(base|work)$/.test(destination), "destination");
  need(layout.cachePrefixes.some(prefix =>
    cache.startsWith(prefix)), "cache-root");
  const lower = join(layout.lowerRoot, `task-${String(ordinal).padStart(2, "0")}`);
  const prefix = [...layout.destinations.keys()].find(value => destination.startsWith(value));
  const slot = join(layout.destinations.get(prefix), destination.slice(prefix.length));
  const upper = join(layout.upperRoot, slot, "upper"), work = join(layout.upperRoot, slot, "work");
  need([lower, upper, work].every(safe), "derived-path");
  for (const path of [destination, cache, lower, upper, work]) noSymlinks(path);
  return {mode, lower, upper, work, destination};
}

export function prepareOverlaySourceCheckout(binding) {
  const paths = validateOverlaySourceBinding(binding);
  need(existsSync(paths.lower) && existsSync(binding.cache) && !existsSync(paths.destination) &&
    !existsSync(paths.upper) && !existsSync(paths.work), "fresh-paths");
  const {base_commit} = binding;
  const expectedTree = git(binding.cache, ["rev-parse", `${base_commit}^{tree}`]);
  need(git(paths.lower, ["rev-parse", "HEAD"]) === base_commit &&
    git(paths.lower, ["rev-parse", `${base_commit}^{tree}`]) === expectedTree &&
    git(paths.lower, ["remote", "get-url", "origin"]) === binding.cache &&
    git(paths.lower, ["rev-parse", "--is-shallow-repository"]) === "true" &&
    git(paths.lower, ["status", "--porcelain"]) === "", "lower-integrity");
  mkdirSync(dirname(paths.destination), {recursive: true, mode: 0o700});
  mkdirSync(paths.destination, {mode: 0o700});
  mkdirSync(paths.upper, {recursive: true, mode: 0o700});
  mkdirSync(paths.work, {mode: 0o700});
  run("mount", ["-t", "overlay", "overlay", "-o",
    `lowerdir=${paths.lower},upperdir=${paths.upper},workdir=${paths.work}`, paths.destination]);
  const mount = run("findmnt", ["-T", paths.destination, "-n", "-o", "FSTYPE,TARGET"]);
  need(mount === `overlay ${paths.destination}`, "mount-integrity");
  need(git(paths.destination, ["rev-parse", "HEAD"]) === base_commit &&
    git(paths.destination, ["rev-parse", `${base_commit}^{tree}`]) === expectedTree &&
    git(paths.destination, ["remote", "get-url", "origin"]) === binding.cache &&
    git(paths.destination, ["status", "--porcelain"]) === "", "view-integrity");
  return {...paths,
    head: base_commit, tree: expectedTree, mount};
}
