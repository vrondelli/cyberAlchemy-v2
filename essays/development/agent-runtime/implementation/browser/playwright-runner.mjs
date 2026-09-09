import process from "node:process";

const values = process.argv.slice(2);
const args = new Map();
for (let index = 0; index < values.length; index += 2) {
  args.set(values[index], values[index + 1]);
}

const effectId = args.get("--effect-id");
const target = args.get("--target");
const timeoutMs = Number(args.get("--timeout-ms"));
if (!effectId || !target || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
  throw new Error("BOUNDED_EFFECT_ENVELOPE_REQUIRED");
}
const url = new URL(target);
if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
  throw new Error("TARGET_URL_REJECTED");
}
if (process.env.ESSAYS_ALLOW_BROWSER_EFFECTS !== "1") {
  process.stdout.write(`${JSON.stringify({ effect_id: effectId, outcome: "denied", code: "LIVE_BROWSER_EFFECTS_DISABLED" })}\n`);
  process.exit(2);
}

const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    acceptDownloads: false,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);
  const response = await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  const title = await page.title();
  process.stdout.write(`${JSON.stringify({
    effect_id: effectId,
    outcome: "certain",
    status: response?.status() ?? null,
    origin: new URL(page.url()).origin,
    title: title.slice(0, 512),
  })}\n`);
} finally {
  await browser.close();
}
