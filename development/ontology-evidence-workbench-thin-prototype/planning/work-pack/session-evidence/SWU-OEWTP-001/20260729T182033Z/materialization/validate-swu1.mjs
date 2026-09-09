#!/usr/bin/env node
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFile = promisify(execFileCallback);
const attemptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(attemptRoot, "../../../../../../../..");
const implementationRoot = join(
  repositoryRoot,
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench",
);
const resultPath = join(attemptRoot, "materialization", "validation-result.json");
const archivePath = join(
  implementationRoot,
  "generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/source.tar.gz",
);
const overlayRoot = join(implementationRoot, "upstream/overlay");
const upstreamRootName =
  "Understand-Anything-2cda14e89535049e49120198886bc0b82e9e630f";
const nodePath = "/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node";
const pnpmPath =
  "/home/vrondelli/.cache/node/corepack/v1/pnpm/10.6.2/bin/pnpm.cjs";
const expectedOewApp =
  "624f07050fdaf19019eb1aba585d223b17fceca12d6bf9324b3b942359d58f69";

const sha256 = (content) =>
  createHash("sha256").update(content).digest("hex");

async function run(program, args, cwd) {
  try {
    const value = await execFile(program, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
      env: {
        ...process.env,
        CI: "1",
        COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
      },
    });
    return {
      command: [program, ...args].join(" "),
      exit_code: 0,
      stdout: value.stdout.trim(),
      stderr: value.stderr.trim(),
    };
  } catch (error) {
    return {
      command: [program, ...args].join(" "),
      exit_code: Number.isInteger(error.code) ? error.code : 1,
      stdout: String(error.stdout ?? "").trim(),
      stderr: String(error.stderr ?? error.message).trim(),
    };
  }
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function packageInventory() {
  const discovered = await run(
    "rg",
    ["--files", "-g", "package.json", "-g", "!**/node_modules/**"],
    repositoryRoot,
  );
  if (discovered.exit_code !== 0) {
    throw new Error("package manifest inventory failed");
  }
  const paths = discovered.stdout.split("\n").filter(Boolean).sort();
  const rows = [];
  for (const path of paths) {
    const content = await readFile(join(repositoryRoot, path));
    rows.push(`${sha256(content)}  ${path}`);
  }
  return {
    count: paths.length,
    path_inventory_sha256: sha256(`${paths.join("\n")}\n`),
    byte_inventory_sha256: sha256(`${rows.join("\n")}\n`),
  };
}

