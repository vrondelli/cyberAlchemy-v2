async (page) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.reload({ waitUntil: "networkidle" });
  const waitFrames = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => { window.__CA2_PERFORMANCE_SAMPLES__ = []; });

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "Explore workspace" }).click();
    await page.getByRole("heading", { name: "Explore the system." }).waitFor();
    await page.getByRole("button", { name: "Open Foundation" }).click();
    await page.getByRole("heading", { name: "Everything connects through an explicit contract." }).waitFor();
    await waitFrames();
  }

  const search = page.getByRole("textbox", { name: "Search Foundation definitions" });
  for (const query of ["host", "guest", "effect", "evidence", "currentness"]) {
    await search.fill(query);
    await waitFrames();
  }
  await search.fill("");
  await waitFrames();

  for (const name of [
    "CAF-D2 Host Contract",
    "CAF-D4 Plug-in Distribution",
    "CAF-D8 Effect Envelope",
    "CAF-D10 Foundation Adapter",
    "CAF-D13 Host Agent Control Plane",
  ]) {
    await page.getByRole("button", { name }).click();
    await waitFrames();
  }

  return {
    samples: await page.evaluate(() => (window.__CA2_PERFORMANCE_SAMPLES__ ?? []).filter((sample) => sample.name.startsWith("foundation."))),
    consoleErrors,
    pageErrors,
    url: page.url(),
    title: await page.title(),
    userAgent: await page.evaluate(() => navigator.userAgent),
    viewport: page.viewportSize(),
    visibleDefinition: await page.getByRole("heading", { name: "Host Agent Control Plane" }).textContent(),
  };
}
