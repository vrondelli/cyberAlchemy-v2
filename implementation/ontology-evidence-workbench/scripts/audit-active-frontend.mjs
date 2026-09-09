#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "generated/runs/WP-SOEW-001/active-frontend-cutover.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function exists(path) { try { return (await stat(path)).isFile(); } catch { return false; } }
async function filesUnder(path) { const results = []; for (const entry of await readdir(path, { withFileTypes: true })) { const target = join(path, entry.name); if (entry.isDirectory()) results.push(...await filesUnder(target)); else if (entry.isFile()) results.push(target); } return results; }

const overlayRows = [
  ["components/KnowledgeFocusPortals.tsx", "src/web/components/GroupedPortals.tsx"], ["knowledgeFocusScene.ts", "src/web/scene/focusScene.ts"],
  ["oew/CommandPalette.tsx", "src/web/components/CommandPalette.tsx"], ["oew/EvidenceFilters.tsx", "src/web/components/EvidenceFilters.tsx"],
  ["oew/EvidenceInspector.test.tsx", "src/web/components/EvidenceInspector.test.tsx"], ["oew/EvidenceInspector.tsx", "src/web/components/EvidenceInspector.tsx"],
  ["oew/EvidenceOutline.tsx", "src/web/components/EvidenceOutline.tsx"], ["oew/EvidenceTable.tsx", "src/web/components/EvidenceTable.tsx"],
  ["oew/EvidenceWorkspace.tsx", "src/web/components/EvidenceWorkspace.tsx"], ["oew/OewApp.tsx", "src/web/app/OewApp.tsx"],
  ["oew/PokerTour.test.tsx", null], ["oew/PokerTour.tsx", "src/web/components/GuidedTour.tsx"],
  ["oew/TrustRail.test.tsx", "src/web/components/TrustRail.test.tsx"], ["oew/TrustRail.tsx", "src/web/components/TrustRail.tsx"],
  ["oew/inspector.css", "src/web/styles/inspector.css"], ["oew/keyboard.ts", "src/web/state/keyboard.ts"],
  ["oew/loadOewBundle.ts", "src/web/data/loadDataset.ts"], ["oew/navigation.test.tsx", "src/web/state/deepLinks.test.ts"],
  ["oew/oew.css", "src/web/styles/app-shell.css"], ["oew/relationEncoding.ts", "src/web/presentation/relationEncoding.ts"],
  ["oew/relationPresentation.test.ts", "src/web/presentation/relationPresentation.test.ts"], ["oew/relationPresentation.ts", "src/web/presentation/relationPresentation.ts"],
  ["oew/relationViewModels.ts", "src/web/presentation/relationViewModels.ts"], ["oew/responsive.test.tsx", "scripts/validate-standalone-oew.mjs"],
  ["oew/scene/pathQuery.ts", "src/web/scene/pathQuery.ts"], ["oew/scene/portalQuery.ts", "src/web/scene/portalQuery.ts"],
  ["oew/scene/relationGeometry.ts", "src/web/scene/relationGeometry.ts"], ["oew/scene/relationReference.ts", "src/web/contracts/relation.ts"],
  ["oew/scene/sceneMigration.ts", "src/web/state/deepLinks.ts"], ["oew/scene/sceneQuery.ts", "src/web/scene/sceneQuery.ts"],
  ["oew/scene/sourceGraph.ts", "src/web/scene/sourceGraph.ts"], ["oew/scene/viewPack.ts", "src/web/scene/viewPack.ts"],
  ["oew/store.ts", "src/web/state/workbenchReducer.ts"], ["oew/tours/poker-o13.json", null],
  ["oew/trust.css", "src/web/styles/trust.css"], ["oew/types.ts", "src/web/contracts/bundle.ts"],
  ["oew/ui-api/compileInventory.ts", "src/web/profile/compileUiProfile.ts"], ["oew/ui-api/inventory.v0.1.json", null],
  ["oew/ui-api/profile.v0.1.json", "src/web/profile/ui-profile.v1.json"], ["oew/ui-api/validateInventory.ts", "src/web/profile/validateUiProfile.ts"],
  ["oew/viewParity.test.ts", "src/web/presentation/viewParity.test.ts"], ["oew/viewParity.ts", "src/web/presentation/viewParity.ts"],
];

