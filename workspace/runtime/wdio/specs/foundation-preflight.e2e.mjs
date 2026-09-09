import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const artifactDirectory = process.env.WORKSPACE_WDIO_OUTPUT ?? "/tmp/cav2-foundation-tauri-smoke";

describe("Foundation live effect-free preflight through real Tauri principal evidence", () => {
  it("binds the current principal, emits identity-bound PASS evidence, and attempts no execution", async () => {
    const foundationRail = await $('button[aria-label="Open Foundation"]');
    await foundationRail.waitForClickable();
    await foundationRail.click();

    const preflight = await $(".foundation-preflight-pass");
    await preflight.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: "Foundation did not produce a live PASS from Tauri principal evidence",
    });
    await expect($(".foundation-preflight-pass strong")).toHaveText("PASS");
    await expect($(".foundation-preflight-pass p code")).toHaveText(expect.stringMatching(/^sha256:[a-f0-9]{64}$/));
    await expect(preflight).toHaveText(expect.stringContaining("current-at-generation"));
    await expect(preflight).toHaveText(expect.stringContaining("Execution attempted"));
    await expect(preflight).toHaveText(expect.stringContaining("No"));
    await expect(preflight).not.toHaveText(expect.stringContaining("unresolved"));
    await expect($(".foundation-boundary")).toHaveText(expect.stringContaining("Effectful invocation"));
    await expect($(".foundation-boundary")).toHaveText(expect.stringContaining("Not bound by this candidate"));

    mkdirSync(artifactDirectory, { recursive: true });
    const evidenceId = await $(".foundation-preflight-pass p code").getText();
    const principal = await $(".foundation-preflight-pass dl div:nth-child(1) dd code").getText();
    const sourceCurrentness = await $(".foundation-preflight-pass dl div:nth-child(2) dd").getText();
    writeFileSync(join(artifactDirectory, "foundation-live-preflight.candidate.json"), `${JSON.stringify({
      schema: "cav2.foundation-live-tauri-product-test-evidence/v1-candidate",
      subject: "cav2.workspace.foundation-inspector@0.1.0-candidate.0",
      parent_capability_ref: "CAV2-D67:workspace-capability-instance-inspection",
      host: "cyberalchemy-v2.tauri-workspace",
      principal_ref: principal,
      evidence_id: evidenceId,
      outcome: "PASS",
      source_currentness: sourceCurrentness,
      execution_attempted: false,
      effect_authorized: false,
      test_surface: "real Tauri IPC and WebKit WebView",
      claim_ceiling: "current local product-test candidate evidence only; not product approval, conformance, authority, admission, release, or deployment",
    }, null, 2)}\n`);
    await browser.saveScreenshot(join(artifactDirectory, "foundation-live-preflight.png"));
  });
});