async function tokenProbe(workroot) {
  const moduleRoot = join(workroot, "token-probe");
  await mkdir(moduleRoot);
  const sourceRoot = join(
    overlayRoot,
    "packages/dashboard/src/oew",
  );
  await copyFile(join(sourceRoot, "types.ts"), join(moduleRoot, "types.mjs"));
  const loaderSource = (
    await readFile(join(sourceRoot, "loadOewBundle.ts"), "utf8")
  ).replaceAll("./types.ts", "./types.mjs");
  await writeFile(join(moduleRoot, "loadOewBundle.mjs"), loaderSource);
  const loader = await import(
    `${pathToFileURL(join(moduleRoot, "loadOewBundle.mjs"))}?attempt=20260729T182033Z`
  );
  const fixtureRoot = join(
    implementationRoot,
    "generated/runs/SWU-OEW-004",
  );
  const documents = Object.fromEntries(
    await Promise.all(
      [
        "presentation-graph.json",
        "evidence-sidecar.json",
        "adapter-receipt.json",
      ].map(async (name) => [
        name,
        await readFile(join(fixtureRoot, name), "utf8"),
      ]),
    ),
  );
  const calls = [];
  const pageUrl = "http://127.0.0.1:4173/?oew=1&token=local-token";
  const token = new URL(pageUrl).searchParams.get("token");
  await loader.loadOewBundle({
    baseUrl: "/oew-data/",
    pageUrl,
    token,
    expectedReceiptSha256: sha256(documents["adapter-receipt.json"]),
    fetchImpl: async (input, init) => {
      const url = new URL(input);
      calls.push({ url: url.toString(), init });
      return {
        ok: true,
        status: 200,
        text: async () => documents[basename(url.pathname)],
      };
    },
    sha256Impl: async (text) => sha256(text),
  });
  let malformedCalls = 0;
  let crossOriginCalls = 0;
  const rejected = [];
  try {
    await loader.loadOewBundle({
      baseUrl: "/oew-data/",
      pageUrl: "not-a-url",
      token,
      expectedReceiptSha256: "0".repeat(64),
      fetchImpl: async () => {
        malformedCalls += 1;
        throw new Error("unexpected malformed fetch");
      },
    });
  } catch (error) {
    rejected.push(error.issue);
  }
  try {
    await loader.loadOewBundle({
      baseUrl: "https://example.com/oew-data/",
      pageUrl,
      token,
      expectedReceiptSha256: "0".repeat(64),
      fetchImpl: async () => {
        crossOriginCalls += 1;
        throw new Error("unexpected cross-origin fetch");
      },
    });
  } catch (error) {
    rejected.push(error.issue);
  }
  const success =
    calls.length === 3 &&
    calls.every(({ url, init }) => {
      const parsed = new URL(url);
      return (
        parsed.origin === "http://127.0.0.1:4173" &&
        parsed.searchParams.get("token") === "local-token" &&
        init.credentials === "omit"
      );
    }) &&
    malformedCalls === 0 &&
    crossOriginCalls === 0 &&
    rejected.includes("PAGE_ORIGIN_REQUIRED") &&
    rejected.includes("EVIDENCE_BASE_CROSS_ORIGIN");
  return {
    result: success ? "pass" : "fail",
    page_url: pageUrl,
    call_count: calls.length,
    calls,
    malformed_fetch_count: malformedCalls,
    cross_origin_fetch_count: crossOriginCalls,
    rejection_issues: rejected,
  };
}

