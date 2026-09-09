async (page) => {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  await page.addInitScript(() => {
    window.__fixtureCalls = [];
    window.__TAURI__ = {core: {Channel: class {}, invoke: async (name, args) => {
      window.__fixtureCalls.push(name);
      if (name === 'chat_control_plane_status') return false;
      if (name === 'chat_connect') {
        window.__fixtureChannel = args.onEvent;
        return {connectionId: 'mobile-layout-fixture', transport: 'tauri-channel-to-are-jsonl-stdio'};
      }
      if (name === 'chat_replay') {
        window.__fixtureChannel.onmessage({type: 'session.ready', threadId: 'fixture-only', emittedAtMs: Date.now()});
        return 1;
      }
      throw new Error('Non-effectful fixture refuses ' + name);
    }}};
  });
  await page.goto('http://127.0.0.1:4199');
  await page.getByRole('button', {name: 'Control center · Off', exact: true}).click();
  const input = page.locator('#are-chat-input');
  await input.fill('Unsent mobile continuity witness');
  await input.evaluate(el => { window.__composerIdentity = el; });
  await page.evaluate(() => window.__fixtureChannel.onmessage({
    type: 'approval.requested', promptId: 'synthetic-pending-only', emittedAtMs: Date.now(),
    permissionDecision: {kind: 'permit'},
    request: {method: 'LAYOUT FIXTURE — no effect', params: {fixture: true}},
    decision: {effect_digest: 'fixture-not-authority'},
  }));
  const measurements = [];
  for (const size of [{width: 1440, height: 1000}, {width: 390, height: 844}, {width: 320, height: 568}, {width: 710, height: 844}, {width: 720, height: 844}]) {
    await page.setViewportSize(size);
    const bounds = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {top: r.top, bottom: r.bottom, height: r.height}; };
      const send = document.querySelector('.chat-composer button');
      const r = send.getBoundingClientRect();
      return {width: innerWidth, height: innerHeight, input: rect('#are-chat-input'), send: rect('.chat-composer button'), decisions: rect('.chat-decisions'), rail: rect('.app-rail'), sendUnoccluded: send.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)), overflow: document.documentElement.scrollWidth > innerWidth};
    });
    check(!bounds.overflow && bounds.sendUnoccluded, 'Overflow/occlusion at ' + size.width);
    check(bounds.input.top >= 0 && bounds.send.bottom <= (size.width <= 720 ? bounds.rail.top : size.height), 'Composer outside usable viewport');
    if (size.width <= 720) check(bounds.send.bottom <= bounds.decisions.top, 'Composer overlaps decisions');
    await page.locator('.chat-decisions').focus();
    await page.keyboard.press('Tab'); // Auto approve (never activate it).
    await page.keyboard.press('Tab'); // Decline.
    await page.keyboard.press('Tab'); // Approve once (focus only).
    const accessible = await page.getByRole('button', {name: 'Approve once', exact: true}).evaluate(el => {
      const r = el.getBoundingClientRect();
      return document.activeElement === el && el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    check(accessible, 'Approval keyboard focus hidden at ' + size.width);
    check(await input.inputValue() === 'Unsent mobile continuity witness', 'Lost draft');
    measurements.push({...bounds, approvalKeyboardAccessible: accessible});
    await page.screenshot({path: 'output/playwright/mobile-repair-final-' + size.width + '.png'});
  }
  for (const name of ['Open Ontology', 'Open Essays', 'Open Foundation', 'Expand chat', 'Compact chat', 'Control center · On', 'Control center · Off']) {
    await page.getByRole('button', {name, exact: true}).click();
  }
  check(await input.evaluate(el => el === window.__composerIdentity), 'Composer remounted');
  check(await input.inputValue() === 'Unsent mobile continuity witness', 'Draft lost across navigation');
  const calls = await page.evaluate(() => window.__fixtureCalls);
  check(calls.filter(name => name === 'chat_connect').length === 1 && !calls.includes('chat_send'), 'Connection duplicated or command sent');
  return {measurements, sameComposer: true, draftRetained: true, calls, authorityEffect: 'none', transport: 'browser-only-fixture'};
}