const overlayRoot = join(root, "upstream/overlay/packages/dashboard/src");
const migrationRows = [];
for (const [source, replacement] of overlayRows) {
  const sourceExists = await exists(join(overlayRoot, source)); const replacementExists = replacement ? await exists(join(root, replacement)) : true;
  migrationRows.push({ family: "overlay", source, disposition: replacement ? "replaced-owned" : "retained-historical", replacement, source_exists: sourceExists, replacement_exists: replacementExists, result: sourceExists && replacementExists ? "pass" : "fail" });
}
for (const name of ["0001-oew-entrypoint.patch", "0002-knowledge-focus-scene.patch", "0003-oew-semantic-navigation.patch", "0004-oew-semantic-navigation-keyboard.patch", "0005-oew-navigation-jsdom.patch"]) migrationRows.push({ family: "patch", source: `upstream/patches/${name}`, disposition: "retained-historical", replacement: "direct standalone frontend", source_exists: await exists(join(root, "upstream/patches", name)), replacement_exists: true, result: await exists(join(root, "upstream/patches", name)) ? "pass" : "fail" });
for (const name of ["prepare-upstream.mjs", "materialize-l1-workroot.mjs", "verify-l1-toolchain.mjs", "build-thin-prototype.mjs"]) migrationRows.push({ family: "materializer", source: `scripts/${name}`, disposition: "retained-historical-command-only", replacement: "root pnpm and Vite commands", source_exists: await exists(join(root, "scripts", name)), replacement_exists: true, result: await exists(join(root, "scripts", name)) ? "pass" : "fail" });

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const activeScriptNames = ["dev", "build", "preview", "typecheck", "test", "test:web", "test:standalone-browser", "audit:active-frontend"];
const activeScripts = Object.fromEntries(activeScriptNames.map((name) => [name, packageJson.scripts[name]]));
const activeFiles = [join(root, "index.html"), join(root, "vite.config.ts"), join(root, "vitest.config.ts"), join(root, "tsconfig.app.json"), ...await filesUnder(join(root, "src/web")), ...(await filesUnder(join(root, "dist"))).filter((path) => !path.includes(`${join("dist", "datasets", "body-war")}`))];
const forbidden = /@understand-anything|understand-anything|upstream\/overlay|materialize-l1|build-thin-prototype|prepare-upstream|serve-native-viewer/i;
const findings = [];
for (const [name, command] of Object.entries(activeScripts)) if (!command || forbidden.test(command)) findings.push({ path: `package.json#scripts.${name}`, issue: "active-script-legacy-reference", excerpt: command ?? "missing" });
for (const path of activeFiles) { const bytes = await readFile(path); if (bytes.includes(0)) continue; const text = bytes.toString("utf8"); const match = text.match(forbidden); if (match) findings.push({ path: relative(root, path), issue: "active-file-legacy-reference", excerpt: match[0] }); if (path.includes(`${join("src", "web")}`) && /from\s+["'][^"']+\.mjs["']/.test(text)) findings.push({ path: relative(root, path), issue: "raw-mjs-source-import" }); }

const historicalFiles = (await filesUnder(join(root, "upstream"))).concat(await filesUnder(join(root, "generated"))).filter((path) => path.endsWith(".lock.json") || path.endsWith(".patch") || /receipt.*\.json$/i.test(path)).map((path) => relative(root, path)).sort();
let historicalLines = "";
for (const path of historicalFiles) historicalLines += `${sha256(await readFile(join(root, path)))}  ${path}\n`;
const historicalAggregate = sha256(historicalLines);
const expectedHistoricalAggregate = "d744c8246b8dbf291ea613f0bc2f1bad866b5404c209305ee9108f2cb1c15855";
const result = findings.length === 0 && migrationRows.length === 51 && migrationRows.every((row) => row.result === "pass") && historicalAggregate === expectedHistoricalAggregate ? "pass" : "fail";
const receipt = { schema_version: "oew.active-frontend-cutover.v1", work_pack_id: "WP-SOEW-001", result, created_at: new Date().toISOString(), authority_effect: "none", active_entry: { package_root: ".", index: "index.html", source: "src/web/main.tsx", active_scripts: activeScripts }, active_scan: { scanned_files: activeFiles.length, findings, declared_exclusions: [{ scope: "package.json historical:* and test:legacy scripts", reason: "explicitly unreachable historical verification commands; normal scripts are scanned separately" }, { scope: "dist/datasets/body-war exact evidence bytes", reason: "immutable admitted provenance artifacts; validated by exact digest in browser acceptance" }] }, migration: { reconciled: migrationRows.filter((row) => row.result === "pass").length, denominator: 51, rows: migrationRows }, historical_evidence: { file_count: historicalFiles.length, aggregate_sha256: historicalAggregate, expected_sha256: expectedHistoricalAggregate, unchanged: historicalAggregate === expectedHistoricalAggregate }, normal_frontend_requires_upstream_workspace: false, evidence_ceiling: "Candidate-local active frontend cutover only; historical evidence remains and no deployment, release, or production claim is made." };
await mkdir(dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`); console.log(JSON.stringify({ output, result, findings: findings.length, migration: `${receipt.migration.reconciled}/51`, historical_unchanged: receipt.historical_evidence.unchanged }, null, 2)); if (result !== "pass") process.exitCode = 1;