const workroot = await mkdtemp(join(tmpdir(), "oewtp-swu1-"));
const result = {
  schema_version: "oewtp.swu-001-validation.v1",
  attempt_id: "20260729T182033Z",
  workroot,
  commands: [],
  package_manifests: { before: null, after: null, unchanged: false },
  token_probe: null,
  source_checks: {},
  cleanup: { required: true, absent_after: false },
  result: "fail",
  authority_effect: "none",
};
try {
  result.package_manifests.before = await packageInventory();
  const focused = await run(
    nodePath,
    [
      "--test",
      "test/ui-store.test.mjs",
      "test/trust-rail.test.mjs",
      "test/evidence-inspector.test.mjs",
      "test/view-parity.test.mjs",
      "test/navigation.test.mjs",
      "test/poker-tour.test.mjs",
      "test/responsive.test.mjs",
    ],
    implementationRoot,
  );
  result.commands.push(focused);
  if (focused.exit_code !== 0) throw new Error("focused node tests failed");
  const extract = await run("tar", ["-xzf", archivePath, "-C", workroot], repositoryRoot);
  result.commands.push(extract);
  if (extract.exit_code !== 0) throw new Error("archive extraction failed");
  const sourceRoot = join(workroot, upstreamRootName);
  const dashboardOew = join(
    sourceRoot,
    "understand-anything-plugin/packages/dashboard/src/oew",
  );
  await mkdir(dashboardOew, { recursive: true });
  await cp(
    join(overlayRoot, "packages/dashboard/src/oew"),
    dashboardOew,
    { recursive: true, force: true },
  );
  const patch = await run(
    "patch",
    ["-p1", "-i", join(implementationRoot, "upstream/patches/0001-oew-entrypoint.patch")],
    sourceRoot,
  );
  result.commands.push(patch);
  if (patch.exit_code !== 0) throw new Error("entry patch failed");
  const install = await run(
    nodePath,
    [
      pnpmPath,
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--store-dir",
      join(workroot, "pnpm-store"),
    ],
    sourceRoot,
  );
  result.commands.push(install);
  if (install.exit_code !== 0) throw new Error("install failed");
  const coreBuild = await run(
    nodePath,
    [pnpmPath, "--filter", "@understand-anything/core", "build"],
    sourceRoot,
  );
  result.commands.push(coreBuild);
  if (coreBuild.exit_code !== 0) throw new Error("core build failed");
  const dashboardRoot = join(
    sourceRoot,
    "understand-anything-plugin/packages/dashboard",
  );
  await writeFile(
    join(dashboardRoot, "vitest.oew.config.mjs"),
    `import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    css: true,
    include: [
      "src/oew/EvidenceInspector.test.tsx",
      "src/oew/PokerTour.test.tsx",
      "src/oew/TrustRail.test.tsx",
      "src/oew/navigation.test.tsx",
      "src/oew/responsive.test.tsx",
      "src/oew/viewParity.test.ts"
    ]
  }
});
`,
  );
  const typedTests = await run(
    nodePath,
    [
      pnpmPath,
      "--filter",
      "@understand-anything/dashboard",
      "exec",
      "vitest",
      "run",
      "--config",
      "vitest.oew.config.mjs",
      "src/oew/EvidenceInspector.test.tsx",
      "src/oew/PokerTour.test.tsx",
      "src/oew/TrustRail.test.tsx",
      "src/oew/navigation.test.tsx",
      "src/oew/responsive.test.tsx",
      "src/oew/viewParity.test.ts",
    ],
    sourceRoot,
  );
  result.commands.push(typedTests);
  if (typedTests.exit_code !== 0) throw new Error("typed tests failed");
  const typescript = await run(
    nodePath,
    [
      pnpmPath,
      "--filter",
      "@understand-anything/dashboard",
      "exec",
      "tsc",
      "-b",
      "--pretty",
      "false",
    ],
    sourceRoot,
  );
  result.commands.push(typescript);
  if (typescript.exit_code !== 0) throw new Error("typescript failed");
  const oewApp = await readFile(
    join(overlayRoot, "packages/dashboard/src/oew/OewApp.tsx"),
  );
  const sourceText = oewApp.toString("utf8");
  result.source_checks = {
    oew_app_sha256: sha256(oewApp),
    oew_app_digest_matches: sha256(oewApp) === expectedOewApp,
    exact_relative_base_present: sourceText.includes('baseUrl: "/oew-data/"'),
    location_token_present:
      sourceText.includes("new URLSearchParams(window.location.search)") &&
      (sourceText.includes('params.get("token")') ||
        sourceText.includes("params.get('token')")),
    no_new_ts_nocheck: await Promise.all(
      ["types.ts", "loadOewBundle.ts", "store.ts"].map(async (name) => ({
        path: name,
        absent: !(
          await readFile(
            join(overlayRoot, "packages/dashboard/src/oew", name),
            "utf8",
          )
        ).includes("@ts-nocheck"),
      })),
    ),
  };
  result.token_probe = await tokenProbe(workroot);
  result.package_manifests.after = await packageInventory();
  result.package_manifests.unchanged =
    JSON.stringify(result.package_manifests.before) ===
    JSON.stringify(result.package_manifests.after);
  result.result =
    result.source_checks.oew_app_digest_matches &&
    result.source_checks.exact_relative_base_present &&
    result.source_checks.location_token_present &&
    result.source_checks.no_new_ts_nocheck.every((item) => item.absent) &&
    result.token_probe.result === "pass" &&
    result.package_manifests.unchanged
      ? "pass"
      : "fail";
} catch (error) {
  result.failure = error.message;
} finally {
  await rm(workroot, { recursive: true, force: true });
  result.cleanup.absent_after = !(await exists(workroot));
  if (!result.cleanup.absent_after) result.result = "fail";
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
}
process.exitCode = result.result === "pass" ? 0 : 1;
