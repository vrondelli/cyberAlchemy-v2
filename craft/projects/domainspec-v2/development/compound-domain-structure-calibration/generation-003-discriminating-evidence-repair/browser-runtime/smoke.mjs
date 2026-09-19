import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chromium } from "playwright";
import packageMetadata from "@playwright/test/package.json" with { type: "json" };

const runtimeRoot = dirname(fileURLToPath(import.meta.url));
const outputRoot = resolve(runtimeRoot, "../runs/SWU-CDSC3-002");
const runName = process.argv[2] ?? "smoke-run-1";
const screenshotPath = resolve(outputRoot, `${runName}.png`);
const outputPath = resolve(outputRoot, `${runName}.json`);
mkdirSync(outputRoot, { recursive: true });

const executablePath = chromium.executablePath();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve(runtimeRoot, "smoke-page.html")).href);
  const structuredState = await page.locator("[data-structured-state]").evaluate((element) => ({
    ...JSON.parse(element.getAttribute("data-structured-state")),
    text: element.textContent,
  }));
  const runtimeRootCount = await page.locator("[data-runtime-root='cdsc3-smoke']").count();
  await page.screenshot({ path: screenshotPath, animations: "disabled" });
  const screenshotSha256 = digest(readFileSync(screenshotPath));
  const result = {
    schema_version: "cdsc.browser-smoke.v1",
    runtime_source: "pinned-isolated-install",
    playwright_version: packageMetadata.version,
    browser_name: "chromium",
    executable_path: executablePath,
    page_title: await page.title(),
    runtime_root_count: runtimeRootCount,
    structured_state: structuredState,
    screenshot_sha256: screenshotSha256,
  };
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally {
  await browser.close();
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
